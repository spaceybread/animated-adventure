let canvas, ctx;

const TILE_SIZE = 48;

let grassTile, darkGrassTile, dirtTile, stoneTile;

let mouse = {
    x: 0,
    y: 0
};

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

export function initGraphics(c, context) {
    canvas = c;
    ctx = context;

    grassTile = createTileTexture(["#2e7d32", "#388e3c", "#1b5e20"]);
    darkGrassTile = createTileTexture(["#1b5e20", "#0f3d13"]);
    dirtTile = createTileTexture(["#6d4c41", "#5d4037"]);
    stoneTile = createTileTexture(["#888888", "#919191"]);
}

function createTileTexture(colors) {
    const off = document.createElement("canvas");
    off.width = 16;
    off.height = 16;
    const octx = off.getContext("2d");
    octx.imageSmoothingEnabled = false;

    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
            const c = colors[Math.floor(Math.random() * colors.length)];
            octx.fillStyle = c;
            octx.fillRect(x, y, 1, 1);
        }
    }

    return off;
}

function random2D(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothNoise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    const n0 = random2D(x0, y0);
    const n1 = random2D(x1, y0);
    const ix0 = lerp(n0, n1, sx);

    const n2 = random2D(x0, y1);
    const n3 = random2D(x1, y1);
    const ix1 = lerp(n2, n3, sx);

    return lerp(ix0, ix1, sy);
}

export function drawWorld(camera) {
    const startX = Math.floor(camera.x / TILE_SIZE) - 1;
    const startY = Math.floor(camera.y / TILE_SIZE) - 1;

    const endX = startX + Math.ceil(canvas.width / TILE_SIZE) + 3;
    const endY = startY + Math.ceil(canvas.height / TILE_SIZE) + 3;

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const noise = smoothNoise(x * 0.1, y * 0.1);

            let texture;
            if (noise < 0.1) texture = stoneTile;   
            else if (noise < 0.35) texture = dirtTile;
            else if (noise < 0.6) texture = darkGrassTile;
            else texture = grassTile;

            ctx.drawImage(
                texture,
                x * TILE_SIZE - camera.x,
                y * TILE_SIZE - camera.y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
}

export function drawPlayer(player, camera) {
    ctx.fillStyle = "red";
    ctx.fillRect(
        player.x - camera.x - player.size / 2,
        player.y - camera.y - player.size / 2,
        player.size,
        player.size
    );
}


export function drawHand(hand, selected, activeIndex) {
    const cardWidth = 100;
    const cardHeight = 150;
    const spacing = 20;

    const totalWidth =
        hand.length * cardWidth + (hand.length - 1) * spacing;

    const startX = canvas.width / 2 - totalWidth / 2;
    const baseY = canvas.height - cardHeight - 20;

    hand.forEach((card, i) => {
        const x = startX + i * (cardWidth + spacing);

        const isActive = i === activeIndex;
        const isSelected = selected.has(i);

        const lift = isActive ? -20 : 0;

        drawCard(
            x,
            baseY + lift + 75,
            cardWidth,
            cardHeight,
            card,
            isSelected
        );
    });
}

function drawCard(x, y, w, h, card, isSelected) {

    let colorMap = {
        "♥": "red", 
        "♦": "orange", 
        "♠": "black",
        "♣": "blue" 
    }

    ctx.fillStyle = isSelected ? "#FFD700" : "white";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);



    ctx.fillStyle = colorMap[card.suit]; 

    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(card.rank, x + 8, y + 22);

    ctx.font = "16px monospace";
    ctx.fillText(card.suit, x + 8, y + 40);

    ctx.save();
    ctx.translate(x + w - 8, y + h - 8);
    ctx.rotate(Math.PI);
    ctx.textAlign = "left";
    ctx.font = "bold 18px monospace";
    ctx.fillText(card.rank, 0, -10);
    ctx.font = "16px monospace";
    ctx.fillText(card.suit, 0, 8);
    ctx.restore();

    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.fillText(card.suit, x + w / 2, y + h / 2 + 15);
}

export function drawEnemies(enemies, camera) {
    for (const e of enemies) {
        ctx.fillStyle = "purple";
        ctx.fillRect(
            e.x - camera.x - e.size / 2,
            e.y - camera.y - e.size / 2,
            e.size,
            e.size
        );

        const barW = 30, barH = 4;
        const bx = e.x - camera.x - barW / 2;
        const by = e.y - camera.y - e.size / 2 - 8;
        ctx.fillStyle = "#333";
        ctx.fillRect(bx, by, barW, barH);

        ctx.fillStyle = "#e53935";
        ctx.fillRect(bx, by, barW * (e.health / 100), barH);
    }
}

export function drawBullets(bullets, camera) {
    ctx.fillStyle = "yellow";
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x - camera.x, b.y - camera.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawUI(state) {
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";

    ctx.textAlign = "left";
    ctx.fillText(`Time Alive: ${state.timeAlive.toFixed(1)}s`, 20, 45);
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${Math.floor(state.score)}`, canvas.width - 20, 45);
    ctx.textAlign = "left";
    ctx.fillText(`Last Hand: ${state.playedHand}`, 20, 70);
    ctx.fillText(`Hands | Discards: ${state.remHands} | ${state.discards}`, 20, 95);


    const barW = canvas.width, barH = 20;
    const bx = 0, by = 0;
    ctx.fillStyle = "#333";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "#43a047";
    ctx.fillRect(bx, by, barW * (state.playerHealth / state.playerMaxHealth), barH);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    ctx.fillText(`HP: ${state.playerHealth} / ${state.playerMaxHealth}`, bx + 4, by + 15);
}