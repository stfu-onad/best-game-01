// The game itself: states, waves, the shop, scoring and the combo chain.
// Rendering lives in render.js; this file decides what happens, never how it looks.
import {
  W, H, LIGHTHOUSE, PLAYER, WAVES, TOTAL_WAVES, SHOP, shopCost,
  COMBO_WINDOW, COMBO_MAX,
} from './config.js';
import { makeRng } from './random.js';
import {
  makePlayer, makeEnemy, makeBullet, makeEmberDrop, makeParticle,
  dist2, spawnEdgePoint, updateEnemy, updateBullet, updateEmberDrop, updateParticle,
} from './entities.js';
import { sfx, ensureAudio } from './audio.js';

export class Game {
  constructor(seed) {
    this.rngSeed = seed == null ? (Math.random() * 0xffffffff) >>> 0 : seed;
    this.rng = makeRng(this.rngSeed);
    this.state = 'title'; // title | playing | shop | victory | defeat
    this.time = 0;
    this.player = makePlayer();
    this.lighthouseHp = LIGHTHOUSE.maxHp;
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.particles = [];
    this.stars = this.makeStars();
    this.wave = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.embers = 0;
    this.kills = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.bestCombo = 1;
    this.shopOwned = { damage: 0, rate: 0, speed: 0, repair: 0, heart: 0 };
    this.shopTimer = 0;
    this.shake = 0;
    this.beamAngle = 0;
    this.message = '';
    this.messageTimer = 0;
    this.stats = { shots: 0, hits: 0 };
  }

  makeStars() {
    const stars = [];
    for (let i = 0; i < 130; i++) {
      stars.push({
        x: this.rng.range(0, W), y: this.rng.range(0, H * 0.62),
        r: this.rng.range(0.6, 1.9), tw: this.rng.range(0, Math.PI * 2),
      });
    }
    return stars;
  }

  startGame() {
    ensureAudio();
    const seed = this.rngSeed;
    const fresh = new Game(seed);
    Object.assign(this, fresh);
    this.state = 'playing';
    this.beginWave(1);
  }

  beginWave(n) {
    this.state = 'playing';
    this.wave = n;
    const def = WAVES[n - 1];
    this.spawnQueue = [];
    for (let i = 0; i < def.wisps; i++) this.spawnQueue.push('wisp');
    for (let i = 0; i < def.bats; i++) this.spawnQueue.push('bat');
    for (let i = 0; i < def.golems; i++) this.spawnQueue.push('golem');
    // Shuffle the queue so the wave never arrives in neat rows.
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
    if (def.titan) this.spawnQueue.push('titan');
    this.spawnTimer = 0.6;
    this.waveActive = true;
    this.waveInterval = def.interval;
    this.showMessage(n === TOTAL_WAVES ? 'FINAL WAVE — THE ASH TITAN' : `WAVE ${n}`);
    if (def.titan) sfx.boss(); else sfx.horn();
  }

  showMessage(text) { this.message = text; this.messageTimer = 2.4; }

  buy(item) {
    const owned = this.shopOwned[item.id];
    if (owned >= item.max) { sfx.denied(); return false; }
    const cost = shopCost(item, owned);
    if (this.embers < cost) { sfx.denied(); return false; }
    this.embers -= cost;
    this.shopOwned[item.id] = owned + 1;
    const p = this.player;
    if (item.id === 'damage') p.damage += 1;
    if (item.id === 'rate') p.fireInterval *= 0.8;
    if (item.id === 'speed') p.speed *= 1.12;
    if (item.id === 'repair') this.lighthouseHp = Math.min(LIGHTHOUSE.maxHp, this.lighthouseHp + 30);
    if (item.id === 'heart') { p.maxHp += 1; p.hp = Math.min(p.maxHp, p.hp + 1); }
    sfx.buy();
    return true;
  }

