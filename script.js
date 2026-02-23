const grid = document.getElementById('grid');
const cellSize = 52;
let blocks = [];
let initialLayout = [];
let moves = 0;
let xp = parseInt(localStorage.getItem('mk_xp_full')) || 0;
let currentLvl = parseInt(localStorage.getItem('mk_lvl_full')) || 1;
let timerInterval;
let seconds = 0;
let bestTime = parseInt(localStorage.getItem('mk_best_time')) || 0; // Miglior tempo in secondi

// Audio SFX
const moveSfx = document.getElementById('move-sfx');
const winSfx = document.getElementById('win-sfx');
const collisionSfx = document.getElementById('collision-sfx');
const hintSfx = document.getElementById('hint-sfx');

// --- TEMA SCURO/CHIARO ---
function toggleTheme() {
    document.body.classList.toggle('theme-light');
    document.body.classList.toggle('theme-dark');
    localStorage.setItem('mk_theme', document.body.classList.contains('theme-light') ? 'light' : 'dark');
}
// Carica tema all'avvio
if (localStorage.getItem('mk_theme') === 'light') {
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
}

// --- TIMER ---
function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let min = Math.floor(seconds / 60);
        let sec = seconds % 60;
        document.getElementById('timer').innerText = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// --- GENERAZIONE LIVELLO COMPLESSO ---
function generateDynamicLevel() {
    moves = 0;
    grid.innerHTML = '';
    
    // Reset timer e start
    stopTimer();
    startTimer();

    // Base: 3 blocchi + 1 ogni 2 livelli
    let baseObstacles = 3 + Math.floor(currentLvl / 2);
    // Difficoltà: Più livelli, più blocchi lunghi, più blocchi roccia/ghiaccio
    let allow3Length = currentLvl > 3;
    let rockBlockChance = currentLvl > 5 ? 0.2 : 0; // 20% di chance sopra lvl 5
    let iceBlockChance = currentLvl > 8 ? 0.2 : 0; // 20% di chance sopra lvl 8

    let layout = [{ x: 0, y: 2, l: 2, o: 'h', k: true }]; // La chiave d'oro

    let attempts = 0;
    while (layout.length < baseObstacles + 1 && attempts < 300) { // +1 per la chiave
        attempts++;
        let l = (allow3Length && Math.random() > 0.7) ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        // Non bloccare immediatamente la chiave o l'uscita
        if ((o === 'v' && x === 1 && y <= 2 && y + l > 2) || (x >= 4 && o === 'h')) continue;

        let type = 'normal';
        if (Math.random() < rockBlockChance) type = 'rock';
        else if (Math.random() < iceBlockChance) type = 'ice';

        let newBlock = { x, y, l, o, k: false, type: type };

        if (!layout.some(b => checkCollision(x, y, l, o, b))) {
            layout.push(newBlock);
        }
    }
    
    initialLayout = JSON.parse(JSON.stringify(layout)); // Salva per reset
    blocks = layout;
    renderBlocks();
    updateUI();
}

