const cellSize = 50; // Ogni cella è 50x50px
let grid, levelDisp, movesDisp, xpDisp, timerDisp;

// Caricamento dati salvati o valori di default
let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = [];
let initialPos = [];

// Si attiva appena la pagina è pronta
window.addEventListener('DOMContentLoaded', () => {
    grid = document.getElementById("grid");
    levelDisp = document.getElementById("level");
    xpDisp = document.getElementById("xp");
    movesDisp = document.getElementById("moves");
    timerDisp = document.getElementById("timer");

    generateLevel();
});

function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        timerDisp.innerText = `${m}:${s}`;
    }, 1000);
}

function generateLevel() {
    // La chiave gold è sempre orizzontale su riga 2
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // Genera ostacoli in base al livello (massimo 10 pezzi)
    let count = 4 + Math.min(level, 6);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2; // Lunghezza 2 o 3
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks)); // Copia per il reset
    moves = 0;
    updateUI();
    startTimer();
    render(); // Crea i blocchi visivamente
}

function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    // Fuori dalla griglia 6x6?
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;

    // Contro altri blocchi?
    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

function render() {
    grid.innerHTML = ''; // Svuota la griglia
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        
        // Calcola pixel (togliamo 6px per il bordo/margine)
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.left = b.x * cellSize + 3 + "px";
        div.style.top = b.y * cellSize + 3 + "px";

        // Trascinamento (Mouse e Touch)
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let lastX = e.clientX, lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                let move = b.o === 'h' ? dx : dy;

                if (Math.abs(move) >= cellSize / 2) {
                    let dir = Math.sign(move);
                    let nx = b.x + (b.o === 'h' ? dir : 0);
                    let ny = b.y + (b.o === 'v' ? dir : 0);

                    if (!checkCollision(nx, ny, b.l, b.o, i)) {
                        b.x = nx; b.y = ny;
                        lastX = em.clientX; lastY = em.clientY;
                        moves++;
                        updateUI();
                        div.style.left = b.x * cellSize + 3 + "px";
                        div.style.top = b.y * cellSize + 3 + "px";
                    }
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                // Vittoria se la chiave tocca l'uscita (x=4)
                if (b.k && b.x === 4) {
                    alert("LIVELLO COMPLETATO!");
                    level++; xp += 100;
                    localStorage.setItem('mk_level', level);
                    localStorage.setItem('mk_xp', xp);
                    generateLevel();
                }
            };
        };
        grid.appendChild(div); // AGGIUNGE IL PEZZO ALLA GRIGLIA
    });
}

function updateUI() {
    levelDisp.innerText = level;
    xpDisp.innerText = xp;
    movesDisp.innerText = moves;
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    updateUI();
    render();
}

function useHint() {
    const key = document.querySelector('.block-key');
    if(key) {
        key.style.filter = "brightness(2)";
        setTimeout(() => key.style.filter = "none", 800);
    }
}
