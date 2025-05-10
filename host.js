const availableRoles = [
  "Lobo", "Aldeano", "Vidente", "Cupido",
  "Cazador", "Bruja", "La niña"
];

let selectedRoles = [];
let players = []; // {name, conn, role}[]

const hostPanel = document.getElementById('host-panel');
const roomCodeSpan = document.getElementById('room-code');
const playersList = document.getElementById('players-list');
const dealRolesBtn = document.getElementById('deal-roles');
const playersCountSpan = document.getElementById('players-count');

export async function startHost() {
  menu.hidden = true;
  hostPanel.hidden = false;

  let peer;
  try {
    peer = await createUniquePeer();
  } catch (err) {
    alert(err.message);
    location.reload();
    return;
  }

  roomCodeSpan.textContent = peer.id;

  peer.on('connection', conn => {
    conn.on('data', data => {
      if (data.name) {
        players.push({
          name: data.name,
          conn,
          role: null
        });
        renderPlayerList();
        renderRolePicker();
      }
    });
  });

  renderRolePicker();

  dealRolesBtn.onclick = () => {
    const shuffledRoles = shuffle(selectedRoles);
    for (let i = 0; i < shuffledRoles.length; i++) {
      players[i].role = shuffledRoles[i];
      players[i].conn.send({ role: shuffledRoles[i] });
    }
    renderPlayerList();
  };
}

function renderPlayerList() {
  playersList.innerHTML = '';
  for (const {name, role} of players) {
    const li = document.createElement('li');
    li.textContent = name + (role ? ` (${role})` : '');
    playersList.appendChild(li);
    playersCountSpan.textContent = players.length;
  }
}

function createUniquePeer(maxRetries = 5) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryPeer() {
      const id = generateRoomId();
      const peer = new Peer(id);

      peer.on('open', () => resolve(peer));
      peer.on('error', err => {
        if (err.type === 'unavailable-id') {
          attempt++;
          if (attempt < maxRetries) {
            tryPeer();
          } else {
            reject(new Error('Could not create a unique room code.'));
          }
        } else {
          reject(err);
        }
      });
    }

    tryPeer();
  });
}

function generateRoomId(length = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function renderRolePicker() {
  const container = document.getElementById("role-picker");
  const status = document.getElementById("role-count-status");
  container.innerHTML = '';
  
  availableRoles.forEach(role => {
    const count = selectedRoles.filter(r => r === role).length;

    const div = document.createElement('div');
    div.className = 'role-option';
    div.innerHTML = `
      <strong>${role}</strong><br>
      <button data-role="${role}" data-change="-1">−</button>
      <span>${count}</span>
      <button data-role="${role}" data-change="1">+</button>
    `;
    container.appendChild(div);
  });

  status.textContent = `${selectedRoles.length}/${playersList.children.length}`;
  dealRolesBtn.disabled = selectedRoles.length !== playersList.children.length || playersList.children.length === 0;

  container.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const role = btn.dataset.role;
      const change = parseInt(btn.dataset.change);
      if (change === 1) {
        selectedRoles.push(role);
      } else {
        const idx = selectedRoles.lastIndexOf(role);
        if (idx !== -1) selectedRoles.splice(idx, 1);
      }
      renderRolePicker();
    };
  });
}