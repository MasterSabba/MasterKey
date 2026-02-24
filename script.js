const grid = document.getElementById('grid');
const cellSize = 50;
let state = { lvl: 1, xp: 0, blocks: [], initial: [] };

// Funzione di collisione pura
function canPlace(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return false;
    
    for (let i = 0; i < state.blocks.length; i++) {
        if (i === ignoreIdx) continue;
        const b = state.blocks[i];
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        if (x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y) return false;
    }
    return true;
}

function generateLevel() {
    state.blocks = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    const pieces = Math.min(3 + state.lvl, 10);
    
    for (let i = 0; i < pieces; i++) {
        let attempts = 0;
        while (attempts++ < 100) {
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));
            // Evitiamo di bloccare l'uscita della chiave direttamente
            if (o === 'v' && x > 3 && y <= 2 && y+l > 2) continue;
            
            if (canPlace(x, y, l, o, -1)) {
                state.blocks.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.initial = JSON.parse(JSON.stringify(state.blocks));
    render();
}

function render() {
    grid.innerHTML = '';
    state.blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 4 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 4 + 'px';
        div.style.left = b.x * cellSize + 2 + 'px';
        div.style.top = b.y * cellSize + 2 + 'px';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX;
            let startY = e.clientY;
            let baseX = b.x;
            let baseY = b.y;

            div.onpointermove = (em) => {
                let diff = b.o === 'h' ? (em.clientX - startX) : (em.clientY - startY);
                let steps = Math.round(diff / cellSize);
                
                // Muoviamoci un passo alla volta per non saltare le collisioni
                let currentStep = 0;
                let direction = Math.sign(steps);
                let absoluteSteps = Math.abs(steps);
                
                for (let s = 0; s < absoluteSteps; s++) {
                    let nextX = b.o === 'h' ? b.x + direction : b.x;
                    let nextY = b.o === 'v' ? b.y + direction : b.y;
                    
                    if (canPlace(nextX, nextY, b.l, b.o, i)) {
                        b.x = nextX;
                        b.y = nextY;
                    } else {
                        break; // Muro trovato, fermati
                    }
                }
                
                div.style.left = b.x * cellSize + 2 + 'px';
                div.style.top = b.y * cellSize + 2 + 'px';
                startX = em.clientX; startY = em.clientY; // Reset per fluidità
            };
            
            div.onpointerup = () => {
                div.onpointermove = null;
                if (b.k && b.x === 4) {
                    alert("LIVELLO SUPERATO!");
                    state.lvl++; state.xp += 100;
                    document.getElementById('lvl').innerText = state.lvl;
                    document.getElementById('xp').innerText = state.xp;
                    generateLevel();
                }
            };
        };
        grid.appendChild(div);
    });
}

function resetLevel() { state.blocks = JSON.parse(JSON.stringify(state.initial)); render(); }
function nextLevel() { state.lvl++; generateLevel(); }

generateLevel();
