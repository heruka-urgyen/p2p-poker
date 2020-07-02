const io = require('socket.io')()
const cookie = require('cookie')
const {v4} = require('uuid')
const immer = require('immer')
const Pair = require('sanctuary-pair')
const {STREETS, deal, newDeck} = require('@heruka_urgyen/poker-solver')

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
  s._local = {postBlinds: 0, dealCards: 0}
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

  const c = safe('')(() => cookie.parse(socket.request.headers.cookie)['connect.sid'])

  socket.on('INITIALIZE', _ => {

    console.log('received INITIALIZE from', socket.id)
    const user = select(s => {
      const id = safe('')(() => s.sessions[c].userId)
      return s.players[id] || defaultUser})
    const players = select(s => s.players)
    const table = select(s => s.table)
    const round = select(s => s.round)

    socket.emit(
      'INITIALIZE_SUCCESS',
      {payload: {user, players: hideCards(players, user.id), table, round}})
  })

  socket.on('SIT_USER', payload => {
    console.log('received SIT_USER from', socket.id)

    update(s => {
      const user = {type: 'player', id: v4(), stack: 100, ...payload}

      s.players[user.id] = user
      s.sessions[c] = {userId: user.id, socketId: socket.id}
      s.table.players.push(user.id)
    })

    const table = select(s => s.table)
    const players = select(s => s.players)
    const user = select(s => {
      const id = safe('')(() => s.sessions[c].userId)
      return s.players[id]
    })

    socket.emit('SIT_USER_SUCCESS', {payload: {user}})
    io.sockets.emit('UPDATE_TABLE_PLAYERS', {payload: {table, players}})
  })

  socket.on('NEXT_ROUND', _ => {
    console.log('received NEXT_ROUND from', socket.id)

    update(s => {
      s.round.status = 'IN_PROGRESS'
      s.round.street = STREETS[0]
      s.round.players = s.table.players
      s.round.button = ((s.round.button || -1) + 1) % s.round.players.length
      s.round.whoseTurn = s.round.players[s.round.button]
      s.round.pot = 0
      s.round.bets = []
    })

    const round = select(s => s.round)
    socket.emit('NEXT_ROUND_SUCCESS', {payload: {round}})
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

        const cs = select(s => s.streetState.cards)
        const players = select(s => s.players)
        const sessions = select(s => s.sessions)

        Object.keys(io.sockets.sockets).forEach(id => {
          const socket = io.sockets.sockets[id]

          Object.keys(sessions).forEach(c => {
            if (sessions[c].socketId === id) {
              const {userId} = sessions[c]

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
        s.round.bets.filter(bet => bet.playerId === playerId)[0].amount

      s.round.bets = s.round.bets.filter(bet => bet.playerId !== playerId)
      s.round.players = s.round.players.filter(id => id !== playerId)

      s.players[playerId].cards = []
    })

    const round = select(s => s.round)
    const players = select(s => s.players)

    io.sockets.emit('FOLD_SUCCESS', {payload: {round, players: hideCards(players, playerId)}})
  })

  socket.on('END_ROUND', ({payload}) => {
    console.log('received END_ROUND from', socket.id)

    const playerId = payload.id

    update(s => {
      s.round.pot = s.round.bets.reduce((pot, bet) => pot + bet.amount, s.round.pot)
      s.round.bets = []
      s.round.status = 'FINISHED'

      Object.keys(s.players).forEach(id => {
        s.players[id].cards = []
        if (id !== playerId) {
          s.players[id].stack = s.round.pot + s.players[id].stack
        }
      })
    })

    const round = select(s => s.round)
    const players = select(s => s.players)

    io.sockets.emit('FOLD_SUCCESS', {payload: {round, players}})
  })


})

io.listen(3001)
