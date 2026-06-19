// ---------------------------------------------------------------------------
// Procedural audio engine — gamelan-flavored music + SFX synthesized at runtime
// with the Web Audio API. No asset files: keeps the deploy light (in the spirit
// of the HD-2D switch), works offline, and is tweakable in code.
//
// - Music: a look-ahead scheduler plays interlocking metallophone/gong patterns
//   on a slendro-ish (5-tone) scale — a calm 'explore' loop and a driving
//   'battle' loop.
// - SFX: tame success/fail, battle hits, level-up, evolution, UI ticks, steps.
// - Everything is guarded: if the AudioContext can't start (headless, blocked),
//   every call is a silent no-op and nothing throws.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nusantara-realm-audio';

export type MusicTrack = 'explore' | 'battle';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;

let muted = false;
let volume = 0.7; // 0..1 master
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

// --- settings persistence --------------------------------------------------
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const o = JSON.parse(raw);
    if (typeof o.muted === 'boolean') muted = o.muted;
    if (typeof o.volume === 'number') volume = Math.max(0, Math.min(1, o.volume));
  }
} catch { /* ignore */ }
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted, volume })); } catch { /* ignore */ }
}

// --- slendro-ish scale (≈ 5 equal divisions of the octave) -----------------
const SCALE = [0, 240, 480, 720, 960].map((c) => Math.pow(2, c / 1200));
function note(base: number, degree: number): number {
  const n = SCALE.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return base * SCALE[idx] * Math.pow(2, oct);
}

// --- init (must follow a user gesture) -------------------------------------
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.5; // music sits under sfx
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    if (ctx.state === 'suspended') void ctx.resume();
    emit();
  } catch { ctx = null; }
}

export const isReady = () => !!ctx;
export const getMuted = () => muted;
export const getVolume = () => volume;
export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (master && !muted) master.gain.setTargetAtTime(volume, ctx!.currentTime, 0.02);
  persist(); emit();
}
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx!.currentTime, 0.02);
  persist(); emit();
}
export function subscribeAudio(fn: () => void): () => void { subs.add(fn); return () => { subs.delete(fn); }; }

// --- voices ----------------------------------------------------------------
// A struck metallophone tone: a fundamental plus inharmonic partials with a
// fast attack and exponential decay — the bright, slightly metallic gamelan ring.
function bell(freq: number, when: number, dur: number, gain: number, bus: GainNode) {
  if (!ctx) return;
  const env = ctx.createGain();
  env.connect(bus);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  const partials = [[1, 1], [2.01, 0.5], [2.76, 0.26], [4.07, 0.14]];
  for (const [r, g] of partials) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * r;
    const pg = ctx.createGain();
    pg.gain.value = g;
    o.connect(pg).connect(env);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
}

// A low gong: deep inharmonic partials, long decay, a touch of downward shimmer.
function gong(when: number, gain: number, bus: GainNode, base = 78) {
  if (!ctx) return;
  const env = ctx.createGain();
  env.connect(bus);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
  const partials = [[1, 1], [1.48, 0.6], [2.1, 0.4], [2.67, 0.26], [3.4, 0.16]];
  for (const [r, g] of partials) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * r * 1.012, when);
    o.frequency.exponentialRampToValueAtTime(base * r, when + 0.5);
    const pg = ctx.createGain();
    pg.gain.value = g;
    o.connect(pg).connect(env);
    o.start(when);
    o.stop(when + 3.3);
  }
}

// A decaying filtered noise burst — impacts and footsteps.
function noise(when: number, dur: number, gain: number, cutoff: number, bus: GainNode) {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filt).connect(g).connect(bus);
  src.start(when);
  src.stop(when + dur + 0.02);
}

// --- SFX -------------------------------------------------------------------
const SFX_BASE = 262; // ~C4
function arp(degrees: number[], step: number, dur: number, gain: number, base = SFX_BASE) {
  if (!ctx || !sfxBus) return;
  const t0 = ctx.currentTime;
  degrees.forEach((d, i) => bell(note(base, d), t0 + i * step, dur, gain, sfxBus!));
}

