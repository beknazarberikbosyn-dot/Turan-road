// Погода сцены: частицы на холсте поверх персонажей и фона.
// Дождь с брызгами, снег, пыль в солнечных лучах, песчаная позёмка, соль,
// листья, лепестки, крылатки ясеня, светлячки, искры костра, пузыри под водой,
// мошкара, туман, полосы ветра и перекати-поле. Все частицы слушаются ветра.
const W = 960, H = 540;
const rnd = (a, b) => a + Math.random() * (b - a);

const COUNTS = { rain: 220, snow: 130, dust: 46, sand: 90, salt: 110, leaves: 16, petals: 26, seeds: 12, fireflies: 26, embers: 26, bubbles: 30, gnats: 40, mist: 5, wind: 6, spray: 40, tumble: 1 };

function make(mode) {
  switch (mode) {
    case 'rain': return { x: rnd(-100, W + 100), y: rnd(-H, H), v: rnd(620, 900), l: rnd(12, 22), a: rnd(0.25, 0.55) };
    case 'snow': return { x: rnd(-50, W + 50), y: rnd(-H, H), v: rnd(26, 70), r: rnd(1, 3.4), ph: rnd(0, 6), a: rnd(0.6, 1) };
    case 'dust': return { x: rnd(0, W), y: rnd(60, H), r: rnd(0.8, 2.4), ph: rnd(0, 6), v: rnd(4, 14), a: rnd(0.2, 0.6) };
    case 'sand': return { x: rnd(-200, W), y: rnd(330, H), l: rnd(14, 46), v: rnd(260, 520), a: rnd(0.15, 0.45) };
    case 'salt': return { x: rnd(-200, W), y: rnd(120, H), l: rnd(8, 30), v: rnd(200, 420), a: rnd(0.2, 0.5), r: rnd(0.8, 1.8) };
    case 'leaves': return { x: rnd(-60, W), y: rnd(-H * 0.5, H), v: rnd(30, 60), rot: rnd(0, 6), vr: rnd(-3, 3), s: rnd(5, 9), ph: rnd(0, 6), c: ['#C9A33A', '#9CB84E', '#D9822B', '#B8C46A'][Math.floor(rnd(0, 4))] };
    case 'petals': return { x: rnd(-60, W), y: rnd(-H * 0.5, H), v: rnd(20, 42), rot: rnd(0, 6), vr: rnd(-4, 4), s: rnd(3, 5), ph: rnd(0, 6), c: ['#FBE6EC', '#F6C9D6', '#FFFFFF'][Math.floor(rnd(0, 3))] };
    case 'seeds': return { x: rnd(0, W), y: rnd(-H * 0.5, H * 0.6), v: rnd(26, 46), rot: rnd(0, 6), vr: rnd(6, 12), s: rnd(6, 9), ph: rnd(0, 6) };
    case 'fireflies': return { x: rnd(0, W), y: rnd(260, H - 20), ph: rnd(0, 6), sp: rnd(0.4, 1.2), r: rnd(1.4, 2.6) };
    case 'embers': return { x: 0, y: 0, life: -rnd(0, 3), max: rnd(1.4, 3), vx: rnd(-14, 14), vy: rnd(-70, -40), r: rnd(1, 2.2) };
    case 'bubbles': return { x: rnd(0, W), y: rnd(0, H), v: rnd(30, 70), r: rnd(2, 6), ph: rnd(0, 6) };
    case 'gnats': return { cx: rnd(100, W - 100), cy: rnd(300, 460), ph: rnd(0, 6), r: rnd(6, 26), sp: rnd(2, 5) };
    case 'mist': return { x: rnd(-200, W), y: rnd(300, 470), w: rnd(220, 420), h: rnd(20, 50), v: rnd(6, 16), a: rnd(0.08, 0.18) };
    case 'wind': return { x: rnd(-300, W), y: rnd(120, 470), l: rnd(80, 200), v: rnd(380, 620), life: rnd(0, 4), ph: rnd(0, 6) };
    case 'spray': return { x: rnd(0, W), y: rnd(380, H), r: rnd(1, 2.4), v: rnd(10, 30), ph: rnd(0, 6), a: rnd(0.3, 0.7) };
    case 'tumble': return { x: -80, y: rnd(470, 520), r: rnd(14, 22), rot: 0, wait: rnd(2, 6), vy: 0, by: 0 };
    default: return null;
  }
}

