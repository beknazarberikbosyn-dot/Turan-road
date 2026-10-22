// Детальные фоны для анимированных сцен (960×540).
// Каждый фон делится на слои: bg — неподвижная детальная картина,
// mid — живые элементы (облака, дым, птицы, стада, блики воды, люди вдали),
// fg — передний план (трава, цветы, камыш), который качает ветер.
// anchors — точки на картинке, к которым привязаны исследования и выборы.
import { rng } from './geo.js';
import { beast, eagle as eagleSprite } from './sprites.js';
import { shade, mix } from './rig.js';

export const SW = 960, SH = 540, GROUND = 505;
let BID = 0;
const f = (v) => Math.round(v * 10) / 10;

const TONES = {
  day: { sky: ['#3F9FDB', '#9CD3F0', '#DDF0F7'], sun: '#FFF4CC', sunAt: [800, 92], haze: '#E8F3F4', light: 0 },
  hot: { sky: ['#5AA8D8', '#B6DCEC', '#F3E9CF'], sun: '#FFF1BA', sunAt: [760, 80], haze: '#F6EBD2', light: 0.05 },
  dusk: { sky: ['#2E2462', '#9C4F86', '#F2A15C'], sun: '#FFD08A', sunAt: [780, 318], haze: '#F0A878', light: -0.05 },
  night: { sky: ['#0B1030', '#1E2A5A', '#3A4A7A'], sun: '#F4F0D8', sunAt: [790, 86], haze: '#2E3A66', light: -0.35, stars: true, moon: true },
  past: { sky: ['#C9874A', '#E9B677', '#F7E1B6'], sun: '#FFF0C4', sunAt: [790, 96], haze: '#F3D9AA', light: 0 },
  saka: { sky: ['#B4683A', '#E19A5E', '#F6D7A0'], sun: '#FFE8B0', sunAt: [740, 120], haze: '#F2C890', light: 0 },
  cold: { sky: ['#6D97C6', '#B9D2E8', '#EEF3F7'], sun: '#FFFFFF', sunAt: [820, 90], haze: '#EAF0F5', light: 0 },
  storm: { sky: ['#4E5D70', '#7F8E9E', '#B8C2CA'], sun: null, haze: '#AEB8C0', light: -0.12 },
  haze: { sky: ['#8FB2C8', '#C9D8DC', '#EDE6D6'], sun: '#FFF6DA', sunAt: [700, 110], haze: '#EAE2D0', light: 0 },
};

// ── базовые кисти ─────────────────────────────────────
function skyLayer(P, tone, r) {
  const T = TONES[tone] || TONES.day;
  let o = `<defs>
    <linearGradient id="${P}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset=".55" stop-color="${T.sky[1]}"/><stop offset="1" stop-color="${T.sky[2]}"/></linearGradient>
    <radialGradient id="${P}sun"><stop offset="0" stop-color="${T.sun || '#fff'}" stop-opacity=".95"/><stop offset=".25" stop-color="${T.sun || '#fff'}" stop-opacity=".45"/><stop offset="1" stop-color="${T.sun || '#fff'}" stop-opacity="0"/></radialGradient>
  </defs><rect width="${SW}" height="${SH}" fill="url(#${P}sky)"/>`;
  if (T.stars) {
    o += `<ellipse cx="420" cy="140" rx="520" ry="70" fill="#9FB4E8" opacity=".12" transform="rotate(-18 420 140)"/>`;
    for (let i = 0; i < 160; i++) {
      const x = r() * SW, y = r() * 300, s = r();
      o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.4 + s * 1.3)}" fill="#fff" opacity="${f(0.35 + s * 0.6)}"${s > 0.85 ? ' class="bd-twinkle" style="--d:' + f(r() * 3) + 's"' : ''}/>`;
    }
  }
  if (T.sun) {
    const [sx, sy] = T.sunAt;
    o += `<circle cx="${sx}" cy="${sy}" r="190" fill="url(#${P}sun)"/>`;
    if (T.moon) o += `<circle cx="${sx}" cy="${sy}" r="26" fill="#F4F0D8"/><circle cx="${sx + 10}" cy="${sy - 6}" r="22" fill="${T.sky[0]}" opacity=".0"/><circle cx="${sx - 8}" cy="${sy + 4}" r="5" fill="#D8D2B8" opacity=".6"/><circle cx="${sx + 7}" cy="${sy - 8}" r="3.5" fill="#D8D2B8" opacity=".5"/>`;
    else o += `<circle cx="${sx}" cy="${sy}" r="34" fill="${T.sun}"/>`;
  }
  return o;
}

function cloud(x, y, s, c = '#FFFFFF', shadowC = '#C9D8E6') {
  const puffs = [[0, 0, 34], [32, -14, 30], [62, -4, 28], [88, 6, 22], [-28, 8, 22], [20, 12, 30], [52, 14, 26]];
  return `<g class="bd-cloud" data-cloud="${f(0.5 + Math.random())}" data-x="${x}"><g transform="translate(${x},${y}) scale(${s})">
    ${puffs.map(([px, py, pr]) => `<circle cx="${px}" cy="${py + 6}" r="${pr}" fill="${shadowC}"/>`).join('')}
    ${puffs.map(([px, py, pr]) => `<circle cx="${px}" cy="${py}" r="${pr}" fill="${c}"/>`).join('')}
    <path d="M-30,-6 Q0,-40 40,-30" stroke="#fff" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/></g></g>`;
}

// горный хребет с гранями, тенями и снежными шапками
function range(r, o) {
  const { y, h, x0 = -60, x1 = SW + 60, n = 7, c = '#8EA4B8', snow = false, shadow = 0.18, jag = 0.35 } = o;
  const step = (x1 - x0) / n;
  const peaks = [];
  for (let i = 0; i <= n; i++) {
    const px = x0 + i * step + (r() - 0.5) * step * 0.5;
    const ph = h * (0.45 + r() * 0.55);
    peaks.push([px, y - ph]);
  }
  let d = `M${x0},${y + 4}`;
  const valleys = [];
  peaks.forEach(([px, py], i) => {
    if (i > 0) {
      const [qx, qy] = peaks[i - 1];
      const vx = (px + qx) / 2 + (r() - 0.5) * step * 0.2, vy = Math.max(py, qy) + h * (0.15 + r() * 0.25);
      valleys.push([vx, Math.min(vy, y)]);
      const mx1 = (qx + vx) / 2, my1 = (qy + vy) / 2 + (r() - 0.5) * h * jag * 0.3;
      const mx2 = (vx + px) / 2, my2 = (vy + py) / 2 + (r() - 0.5) * h * jag * 0.3;
      d += ` L${f(mx1)},${f(my1)} L${f(vx)},${f(Math.min(vy, y))} L${f(mx2)},${f(my2)}`;
    }
    d += ` L${f(px)},${f(py)}`;
  });
  d += ` L${x1},${y + 4}Z`;
  let s = `<path d="${d}" fill="${c}"/>`;
  peaks.forEach(([px, py], i) => {
    const v = valleys[i] || [px + step * 0.5, y];
    s += `<path d="M${f(px)},${f(py)} L${f(v[0])},${f(v[1])} L${f(v[0] - step * 0.12)},${f(y + 4)} L${f(px + step * 0.05)},${f(y + 4)}Z" fill="#000" opacity="${shadow}"/>`;
    if (snow && y - py > h * 0.55) {
      const sh = (y - py) * 0.3;
      s += `<path d="M${f(px)},${f(py)} L${f(px + sh * 0.7)},${f(py + sh * 0.9)} L${f(px + sh * 0.35)},${f(py + sh * 0.7)} L${f(px + sh * 0.1)},${f(py + sh)} L${f(px - sh * 0.2)},${f(py + sh * 0.65)} L${f(px - sh * 0.45)},${f(py + sh * 0.85)} L${f(px - sh * 0.7)},${f(py + sh * 0.8)}Z" fill="#FBFCFD"/>
        <path d="M${f(px)},${f(py)} L${f(px + sh * 0.7)},${f(py + sh * 0.9)} L${f(px + sh * 0.35)},${f(py + sh * 0.7)} L${f(px + sh * 0.1)},${f(py + sh)}Z" fill="#C9D6E2"/>`;
    }
  });
  return s;
}

function hills(y, amp, c, seed = 1, n = 6) {
  const r = rng(seed);
  let d = `M-20,${y}`;
  for (let i = 0; i < n; i++) {
    const x0 = -20 + (i / n) * (SW + 40), x1 = -20 + ((i + 1) / n) * (SW + 40);
    d += ` Q${f((x0 + x1) / 2)},${f(y - amp * (0.4 + r() * 0.8))} ${f(x1)},${f(y + (r() - 0.5) * amp * 0.3)}`;
  }
  return `<path d="${d} L${SW + 20},${SH} L-20,${SH}Z" fill="${c}"/>`;
}

function groundTex(r, y0, y1, n, c, len = 7) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + Math.pow(r(), 0.8) * (y1 - y0), k = (y - y0) / (y1 - y0 + 1);
    const x = r() * SW, l = len * (0.35 + k * 1.1);
    d += `M${f(x)},${f(y)} l${f((r() - 0.5) * l * 0.6)},${f(-l)} `;
  }
  return `<path d="${d}" stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
function pebbles(r, y0, y1, n, c) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + r() * (y1 - y0), k = (y - y0) / (y1 - y0 + 1), x = r() * SW, s = 1.5 + k * 5 * r();
    o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 1.4)}" ry="${f(s * 0.8)}" fill="${shade(c, (r() - 0.5) * 0.3)}"/><ellipse cx="${f(x - s * 0.3)}" cy="${f(y - s * 0.3)}" rx="${f(s * 0.6)}" ry="${f(s * 0.3)}" fill="#fff" opacity=".25"/>`;
  }
  return o;
}
function tulips(r, y0, y1, n, cols = ['#D8343A', '#F2C14E', '#E86A3A']) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + r() * (y1 - y0), x = r() * SW, s = 0.6 + (y - y0) / (y1 - y0 + 1) * 1.1, c = cols[Math.floor(r() * cols.length)];
    o += `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})"><path d="M0,0 Q-1,-8 0,-14" stroke="#4E7A34" stroke-width="1.4" fill="none"/><path d="M0,-6 Q-6,-8 -7,-3" fill="#5E8A3E"/><path d="M-3.5,-14 Q-4,-20 0,-21 Q4,-20 3.5,-14 Q0,-11 -3.5,-14Z" fill="${c}"/><path d="M0,-21 L0,-15" stroke="${shade(c, -0.3)}" stroke-width=".8"/></g>`;
  }
  return o;
}

