const io = require('socket.io')()
const immer = require('immer')
const {produce} = immer

/******************** state management ********************/
// _state is a private variable not to be directly accessed or mutated
let _state = {}
const update = f => _state = produce(_state, d => {f(d)})
const select = f => produce(_state, f)

/********************* default state *********************/

/******************** socket handlers ********************/

io.on('connection', socket => {
  console.log('connected to ' + socket.id)
})


io.listen(3001)
