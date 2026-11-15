// All drawing: the dusk arena, the lighthouse and its beam, the creatures,
// the HUD, and the title / shop / end screens. Nothing here changes game state.
import { W, H, LIGHTHOUSE, COLORS, SHOP, shopCost, TOTAL_WAVES } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowCircle(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawBackground(ctx, game) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(0.55, COLORS.skyMid);
  sky.addColorStop(1, COLORS.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars, twinkling slowly.
  for (const s of game.stars) {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(game.time * 1.4 + s.tw);
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Low moon.
  glowCircle(ctx, 1080, 96, 90, '#ffe9a8', 0.5);
  ctx.fillStyle = '#ffedb8';
  ctx.beginPath();
  ctx.arc(1080, 96, 26, 0, Math.PI * 2);
  ctx.fill();

  // Sea and shore at the bottom of the arena.
  ctx.fillStyle = COLORS.sea;
  ctx.fillRect(0, H - 118, W, 118);
  ctx.fillStyle = 'rgba(78,205,196,0.14)';
  for (let i = 0; i < 5; i++) {
    const y = H - 104 + i * 20;
    ctx.fillRect(0, y, W, 2);
  }
  ctx.fillStyle = COLORS.sand;
  ctx.beginPath();
  ctx.moveTo(0, H - 118);
  ctx.quadraticCurveTo(W * 0.3, H - 96, W * 0.55, H - 112);
  ctx.quadraticCurveTo(W * 0.8, H - 124, W, H - 100);
  ctx.lineTo(W, H - 118);
  ctx.closePath();
  ctx.fill();

  // Scattered rocks the warden can hide behind in the mind, not in the code.
  ctx.fillStyle = '#241d33';
  for (const [x, y, r] of [[150, 620, 26], [1130, 600, 30], [90, 150, 22], [1200, 180, 20]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLighthouse(ctx, game) {
  const { x, y, r } = LIGHTHOUSE;
  const hpFrac = game.lighthouseHp / 100;
  // Rotating beam of light.
  ctx.save();
  ctx.translate(x, y - 18);
  ctx.rotate(game.beamAngle);
  const beam = ctx.createLinearGradient(0, 0, 520, 0);
  beam.addColorStop(0, 'rgba(255,209,102,0.34)');
  beam.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(520, -64);
  ctx.lineTo(520, 64);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Warm halo that dims as the light takes damage.
  glowCircle(ctx, x, y - 18, 150, '#ffd166', 0.22 + 0.28 * hpFrac);

  // Tower: striped, with a lamp room on top.
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath();
  ctx.moveTo(x - 26, y + 30);
  ctx.lineTo(x - 16, y - 52);
  ctx.lineTo(x + 16, y - 52);
  ctx.lineTo(x + 26, y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(x - 21, y - 6);
  ctx.lineTo(x - 18, y - 30);
  ctx.lineTo(x + 18, y - 30);
  ctx.lineTo(x + 21, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c2a4a';
  ctx.fillRect(x - 20, y - 66, 40, 16);
  ctx.fillStyle = hpFrac > 0.35 ? '#ffd166' : '#ff6a3c';
  ctx.beginPath();
  ctx.arc(x, y - 58, 9, 0, Math.PI * 2);
  ctx.fill();
  // Stone base ring.
  ctx.strokeStyle = '#5a5470';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y + 28, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlayer(ctx, game) {
  const p = game.player;
  if (p.invuln > 0 && Math.floor(game.time * 12) % 2 === 0) return; // blink while hurt
  // Lantern glow around the warden.
  glowCircle(ctx, p.x, p.y, 64, '#ffd166', 0.5);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.aim);
  // Lantern arm points where the mouse points.
  ctx.fillStyle = '#8a6d3b';
  ctx.fillRect(6, -3, 22, 6);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(30, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Cloak: a teal circle with a gold trim and a face.
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#0d1026';
  ctx.beginPath();
  ctx.arc(p.x - 5, p.y - 3, 2.5, 0, Math.PI * 2);
  ctx.arc(p.x + 5, p.y - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, e, time) {
  const flash = e.flash > 0.3;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.kind === 'bat') {
    // Flapping wings.
    const flap = Math.sin(time * 14 + e.phase) * 0.5;
    ctx.fillStyle = e.def.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-e.r - 12, -e.r * flap - 8, -e.r * 1.8, -4);
    ctx.quadraticCurveTo(-e.r, 6, 0, 4);
    ctx.quadraticCurveTo(e.r, 6, e.r * 1.8, -4);
    ctx.quadraticCurveTo(e.r + 12, -e.r * flap - 8, 0, 0);
    ctx.fill();
  }
  glowCircle(ctx, 0, 0, e.r * 2.1, e.def.glow, 0.35);
  ctx.fillStyle = flash ? '#ffffff' : e.def.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, e.r - 1, 0, Math.PI * 2);
  ctx.stroke();
  // Eyes: angry, always facing the light.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-e.r * 0.35, -e.r * 0.2, e.r * 0.22, 0, Math.PI * 2);
  ctx.arc(e.r * 0.35, -e.r * 0.2, e.r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0b00';
  ctx.beginPath();
  ctx.arc(-e.r * 0.35, -e.r * 0.2, e.r * 0.11, 0, Math.PI * 2);
  ctx.arc(e.r * 0.35, -e.r * 0.2, e.r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  if (e.kind === 'titan') {
    // Crown of cinders.
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 12, -e.r + 4);
      ctx.lineTo(i * 12, -e.r - 14);
      ctx.stroke();
    }
  }
  // Health bar for anything tougher than a wisp.
  if (e.maxHp > 1 && e.hp < e.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-e.r, -e.r - 12, e.r * 2, 5);
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(-e.r, -e.r - 12, e.r * 2 * (e.hp / e.maxHp), 5);
  }
  ctx.restore();
}

function drawHud(ctx, game) {
  const p = game.player;
  // Top bar.
  ctx.fillStyle = 'rgba(10,12,30,0.72)';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${game.score.toLocaleString()}`, 20, 35);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`WAVE ${Math.max(1, game.wave)} / ${TOTAL_WAVES}`, 300, 34);
  ctx.fillStyle = COLORS.ember;
  ctx.fillText(`◆ ${game.embers} embers`, 470, 34);
  if (game.combo > 1) {
    ctx.fillStyle = '#ff5a8a';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`COMBO x${game.combo}`, 660, 35);
  }
  // Lighthouse HP, top right.
  const barX = W - 330, barW = 220;
  ctx.fillStyle = '#fff';
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIGHT', barX - 62, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, barX, 18, barW, 18, 9);
  ctx.fill();
  ctx.fillStyle = game.lighthouseHp > 35 ? COLORS.gold : '#ff4d4d';
  roundRect(ctx, barX, 18, barW * (game.lighthouseHp / 100), 18, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`${Math.ceil(game.lighthouseHp)}`, barX + barW + 10, 33);
  // Hearts.
  for (let i = 0; i < p.maxHp; i++) {
    ctx.fillStyle = i < p.hp ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
    const hx = W - 330 + i * 26, hy = 66;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 9, hy - 3, hx - 5, hy - 11, hx, hy - 4);
    ctx.bezierCurveTo(hx + 5, hy - 11, hx + 9, hy - 3, hx, hy + 6);
    ctx.fill();
  }
  // Controls reminder, bottom left.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('WASD move · mouse aim · hold click to fire · M mute', 20, H - 16);
  // Wave banner.
  if (game.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, game.messageTimer);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, W / 2, 110);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8,10,28,0.45)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBERKEEP', W / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = '26px Georgia, serif';
  ctx.fillText('Defend the last lighthouse. Ten waves. One light.', W / 2, 300);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('WASD or arrows to move · mouse to aim · hold click or Space to fire', W / 2, 350);
  ctx.fillText('Ember creatures hunt the light — kill them, gather embers, spend them between waves', W / 2, 380);
  const pulse = 0.8 + 0.2 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('— CLICK OR PRESS ENTER TO BEGIN —', W / 2, 450);
  ctx.globalAlpha = 1;
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Best with sound on · M mutes · R restarts after the end', W / 2, 500);
  ctx.textAlign = 'left';
}

function drawShop(ctx, game) {
  ctx.fillStyle = 'rgba(8,10,28,0.55)';
  ctx.fillRect(0, 0, W, H);
  const px = W / 2 - 330, py = 168;
  drawPanel(ctx, px, py, 660, 78 + SHOP.length * 62 + 76);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`WAVE ${game.wave} CLEARED`, W / 2, py + 40);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`You hold ${game.embers} embers — spend them before the next wave`, W / 2, py + 68);
  ctx.textAlign = 'left';
  SHOP.forEach((item, i) => {
    const y = py + 78 + i * 62;
    const owned = game.shopOwned[item.id];
    const cost = shopCost(item, owned);
    const maxed = owned >= item.max;
    const afford = !maxed && game.embers >= cost;
    ctx.fillStyle = afford ? 'rgba(255,209,102,0.12)' : 'rgba(255,255,255,0.05)';
    roundRect(ctx, px + 16, y, 628, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText(`[${item.key}] ${item.name}`, px + 32, y + 22);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(item.desc, px + 32, y + 42);
    ctx.textAlign = 'right';
    ctx.fillStyle = maxed ? '#8d99ae' : afford ? COLORS.ember : '#ff5a5a';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(maxed ? 'MAXED' : `◆ ${cost}`, px + 628, y + 32);
    ctx.textAlign = 'left';
  });
  const btnY = py + 78 + SHOP.length * 62 + 14;
  ctx.fillStyle = COLORS.ember;
  roundRect(ctx, W / 2 - 110, btnY, 220, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#1a0b00';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT WAVE ▸', W / 2, btnY + 30);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, game) {
  const won = game.state === 'victory';
  ctx.fillStyle = won ? 'rgba(10,26,16,0.6)' : 'rgba(26,8,10,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.gold : '#ff6a5a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'DAWN BREAKS' : 'THE LIGHT FADES', W / 2, 240);
  ctx.fillStyle = '#fff';
  ctx.font = '24px Georgia, serif';
  ctx.fillText(game.endReason || '', W / 2, 290);
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`SCORE  ${game.score.toLocaleString()}`, W / 2, 360);
  ctx.font = '21px Georgia, serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Waves cleared ${won ? TOTAL_WAVES : Math.max(0, game.wave - 1)} / ${TOTAL_WAVES}    ·    Kills ${game.kills}    ·    Best combo x${game.bestCombo}`, W / 2, 405);
  const acc = game.stats.shots > 0 ? Math.round((100 * game.stats.hits) / game.stats.shots) : 0;
  ctx.fillText(`Shots ${game.stats.shots}  ·  Accuracy ${acc}%  ·  Embers gathered ${game.embers}`, W / 2, 438);
  const pulse = 0.65 + 0.35 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('— PRESS R OR CLICK TO PLAY AGAIN —', W / 2, 510);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake * 14, (Math.random() - 0.5) * game.shake * 14);
  }
  drawBackground(ctx, game);
  drawLighthouse(ctx, game);
  for (const d of game.drops) {
    glowCircle(ctx, d.x, d.y, 16, '#ff8a3c', 0.6);
    ctx.fillStyle = COLORS.gold;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.t * 3);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
  for (const b of game.bullets) {
    glowCircle(ctx, b.x, b.y, 14, '#ffd166', 0.8);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of game.enemies) drawEnemy(ctx, e, game.time);
  if (game.state !== 'title') drawPlayer(ctx, game);
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (game.state !== 'title') drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'shop') drawShop(ctx, game);
  if (game.state === 'victory' || game.state === 'defeat') drawEnd(ctx, game);
}
