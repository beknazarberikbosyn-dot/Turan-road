// Вся музыка и звуки синтезируются прямо в браузере (Web Audio API) — без внешних файлов.
// Инструменты: «домбра» (щипок), «сыбызгы» (флейта), колокольчики, подложка, бас, дауылпаз (барабан), шейкер.

let ctx = null, master, musicBus, sfxBus, reverb, revSend, noiseBuf;
const st = { music: 0.6, sfx: 0.8, theme: null, wanted: null, step: 0, next: 0, timer: null, hoof: null };

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function impulse(sec = 2.4) {
  const len = ctx.sampleRate * sec;
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return b;
}

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createDynamicsCompressor();
  master.threshold.value = -14; master.ratio.value = 3;
  master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = st.music * 0.55; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = st.sfx * 0.7; sfxBus.connect(master);
  reverb = ctx.createConvolver(); reverb.buffer = impulse();
  revSend = ctx.createGain(); revSend.gain.value = 0.32;
  musicBus.connect(revSend); revSend.connect(reverb);
  const revOut = ctx.createGain(); revOut.gain.value = 0.9; reverb.connect(revOut); revOut.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  st.timer = setInterval(tick, 25);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  if (st.wanted) { const w = st.wanted; st.wanted = null; playTheme(w); }
}

export function setMusicVolume(v) { st.music = v; if (musicBus) musicBus.gain.setTargetAtTime(v * 0.55, ctx.currentTime, 0.08); }
export function setSfxVolume(v) { st.sfx = v; if (sfxBus) sfxBus.gain.setTargetAtTime(v * 0.7, ctx.currentTime, 0.05); }

// ── инструменты ────────────────────────────────────────
function env(g, t, a, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
}

function pluck(t, m, dur, vol = 0.22, dest = musicBus) {
  const f = mtof(m);
  const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f;
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.004;
  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 3;
  flt.frequency.setValueAtTime(Math.min(7000, f * 9), t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(260, f * 1.4), t + 0.32);
  const g = ctx.createGain();
  const d = Math.max(0.35, Math.min(1.4, dur * 1.6));
  env(g, t, 0.005, vol, d);
  const mix = ctx.createGain(); mix.gain.value = 0.5;
  o1.connect(mix); o2.connect(flt); mix.connect(flt); flt.connect(g); g.connect(dest);
  o1.start(t); o2.start(t); o1.stop(t + d + 0.1); o2.stop(t + d + 0.1);
}

function bell(t, m, dur, vol = 0.16, dest = musicBus) {
  const f = mtof(m);
  [[1, 1, 1.6], [2.76, 0.32, 0.9], [5.4, 0.12, 0.5]].forEach(([r, v, d]) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r;
    const g = ctx.createGain(); env(g, t, 0.004, vol * v, d * Math.max(0.6, dur));
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + d * Math.max(0.6, dur) + 0.1);
  });
}

function flute(t, m, dur, vol = 0.13, dest = musicBus) {
  const f = mtof(m);
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
  const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + 0.25);
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  const g = ctx.createGain(), g2 = ctx.createGain(); g2.gain.value = 0.12;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.07);
  g.gain.setValueAtTime(vol, t + Math.max(0.08, dur - 0.08));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
  // дыхание
  const n = ctx.createBufferSource(); n.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6;
  const ng = ctx.createGain(); env(ng, t, 0.03, vol * 0.25, 0.25);
  n.connect(bp); bp.connect(ng); ng.connect(dest);
  [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.25); });
  n.start(t); n.stop(t + 0.3);
}

function pad(t, ms, dur, vol = 0.05, dest = musicBus) {
  ms.forEach((m) => {
    [-6, 6].forEach((c) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = c;
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.6);
      g.gain.setValueAtTime(vol, t + dur - 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
      o.connect(flt); flt.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.7);
    });
  });
}

function bass(t, m, dur, vol = 0.22, dest = musicBus) {
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
  const g = ctx.createGain(); env(g, t, 0.01, vol, Math.max(0.3, dur));
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.4);
}

function drum(t, vol = 0.32, dest = musicBus, hi = 1) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150 * hi, t); o.frequency.exponentialRampToValueAtTime(52 * hi, t + 0.16);
  const g = ctx.createGain(); env(g, t, 0.003, vol, 0.28);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.35);
  const n = ctx.createBufferSource(); n.buffer = noiseBuf;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  const ng = ctx.createGain(); env(ng, t, 0.002, vol * 0.35, 0.06);
  n.connect(lp); lp.connect(ng); ng.connect(dest); n.start(t); n.stop(t + 0.1);
}

function shaker(t, vol = 0.06, dest = musicBus) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
  const g = ctx.createGain(); env(g, t, 0.004, vol, 0.05);
  n.connect(hp); hp.connect(g); g.connect(dest); n.start(t, Math.random() * 0.5); n.stop(t + 0.08);
}

