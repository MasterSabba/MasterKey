const grid = document.getElementById('grid');
const cellSize = 52;

// Database di livelli risolvibili (x, y, lunghezza, orientamento, isKey)
const LEVELS = [
    // Livello 1: Facile
    [{x:0, y:2, l:2, o:'h', k:true}, {x:2, y:0, l:3, o:'v', k:false}, {x:3, y:3, l:2, o:'h', k:false}],
    // Livello 2: Ostacoli verticali
    [{x:0, y:2, l:2, o:'h', k:true}, {x:2, y:2, l:2, o:'v', k:false}, {x:3, y:1, l:3, o:'v', k:false}, {x:4, y:4, l:2, o:'h', k:false}],
    // Livello 3: Incastro
    [{x:0, y:2, l:2, o:'h', k:true}, {x:2, y:0, l:2, o:'v', k:false}, {x:2, y:3, l:3, o:'v', k:false}, {x:3, y:2, l:2, o:'v', k:false}, {x:4, y:0, l:2, o:'h', k:false}],
    // Livello 4: Sfida
    [{x:0, y:2, l:2, o:'h', k:true}, {x:2, y:0, l:3, o:'v', k:false}, {x:3, y:0, l:2, o:'h', k:false}, {x:3, y:2, l:2, o:'v', k:false}, {x:4, y:3, l:2, o:'v', k:false}, {x:0, y:4, l:3, o:'h', k:false}]
];

let currentLevelIdx = parseInt(localStorage.getItem('mk_lvl')) || 0;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let blocks = [];

function loadLevel(idx) {
    const levelData = LEVELS[idx % LEVELS.length];
    blocks = JSON.parse(JSON.stringify(levelData)); // Copia profonda per Reset
    moves = 0;
    render();
    updateUI();
}

function render() {
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const el = document.createElement('div');
        el.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        el.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + 'px';
        el.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + 'px';
        el.style.left = b.x * cellSize + 3 + 'px';
        el.style.top = b.y * cellSize + 3 + 'px';
        if(b.k) el.innerHTML = '🔑';

        el.onpointerdown = (e) => {
            el.setPointerCapture(e.pointerId);
            let startCoord = b.o === 'h' ? e.clientX : e.clientY;
            let startPos = b.o === 'h' ? b.x : b.y;

            el.onpointermove = (em) => {
                let currentCoord = b.o === 'h' ? em.clientX : em.clientY;
                let diff = Math.round((currentCoord - startCoord) / cellSize);
                let target = startPos + diff;

                if (canMove(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    el.style.left = b.x * cellSize + 3 + 'px';
                    el.style.top = b.y * cellSize + 3 + 'px';
                }
            };

            el.onpointerup = () => {
                el.onpointermove = null;
                moves++;
                document.getElementById('move-num').innerText = moves;
                if (b.k && b.x === 4) win();
            };
        };
        grid.appendChild(el);
    });
}

function canMove(idx, val) {
    const b = blocks[idx];
    if (val < 0 || val + b.l > 6) return false;
    for (let i = 0; i < blocks.length; i++) {
        if (i === idx) continue;
        const o = blocks[i];
        let bx = b.o === 'h' ? val : b.x;
        let by = b.o === 'v' ? val : b.y;
        let bw = b.o === 'h' ? b.l : 1, bh = b.o === 'v' ? b.l : 1;
        let ow = o.o === 'h' ? o.l : 1, oh = o.o === 'v' ? o.l : 1;
        if (bx < o.x + ow && bx + bw > o.x && by < o.y + oh && by + bh > o.y) return false;
    }
    return true;
}

function win() {
    xp += 50;
    currentLevelIdx++;
    localStorage.setItem('mk_lvl', currentLevelIdx);
    localStorage.setItem('mk_xp', xp);
    setTimeout(() => {
        alert("COMPLETATO! +50 XP");
        loadLevel(currentLevelIdx);
    }, 250);
}

function resetLevel() {
    loadLevel(currentLevelIdx);
}

function nextLevel() {
    currentLevelIdx++;
    loadLevel(currentLevelIdx);
}

function updateUI() {
    document.getElementById('lvl-num').innerText = currentLevelIdx + 1;
    document.getElementById('xp-val').innerText = xp;
    document.getElementById('rank-fill').style.width = (xp % 200) / 2 + "%";
    const ranks = ["NOVICE", "CLEVER", "WOOD-MASTER", "KEY-LEGEND"];
    document.getElementById('rank-name').innerText = ranks[Math.min(Math.floor(xp/200), 3)];
}

loadLevel(currentLevelIdx);
