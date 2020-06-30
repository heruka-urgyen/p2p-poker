const io = require('socket.io')()
const cookie = require('cookie')
const immer = require('immer')
const {produce} = immer

/******************** state management ********************/
// _state is a private variable not to be directly accessed or mutated
let _state = {}
const update = f => _state = produce(_state, d => {f(d)})
const select = f => produce(_state, f)

/********************* default state *********************/

const defaultUser = {type: 'guest'}
const users = update(s => {s.users = {}})
const table = update(s => {
  s.table = {
    id: 1,
    maxPlayers: 2,
    players: [],
  }
})

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)

  const c = cookie.parse(socket.request.headers.cookie)['connect.sid']

  socket.on('GET_USER', _ => {
    console.log('received GET_USER from', socket.id)
    const user = select(s => s.users)[c] || defaultUser

    socket.emit('GET_USER_SUCCESS', {payload: {user}})
  })

  socket.on('GET_TABLE', _ => {
    console.log('received GET_TABLE from', socket.id)
    const table = select(s => s.table)

    socket.emit('GET_TABLE_SUCCESS', {payload: {table}})
  })
})


io.listen(3001)
