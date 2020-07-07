const express = require('express')
const cors = require('cors')
const session = require('express-session')
const cookie = require('cookie')
const {v4} = require('uuid')
const immer = require('immer')
const Pair = require('sanctuary-pair')
const {
  STREETS,
  deal,
  newDeck,
  computeRoundWinners,
  bet,
} = require('@heruka_urgyen/poker-solver')

/************************* app *************************/

const app = express()
const port = 3001

const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.json())
app.use(cors({credentials: true, origin: 'http://localhost:3000'}))

const MemoryStore = session.MemoryStore
const store = new MemoryStore()
const s = session({
  secret: v4(),
  resave: false,
  saveUninitialized: true,
  store,
  cookie: {secure: false},
})
app.use(s)
io.use((socket, next) => {s(socket.request, socket.request.res || {}, next)})

/************************** util **************************/

const safe = def => f => {
  try {
    const res = f()
    return res != null? res : def
  } catch (e) {
    return def
  }
}

/******************** state management ********************/

const {produce} = immer
// _state is a private variable not to be directly accessed or mutated
let _state = {}
const update = f => _state = produce(_state, d => {f(d)})
const select = f => produce(_state, f)

/********************* default state *********************/

const defaultUser = {type: 'guest'}
const defaultBlinds = [1, 2]

update(s => {
  s._local = {endRound: 0, nextRound: 0, postBlinds: 0, dealCards: 0}
  s.sessions = {}
  s.players = {}
  s.table = {
    id: 1,
    maxPlayers: 2,
    players: [],
  }
  s.round = {
    id: 1,
    players: [],
    status: 'FINISHED',
    blinds: defaultBlinds,
    communityCards: [],
    winners: [],
  }
  s.streetState = {}
})

/*********************** functions ***********************/