const INSTR = { pluck, bell, flute };

// ── мелодии ────────────────────────────────────────────
// melody: [midi | null, длительность в восьмых]; chords/bass: по тактам.
const D = { G2: 43, A2: 45, B2: 47, D2: 38, E2: 40, C2: 36, F2: 41, D3: 50 };

const THEMES = {
  // Главное меню: весёлая «сказка о путешествии» в 6/8, галоп домбры
  menu: {
    eighth: 0.19, bar: 6, lead: ['bell', 'pluck'], leadVol: [0.15, 0.12],
    melody: [
      [74,1],[76,1],[78,1],[81,2],[78,1],
      [76,1],[74,1],[76,1],[78,3],
      [81,1],[83,1],[81,1],[78,2],[76,1],
      [74,1],[76,1],[71,1],[74,3],
      [78,1],[81,1],[86,1],[83,2],[81,1],
      [78,1],[81,1],[83,1],[81,3],
      [79,1],[78,1],[76,1],[74,2],[71,1],
      [69,1],[71,1],[73,1],[74,3],
    ],
    chords: [[62,66,69],[62,66,69],[67,71,74],[57,61,64],[62,66,69],[59,62,66],[55,59,62],[57,61,64]],
    bass: [D.D2, D.D2, D.G2, D.A2, D.D2, D.B2, D.G2, D.A2],
    groove: 'gallop',
  },
  // Карта: спокойная дорога, сыбызгы и домбра
  map: {
    eighth: 0.25, bar: 6, lead: ['flute'], leadVol: [0.12],
    melody: [
      [74,3],[76,1],[74,1],[71,1],
      [69,3],[67,3],
      [71,2],[74,1],[76,3],
      [79,3],[76,3],
      [74,3],[76,1],[79,1],[76,1],
      [74,2],[71,1],[69,3],
      [67,1],[69,1],[71,1],[74,2],[71,1],
      [67,6],
    ],
    chords: [[55,59,62],[50,54,57],[52,55,59],[48,52,55],[55,59,62],[50,54,57],[48,52,55],[55,59,62]],
    bass: [D.G2, D.D2, D.E2, D.C2, D.G2, D.D2, D.C2, D.G2],
    groove: 'walk',
  },
  // Встреча с жителями: тёплая мелодия домбры
  village: {
    eighth: 0.22, bar: 8, lead: ['pluck'], leadVol: [0.17],
    melody: [
      [69,2],[72,1],[74,1],[72,2],[69,2],
      [67,2],[69,1],[67,1],[65,4],
      [62,1],[65,1],[67,2],[69,2],[72,2],
      [74,3],[72,1],[69,4],
    ],
    chords: [[62,65,69],[65,69,72],[62,65,69],[57,60,64]],
    bass: [D.D2, D.F2, D.D2, D.A2],
    groove: 'kuy',
  },
  // Путешествие во времени: таинственная подложка и колокольчики
  time: {
    eighth: 0.3, bar: 8, lead: ['bell'], leadVol: [0.12],
    melody: [
      [76,2],[79,2],[83,4],
      [81,2],[79,2],[76,4],
      [77,2],[76,2],[74,2],[76,2],
      [76,8],
    ],
    chords: [[52,55,59,64],[48,52,55,60],[53,57,60,65],[52,55,59,64]],
    bass: [D.E2, D.C2, D.F2, D.E2],
    groove: 'mist',
  },
};

for (const th of Object.values(THEMES)) {
  th.events = {};
  let s = 0;
  for (const [m, l] of th.melody) { if (m) th.events[s] = [m, l]; s += l; }
  th.total = s;
}

function scheduleStep(th, s, t) {
  const e = th.eighth;
  const bar = Math.floor(s / th.bar), pos = s % th.bar;
  const chord = th.chords[bar % th.chords.length];
  const root = th.bass[bar % th.bass.length];
  const ev = th.events[s];
  if (ev) th.lead.forEach((name, i) => INSTR[name](t, ev[0], ev[1] * e, th.leadVol[i]));

  switch (th.groove) {
    case 'gallop':
      if (pos === 0 || pos === 3) { bass(t, root, e * 2.5, 0.2); drum(t, pos === 0 ? 0.26 : 0.18); }
      if (pos !== 0 && pos !== 3) { chord.forEach((m) => pluck(t, m - 12 + 12, e, 0.045)); shaker(t, 0.05); }
      break;
    case 'walk':
      if (pos === 0) { bass(t, root, e * 5, 0.16); pad(t, chord, e * 6, 0.018); }
      if (pos === 0 || pos === 3) pluck(t, root + 12, e * 2, 0.08);
      if (pos === 1 || pos === 2 || pos === 4 || pos === 5) pluck(t, chord[(pos + bar) % chord.length], e, 0.04);
      if (pos === 3) drum(t, 0.08, musicBus, 1.4);
      break;
    case 'kuy':
      if (pos === 0) { bass(t, root, e * 4, 0.2); drum(t, 0.16); }
      if (pos === 4) drum(t, 0.1, musicBus, 1.3);
      // двухструнный «бурдон» домбры
      if (pos % 2 === 1) { pluck(t, root + 24, e, 0.05); pluck(t, root + 31, e, 0.04); }
      if (pos === 2 || pos === 6) shaker(t, 0.04);
      break;
    case 'mist':
      if (pos === 0) { pad(t, chord, e * 8, 0.035); bass(t, root, e * 6, 0.12); }
      bell(t, chord[s % chord.length] + 24, e * 2, 0.03);
      break;
  }
}