// деревья — каждое качает ветер
function sway(x, y, amp, inner) { return `<g data-sway="${amp}" data-px="${f(x)}" data-py="${f(y)}">${inner}</g>`; }
function broadTree(x, y, s, c = '#4F8A3A', fruit = null) {
  const d = shade(c, -0.25), l = shade(c, 0.2);
  const cl = [[0, -62, 30], [-24, -48, 22], [24, -50, 24], [-12, -78, 22], [14, -80, 20], [0, -40, 22]];
  return sway(x, y, 1.2 * s, `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M-4,0 L-3,-40 L-12,-56 M-3,-46 L8,-60 M-3,-30 L-14,-40" stroke="#5A3A1C" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${cl.map(([cx, cy, cr]) => `<circle cx="${cx}" cy="${cy + 4}" r="${cr}" fill="${d}"/>`).join('')}
    ${cl.map(([cx, cy, cr]) => `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="${c}"/>`).join('')}
    ${cl.slice(0, 4).map(([cx, cy, cr]) => `<circle cx="${cx - cr * 0.3}" cy="${cy - cr * 0.35}" r="${cr * 0.5}" fill="${l}" opacity=".7"/>`).join('')}
    ${fruit ? Array.from({ length: 14 }, (_, i) => `<circle cx="${f(Math.sin(i * 2.4) * 30)}" cy="${f(-60 + Math.cos(i * 1.7) * 26)}" r="2.6" fill="${fruit}"/>`).join('') : ''}
  </g>`);
}
function poplar(x, y, h, c = '#5C8A3C') {
  return sway(x, y, 1.6, `<g transform="translate(${x},${y})"><rect x="-2" y="-${h * 0.25}" width="4" height="${h * 0.25}" fill="#6B4A2E"/>
    <path d="M0,-${h} C-14,-${h * 0.75} -15,-${h * 0.3} -8,-${h * 0.12} L8,-${h * 0.12} C15,-${h * 0.3} 14,-${h * 0.75} 0,-${h}Z" fill="${c}"/>
    <path d="M0,-${h * 0.96} C10,-${h * 0.7} 11,-${h * 0.35} 6,-${h * 0.14} L8,-${h * 0.12} C15,-${h * 0.3} 14,-${h * 0.75} 0,-${h}Z" fill="${shade(c, -0.25)}"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M-6,-${f(h * (0.25 + i * 0.11))} q6,-6 12,0" stroke="${shade(c, 0.2)}" stroke-width="1.4" fill="none"/>`).join('')}</g>`);
}
function pine(x, y, s, c = '#2F5E36') {
  const l = shade(c, 0.18), d = shade(c, -0.25);
  return sway(x, y, 0.7 * s, `<g transform="translate(${x},${y}) scale(${s})"><rect x="-2.5" y="-14" width="5" height="16" fill="#5A3A1C"/>
    ${[0, 1, 2, 3].map((i) => { const w = 26 - i * 5, yy = -12 - i * 16; return `<path d="M${-w},${yy} L0,${yy - 26} L${w},${yy}Z" fill="${c}"/><path d="M0,${yy - 26} L${w},${yy} L${w * 0.2},${yy}Z" fill="${d}"/><path d="M${-w * 0.6},${yy - 4} L0,${yy - 22}" stroke="${l}" stroke-width="1.4"/>`; }).join('')}</g>`);
}
function birch(x, y, s) {
  return sway(x, y, 1.3 * s, `<g transform="translate(${x},${y}) scale(${s})"><path d="M-2.5,0 L-2,-78 L2,-78 L2.5,0Z" fill="#F4F2EA"/>
    ${[-12, -26, -40, -55, -68].map((yy) => `<path d="M-2.5,${yy} l3,-1.2" stroke="#2B2B2B" stroke-width="1.4"/>`).join('')}
    ${[[0, -80, 18], [-14, -66, 14], [14, -64, 15], [0, -58, 14]].map(([cx, cy, cr]) => `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="#9CB84E" opacity=".95"/>`).join('')}
    ${[[-6, -84, 6], [8, -70, 5]].map(([cx, cy, cr]) => `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="#D9C24E" opacity=".9"/>`).join('')}</g>`);
}
function reeds(x, y, n, h = 60, r = Math.random) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const xx = x + (r() - 0.5) * 50, hh = h * (0.6 + r() * 0.6), bend = (r() - 0.5) * 16;
    o += sway(xx, y, 3, `<path d="M${f(xx)},${y} Q${f(xx + bend * 0.4)},${f(y - hh * 0.6)} ${f(xx + bend)},${f(y - hh)}" stroke="#8C8A3E" stroke-width="2" fill="none"/>${r() < 0.5 ? `<ellipse cx="${f(xx + bend)}" cy="${f(y - hh + 4)}" rx="2.6" ry="7" fill="#6B4A2E" transform="rotate(${f(bend)} ${f(xx + bend)} ${f(y - hh + 4)})"/>` : `<path d="M${f(xx + bend)},${f(y - hh)} l-5,-8 M${f(xx + bend)},${f(y - hh)} l4,-9" stroke="#C9B87A" stroke-width="1.2"/>`}`);
  }
  return o;
}
function grassClump(x, y, s, c = '#6F8A3A', r = Math.random) {
  let d = '';
  for (let i = 0; i < 9; i++) { const a = -50 + i * 12 + (r() - 0.5) * 8, l = (22 + r() * 18) * s; d += `M${f(x + (i - 4) * 2 * s)},${y} q${f(Math.sin(a * Math.PI / 180) * l * 0.4)},${f(-l * 0.6)} ${f(Math.sin(a * Math.PI / 180) * l)},${f(-l)} `; }
  return sway(x, y, 4, `<path d="${d}" stroke="${c}" stroke-width="${f(2 * s)}" fill="none" stroke-linecap="round"/>`);
}
function kovyl(x, y, s, r = Math.random) {
  let o = '';
  for (let i = 0; i < 5; i++) {
    const xx = x + (r() - 0.5) * 24 * s, h = (34 + r() * 26) * s, b = (8 + r() * 10) * s;
    o += `<path d="M${f(xx)},${y} Q${f(xx + b * 0.3)},${f(y - h * 0.6)} ${f(xx + b)},${f(y - h)}" stroke="#9C9A6A" stroke-width="${f(1.2 * s)}" fill="none"/><path d="M${f(xx + b)},${f(y - h)} q${f(10 * s)},${f(2 * s)} ${f(20 * s)},${f(10 * s)}" stroke="#F2EEE0" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round" opacity=".85"/>`;
  }
  return sway(x, y, 6, o);
}
function saxaul(x, y, s) {
  return sway(x, y, 1.5, `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 L0,-18 M0,-12 L-12,-26 M0,-16 L10,-32 M-8,-22 L-16,-24 M8,-28 L16,-30" stroke="#6B4A2E" stroke-width="3" stroke-linecap="round"/>
    <circle cx="-15" cy="-28" r="7" fill="#8C9A5A"/><circle cx="14" cy="-34" r="8" fill="#8C9A5A"/><circle cx="-2" cy="-26" r="6" fill="#7E8A4E"/><circle cx="6" cy="-38" r="5" fill="#9CAA66"/></g>`);
}

function yurt(x, y, s, P, o = {}) {
  const felt = o.felt || '#F2EBDD', band = o.band || '#A8322A';
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="62" ry="8" fill="#1E1630" opacity=".2"/>
    <path d="M-56,0 L-56,-34 L56,-34 L56,0Z" fill="${felt}" stroke="#7A6A50" stroke-width="1.5"/>
    <path d="M-56,-34 L56,-34 L56,-10 L-56,-10Z" fill="url(#${P}kerege)" opacity=".45"/>
    <path d="M-56,-34 Q0,-86 56,-34Z" fill="${shade(felt, -0.04)}" stroke="#7A6A50" stroke-width="1.5"/>
    ${[-40, -24, -8, 8, 24, 40].map((xx) => `<path d="M${xx},-34 Q${xx * 0.5},-60 ${xx * 0.2},-74" stroke="#9C8A6A" stroke-width="1" fill="none" opacity=".6"/>`).join('')}
    <path d="M-56,-34 Q0,-86 56,-34" fill="none" stroke="${band}" stroke-width="4"/>
    <path d="M-56,-22 L56,-22" stroke="${band}" stroke-width="3" stroke-dasharray="8 5"/>
    <path d="M-56,-30 L56,-30 M-56,-14 L56,-14" stroke="#C9A06A" stroke-width="1.2"/>
    <ellipse cx="0" cy="-76" rx="12" ry="4" fill="#6B4A2E"/>
    <path d="M-12,0 L-12,-28 L12,-28 L12,0Z" fill="${o.door || '#8C2A20'}" stroke="#5A1E16" stroke-width="1.5"/>
    <path d="M-12,-28 L12,-28 M0,-28 V0 M-12,-14 h24" stroke="#E7A93B" stroke-width="1.6"/>
    <path d="M-8,-24 q8,6 16,0 M-8,-6 q8,-6 16,0" stroke="#E7A93B" stroke-width="1.2" fill="none"/>
    ${o.glow ? `<path d="M-11,-1 L-11,-27 L11,-27 L11,-1Z" fill="#FFC86A" opacity=".85"/><path d="M-11,0 L-30,24 L30,24 L11,0Z" fill="#FFC86A" opacity=".18"/>` : ''}
  </g>`;
}
function smoke(x, y, n = 5, c = '#E8E4DC') {
  return `<g class="bd-smoke" transform="translate(${x},${y})">${Array.from({ length: n }, (_, i) => `<circle r="${6 + i}" fill="${c}" style="--d:${f(i * 0.8)}s"/>`).join('')}</g>`;
}
function birds(y, n = 5, dur = 38, delay = 0, s = 1) {
  return `<g class="bd-birds" style="--dur:${dur}s;--del:${delay}s"><g transform="translate(0,${y}) scale(${s})">${Array.from({ length: n }, (_, i) => `<path class="bd-wing" style="--d:${f(i * 0.11)}s" d="M${i * 18 - (i % 2) * 8},${(i % 3) * 9} q6,-7 12,0 q6,-7 12,0" stroke="#2B2350" stroke-width="2" fill="none"/>`).join('')}</g></g>`;
}
function walker(x, y, s, c = '#3F5FA8', dx = 120, dur = 24, del = 0, hat = '#F2EBDD') {
  return `<g class="bd-walk${dx === 0 ? ' still' : ''}" style="--dx:${dx}px;--dur:${dur}s;--del:${del}s;--s0:${dx < 0 ? -1 : 1}"><g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="9" ry="2" fill="#000" opacity=".2"/>
    <path class="bd-leg" d="M-3,-20 L-4,0" stroke="#3A2A20" stroke-width="3.5"/><path class="bd-leg2" d="M3,-20 L4,0" stroke="#2B1A12" stroke-width="3.5"/>
    <path d="M-8,-20 L-7,-46 Q0,-50 7,-46 L8,-20Z" fill="${c}"/><circle cy="-52" r="6" fill="#D9A27A"/><path d="M-6,-55 Q0,-64 6,-55Z" fill="${hat}"/></g></g>`;
}
function herd(kind, x, y, s, n, dx, dur, del = 0) {
  return `<g class="bd-walk" style="--dx:${dx}px;--dur:${dur}s;--del:${del}s;--s0:${dx < 0 ? -1 : 1}">${Array.from({ length: n }, (_, i) => `<g transform="translate(${x + i * 34 * s + (i % 2) * 6},${y + (i % 3) * 6}) scale(${s})">${beast(kind, 'walk').replace('<svg ', '<svg width="80" height="64" x="-40" y="-60" ')}</g>`).join('')}</g>`;
}
function shimmer(x0, x1, y0, y1, n, r, c = '#FFFFFF') {
  let o = '';
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), w = 8 + r() * 26 * (y - y0 + 20) / (y1 - y0 + 20); o += `<path class="bd-shim" style="--d:${f(r() * 3)}s" d="M${f(x)},${f(y)} h${f(w)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`; }
  return o;
}
function patterns(P) {
  return `<defs>
    <pattern id="${P}brick" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="#D8BC8E"/><path d="M0,0 H16 M0,4 H16 M8,0 V4 M0,4 V8 M16,4 V8" stroke="#B89A6C" stroke-width=".8"/></pattern>
    <pattern id="${P}mud" width="22" height="10" patternUnits="userSpaceOnUse"><rect width="22" height="10" fill="#C8A878"/><path d="M0,0 H22 M0,5 H22 M11,0 V5 M0,5 V10" stroke="#A8885A" stroke-width=".9"/></pattern>
    <pattern id="${P}girih" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#1C7F9A"/><path d="M10,1 L13,7 L19,10 L13,13 L10,19 L7,13 L1,10 L7,7Z" fill="#E9F4F1"/><circle cx="10" cy="10" r="2.6" fill="#23518F"/><path d="M0,0 L4,4 M20,0 L16,4 M0,20 L4,16 M20,20 L16,16" stroke="#E7C04A" stroke-width="1.4"/></pattern>
    <pattern id="${P}girih2" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#23518F"/><path d="M7,0 L14,7 L7,14 L0,7Z" fill="#2E9AA8"/><circle cx="7" cy="7" r="2" fill="#F4EFE4"/></pattern>
    <pattern id="${P}kerege" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0 L8,8 M8,0 L0,8" stroke="#8C6A42" stroke-width="1"/></pattern>
    <pattern id="${P}terra" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#D18A55"/><rect x="1" y="1" width="16" height="16" fill="none" stroke="#A9612E" stroke-width="1"/>
      <path d="M9,2 L16,9 L9,16 L2,9Z" fill="none" stroke="#9E5A2C" stroke-width="1.3"/><circle cx="9" cy="9" r="2.4" fill="#B86E3A"/></pattern>
    <pattern id="${P}terra2" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#D49060"/><rect x="1" y="1" width="16" height="16" fill="none" stroke="#A9612E" stroke-width="1"/>
      <path d="M4,4 L14,14 M14,4 L4,14 M9,2 V16 M2,9 H16" stroke="#9E5A2C" stroke-width="1.1"/><circle cx="9" cy="9" r="3" fill="none" stroke="#9E5A2C" stroke-width="1.1"/></pattern>
    <pattern id="${P}strata" width="40" height="24" patternUnits="userSpaceOnUse"><rect width="40" height="24" fill="#C0643A"/><path d="M0,5 Q20,3 40,6 M0,13 Q20,15 40,12 M0,20 Q20,18 40,21" stroke="#9C4626" stroke-width="2" fill="none"/></pattern>
    <pattern id="${P}chalk" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="#F4EEE2"/><path d="M0,6 Q20,4 40,7" stroke="#E6CDB4" stroke-width="2.4" fill="none"/><path d="M0,15 Q20,17 40,14" stroke="#E9D9C2" stroke-width="1.6" fill="none"/></pattern>
    <pattern id="${P}rock" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#5E4434"/><path d="M0,10 L12,6 L22,12 L30,8 M4,24 L14,20 L26,26" stroke="#4A3426" stroke-width="1.4" fill="none"/><circle cx="20" cy="20" r="1" fill="#7A5A44"/></pattern>
    <filter id="${P}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
  </defs>`;
}

// ── земля и стандартный план ──────────────────────────
function ground(P, y, cTop, cBot, r, o = {}) {
  let s = `<defs><linearGradient id="${P}gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cTop}"/><stop offset="1" stop-color="${cBot}"/></linearGradient></defs>
    <path d="M-20,${y} Q240,${y - 6} 480,${y + 2} T980,${y - 4} L980,${SH} L-20,${SH}Z" fill="url(#${P}gr)"/>`;
  s += groundTex(r, y + 6, SH, o.tex ?? 380, o.texC || shade(cBot, -0.22), o.texLen || 8);
  if (o.peb) s += pebbles(r, y + 20, SH, o.peb, o.pebC || shade(cBot, -0.15));
  if (o.tulips) s += tulips(r, y + 30, SH - 10, o.tulips);
  return s;
}
function frontGrass(r, c = '#6F8A3A', n = 14) {
  let s = '';
  for (let i = 0; i < n; i++) { const x = r() * SW, y = 515 + r() * 30; s += grassClump(x, y, 0.8 + r() * 0.8, shade(c, (r() - 0.5) * 0.3), r); }
  return s;
}

// ── места ─────────────────────────────────────────────
const SCENES = {};

