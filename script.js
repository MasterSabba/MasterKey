const grid = document.getElementById('grid');
const cellSize = 50;
let state = {
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    blocks: [],
    initial: [],
    skin: localStorage.getItem('mk_skin') || 'wood'
};

function init() {
    document.body.className = 'skin-' + state.skin;
    generateLevel();
    updateUI();
}

function generateLevel() {
    // Definizione pezzi numerosi (incrementano con il livello)
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}]; // La chiave
    let count = 6 + Math.min(Math.floor(state.lvl / 5), 10); // Parte da 6 pezzi + chiave

    for(let i=0; i<count; i++) {
        let attempts = 0;
        while(attempts < 150) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // No pezzi sopra la chiave all'inizio
            if (o === 'v' && x > 3 && y < 3) continue;

            if(!layout.some(b => checkCollision(x, y, l, o, b))) {
                layout.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.blocks = layout;
    state.initial = JSON.parse(JSON.stringify(layout));
    render();
}

function render() {
    grid.innerHTML = '';
    state.blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + 'px';
        div.style.left = b.x * cellSize + 3 + 'px';
        div.style.top = b.y * cellSize + 3 + 'px';
        if(b.k) div.innerHTML = '🔑';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let start = b.o === 'h' ? e.clientX : e.clientY;
            let currentPos = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let target = currentPos + Math.round(((b.o === 'h' ? em.clientX : em.clientY) - start) / cellSize);
                if(canMove(i, target)) {
                    if(b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 3 + 'px';
                    div.style.top = b.y * cellSize + 3 + 'px';
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                if(b.k && b.x === 4) win();
            };
        };
        grid.appendChild(div);
    });
}

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

function win() {
    state.xp += 25;
    state.lvl++;
    localStorage.setItem('mk_xp', state.xp);
    localStorage.setItem('mk_lvl', state.lvl);
    alert("LIVELLO COMPLETATO!");
    generateLevel();
    updateUI();
}

function updateUI() {
    document.getElementById('lvl').innerText = state.lvl;
    document.getElementById('xp').innerText = state.xp;
    document.getElementById('xp-bar').style.width = (state.xp % 100) + "%";
}

function resetCurrentLevel() {
    state.blocks = JSON.parse(JSON.stringify(state.initial));
    render();
}

function useSmartHint() {
    if(state.xp < 20) return alert("XP insufficienti!");
    state.xp -= 20;
    updateUI();
    const key = grid.querySelector('.block-key');
    key.style.filter = "brightness(2)";
    setTimeout(() => key.style.filter = "", 1000);
}

function toggleShop() { document.getElementById('shop-overlay').classList.toggle('hidden'); }
function applySkin(s) {
    state.skin = s;
    localStorage.setItem('mk_skin', s);
    document.body.className = 'skin-' + s;
    toggleShop();
}

init();
