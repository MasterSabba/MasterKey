const grid = document.getElementById('grid');
const cellSize = 52;
let state = {
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    isVoid: localStorage.getItem('mk_void') === 'true',
    unlocked: JSON.parse(localStorage.getItem('mk_unlocked')) || ['wood'],
    skin: localStorage.getItem('mk_skin') || 'wood',
    moves: 0, time: 0, blocks: [], initial: []
};

// --- INIZIALIZZAZIONE ---
function init() {
    applySkin(state.skin);
    if(state.isVoid) document.body.classList.add('theme-void');
    loadLevel();
    setInterval(updateTimer, 1000);
    updateUI();
}

// --- GENERATORE LIVELLI ---
function loadLevel() {
    const isBoss = (state.lvl === 100);
    const seed = state.lvl + (state.isVoid ? 500 : 0);
    const rng = () => {
        let x = Math.sin(seed + state.blocks.length) * 10000;
        return x - Math.floor(x);
    };

    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    let count = 4 + Math.min(Math.floor(state.lvl / 10), 8) + (state.isVoid ? 4 : 0);

    for(let i=0; i<count; i++) {
        let attempts = 0;
        while(attempts < 100) {
            attempts++;
            let l = rng() > 0.8 ? 3 : 2;
            let o = rng() > 0.5 ? 'h' : 'v';
            let x = Math.floor(rng() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(rng() * (6 - (o === 'v' ? l : 0)));
            if(!layout.some(b => checkCollision(x, y, l, o, b))) {
                layout.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.blocks = layout;
    state.initial = JSON.parse(JSON.stringify(layout));
    state.moves = 0;
    
    if(isBoss) document.querySelector('.board-wrapper').classList.add('boss-rotating');
    render();
}

// --- RENDERING ---
function render() {
    grid.innerHTML = '';
    state.blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.left = b.x * cellSize + 4 + 'px';
        div.style.top = b.y * cellSize + 4 + 'px';
        div.innerHTML = b.k ? (state.isVoid ? '👁️' : '🔑') : '';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let start = b.o === 'h' ? e.clientX : e.clientY;
            let pos = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let target = pos + Math.round(((b.o === 'h' ? em.clientX : em.clientY) - start) / cellSize);
                if(canMove(i, target)) {
                    if(b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 4 + 'px';
                    div.style.top = b.y * cellSize + 4 + 'px';
                }
            };
            div.onpointerup = () => {
                state.moves++;
                updateUI();
                if(b.k && b.x === 4) handleWin();
            };
        };
        grid.appendChild(div);
    });
}

// --- LOGICA ---
function canMove(idx, val) {
    const b = state.blocks[idx];
    if(val < 0 || val + b.l > 6) return false;
    return !state.blocks.some((other, i) => {
        if(i === idx) return false;
        let nx = b.o === 'h' ? val : b.x;
        let ny = b.o === 'v' ? val : b.y;
        return nx < other.x + (other.o === 'h' ? other.l : 1) &&
               nx + (b.o === 'h' ? b.l : 1) > other.x &&
               ny < other.y + (other.o === 'v' ? other.l : 1) &&
               ny + (b.o === 'v' ? b.l : 1) > other.y;
    });
}

function checkCollision(x, y, l, o, other) {
    let w = o === 'h' ? l : 1, h = o === 'v' ? l : 1;
    let ow = other.o === 'h' ? other.l : 1, oh = other.o === 'v' ? other.l : 1;
    return x < other.x + ow && x + w > other.x && y < other.y + oh && y + h > other.y;
}

function handleWin() {
    if(state.lvl === 100 && !state.isVoid) {
        generateFinalQR();
    } else {
        state.xp += 30;
        state.lvl++;
        save();
        loadLevel();
        updateUI();
    }
}

// --- QR & REBIRTH ---
function generateFinalQR() {
    const container = document.getElementById("qrcode-container");
    container.innerHTML = "";
    new QRCode(container, {
        text: `MASTERKEY ASCENSION\nXP: ${state.xp}\nLevel: 100\nTime: ${document.getElementById('timer').innerText}`,
        width: 150, height: 150
    });
    document.getElementById('qr-overlay').classList.remove('hidden');
}

function triggerRebirth() {
    state.isVoid = true;
    state.lvl = 1;
    state.xp += 1000;
    save();
    localStorage.setItem('mk_void', 'true');
    location.reload();
}

// --- UI & SHOP ---
function buySkin(skin, price) {
    if(state.unlocked.includes(skin)) {
        state.skin = skin;
    } else if(state.xp >= price) {
        state.xp -= price;
        state.unlocked.push(skin);
        state.skin = skin;
    } else { return alert("XP insufficienti!"); }
    save();
    applySkin(skin);
    toggleShop();
}

function applySkin(s) {
    document.body.className = `skin-${s} ${state.isVoid ? 'theme-void' : ''}`;
    state.skin = s;
    render();
}

function updateUI() {
    document.getElementById('lvl-display').innerText = state.lvl;
    document.getElementById('xp-val').innerText = state.xp;
    document.getElementById('xp-bar').style.width = (state.xp % 100) + "%";
    document.getElementById('move-count').innerText = state.moves;
    document.getElementById('world-status').innerText = state.isVoid ? "Void" : "Wood";
}

function updateTimer() {
    state.time++;
    let m = Math.floor(state.time / 60);
    let s = state.time % 60;
    document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

function save() {
    localStorage.setItem('mk_xp', state.xp);
    localStorage.setItem('mk_lvl', state.lvl);
    localStorage.setItem('mk_unlocked', JSON.stringify(state.unlocked));
    localStorage.setItem('mk_skin', state.skin);
}

// --- UTILS ---
function toggleShop() { document.getElementById('shop-overlay').classList.toggle('hidden'); }
function toggleDiary() { 
    document.getElementById('diary-overlay').classList.toggle('hidden'); 
    document.getElementById('diary-content').innerText = state.lvl > 10 ? "Le pareti di legno sussurrano il tuo nome..." : "Il viaggio è appena iniziato.";
}
function resetCurrentLevel() { state.blocks = JSON.parse(JSON.stringify(state.initial)); render(); }

function useSmartHint() {
    if(state.xp < 50) return alert("XP insufficienti!");
    state.xp -= 50;
    const b = grid.querySelector('.block-key');
    b.style.filter = "brightness(2)";
    setTimeout(() => b.style.filter = "", 1000);
    updateUI();
}

init();
