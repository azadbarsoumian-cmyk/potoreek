// Generates the Potoreek film soundtrack: a synthesized duduk melody over a
// dam (drone), with mountain wind and distant thunder, timed to the film.
// Everything is synthesized here, so there is nothing to license.
//
// Usage: node scripts/soundtrack/duduk-soundtrack.mjs <out.wav> [seconds]
//
// Film cues (seconds): WWW.POTOREEK.COM lands 1.8 · red logo blooms 5.2 ·
// tagline words 5.8 / 6.3 / 6.8 / 7.4 · Patreon card 9.9 · end 14.96 (loops).

import { writeFileSync } from "node:fs";

const SR = 48000;
const out = process.argv[2];
const DUR = Number(process.argv[3] || 14.96);
if (!out) {
  console.error("Usage: node scripts/soundtrack/duduk-soundtrack.mjs <out.wav> [seconds]");
  process.exit(1);
}
const N = Math.round(SR * DUR);

// ---------- helpers ----------
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Smooth random curve in [-1, 1], `rate` points per second.
function smoothNoise(rand, rate, seconds) {
  const pts = Array.from({ length: Math.ceil(seconds * rate) + 3 }, () => rand() * 2 - 1);
  return (t) => {
    const x = t * rate, i = Math.floor(x), f = x - i;
    const w = (1 - Math.cos(Math.PI * f)) / 2;
    return pts[i] * (1 - w) + pts[i + 1] * w;
  };
}

// RBJ biquad band-pass (constant peak gain).
function bandpass(f0, q) {
  let b0, b1, b2, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const set = (f) => {
    const w = (2 * Math.PI * f) / SR, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
    b0 = alpha / a0; b1 = 0; b2 = -alpha / a0; a1 = (-2 * Math.cos(w)) / a0; a2 = (1 - alpha) / a0;
  };
  set(f0);
  const step = (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
  step.set = set;
  return step;
}
const onePoleLP = (fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
};
const onePoleHP = (fc) => {
  const lp = onePoleLP(fc);
  return (x) => x - lp(x);
};

// ---------- the duduk ----------
// A cylindrical-bore double reed: strong odd harmonics, a nasal formant
// around 600 Hz and 1.3 kHz, breath noise, delayed vibrato, scoops and grace
// notes into the main pitch, legato glides between notes.
function duduk({ phrases, gain, vibratoCents = 14, breath = 0.05, dark = 0, seed = 1 }) {
  const rand = mulberry32(seed);
  const drift = smoothNoise(rand, 1.5, DUR + 2);
  const swellNoise = smoothNoise(rand, 0.8, DUR + 2);
  const noiseBP = bandpass(1800, 0.9);
  const buf = new Float32Array(N);
  const H = 24;
  const weights = new Float64Array(H + 1);
  let phase = 0, prevF = 0;

  // Flatten notes, remembering phrase boundaries.
  const notes = [];
  for (const p of phrases) p.notes.forEach((n, i) => notes.push({ ...n, first: i === 0, last: i === p.notes.length - 1, phrase: p }));

  let ni = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    while (ni < notes.length - 1 && t >= notes[ni + 1].t) ni++;
    const note = notes[ni];
    const p = note.phrase;
    const pEnd = p.notes[p.notes.length - 1].t + p.notes[p.notes.length - 1].dur;
    if (t < p.notes[0].t || t > pEnd + 0.4) { buf[i] = 0; continue; }

    // Pitch (in MIDI, fractional)
    const tn = t - note.t;
    let m = note.midi;
    const prev = notes[ni - 1];
    if (!note.first && prev && tn < 0.08) m = prev.midi + (note.midi - prev.midi) * smooth(tn / 0.08); // legato glide
    if (note.grace && tn < 0.11) m = tn < 0.07 ? note.grace : note.grace + (note.midi - note.grace) * smooth((tn - 0.07) / 0.04);
    if (note.first && tn < 0.16) m -= ((note.scoop ?? 40) / 100) * (1 - smooth(tn / 0.16)); // scoop up into the phrase
    const vibRamp = smooth((tn - 0.3) / 0.45) * (note.dur > 0.45 ? 1 : 0.3);
    m += (vibratoCents / 100) * vibRamp * Math.sin(2 * Math.PI * 5.1 * tn + note.midi);
    m += 0.04 * drift(t);
    const f = midiHz(m);

    // Loudness: phrase attack/release, per-note swell, a slow breathing drift
    const pa = smooth((t - p.notes[0].t) / 0.22) * (1 - smooth((t - pEnd) / 0.38));
    const prog = clamp(tn / note.dur);
    const swell = (note.accent ?? 0.9) * (0.82 + 0.18 * Math.sin(Math.PI * prog)) * (1 + 0.06 * swellNoise(t));
    const amp = gain * pa * swell;

    // Harmonic weights (recomputed every 64 samples or on big pitch moves)
    if (i % 64 === 0 || Math.abs(f - prevF) > 2) {
      const bright = 0.55 + 0.45 * clamp(amp / gain);
      let norm = 0;
      for (let n = 1; n <= H; n++) {
        const fn = n * f;
        if (fn > 15000) { weights[n] = 0; continue; }
        let w = Math.pow(n, -0.85) * (n % 2 === 0 ? 0.55 : 1);
        w *= 1 + 2.1 * Math.exp(-(((fn - 640) / 260) ** 2)) + 1.3 * Math.exp(-(((fn - 1320) / 380) ** 2));
        if (fn > 2400) w *= Math.exp(-(fn - 2400) / (1700 - dark * 700));
        w *= Math.pow(bright, (n - 1) * 0.22);
        weights[n] = w;
        norm += w;
      }
      for (let n = 1; n <= H; n++) weights[n] /= norm || 1;
      prevF = f;
    }

    // Additive synthesis via the Chebyshev recurrence sin(nθ)
    phase += (2 * Math.PI * f) / SR;
    if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
    const c2 = 2 * Math.cos(phase);
    let s1 = Math.sin(phase), s0 = 0, sum = weights[1] * s1;
    for (let n = 2; n <= H; n++) {
      const s = c2 * s1 - s0;
      s0 = s1; s1 = s;
      sum += weights[n] * s;
    }

    // Breath: more at the start of each phrase, a little throughout
    const onsetBreath = note.first ? Math.exp(-tn / 0.12) : 0;
    const nb = noiseBP(rand() * 2 - 1) * (breath * Math.pow(pa, 0.7) + 0.12 * onsetBreath * pa);
    buf[i] = amp * (sum * 1.9 + nb);
  }
  return buf;
}