function renderBlocks() {
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement('div');
        let blockClass = b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v');
        if (b.type === 'rock') blockClass = 'block-rock';
        if (b.type === 'ice') blockClass = 'block-ice';
        
        div.className = `block ${blockClass}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.left = b.x * cellSize + 4 + 'px';
        div.style.top = b.y * cellSize + 4 + 'px';
        if(b.k) div.innerHTML = '🔑';

        // Logica di Movimento
        if (b.type !== 'rock') { // I blocchi roccia non si muovono
            div.onpointerdown = (e) => {
                moveSfx.play(); // Suono di click
                div.setPointerCapture(e.pointerId);
                let startClientCoord = b.o === 'h' ? e.clientX : e.clientY;
                let startBlockPos = b.o === 'h' ? b.x : b.y;

                div.onpointermove = (em) => {
                    let currentClientCoord = b.o === 'h' ? em.clientX : em.clientY;
                    let diff = Math.round((currentClientCoord - startClientCoord) / cellSize);
                    let targetPos = startBlockPos + diff;

                    if (tryMoveBlock(i, targetPos)) {
                        if (b.o === 'h') b.x = targetPos; else b.y = targetPos;
                        div.style.left = b.x * cellSize + 4 + 'px';
                        div.style.top = b.y * cellSize + 4 + 'px';
                        // Feedback tattile solo se effettivamente si muove
                        if (navigator.vibrate) navigator.vibrate(10);
                    } else {
                        collisionSfx.play(); // Suono di collisione
                    }
                };

                div.onpointerup = () => {
                    div.onpointermove = null;
                    moves++;
                    document.getElementById('moves').innerText = moves;
                    if (b.k && b.x === 4) handleWin();
                };
            };
        }
        grid.appendChild(div);
    });
}

function tryMoveBlock(idx, targetVal) {
    const b = blocks[idx];
    if (targetVal < 0 || targetVal + b.l > 6) return false;

    // Controlla collisioni con altri blocchi
    for (let i = 0; i < blocks.length; i++) {
        if (i === idx) continue;
        const other = blocks[i];
        let nextX = b.o === 'h' ? targetVal : b.x;
        let nextY = b.o === 'v' ? targetVal : b.y;

        if (checkCollision(nextX, nextY, b.l, b.o, other)) {
            // Se è un blocco ghiaccio, prova a spingere l'altro
            if (b.type === 'ice') {
                return tryPushBlock(i, other, b.o, (b.o === 'h' ? (nextX > other.x ? 1 : -1) : (nextY > other.y ? 1 : -1)));
            }
            return false; // Collisione normale
        }
    }
    return true;
}

// Spinge un blocco (per i blocchi ghiaccio)
function tryPushBlock(pushedBlockIdx, pushedBlock, direction, amount) {
    const originalPos = pushedBlock.o === 'h' ? pushedBlock.x : pushedBlock.y;
    const newPos = originalPos + amount;

    if (pushedBlock.type === 'rock') return false; // Non si possono spingere le rocce

    if (canMoveTo(pushedBlockIdx, newPos)) {
        if (pushedBlock.o === 'h') pushedBlock.x = newPos; else pushedBlock.y = newPos;
        // Aggiorna la UI per il blocco spinto
        renderBlocks(); // Potrebbe essere costoso, ottimizzare se necessario
        return true;
    }
    return false;
}


function checkCollision(x, y, l, o, b2) {
    let w1 = o === 'h' ? l : 1, h1 = o === 'v' ? l : 1;
    let w2 = b2.o === 'h' ? b2.l : 1, h2 = b2.o === 'v' ? b2.l : 1;
    return x < b2.x + w2 && x + w1 > b2.x && y < b2.y + h2 && y + h1 > b2.y;
}

// --- HINT SYSTEM ---
function findNextMove() {
    // Implementazione semplificata: cerca una mossa che muova la chiave
    // Per un hint intelligente, servirebbe un algoritmo di pathfinding (BFS/DFS)
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type === 'rock') continue; // Non suggerire di muovere rocce

        let originalPos = b.o === 'h' ? b.x : b.y;
        
        // Prova a muovere in avanti
        if (tryMoveBlock(i, originalPos + 1)) return { blockIdx: i, direction: 1 };
        // Prova a muovere all'indietro
        if (tryMoveBlock(i, originalPos - 1)) return { blockIdx: i, direction: -1 };
    }
    return null; // Nessuna mossa suggerita
}

function useHint() {
    if (xp < 20) {
        showFeedback("NON ABBASTANZA XP!");
        return;
    }
    hintSfx.play();
    xp -= 20;
    localStorage.setItem('mk_xp_full', xp);
    updateUI();
    showFeedback("-20 XP per HINT");

    const nextMove = findNextMove();
    if (nextMove) {
        const hintBlock = grid.children[nextMove.blockIdx];
        hintBlock.classList.add('block-hint');
        setTimeout(() => {
            hintBlock.classList.remove('block-hint');
        }, 1000); // Rimuovi l'highlight dopo 1 secondo
    } else {
        showFeedback("Nessun HINT disponibile (Livello bloccato?)");
    }
}


// --- GESTIONE VITTORIA E UI ---
function handleWin() {
    stopTimer();
    winSfx.play();
    showFeedback(`LIVELLO COMPLETATO! +50 XP (${formatTime(seconds)})`);
    xp += 50;
    currentLvl++;

    if (bestTime === 0 || seconds < bestTime) {
        bestTime = seconds;
        localStorage.setItem('mk_best_time', bestTime);
    }

    localStorage.setItem('mk_xp_full', xp);
    localStorage.setItem('mk_lvl_full', currentLvl);

    setTimeout(() => {
        generateDynamicLevel();
    }, 500);
}

function resetCurrentLevel() {
    blocks = JSON.parse(JSON.stringify(initialLayout));
    renderBlocks();
    moves = 0;
    seconds = 0;
    document.getElementById('moves').innerText = moves;
    startTimer(); // Reset del timer
}

function updateUI() {
    document.getElementById('lvl').innerText = currentLvl;
    document.getElementById('moves').innerText = moves;
    document.getElementById('timer').innerText = formatTime(seconds);
    document.getElementById('xp').innerText = xp;
    
    const progress = (xp % 200) / 2; // XP per rank
    document.getElementById('progress-fill').style.width = progress + "%";
    
    const ranks = ["NOVICE", "APPRENTICE", "CARPENTER", "LOCKSMITH", "KEY MASTER", "GRAND MASTER"];
    document.getElementById('rank-label').innerText = ranks[Math.min(Math.floor(xp/200), ranks.length - 1)];
}

function formatTime(s) {
    let
