const socket = io();
const username = localStorage.getItem('username');
let localStream = null;

socket.emit('join', username);

socket.on('paired', async () => {
    document.getElementById('searching').style.display = 'none';
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
});

socket.on('chat', msg => addMessage('Stranger', msg));
socket.on('stranger-left', reset);

function sendMessage() {
    const msg = document.getElementById('message').value.trim();
    if (msg) {
        addMessage('You', msg);
        socket.emit('chat', msg);
        document.getElementById('message').value = '';
    }
}

function addMessage(sender, msg) {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${sender}:</strong> ${msg}`;
    document.getElementById('messages').appendChild(div);
}

function skip() {
    reset();
    socket.emit('skip');
}

function toggleVideo() {
    const track = localStream.getVideoTracks()[0];
    track.enabled = !track.enabled;
}

function reset() {
    document.getElementById('searching').style.display = 'block';
    document.getElementById('remoteVideo').srcObject = null;
}
