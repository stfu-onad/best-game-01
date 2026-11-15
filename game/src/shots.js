// Screenshot setups: ?shot=start | play | shop | end (with &seed=N).
// Each one stages a deterministic, readable frame of the real game — the same
// code path a player sees, frozen at a moment that shows the whole loop.
import { LIGHTHOUSE, WAVES } from './config.js';
import { makeEnemy, makeBullet, makeEmberDrop } from './entities.js';

function seedWave(game, wave, enemies) {
  game.state = 'playing';
  game.wave = wave;
  game.waveActive = true;
  game.spawnQueue = [];
  game.enemies = enemies;
  game.message = `WAVE ${wave}`;
  game.messageTimer = 2.4;
}

export function applyShot(game, mode, seed) {
  const rng = game.rng;
  if (mode === 'start') {
    game.state = 'title';
    game.time = 6;
    return;
  }
  if (mode === 'play') {
    // Mid-wave 4: the warden firing, creatures closing in, embers on the ground.
    game.score = 12450;
    game.embers = 23;
    game.kills = 41;
    game.combo = 3;
    game.comboTimer = 2.0;
    game.bestCombo = 4;
    game.lighthouseHp = 78;
    game.player.x = 760;
    game.player.y = 480;
    game.player.aim = -0.6;
    game.player.hp = 3;
    const defs = WAVES[3];
    const placed = [];
    const spots = [
      ['wisp', 300, 200], ['wisp', 420, 150], ['wisp', 950, 180],
      ['bat', 250, 420], ['bat', 1020, 380], ['bat', 880, 520],
      ['golem', 620, 140], ['golem', 180, 560],
      ['wisp', 1080, 300], ['wisp', 350, 520],
    ];
    for (const [kind, x, y] of spots) {
      const e = makeEnemy(kind, x, y, rng);
      if (kind === 'golem') e.hp = 5;
      if (kind === 'bat') e.hp = 1;
      placed.push(e);
    }
    seedWave(game, 4, placed);
    game.bullets = [
      makeBullet(800, 460, -0.6, 1),
      makeBullet(830, 445, -0.55, 1),
    ];
    game.drops = [makeEmberDrop(700, 540, 1), makeEmberDrop(730, 560, 1), makeEmberDrop(680, 500, 1)];
    game.time = 42;
    game.stats.shots = 210;
    game.stats.hits = 164;
    return;
  }
  if (mode === 'shop') {
    game.state = 'shop';
    game.wave = 5;
    game.score = 18300;
    game.embers = 31;
    game.kills = 68;
    game.bestCombo = 5;
    game.lighthouseHp = 64;
    game.player.hp = 2;
    game.shopOwned = { damage: 1, rate: 1, speed: 0, repair: 0, heart: 0 };
    game.shopTimer = 25;
    game.time = 90;
    return;
  }
  if (mode === 'end') {
    // Victory after the Titan falls: embers and sparks everywhere.
    game.state = 'victory';
    game.endReason = 'Dawn breaks. The light holds.';
    game.wave = 10;
    game.score = 48250;
    game.kills = 187;
    game.bestCombo = 5;
    game.embers = 12;
    game.lighthouseHp = 41;
    game.player.hp = 2;
    game.player.x = 700;
    game.player.y = 470;
    game.stats.shots = 640;
    game.stats.hits = 512;
    for (let i = 0; i < 26; i++) {
      game.drops.push(makeEmberDrop(
        LIGHTHOUSE.x + (rng.range(-260, 260)),
        LIGHTHOUSE.y + (rng.range(-200, 200)), 1,
      ));
    }
    game.time = 210;
    return;
  }
  // Unknown mode: leave the title screen up.
  game.state = 'title';
}
