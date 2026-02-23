const grid = document.getElementById('grid');
const cellSize = 55;
let moves = 0;
let blocksData = [];

// --- SISTEMA DI RANK & SALVATAGGIO ---
let xp = parseInt(localStorage.getItem('masterkey_xp')) || 0;

function updateRankUI() {
    const ranks = ["NOVICE", "INFILTRATOR", "HACKER", "GHOST", "MASTER"];
    const level = Math.floor(xp / 100);
    const currentRank = ranks[Math.min(level, ranks.length - 1)];
    const progress = xp % 100;

    document.getElementById('rank-title').innerText = currentRank;
    document.getElementById('xp-text').innerText = `${xp} XP`;
    document.getElementById('rank-fill').style.width = `${progress}%`;
    
    // Salvataggio automatico
    localStorage.setItem('masterkey_xp', xp);
}

// --- GENERATORE CASUALE ---
function generateRandomLevel() {
    grid.innerHTML = '';
    moves = 0;
    document.getElementById('move-count').innerText = moves;
    
    // 1. La Chiave (sempre sulla riga 2)
    blocksData = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // 2. Aggiungi blocchi casuali (tenta 15 volte)
    for (let i = 0; i < 15; i++) {
        let l = Math.random() > 0.7 ? 3 : 2; // Lunghezza 2 o 3
        let o = Math.random() > 0.5 ? 'h' : 'v'; // Orizzontale o Verticale
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        // Non coprire la via d'uscita della chiave inizialmente
        if (o === 'v' && x > 1 && y <= 2 && y + l > 2) {
            // Questo blocco blocca la chiave, va bene per il gioco!
        }

        // Verifica collisioni prima di aggiungere
        let collision = false;
        for (let b of blocksData) {
            if (checkRectCollision(x, y, l, o, b.x, b.y, b.l, b.o)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            blocksData.push({ x, y, l, o, k: false });
        }
    }
    renderBlocks();
}

function renderBlocks() {
    grid.innerHTML = '';
    blocksData.forEach((data, index) => createBlockUI(data, index));
}

function createBlockUI(data, id) {
    const el = document.createElement('div');
    el.className = `block ${data.k ? 'key-block' : ''}`;
    el.style.width = (data.o === 'h' ? data.l * cellSize : cellSize) - 6 + 'px';
    el.style.height = (data.o === 'v' ? data.l * cellSize : cellSize) - 6 + 'px';
    el.style.left = data.x * cellSize + 3 + 'px';
    el.style.top = data.y * cellSize + 3 + 'px';
    if(data.k) el.innerHTML = "🔑";

    // Logica di Drag (Semplificata)
    let isDragging = false;
    let startPos;

    el.onmousedown = (e) => {
        isDragging = true;
        startPos = data.o === 'h' ? e.clientX : e.clientY;
        
        document.onmousemove = (moveE) => {
            if (!isDragging) return;
            let current = data.o === 'h' ? moveE.clientX : moveE.clientY;
            let diff = Math.round((current - startPos) / cellSize);
            if (diff !== 0) {
                let newCoord = (data.o === 'h' ? data.x : data.y) + diff;
                if (canMove(id, newCoord)) {
                    if (data.o === 'h') data.x = newCoord; else data.y = newCoord;
                    startPos = current;
                    renderBlocks();
                    moves++;
                    document.getElementById('move-count').innerText = moves;
                    checkWin();
                }
            }
        };
        document.onmouseup = () => isDragging = false;
    };
}

function canMove(id, newCoord) {
    const b = blocksData[id];
    if (newCoord < 0 || newCoord + b.l > 6) return false;
    for (let i = 0; i < blocksData.length; i++) {
        if (i === id) continue;
        const other = blocksData[i];
        let bx = b.o === 'h' ? newCoord : b.x;
        let by = b.o === 'v' ? newCoord : b.y;
        if (checkRectCollision(bx, by, b.l, b.o, other.x, other.y, other.l, other.o)) return false;
    }
    return true;
}

function checkRectCollision(x1, y1, l1, o1, x2, y2, l2, o2) {
    let w1 = o1 === 'h' ? l1 : 1, h1 = o1 === 'v' ? l1 : 1;
    let w2 = o2 === 'h' ? l2 : 1, h2 = o2 === 'v' ? l2 : 1;
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function checkWin() {
    const key = blocksData.find(b => b.k);
    if (key.x === 4) {
        xp += 25;
        alert("ACCESS GRANTED! +25 XP");
        updateRankUI();
        generateRandomLevel();
    }
}

function resetLevel() { renderBlocks(); }

// Avvio
updateRankUI();
generateRandomLevel();
