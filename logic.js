let canvas;

const PLAYER_SPEED = 200;
const ENEMY_SPEED = 60;

let keys = {};
let player;
let camera;
let enemies;
let score;
let startTime;

let hand = [];
let deck = [];
let selected = new Set();
let activeIndex = 0;
let discards = 3;
let lastDiscardUpdate = 0; 
let remHands = 5; 
let lastHandUpdate = 0;
let playedHand = "None!"; 

let maxHandSize = 7;

let playerHealth = 100;
let bullets = [];
let mouseWorld = { x: 0, y: 0 };
const BULLET_SPEED = 500;
const BULLET_DAMAGE = 25;
const ENEMY_MAX_HEALTH = 100;
let maxPlayerHealth = 100;

let gameStageModifier = 1; 

function sortHand() {
    hand.sort((b, a) => a.value - b.value);
}


function createDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const values = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    const deck = [];

    for (const suit of suits) {
        for (let i = 0; i < ranks.length; i++) {
            deck.push({
                suit,
                rank: ranks[i],
                value: values[i]
            });
        }
    }

    return deck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


export function initLogic(c) {
    canvas = c;

    deck = shuffle(createDeck());
    hand = deck.splice(0, maxHandSize);
    sortHand();
    selected.clear();
    activeIndex = 0;

    player = {
        x: 0,
        y: 0,
        size: 16
    };
    camera = {
        x: 0,
        y: 0
    };
    enemies = [];
    score = 0;
    startTime = performance.now();
    
    playerHealth = 100;
    bullets = [];

    document.addEventListener("mousemove", e => {
        mouseWorld.x = e.clientX + camera.x;
        mouseWorld.y = e.clientY + camera.y;
    });

    document.addEventListener("click", shootBullet);

    document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
    document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
    document.addEventListener("keydown", handleCardInput);
}

function handleCardInput(e) {
    if (hand.length === 0) return;

    if (e.key === "ArrowRight") {
        activeIndex = (activeIndex + 1) % hand.length;
    }

    if (e.key === "ArrowLeft") {
        activeIndex = (activeIndex - 1 + hand.length) % hand.length;
    }

    if (e.key === "ArrowUp") {
        selected.add(activeIndex);
    }

    if (e.key === "ArrowDown") {
        selected.delete(activeIndex);
    }

    if (e.key === "Enter") {
        let selectedCards = [...selected].map(i => hand[i]); 
        if (selectedCards.length != 5) return; 

        if (remHands == 0) return; 
        scoreSelectedCards(selectedCards);
        discardSelected(false);
        sortHand();
        remHands -=1; 
    }

    if (e.key === "Shift") {


        discardSelected(true);
        sortHand();
    }
}

function shootBullet() {
    const dx = mouseWorld.x - player.x;
    const dy = mouseWorld.y - player.y;
    const len = Math.hypot(dx, dy);
    bullets.push({
        x: player.x,
        y: player.y,
        vx: (dx / len) * BULLET_SPEED,
        vy: (dy / len) * BULLET_SPEED,
        life: 2 
    });
}

function discardSelected(isCounted) {

    if (discards == 0 && isCounted) {
        return; 
    }

    

    const newHand = [];

    for (let i = 0; i < hand.length; i++) {
        if (!selected.has(i)) {
            newHand.push(hand[i]);
        }
    }

    if (newHand.length == hand.length) {
        return; 
    }

    if (isCounted) discards -= 1; 

    const needed = maxHandSize - newHand.length;

    for (let i = 0; i < needed; i++) {
        if (deck.length === 0) {
            deck = shuffle(createDeck());
        }
        newHand.push(deck.pop());
    }

    hand = newHand;
    selected.clear();
    activeIndex = 0;
}

