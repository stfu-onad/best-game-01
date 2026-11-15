// Synthesised sound: every effect is built from oscillators and filtered noise,
// so the game ships no audio files and never touches the network.
let ctx = null;
let master = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; return muted; }

export function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  } catch { /* sound is decoration; never break the game */ }
}

function noise(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t);
  } catch { /* ignore */ }
}

export const sfx = {
  shoot() { tone(720, 0.09, 'square', 0.10, 320); },
  hit() { noise(0.08, 0.16, 1800); },
  kill() { tone(320, 0.16, 'triangle', 0.16, 90); noise(0.12, 0.10, 900); },
  pickup() { tone(880, 0.08, 'sine', 0.12, 1320); },
  hurt() { tone(160, 0.25, 'sawtooth', 0.2, 60); noise(0.2, 0.14, 500); },
  lighthouseHit() { tone(110, 0.3, 'sawtooth', 0.22, 55); noise(0.25, 0.16, 400); },
  horn() { tone(196, 0.7, 'triangle', 0.2, 196); tone(294, 0.7, 'triangle', 0.14, 294); },
  boss() { tone(65, 0.9, 'sawtooth', 0.25, 40); noise(0.8, 0.2, 300); },
  buy() { tone(523, 0.1, 'sine', 0.14, 784); tone(784, 0.14, 'sine', 0.12, 1046); },
  denied() { tone(140, 0.15, 'square', 0.12, 110); },
  victory() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.16), i * 140)); },
  defeat() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'triangle', 0.15), i * 170)); },
};