// Melody in A minor (A4 = 69). t = start, dur = length, all in seconds.
const melody = duduk({
  seed: 7,
  gain: 0.5,
  phrases: [
    { notes: [ // opening, rising to the tonic as the URL lands (1.8 s)
      { t: 0.45, dur: 1.3, midi: 64, scoop: 50, accent: 0.7 },
      { t: 1.75, dur: 1.0, midi: 69, grace: 71, accent: 0.92 },
      { t: 2.75, dur: 1.15, midi: 72, grace: 74, accent: 0.95 },
      { t: 3.9, dur: 0.4, midi: 71, accent: 0.85 },
      { t: 4.3, dur: 0.65, midi: 69, accent: 0.78 },
    ] },
    { notes: [ // the cry as the logo blooms (5.2 s), one step per tagline word
      { t: 5.15, dur: 1.15, midi: 76, scoop: 70, accent: 1.0 },
      { t: 6.3, dur: 0.5, midi: 74, grace: 76, accent: 0.95 },
      { t: 6.8, dur: 0.6, midi: 72, grace: 74, accent: 0.92 },
      { t: 7.4, dur: 0.5, midi: 71, accent: 0.88 },
      { t: 7.9, dur: 0.15, midi: 72, accent: 0.85 },
      { t: 8.05, dur: 0.35, midi: 71, accent: 0.85 },
      { t: 8.4, dur: 2.1, midi: 69, accent: 0.9 },
    ] },
    { notes: [ // echo, ending on the note the loop starts with
      { t: 10.75, dur: 0.75, midi: 67, scoop: 30, accent: 0.65 },
      { t: 11.5, dur: 0.6, midi: 69, grace: 71, accent: 0.7 },
      { t: 12.1, dur: 2.0, midi: 64, accent: 0.62 },
    ] },
  ],
});

// Dam: a second duduk holding the tonic an octave below, breathing once.
const dam = duduk({
  seed: 11,
  gain: 0.26,
  vibratoCents: 4,
  breath: 0.03,
  dark: 1,
  phrases: [
    { notes: [{ t: 0.2, dur: 5.0, midi: 57, scoop: 20, accent: 0.85 }] },
    { notes: [{ t: 5.35, dur: 9.0, midi: 57, scoop: 15, accent: 0.9 }] },
  ],
});

