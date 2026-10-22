// Конь героя и беркут Қыран — живые модели со своей анимацией:
// у коня дышат бока, двигаются уши, моргают глаза, качаются грива и хвост,
// он бьёт копытом и тянется мордой к хозяину; беркут крутит головой,
// раскрывает клюв, когда говорит, ерошит перья и летает.
import { Spring, chainSVG, shade, LINE, clamp } from './rig.js';
import { COATS } from './hero.js';

const NS = 'http://www.w3.org/2000/svg';
let UID = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
const f1 = (v) => Math.round(v * 10) / 10;

function chains(el, reg) {
  return reg.map((d) => {
    const els = [...el.querySelectorAll(`[data-d="${d.name}"]`)];
    return { ...d, els, sp: els.map(() => new Spring(d.base, d.k, d.d)) };
  });
}
function stepChains(list, t, wind, face, extra = 0, dt = 1 / 60, ph = 0) {
  const wl = wind * face;
  for (const c of list) {
    for (let i = 0; i < c.els.length; i++) {
      const s = c.sp[i];
      const sway = Math.sin(t * (1.8 + i * 0.5) + ph + i * 0.7) * (1.5 + Math.abs(wl) * 5);
      s.t = (i === 0 ? c.base + (c.swish || 0) : 0) - wl * c.amp * (0.5 + i * 0.25) + sway + extra * (c.react || 0);
      s.step(dt);
      c.els[i].setAttribute('transform', `rotate(${f1(s.v)})`);
    }
  }
}

