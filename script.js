const cellSize = 50;
let grid, levelDisp, movesDisp, xpDisp, timerDisp;

// Recupero dati da LocalStorage (come da tua richiesta)
let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = [];
let initialPos = [];

// Aspetta il caricamento completo del DOM
window.addEventListener('load', () => {
    grid = document.getElementById("grid");
    levelDisp = document.getElementById("level");
    xpDisp = document.getElementById("xp");
    movesDisp = document.getElementById("moves");
    timerDisp = document.getElementById("timer");

    // Piccolo delay per caricare i CSS correttamente
    setTimeout(() => {
        generateLevel();
    }, 100);
});

function generateLevel() {
    // 1. Definiamo la chiave d'oro
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // 2. Aggiungiamo blocchi casuali
    let count = 4 + Math.min(level, 6);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 50) {
            attempts++;
            let l = Math.random() > 0.7 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 1)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 1)));

            // Non bloccare la riga 2 (quella della chiave) con blocchi orizzontali
            if (o === 'h' && y === 2) continue;

            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    
    initialPos = JSON.parse(JSON.stringify(blocks)); 
    moves = 0;
    updateUI();
    startTimer();
    render(); // <--- Questa è la funzione che crea i div dei blocchi
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
    if (!grid) {
        console.error("Griglia non trovata!");
        return;
    }
    
    // Svuota i vecchi blocchi ma lascia l'eventuale uscita
    grid.innerHTML = '';
    
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        
        // Dimensioni (sottraiamo 6 per il bordo)
        const w = (b.o === 'h' ? b.l * cellSize : cellSize) - 6;
        const h = (b.o === 'v' ? b.l * cellSize : cellSize) - 6;
        
        div.style.width = w + "px";
        div.style.height = h + "px";
        div.style.left = (b.x * cellSize + 3) + "px";
        div.style.top = (b.y * cellSize + 3) + "px";
        
        // Assicurati che siano visibili
        div.style.display = "block";
        div.style.opacity = "1";

        // Gestione movimento
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX;
            let startY = e.clientY;
            let origX = b.x;
            let origY = b.y;

            div.onpointermove = (em) => {
                let dx = em.clientX - startX;
                let dy = em.clientY - startY;
                let move = Math.round((b.o === 'h' ? dx : dy) / cellSize);

                if (move !== 0) {
                    let nx = origX + (b.o === 'h' ? move : 0);
                    let ny = origY + (b.o === 'v' ? move : 0);

                    if (!checkCollision(nx, ny, b.l, b.o, i)) {
                        if(b.x !== nx || b.y !== ny) {
                            b.x = nx; b.y = ny;
                            moves++;
                            updateUI();
                            div.style.left = (b.x * cellSize + 3) + "px";
                            div.style.top = (b.y * cellSize + 3) + "px";
                        }
                    }
                }
            };
            
            div.onpointerup = () => {
                div.onpointermove = null;
                if (b.k && b.x >= 4) {
                    alert("Livello Completato!");
                    level++; xp += 100;
                    saveData();
                    generateLevel();
                }
            };
        };
        grid.appendChild(div);
    });
}

function updateUI() {
    if(levelDisp) levelDisp.innerText = level;
    if(xpDisp) xpDisp.innerText = xp;
    if(movesDisp) movesDisp.innerText = moves;
}

function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        if(timerDisp) timerDisp.innerText = `${m}:${s}`;
    }, 1000);
}

function saveData() {
    localStorage.setItem('mk_level', level);
    localStorage.setItem('mk_xp', xp);
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    updateUI();
    render();
}