SCENES.kazygurt = (P, r) => {
  let bg = skyLayer(P, 'day', r), mid = '', fg = '';
  mid += cloud(120, 90, 0.9) + cloud(520, 60, 1.2) + cloud(840, 140, 0.8);
  bg += range(r, { y: 300, h: 60, c: '#A9B8C8', n: 9, shadow: 0.12 });
  bg += `<path d="M-20,300 L980,296 L980,420 L-20,420Z" fill="#C9C48A"/>`;
  bg += `<path d="M-20,330 C200,320 300,350 480,336 C640,322 760,350 980,334" stroke="#7FB8C8" stroke-width="5" fill="none" opacity=".8"/>`;
  for (let i = 0; i < 40; i++) bg += `<ellipse cx="${f(r() * SW)}" cy="${f(305 + r() * 80)}" rx="${f(20 + r() * 60)}" ry="${f(3 + r() * 6)}" fill="${['#B8B47A', '#D8CC90', '#A9B07A'][i % 3]}" opacity=".7"/>`;
  bg += `<rect x="-20" y="290" width="1000" height="60" fill="#E8F3F4" opacity=".35"/>`;
  bg += `<path d="M-20,420 C100,380 240,372 360,392 C470,410 520,360 640,352 C760,344 860,380 980,370 L980,540 L-20,540Z" fill="#8E8270"/>`;
  bg += `<path d="M-20,450 C140,430 300,440 480,452 C660,464 820,430 980,440 L980,540 L-20,540Z" fill="#A89C84"/>`;
  for (let i = 0; i < 26; i++) { const x = r() * SW, y = 400 + r() * 120, w = 20 + r() * 40; bg += `<path d="M${f(x)},${f(y)} l${f(w * 0.3)},${f(-w * 0.35)} l${f(w * 0.5)},${f(-w * 0.1)} l${f(w * 0.3)},${f(w * 0.45)}Z" fill="${shade('#8E8270', (r() - 0.5) * 0.3)}"/><path d="M${f(x + w * 0.3)},${f(y - w * 0.35)} l${f(w * 0.2)},${f(w * 0.3)}" stroke="#6E6252" stroke-width="1"/>`; }
  // «Кеме қалған» — камень-ковчег
  bg += `<g transform="translate(600,360)"><path d="M-110,0 C-100,-30 -60,-44 0,-46 C60,-44 100,-34 118,-8 C90,10 -80,12 -110,0Z" fill="#7E7262" stroke="#4E4436" stroke-width="2"/>
    <path d="M-90,-14 C-40,-30 40,-32 100,-14" stroke="#5E5446" stroke-width="2" fill="none"/><path d="M-60,-36 L-50,-6 M-10,-44 L-6,-4 M40,-42 L36,-4 M84,-26 L76,0" stroke="#5E5446" stroke-width="1.6"/>
    <path d="M-100,-6 C-60,-18 40,-20 112,-8" stroke="#9C9080" stroke-width="2" fill="none" opacity=".7"/></g>`;
  // дерево желаний с ленточками
  bg += `<g transform="translate(850,392)"><path d="M-4,0 C-6,-30 -2,-60 -10,-90 M-6,-50 C10,-66 20,-70 30,-86 M-8,-70 C-24,-80 -30,-96 -36,-104" stroke="#5A3A1C" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  mid += sway(850, 300, 2, ['#D8343A', '#1C9AA0', '#F2C14E', '#FFFFFF', '#3F5FA8', '#E86A3A'].map((c, i) => `<path d="M${838 + i * 8},${330 - i * 9} q${3 + i},14 -2,26" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join(''));
  mid += birds(150, 4, 46, 0, 0.9) + birds(220, 3, 60, 18, 0.7);
  fg += frontGrass(r, '#7E8A50', 10);
  return { bg, mid, fg, anchors: { ark: [600, 318], view: [300, 330], tree: [850, 312] }, ground: 505, weather: ['wind'], wind: 0.6 };
};