// ---------- nature ----------
function wind(seed) {
  const rand = mulberry32(seed);
  const gust = smoothNoise(rand, 0.35, DUR + 2);
  const gust2 = smoothNoise(rand, 1.3, DUR + 2);
  const whistleF = smoothNoise(rand, 0.25, DUR + 2);
  // Wind is mostly a mid-range rush; keep its lows out of the way of the
  // drone and save the deep end for the thunder.
  const lp = onePoleLP(1400), lp2 = onePoleLP(2200), hp = onePoleHP(220), hp2 = onePoleHP(160);
  const whistle = bandpass(1100, 6);
  const buf = new Float32Array(N);
  let brown = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const w = rand() * 2 - 1;
    brown = (brown + 0.02 * w) * 0.996;
    const g = 0.55 + 0.3 * gust(t) + 0.12 * gust2(t);
    if (i % 256 === 0) whistle.set(950 + 350 * whistleF(t));
    const body = hp2(hp(lp2(lp(brown * 14))));
    const air = whistle(w) * 0.5 * Math.max(0, g - 0.45);
    buf[i] = (body + air) * g;
  }
  return buf;
}

function thunder(seed, at, strength) {
  const rand = mulberry32(seed);
  const rumble = smoothNoise(rand, 9, 8);
  const lp = onePoleLP(170), lp2 = onePoleLP(240);
  const buf = new Float32Array(N);
  let brown = 0;
  const start = Math.round(at * SR);
  for (let i = start; i < N; i++) {
    const t = (i - start) / SR;
    if (t > 7) break;
    brown = (brown + 0.02 * (rand() * 2 - 1)) * 0.997;
    const env = smooth(t / 0.25) * Math.exp(-t / 1.6) * (0.75 + 0.35 * rumble(t));
    buf[i] = lp2(lp(brown * 10)) * env * strength;
  }
  return buf;
}

const windL = wind(21), windR = wind(22);
const thunders = [thunder(31, 1.7, 0.55), thunder(32, 5.05, 0.9), thunder(33, 11.6, 0.35)];

// ---------- reverb (small Freeverb) ----------
function reverb(input, offset) {
  const scale = SR / 44100;
  const combs = [1116, 1188, 1277, 1356].map((n) => ({ buf: new Float32Array(Math.round((n + offset) * scale)), i: 0, store: 0 }));
  const aps = [556, 341].map((n) => ({ buf: new Float32Array(Math.round((n + offset) * scale)), i: 0 }));
  const out = new Float32Array(N);
  for (let s = 0; s < N; s++) {
    const x = input[s] * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.store = o * 0.7 + c.store * 0.3;
      c.buf[c.i] = x + c.store * 0.86;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    for (const a of aps) {
      const o = a.buf[a.i];
      a.buf[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = o - y;
    }
    out[s] = y;
  }
  return out;
}

// ---------- mix ----------
const dry = new Float32Array(N);
for (let i = 0; i < N; i++) dry[i] = melody[i] + dam[i] * 0.9;
const revL = reverb(dry, 0), revR = reverb(dry, 23);

const L = new Float32Array(N), R = new Float32Array(N);
const subL = onePoleHP(32), subR = onePoleHP(32); // clear inaudible sub-rumble
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const edge = smooth(t / 0.35) * smooth((DUR - t) / 0.45); // soft loop seam
  const th = thunders[0][i] + thunders[1][i] + thunders[2][i];
  const voice = melody[i] * 1.0;
  const drone = dam[i] * 0.9;
  L[i] = subL((voice * 0.95 + drone * 0.8 + revL[i] * 1.4 + windL[i] * 0.18 + th * 0.5) * edge);
  R[i] = subR((voice * 0.9 + drone * 1.0 + revR[i] * 1.4 + windR[i] * 0.18 + th * 0.55) * edge);
}

// Normalize to -1 dBFS with a gentle soft clip.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const target = Math.pow(10, -1 / 20);
const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write("WAVE", 8);
pcm.write("fmt ", 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write("data", 36); pcm.writeUInt32LE(N * 4, 40);
const shape = (x) => Math.tanh((x / peak) * 1.15) / Math.tanh(1.15) * target;
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(shape(L[i]) * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(shape(R[i]) * 32767), 46 + i * 4);
}
writeFileSync(out, pcm);
console.log(`wrote ${out}: ${DUR}s, peak before normalize ${peak.toFixed(3)}`);
