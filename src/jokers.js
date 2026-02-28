export let jokers = [];
export const MAX_JOKER_SLOTS = 3;
export let jokerDraftTimer = 0;
export const JOKER_DRAFT_INTERVAL = 120;
export let bloodthirstyStacks = 0;
export let momentumTimer = 0;
export let momentumSpeed = 0;

export const JOKER_DEFS = [
    {
        id: "bloodthirsty",
        name: "Bloodthirsty",
        desc: "+1 damage per kill, resets on hit",
        color: "#c62828"
    },
    {
        id: "highroller",
        name: "High Roller",
        desc: "Hand effects use highest card value",
        color: "#FFD700"
    },
    {
        id: "vampire",
        name: "Vampire",
        desc: "Killing enemies heals 1 HP",
        color: "#6a1b9a"
    },
    {
        id: "glasscannon",
        name: "Glass Cannon",
        desc: "2x bullet damage, -50% max health",
        color: "#b0bec5"
    },
    {
        id: "momentum",
        name: "Momentum",
        desc: "Speed increases while moving, resets on stop",
        color: "#0288d1"
    },
];

export function hasJoker(id) {
    return jokers.some(j => j.id === id);
}

export function applyJoker(joker, { getBulletDamage, setBulletDamage, getMaxPlayerHealth, setMaxPlayerHealth, getPlayerHealth, setPlayerHealth, getDiscardRefresh, setDiscardRefresh }) {
    jokers.push(joker);

    if (joker.id === "glasscannon") {
        const newDamage = getBulletDamage() * 2;
        setBulletDamage(newDamage);
        const newMax = Math.max(10, Math.floor(getMaxPlayerHealth() * 0.5));
        setMaxPlayerHealth(newMax);
        setPlayerHealth(Math.min(getPlayerHealth(), newMax));
    }

    if (joker.id === "dealer") {
        setDiscardRefresh(Math.max(1, Math.floor(getDiscardRefresh() / 2)));
    }
}

export function openJokerDraft(currentJokers, shuffle) {
    if (currentJokers.length >= MAX_JOKER_SLOTS) return null;

    const available = JOKER_DEFS.filter(j => !currentJokers.some(e => e.id === j.id));
    if (available.length === 0) return null;

    const shuffled = shuffle([...available]);
    const options = shuffled.slice(0, Math.min(3, shuffled.length));

    return { cards: null, jokers: options, activeIndex: 0, isJoker: true };
}

export function updateJokerTimers(delta, jokerDraftTimerVal, addNotification, openDraftFn) {
    let newTimer = jokerDraftTimerVal + delta;
    if (newTimer >= JOKER_DRAFT_INTERVAL) {
        newTimer = 0;
        openDraftFn();
    }
    return newTimer;
}

export function updateMomentum(delta, keys, momentumTimerVal) {
    const moving = keys["w"] || keys["s"] || keys["a"] || keys["d"];
    if (moving) {
        const newTimer = momentumTimerVal + delta;
        const newSpeed = Math.min(200, newTimer * 40);
        return { momentumTimer: newTimer, momentumSpeed: newSpeed };
    } else {
        return { momentumTimer: 0, momentumSpeed: 0 };
    }
}

export function onEnemyKilled(ex, ey, enemies, bullets, BULLET_SPEED) {
    const results = { bloodthirstyIncrement: false, vampireHeal: false, chainBullet: null };

    if (hasJoker("bloodthirsty")) {
        results.bloodthirstyIncrement = true;
    }

    if (hasJoker("vampire")) {
        results.vampireHeal = true;
    }

    if (hasJoker("chain") && enemies.length > 1) {
        let nearest = null;
        let nearestDist = Infinity;
        for (const other of enemies) {
            const dist = Math.hypot(other.x - ex, other.y - ey);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = other;
            }
        }
        if (nearest) {
            const cdx = nearest.x - ex;
            const cdy = nearest.y - ey;
            const clen = Math.hypot(cdx, cdy);
            results.chainBullet = {
                x: ex,
                y: ey,
                vx: (cdx / clen) * BULLET_SPEED,
                vy: (cdy / clen) * BULLET_SPEED,
                life: 1.5,
                isChain: true
            };
        }
    }

    return results;
}

export function onPlayerHit() {
    if (hasJoker("bloodthirsty")) {
        bloodthirstyStacks = 0;
    }
}

export function resetJokers() {
    jokers = [];
    jokerDraftTimer = 0;
    bloodthirstyStacks = 0;
    momentumTimer = 0;
    momentumSpeed = 0;
}

export function getEffectCard(cards) {
    return hasJoker("highroller") ? cards[0] : cards[4];
}