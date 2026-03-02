const cellSize = 50;
let blocks = [];
let initialPos = [];
let moves = 0;
let isDragging = false; // Impedisce di muovere più blocchi insieme

let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;

window.onload = () => {
    generateLevel();
};

function generateLevel() {
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    let count = 5 + Math.min(level, 5);
    
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 1)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 1)));
            if (y === 2 && o === 'h') continue; 
            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks));
    moves = 0;
    render();
}

function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;
    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

function render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 4 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 4 + "px";
        div.style.left = (b.x * cellSize + 2) + "px";
        div.style.top = (b.y * cellSize + 2) + "px";

        div.onpointerdown = (e) => {
            if (isDragging) return; // Se un blocco è già in movimento, ignora gli altri
            isDragging = true;
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX, startY = e.clientY;
            let origX = b.x, origY = b.y;

            div.onpointermove = (em) => {
                let dx = Math.round((em.clientX - startX) / cellSize);
                let dy = Math.round((em.clientY - startY) / cellSize);
                let nx = origX + (b.o === 'h' ? dx : 0);
                let ny = origY + (b.o === 'v' ? dy : 0);

                // Muove il blocco solo se la destinazione è libera
                if (!checkCollision(nx, ny, b.l, b.o, i)) {
                    if (b.x !== nx || b.y !== ny) {
                        b.x = nx; b.y = ny;
                        moves++;
                        document.getElementById("moves").innerText = moves;
                        div.style.left = (b.x * cellSize + 2) + "px";
                        div.style.top = (b.y * cellSize + 2) + "px";
                    }
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                isDragging = false; // Rilascia il blocco per permetterne un altro
                if (b.k && b.x === 4) {
                    alert("Livello Completato!");
                    level++; xp += 100;
                    save();
                    generateLevel();
                }
            };
        };
        grid.appendChild(div);
    });
    document.getElementById("level").innerText = level;
    document.getElementById("xp").innerText = xp;
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    document.getElementById("moves").innerText = moves;
    render();
}

function save() {
    localStorage.setItem('mk_level', level);
    localStorage.setItem('mk_xp', xp);
}