// ── конь ───────────────────────────────────────────────
export class Horse {
  constructor(coatKey = 'tory', opt = {}) {
    const c = COATS[coatKey] || COATS.tory;
    this.id = 'h' + (++UID);
    const id = this.id, reg = [];
    const body = c.body, dark = c.dark, light = c.light;
    const L = `stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"`;
    const legF = (n) => {
      const col = n === 2 ? shade(body, -0.22) : body;
      return `<g data-k="fl${n}"><path d="M-10,-4 C-11,14 -9,32 -7,48 L7,48 C9,30 10,12 10,-4Z" fill="${col}" ${L}/>
        <g transform="translate(0,48)"><g data-k="fk${n}"><path d="M-6,0 L6,0 L5,34 C7,37 7,40 6,42 L-6,42 C-6,40 -6,37 -5,34Z" fill="${col}" ${L}/>
        <path d="M-6,30 L6,30 L6,38 L-6,38Z" fill="${shade(dark, n === 2 ? -0.2 : 0)}" opacity=".85"/>
        <path d="M-7.5,40 L8,40 L9,50 L-7,50Z" fill="#2B2B2B" ${L}/></g></g></g>`;
    };
    const legB = (n) => {
      const col = n === 2 ? shade(body, -0.22) : body;
      return `<g data-k="bl${n}"><path d="M-16,-10 C-20,10 -14,32 -6,44 L8,46 C10,30 12,12 14,-10Z" fill="${col}" ${L}/>
        <g transform="translate(1,45)"><g data-k="bk${n}"><path d="M-6,0 L6,0 L5,36 C7,39 7,42 6,44 L-6,44 C-6,42 -6,39 -5,36Z" fill="${col}" ${L}/>
        <path d="M-6,32 L6,32 L6,40 L-6,40Z" fill="${shade(dark, n === 2 ? -0.2 : 0)}" opacity=".85"/>
        <path d="M-7.5,42 L8,42 L9,52 L-7,52Z" fill="#2B2B2B" ${L}/></g></g></g>`;
    };
    const mane = Array.from({ length: 6 }, (_, i) => {
      const x = 4 + i * 9, y = -6 - i * 8.5;
      return `<g transform="translate(${x},${y}) rotate(${-30 + i * 4})">${chainSVG(reg, 'mane' + i, 3, 8, (j) => `<path d="M-3.4,0 L3.4,0 L${2.4 - j * 0.6},9 L${-2.4 + j * 0.6},9Z" fill="${shade(dark, j * 0.06)}"/>`, { amp: 22, k: 45, base: 50, react: 1 })}</g>`;
    }).join('');
    this.reg = reg;
    this.el = document.createElementNS(NS, 'g');
    this.el.setAttribute('class', 'horse');
    this.el.innerHTML = `<defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${body}"/><stop offset="1" stop-color="${shade(body, -0.25)}"/></linearGradient>
        <pattern id="${id}o" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="#A8322A"/>
          <path d="M2,9 Q2,2 5.5,2.5 Q8,3 6.6,6 M14,9 Q14,2 10.5,2.5 Q8,3 9.4,6" stroke="#E7A93B" stroke-width="1.3" fill="none"/></pattern>
      </defs>
      <ellipse cx="0" cy="2" rx="118" ry="11" fill="#1E1630" opacity=".2"/>
      <g data-k="hb">
        <g transform="translate(-112,-148)"><g data-k="tailRoot">${chainSVG(reg, 'tail', 6, 13, (i) => `<path d="M-${7 - i * 0.6},0 L${7 - i * 0.6},0 L${6 - i * 0.7},14 L${-6 + i * 0.7},14Z" fill="${shade(dark, i * 0.04)}"/><path d="M-2,2 L-1,13 M3,2 L2,13" stroke="${shade(dark, 0.25)}" stroke-width=".8"/>`, { amp: 26, k: 30, d: 5, base: 28, react: 0.5 })}</g></g>
        <g transform="translate(-58,-104)">${legB(2)}</g>
        <g transform="translate(72,-106)">${legF(2)}</g>
        <path d="M-104,-150 C-118,-132 -112,-104 -88,-96 C-60,-88 -10,-92 34,-94 C70,-96 98,-110 104,-140 C108,-160 92,-176 70,-176 C30,-178 -10,-170 -50,-168 C-80,-168 -98,-162 -104,-150Z" fill="url(#${id}g)" ${L}/>
        <path d="M-90,-100 C-50,-90 20,-92 60,-100" stroke="${shade(body, -0.35)}" stroke-width="2" fill="none" opacity=".5"/>
        <path d="M-96,-136 C-90,-120 -74,-110 -60,-112 M64,-120 C78,-128 90,-130 98,-142 M10,-108 C20,-116 26,-128 26,-140" stroke="${shade(body, -0.3)}" stroke-width="1.3" fill="none" opacity=".55"/>
        <path d="M-70,-164 C-30,-172 20,-176 60,-172" stroke="${shade(light, 0.2)}" stroke-width="3" fill="none" opacity=".5"/>
        <path d="M-46,-174 C-40,-148 -40,-124 -36,-110 L44,-112 C48,-130 48,-152 44,-176Z" fill="url(#${id}o)" ${L}/>
        <path d="M-36,-110 L44,-112" stroke="#E7A93B" stroke-width="2.4"/>
        ${[-30, -16, -2, 12, 26, 38].map((x) => `<g transform="translate(${x},-110)">${chainSVG(reg, 'fr' + x, 1, 7, () => `<path d="M-1.4,0 L1.4,0 L1.8,7 L-1.8,7Z" fill="#E7A93B"/>`, { amp: 18, k: 40 })}</g>`).join('')}
        <path d="M-36,-176 C-38,-190 -28,-196 -20,-188 C-6,-182 14,-182 28,-188 C34,-198 46,-198 46,-180 C40,-170 -30,-168 -36,-176Z" fill="#7A3E1E" ${L}/>
        <path d="M30,-188 C32,-200 44,-204 48,-194" stroke="#C3CAD2" stroke-width="3" fill="none"/>
        <circle cx="-30" cy="-184" r="2.5" fill="#D8DEE6"/><circle cx="40" cy="-186" r="2.5" fill="#D8DEE6"/>
        <path d="M4,-176 L2,-104" stroke="#5A3A1C" stroke-width="4"/>
        <g transform="translate(-4,-170)"><g data-k="stirrup">${chainSVG(reg, 'stir', 2, 22, (i) => i ? `<path d="M-1,0 L1,0 L1,16 L-1,16Z" fill="#5A3A1C"/><path d="M-8,16 Q0,10 8,16 L7,22 L-7,22Z" fill="#C3CAD2" stroke="${LINE}" stroke-width="1"/>` : `<path d="M-1.4,0 L1.4,0 L1.4,22 L-1.4,22Z" fill="#5A3A1C"/>`, { amp: 6, k: 60 })}</g></g>
        <g transform="translate(-72,-106)">${legB(1)}</g>
        <g transform="translate(58,-104)">${legF(1)}</g>
        <g transform="translate(66,-160)"><g data-k="neck">
          <path d="M-24,14 C-18,-20 8,-56 40,-73 C52,-79 64,-75 66,-62 C64,-44 56,-24 48,-6 C42,10 38,22 34,34 C14,30 -6,24 -24,14Z" fill="url(#${id}g)" ${L}/>
          <path d="M6,8 C14,-14 26,-38 44,-58" stroke="${shade(body, -0.3)}" stroke-width="1.4" fill="none" opacity=".5"/>
          ${mane}
          <g transform="translate(54,-68)"><g data-k="head">
            <path d="M-8,-6 C0,-12 12,-10 18,-3 C28,8 40,26 50,42 C54,48 54,56 47,60 C41,64 33,62 29,57 C23,51 18,46 11,44 C0,42 -10,34 -12,21 C-13,10 -12,1 -8,-6Z" fill="url(#${id}g)" ${L}/>
            <path d="M-6,22 C-2,34 6,40 14,41" stroke="${shade(body, -0.35)}" stroke-width="1.4" fill="none"/>
            <path d="M42,44 C48,46 51,52 48,57" stroke="${shade(body, -0.4)}" stroke-width="1.2" fill="none"/>
            <ellipse cx="46" cy="47" rx="3.2" ry="2.2" fill="#2B1A12" data-k="nostril"/>
            <path d="M31,57 C36,59 41,60 45,59" stroke="${shade(body, -0.45)}" stroke-width="1.3" fill="none" data-k="hmouth"/>
            <path d="M44,52 C48,56 50,60 47,62" fill="${shade(body, -0.2)}"/>
            ${opt.star !== false ? `<path d="M8,-6 L12,0 L8,6 L4,0Z" fill="#FBF8F0" opacity=".9"/>` : ''}
            <g transform="translate(-2,-10)"><g data-k="earB"><path d="M0,0 L-4,-16 L6,-2Z" fill="${shade(body, -0.25)}" ${L}/></g></g>
            <g transform="translate(4,-12)"><g data-k="earF"><path d="M0,0 L-2,-18 L8,-2Z" fill="${body}" ${L}/><path d="M0,-2 L-1,-13 L5,-3Z" fill="${shade(body, -0.45)}"/></g></g>
            <g transform="translate(0,-10) rotate(30)">${chainSVG(reg, 'forelock', 2, 6, () => `<path d="M-3,0 L3,0 L2,7 L-2,7Z" fill="${dark}"/>`, { amp: 20, k: 50, react: 1 })}</g>
            <ellipse cx="14" cy="6" rx="5" ry="4.4" fill="#1A120D"/>
            <circle cx="12.6" cy="4.6" r="1.4" fill="#fff"/>
            <path data-k="hlid" d="M8,6 Q14,6 19.5,6" fill="${body}" stroke="${shade(body, -0.4)}" stroke-width="1"/>
            <path d="M8,1 Q14,-2 20,2" stroke="${shade(body, -0.45)}" stroke-width="1.2" fill="none"/>
            <path d="M-6,-2 C6,4 22,22 38,52 M2,-12 C2,-2 4,6 8,12 M26,40 L40,34" stroke="#5A3A1C" stroke-width="2.6" fill="none"/>
            <circle cx="26" cy="40" r="3" fill="#D8DEE6" stroke="${LINE}" stroke-width=".8"/>
            <circle cx="10" cy="14" r="2.4" fill="#D8DEE6"/><circle cx="18" cy="24" r="2.4" fill="#D8DEE6"/>
            <circle cx="40" cy="55" r="3" fill="none" stroke="#C3CAD2" stroke-width="1.6"/>
          </g></g>
          <path d="M92,-18 C70,0 40,12 -2,-14" stroke="#5A3A1C" stroke-width="2" fill="none" data-k="reins"/>
        </g></g>
      </g>`;
    this.k = {};
    this.el.querySelectorAll('[data-k]').forEach((e) => { this.k[e.getAttribute('data-k')] = e; });
    this.chains = chains(this.el, reg);
    this.x = opt.x || 0; this.y = opt.y || 0; this.face = opt.face || 1; this.s = opt.s || 1;
    this.sp = { neck: new Spring(0, 40, 9), earF: new Spring(0, 160, 10), earB: new Spring(0, 160, 10), fk: new Spring(0, 140, 12), fl: new Spring(0, 120, 12), tail: new Spring(0, 30, 6) };
    this.t = 0; this.ph = Math.random() * 6;
    this.next = { ear: rnd(1, 3), toss: rnd(4, 9), stamp: rnd(5, 10), blink: rnd(2, 5), swish: rnd(2, 5) };
    this.blinkK = 0; this.act = null;
    this.apply();
  }
  mount(p) { p.appendChild(this.el); return this; }
  set(x, y, face = this.face, s = this.s) { this.x = x; this.y = y; this.face = face; this.s = s; this.apply(); return this; }
  nuzzle(dur = 1.8) { this.act = { name: 'nuzzle', t: 0, dur }; }
  toss() { this.act = { name: 'toss', t: 0, dur: 1 }; }
  headPos() { return { x: this.x + this.face * this.s * 150, y: this.y - this.s * 210 }; }
  update(dt, t, wind = 0) {
    this.t = t; this.dt = dt;
    const sp = this.sp, n = this.next;
    for (const key in n) n[key] -= dt;
    if (n.ear <= 0) { sp.earF.t = rnd(-25, 20); if (Math.random() < 0.5) sp.earB.t = rnd(-25, 15); n.ear = rnd(1.5, 4); }
    if (n.toss <= 0 && !this.act) { this.act = { name: Math.random() < 0.5 ? 'toss' : 'graze', t: 0, dur: Math.random() < 0.5 ? 1 : 2.6 }; n.toss = rnd(6, 12); }
    if (n.stamp <= 0) { this.stampT = 0.5; n.stamp = rnd(6, 13); }
    if (n.blink <= 0) { this.blinkK = 0.18; n.blink = rnd(2.5, 6); }
    if (n.swish <= 0) { this.swishT = 1; n.swish = rnd(3, 7); }
    let neck = Math.sin(t * 0.8 + this.ph) * 1.5;
    if (this.act) {
      const a = this.act; a.t += dt;
      const k = clamp(a.t / a.dur, 0, 1), bell = Math.sin(k * Math.PI);
      if (a.name === 'toss') neck += -Math.sin(k * Math.PI * 2) * 9 * (1 - k * 0.4);
      if (a.name === 'graze') neck += bell * 26;
      if (a.name === 'nuzzle') neck += bell * 16;
      if (k >= 1) this.act = null;
    }
    sp.neck.t = neck;
    if (this.stampT > 0) { this.stampT -= dt; sp.fk.t = 70; sp.fl.t = -26; } else { sp.fk.t = 0; sp.fl.t = 0; }
    let swish = 0;
    if (this.swishT > 0) { this.swishT -= dt; swish = Math.sin((1 - this.swishT) * Math.PI * 3) * 26; }
    this.chains.forEach((c) => { if (c.name === 'tail') c.swish = swish; });
    if (this.blinkK > 0) this.blinkK -= dt;
    for (const key in sp) sp[key].step(dt);
    stepChains(this.chains, t, wind, this.face, -sp.neck.vel * 0.15, dt, this.ph);
    this.apply();
  }
  apply() {
    const k = this.k, sp = this.sp, t = this.t || 0;
    const T = (e, v) => e && e.setAttribute('transform', v);
    T(this.el, `translate(${f1(this.x)},${f1(this.y)}) scale(${this.face * this.s},${this.s})`);
    T(k.hb, `translate(0,${f1(Math.sin(t * 1.4 + this.ph) * 0.9)})`);
    T(k.neck, `rotate(${f1(sp.neck.v)})`);
    T(k.head, `rotate(${f1(sp.neck.v * 0.5)})`);
    T(k.earF, `rotate(${f1(sp.earF.v)})`); T(k.earB, `rotate(${f1(sp.earB.v)})`);
    T(k.fl1, `rotate(${f1(sp.fl.v)})`); T(k.fk1, `rotate(${f1(sp.fk.v)})`);
    if (k.hlid) k.hlid.setAttribute('d', this.blinkK > 0 ? 'M8,6 Q14,0 19.5,6 Q14,9 8,6Z' : 'M8,1.5 Q14,-1.5 19.5,1.8');
    if (k.nostril) k.nostril.setAttribute('rx', f1(3 + Math.max(0, Math.sin(t * 1.4 + this.ph)) * 0.8));
  }
}