  killEnemy(e, index) {
    this.enemies.splice(index, 1);
    this.kills += 1;
    const gained = e.score * this.combo;
    this.score += gained;
    if (this.comboTimer > 0) this.combo = Math.min(COMBO_MAX, this.combo + 1);
    else this.combo = 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = COMBO_WINDOW;
    for (let i = 0; i < e.embers; i++) {
      const a = this.rng.angle();
      this.drops.push(makeEmberDrop(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, 1));
    }
    for (let i = 0; i < 14; i++) {
      this.particles.push(makeParticle(e.x, e.y, e.def.color, 120 + this.rng.range(0, 160), 0.5 + this.rng.range(0, 0.3), 2 + this.rng.range(0, 3)));
    }
    if (e.kind === 'titan') {
      this.shake = 0.6;
      for (let i = 0; i < 60; i++) {
        this.particles.push(makeParticle(e.x, e.y, i % 2 ? '#ff8a3c' : '#ffd166', 200 + this.rng.range(0, 260), 0.8 + this.rng.range(0, 0.6), 3 + this.rng.range(0, 4)));
      }
    }
    sfx.kill();
  }

  damageLighthouse(e, index) {
    this.enemies.splice(index, 1);
    this.lighthouseHp -= e.def.dmgLighthouse;
    this.shake = Math.max(this.shake, 0.35);
    for (let i = 0; i < 10; i++) {
      this.particles.push(makeParticle(LIGHTHOUSE.x, LIGHTHOUSE.y, '#ff4d4d', 140, 0.5, 3));
    }
    sfx.lighthouseHit();
    if (this.lighthouseHp <= 0) {
      this.lighthouseHp = 0;
      this.endGame(false, 'The light went out.');
    }
  }

  damagePlayer(e, index) {
    const p = this.player;
    if (p.invuln > 0) return;
    this.enemies.splice(index, 1);
    p.hp -= e.def.dmgPlayer;
    p.invuln = PLAYER.invulnTime;
    this.shake = Math.max(this.shake, 0.3);
    sfx.hurt();
    if (p.hp <= 0) {
      p.hp = 0;
      this.endGame(false, 'The warden has fallen.');
    }
  }

  endGame(won, reason) {
    this.state = won ? 'victory' : 'defeat';
    this.endReason = reason;
    if (won) sfx.victory(); else sfx.defeat();
  }

  update(dt, input) {
    this.time += dt;
    this.beamAngle += dt * 0.55;
    this.shake = Math.max(0, this.shake - dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 1;
    for (const p of this.particles) updateParticle(p, dt);
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.state === 'title') {
      if (input.pressed('Enter', 'Space') || input.click()) this.startGame();
      return;
    }
    if (this.state === 'victory' || this.state === 'defeat') {
      if (input.pressed('KeyR', 'Enter', 'Space') || input.click()) this.startGame();
      return;
    }
    if (this.state === 'shop') {
      this.shopTimer -= dt;
      for (const item of SHOP) {
        if (input.pressed(`Digit${item.key}`)) this.buy(item);
      }
      if (input.click()) {
        const hit = this.shopClickZone(input.mouse.x, input.mouse.y);
        if (hit === 'next') this.beginWave(this.wave + 1);
        else if (hit) this.buy(SHOP.find((s) => s.id === hit));
      }
      if (input.pressed('Enter', 'Space') || this.shopTimer <= 0) this.beginWave(this.wave + 1);
      return;
    }

    // ---- playing ----
    const p = this.player;
    p.invuln = Math.max(0, p.invuln - dt);
    p.fireTimer -= dt;
    const mv = input.moveVector();
    p.moving = mv.x !== 0 || mv.y !== 0;
    p.x = Math.max(24, Math.min(W - 24, p.x + mv.x * p.speed * dt));
    p.y = Math.max(24, Math.min(H - 24, p.y + mv.y * p.speed * dt));
    // Never let the warden stand inside the lighthouse.
    const ldx = p.x - LIGHTHOUSE.x, ldy = p.y - LIGHTHOUSE.y;
    const ld = Math.hypot(ldx, ldy);
    const minD = LIGHTHOUSE.r + p.r + 4;
    if (ld < minD && ld > 0) {
      p.x = LIGHTHOUSE.x + (ldx / ld) * minD;
      p.y = LIGHTHOUSE.y + (ldy / ld) * minD;
    }
    p.aim = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);

