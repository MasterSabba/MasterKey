const cellSize = 50;
let grid, levelDisp, movesDisp, xpDisp;

// Carica i dati salvati o imposta valori di base
let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let blocks = [];
let initialPos = [];

// AVVIO SICURO: Aspetta che la pagina sia caricata prima di creare i blocchi
window.onload = () => {
    grid = document.getElementById("grid");
    levelDisp = document.getElementById("level");
    movesDisp = document.getElementById("moves");
    xpDisp = document.getElementById("xp");
    
    generateLevel(); // Crea il primo schema
};

function generateLevel() {
    // La chiave d'oro (Il pezzo da liberare)
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    let pieceCount = 4 + Math.min(level, 7); // Difficoltà crescente
    for (let i = 0; i < pieceCount; i++) {
        let attempts = 0;
        while (attempts < 150) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks)); // Salva posizione per il Reset
    moves = 0;
    updateUI();
    render(); // DISEGNA FISICAMENTE I BLOCCHI
}

function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true; // Muri esterni

    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y; // Collisione tra blocchi
    });
}

function render() {
    if (!grid) return; // Evita errori se la griglia non è ancora pronta
    grid.innerHTML = ''; // Svuota la griglia dai vecchi blocchi
    
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        
        // Calcola dimensioni e posizione esatta in pixel
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.left = b.x * cellSize + 3 + "px";
        div.style.top = b.y * cellSize + 3 + "px";

        // Gestione movimento con Mouse o Dito
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let lastX = e.clientX, lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                let step = b.o === 'h' ? dx : dy;

                if (Math.abs(step) >= cellSize / 2) { // Muovi solo se trascini abbastanza
                    let dir = Math.sign(step);
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
                if (b.k && b.x === 4) { // CONDIZIONE DI VITTORIA
                    alert("Livello Superato! +100 XP");
                    level++;
                    xp += 100;
                    saveGame(); // SALVA AUTOMATICO
                    generateLevel();
                }
            };
        };
        grid.appendChild(div); // AGGIUNGE IL BLOCCO ALLA GRIGLIA
    });
}

function saveGame() {
    localStorage.setItem('mk_level', level);
    localStorage.setItem('mk_xp', xp);
}

function updateUI() {
    levelDisp.innerText = level;
    movesDisp.innerText = moves;
    xpDisp.innerText = xp;
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