// ── беркут ─────────────────────────────────────────────
export class Eagle {
  constructor(opt = {}) {
    this.id = 'e' + (++UID);
    const reg = [];
    const L = `stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"`;
    const feather = (x, y, w, h, c, r = 0) => `<path transform="translate(${x},${y}) rotate(${r})" d="M0,0 C${w * 0.6},${h * 0.2} ${w},${h * 0.7} ${w * 0.5},${h} C${-w * 0.1},${h * 0.7} ${-w * 0.2},${h * 0.3} 0,0Z" fill="${c}" stroke="${shade(c, -0.35)}" stroke-width=".7"/>`;
    const wingFolded = (dk) => `<path d="M-8,-44 C8,-46 22,-34 20,-16 C18,-2 6,10 -14,18 C-26,22 -38,22 -46,20 C-34,8 -24,-12 -8,-44Z" fill="${shade('#6B4A2E', dk)}" ${L}/>
      ${[0, 1, 2, 3, 4].map((i) => feather(-10 - i * 7, -14 + i * 5, 10, 20, shade('#5A3E26', dk - i * 0.03), 40)).join('')}
      ${[0, 1, 2, 3].map((i) => feather(4 - i * 5, -34 + i * 7, 9, 14, shade('#8C6440', dk), 30)).join('')}`;
    const wingOpen = (dk, flip) => `<g transform="scale(1,${flip})"><path d="M0,0 C-14,-30 -40,-56 -84,-60 C-74,-50 -70,-44 -70,-38 C-80,-36 -90,-30 -94,-22 C-78,-22 -66,-18 -58,-12 C-66,-6 -72,2 -74,10 C-56,4 -30,4 -4,10Z" fill="${shade('#6B4A2E', dk)}" ${L}/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-58 - i * 5},${-40 + i * 9} l-${16 - i},${-2 + i * 2}" stroke="${shade('#3A2818', dk)}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
      <path d="M-6,-6 C-20,-26 -40,-40 -62,-44" stroke="#9C7448" stroke-width="2" fill="none" opacity=".6"/></g>`;
    this.el = document.createElementNS(NS, 'g');
    this.el.setAttribute('class', 'eagle-rig');
    this.el.innerHTML = `
      <ellipse data-k="shadow" cx="0" cy="2" rx="22" ry="4" fill="#1E1630" opacity=".2"/>
      <g data-k="body">
        <g data-k="folded">
          <g transform="translate(-14,-14)"><g data-k="tail"><path d="M0,0 L-22,24 L-14,30 L-6,26 L2,4Z" fill="#4A321E" ${L}/><path d="M-4,4 L-14,24 M0,4 L-8,26" stroke="#8C6440" stroke-width="1"/></g></g>
          <g transform="translate(8,0)">${wingFolded(-0.18)}</g>
          <path d="M-20,-30 C-24,-52 -4,-62 12,-56 C26,-50 30,-30 24,-12 C18,2 4,8 -8,6 C-20,2 -24,-14 -20,-30Z" fill="#6B4A2E" ${L}/>
          <path d="M-8,-20 C-2,-10 6,-6 16,-8" stroke="#8C6440" stroke-width="1.4" fill="none"/>
          ${[[-10, -4], [-2, 0], [6, -2], [-6, -12], [2, -10]].map(([x, y]) => `<path d="M${x},${y} q3,3 6,0" stroke="#4A321E" stroke-width="1" fill="none"/>`).join('')}
          <path d="M-8,0 C-10,8 -8,14 -4,16 L4,16 C8,12 8,6 6,0Z" fill="#8C6440" ${L}/>
          <path d="M-6,16 l-4,6 M-1,16 l0,7 M4,16 l4,6" stroke="#E7A93B" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M-12,22 l2,2 M-2,23 l0,3 M8,22 l1,3" stroke="#2B2B2B" stroke-width="1.6" stroke-linecap="round"/>
          <g transform="translate(-6,-24)">${wingFolded(0)}</g>
        </g>
        <g data-k="spread" style="display:none">
          <g transform="translate(0,-24)"><g data-k="wingB">${wingOpen(-0.2, 1)}</g></g>
          <path d="M-36,-24 L-58,-16 L-56,-6 L-34,-14Z" fill="#4A321E" ${L}/>
          <path d="M-34,-30 C-30,-42 6,-44 18,-34 C28,-26 26,-14 14,-10 C-4,-6 -28,-12 -34,-30Z" fill="#6B4A2E" ${L}/>
          <path d="M-14,-12 l-3,7 M-8,-12 l0,7" stroke="#E7A93B" stroke-width="2.4" stroke-linecap="round"/>
          <g transform="translate(-4,-28)"><g data-k="wingF">${wingOpen(0, 1)}</g></g>
        </g>
        <g transform="translate(14,-52)"><g data-k="head">
          <g transform="translate(-8,-2) rotate(150)">${chainSVG(reg, 'nape', 2, 6, () => `<path d="M-3,0 L3,0 L1,8 L-1,8Z" fill="#C9A06A"/>`, { amp: 30, k: 50 })}</g>
          <path d="M-14,4 C-16,-12 -4,-20 8,-18 C18,-16 22,-8 20,2 C16,10 2,12 -8,10 C-12,8 -14,6 -14,4Z" fill="#C9A06A" ${L}/>
          <path d="M-12,-2 C-4,-6 6,-8 14,-4" stroke="#A8804E" stroke-width="1.2" fill="none"/>
          <path d="M-10,6 C-6,2 0,2 6,6" stroke="#A8804E" stroke-width="1" fill="none"/>
          <circle cx="10" cy="-7" r="3.6" fill="#D98E1F"/><circle cx="10.5" cy="-7" r="2" fill="#120A06"/><circle cx="9.3" cy="-8.2" r=".9" fill="#fff"/>
          <rect data-k="elid" x="6" y="-11" width="8" height="0" fill="#C9A06A"/>
          <path d="M4,-11 C8,-14 14,-13 17,-9" stroke="#5A3E26" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M16,-6 C20,-8 24,-6 24,-2 L18,-1Z" fill="#F2C94C" ${L}/>
          <g transform="translate(18,0)"><g data-k="beakLo"><path d="M0,0 L10,0 C9,3 6,5 2,4Z" fill="#B8862A" ${L}/></g></g>
          <path d="M18,-3 C26,-6 32,-2 32,4 C30,6 28,5 27,3 C25,1 22,0 18,0Z" fill="#3A3028" ${L}/>
        </g></g>
      </g>`;
    this.k = {};
    this.el.querySelectorAll('[data-k]').forEach((e) => { this.k[e.getAttribute('data-k')] = e; });
    this.chains = chains(this.el, reg);
    this.x = opt.x || 0; this.y = opt.y || 0; this.face = opt.face || 1; this.s = opt.s || 1;
    this.sp = { head: new Spring(0, 160, 14), beak: new Spring(0, 400, 26), bob: new Spring(0, 100, 12) };
    this.t = 0; this.talking = false; this.vis = 0; this.flight = null; this.flying = false;
    this.next = { look: rnd(1, 3), blink: rnd(2, 4), ruffle: rnd(5, 9) };
    this.blinkK = 0; this.gaze = null;
    this.apply();
  }
  mount(p) { p.appendChild(this.el); return this; }
  set(x, y, face = this.face, s = this.s) { this.x = x; this.y = y; this.face = face; this.s = s; this.apply(); return this; }
  look(t) { this.gaze = t; return this; }
  talk(on) { this.talking = on; return this; }
  setViseme(v) { this.vis = v[0]; }
  headPos() { return { x: this.x + this.face * this.s * 20, y: this.y - this.s * 56 }; }
  // перелёт по дуге с посадкой
  flyTo(x, y, dur = 1.6, arc = 120) {
    return new Promise((res) => {
      if (this.flight) this.flight.res();
      this.flight = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, dur, arc, res };
      this.face = x >= this.x ? 1 : -1;
      this.setSpread(true);
    });
  }
  setSpread(on) { this.flying = on; this.k.folded.style.display = on ? 'none' : ''; this.k.spread.style.display = on ? '' : 'none'; if (this.k.shadow) this.k.shadow.style.display = on ? 'none' : ''; }
  update(dt, t, wind = 0) {
    this.t = t;
    const sp = this.sp, n = this.next;
    for (const key in n) n[key] -= dt;
    if (this.flight) {
      const f = this.flight; f.t += dt;
      const k = clamp(f.t / f.dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.x = f.x0 + (f.x1 - f.x0) * e;
      this.y = f.y0 + (f.y1 - f.y0) * e - Math.sin(e * Math.PI) * f.arc;
      const flap = Math.sin(t * 16);
      this.k.wingF?.setAttribute('transform', `rotate(${f1(flap * 34 - 10)})`);
      this.k.wingB?.setAttribute('transform', `rotate(${f1(flap * 30 - 18)})`);
      if (k >= 1) { this.flight = null; this.setSpread(false); f.res(); }
    } else if (this.flying) {
      const flap = Math.sin(t * 12);
      this.k.wingF?.setAttribute('transform', `rotate(${f1(flap * 30 - 10)})`);
      this.k.wingB?.setAttribute('transform', `rotate(${f1(flap * 26 - 18)})`);
    }
    if (n.look <= 0) { this.headLook = rnd(-14, 12); n.look = rnd(0.8, 2.6); }
    if (n.blink <= 0) { this.blinkK = 0.14; n.blink = rnd(2, 5); }
    if (n.ruffle <= 0) { this.ruffleT = 0.5; n.ruffle = rnd(6, 11); }
    let head = this.headLook || 0;
    if (this.gaze) {
      const tg = this.gaze.headPos ? this.gaze.headPos() : this.gaze;
      const hp = this.headPos();
      head = clamp((tg.y - hp.y) / 6, -20, 25);
      if ((tg.x - hp.x) * this.face < -30 && !this.flight) this.face *= -1;
    }
    if (this.talking) head += this.vis * 6;
    sp.head.t = head;
    sp.beak.t = this.talking ? this.vis * 26 : 0;
    let bob = 0;
    if (this.ruffleT > 0) { this.ruffleT -= dt; bob = Math.sin(this.ruffleT * 40) * 1.5; }
    sp.bob.t = bob;
    if (this.blinkK > 0) this.blinkK -= dt;
    for (const key in sp) sp[key].step(dt);
    stepChains(this.chains, t, wind, this.face, 0, dt);
    this.apply();
  }
  apply() {
    const k = this.k, sp = this.sp;
    const T = (e, v) => e && e.setAttribute('transform', v);
    T(this.el, `translate(${f1(this.x)},${f1(this.y)}) scale(${this.face * this.s},${this.s})`);
    T(k.body, `translate(0,${f1(sp.bob.v)})`);
    T(k.head, `rotate(${f1(sp.head.v)})`);
    T(k.beakLo, `rotate(${f1(sp.beak.v)})`);
    T(k.tail, `rotate(${f1(Math.sin((this.t || 0) * 1.3) * 3)})`);
    if (k.elid) k.elid.setAttribute('height', this.blinkK > 0 ? 8 : 0);
  }
}