export class Weather {
  constructor(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext('2d');
    this.parts = [];
    this.modes = [];
    this.splash = [];
    this.fires = [[480, 450]];
    this.dpr = 1;
    this.resize();
  }
  set(modes = [], opt = {}) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.modes = modes;
    this.parts = [];
    this.fires = opt.fires || this.fires;
    this.dark = opt.dark || 0;
    for (const m of modes) {
      const n = Math.round((COUNTS[m] || 0) * (reduced ? 0.3 : 1) * (opt.density || 1));
      for (let i = 0; i < n; i++) { const p = make(m); if (p) { p.m = m; this.parts.push(p); } }
    }
    this.splash = [];
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.k = w / W;
  }
  update(dt, t, wind) {
    if (!this.modes.length) { if (this.drawn) { this.cx.clearRect(0, 0, this.cv.width, this.cv.height); this.drawn = false; } return; }
    this.resize();
    const c = this.cx, k = this.k;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, W, H);
    this.drawn = true;
    const wx = wind;
    for (const p of this.parts) {
      switch (p.m) {
        case 'rain': {
          p.y += p.v * dt; p.x += wx * 180 * dt;
          if (p.y > H || p.x > W + 120 || p.x < -120) {
            if (p.y > 380 && Math.random() < 0.5) this.splash.push({ x: p.x, y: rnd(400, H), t: 0 });
            Object.assign(p, make('rain'), { y: rnd(-60, -10) });
          }
          c.strokeStyle = `rgba(214,228,242,${p.a})`; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - wx * p.l * 0.25, p.y - p.l); c.stroke();
          break;
        }
        case 'snow': {
          p.y += p.v * dt; p.x += (Math.sin(t * 1.2 + p.ph) * 18 + wx * 70) * dt;
          if (p.y > H + 5) { p.y = -5; p.x = rnd(-50, W + 50); }
          if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20;
          c.fillStyle = `rgba(255,255,255,${p.a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
          break;
        }
        case 'dust': {
          p.x += (wx * 26 + Math.sin(t * 0.6 + p.ph) * 6) * dt; p.y += (Math.cos(t * 0.5 + p.ph) * 5 - p.v * 0.2) * dt;
          if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10; if (p.y < 40) p.y = H; if (p.y > H) p.y = 60;
          const a = p.a * (0.5 + 0.5 * Math.sin(t * 2 + p.ph));
          c.fillStyle = `rgba(255,236,190,${a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
          break;
        }
        case 'sand': case 'salt': {
          const dir = wx >= 0 ? 1 : -1;
          p.x += p.v * (0.4 + Math.abs(wx)) * dir * dt;
          if (p.x > W + 60 || p.x < -260) { Object.assign(p, make(p.m)); p.x = dir > 0 ? rnd(-260, -20) : rnd(W, W + 200); }
          c.strokeStyle = p.m === 'sand' ? `rgba(240,212,150,${p.a})` : `rgba(250,250,246,${p.a})`; c.lineWidth = p.m === 'salt' ? p.r : 1.3;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.l * dir, p.y + Math.sin(t * 3 + p.x * 0.02) * 1.5); c.stroke();
          break;
        }
        case 'leaves': case 'petals': case 'seeds': {
          p.y += p.v * dt; p.x += (wx * 70 + Math.sin(t * 1.4 + p.ph) * 24) * dt; p.rot += p.vr * dt;
          if (p.y > H + 10) { Object.assign(p, make(p.m)); p.y = -10; }
          if (p.x > W + 30) p.x = -30; if (p.x < -30) p.x = W + 30;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          if (p.m === 'seeds') {
            c.fillStyle = '#B8C46A'; c.beginPath(); c.ellipse(0, -p.s * 0.4, p.s * 0.3, p.s, 0, 0, 6.283); c.fill();
            c.fillStyle = '#6B4A2E'; c.beginPath(); c.arc(0, p.s * 0.5, 2, 0, 6.283); c.fill();
          } else {
            c.scale(1, Math.abs(Math.sin(t * 2 + p.ph)) * 0.7 + 0.3);
            c.fillStyle = p.c; c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, 6.283); c.fill();
            if (p.m === 'leaves') { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-p.s, 0); c.lineTo(p.s, 0); c.stroke(); }
          }
          c.restore();
          break;
        }
        case 'fireflies': {
          p.x += Math.sin(t * p.sp + p.ph) * 14 * dt + wx * 6 * dt; p.y += Math.cos(t * p.sp * 1.3 + p.ph) * 10 * dt;
          const a = Math.max(0, Math.sin(t * 2.2 * p.sp + p.ph));
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, `rgba(240,255,160,${a})`); g.addColorStop(1, 'rgba(240,255,160,0)');
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 5, 0, 6.283); c.fill();
          break;
        }
        case 'embers': {
          p.life += dt;
          if (p.life < 0) break;
          if (p.life > p.max || p.x === 0) {
            const [fx, fy] = this.fires[Math.floor(Math.random() * this.fires.length)];
            Object.assign(p, make('embers'), { x: fx + rnd(-12, 12), y: fy + rnd(-10, 6), life: 0 });
          }
          p.x += (p.vx + wx * 40 + Math.sin(t * 6 + p.max * 10) * 10) * dt; p.y += p.vy * dt;
          const a = 1 - p.life / p.max;
          c.fillStyle = `rgba(255,${Math.round(150 + 80 * a)},70,${a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
          break;
        }
        case 'bubbles': {
          p.y -= p.v * dt; p.x += Math.sin(t * 2 + p.ph) * 12 * dt;
          if (p.y < -10) { p.y = H + 10; p.x = rnd(0, W); }
          c.strokeStyle = 'rgba(223,245,251,.75)'; c.lineWidth = 1.2; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, 6.283); c.fill();
          break;
        }
        case 'gnats': {
          for (let i = 0; i < 4; i++) {
            const a = t * p.sp + p.ph + i * 1.7;
            const x = p.cx + Math.sin(a) * p.r + Math.sin(a * 2.3) * 5, y = p.cy + Math.cos(a * 1.3) * p.r * 0.6;
            c.fillStyle = 'rgba(40,30,30,.7)'; c.fillRect(x, y, 1.6, 1.6);
          }
          break;
        }
        case 'mist': {
          p.x += (p.v + wx * 20) * dt; if (p.x > W + 220) p.x = -p.w - 200;
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w * 0.5);
          g.addColorStop(0, `rgba(255,255,255,${p.a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          c.save(); c.translate(p.x, p.y); c.scale(1, p.h / p.w); c.translate(-p.x, -p.y);
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.w * 0.5, 0, 6.283); c.fill(); c.restore();
          break;
        }
        case 'wind': {
          p.life += dt;
          const dir = wx >= 0 ? 1 : -1;
          p.x += p.v * Math.max(0.3, Math.abs(wx)) * dir * dt;
          if (p.x > W + 260 || p.x < -320) Object.assign(p, make('wind'), { x: dir > 0 ? rnd(-320, -100) : W + 100 });
          c.strokeStyle = `rgba(255,255,255,${0.22 * Math.min(1, Math.abs(wx) + 0.2)})`; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(p.x, p.y);
          c.bezierCurveTo(p.x - p.l * 0.3 * dir, p.y - 10 * Math.sin(t + p.ph), p.x - p.l * 0.6 * dir, p.y + 10, p.x - p.l * dir, p.y); c.stroke();
          break;
        }
        case 'spray': {
          p.y -= p.v * dt; p.x += wx * 40 * dt + Math.sin(t + p.ph) * 4 * dt;
          if (p.y < 300) { p.y = H; p.x = rnd(0, W); }
          c.fillStyle = `rgba(240,250,255,${p.a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
          break;
        }
        case 'tumble': {
          if (p.wait > 0) { p.wait -= dt; break; }
          const v = 120 + Math.abs(wx) * 160, dir = wx >= 0 ? 1 : -1;
          p.x += v * dir * dt; p.rot += v * dir * dt / p.r;
          p.vy += 600 * dt; p.by += p.vy * dt; if (p.by > 0) { p.by = 0; p.vy = -rnd(80, 200); }
          if (p.x > W + 60 || p.x < -100) { Object.assign(p, make('tumble')); if (dir < 0) p.x = W + 60; }
          c.save(); c.translate(p.x, p.y + p.by); c.rotate(p.rot);
          c.strokeStyle = 'rgba(140,110,70,.9)'; c.lineWidth = 1.4;
          for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(Math.sin(i * 2.1) * 4, Math.cos(i * 1.7) * 4, p.r * (0.6 + (i % 3) * 0.15), i, i + 3.6); c.stroke(); }
          c.restore();
          c.fillStyle = 'rgba(30,22,48,.15)'; c.beginPath(); c.ellipse(p.x, p.y + p.r, p.r, 3, 0, 0, 6.283); c.fill();
          break;
        }
      }
    }
    // брызги дождя
    for (const s of this.splash) {
      s.t += dt;
      const a = 1 - s.t / 0.3;
      c.strokeStyle = `rgba(214,228,242,${a * 0.7})`; c.lineWidth = 1;
      c.beginPath(); c.ellipse(s.x, s.y, 2 + s.t * 30, 1 + s.t * 8, 0, Math.PI, 2 * Math.PI); c.stroke();
    }
    this.splash = this.splash.filter((s) => s.t < 0.3);
    if (this.modes.includes('rain')) { c.fillStyle = 'rgba(40,50,70,.08)'; c.fillRect(0, 0, W, H); }
  }
}
