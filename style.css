:root {
    --cyan: #00f3ff;
    --magenta: #ff00ff;
    --gold: #ffcc00;
    --cell: 52px;
}

body, html {
    margin: 0; padding: 0; width: 100vw; height: 100vh;
    overflow: hidden; background: #000; font-family: 'Courier New', monospace;
    touch-action: none;
}

/* Sfondo con profondità */
.background-city {
    position: fixed; inset: 0;
    background: url('https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&w=1500&q=80');
    background-size: cover; background-position: center;
    filter: blur(8px) brightness(0.3); z-index: -1;
}

.interface {
    height: 100vh; display: flex; flex-direction: column;
    justify-content: space-around; align-items: center;
    padding: 10px;
}

/* Board Olografica */
.holo-board {
    width: 312px; height: 312px; position: relative;
    border: 2px solid var(--cyan);
    background: rgba(0, 243, 255, 0.05);
    box-shadow: 0 0 30px rgba(0, 243, 255, 0.2), inset 0 0 20px rgba(0, 243, 255, 0.1);
}

.holo-board::before {
    content: ""; position: absolute; inset: 0;
    background-image: linear-gradient(var(--cyan) 1px, transparent 1px),
                      linear-gradient(90deg, var(--cyan) 1px, transparent 1px);
    background-size: 52px 52px; opacity: 0.3;
}

/* BLOCCHI HI-TECH */
.block {
    position: absolute; border-radius: 2px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    display: flex; align-items: center; justify-content: center;
    /* Effetto "Circuito Interno" */
    background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 8px 8px;
}

.block-h { 
    background-color: rgba(0, 243, 255, 0.2); 
    box-shadow: 0 0 15px var(--cyan), inset 0 0 10px var(--cyan);
}

.block-v { 
    background-color: rgba(255, 0, 255, 0.2); 
    box-shadow: 0 0 15px var(--magenta), inset 0 0 10px var(--magenta);
}

/* Chiave Olografica con "K" */
.block-key {
    background-color: rgba(255, 204, 0, 0.3);
    border: 2px solid var(--gold);
    box-shadow: 0 0 25px var(--gold), inset 0 0 15px var(--gold);
}
.block-key::after {
    content: "K"; color: var(--gold); font-size: 24px; font-weight: bold;
    text-shadow: 0 0 10px var(--gold);
}

/* UI */
.top-stats { width: 312px; display: flex; justify-content: space-between; color: var(--cyan); text-shadow: 0 0 5px var(--cyan); }
.cyber-btn {
    background: transparent; border: 1px solid var(--cyan); color: var(--cyan);
    padding: 8px 15px; border-radius: 4px; cursor: pointer; text-transform: uppercase;
}
.cyber-btn.active { background: var(--cyan); color: #000; box-shadow: 0 0 15px var(--cyan); }