function hideCards(players, userId) {
  return Object.keys(players).map(playerId => {
    if (playerId !== userId) {
      return {
        [playerId]: {
          ...players[playerId],
          cards: [{type: 'hidden'}, {type: 'hidden'}],
        }
      }
    }

    return {[playerId]: players[playerId]}
  })
  .reduce((acc, x) => ({...acc, ...x}), {})
}

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)

  socket.on('NEXT_ROUND', _ => {
    console.log('received NEXT_ROUND from', socket.id)
    update(s => s._local.nextRound = s._local.nextRound + 1)
    const {nextRound} = select(s => s._local)
    const {players} = select(s => s.table)

    if (nextRound === Object.keys(io.sockets.sockets).length) {
      update(s => {
        s._local.nextRound = 0

        s.round.id = s.round.id + 1
        s.round.status = 'IN_PROGRESS'
        s.round.street = STREETS[0]
        s.round.players = s.table.players
        s.round.button =
          (s.round.button != null? s.round.button + 1 : 0) % s.round.players.length
        s.round.whoseTurn = s.round.players[s.round.button]
        s.round.pot = 0
        s.round.bets = []
        s.round.whoActed = []
        s.round.winners = []
      })

      const round = select(s => s.round)
      io.sockets.emit('NEXT_ROUND_SUCCESS', {payload: {round}})
    }
  })

  socket.on('POST_BLINDS', _ => {
    console.log('received POST_BLINDS from', socket.id)
    update(s => s._local.postBlinds = s._local.postBlinds + 1)
    const {postBlinds} = select(s => s._local)

    if (postBlinds === Object.keys(io.sockets.sockets).length) {
      update(s => {
        s._local.postBlinds = 0

        const {round: {players, button, blinds}} = s
        const bets = [
          {playerId: players[button], amount: blinds[0]},
          {playerId: players[(button + 1) % players.length], amount: blinds[1]},
        ]

        bets.forEach(bet => {
          s.players[bet.playerId].stack = s.players[bet.playerId].stack - bet.amount})
        s.round.bets = bets
      })

      const round = select(s => s.round)
      const players = select(s => s.players)

      io.sockets.emit('POST_BLINDS_SUCCESS', {payload: {round, players}})
    }
  })

  socket.on('DEAL_CARDS', _ => {
    console.log('received DEAL_CARDS from', socket.id)
    update(s => s._local.dealCards = s._local.dealCards + 1)
    const {dealCards} = select(s => s._local)

    if (dealCards === Object.keys(io.sockets.sockets).length) {
      const street = select(s => s.round.street)
      if (street === 'PREFLOP') {
        update(s => {
          s._local.dealCards = 0

          s.streetState = deal(street)({
            id: s.round.id,
            table: {
              id: s.table.id,
              maxPlayers: s.table.maxPlayers,
              players: s.round.players.map(id => ({id})),
              button: s.round.button},
            deck: newDeck('shuffle'),
            communityCards: [],
            cards: s.round.players.map((id, i) => Pair(id)([])),
            winners: [],
          })

          s.streetState.cards.forEach(c => {
            const playerId = Pair.fst(c)
            s.players[playerId].cards = Pair.snd(c)
          })
        })

        const players = select(s => s.players)
        Object.keys(io.sockets.sockets).forEach(id => {
          const socket = io.sockets.sockets[id]

          store.get(socket.request.session.id, (err, session = {}) => {
            if (session.user) {
              const userId = session.user.id

              socket.emit(
                'DEAL_CARDS_SUCCESS',
                {payload: {players: hideCards(players, userId)}})
            }
          })
        })
      }
    }
  })

  socket.on('FOLD', ({payload}) => {
    console.log('received FOLD from', socket.id)

    const playerId = payload.id

    update(s => {
      s.round.pot = s.round.pot +
        safe(0)(() => s.round.bets.filter(bet => bet.playerId === playerId)[0].amount)

      s.round.bets = s.round.bets.filter(bet => bet.playerId !== playerId)
      s.round.players = s.round.players.filter(id => id !== playerId)
      s.round.communityCards = []

      s.players[playerId].cards = []
    })

    const round = select(s => s.round)
    const players = select(s => s.players)

    io.sockets.emit('FOLD_SUCCESS', {payload: {round, players: hideCards(players, playerId)}})
  })

  socket.on('END_ROUND', ({payload}) => {
    console.log('received END_ROUND from', socket.id)

    const {winners} = payload
    update(s => s._local.endRound = s._local.endRound + 1)
    const {endRound} = select(s => s._local)

    if (endRound === Object.keys(io.sockets.sockets).length) {
      update(s => {
        s._local.endRound = 0

        winners.forEach(w => {
          s.players[w.playerId].cards = []
          s.players[w.playerId].stack = s.players[w.playerId].stack
            + (s.round.pots.pots[0].amount / winners.length)
        })

        s.players = Object.keys(s.players)
          .filter(id => s.players[id].stack > 0)
          .reduce((acc, id) => {
            return {...acc, [id]: s.players[id]}
          }, {})

        s.table.players = Object.keys(s.players)

        s.round.pots = {}
        s.round.bets = []
        s.round.communityCards = []
        s.round.status = 'FINISHED'
      })

      Object.keys(io.sockets.sockets).forEach(id => {
        const socket = io.sockets.sockets[id]

        store.get(socket.request.session.id, (err, session = {}) => {
          const id = safe('')(() => session.user.id)
          const players = select(s => s.players)
          const user = players[id] || defaultUser

          const round = select(s => s.round)
          const table = select(s => s.table)

          socket.emit('END_ROUND_SUCCESS', {payload: {table, round, players, user,}})
        })
      })
    }

  })

  socket.on('BET', ({payload}) => {
    console.log('received BET from', socket.id)

    const {player, amount} = payload

    const round = select(s => s.round)
    const players = select(s => s.players)
    const initialState = {
      ...round,
      players: round.players.map(id => ({...players[id], playerId: id})),
    }

    const {result, state} = bet({playerId: player.id, amount})(initialState)
    update(s => {
      const {players} = result
      const {nextPlayer} = state

      s.round = {
        ...state,
        players: players.map(p => p.playerId),
        whoseTurn: players[nextPlayer].playerId,
      }
      s.players = players.reduce((acc, p) => {
        const {playerId, amount} = safe({})(() => result.pots.return[0])
        if (playerId === p.id) {
          return {
            ...acc,
            [p.id]: {
              ...p,
              stack: p.stack + amount,
            },
          }
        }

        return {
          ...acc,
          [p.id]: p,
        }
      }, {})

      s.round.pots.return = []
      console.dir(s.round.pots, {depth: null, colors: true})

      const someAllIn = s.round.players.filter(id => s.players[id].stack === 0).length > 0
      if (state.balanced && someAllIn) {
        s.round.status = 'ALL_IN'
      }

      if (result.bets.length === 0) {
        if (s.round.street === 'RIVER') {
          s.streetState = computeRoundWinners(s.streetState)
          s.round.winners = s.streetState.winners
          s.round.status = 'SHOWDOWN'
        } else {
          s.round.street = STREETS[(STREETS.indexOf(s.round.street) + 1)]
          s.round.whoActed = []
          s.streetState = deal(s.round.street)(s.streetState)
          s.round.communityCards = s.streetState.communityCards
        }
      }

      if (s.round.winners.length > 0) {
        io.sockets.emit('SHOWDOWN_SUCCESS', {payload: {round: s.round}})
      } else {
        io.sockets.emit(
          'BET_SUCCESS',
          {payload: {
            round: s.round,
            updatedStack: {playerId: player.id, stack: s.players[player.id].stack}}})
      }
    })
  })
})

app.get('/api/v1/table/initialize/', (req, res) => {
  store.get(req.session.id, (err, session = {}) => {
    if (err) {console.error(err)}
    const user = select(s => {
      const id = safe('')(() => session.user.id)
      return s.players[id] || defaultUser})
    const players = select(s => s.players)
    const table = select(s => s.table)
    const round = select(s => s.round)

    res.send({payload: {user, players: hideCards(players, user.id), table, round}})
  })

})

app.post('/api/v1/table/sitUser/', (req, res) => {
  const {players, maxPlayers} = select(s => s.table)
  if (players.length < maxPlayers) {

    const user = {type: 'player', id: v4(), stack: 100, ...req.body}
    const s = req.session

    store.set(s.id, {...s, user}, err => err && console.error(err))
    update(s => {
      s.players[user.id] = user
      s.table.players.push(user.id)})

    const table = select(s => s.table)
    const players = select(s => s.players)

    io.sockets.emit('UPDATE_TABLE_PLAYERS', {payload: {table, players}})
    res.send({payload: {user}})
  } else {
    res.statusMessage = 'This table is full'
    res.status(409).end()
  }
})


server.listen(port, () => console.log(`poker room app listening at http://localhost:${port}`))
