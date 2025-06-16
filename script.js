import {startHost} from './host.js';

const menu = document.getElementById('menu');
const playerPanel = document.getElementById('player-panel');
const waitingToStart = document.getElementById('waiting-to-start');

document.getElementById('create-btn').onclick = startHost;
document.getElementById('join-form').onsubmit = joinRoom;

function joinRoom(e) {
  e.preventDefault();

  const roomCode = document.getElementById('join-room-code').value.trim().toUpperCase();
  const name = document.getElementById('nickname').value.trim();
  const peer = new Peer({
    config: {
      iceServers: [
          {urls: 'stun:freestun.net:3478' }, 
          {urls: 'turn:freestun.net:3478', username: 'free', credential: 'free' }
      ]
    }
  });

  peer.on('open', id => {
    const conn = peer.connect(roomCode);

    conn.on('open', () => {
      conn.send({ name });
      menu.hidden = true;
      playerPanel.hidden = false;
    });

    conn.on('data', data => {
      if (data.role) {
        waitingToStart.textContent = "Your Role: " + data.role;
      }
    });

    conn.on('error', err => {
      alert("Could not connect to host: " + err.message);
      location.reload();
    });
  });
}