function scoreSelectedCards(cards) {
    let isFlush = true; 
    for (let i = 1; i < cards.length; i++) isFlush = isFlush && (cards[0].suit == cards[i].suit); 

    let isStraight = true; 
    
    if (cards[0].value == 14 && cards[1].value == 5) {
        isStraight = cards[2].value == 4 && cards[3].value == 3 && cards[4].value == 2; 
    } else {
        for (let i = 1; i < cards.length; i++) {
            isStraight = isStraight && (cards[0].value - cards[i].value == i); 
        }
    }

    if (isStraight && isFlush) {
        if (cards[4].value == 10) {
            // royal flush
            playedHand = "Royal Flush"; 
            return; 
        } else {
            // straight flush
            playedHand = "Straight Flush"; 
            return; 
        }
    }

    const frequency = {};

    cards.forEach(element => {
        if (frequency[element.value]) {
            frequency[element.value]++;
        } else {
            frequency[element.value] = 1;
        }
    });

    let uniqueCards = Object.keys(frequency).length;
    if (uniqueCards == 2) {
        // either four of kind or full house

        if (frequency[cards[0].value] == 1 || frequency[cards[0].value] == 4) {
            playedHand = "Four of a Kind";

            // get a larger hand
            maxHandSize += 1; 
            return; 
        } else {
            playedHand = "Full House";
            
            return; 
        }
    }

    if (isFlush) {
        maxPlayerHealth += cards[0].value; 
        playedHand = "Flush";
        return; 
    }

    if (isStraight) {
        // straight
        playedHand = "Straight";
        return;     
    }

    if (uniqueCards == 3) {
        // either three of a kind of two pair
        let hasSingle = false; 
        
        for (let i = 0; i < cards.length; i++) hasSingle = hasSingle || (frequency[cards[i].value] == 1); 
        
        if (!hasSingle) {
            playedHand = "Three of a Kind"; 
            return; 
        } else {
            playedHand = "Two Pair"; 
            return; 
        }
    }

    if (uniqueCards == 4) {
        playedHand = "Pair"; 
        return; 
    }

    // high card lmao
    playedHand = "High Card"; 
    // heal the player
    playerHealth = Math.min(maxPlayerHealth, playerHealth + cards[0].value);
    return; 
}

export function updateLogic(delta) {
    let dx = 0,
        dy = 0;

    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        player.x += dx * PLAYER_SPEED * delta;
        player.y += dy * PLAYER_SPEED * delta;

        score += delta * 10;
    }

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    spawnEnemies(delta);
    updateEnemies(delta);
    updateBullets(delta);
    checkPlayerEnemyCollision();
}

function spawnEnemies(delta) {
    if (Math.random() < delta * 1.5 * gameStageModifier) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 800;

        enemies.push({
            x: player.x + Math.cos(angle) * dist,
            y: player.y + Math.sin(angle) * dist,
            size: 14,
            health: ENEMY_MAX_HEALTH
        });
    }
}

function updateEnemies(delta) {
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const len = Math.hypot(dx, dy);

        e.x += (dx / len) * ENEMY_SPEED * gameStageModifier * delta;
        e.y += (dy / len) * ENEMY_SPEED * gameStageModifier * delta;
    }
}

function updateBullets(delta) {
    for (const b of bullets) {
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.life -= delta;
    }

    for (const b of bullets) {
        for (const e of enemies) {
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            if (Math.hypot(dx, dy) < e.size) {
                e.health -= BULLET_DAMAGE;
                b.life = 0;
            }
        }
    }

    bullets = bullets.filter(b => b.life > 0);
    enemies = enemies.filter(e => e.health > 0);
}

function checkPlayerEnemyCollision() {
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (Math.hypot(dx, dy) < player.size / 2 + e.size) {
            playerHealth -= 20; 
            const len = Math.hypot(dx, dy);
            e.x -= (dx / len) * 30;
            e.y -= (dy / len) * 30;
        }
    }
    playerHealth = Math.max(0, playerHealth);
}

export function getState() {
    let timeScore = (performance.now() - startTime) / 1000; 
    
    if (timeScore - lastDiscardUpdate > 20) {
        if (discards < 3) discards += 1; 
        lastDiscardUpdate = timeScore; 
    }

    if (timeScore - lastHandUpdate > 30) {
        if (remHands < 5) remHands += 1; 
        lastHandUpdate = timeScore; 
    }

    return {
        player,
        camera,
        playerHealth,
        playerMaxHealth: maxPlayerHealth,
        bullets,
        enemies,
        score,
        remHands, 
        discards,
        playedHand, 
        timeAlive: timeScore,
        hand,
        selected,
        activeIndex
    };
}