// Everything that moves: the warden, the ember creatures, bolts, drops and sparks.
// Pure data plus small update functions — no drawing here, no DOM here.
import { ENEMIES, LIGHTHOUSE, PLAYER, W, H } from './config.js';

export function makePlayer() {
  return {
    x: W / 2, y: H / 2 + 170, r: PLAYER.r, hp: PLAYER.maxHp, maxHp: PLAYER.maxHp,
    aim: -Math.PI / 2, fireTimer: 0, invuln: 0, moving: false,
    damage: PLAYER.bulletDamage, fireInterval: PLAYER.fireInterval, speed: PLAYER.speed,
  };
}

export function makeEnemy(kind, x, y, rng) {
  const def = ENEMIES[kind];
  const hpMul = 1;
  return {
    kind, def, x, y, r: def.r, hp: def.hp * hpMul, maxHp: def.hp * hpMul,
    speed: def.speed * rng.range(0.9, 1.1), score: def.score, embers: def.embers,
    phase: rng.angle(), wobble: kind === 'bat' ? rng.range(40, 90) : 0,
    flash: 0, spawnT: 0,
  };
}

export function makeBullet(x, y, angle, damage) {
  return { x, y, vx: Math.cos(angle) * 640, vy: Math.sin(angle) * 640, r: 5, damage, life: 1.1 };
}

export function makeEmberDrop(x, y, value) {
  return { x, y, value, vx: 0, vy: 0, t: 0, r: 7 };
}

export function makeParticle(x, y, color, speed, life, size) {
  const a = Math.random() * Math.PI * 2;
  return { x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life, maxLife: life, size };
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

export function spawnEdgePoint(rng) {
  const side = rng.int(0, 3);
  const m = 30;
  if (side === 0) return { x: rng.range(m, W - m), y: -m };
  if (side === 1) return { x: W + m, y: rng.range(m, H - m) };
  if (side === 2) return { x: rng.range(m, W - m), y: H + m };
  return { x: -m, y: rng.range(m, H - m) };
}

export function updateEnemy(e, dt, player, lighthouse, time) {
  e.flash = Math.max(0, e.flash - dt * 6);
  e.spawnT += dt;
  const tx = lighthouse.x, ty = lighthouse.y;
  let dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d; dy /= d;
  if (e.kind === 'bat') {
    // Bats weave and sometimes veer at the warden instead of the light.
    const toPlayer = Math.hypot(player.x - e.x, player.y - e.y);
    if (toPlayer < 240) {
      dx = (player.x - e.x) / (toPlayer || 1);
      dy = (player.y - e.y) / (toPlayer || 1);
    }
    const wob = Math.sin(time * 3 + e.phase) * e.wobble;
    e.x += (dx * e.speed + -dy * wob) * dt;
    e.y += (dy * e.speed + dx * wob) * dt;
  } else if (e.kind === 'titan') {
    // The Titan lumbers at the lighthouse and shrugs off knockback.
    e.x += dx * e.speed * dt;
    e.y += dy * e.speed * dt;
  } else {
    e.x += dx * e.speed * dt;
    e.y += dy * e.speed * dt;
  }
  // Drift slightly so paths never look perfectly straight.
  e.x += Math.sin(time * 0.8 + e.phase) * 6 * dt;
}

export function updateBullet(b, dt) {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.life -= dt;
}

export function updateEmberDrop(drop, dt, player) {
  drop.t += dt;
  const d = Math.hypot(player.x - drop.x, player.y - drop.y);
  if (d < 170) {
    // Magnet: drops fly to the warden once close.
    const pull = 900 * (1 - d / 200);
    drop.vx += ((player.x - drop.x) / (d || 1)) * pull * dt;
    drop.vy += ((player.y - drop.y) / (d || 1)) * pull * dt;
  } else {
    drop.vx *= 0.92; drop.vy *= 0.92;
  }
  drop.x += drop.vx * dt;
  drop.y += drop.vy * dt;
}

export function updateParticle(p, dt) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= 0.96; p.vy *= 0.96;
  p.life -= dt;
}
