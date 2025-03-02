const socket = io();

let peerConnection;
let localStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

socket.emit('join');

socket.on('paired', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    setupPeerConnection();

    if (!peerConnection.currentRemoteDescription) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    }
});

socket.on('offer', async (offer) => {
    setupPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async (candidate) => {
    if (candidate) {
        await peerConnection.addIceCandidate(candidate);
    }
});

socket.on('chat', (msg) => {
    appendMessage('Stranger', msg);
});

socket.on('stranger-left', () => {
    alert('Stranger left. Finding new...');
    cleanup();
    socket.emit('join');
});

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit('ice-candidate', candidate);
    };

    peerConnection.ontrack = ({ streams }) => {
        remoteVideo.srcObject = streams[0];
    };
}

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    appendMessage('You', message);
    socket.emit('chat', message);
    document.getElementById('messageInput').value = '';
}

function appendMessage(sender, msg) {
    const div = document.createElement('div');
    div.innerHTML = `<b>${sender}:</b> ${msg}`;
    document.getElementById('chatBox').appendChild(div);
}

function skip() {
    cleanup();
    socket.emit('skip');
}

// function toggleVideo() {
//     const videoTrack = localStream.getVideoTracks()[0];
//     videoTrack.enabled = !videoTrack.enabled;

//     const videoIcon = document.getElementById('videoIcon');
//     if (videoTrack.enabled) {
//         videoIcon.textContent = '📹';  // Video On
//     } else {
//         videoIcon.textContent = '📵';  // Video Off
//     }
// }

// function toggleAudio() {
//     const audioTrack = localStream.getAudioTracks()[0];
//     audioTrack.enabled = !audioTrack.enabled;

//     const audioIcon = document.getElementById('audioIcon');
//     if (audioTrack.enabled) {
//         audioIcon.textContent = '🎙️';  // Audio On
//     } else {
//         audioIcon.textContent = '🔇';  // Audio Off
//     }
// }

function toggleVideo() {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    updateVideoIcon(videoTrack.enabled);
}

function toggleAudio() {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    updateAudioIcon(audioTrack.enabled);
}

function updateVideoIcon(enabled) {
    document.getElementById('videoIcon').textContent = enabled ? '📹' : '📵';
}

function updateAudioIcon(enabled) {
    document.getElementById('audioIcon').textContent = enabled ? '🎙️' : '🔇';
}


function cleanup() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
    }
}