SCENES.mausoleum = (P, r, o) => {
  const past = o.variant === 'past';
  let bg = skyLayer(P, past ? 'past' : 'hot', r), mid = '', fg = '';
  mid += cloud(150, 100, 0.7, past ? '#FFF2DA' : '#fff', past ? '#E8C898' : '#C9D8E6') + cloud(860, 150, 0.6, past ? '#FFF2DA' : '#fff', past ? '#E8C898' : '#C9D8E6');
  bg += range(r, { y: 360, h: 70, c: past ? '#C49A72' : '#A99A9A', n: 8, shadow: 0.14 });
  bg += hills(372, 18, past ? '#C9A274' : '#C8B48A', 3);
  bg += poplar(330, 405, 150, '#5C8A3C') + poplar(356, 410, 120, '#4E7A34') + poplar(805, 408, 160, '#5C8A3C') + poplar(836, 405, 130, '#4E7A34');
  // большой купол
  bg += `<path d="M612,232 L748,232 L748,180 L612,180Z" fill="url(#${P}brick)" stroke="#9C7E52" stroke-width="2"/>
    <path d="M612,192 L748,192 L748,206 L612,206Z" fill="url(#${P}girih2)"/>`;
  if (!past) {
    bg += `<path d="M606,184 C606,104 650,72 680,70 C710,72 754,104 754,184Z" fill="#1C9AA0" stroke="#13777C" stroke-width="2"/>
      ${Array.from({ length: 11 }, (_, i) => { const x = 612 + i * 13.6; return `<path d="M${f(x)},184 C${f(x + (680 - x) * 0.25)},130 ${f(680 + (x - 680) * 0.2)},84 680,72" stroke="#13777C" stroke-width="1.6" fill="none"/>`; }).join('')}
      <path d="M622,120 C650,96 710,96 738,120" stroke="#7FD6DA" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M676,72 L684,72 L682,52 L678,52Z" fill="#E7A93B"/><circle cx="680" cy="48" r="4" fill="#E7A93B"/>`;
  } else {
    bg += `<path d="M614,184 C616,130 646,96 680,92" stroke="#8C6A42" stroke-width="4" fill="none"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${614 + i * 22},184 C${620 + i * 18},140 ${650 + i * 8},110 680,92" stroke="#8C6A42" stroke-width="3" fill="none"/>`).join('')}
      <path d="M612,184 C614,160 626,142 642,132 L720,132 C734,142 746,160 748,184Z" fill="url(#${P}brick)" stroke="#9C7E52" stroke-width="2"/>`;
  }
  // малый купол слева
  bg += `<path d="M370,252 C370,214 392,198 404,198 C416,198 438,214 438,252Z" fill="${past ? '#C9A274' : '#2E9AA8'}" stroke="${past ? '#9C7E52' : '#1C7F9A'}" stroke-width="2"/>`;
  // стены и окна
  bg += `<path d="M360,250 L440,250 L440,410 L360,410Z M600,232 L790,232 L790,410 L600,410Z" fill="url(#${P}brick)" stroke="#9C7E52" stroke-width="2"/>`;
  if (!past) bg += `<path d="M360,262 L440,262 L440,274 L360,274Z M600,244 L790,244 L790,258 L600,258Z" fill="url(#${P}girih)"/>`;
  [380, 410].forEach((x) => { bg += `<path d="M${x},400 L${x},330 Q${x + 10},314 ${x + 20},330 L${x + 20},400Z" fill="#5B4029"/>`; });
  [620, 660, 700, 740].forEach((x) => { bg += `<path d="M${x},400 L${x},320 Q${x + 13},300 ${x + 26},320 L${x + 26},400Z" fill="#5B4029"/><path d="M${x + 3},398 L${x + 3},322 Q${x + 13},308 ${x + 23},322 L${x + 23},398Z" fill="${past ? '#6B4A2E' : 'url(#' + P + 'girih2)'}" opacity="${past ? 1 : 0.35}"/>`; });
  // главный портал с отверстиями от лесов
  bg += `<path d="M428,410 L428,118 L612,118 L612,410Z" fill="url(#${P}brick)" stroke="#9C7E52" stroke-width="2.4"/>
    <path d="M422,410 L422,124 Q426,114 434,114 L434,410Z M606,410 L606,124 Q610,114 618,114 L618,410Z" fill="${shade('#D8BC8E', -0.08)}" stroke="#9C7E52" stroke-width="1.6"/>`;
  if (!past) bg += `<path d="M440,126 L600,126 L600,142 L440,142Z" fill="url(#${P}girih)"/><path d="M440,142 L452,142 L452,410 L440,410Z M588,142 L600,142 L600,410 L588,410Z" fill="url(#${P}girih2)"/>`;
  for (let row = 0; row < 7; row++) for (let col = 0; col < 8; col++) bg += `<rect x="${458 + col * 17}" y="${150 + row * 14}" width="5" height="5" fill="#4A3426"/>`;
  bg += `<path d="M462,410 L462,262 Q520,170 578,262 L578,410Z" fill="#6E5236" stroke="#9C7E52" stroke-width="2"/>
    <path d="M472,410 L472,268 Q520,190 568,268 L568,410Z" fill="#3E2C1E"/>`;
  if (!past) bg += `<path d="M462,262 Q520,170 578,262" stroke="url(#${P}girih)" stroke-width="7" fill="none"/>`;
  // Тайказан внутри
  bg += `<g transform="translate(520,398)"><ellipse cx="0" cy="0" rx="40" ry="8" fill="#1E140C" opacity=".6"/><path d="M-36,-30 C-38,-6 -24,4 0,4 C24,4 38,-6 36,-30Z" fill="#7C6A4E" stroke="#3A2A1A" stroke-width="2"/>
    <ellipse cx="0" cy="-30" rx="36" ry="6" fill="#9C8A6A" stroke="#3A2A1A" stroke-width="1.6"/><path d="M-30,-18 Q0,-10 30,-18" stroke="#C9B48A" stroke-width="1.4" fill="none"/><path d="M-36,-26 q-8,0 -8,6 M36,-26 q8,0 8,6" stroke="#5A4A34" stroke-width="3" fill="none"/></g>`;
  bg += `<path d="M510,330 h20 v26 h-20Z" fill="#2A1E14"/>`;
  // площадь и надгробия
  bg += ground(P, 408, past ? '#C9A469' : '#D8C9A2', past ? '#A9844C' : '#B9A57A', r, { tex: 140, texC: past ? '#8C6A3A' : '#9C8A62' });
  if (!past) for (let i = 0; i < 9; i++) bg += `<path d="M${f(-60 + i * 130)},540 L${f(300 + i * 45)},410" stroke="#A8946A" stroke-width="1.4" opacity=".5"/>`;
  [380, 398, 414].forEach((x, i) => { bg += `<g transform="translate(${x},${428 + i * 4})"><path d="M-6,0 L-6,-26 Q0,-34 6,-26 L6,0Z" fill="#B8B0A0" stroke="#7E766A" stroke-width="1.2"/><path d="M-3,-22 h6 M-3,-17 h6 M-3,-12 h6" stroke="#7E766A" stroke-width=".8"/></g>`; });
  if (past) {
    // строительство: леса, рабочие, плавильня, кирпичи
    for (let i = 0; i < 6; i++) bg += `<path d="M${420 + i * 40},410 V96" stroke="#8C6A42" stroke-width="4"/>`;
    for (let j = 0; j < 7; j++) bg += `<path d="M416,${400 - j * 44} H624" stroke="#8C6A42" stroke-width="3"/>`;
    for (let i = 0; i < 4; i++) bg += `<path d="M${420 + i * 60},${400 - (i % 2) * 44} L${460 + i * 60},${356 - (i % 2) * 44}" stroke="#8C6A42" stroke-width="2.4"/>`;
    mid += walker(470, 312, 0.5, '#8C5A2B', 30, 6, 0) + walker(560, 224, 0.5, '#6B4A2E', -24, 7, 2) + walker(520, 136, 0.5, '#9C6A3A', 20, 5, 1);
    bg += `<g transform="translate(830,440)"><path d="M-40,0 L-34,-50 L34,-50 L40,0Z" fill="#8C6A42" stroke="#5A3A1C" stroke-width="2"/><path d="M-14,0 L-14,-24 Q0,-36 14,-24 L14,0Z" fill="#2A1A10"/><path d="M-10,-2 C-8,-14 0,-20 4,-26 C6,-18 12,-12 10,-2Z" fill="#F4A23B" class="bd-flame"/></g>`;
    mid += smoke(830, 384, 6, '#A9A29A');
    for (let i = 0; i < 18; i++) bg += `<rect x="${f(250 + (i % 6) * 13)}" y="${f(452 - Math.floor(i / 6) * 7)}" width="12" height="6" fill="#C98C5A" stroke="#8C5A2B" stroke-width=".7"/>`;
  } else {
    mid += walker(470, 418, 0.42, '#F2EEE4', 140, 30, 0) + walker(600, 422, 0.4, '#3F5FA8', -120, 34, 6, '#1A1A1A') + walker(880, 424, 0.42, '#A8322A', -160, 40, 3);
    mid += birds(170, 6, 34, 0, 0.6) + birds(110, 4, 50, 14, 0.5);
  }
  fg += frontGrass(r, past ? '#9C8A4A' : '#8A9A4A', 8);
  return { bg, mid, fg, anchors: { portal: [520, 150], dome: [680, 120], kazan: [520, 372], tombs: [398, 410], pilgrims: [868, 392], foundry: [828, 420], scaffold: [470, 230] }, ground: 505, weather: past ? ['dust'] : ['dust'], wind: 0.25 };
};

SCENES.ruins = (P, r) => {
  let bg = skyLayer(P, 'haze', r), mid = '', fg = '';
  mid += cloud(260, 90, 0.7, '#FFFBF2', '#E2D8C6') + cloud(760, 120, 0.8, '#FFFBF2', '#E2D8C6');
  bg += `<path d="M-20,334 L980,330 L980,360 L-20,360Z" fill="#C8BC92"/>`;
  bg += `<path d="M-20,346 C80,340 160,352 260,344" stroke="#7FB0BE" stroke-width="5" fill="none"/>`;
  for (let i = 0; i < 9; i++) bg += broadTree(20 + i * 26, 344, 0.3, '#7E9A4E');
  // мавзолей Арыстан-баба вдали
  bg += `<g transform="translate(840,334)"><path d="M-34,0 L-34,-34 L34,-34 L34,0Z" fill="#E6D8BC"/><path d="M-16,-34 C-16,-56 -2,-62 4,-62 C10,-62 22,-56 22,-34Z" fill="#2E9AA8"/><path d="M-30,-34 L-30,-52 L-22,-52 L-22,-34Z M24,-34 L24,-52 L32,-52 L32,-34Z" fill="#E6D8BC"/><path d="M-8,0 L-8,-18 Q0,-26 8,-18 L8,0Z" fill="#8C6A42"/></g>`;
  // городище — оплывший холм со стенами
  bg += `<path d="M180,410 C220,350 300,330 400,324 C520,318 640,322 730,334 C800,344 860,378 900,410Z" fill="#C9AE7E"/>`;
  bg += `<path d="M230,380 C300,350 420,342 520,342 C620,342 720,350 820,382" stroke="#B39468" stroke-width="3" fill="none"/>`;
  [[300, 340], [380, 330], [470, 326], [560, 326], [650, 330], [730, 342]].forEach(([x, y], i) => { bg += `<path d="M${x - 14},${y + 10} L${x - 12},${y - 14 - (i % 2) * 8} L${x + 12},${y - 16 - (i % 2) * 6} L${x + 14},${y + 10}Z" fill="url(#${P}mud)" opacity=".85"/>`; });
  bg += `<path d="M520,330 L520,300 L540,296 L560,300 L560,330" fill="url(#${P}mud)" stroke="#9C7E52" stroke-width="1.4"/>`;
  bg += ground(P, 400, '#D9C08C', '#BFA06C', r, { tex: 200, texC: '#9C8456', peb: 60 });
  // раскоп со слоями
  bg += `<g transform="translate(500,452)"><path d="M-130,-34 L130,-34 L110,30 L-110,30Z" fill="#8C6A42"/>
    <path d="M-130,-34 L130,-34 L124,-18 L-124,-18Z" fill="#B8955E"/><path d="M-124,-18 L124,-18 L120,-6 L-120,-6Z" fill="#2B231C"/><path d="M-120,-6 L120,-6 L116,8 L-116,8Z" fill="#A47E4E"/><path d="M-116,8 L116,8 L110,30 L-110,30Z" fill="#7E5E3A"/>
    ${[-110, -70, -30, 10, 50, 90].map((x) => `<path d="M${x},-36 V30" stroke="#F4EFE4" stroke-width=".8" opacity=".7"/><rect x="${x - 1.5}" y="-42" width="3" height="10" fill="#C0504A"/>`).join('')}
    <path d="M-130,-26 H130" stroke="#F4EFE4" stroke-width=".8" opacity=".7"/>
    <path d="M140,-40 L150,-4 M136,-44 l12,-4" stroke="#6B4A2E" stroke-width="3"/><path d="M146,-6 l8,8 l-10,4Z" fill="#9AA3AD"/>
    <ellipse cx="-150" cy="-30" rx="14" ry="5" fill="#9AA3AD"/><path d="M-164,-30 L-160,-12 L-140,-12 L-136,-30" fill="#7C858F"/></g>`;
  // палатка с находками
  bg += `<g transform="translate(860,420)"><path d="M-70,0 L-50,-70 L50,-70 L70,0Z" fill="#E8E0CC" stroke="#9C8A6A" stroke-width="2"/><path d="M-50,-70 L50,-70 L60,-58 L-60,-58Z" fill="#C0504A"/>
    <path d="M-40,-6 L40,-6 L40,-26 L-40,-26Z" fill="#8C6A42"/><path d="M-36,-26 h20 v-6 h-20Z" fill="#F2E3BE"/><circle cx="6" cy="-30" r="5" fill="#C9973A"/><path d="M18,-30 l8,-6 l6,6Z" fill="#B85C34"/></g>`;
  // памятный камень аль-Фараби
  bg += `<g transform="translate(410,392)"><path d="M-16,0 L-14,-46 Q0,-56 14,-46 L16,0Z" fill="#A9A094" stroke="#6E665A" stroke-width="1.6"/><path d="M-8,-38 h16 M-8,-32 h16 M-8,-26 h12" stroke="#6E665A" stroke-width="1"/><circle cy="-44" r="4" fill="none" stroke="#6E665A" stroke-width="1"/></g>`;
  mid += birds(150, 3, 52, 4, 0.6);
  fg += frontGrass(r, '#9C9A5A', 10);
  for (let i = 0; i < 4; i++) fg += saxaul(80 + i * 270 + r() * 40, 530, 0.9);
  return { bg, mid, fg, anchors: { river: [170, 340], walls: [560, 310], layer: [500, 430], farabi: [410, 360], arystan: [840, 300], scroll: [850, 392] }, ground: 505, weather: ['sand'], wind: 0.7 };
};

SCENES.aisha = (P, r, o) => {
  let bg = skyLayer(P, 'day', r), mid = '', fg = '';
  mid += cloud(120, 80, 0.8) + cloud(640, 60, 0.7);
  bg += range(r, { y: 330, h: 150, c: '#9AAEC4', n: 7, snow: true, shadow: 0.2 });
  bg += range(r, { y: 350, h: 70, c: '#8A9C88', n: 9, shadow: 0.18 });
  bg += ground(P, 372, '#B9C47A', '#A99E62', r, { tex: 260, texC: '#7E8A44', tulips: 26 });
  bg += `<path d="M-20,392 C120,384 240,396 360,388 C460,382 560,392 700,386 C820,382 900,390 980,386" stroke="#6CB2CC" stroke-width="7" fill="none"/><path d="M-20,392 C120,384 240,396 360,388 C460,382 560,392 700,386 C820,382 900,390 980,386" stroke="#BDE6F2" stroke-width="2" fill="none" stroke-dasharray="10 14"/>`;
  bg += herd('camel', 412, 352, 0.26, 4, 70, 40, 0);
  bg += `<path d="M120,540 C160,470 200,420 300,380" stroke="#C9B080" stroke-width="40" fill="none" opacity=".6"/>`;
  bg += poplar(430, 392, 120) + poplar(455, 396, 100, '#4E7A34') + poplar(760, 396, 130) + poplar(790, 392, 110, '#4E7A34');
  // мавзолей Бабаджи-хатун
  bg += `<g transform="translate(380,392)"><path d="M-24,0 L-24,-40 L24,-40 L24,0Z" fill="#D9A06A" stroke="#9E5A2C" stroke-width="1.4"/><path d="M-28,-40 L0,-74 L28,-40Z" fill="#C47E48" stroke="#9E5A2C" stroke-width="1.4"/>${[-20, -12, -4, 4, 12, 20].map((x) => `<path d="M${x},-40 L0,-74" stroke="#9E5A2C" stroke-width="1"/>`).join('')}<path d="M-8,0 L-8,-22 Q0,-30 8,-22 L8,0Z" fill="#6B3A1C"/></g>`;
  // Айша-биби: резная терракота
  bg += `<g transform="translate(600,404)">
    <path d="M-68,0 L-68,-150 L68,-150 L68,0Z" fill="url(#${P}terra)" stroke="#8E4A22" stroke-width="2"/>
    ${Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, col) => (row + col) % 3 === 0 ? `<rect x="${-63 + col * 18}" y="${-145 + row * 18}" width="18" height="18" fill="url(#${P}terra2)"/>` : '').join('')).join('')}
    <path d="M-80,0 L-80,-156 Q-80,-162 -74,-162 L-64,-162 L-64,0Z M80,0 L80,-156 Q80,-162 74,-162 L64,-162 L64,0Z" fill="#C47E48" stroke="#8E4A22" stroke-width="1.6"/>
    ${[-76, -70, 70, 76].map((x) => `<path d="M${x},-4 V-158" stroke="#8E4A22" stroke-width="1"/>`).join('')}
    <path d="M-30,0 L-30,-86 Q0,-124 30,-86 L30,0Z" fill="#7A3E1E" stroke="#8E4A22" stroke-width="2"/>
    <path d="M-22,0 L-22,-82 Q0,-112 22,-82 L22,0Z" fill="#4A2412"/>
    <path d="M-30,-86 Q0,-124 30,-86" stroke="url(#${P}terra2)" stroke-width="6" fill="none"/>
    <path d="M-50,-150 C-50,-180 -20,-196 0,-196 C20,-196 50,-180 50,-150Z" fill="#C47E48" stroke="#8E4A22" stroke-width="1.8"/>
    <path d="M-40,-160 Q0,-190 40,-160" stroke="#9E5A2C" stroke-width="1.4" fill="none"/></g>`;
  // стойка с саукеле у мастерицы
  bg += `<g transform="translate(860,418)"><path d="M-14,0 L-6,-60 L6,-60 L14,0" stroke="#6B4A2E" stroke-width="3" fill="none"/>
    <path d="M-14,-60 L14,-60 L5,-128 L-5,-128Z" fill="#B8382C" stroke="#5A1E16" stroke-width="1.4"/><path d="M-12,-72 h24 M-10,-88 h20 M-8,-104 h16" stroke="#E7A93B" stroke-width="2.4"/>
    ${[-10, -4, 2, 8].map((x) => `<path d="M${x},-60 v10" stroke="#C3CAD2"/><circle cx="${x}" cy="-48" r="2.2" fill="#C0504A"/>`).join('')}
    <path d="M0,-128 C-6,-138 -4,-148 0,-152 C4,-148 6,-138 0,-128Z" fill="#FBFAF6" stroke="#9C958A" stroke-width=".8"/></g>`;
  mid += birds(140, 5, 40, 2, 0.6);
  fg += frontGrass(r, '#6F8A3A', 12);
  return { bg, mid, fg, anchors: { caravan: [452, 334], river: [500, 389], mausoleum: [600, 230], terracotta: [556, 320], saukele: [860, 320] }, ground: 505, weather: ['leaves'], wind: 0.4 };
};

const GLYPHS = {
  sun: (s) => `<circle r="${7 * s}"/>${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${f(Math.cos(a) * 9 * s)},${f(Math.sin(a) * 9 * s)} L${f(Math.cos(a) * 14 * s)},${f(Math.sin(a) * 14 * s)}"/>`; }).join('')}<path d="M0,${7 * s} V${26 * s} M0,${14 * s} L${-9 * s},${20 * s} M0,${14 * s} L${9 * s},${20 * s} M0,${26 * s} L${-6 * s},${36 * s} M0,${26 * s} L${6 * s},${36 * s}"/>`,
  bull: (s) => `<path d="M${-14 * s},0 Q0,${-6 * s} ${14 * s},0 L${16 * s},${-8 * s} M${14 * s},0 L${18 * s},${-4 * s} M${-12 * s},0 L${-13 * s},${10 * s} M${-6 * s},0 L${-6 * s},${10 * s} M${6 * s},0 L${6 * s},${10 * s} M${12 * s},0 L${13 * s},${10 * s} M${-14 * s},0 L${-18 * s},${6 * s}"/>`,
  horse: (s) => `<path d="M${-12 * s},0 Q0,${-4 * s} ${10 * s},0 L${16 * s},${-10 * s} M${-11 * s},0 L${-13 * s},${10 * s} M${-5 * s},0 L${-5 * s},${10 * s} M${5 * s},0 L${5 * s},${10 * s} M${10 * s},0 L${11 * s},${10 * s} M${-12 * s},0 L${-17 * s},${4 * s}"/>`,
  camel: (s) => `<path d="M${-12 * s},0 Q${-6 * s},${-10 * s} 0,${-2 * s} Q${6 * s},${-10 * s} ${12 * s},0 L${16 * s},${-8 * s} M${-10 * s},0 L${-10 * s},${12 * s} M${10 * s},0 L${10 * s},${12 * s}"/>`,
  archer: (s) => `<path d="M0,${-10 * s} V${8 * s} M0,${8 * s} L${-5 * s},${18 * s} M0,${8 * s} L${5 * s},${18 * s} M0,${-4 * s} L${10 * s},${-6 * s}"/><path d="M${10 * s},${-16 * s} Q${16 * s},${-6 * s} ${10 * s},${4 * s}"/><circle cy="${-13 * s}" r="${3 * s}"/>`,
  dancer: (s) => `<path d="M0,${-8 * s} V${8 * s} M0,${-4 * s} L${-8 * s},${-12 * s} M0,${-4 * s} L${8 * s},${-12 * s} M0,${8 * s} L${-6 * s},${18 * s} M0,${8 * s} L${6 * s},${18 * s}"/><circle cy="${-11 * s}" r="${3 * s}"/>`,
  deer: (s) => `<path d="M${-10 * s},0 Q0,${-4 * s} ${10 * s},0 L${14 * s},${-8 * s} L${10 * s},${-18 * s} M${14 * s},${-8 * s} L${18 * s},${-16 * s} M${-9 * s},0 L${-10 * s},${10 * s} M${9 * s},0 L${9 * s},${10 * s}"/>`,
  tamga: (s) => `<path d="M0,${-12 * s} V${12 * s} M${-8 * s},${-4 * s} Q0,${-14 * s} ${8 * s},${-4 * s} M${-8 * s},${12 * s} H${8 * s}"/>`,
};
function petroPanel(x, y, w, h, P, r, list) {
  let s = `<path d="M${x},${y + h} C${x - 16},${y + h * 0.4} ${x + w * 0.1},${y} ${x + w * 0.4},${y - 8} C${x + w * 0.8},${y - 16} ${x + w + 10},${y + h * 0.3} ${x + w + 14},${y + h}Z" fill="url(#${P}rock)" stroke="#3A2618" stroke-width="2"/>
    <path d="M${x + w * 0.1},${y + h * 0.3} C${x + w * 0.4},${y + h * 0.1} ${x + w * 0.7},${y + h * 0.15} ${x + w * 0.95},${y + h * 0.35}" stroke="#7A5A44" stroke-width="2" fill="none" opacity=".6"/>`;
  s += `<g stroke="#E8CFA0" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".88">`;
  list.forEach(([g, gx, gy, gs]) => { s += `<g transform="translate(${gx},${gy})">${GLYPHS[g](gs)}</g>`; });
  return s + '</g>';
}

