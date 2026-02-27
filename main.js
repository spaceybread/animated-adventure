import {
    initGraphics,
    drawWorld,
    drawUI,
    drawPlayer,
    drawBullets,
    drawEnemies,
    drawHand
} from "./graphics.js";
import {
    initLogic,
    updateLogic,
    getState
} from "./logic.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

initGraphics(canvas, ctx);
initLogic(canvas);

let lastTime = performance.now();

function gameLoop(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    updateLogic(delta);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const state = getState();

    drawWorld(state.camera);
    drawPlayer(state.player, state.camera);
    drawEnemies(state.enemies, state.camera);
    drawBullets(state.bullets, state.camera); 
    drawUI(state);
    drawHand(state.hand, state.selected, state.activeIndex);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);