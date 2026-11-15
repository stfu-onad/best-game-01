// Boot and the frame loop. Fixed-size canvas (1280x720), scaled by CSS;
// the game itself never knows or cares how big the browser window is.
import { W, H } from './config.js';
import { Game } from './world.js';
import { Input } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot');
const seed = Number(params.get('seed') || '20261116');

const game = new Game(seed);
game.rngSeed = seed;
const input = new Input(canvas);

if (shotMode) {
  applyShot(game, shotMode, seed);
  render(ctx, game);
} else {
  let last = performance.now();
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  window.addEventListener('keydown', ensureAudio, { once: true });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') toggleMute();
  });
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    game.update(dt, input);
    render(ctx, game);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Expose a handle for headless smoke tests: window.__game reports live state.
window.__game = game;