function tick() {
  if (!ctx || !st.theme) return;
  const th = THEMES[st.theme];
  while (st.next < ctx.currentTime + 0.18) {
    scheduleStep(th, st.step, st.next);
    st.next += th.eighth;
    st.step = (st.step + 1) % th.total;
  }
}

export function playTheme(name) {
  if (!ctx) { st.wanted = name; return; }
  if (st.theme === name) return;
  const now = ctx.currentTime;
  if (!st.theme) {
    st.theme = name; st.step = 0; st.next = now + 0.08;
    return;
  }
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(0.0001, now, 0.12);
  const target = name;
  setTimeout(() => {
    st.theme = target; st.step = 0; st.next = ctx.currentTime + 0.05;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(st.music * 0.55, ctx.currentTime, 0.25);
  }, 450);
}

// ── звуки ──────────────────────────────────────────────
const now = () => ctx.currentTime + 0.01;

export const sfx = {
  click() { if (!ctx) return; const t = now(); pluck(t, 81, 0.15, 0.2, sfxBus); bell(t, 93, 0.2, 0.06, sfxBus); },
  hover() { if (!ctx) return; pluck(now(), 86, 0.08, 0.06, sfxBus); },
  page() { if (!ctx) return; const t = now(); shaker(t, 0.1, sfxBus); pluck(t, 74, 0.1, 0.06, sfxBus); },
  correct() { if (!ctx) return; const t = now(); [72, 76, 79, 84].forEach((m, i) => bell(t + i * 0.08, m, 0.5, 0.14, sfxBus)); },
  wrong() {
    if (!ctx) return; const t = now();
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.25);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ctx.createGain(); env(g, t, 0.01, 0.12, 0.3); o.connect(lp); lp.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4);
  },
  chime() { if (!ctx) return; const t = now(); [79, 83, 86, 91, 95].forEach((m, i) => bell(t + i * 0.11, m, 1.4, 0.13, sfxBus)); pad(t, [55, 62, 67, 71], 1.6, 0.03, sfxBus); },
  unlock() { if (!ctx) return; const t = now(); [67, 74, 79].forEach((m, i) => pluck(t + i * 0.09, m, 0.3, 0.16, sfxBus)); drum(t + 0.27, 0.2, sfxBus); },
  whoosh(dur = 2.2) {
    if (!ctx) return; const t = now();
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(400, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(sfxBus); n.start(t); n.stop(t + dur + 0.1);
  },
  portal() {
    if (!ctx) return; const t = now();
    sfx.whoosh(1.8);
    for (let i = 0; i < 12; i++) bell(t + i * 0.09, 72 + ((i * 5) % 24), 0.8, 0.07, sfxBus);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + 1.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.9);
  },
  eagle() {
    if (!ctx) return; const t = now();
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(1900, t); o.frequency.exponentialRampToValueAtTime(2600, t + 0.08); o.frequency.exponentialRampToValueAtTime(1300, t + 0.5);
    const g = ctx.createGain(); env(g, t, 0.02, 0.06, 0.5); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.6);
  },
};

// Топот копыт во время скачки: «та-та-ДУМ»
export function startHooves(period = 0.42) {
  if (!ctx || st.hoof) return;
  let next = ctx.currentTime + 0.02;
  const hit = (t, v) => {
    drum(t, v, sfxBus, 0.9);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 2;
    const g = ctx.createGain(); env(g, t, 0.002, v * 0.3, 0.04);
    n.connect(bp); bp.connect(g); g.connect(sfxBus); n.start(t, Math.random() * 0.5); n.stop(t + 0.06);
  };
  st.hoof = setInterval(() => {
    while (next < ctx.currentTime + 0.2) {
      hit(next, 0.1); hit(next + period * 0.14, 0.09); hit(next + period * 0.3, 0.16);
      next += period;
    }
  }, 40);
}
export function stopHooves() { clearInterval(st.hoof); st.hoof = null; }
