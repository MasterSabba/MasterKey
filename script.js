// --- CONFIGURAZIONE ---
const TOTAL_LEVELS = 100;
const LEVELS_PER_PAGE = 20; // 5 righe x 4 colonne come in foto
const STORAGE_KEY = 'masterKey_levelProgress'; // Chiave per il salvataggio in locale

// --- VARIABILI DI STATO ---
let currentLevel = 1; // Il livello che l'utente sta giocando
let unlockedLevels = parseInt(localStorage.getItem(STORAGE_KEY)) || 1; // Livello massimo sbloccato
let currentSelectionPage = 0; // Pagina corrente nella schermata di selezione

// --- ELEMENTI DOM (HTML) ---
let gameInterface;
let levelSelectionInterface;
let levelGrid;
let currentLevelDisplay;
let prevPageBtn;
let nextPageBtn;
let pageIndicator;
let backToSelectionBtn;
let completeLevelBtn; // Un pulsante temporaneo nel gioco per testare lo sblocco

// --- INIZIALIZZAZIONE ---
window.addEventListener('DOMContentLoaded', () => {
    // Collega gli elementi DOM
    gameInterface = document.getElementById("game-interface");
    levelSelectionInterface = document.getElementById("level-selection-interface");
    levelGrid = document.getElementById("level-grid");
    currentLevelDisplay = document.getElementById("current-level-display");
    prevPageBtn = document.getElementById("prev-page");
    nextPageBtn = document.getElementById("next-page");
    pageIndicator = document.getElementById("page-indicator");
    backToSelectionBtn = document.getElementById("back-to-selection");
    completeLevelBtn = document.getElementById("complete-level-btn"); // Pulsante di test

    // Aggiungi listener per i pulsanti di navigazione
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));
    backToSelectionBtn.addEventListener('click', showLevelSelection);
    
    // Pulsante temporaneo per simulare il completamento di un livello
    completeLevelBtn.addEventListener('click', simulateLevelCompletion);

    // Inizialmente mostra la selezione livelli
    showLevelSelection();
});

// --- FUNZIONI DI INTERFACCIA ---

// Mostra la schermata di selezione livelli e nasconde il gioco
function showLevelSelection() {
    gameInterface.style.display = "none";
    levelSelectionInterface.style.display = "flex";
    backToSelectionBtn.style.display = "none"; // Nascondi il tasto "indietro" mentre sei nella selezione
    renderLevelGrid();
    updateNavigationButtons();
}

// Mostra la schermata di gioco e nasconde la selezione livelli
function loadLevel(levelNumber) {
    if (levelNumber > unlockedLevels) return; // Non caricare se bloccato

    currentLevel = levelNumber;
    gameInterface.style.display = "flex";
    levelSelectionInterface.style.display = "none";
    backToSelectionBtn.style.display = "block"; // Mostra il tasto per tornare indietro
    
    // Aggiorna la visualizzazione del livello corrente nel gioco
    currentLevelDisplay.innerText = currentLevel;

    // --- QUI ANDREBBE IL TUO CODICE PER INIZIALIZZARE IL LIVELLO CORRENTE ---
    console.log(`Caricamento del livello ${currentLevel}...`);
    // Esempio: generateBlocksForLevel(currentLevel);
}

// --- LOGICA DI SELEZIONE LIVELLI ---

// Genera dinamicamente la griglia di pulsanti per i livelli
function renderLevelGrid() {
    levelGrid.innerHTML = ''; // Svuota la griglia

    const startIndex = currentSelectionPage * LEVELS_PER_PAGE;
    const endIndex = Math.min(startIndex + LEVELS_PER_PAGE, TOTAL_LEVELS);

    for (let i = startIndex; i < endIndex; i++) {
        const levelNumber = i + 1;
        const levelEl = document.createElement("div");
        
        // Determina la classe in base allo stato
        if (levelNumber < unlockedLevels) {
            levelEl.className = "level-item completed"; // Già svolto (rifabile)
            levelEl.innerText = levelNumber;
        } else if (levelNumber === unlockedLevels) {
            levelEl.className = "level-item current"; // Livello corrente da svolgere
            levelEl.innerText = levelNumber;
        } else {
            levelEl.className = "level-item locked"; // Bloccato
            // Aggiungi icona lucchetto (puoi usare un'immagine o un carattere speciale)
            const lockIcon = document.createElement("span");
            lockIcon.innerHTML = "&#128274;"; // Lucchetto (🔒)
            levelEl.appendChild(lockIcon);
        }

        // Aggiungi listener per il click
        levelEl.addEventListener('click', () => loadLevel(levelNumber));
        
        levelGrid.appendChild(levelEl);
    }

    // Aggiorna l'indicatore di pagina
    pageIndicator.innerText = `${currentSelectionPage + 1} / ${Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE)}`;
}

// Gestisce il cambio pagina
function changePage(direction) {
    const totalPages = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);
    const nextPage = currentSelectionPage + direction;

    if (nextPage >= 0 && nextPage < totalPages) {
        currentSelectionPage = nextPage;
        renderLevelGrid();
        updateNavigationButtons();
    }
}

// Abilita/disabilita i pulsanti di navigazione
function updateNavigationButtons() {
    const totalPages = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);
    prevPageBtn.disabled = (currentSelectionPage === 0);
    nextPageBtn.disabled = (currentSelectionPage === totalPages - 1);
}

// --- LOGICA DI SALVATAGGIO PROGRESSI ---

// Salva il livello massimo sbloccato nel localStorage
function saveProgress() {
    localStorage.setItem(STORAGE_KEY, unlockedLevels);
}

// Simula il completamento del livello corrente (da chiamare quando il puzzle è risolto)
function simulateLevelCompletion() {
    console.log(`Livello ${currentLevel} completato!`);

    // Se abbiamo completato il livello corrente "massimo", sblocchiamo il successivo
    if (currentLevel === unlockedLevels && unlockedLevels < TOTAL_LEVELS) {
        unlockedLevels++;
        saveProgress();
        console.log(`Nuovo livello sbloccato: ${unlockedLevels}`);
    } else if (currentLevel < unlockedLevels) {
        console.log("Livello già completato in precedenza, nessun nuovo sblocco.");
    } else if (currentLevel === TOTAL_LEVELS) {
        console.log("Gioco completato! Congratulazioni!");
    }

    // Dopo il completamento, torna alla selezione livelli
    setTimeout(showLevelSelection, 1000); // Piccolo ritardo per feedback
}
