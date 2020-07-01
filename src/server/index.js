const io = require('socket.io')()
const cookie = require('cookie')
const {v4} = require('uuid')
const immer = require('immer')
const {produce} = immer

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
// _state is a private variable not to be directly accessed or mutated
let _state = {}
const update = f => _state = produce(_state, d => {f(d)})
const select = f => produce(_state, f)

/********************* default state *********************/

const defaultUser = {type: 'guest'}
const defaultBlinds = [1, 2]

update(s => {
  s._local = {postBlinds: 0}
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
})

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)

  const c = safe('')(() => cookie.parse(socket.request.headers.cookie)['connect.sid'])

  socket.on('INITIALIZE', _ => {

    console.log('received INITIALIZE from', socket.id)
    const user = select(s => {
      const id = s.sessions[c]
      return s.players[id] || defaultUser})
    const players = select(s => s.players)
    const table = select(s => s.table)
    const round = select(s => s.round)

    socket.emit('INITIALIZE_SUCCESS', {payload: {user, players, table, round}})
  })

  socket.on('SIT_USER', payload => {
    console.log('received SIT_USER from', socket.id)

    update(s => {
      const user = {type: 'player', id: v4(), stack: 100, ...payload}

      s.players[user.id] = user
      s.sessions[c] = user.id
      s.table.players.push(user.id)
    })

    const table = select(s => s.table)
    const players = select(s => s.players)
    const user = select(s => {
      const id = s.sessions[c]
      return s.players[id]
    })

    socket.emit('SIT_USER_SUCCESS', {payload: {user}})
    io.sockets.emit('UPDATE_TABLE_PLAYERS', {payload: {table, players}})
  })

  socket.on('NEXT_ROUND', _ => {
    console.log('received NEXT_ROUND from', socket.id)

    update(s => {
      s.round.status = 'IN_PROGRESS'
      s.round.street = 'PREFLOP'
      s.round.players = s.table.players
      s.round.button = ((s.round.button || -1) + 1) % s.round.players.length
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
})

io.listen(3001)
