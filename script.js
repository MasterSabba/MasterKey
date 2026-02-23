let peer, connections = [];
let isHost = false;
let myName = "Victim_" + Math.floor(Math.random() * 999);
let players = []; 

const WORD_DATABASE = [
    { s: "COLTELLO", i: "FORCHETTA" },
    { s: "VELENO", i: "ACQUA" },
    { s: "CIMITERO", i: "CHIESA" },
    { s: "SANGUE", i: "VERNICE" }
];

// --- XP SYSTEM (LOCAL STORAGE) ---
let myXP = parseInt(localStorage.getItem('mm_xp')) || 0;

function addXP(amount) {
    myXP += amount;
    localStorage.setItem('mm_xp', myXP);
    updateXPUI();
}

function updateXPUI() {
    const fill = document.getElementById('xp-fill');
    const label = document.getElementById('xp-label');
    fill.style.width = Math.min(myXP, 100) + "%";
    label.innerText = `BLOOD_SPILLED: ${myXP}`;
}

// --- NETWORK CORE ---
function initPeer(host) {
    isHost = host;
    peer = new Peer();

    peer.on('open', id => {
        document.getElementById('my-id').innerText = id;
        document.getElementById('status-text').innerText = isHost ? "HOSTING_MURDER" : "VICTIM_CONNECTED";
        
        if(isHost) {
            document.getElementById('lobby-section').classList.remove('hidden');
            document.getElementById('start-btn').classList.remove('hidden');
            players.push({ name: myName, id: id });
            updateLobbyUI();
        } else {
            const hostId = document.getElementById('peer-id-input').value.trim();
            if(!hostId) return alert("Enter Host Code!");
            const conn = peer.connect(hostId);
            handleConnection(conn);
        }
    });

    peer.on('connection', handleConnection);
}

function handleConnection(conn) {
    connections.push(conn);
    conn.on('open', () => {
        if(!isHost) conn.send({ type: 'JOIN', name: myName });
    });

    conn.on('data', data => {
        if(data.type === 'JOIN' && isHost) {
            players.push({ name: data.name, id: conn.peer });
            broadcast({ type: 'SYNC', players: players });
            updateLobbyUI();
        }
        if(data.type === 'SYNC') { players = data.players; updateLobbyUI(); }
        if(data.type === 'START') startGameUI(data.role, data.word);
        if(data.type === 'MSG') logMurder(data.sender, data.text);
    });
}

function updateLobbyUI() {
    const list = document.getElementById('player-list');
    list.innerHTML = players.map(p => `<li>${p.name} <span style="color:red">READY</span></li>`).join('');
    document.getElementById('lobby-section').classList.remove('hidden');
}

// --- GAME ACTIONS ---
function hostStartGame() {
    const pair = WORD_DATABASE[Math.floor(Math.random() * WORD_DATABASE.length)];
    const impIdx = Math.floor(Math.random() * players.length);

    players.forEach((p, i) => {
        const payload = {
            type: 'START',
            role: (i === impIdx) ? 'IMPOSTOR' : 'INNOCENT',
            word: (i === impIdx) ? pair.i : pair.s
        };
        if(p.id === peer.id) startGameUI(payload.role, payload.word);
        else {
            const c = connections.find(conn => conn.peer === p.id);
            if(c) c.send(payload);
        }
    });
}

function startGameUI(role, word) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('role-tag').innerText = "STATUS: " + role;
    document.getElementById('secret-word').innerText = word;
    addXP(10); // Salvataggio automatico punti per partecipazione
}

function sendClue() {
    const input = document.getElementById('clue-input');
    if(!input.value) return;
    const msg = { type: 'MSG', sender: myName, text: input.value };
    logMurder("YOU", input.value);
    broadcast(msg);
    input.value = "";
}

function logMurder(sender, text) {
    const logs = document.getElementById('murder-logs');
    logs.innerHTML += `<div><span style="color:white">> [${sender}]:</span> ${text}</div>`;
    logs.scrollTop = logs.scrollHeight;
}

function broadcast(data) {
    connections.forEach(c => c.send(data));
}

function startBotMode() {
    startGameUI("AGENT_TRAINING", "SANGUE");
    setTimeout(() => logMurder("BOT_RED", "Sembra qualcosa di denso..."), 2000);
}

function copyId() {
    navigator.clipboard.writeText(document.getElementById('my-id').innerText);
}

window.onload = updateXPUI;
