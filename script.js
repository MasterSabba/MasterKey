const grid = document.getElementById('grid');
const cellSize = 50;
let state = {
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    skin: localStorage.getItem('mk_skin') || 'wood',
    unlocked: JSON.parse(localStorage.getItem('mk_unlocked')) || ['wood'],
    blocks: [],
    initial: []
};

function init() {
    document.body.className = 'skin-' + state.skin;
    generateLevel();
    updateUI();
}

function generateLevel() {
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    // Molti più pezzi: 10 ostacoli + chiave
    let count = 10 + Math.min(Math.floor(state.lvl / 3), 6); 

    for(let i=0; i<count; i++) {
        let attempts = 0;
        while(attempts < 200) {
            attempts++;
            let l = Math.random() > 0.7 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

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
        if(b.k) div.innerText = "🗝️";

        div.onpointerdown = (e) => {
            e.preventDefault(); // Blocca scroll durante il tocco
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX, startY = e.clientY;
            let ox = b.x, oy = b.y;

            div.onpointermove = (em) => {
                let diff = b.o === 'h' ? (em.clientX - startX) : (em.clientY - startY);
                let target = (b.o === 'h' ? ox : oy) + Math.round(diff / cellSize);
                
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

// (Le funzioni canMove, checkCollision e updateUI restano simili alle precedenti)
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
    state.xp += 50;
    state.lvl++;
    save();
    alert("Vittoria! +50 XP");
    generateLevel();
    updateUI();
}

function save() {
    localStorage.setItem('mk_xp', state.xp);
    localStorage.setItem('mk_lvl', state.lvl);
    localStorage.setItem('mk_skin', state.skin);
    localStorage.setItem('mk_unlocked', JSON.stringify(state.unlocked));
}

function buySkin(name, cost) {
    if(state.unlocked.includes(name)) {
        state.skin = name;
    } else if(state.xp >= cost) {
        state.xp -= cost;
        state.unlocked.push(name);
        state.skin = name;
    } else {
        return alert("XP insufficienti per questa skin!");
    }
    save();
    init();
    toggleShop();
}

function toggleShop() { document.getElementById('shop').classList.toggle('hidden'); }
function updateUI() {
    document.getElementById('lvl').innerText = state.lvl;
    document.getElementById('xp').innerText = state.xp;
    document.getElementById('xp-bar').style.width = (state.xp % 100) + "%";
}
function resetLevel() { state.blocks = JSON.parse(JSON.stringify(state.initial)); render(); }
function useHint() {
    if(state.xp < 50) return alert("Ti servono 50 XP!");
    state.xp -= 50; updateUI();
    const key = grid.querySelector('.block-key');
    key.style.filter = "brightness(3)";
    setTimeout(() => key.style.filter = "", 800);
}

init();
