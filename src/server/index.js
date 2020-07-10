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
  postBlinds,
  bet,
  fold,
  newRound,
  endRound,
  newGame,
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

update(s => {
  s.table = {
    id: 1,
    maxPlayers: 2,
    players: [],
  }
  s.round = {
    id: 0,
    status: 'FINISHED',
  }
})

/*********************** functions ***********************/

function showCards(cards, players) {
  return players.map(p => {
    const cs = Pair.snd(cards.find(c => Pair.fst(c) === p.id))
    return {
      ...p,
      cards: cs,
    }
  })
}

function hideCards(cards, players, userId) {
  const cs = Pair.snd(cards.find(c => Pair.fst(c) === userId))

  return players.map(p => {
    if (p.id !== userId) {
      return {
        ...p,
        cards: [{type: 'hidden'}, {type: 'hidden'}],
      }
    }

    return {
      ...p,
      cards: cs,
    }
  })
}

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)

  socket.on('NEXT_ROUND', _ => {
    console.log('received NEXT_ROUND from', socket.id)

    update(s => {
      if (s.round.status === 'FINISHED') {
        s.round = newRound
          (s.round.id + 1)
          (s.table)
          (s.round.button? s.round.button + 1 : 0)
          (Pair(1)(2))
      }

      socket.send('NEXT_ROUND_SUCCESS', {payload: {round: s.round}})
    })
  })

  socket.on('POST_BLINDS', _ => {
    console.log('received POST_BLINDS from', socket.id)

    update(s => {
      if (s.round.bets.length === 0) {
        s.run = newGame({table: s.table, round: s.round})

        const {table, round} = s.run(postBlinds)

        s.table = table
        s.round = round
      }

      const round = s.round
      const players = s.table.players
      socket.send('POST_BLINDS_SUCCESS', {payload: {round, players}})
    })
  })

  socket.on('DEAL_CARDS', _ => {
    console.log('received DEAL_CARDS from', socket.id)

    update(s => {
      const {street, communityCards, cards} = s.round
      const holeCards = cards.find(c => Pair.snd(c).length > 0)
      const canDeal = !holeCards
        || street === STREETS[1] && communityCards.length < 3
        || street === STREETS[2] && communityCards.length < 4
        || street === STREETS[3] && communityCards.length < 5

      if (canDeal) {
        const {table, round} = s.run(s => ({...s, round: deal(s.round)}))

        s.table = table
        s.round = round
      }
    })

    const round = select(s => s.round)
    const players = select(s => s.table.players)

    store.get(socket.request.session.id, (err, session = {}) => {
      if (session.user) {
        const userId = session.user.id
        const payload = round.street !== STREETS[0]? {round} :
          {round, players: hideCards(round.cards, players, userId)}

        socket.send('DEAL_CARDS_SUCCESS', {payload})
      }
    })
  })

  socket.on('FOLD', ({payload}) => {
    console.log('received FOLD from', socket.id)

    const playerId = payload.id

    update(s => {
      const {table, round} = s.run(fold(playerId))

      s.table = table
      s.round = round

      io.sockets.send(
        'FOLD_SUCCESS',
        {payload: {round, players: hideCards(round.cards, table.players, playerId)}})
    })
  })

  socket.on('BET', ({payload}) => {
    console.log('received BET from', socket.id)

    const {player, amount} = payload

    update(s => {
      const {table, round} = s.run(bet({playerId: player.id, amount}))

      s.table = table
      s.round = round

      if (round.street === 'SHOWDOWN') {
        const {round} = s.run(s => ({...s, round: computeRoundWinners(s.round)}))

        io.sockets.send('SHOWDOWN_SUCCESS', {payload: {round}})
      } else {
        io.sockets.send(
          'BET_SUCCESS',
          {payload: {
            round,
            players: s.round.status === 'ALL_IN' && showCards(round.cards, table.players),
            updatedStack: {
              playerId: player.id,
              stack: table.players.find(p => p.id === player.id).stack}}})
      }
    })
  })

  socket.on('END_ROUND', ({payload}) => {
    console.log('received END_ROUND from', socket.id)

    const {winners} = payload
    update(s => {
      if (s.round.status !== 'FINISHED') {
        const {table, round} = s.run(endRound)
        s.round = round
        s.table = table
        s.table.players = table.players.filter(p => p.stack > 0)
      }
    })

    store.get(socket.request.session.id, (err, session = {}) => {
      const id = safe('')(() => session.user.id)
      const table = select(s => s.table)
      const round = select(s => s.round)
      const user = table.players.find(p => p.id === id) || defaultUser

      socket.send('END_ROUND_SUCCESS', {payload: {table, round, user,}})
    })

  })
})

app.get('/api/v1/table/initialize/', (req, res) => {
  store.get(req.session.id, (err, session = {}) => {
    if (err) {console.error(err)}
    const user = select(s => {
      const id = safe('')(() => session.user.id)
      return s.table.players.find(p => p.id === id) || defaultUser})

    const table = select(s => s.table)
    const round = select(s => s.round)
    const players = safe(table.players)(() => hideCards(round.cards, table.players, user.id))

    res.send({payload: {user, round, table: {...table, players}}})
  })

})

app.post('/api/v1/table/sitUser/', (req, res) => {
  const {players, maxPlayers} = select(s => s.table)
  if (players.length < maxPlayers) {

    const user = {type: 'player', id: v4(), stack: 100, ...req.body}
    const s = req.session

    store.set(s.id, {...s, user}, err => err && console.error(err))
    update(s => {s.table.players.push(user)})

    const players = select(s => s.table.players)

    io.sockets.send('UPDATE_TABLE_PLAYERS', {payload: {players}})
    res.send({payload: {user}})
  } else {
    res.statusMessage = 'This table is full'
    res.status(409).end()
  }
})


server.listen(port, () => console.log(`poker room app listening at http://localhost:${port}`))