SCENES.petroglyph = (P, r, o) => {
  const past = o.variant === 'past';
  let bg = skyLayer(P, past ? 'past' : 'day', r), mid = '', fg = '';
  mid += cloud(140, 90, 0.7) + cloud(700, 70, 0.9);
  bg += range(r, { y: 320, h: 90, c: past ? '#B48A62' : '#9A8C8A', n: 7, shadow: 0.2 });
  bg += hills(350, 40, past ? '#B39468' : '#A89A70', 5);
  bg += ground(P, 386, past ? '#C4A26A' : '#B9AE78', past ? '#A9844C' : '#9C8E5E', r, { tex: 300, texC: '#7E7044', peb: 70, pebC: '#7A6A58' });
  bg += petroPanel(320, 220, 200, 190, P, r, [['sun', 400, 262, 1.1], ['sun', 452, 270, 0.9], ['bull', 380, 330, 1.2], ['archer', 470, 330, 1], ['dancer', 360, 380, 0.9], ['camel', 440, 384, 1]]);
  bg += petroPanel(540, 250, 190, 160, P, r, [['sun', 610, 290, 1.2], ['horse', 660, 340, 1.2], ['deer', 590, 360, 1.1], ['bull', 690, 380, 0.9], ['tamga', 560, 300, 1]]);
  bg += petroPanel(250, 330, 90, 90, P, r, [['tamga', 290, 372, 1.2], ['dancer', 314, 390, 0.7]]);
  bg += petroPanel(760, 320, 120, 100, P, r, [['bull', 810, 370, 1.1], ['horse', 840, 396, 0.8]]);
  if (past) {
    bg += `<g transform="translate(850,470)"><path d="M-16,4 L16,-4 M-16,-4 L16,4" stroke="#5A3A1C" stroke-width="5"/><path class="bd-flame" d="M0,-30 C10,-18 12,-6 0,2 C-12,-6 -10,-18 0,-30Z" fill="#F4A23B"/></g>`;
    mid += smoke(850, 436, 5, '#C8BCA8');
    mid += walker(560, 420, 0.55, '#8C6A42', 0, 4, 0, '#6B4A2E');
  } else {
    mid += herd('arkhar', 830, 300, 0.32, 3, -60, 60, 0);
  }
  mid += birds(130, 3, 50, 6, 0.6);
  fg += frontGrass(r, '#8A8A4A', 12);
  return { bg, mid, fg, anchors: { panel: [460, 290], sun: [612, 290], tamga: [560, 302], animals: [822, 378], carve: [560, 400] }, ground: 505, weather: past ? ['dust'] : ['dust', 'tumble'], wind: 0.7 };
};