    const firing = input.mouse.down || input.down('Space');
    if (firing && p.fireTimer <= 0) {
      p.fireTimer = p.fireInterval;
      this.stats.shots += 1;
      const bx = p.x + Math.cos(p.aim) * (p.r + 8);
      const by = p.y + Math.sin(p.aim) * (p.r + 8);
      this.bullets.push(makeBullet(bx, by, p.aim, p.damage));
      this.particles.push(makeParticle(bx, by, '#ffd166', 60, 0.15, 2));
      sfx.shoot();
    }

    // Spawning.
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.waveInterval;
        const kind = this.spawnQueue.shift();
        const pt = spawnEdgePoint(this.rng);
        const e = makeEnemy(kind, pt.x, pt.y, this.rng);
        if (kind === 'titan') e.spawnT = 0;
        this.enemies.push(e);
      }
    }

    // Bullets.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      updateBullet(b, dt);
      if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        this.bullets.splice(i, 1);
        continue;
      }
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (dist2(b.x, b.y, e.x, e.y) < (b.r + e.r) * (b.r + e.r)) {
          this.stats.hits += 1;
          e.hp -= b.damage;
          e.flash = 1;
          this.bullets.splice(i, 1);
          this.particles.push(makeParticle(b.x, b.y, '#ffd166', 90, 0.25, 2));
          sfx.hit();
          if (e.hp <= 0) this.killEnemy(e, j);
          break;
        }
      }
    }

    // Enemies reach the lighthouse or the warden.
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      updateEnemy(e, dt, p, LIGHTHOUSE, this.time);
      if (dist2(e.x, e.y, LIGHTHOUSE.x, LIGHTHOUSE.y) < (e.r + LIGHTHOUSE.r - 6) ** 2) {
        this.damageLighthouse(e, i);
        if (this.state !== 'playing') return;
        continue;
      }
      if (p.invuln <= 0 && dist2(e.x, e.y, p.x, p.y) < (e.r + p.r - 2) ** 2) {
        this.damagePlayer(e, i);
        if (this.state !== 'playing') return;
      }
    }

    // Ember drops.
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      updateEmberDrop(d, dt, p);
      if (dist2(d.x, d.y, p.x, p.y) < (p.r + 12) ** 2) {
        this.drops.splice(i, 1);
        this.embers += d.value;
        sfx.pickup();
      }
    }

    // Wave cleared: everything spawned and everything dead.
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      if (this.wave >= TOTAL_WAVES) {
        this.score += 5000;
        this.endGame(true, 'Dawn breaks. The light holds.');
      } else {
        this.state = 'shop';
        this.shopTimer = 25;
        this.showMessage(`WAVE ${this.wave} CLEARED — SPEND YOUR EMBERS`);
        sfx.buy();
      }
    }
  }

  // Shop button hit-test, shared with the renderer so clicks land where drawn.
  shopClickZone(mx, my) {
    const panelX = W / 2 - 330, panelY = 168, rowH = 62;
    for (let i = 0; i < SHOP.length; i++) {
      const y = panelY + 78 + i * rowH;
      if (mx >= panelX + 16 && mx <= panelX + 644 && my >= y && my <= y + 52) return SHOP[i].id;
    }
    const btnY = panelY + 78 + SHOP.length * rowH + 14;
    if (mx >= W / 2 - 110 && mx <= W / 2 + 110 && my >= btnY && my <= btnY + 46) return 'next';
    return null;
  }
}
