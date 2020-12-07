const {app, server, io} = require('../app')
const port = process.env.PORT || 3000
const Filter = require('bad-words')
const {generateMessages, generateLocationMessages} = require('./utils/messages')
const {addUser, getUser, getUsersInRoom, removeUser} = require('./utils/users')

app.get('', (req, res) => {
  res.render('index', {
    title: 'Chat App',
    name: 'Wilfredo Suarez'
  })
})

app.get('/chat', (req, res) => {
  res.render('chat', {
    title: 'Chat App',
    name: 'Wilfredo Suarez'
  })
})

io.on('connection', (socket) => {

  socket.on('join', (options, callback) => {
    const {error, user} = addUser({id: socket.id, ...options})

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', generateMessages('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessages('Admin', `${user.username} has joined!`))

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }

    io.to(user.room).emit('message', generateMessages(user.username, message))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessages('Admin', `${user.username} has left!`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }

  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessages(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback()
  })

})


server.listen(port, () => {
  console.log('Server is up on port ' + port + ' http://localhost:' + port)
})