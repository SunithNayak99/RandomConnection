const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

app.use(express.static('public'));

io.on('connection', socket => {
    socket.on('join', username => {
        socket.username = username;
        if (waitingUser) {
            pair(waitingUser, socket);
            waitingUser = null;
        } else {
            waitingUser = socket;
        }
    });

    socket.on('chat', msg => socket.partner?.emit('chat', msg));

    socket.on('skip', () => {
        if (socket.partner) {
            socket.partner.emit('stranger-left');
            socket.partner = null;
        }
        socket.emit('stranger-left');
        pairUserOrWait(socket);
    });

    socket.on('disconnect', () => {
        if (socket.partner) socket.partner.emit('stranger-left');
    });
});

function pair(user1, user2) {
    user1.partner = user2;
    user2.partner = user1;
    user1.emit('paired');
    user2.emit('paired');
}

function pairUserOrWait(socket) {
    if (waitingUser) {
        pair(waitingUser, socket);
        waitingUser = null;
    } else {
        waitingUser = socket;
    }
}

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