export const sfx = {
  tameSuccess() { arp([0, 2, 4, 7], 0.085, 0.9, 0.32); },
  tameFail() { if (!ctx || !sfxBus) return; const t = ctx.currentTime; bell(note(SFX_BASE, 1), t, 0.5, 0.26, sfxBus); bell(note(SFX_BASE, -1), t + 0.13, 0.7, 0.24, sfxBus); },
  levelUp() { arp([2, 4, 7, 9], 0.07, 0.8, 0.3); },
  evolve() { arp([0, 2, 4, 7, 9, 11], 0.09, 1.1, 0.3); if (ctx && sfxBus) gong(ctx.currentTime, 0.18, sfxBus, 110); },
  battleStart() { if (!ctx || !sfxBus) return; gong(ctx.currentTime, 0.5, sfxBus); arp([4, 7, 9], 0.08, 0.5, 0.18); },
  hit(strong = false) {
    if (!ctx || !sfxBus) return;
    const t = ctx.currentTime;
    noise(t, strong ? 0.16 : 0.1, strong ? 0.5 : 0.32, strong ? 2600 : 1400, sfxBus);
    bell(note(SFX_BASE, strong ? 0 : -2), t, 0.22, strong ? 0.3 : 0.2, sfxBus);
    if (strong) gong(t, 0.22, sfxBus, 130);
  },
  uiClick() { if (!ctx || !sfxBus) return; bell(note(SFX_BASE, 7), ctx.currentTime, 0.18, 0.14, sfxBus); },
  step() { if (!ctx || !sfxBus) return; noise(ctx.currentTime, 0.07, 0.07, 380, sfxBus); },
};

// --- music scheduler -------------------------------------------------------
interface TrackCfg {
  base: number; stepDur: number; steps: number;
  melody: (number | null)[]; high: (number | null)[];
  bassEvery: number; gongStep: number; kempulStep: number;
  melodyGain: number; highGain: number;
}

const TRACKS: Record<MusicTrack, TrackCfg> = {
  explore: {
    base: 196, stepDur: 0.42, steps: 16,
    melody: [0, null, null, 2, null, null, 1, null, 2, null, null, 4, null, null, 2, null],
    high:   [null, null, 7, null, null, 6, null, null, null, null, 9, null, null, 7, null, 6],
    bassEvery: 0, gongStep: 0, kempulStep: 8, melodyGain: 0.3, highGain: 0.1,
  },
  battle: {
    base: 233, stepDur: 0.3, steps: 16,
    melody: [0, 2, 1, 2, 4, 2, 1, 0, 0, 2, 4, 2, 1, 2, 4, 5],
    high:   [7, null, 6, null, 7, null, 9, null, 7, null, 6, null, 7, null, 9, null],
    bassEvery: 2, gongStep: 0, kempulStep: 8, melodyGain: 0.3, highGain: 0.12,
  },
};

let track: MusicTrack | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
const LOOKAHEAD = 0.12;

function schedule(cfg: TrackCfg, i: number, t: number) {
  if (!musicBus) return;
  const m = cfg.melody[i];
  if (m !== null) bell(note(cfg.base, m), t, 1.7, cfg.melodyGain, musicBus);
  const h = cfg.high[i];
  if (h !== null) bell(note(cfg.base, h), t, 0.7, cfg.highGain, musicBus);
  if (i === cfg.gongStep) gong(t, 0.42, musicBus);
  if (i === cfg.kempulStep) bell(note(cfg.base, -3), t, 1.2, 0.2, musicBus);
  if (cfg.bassEvery && i % cfg.bassEvery === 0) bell(cfg.base / 2, t, 0.5, 0.16, musicBus);
}

function tick() {
  if (!ctx || !track) return;
  const cfg = TRACKS[track];
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    schedule(cfg, step, nextTime);
    nextTime += cfg.stepDur;
    step = (step + 1) % cfg.steps;
  }
}

export function playMusic(next: MusicTrack) {
  if (!ctx) return;
  if (track === next && timer !== null) return;
  track = next;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  if (timer === null) timer = window.setInterval(tick, 30);
}

export function stopMusic() {
  if (timer !== null) { clearInterval(timer); timer = null; }
  track = null;
}
