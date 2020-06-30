const io = require('socket.io')()

io.on('connection', socket => {console.log('connected to ' + socket.id)})

io.listen(3001)
