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

update(s => {
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
  }
})

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)

  const c = safe('')(() => cookie.parse(socket.request.headers.cookie)['connect.sid'])

  socket.on('GET_USER', _ => {
    console.log('received GET_USER from', socket.id)
    const user = select(s => {
      const id = s.sessions[c]
      return s.players[id] || defaultUser
    })

    socket.emit('GET_USER_SUCCESS', {payload: {user}})
  })

  socket.on('GET_TABLE', _ => {
    console.log('received GET_TABLE from', socket.id)
    const table = select(s => s.table)

    socket.emit('GET_TABLE_SUCCESS', {payload: {table}})
  })

  socket.on('GET_ROUND', _ => {
    console.log('received GET_ROUND from', socket.id)
    const round = select(s => s.round)

    socket.emit('GET_ROUND_SUCCESS', {payload: {round}})
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
    io.sockets.emit('UPDATE_TABLE_SUCCESS', {payload: {table, players}})
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
})

io.listen(3001)
