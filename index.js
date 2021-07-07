const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const PORT = 3004

//console.log(__dirname)

const app = express()
const server = http.createServer(app)
const io = new Server(server)

// public path
const publicPath = path.join(__dirname, '/public')
app.use(express.static(publicPath))

//base de dados
let users = []

io.on('connection', socket => {
    console.log(socket.id)

    //sempre que um novo utilizador se junta ( cada user tem apenas um socket )
    socket.on("join", (data, callback) => {

        const { username, room }  = data
        const user = {username, room, id: socket.id}
        users.push(user)

        console.log(`User ${user.username} juntou-se id: ${user.id}`)
        
        // agrupa sockets
        socket.join(room)

        socket.broadcast.to(room).emit("incomingMessage", {username: "Flag", message:`${username} juntou-se ao grupo!`})
        socket.emit("incomingMessage", {username: "Flag", message:`Olá ${username}!`})

        // envia lista de utilizador de uma sala de chat
        io.to(room).emit('userList', {room, users: users.filter(user => user.room == room)})
        callback()
    })

    // recebe mensagem do frontend
    socket.on("chatMessage", (message, callback) => {

        const {username, room} = users.find(user => user.id == socket.id)
        io.to(room).emit("incomingMessage", {username, message})
        
        callback()
    })

    socket.on('disconnect', () => {
        console.log(`Socket desconectado --> ${socket.id}`)
        const user = users.find(user => user.id == socket.id)
        if(user){
            const {username, room} = user
            users = users.filter(user => user.id != socket.id)
            io.to(room).emit('userList', {room, users})
            io.to(room).emit("incomingMessage", {username: "Flag", message: `O ${username} bazou!`})
        }
    })
})

server.listen(PORT, () => { console.log(`servidor iniciado na porta ${PORT}`)})