SCENES.kurgan = (P, r, o) => {
  const past = o.variant === 'past';
  let bg = skyLayer(P, past ? 'saka' : 'day', r), mid = '', fg = '';
  mid += cloud(160, 70, 0.9) + cloud(560, 110, 0.6) + cloud(850, 60, 0.8);
  bg += range(r, { y: 300, h: 190, c: '#8EA0B8', n: 6, snow: true, shadow: 0.22 });
  for (let i = 0; i < 70; i++) { const x = r() * SW, y = 250 + r() * 50; bg += `<path d="M${f(x)},${f(y)} l4,-12 l4,12Z" fill="#2F5E46" opacity=".8"/>`; }
  bg += `<path d="M680,198 C700,190 740,190 760,198 C744,204 700,206 680,198Z" fill="#6CB8D4"/>`;
  bg += hills(332, 50, past ? '#A9A56A' : '#8FAA5E', 7);
  bg += ground(P, 372, past ? '#B6A46A' : '#A7B86A', past ? '#9A8A4E' : '#8A9A50', r, { tex: 320, texC: '#6A7A3A', tulips: past ? 0 : 20 });
  [[300, 360, 130, 46], [520, 352, 100, 34], [760, 362, 150, 50]].forEach(([x, y, w, h]) => { bg += `<path d="M${x - w / 2},${y} Q${x},${y - h * 1.6} ${x + w / 2},${y}Z" fill="${past ? '#9C9A5E' : '#7E9A4E'}"/><path d="M${x - w / 2},${y} Q${x - w * 0.1},${y - h * 1.5} ${x + w * 0.1},${y - h * 0.9}" stroke="${past ? '#B8B47A' : '#9CB86A'}" stroke-width="3" fill="none"/>${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${f(x - w / 2 + 8 + i * (w - 16) / 6)}" cy="${y - 2}" rx="5" ry="3" fill="#9C9488"/>`).join('')}`; });
  if (!past) {
    for (let i = 0; i < 6; i++) bg += broadTree(40 + i * 40, 392 - (i % 2) * 6, 0.45, '#5E8A3E', '#F2F0F0');
    // копия Золотого человека на постаменте
    bg += `<g transform="translate(560,350)"><path d="M-18,0 L18,0 L14,-24 L-14,-24Z" fill="#9C9488" stroke="#5E5850" stroke-width="1.4"/>
      <path d="M-6,-24 L-8,-60 L8,-60 L6,-24Z M-9,-60 L-10,-84 L10,-84 L9,-60Z" fill="#D9A43A" stroke="#8C6A1E" stroke-width="1"/>
      <circle cy="-90" r="6" fill="#D9A43A" stroke="#8C6A1E" stroke-width="1"/><path d="M-5,-94 L0,-128 L5,-94Z" fill="#E7B84A" stroke="#8C6A1E" stroke-width="1"/>
      <path d="M-10,-80 L-18,-62 M10,-80 L16,-100" stroke="#D9A43A" stroke-width="3"/><path d="M14,-104 l4,-8 l3,8" fill="#E7B84A"/></g>`;
    bg += `<g transform="translate(450,394)"><rect x="-22" y="-34" width="44" height="30" rx="2" fill="#F2EBDD" stroke="#6B4A2E" stroke-width="1.4"/><path d="M-14,-14 Q-6,-26 2,-16 L6,-22 L10,-16" stroke="#C9973A" stroke-width="2" fill="none"/><path d="M-16,-4 L-16,10 M16,-4 L16,10" stroke="#6B4A2E" stroke-width="2"/></g>`;
    bg += `<g transform="translate(860,404)"><path d="M-14,0 L-12,-56 Q0,-66 12,-56 L14,0Z" fill="#9C9488" stroke="#5E5850" stroke-width="1.4"/><path d="M-8,-30 Q0,-36 8,-30 L10,-38 M-8,-30 L-8,-22 M6,-30 L6,-22 M-2,-38 Q4,-48 12,-46 Q6,-40 -2,-38" stroke="#E8DCC0" stroke-width="1.6" fill="none"/></g>`;
  } else {
    bg += yurt(780, 410, 0.8, P, { felt: '#D8C8A8', band: '#7A3E1E' });
    bg += `<g transform="translate(560,470)"><path d="M-16,4 L16,-4 M-16,-4 L16,4" stroke="#5A3A1C" stroke-width="5"/><path class="bd-flame" d="M0,-34 C12,-20 14,-6 0,2 C-14,-6 -12,-20 0,-34Z" fill="#F4A23B"/></g>`;
    mid += smoke(560, 432, 6, '#B8AC98');
  }
  mid += birds(120, 4, 44, 5, 0.6);
  fg += frontGrass(r, '#6F8A3A', 12);
  return { bg, mid, fg, anchors: { kurgan: [792, 338], saka: [450, 366], statue: [560, 240], lake: [720, 196], tulpar: [862, 362], fire: [560, 440] }, ground: 505, weather: past ? ['embers'] : ['petals'], wind: 0.35 };
};

SCENES.canyon = (P, r) => {
  let bg = skyLayer(P, 'hot', r), mid = '', fg = '';
  mid += cloud(300, 70, 0.6) + cloud(780, 100, 0.7);
  bg += range(r, { y: 230, h: 90, c: '#A9A6B6', n: 6, snow: true, shadow: 0.15 });
  // дальняя стена каньона с «замками»
  bg += `<path d="M-20,360 L-20,220 L60,212 L70,170 L90,168 L100,208 L170,204 L186,150 L204,146 L214,200 L300,196 L320,160 L332,120 L346,158 L360,196 L440,192 L456,176 L470,190 L560,188 L580,140 L592,100 L604,138 L620,186 L700,182 L716,150 L736,148 L746,184 L830,180 L850,130 L870,128 L880,178 L980,174 L980,360Z" fill="url(#${P}strata)" stroke="#8E3C1E" stroke-width="2"/>`;
  for (let i = 0; i < 46; i++) { const x = r() * SW, y = 200 + r() * 130; bg += `<path d="M${f(x)},${f(y)} q${f((r() - 0.5) * 6)},${f(14 + r() * 30)} ${f((r() - 0.5) * 4)},${f(30 + r() * 40)}" stroke="#8E3C1E" stroke-width="${f(1 + r() * 2)}" fill="none" opacity=".55"/>`; }
  bg += `<path d="M-20,250 L980,240 L980,262 L-20,272Z" fill="#000" opacity=".06"/>`;
  // дно: река и ясеневая роща
  bg += `<path d="M-20,360 L980,360 L980,412 L-20,412Z" fill="#6E8A4E"/>`;
  bg += `<path d="M-20,392 C200,380 360,404 520,390 C700,376 820,398 980,386" stroke="#5DB2D0" stroke-width="10" fill="none"/>`;
  for (let i = 0; i < 18; i++) bg += broadTree(30 + i * 54 + r() * 20, 380 + r() * 14, 0.42 + r() * 0.15, ['#4F8A3A', '#5E9A44', '#3E7A32'][i % 3]);
  mid += shimmer(0, 960, 384, 398, 18, r, '#E9F6F8');
  // ближний край — смотровая площадка
  bg += `<path d="M-20,430 C120,418 240,414 420,420 C620,428 800,416 980,424 L980,540 L-20,540Z" fill="#C9A06A"/>`;
  bg += `<path d="M-20,430 C120,418 240,414 420,420 C620,428 800,416 980,424 L980,440 L-20,446Z" fill="#9C5A34"/>`;
  bg += groundTex(r, 446, 540, 220, '#9C7A48', 8) + pebbles(r, 450, 540, 50, '#A47E5A');
  bg += `<g stroke="#7A5232" stroke-width="5" stroke-linecap="round">${[60, 200, 520, 660, 900].map((x) => `<path d="M${x},${456} V${428}"/>`).join('')}<path d="M40,432 H930 M40,444 H930" stroke-width="3"/></g>`;
  mid += herd('ibex', 800, 190, 0.3, 2, -40, 30, 0);
  mid += `<g transform="translate(0,0)">${birds(110, 1, 70, 0, 1.4)}</g>`;
  fg += frontGrass(r, '#9C9A5A', 12);
  return { bg, mid, fg, anchors: { depth: [470, 330], castles: [592, 140], grove: [380, 382], animals: [810, 196] }, ground: 505, weather: ['dust'], wind: 0.9 };
};

SCENES.dune = (P, r) => {
  let bg = skyLayer(P, 'hot', r), mid = '', fg = '';
  mid += cloud(200, 80, 0.6) + cloud(700, 60, 0.7);
  bg += `<path d="M-20,330 L60,250 L140,280 L230,220 L320,300 L360,330Z" fill="#6E6A72"/><path d="M60,250 L140,280 L120,330 L40,330Z" fill="#000" opacity=".15"/>`;
  bg += `<path d="M620,330 L700,230 L780,262 L860,210 L980,260 L980,330Z" fill="#6E6A72"/><path d="M780,262 L860,210 L880,330 L780,330Z" fill="#000" opacity=".15"/>`;
  bg += `<path d="M120,360 C260,230 380,150 470,140 C560,132 680,220 820,360Z" fill="#E7BE73"/>`;
  bg += `<path d="M470,140 C560,132 680,220 820,360 L470,360 C520,300 500,200 470,140Z" fill="#D2A458"/>`;
  for (let i = 0; i < 16; i++) bg += `<path d="M${200 + i * 14},${360 - i * 4} Q${330 + i * 6},${300 - i * 9} ${440 + i * 2},${360 - i * 12}" stroke="#D9A85A" stroke-width="1.4" fill="none" opacity=".6"/>`;
  bg += ground(P, 372, '#E2C690', '#CDA868', r, { tex: 160, texC: '#A88A4E', peb: 30 });
  [[384, 372], [418, 368], [452, 374], [486, 369], [520, 375]].forEach(([x, y], i) => { bg += `<path d="M${x - 16},${y} Q${x},${y - 18 - (i % 2) * 6} ${x + 16},${y}Z" fill="#B8A06A"/>`; });
  mid += herd('kulan', 620, 410, 0.36, 4, -200, 46, 0) + herd('jeyran', 860, 430, 0.3, 2, -260, 30, 8);
  mid += `<g class="bd-crest">${Array.from({ length: 8 }, (_, i) => `<circle cx="${470 + i * 8}" cy="${142 + i * 4}" r="${2 + i * 0.4}" fill="#F2D49A" style="--d:${i * 0.2}s"/>`).join('')}</g>`;
  for (let i = 0; i < 6; i++) fg += saxaul(60 + i * 170 + r() * 40, 528, 0.9 + r() * 0.4);
  fg += frontGrass(r, '#A89A5A', 8);
  return { bg, mid, fg, anchors: { dune: [480, 170], kalkan: [792, 300], kulans: [560, 396], besshatyr: [452, 352], saddle: [892, 238] }, ground: 505, weather: ['sand'], wind: 0.8 };
};

SCENES.lake = (P, r, o) => {
  let bg = skyLayer(P, 'storm', r), mid = '', fg = '';
  mid += cloud(160, 80, 1.1, '#D8DEE4', '#8E9AA6') + cloud(560, 60, 1.3, '#D8DEE4', '#8E9AA6') + cloud(860, 110, 1, '#D8DEE4', '#8E9AA6');
  bg += `<path d="M-20,300 L980,296 L980,420 L-20,420Z" fill="#4E9EBE"/>`;
  bg += `<path d="M520,296 L980,296 L980,420 L560,420 C540,380 530,330 520,296Z" fill="#3E8A7E"/>`;
  bg += `<path d="M470,300 C500,306 520,312 560,318 C540,322 510,322 470,312Z" fill="#C9B88A"/>`;
  bg += `<path d="M-20,304 C40,300 100,306 160,302 L160,316 C100,320 40,316 -20,318Z" fill="#7E9A5A"/>`;
  bg += `<path d="M160,308 C200,312 230,322 260,330" stroke="#5DB2D0" stroke-width="6" fill="none"/>`;
  bg += `<path d="M268,300 C320,294 400,295 470,300 L470,306 C400,304 320,305 268,308Z" fill="#7E9A5A"/><path d="M300,288 C330,292 352,296 368,303" stroke="#5DB2D0" stroke-width="4" fill="none"/><path d="M332,296 C346,298 356,300 368,304" stroke="#4E9EBE" stroke-width="2" fill="none"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${286 + i * 26},301 l2,-9 l2,9Z" fill="#5E7A3E"/>`).join('')}`;
  mid += shimmer(0, 960, 312, 416, 40, r, '#E1F2F6');
  bg += `<g transform="translate(620,380)"><path d="M-40,0 Q0,14 40,0 L32,-8 Q0,0 -32,-8Z" fill="#7A5A3A" stroke="#4A3220" stroke-width="1.4"/><rect x="-1.5" y="-46" width="3" height="40" fill="#5A3A1C"/></g>`;
  bg += ground(P, 420, '#A9A06A', '#8E8456', r, { tex: 260, texC: '#6A6438', peb: 40 });
  bg += `<path d="M680,430 L860,430 L860,440 L680,440Z" fill="#8C6A42"/>${[690, 730, 770, 810, 850].map((x) => `<rect x="${x}" y="430" width="4" height="26" fill="#5A3A1C"/>`).join('')}`;
  bg += `<g transform="translate(910,428)"><path d="M-40,0 L-40,-40 L40,-40 L40,0Z" fill="#B89A6C" stroke="#6B4A2E" stroke-width="1.6"/><path d="M-48,-40 L0,-66 L48,-40Z" fill="#7A5A3A"/><rect x="-10" y="-26" width="16" height="26" fill="#5A3A1C"/></g>`;
  bg += `<g transform="translate(400,440)"><path d="M-30,0 V-50 M30,0 V-50" stroke="#6B4A2E" stroke-width="3"/><path d="M-30,-48 Q0,-30 30,-48 L30,-10 Q0,4 -30,-10Z" fill="#C9B88E" opacity=".7"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${-30 + i * 12},-46 V-8" stroke="#8C7A54" stroke-width=".8"/>`).join('')}</g>`;
  fg += reeds(40, 540, 14, 110, r) + reeds(920, 540, 14, 120, r) + reeds(860, 520, 8, 90, r);
  mid += birds(150, 3, 36, 0, 0.8) + birds(200, 2, 44, 10, 0.7);
  return { bg, mid, fg, anchors: { halves: [520, 312], river: [366, 300], legend: [596, 294], tigers: [880, 420], boat: [620, 360] }, ground: 505, weather: ['rain'], wind: 0.5 };
};

SCENES.peak = (P, r, o) => {
  const past = o.variant === 'past';
  let bg = skyLayer(P, 'cold', r), mid = '', fg = '';
  mid += cloud(140, 120, 0.9) + cloud(820, 80, 0.7);
  bg += range(r, { y: 330, h: 120, c: '#8E9EB2', n: 8, snow: true, shadow: 0.2 });
  bg += `<path d="M380,330 L470,96 L520,140 L570,72 L690,330Z" fill="#9AAAC0"/>
    <path d="M440,180 L470,96 L520,140 L570,72 L610,160 L586,150 L570,170 L548,152 L520,172 L500,154 L470,176Z" fill="#FBFCFD"/>
    <path d="M570,72 L690,330 L620,330 L586,150Z" fill="#000" opacity=".14"/>
    <path d="M520,140 L540,300 L560,330 L500,330 L510,200Z" fill="#DDE6EE" opacity=".8"/>`;
  bg += hills(350, 60, '#5E7E52', 9);
  for (let i = 0; i < 90; i++) { const x = r() * SW, y = 300 + r() * 70, s = 0.3 + r() * 0.3; bg += `<path d="M${f(x)},${f(y)} l${f(5 * s * 2)},${f(-22 * s * 2)} l${f(5 * s * 2)},${f(22 * s * 2)}Z" fill="${['#2F5E36', '#3E6E3A', '#4E7A3E'][i % 3]}"/>`; }
  bg += ground(P, 390, '#8FAE62', '#7A9A52', r, { tex: 300, texC: '#5E7A3A', tulips: past ? 0 : 18 });
  bg += `<path d="M-20,420 C120,404 220,430 320,416 C420,402 480,420 560,412" stroke="#7FC4DC" stroke-width="7" fill="none"/>`;
  [[340, 400], [400, 396], [450, 402]].forEach(([x, y]) => { bg += `<path d="M${x - 22},${y} Q${x},${y - 20} ${x + 22},${y}Z" fill="#9C9488"/>${Array.from({ length: 5 }, (_, i) => `<ellipse cx="${x - 16 + i * 8}" cy="${y - 4 - (i % 2) * 5}" rx="5" ry="3.4" fill="#B8B0A4"/>`).join('')}`; });
  for (let i = 0; i < 5; i++) bg += pine(700 + i * 60, 400 - (i % 2) * 8, 0.7, '#2F5E36');
  if (!past) {
    bg += yurt(900, 410, 0.55, P);
    mid += smoke(900, 368, 5) + herd('maral', 560, 430, 0.36, 3, -140, 50, 0);
  } else {
    mid += walker(560, 420, 0.5, '#6B4A2E', 0, 4, 0, '#2B1A12') + walker(620, 424, 0.5, '#8C5A2B', 0, 5, 1, '#2B1A12');
    bg += `<g transform="translate(400,380)"><path d="M-46,0 L46,0 L36,-30 L-36,-30Z" fill="#6B4A2E" opacity=".9"/><path d="M-36,-30 L36,-30" stroke="#8C6A42" stroke-width="4"/></g>`;
  }
  mid += `<g class="bd-mist"><ellipse cx="460" cy="318" rx="150" ry="15" fill="#fff" opacity=".35"/><ellipse cx="520" cy="336" rx="110" ry="9" fill="#fff" opacity=".3"/></g>`;
  fg += frontGrass(r, '#5E7E3A', 12);
  return { bg, mid, fg, anchors: { belukha: [560, 110], forest: [800, 300], kurgans: [400, 382], valley: [470, 316], jailau: [900, 370], people: [592, 382] }, ground: 505, weather: ['snow'], wind: 0.5 };
};

SCENES.pinelake = (P, r, o) => {
  const night = o.tone === 'night';
  let bg = skyLayer(P, night ? 'night' : 'day', r), mid = '', fg = '';
  if (!night) mid += cloud(240, 80, 0.8) + cloud(820, 60, 0.6);
  bg += `<path d="M560,300 C600,200 660,150 700,150 C740,150 790,220 820,300Z" fill="${night ? '#1E2A3A' : '#3E6E46'}"/>`;
  for (let i = 0; i < 60; i++) { const x = 580 + r() * 230, y = 190 + r() * 110; if (y > 300 - Math.abs(x - 700) * 0.2 - 120 + 100) bg += `<path d="M${f(x)},${f(y)} l4,-14 l4,14Z" fill="${night ? '#14202C' : '#2F5E36'}"/>`; }
  bg += `<path d="M-20,300 L980,300 L980,420 L-20,420Z" fill="${night ? '#1E3354' : '#3E8EB0'}"/>`;
  bg += `<path d="M-20,300 L980,300 L980,316 L-20,316Z" fill="${night ? '#14202C' : '#2F5E36'}" opacity=".5"/>`;
  mid += shimmer(0, 960, 320, 410, 30, r, night ? '#F4F0D8' : '#E1F2F6');
  // Окжетпес — скала из округлых глыб
  bg += `<g transform="translate(340,318)">${[[0, 0, 46, 22], [-10, -34, 40, 20], [8, -64, 34, 18], [-4, -94, 30, 17], [6, -122, 24, 15], [0, -146, 18, 12]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${night ? '#4A4A5A' : '#9C8C82'}" stroke="${night ? '#2A2A3A' : '#6E605A'}" stroke-width="1.6"/><path d="M${x - rx * 0.6},${y - ry * 0.3} Q${x},${y - ry} ${x + rx * 0.6},${y - ry * 0.4}" stroke="${night ? '#6A6A7A' : '#BCAEA4'}" stroke-width="2" fill="none"/>`).join('')}</g>`;
  bg += `<g transform="translate(520,350)"><path d="M-40,8 C-36,-14 -16,-30 6,-28 C26,-26 40,-10 40,8Z" fill="${night ? '#4A4A5A' : '#8C7C72'}" stroke="${night ? '#2A2A3A' : '#5E504A'}" stroke-width="1.6"/><path d="M-20,-10 C-10,-22 8,-22 18,-12" stroke="${night ? '#6A6A7A' : '#AEA096'}" stroke-width="2" fill="none"/><ellipse cx="0" cy="10" rx="50" ry="5" fill="${night ? '#14202C' : '#2E7A96'}" opacity=".6"/></g>`;
  bg += ground(P, 420, night ? '#2E3A2E' : '#7E9A5A', night ? '#1E2A22' : '#6A8A4A', r, { tex: 260, texC: night ? '#14201A' : '#4E6A34' });
  for (let i = 0; i < 9; i++) bg += pine(40 + i * 34 + r() * 10, 420 + r() * 8, 0.8 + r() * 0.4, night ? '#14281E' : '#2F5E36');
  for (let i = 0; i < 6; i++) bg += pine(700 + i * 46 + r() * 10, 420 + r() * 10, 0.9 + r() * 0.4, night ? '#14281E' : '#2F5E36');
  bg += birch(660, 428, 0.9) + birch(930, 436, 1);
  bg += `<g transform="translate(820,440)"><ellipse cx="0" cy="0" rx="40" ry="8" fill="${night ? '#26342A' : '#8FAE62'}"/><path d="M-6,0 L-4,-30 L4,-30 L6,0Z" fill="#9C9488"/><path d="M0,-30 L0,-56 M0,-56 L18,-50 L0,-44" stroke="#6B4A2E" stroke-width="2" fill="#3F5FA8"/></g>`;
  bg += `<g transform="translate(436,301) scale(.9)"><path d="M-26,0 C-26,-10 -18,-18 -8,-18 L-4,-30 L4,-30 L6,-18 C18,-18 26,-10 26,0Z" fill="${night ? '#5A5A6A' : '#EDE8DC'}" opacity=".9"/></g>`;
  if (night) {
    bg += `<g transform="translate(600,486)"><path d="M-20,6 L20,-6 M-20,-6 L20,6" stroke="#5A3A1C" stroke-width="6"/><path class="bd-flame" d="M0,-44 C14,-26 16,-8 0,4 C-16,-8 -14,-26 0,-44Z" fill="#F4A23B"/><path class="bd-flame" d="M0,-26 C7,-18 8,-6 0,2 C-8,-6 -7,-18 0,-26Z" fill="#FFE7A3"/></g>`;
    bg += `<ellipse cx="600" cy="480" rx="160" ry="40" fill="#F4A23B" opacity=".12"/>`;
    bg += yurt(130, 430, 0.7, P, { glow: true }) + yurt(890, 420, 0.6, P, { glow: true });
    mid += smoke(600, 430, 6, '#8E8A86');
  }
  fg += frontGrass(r, night ? '#2E3A26' : '#5E7E3A', 12);
  return { bg, mid, fg, anchors: { okzhetpes: [340, 210], zhumbaktas: [520, 330], glade: [820, 390], kokshetau: [700, 170], pines: [760, 352], bura: [436, 280], fire: [600, 450], hill: [150, 380] }, ground: 505, weather: night ? ['fireflies', 'embers'] : ['leaves'], wind: night ? 0.2 : 0.4 };
};

SCENES.ulytau = (P, r, o) => {
  let bg = skyLayer(P, 'dusk', r), mid = '', fg = '';
  mid += cloud(180, 120, 0.8, '#F7C59A', '#B0688A') + cloud(560, 90, 1, '#F7C59A', '#B0688A');
  bg += `<path d="M-20,330 C60,280 140,250 220,262 C300,274 340,220 420,214 C500,208 560,260 640,240 C720,220 780,190 860,214 C920,232 960,270 980,300 L980,340 L-20,340Z" fill="#6E4E7A"/>`;
  bg += `<path d="M420,214 C500,208 560,260 640,240 L640,340 L420,340Z" fill="#000" opacity=".12"/>`;
  bg += hills(352, 30, '#8A6A6E', 11);
  bg += ground(P, 380, '#B89A6A', '#9A7E54', r, { tex: 200, texC: '#7A5E3A' });
  bg += `<path d="M-20,420 C120,400 240,430 380,412 C480,400 560,420 620,410" stroke="#6CA8C4" stroke-width="7" fill="none" opacity=".9"/>`;
  bg += `<g transform="translate(480,372)"><path d="M-40,0 L-40,-46 L40,-46 L40,0Z" fill="#C8A87A" stroke="#8C6A42" stroke-width="1.8"/><path d="M-30,-46 C-30,-78 -6,-90 0,-90 C6,-90 30,-78 30,-46Z" fill="#4E8AA0" stroke="#2E6A80" stroke-width="1.8"/>
    <path d="M-12,0 L-12,-26 Q0,-38 12,-26 L12,0Z" fill="#5A3A1C"/><path d="M-40,-36 H40" stroke="#8C6A42" stroke-width="1.4"/>${[-30, -20, 20, 30].map((x) => `<rect x="${x - 3}" y="-30" width="6" height="10" fill="#6B4A2E"/>`).join('')}</g>`;
  bg += `<g transform="translate(860,420)"><ellipse cx="0" cy="0" rx="46" ry="12" fill="#6E5A44"/><ellipse cx="0" cy="-2" rx="34" ry="7" fill="#3E3024"/>${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${f(Math.cos(i) * 44)}" cy="${f(Math.sin(i) * 10)}" rx="6" ry="4" fill="#4E8A6A" opacity=".8"/>`).join('')}</g>`;
  bg += `<g transform="translate(640,420)"><path d="M-10,0 L-12,-44 Q0,-58 12,-44 L10,0Z" fill="#9C9488" stroke="#5E5850" stroke-width="1.4"/><circle cx="0" cy="-42" r="7" fill="none" stroke="#5E5850"/><path d="M-4,-40 h2 M3,-40 h2 M-6,-28 Q0,-24 6,-28 M-8,-16 h16" stroke="#5E5850" stroke-width="1.2" fill="none"/></g>`;
  mid += herd('kulan', 770, 356, 0.26, 3, -90, 70, 0) + herd('kulan', 880, 362, 0.24, 1, -70, 70, 0);
  for (let i = 0; i < 36; i++) fg += kovyl(r() * SW, 440 + r() * 100, 0.7 + r() * 0.8, r);
  mid += `<g class="bd-soar">${eagleSprite('fly').replace('<svg ', '<svg width="60" height="40" x="0" y="0" ')}</g>`;
  return { bg, mid, fg, anchors: { mountains: [560, 262], mausoleum: [480, 300], river: [300, 410], copper: [860, 400], balbal: [640, 380], kulans: [800, 332] }, ground: 505, weather: ['wind', 'dust'], wind: 0.8 };
};

SCENES.ships = (P, r) => {
  let bg = skyLayer(P, 'haze', r), mid = '', fg = '';
  mid += cloud(300, 90, 0.6, '#FFFBF2', '#E2D8C6');
  bg += `<path d="M-20,320 L980,316 L980,340 L-20,344Z" fill="#E8DCC0"/>`;
  bg += `<path d="M700,318 L980,316 L980,326 L720,326Z" fill="#6CB2CC"/>`;
  bg += `<path d="M-20,250 L260,250 C300,270 320,300 330,344 L-20,344Z" fill="#C9AE7E"/><path d="M260,250 C300,270 320,300 330,344 L300,344 C290,300 270,270 240,256Z" fill="#000" opacity=".1"/>`;
  bg += `<g transform="translate(70,250)"><rect x="-6" y="-60" width="12" height="60" fill="#9AA3AD"/><ellipse cx="0" cy="-66" rx="18" ry="10" fill="#7C858F"/></g><g transform="translate(140,250)"><rect x="-26" y="-30" width="52" height="30" fill="#E8E0CC" stroke="#9C8A6A"/><rect x="-18" y="-22" width="8" height="8" fill="#6A8CA8"/><rect x="6" y="-22" width="8" height="8" fill="#6A8CA8"/></g>`;
  bg += `<g transform="translate(200,244)"><rect x="-30" y="-24" width="60" height="22" rx="3" fill="#7A3E1E" stroke="#4A2410" stroke-width="1.4"/><rect x="-24" y="-20" width="10" height="8" fill="#E8E0CC"/><rect x="-6" y="-20" width="10" height="8" fill="#E8E0CC"/><rect x="12" y="-20" width="10" height="8" fill="#E8E0CC"/><circle cx="-18" cy="0" r="5" fill="#2B2B2B"/><circle cx="18" cy="0" r="5" fill="#2B2B2B"/></g>`;
  bg += ground(P, 344, '#E2D2A8', '#CDB88A', r, { tex: 200, texC: '#A89466', peb: 20 });
  for (let i = 0; i < 14; i++) bg += `<ellipse cx="${f(r() * SW)}" cy="${f(360 + r() * 160)}" rx="${f(20 + r() * 60)}" ry="${f(4 + r() * 8)}" fill="#F7F4EC" opacity=".55"/>`;
  const ship = (x, y, s, rot) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path d="M-90,0 L90,0 L74,34 L-76,34Z" fill="#8E4424" stroke="#4A2210" stroke-width="2"/>
    <path d="M-90,8 L90,8" stroke="#5E2A14" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${-70 + i * 17}" cy="20" r="2" fill="#5E2A14"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${-60 + i * 24},2 q2,14 -2,30" stroke="#B5652E" stroke-width="3" opacity=".7"/>`).join('')}
    <path d="M-30,-38 L30,-38 L30,0 L-30,0Z" fill="#A8582A" stroke="#4A2210" stroke-width="2"/><rect x="-22" y="-30" width="10" height="10" fill="#2B1A10"/><rect x="-4" y="-30" width="10" height="10" fill="#2B1A10"/><rect x="14" y="-30" width="10" height="10" fill="#2B1A10"/>
    <rect x="14" y="-80" width="7" height="42" fill="#7E3418"/><path d="M-60,0 L-40,-60 M-40,-60 L-30,0" stroke="#7E3418" stroke-width="3"/></g>`;
  bg += ship(520, 386, 1, -6) + ship(800, 360, 0.6, 5);
  mid += herd('camel', 640, 470, 0.4, 2, -40, 40, 0);
  bg += `<g transform="translate(860,300)"><path d="M-60,8 L60,8 L54,0 L-54,0Z" fill="#9C9488"/><path d="M-60,8 L60,8" stroke="#7E766A" stroke-width="2"/></g>`;
  for (let i = 0; i < 5; i++) fg += saxaul(80 + i * 200 + r() * 50, 530, 0.8 + r() * 0.4);
  fg += frontGrass(r, '#A89A5A', 6);
  return { bg, mid, fg, anchors: { shore: [70, 212], ships: [520, 340], dam: [860, 296], wagon: [200, 226] }, ground: 505, weather: ['salt'], wind: 0.7 };
};

SCENES.chalk = (P, r) => {
  let bg = skyLayer(P, 'hot', r), mid = '', fg = '';
  mid += cloud(180, 80, 0.6) + cloud(760, 60, 0.7);
  bg += `<path d="M-20,330 L120,326 C160,330 200,340 260,336 L320,330 L980,330 L980,350 L-20,350Z" fill="#D8CCB0"/>`;
  bg += `<path d="M60,334 C120,340 200,344 280,338" stroke="#F4F0E4" stroke-width="5" fill="none" opacity=".8"/>`;
  bg += `<g transform="translate(880,330)"><path d="M-60,0 C-58,-30 -30,-60 0,-62 C30,-60 58,-30 60,0Z" fill="#C9B898"/><path d="M-50,-24 Q0,-34 50,-24" stroke="#A89878" stroke-width="2" fill="none"/></g>`;
  bg += `<path d="M380,350 L410,240 L440,250 L470,130 L496,236 L520,226 L548,100 L580,232 L620,250 L660,180 L700,252 L760,262 L790,350Z" fill="url(#${P}chalk)" stroke="#C9B898" stroke-width="2"/>`;
  bg += `<path d="M548,100 L580,232 L620,250 L590,350 L560,350 L566,240Z M470,130 L496,236 L480,350 L460,350 L474,250Z" fill="#000" opacity=".08"/>`;
  bg += `<path d="M420,290 Q560,280 760,296 M400,320 Q560,310 780,326" stroke="#E2B9A0" stroke-width="5" fill="none" opacity=".8"/>`;
  bg += ground(P, 372, '#EDE2CA', '#D8C8A6', r, { tex: 180, texC: '#B8A47E', peb: 40, pebC: '#C9B898' });
  bg += `<g transform="translate(560,426)"><ellipse rx="118" ry="22" fill="#CDBA94"/><ellipse rx="96" ry="16" fill="#B8A27A"/><ellipse cy="2" rx="62" ry="9" fill="#F4F0E4" opacity=".85"/><path d="M-118,0 C-90,-14 -40,-20 0,-20 C40,-20 90,-14 118,0" stroke="#A88E62" stroke-width="2" fill="none"/></g>`;
  bg += `<g transform="translate(380,404)"><path d="M-60,0 C-60,-30 -40,-50 0,-52 C40,-50 60,-30 60,0Z" fill="#E6D8B8" stroke="#B8A47E" stroke-width="1.6"/><path d="M-14,0 L-14,-26 Q0,-38 14,-26 L14,0Z" fill="#4A3A2A"/><path d="M-24,0 L-18,8 L18,8 L24,0" fill="#C9B898"/></g>`;
  for (let i = 0; i < 5; i++) { const x = 100 + r() * 760, y = 460 + r() * 70; bg += `<g transform="translate(${f(x)},${f(y)})"><path d="M0,0 m-8,0 a8,8 0 1,1 16,0 a6,6 0 1,1 -12,0 a4,4 0 1,1 8,0" fill="none" stroke="#A89878" stroke-width="1.6"/></g>`; }
  mid += herd('arkhar', 790, 240, 0.3, 2, -30, 40, 0);
  fg += frontGrass(r, '#B8A46A', 6);
  for (let i = 0; i < 4; i++) fg += saxaul(120 + i * 240 + r() * 40, 532, 0.8);
  return { bg, mid, fg, anchors: { karagiye: [560, 420], cliffs: [548, 140], beket: [380, 380], mouflon: [800, 230], sherkala: [880, 290] }, ground: 505, weather: ['dust'], wind: 0.5 };
};

// ── прошлое ───────────────────────────────────────────
SCENES.city = (P, r) => {
  let bg = skyLayer(P, 'past', r), mid = '', fg = '';
  mid += cloud(220, 90, 0.7, '#FFF2DA', '#E8C898');
  bg += `<path d="M-20,350 L980,346 L980,380 L-20,380Z" fill="#C9A469"/>`;
  bg += `<path d="M180,410 L180,250 L780,250 L780,410Z" fill="url(#${P}mud)" stroke="#8C6A42" stroke-width="2"/>`;
  [180, 330, 480, 630, 780].forEach((x) => { bg += `<path d="M${x - 22},410 L${x - 22},228 L${x + 22},228 L${x + 22},410Z" fill="url(#${P}mud)" stroke="#8C6A42" stroke-width="2"/>${Array.from({ length: 4 }, (_, i) => `<rect x="${x - 20 + i * 11}" y="220" width="7" height="9" fill="#C8A878" stroke="#8C6A42" stroke-width="1"/>`).join('')}`; });
  bg += `<path d="M440,410 L440,300 Q480,260 520,300 L520,410Z" fill="#4A3220"/><path d="M432,300 Q480,250 528,300" stroke="#8C6A42" stroke-width="6" fill="none"/>`;
  bg += `<path d="M560,250 C560,214 590,198 610,198 C630,198 660,214 660,250Z" fill="#2E9AA8"/><path d="M690,250 L690,150 L704,150 L704,250Z" fill="url(#${P}mud)"/><path d="M684,150 L710,150 L697,132Z" fill="#2E9AA8"/>`;
  bg += ground(P, 410, '#C9A469', '#A9844C', r, { tex: 200, texC: '#8C6A3A', peb: 30 });
  [[250, 450], [360, 460], [600, 456], [760, 452]].forEach(([x, y], i) => { bg += `<g transform="translate(${x},${y})"><path d="M-34,-40 L34,-40 L30,-30 L-30,-30Z" fill="${['#C0504A', '#1C9AA0', '#E7A93B', '#3F5FA8'][i]}"/><path d="M-30,-30 V0 M30,-30 V0" stroke="#6B4A2E" stroke-width="3"/><path d="M-26,-6 L26,-6 L26,0 L-26,0Z" fill="#8C6A42"/><circle cx="-12" cy="-10" r="5" fill="#E7A93B"/><circle cx="6" cy="-9" r="4" fill="#C0504A"/><rect x="14" y="-14" width="8" height="8" fill="#1C9AA0"/></g>`; });
  mid += herd('camel', 900, 430, 0.5, 4, -260, 36, 0);
  mid += walker(300, 470, 0.5, '#8C5A2B', 60, 14, 0, '#F2EBDD') + walker(520, 474, 0.5, '#3F5FA8', -70, 16, 4) + walker(700, 468, 0.48, '#A8322A', 50, 12, 2, '#F2EBDD');
  fg += frontGrass(r, '#9C8A4A', 6);
  return { bg, mid, fg, anchors: { caravan: [760, 410], walls: [330, 260], gate: [480, 320], bazaar: [600, 420] }, ground: 505, weather: ['dust'], wind: 0.4 };
};

SCENES.camp = (P, r, o) => {
  const tone = o.tone || 'past';
  const night = tone === 'night', dusk = tone === 'dusk';
  let bg = skyLayer(P, tone, r), mid = '', fg = '';
  if (!night) mid += cloud(200, 90, 0.8, dusk ? '#F7C59A' : '#FFF2DA', dusk ? '#B0688A' : '#E8C898') + cloud(760, 70, 0.7, dusk ? '#F7C59A' : '#FFF2DA', dusk ? '#B0688A' : '#E8C898');
  bg += range(r, { y: 340, h: 110, c: night ? '#1E2848' : dusk ? '#6E4E7A' : '#B48A62', n: 7, snow: !night && !dusk, shadow: 0.2 });
  bg += ground(P, 380, night ? '#2E3A3A' : dusk ? '#A08262' : '#C4A26A', night ? '#1E2A2A' : dusk ? '#846A4E' : '#A9844C', r, { tex: 240, texC: night ? '#14201E' : '#7A5E3A' });
  const big = o.ordo;
  bg += yurt(140, 410, 0.7, P, { glow: night }) + yurt(820, 404, 0.8, P, { glow: night }) + yurt(920, 420, 0.55, P, { glow: night });
  if (big) {
    bg += yurt(520, 400, 1.5, P, { felt: '#FBF8F0', band: '#E7A93B', door: '#7A1E2C' });
    [380, 660].forEach((x) => { bg += `<path d="M${x},410 V250" stroke="#5A3A1C" stroke-width="4"/>`; mid += sway(x, 250, 3, `<path d="M${x},250 l-2,-14 l4,0Z" fill="#E7A93B"/><path d="M${x},256 q-10,16 -4,40 M${x},256 q8,18 2,42 M${x},256 q-2,18 0,44" stroke="#2B2B2B" stroke-width="3" fill="none"/>`); });
  } else {
    bg += yurt(560, 396, 0.9, P, { glow: night });
  }
  if (o.fire !== false) {
    bg += `<ellipse cx="480" cy="480" rx="150" ry="36" fill="#F4A23B" opacity="${night ? 0.16 : 0.08}"/>`;
    bg += `<g transform="translate(480,486)"><path d="M-22,6 L22,-6 M-22,-6 L22,6" stroke="#5A3A1C" stroke-width="7"/><path class="bd-flame" d="M0,-48 C15,-28 17,-8 0,4 C-17,-8 -15,-28 0,-48Z" fill="#F4A23B"/><path class="bd-flame" d="M0,-28 C8,-18 9,-6 0,2 C-9,-6 -8,-18 0,-28Z" fill="#FFE7A3"/></g>`;
    mid += smoke(480, 428, 7, night ? '#6E6A76' : '#B8AC98');
  }
  if (o.tents) for (let i = 0; i < 5; i++) bg += `<path d="M${100 + i * 180},${380} l30,-40 l30,40Z" fill="#D8C8A8" stroke="#8C6A42" stroke-width="1.4"/>`;
  if (o.banner) mid += sway(700, 300, 3, `<path d="M700,400 V280" stroke="#5A3A1C" stroke-width="3"/><path class="bd-flag" d="M700,282 L760,290 L700,310Z" fill="#A8322A"/>`);
  fg += frontGrass(r, night ? '#26342A' : '#8A7A4A', 10);
  return { bg, mid, fg, anchors: { fire: [480, 450], yurt: [560, 340], left: [160, 360], right: [820, 350], ordo: [520, 300] }, ground: 505, weather: night ? ['fireflies', 'embers'] : dusk ? ['dust', 'embers'] : ['embers'], wind: 0.3 };
};

SCENES.forest = (P, r) => {
  let bg = skyLayer(P, 'past', r), mid = '', fg = '';
  bg += `<rect width="${SW}" height="${SH}" fill="#E8D8A8" opacity=".3"/>`;
  for (let i = 0; i < 14; i++) bg += broadTree(r() * SW, 330 + r() * 30, 0.9 + r() * 0.5, ['#5E8A44', '#6E9A4E', '#4E7A3A'][i % 3]);
  bg += `<path d="M-20,380 L980,380 L980,540 L-20,540Z" fill="#7E9A54"/>`;
  bg += `<path d="M-20,430 C200,410 360,450 540,430 C720,410 840,440 980,426 L980,460 C840,474 720,444 540,464 C360,484 200,446 -20,466Z" fill="#5DB2D0"/>`;
  mid += shimmer(0, 960, 430, 462, 16, r, '#E9F6F8');
  for (let i = 0; i < 8; i++) bg += broadTree(40 + i * 130 + r() * 30, 410 + r() * 10, 1.1 + r() * 0.3, ['#4F8A3A', '#5E9A44'][i % 2]);
  for (let i = 0; i < 18; i++) { const x = r() * SW, y = 500 + r() * 40; fg += sway(x, y, 3, `<path d="M${f(x)},${f(y)} q-10,-20 -24,-24 M${f(x)},${f(y)} q6,-24 20,-30 M${f(x)},${f(y)} q-2,-26 4,-38" stroke="#4E7A34" stroke-width="3" fill="none"/>`); }
  mid += `<g class="bd-mist"><ellipse cx="300" cy="400" rx="300" ry="20" fill="#fff" opacity=".25"/><ellipse cx="760" cy="392" rx="240" ry="16" fill="#fff" opacity=".2"/></g>`;
  mid += birds(160, 4, 30, 0, 0.7);
  return { bg, mid, fg, anchors: { seed: [300, 300], river: [560, 440], layers: [760, 470] }, ground: 505, weather: ['seeds', 'mist'], wind: 0.3 };
};

SCENES.island = (P, r) => {
  let bg = skyLayer(P, 'day', r), mid = '', fg = '';
  mid += cloud(200, 70, 0.7) + cloud(760, 100, 0.8);
  bg += `<path d="M-20,300 L980,300 L980,420 L-20,420Z" fill="#4FA6C4"/>`;
  mid += shimmer(0, 960, 306, 410, 30, r, '#E1F2F6');
  bg += `<path d="M-20,380 C200,350 400,340 600,348 C760,354 880,370 980,380 L980,540 L-20,540Z" fill="#D9BE84"/>`;
  bg += groundTex(r, 380, 540, 200, '#A88A4E', 7) + pebbles(r, 400, 540, 30, '#B8A070');
  bg += `<g transform="translate(560,430)"><rect x="0" y="-38" width="100" height="38" fill="#6E8A5C" stroke="#3E5A2C" stroke-width="2"/><path d="M100,-28 L136,-28 L144,-10 L144,0 L100,0Z" fill="#58714A" stroke="#3E5A2C" stroke-width="2"/><rect x="110" y="-24" width="20" height="10" fill="#9CC8DC"/><circle cx="22" cy="4" r="10" fill="#2B2B2B"/><circle cx="122" cy="4" r="10" fill="#2B2B2B"/><circle cx="22" cy="4" r="4" fill="#7C858F"/><circle cx="122" cy="4" r="4" fill="#7C858F"/></g>`;
  mid += herd('kulan', 420, 440, 0.42, 3, 40, 10, 0);
  for (let i = 0; i < 4; i++) fg += saxaul(80 + i * 260 + r() * 40, 528, 0.9);
  return { bg, mid, fg, anchors: { truck: [620, 400], kulans: [460, 410], sea: [300, 330] }, ground: 505, weather: ['wind'], wind: 0.6 };
};

SCENES.tugai = (P, r) => {
  let bg = skyLayer(P, 'past', r), mid = '', fg = '';
  bg += `<rect y="250" width="${SW}" height="130" fill="#9CB86A"/>`;
  for (let i = 0; i < 12; i++) bg += broadTree(r() * SW, 330 + r() * 30, 0.6 + r() * 0.3, '#6E9A4E');
  bg += `<path d="M-20,380 L980,380 L980,540 L-20,540Z" fill="#8FAE62"/>`;
  bg += `<path d="M-20,410 C200,396 400,420 600,406 C760,396 880,414 980,404 L980,430 C880,440 760,422 600,432 C400,446 200,424 -20,436Z" fill="#5DB2D0"/>`;
  mid += shimmer(0, 960, 408, 432, 14, r, '#E9F6F8');
  mid += `<g class="bd-walk" style="--dx:-240px;--dur:26s;--del:0s;--s0:-1"><g transform="translate(760,470) scale(.62)">${beast('tiger', 'walk').replace('<svg ', '<svg width="120" height="96" x="-60" y="-90" ')}</g></g>`;
  for (let i = 0; i < 16; i++) fg += reeds(r() * SW, 540, 6, 150, r);
  return { bg, mid, fg, anchors: { tracks: [420, 470], hunter: [780, 420], reeds: [200, 420] }, ground: 505, weather: ['gnats'], wind: 0.3 };
};

SCENES.port = (P, r) => {
  let bg = skyLayer(P, 'day', r), mid = '', fg = '';
  mid += cloud(180, 80, 0.8) + cloud(640, 60, 0.6);
  bg += `<path d="M-20,280 L980,280 L980,440 L-20,440Z" fill="#3E9ACB"/>`;
  mid += shimmer(0, 960, 286, 436, 46, r, '#E1F2F6');
  [[160, 330, '#F2EEE4'], [360, 360, '#B8382C'], [760, 320, '#3F5FA8']].forEach(([x, y, c]) => { mid += `<g class="bd-bob" style="--d:${f(r() * 2)}s"><g transform="translate(${x},${y})"><path d="M-46,0 Q0,16 46,0 L36,-10 Q0,-2 -36,-10Z" fill="#7A5A3A" stroke="#4A3220" stroke-width="1.4"/><rect x="-2" y="-64" width="3" height="56" fill="#5A3A1C"/><path d="M2,-62 L40,-14 L2,-14Z" fill="${c}"/></g></g>`; });
  bg += `<path d="M-20,440 L980,440 L980,540 L-20,540Z" fill="#8C6A42"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 50},440 V540" stroke="#6B4A2E" stroke-width="2"/>`).join('')}`;
  bg += `<g transform="translate(860,440)"><rect x="-6" y="-150" width="12" height="150" fill="#7C858F"/><path d="M0,-150 L-120,-130 M0,-150 L20,-140" stroke="#7C858F" stroke-width="5"/><path d="M-110,-130 V-80" stroke="#5E6670" stroke-width="2"/><rect x="-120" y="-80" width="20" height="14" fill="#C9A06A"/></g>`;
  bg += `<g transform="translate(560,470)">${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 22}" y="-18" width="20" height="16" fill="#8C6A42" stroke="#5A3A1C"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<ellipse cx="${10 + i * 26}" cy="-24" rx="10" ry="4" fill="#C9C6B8"/>`).join('')}</g>`;
  mid += birds(150, 5, 28, 0, 0.8) + birds(120, 3, 40, 12, 0.6);
  return { bg, mid, fg, anchors: { nets: [600, 440], horizon: [480, 300], boats: [360, 340] }, ground: 505, weather: ['spray'], wind: 0.6 };
};

SCENES.ocean = (P, r) => {
  let bg = `<defs><linearGradient id="${P}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CC2DE"/><stop offset=".6" stop-color="#1E6E9A"/><stop offset="1" stop-color="#0E3A5E"/></linearGradient></defs><rect width="${SW}" height="${SH}" fill="url(#${P}sea)"/>`;
  let mid = '', fg = '';
  for (let i = 0; i < 7; i++) bg += `<path d="M${100 + i * 140},0 L${170 + i * 140},540 L${130 + i * 140},540 L${80 + i * 140},0Z" fill="#BDEBF7" opacity=".07"/>`;
  bg += `<path d="M-20,450 C200,430 360,460 560,446 C760,432 880,456 980,446 L980,540 L-20,540Z" fill="#E8E2CF"/>`;
  bg += groundTex(r, 456, 540, 120, '#C9C0A8', 5);
  for (let i = 0; i < 8; i++) { const x = r() * SW, y = 470 + r() * 50; bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(6 + r() * 6)}" fill="#D8C9A8" stroke="#8C7A5A" stroke-width="1.4"/>`; }
  for (let i = 0; i < 10; i++) { const x = r() * SW, y = 470 + r() * 40; fg += sway(x, y, 6, `<path d="M${f(x)},${f(y)} q-12,-30 4,-60 q10,-20 -4,-44" stroke="#4E8A5A" stroke-width="5" fill="none" stroke-linecap="round"/>`); }
  const ammo = (x, y, s, dur, del, dx) => `<g class="bd-walk" style="--dx:${dx}px;--dur:${dur}s;--del:${del}s;--s0:${dx < 0 ? -1 : 1}"><g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 m-22,0 a22,22 0 1,1 44,0 a16,16 0 1,1 -32,0 a10,10 0 1,1 20,0 a5,5 0 1,1 -10,0" fill="#E6C88E" stroke="#9C7A4E" stroke-width="2.4"/><path d="M-22,0 q-12,6 -18,18 M-22,4 q-8,10 -10,20 M-22,-2 q-14,2 -22,10" stroke="#E6A0A0" stroke-width="2.4" fill="none"/></g></g>`;
  mid += ammo(300, 200, 1.4, 22, 0, 200) + ammo(700, 140, 1, 30, 4, -260) + ammo(560, 320, 0.8, 26, 8, 160);
  return { bg, mid, fg, anchors: { ammonite: [300, 200], floor: [600, 470], light: [480, 120] }, ground: 505, weather: ['bubbles'], wind: 0.2, under: true };
};

// ── сборка ────────────────────────────────────────────
export function backdrop(kind, opt = {}) {
  const P = 'b' + (++BID) + '_';
  const r = rng(opt.seed || kind.length * 97 + 13);
  const fn = SCENES[kind] || SCENES.camp;
  const res = fn(P, r, opt);
  res.bg = patterns(P) + res.bg;
  return { ...res, kind, P };
}
export const SCENE_KINDS = Object.keys(SCENES);
