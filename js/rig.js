// Персонажи-марионетки. Каждый персонаж — SVG со «скелетом»: ноги с коленями,
// корпус, руки с локтями и кистями, голова с глазами, веками, бровями и губами.
// Каждый кадр считаются дыхание, моргание, взгляд, эмоции, губы под текст,
// жесты, ходьба и ветер, который треплет полы одежды, косы, кисточки и перья.

export const LINE = '#2E1C12';
const NS = 'http://www.w3.org/2000/svg';
let UID = 0;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const f1 = (v) => Math.round(v * 10) / 10;

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, '0')).join('');
}

// Пружина: плавное движение к цели с лёгкой инерцией — так суставы двигаются живо
export class Spring {
  constructor(v = 0, k = 140, d = 18) { this.v = v; this.t = v; this.vel = 0; this.k = k; this.d = d; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.016)), h = dt / n;
    for (let i = 0; i < n; i++) { this.vel += (this.k * (this.t - this.v) - this.d * this.vel) * h; this.v += this.vel * h; }
    return this.v;
  }
  snap(v) { this.v = this.t = v; this.vel = 0; }
}

// Цепочка (кисточка, коса, перо, лента): сегменты на пружинах, их качает ветер
export function chainSVG(reg, name, n, len, seg, opt = {}) {
  reg.push({ name, n, len, amp: 18, k: 60, d: 7, base: 0, ...opt });
  let o = '', c = '';
  for (let i = 0; i < n; i++) { o += `<g data-d="${name}" data-i="${i}">${seg(i)}<g transform="translate(0,${len})">`; c += '</g></g>'; }
  return o + c;
}

const PROF = {
  adult: { leg: 118, torso: 92, sh: 27, up: 45, lo: 41, head: 1, voice: 1 },
  elder: { leg: 110, torso: 88, sh: 26, up: 43, lo: 40, head: 1, stoop: 6, voice: 0.8 },
  teen: { leg: 92, torso: 74, sh: 22, up: 36, lo: 33, head: 1.03, voice: 1.25 },
  child: { leg: 62, torso: 56, sh: 17, up: 27, lo: 25, head: 0.94, voice: 1.6 },
};

// ── узоры для одежды ──────────────────────────────────
function patterns(id, s) {
  const trim = s.outfit?.trim || '#E7A93B';
  const main = s.outfit?.color || '#3A5BA6';
  const hc = s.hat?.color || '#B8382C', ht = s.hat?.trim || '#F4E3C1';
  const fur = s.hat?.fur || s.outfit?.fur || '#7A5A3A';
  return `
  <pattern id="${id}orn" width="14" height="8" patternUnits="userSpaceOnUse">
    <rect width="14" height="8" fill="${trim}"/>
    <path d="M1.5,7 Q1.5,1.6 4.5,2 Q7,2.6 5.6,5 M12.5,7 Q12.5,1.6 9.5,2 Q7,2.6 8.4,5" stroke="${shade(trim, -0.5)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  </pattern>
  <pattern id="${id}orn2" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="${main}"/>
    <path d="M5,1 L9,5 L5,9 L1,5Z" fill="none" stroke="${trim}" stroke-width=".9" opacity=".7"/><circle cx="5" cy="5" r="1" fill="${trim}" opacity=".8"/>
  </pattern>
  <pattern id="${id}mail" width="5" height="4" patternUnits="userSpaceOnUse">
    <rect width="5" height="4" fill="#6E7781"/>
    <path d="M0,2 A2.5,2 0 0 0 5,2 M-2.5,4 A2.5,2 0 0 0 2.5,4 M2.5,4 A2.5,2 0 0 0 7.5,4" stroke="#C3CAD2" stroke-width=".8" fill="none"/>
  </pattern>
  <pattern id="${id}fur" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="${fur}"/>
    <path d="M1,6 L2,1 M3.5,6 L4.4,.5 M5.6,6 L6,2" stroke="${shade(fur, 0.3)}" stroke-width=".8"/>
    <path d="M2.4,6 L3,3" stroke="${shade(fur, -0.3)}" stroke-width=".7"/>
  </pattern>
  <pattern id="${id}flor" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="${hc}"/>
    <circle cx="4" cy="4" r="2.1" fill="${ht}"/><circle cx="12" cy="12" r="2.1" fill="${ht}"/>
    <circle cx="4" cy="4" r=".8" fill="${hc}"/><circle cx="12" cy="12" r=".8" fill="${hc}"/>
    <circle cx="12" cy="4" r=".9" fill="${shade(hc, 0.4)}"/><circle cx="4" cy="12" r=".9" fill="${shade(hc, 0.4)}"/>
  </pattern>
  <pattern id="${id}felt" width="7" height="7" patternUnits="userSpaceOnUse">
    <rect width="7" height="7" fill="${s.hat?.color || '#F2EBDD'}"/><circle cx="2" cy="3" r=".45" fill="#000" opacity=".08"/><circle cx="5.5" cy="6" r=".4" fill="#000" opacity=".07"/>
  </pattern>
  <linearGradient id="${id}steel" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#E4E9EE"/><stop offset=".45" stop-color="#A9B3BD"/><stop offset="1" stop-color="#5E6874"/>
  </linearGradient>
  <linearGradient id="${id}cloth" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${shade(main, 0.14)}"/><stop offset=".55" stop-color="${main}"/><stop offset="1" stop-color="${shade(main, -0.28)}"/>
  </linearGradient>`;
}

// ── шапки ─────────────────────────────────────────────
function hatSVG(s, id, reg) {
  const h = s.hat;
  if (!h) return { back: '', front: '' };
  const c = h.color || '#F2EBDD', t = h.trim || '#1A1A1A', L = `stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"`;
  switch (h.type) {
    case 'kalpak': return {
      back: '',
      front: `<path d="M-25,-62 C-25,-96 -6,-122 7,-124 C20,-122 33,-98 32,-64 C20,-67 -10,-67 -25,-62Z" fill="url(#${id}felt)" ${L}/>
        <path d="M14,-119 C25,-108 32,-90 32,-63 L23,-63 C24,-88 21,-105 14,-119Z" fill="#000" opacity=".08"/>
        <path d="M7,-110 C1,-102 -8,-99 -9,-91 C-10,-84 -4,-82 -1,-86 M7,-110 C13,-102 21,-99 22,-91 C23,-84 17,-82 14,-86 M7,-110 V-72" stroke="${t}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M-3,-78 q10,-6 20,0" stroke="${t}" stroke-width="1" fill="none"/>
        <path d="M-29,-60 C-27,-65 -23,-70 -17,-73 L4,-74 C4,-71 3,-68 1,-66 C-10,-65 -21,-63 -29,-60Z" fill="${t}" ${L}/>
        <path d="M-26,-63 C-20,-67 -10,-70 2,-70" stroke="#F4EFE4" stroke-width="1" fill="none" opacity=".75"/>
        <path d="M8,-66 C9,-69 11,-72 13,-74 L33,-76 C35,-71 35,-67 34,-63 C26,-64 17,-65 8,-66Z" fill="${t}" ${L}/>
        <g transform="translate(7,-124)">${chainSVG(reg, 'tassel', 2, 5, (i) => `<path d="M-1.6,0 L1.6,0 L${i ? 2.6 : 1.8},5.5 L${i ? -2.6 : -1.8},5.5Z" fill="${t}"/>`, { amp: 25, k: 50 })}</g>`,
    };
    case 'borik': return {
      back: '',
      front: `<path d="M-24,-74 C-24,-99 -4,-108 6,-108 C19,-108 32,-99 32,-74Z" fill="${c}" ${L}/>
        <path d="M16,-104 C26,-98 32,-88 32,-74 L24,-74 C25,-86 22,-96 16,-104Z" fill="#000" opacity=".15"/>
        <path d="M6,-108 V-80 M-14,-92 Q6,-86 26,-92" stroke="${t}" stroke-width="1.4" fill="none"/>
        <circle cx="6" cy="-108" r="2.6" fill="${t}"/>
        <path d="M-31,-60 C-32,-71 -27,-82 -19,-83 C-5,-87 18,-87 30,-83 C37,-81 39,-73 37,-64 C22,-62 -16,-60 -31,-60Z" fill="url(#${id}fur)" stroke="${shade(h.fur || '#7A5A3A', -0.4)}" stroke-width="1.2"/>
        <path d="M-28,-70 Q4,-77 34,-70" stroke="${shade(h.fur || '#7A5A3A', 0.35)}" stroke-width="1.2" fill="none" opacity=".7"/>
        ${h.uki ? `<g transform="translate(6,-108) rotate(-8)">${chainSVG(reg, 'uki', 3, 7, (i) => `<path d="M0,0 C-${4 + i},2 -${5 + i},6 0,${8 + i} C${5 + i},6 ${4 + i},2 0,0Z" fill="#FBFAF6" stroke="#B9B2A6" stroke-width=".6"/><path d="M0,1 V${7 + i}" stroke="#9C958A" stroke-width=".5"/>`, { amp: 30, k: 40, base: 180 })}</g>
          <g transform="translate(10,-106) rotate(10)">${chainSVG(reg, 'uki2', 2, 7, (i) => `<path d="M0,0 C-3,2 -4,5 0,${8} C4,5 3,2 0,0Z" fill="#F2EFE8" stroke="#B9B2A6" stroke-width=".6"/>`, { amp: 30, k: 40, base: 170 })}</g>` : ''}`,
    };
    case 'tymak': return {
      back: `<g transform="translate(-26,-58)">${chainSVG(reg, 'flapB', 2, 14, () => `<path d="M-7,0 L7,0 L6,15 Q0,19 -6,15Z" fill="url(#${id}fur)"/>`, { amp: 14, k: 70 })}</g>`,
      front: `<path d="M-26,-70 C-26,-98 -4,-110 6,-110 C20,-110 34,-98 34,-70Z" fill="${c}" ${L}/>
        <path d="M6,-110 L6,-74 M-18,-96 Q6,-88 28,-96" stroke="${t}" stroke-width="1.3" fill="none"/>
        <path d="M-32,-58 C-34,-74 -24,-86 -12,-85 C4,-89 22,-89 32,-85 C40,-81 41,-72 38,-63 C22,-61 -18,-60 -32,-58Z" fill="url(#${id}fur)" stroke="${shade(h.fur || '#6A4A2E', -0.4)}" stroke-width="1.2"/>
        <g transform="translate(33,-60)">${chainSVG(reg, 'flapF', 2, 12, () => `<path d="M-6,0 L6,0 L5,13 Q0,16 -5,13Z" fill="url(#${id}fur)"/>`, { amp: 14, k: 70 })}</g>`,
    };
    case 'takiya': return {
      back: '',
      front: `<path d="M-22,-70 C-22,-88 -6,-94 6,-94 C20,-94 30,-88 30,-70 C14,-75 -8,-75 -22,-70Z" fill="${c}" ${L}/>
        <path d="M-18,-76 Q6,-84 28,-76" stroke="${t}" stroke-width="2" fill="none" stroke-dasharray="2 2"/>
        <path d="M6,-94 L6,-76 M-8,-90 L-6,-75 M20,-90 L18,-75" stroke="${t}" stroke-width="1" opacity=".8"/>`,
    };
    case 'turban': return {
      back: `<g transform="translate(-26,-62)">${chainSVG(reg, 'turbanTail', 2, 10, () => `<path d="M-4,0 L4,0 L3,11 L-3,11Z" fill="${c}"/>`, { amp: 18, k: 60 })}</g>`,
      front: `<path d="M-29,-60 C-33,-84 -12,-102 6,-102 C27,-102 39,-86 35,-60 C20,-69 -14,-69 -29,-60Z" fill="${c}" ${L}/>
        <path d="M-27,-68 C-10,-80 20,-82 34,-68 M-24,-78 C-6,-92 22,-92 32,-78 M-16,-90 C0,-100 18,-98 26,-90" stroke="${shade(c, -0.18)}" stroke-width="1.6" fill="none"/>
        ${h.gem ? `<circle cx="10" cy="-78" r="3.4" fill="${h.gem}" stroke="${LINE}" stroke-width=".8"/>` : ''}`,
    };
    case 'helmet': return {
      back: `<path d="M-29,-62 C-35,-40 -32,-18 -22,-2 L-4,-2 C-9,-20 -13,-40 -11,-62Z" fill="url(#${id}mail)" stroke="${LINE}" stroke-width="1"/>`,
      front: `<path d="M-27,-61 C-27,-90 -6,-117 4,-128 C14,-117 35,-90 34,-61Z" fill="url(#${id}steel)" ${L}/>
        <path d="M4,-126 C-1,-102 -6,-82 -7,-63 M4,-126 C10,-102 16,-82 18,-63" stroke="#56606B" stroke-width="1.2" fill="none"/>
        <path d="M-29,-59 C-28,-65 -26,-71 -23,-71 L32,-71 C35,-69 36,-65 36,-59 C20,-55 -14,-55 -29,-59Z" fill="url(#${id}orn)" ${L}/>
        ${[-20, -8, 4, 16, 28].map((x) => `<circle cx="${x}" cy="-65" r="1.3" fill="#FFF4C8" stroke="${LINE}" stroke-width=".5"/>`).join('')}
        <path d="M2,-128 L6,-128 L5,-138 L3,-138Z" fill="#E7A93B" stroke="${LINE}" stroke-width=".8"/>
        <g transform="translate(4,-137) rotate(200)">${chainSVG(reg, 'plume', 3, 9, (i) => `<path d="M0,0 C-${5 - i},3 -${5 - i},8 0,${10} C${4 - i},7 ${4 - i},3 0,0Z" fill="${['#B8382C', '#C9452E', '#E7A93B'][i]}"/>`, { amp: 28, k: 35, base: 0 })}</g>`,
    };
    case 'saka': return {
      back: `<path d="M-30,-56 C-36,-34 -32,-12 -22,0 L-4,0 C-10,-18 -14,-38 -12,-58Z" fill="${shade(c, -0.15)}" stroke="${LINE}" stroke-width="1"/>`,
      front: `<path d="M-30,-52 C-31,-90 -17,-128 -5,-162 C3,-148 18,-118 30,-96 C36,-82 36,-66 34,-56 C14,-60 -10,-60 -30,-52Z" fill="${c}" ${L}/>
        ${[[-6, -140], [-2, -120], [6, -104], [-12, -100], [14, -86], [-16, -76], [2, -84], [22, -70], [-6, -66]].map(([x, y], i) => i % 3 === 0 ? `<path d="M${x},${y} l3,-6 l3,6Z" fill="#E7A93B"/>` : `<circle cx="${x}" cy="${y}" r="2.2" fill="#E7A93B" stroke="${shade('#E7A93B', -0.4)}" stroke-width=".5"/>`).join('')}
        <path d="M-28,-58 C-10,-64 16,-64 34,-58" stroke="#E7A93B" stroke-width="3" fill="none"/>`,
    };
    case 'tall': return {
      back: '',
      front: `<path d="M-24,-64 L-17,-146 L19,-146 L30,-64Z" fill="${c}" ${L}/>
        <path d="M-21,-100 L26,-100 M-19,-124 L22,-124" stroke="${t}" stroke-width="2"/>
        <path d="M-6,-146 C-4,-160 8,-162 10,-154 L14,-150 L8,-150 L6,-146Z" fill="#E7A93B" stroke="${LINE}" stroke-width=".8"/>`,
    };
    case 'panama': return {
      back: '',
      front: `<path d="M-22,-70 C-22,-90 -6,-99 6,-99 C20,-99 30,-90 30,-70Z" fill="${c}" ${L}/>
        <path d="M-21,-76 C-6,-81 18,-81 30,-76 L30,-70 C18,-74 -6,-74 -21,-70Z" fill="${t}"/>
        <ellipse cx="4" cy="-68" rx="45" ry="8.5" fill="${shade(c, 0.06)}" ${L}/>
        <path d="M-36,-66 C-14,-62 24,-62 46,-67" stroke="${shade(c, -0.25)}" stroke-width="1" fill="none"/>`,
    };
    case 'cap': return {
      back: '',
      front: `<path d="M-26,-62 C-27,-87 -8,-97 6,-97 C22,-97 33,-87 32,-62Z" fill="${c}" ${L}/>
        <path d="M6,-97 L6,-64 M-12,-92 Q6,-80 24,-92" stroke="${shade(c, -0.3)}" stroke-width="1" fill="none"/>
        <path d="M23,-64 C33,-67 50,-65 57,-59 C47,-56 33,-57 23,-60Z" fill="${shade(c, -0.12)}" ${L}/>
        <circle cx="8" cy="-80" r="5" fill="${t}" stroke="${LINE}" stroke-width=".8"/><path d="M5,-80 l3,-3 l3,3 l-3,3Z" fill="${c}"/>`,
    };
    case 'hardhat': return {
      back: '',
      front: `<path d="M-28,-62 C-28,-93 -6,-103 6,-103 C22,-103 34,-93 34,-62Z" fill="${c}" ${L}/>
        <path d="M6,-103 C2,-92 1,-76 2,-62 M14,-102 C17,-90 18,-76 18,-62" stroke="${shade(c, -0.22)}" stroke-width="2.2" fill="none"/>
        <path d="M-6,-98 C-14,-92 -18,-82 -18,-72" stroke="#fff" stroke-width="2" opacity=".4" fill="none"/>
        <path d="M-33,-62 L41,-62 C43,-58 40,-56 37,-56 L-31,-56 C-34,-57 -35,-60 -33,-62Z" fill="${shade(c, -0.1)}" ${L}/>`,
    };
    case 'scarf': return {
      back: `<g transform="translate(-27,-46)">${chainSVG(reg, 'scarfTail', 3, 10, (i) => `<path d="M-5,0 L5,0 L${4 - i},10 L${-4 + i},10Z" fill="url(#${id}flor)"/>`, { amp: 22, k: 50 })}</g>`,
      front: `<path d="M-28,-44 C-32,-76 -10,-95 8,-93 C29,-92 38,-74 34,-55 C29,-66 20,-72 8,-72 C-4,-72 -14,-66 -18,-56 C-21,-50 -22,-44 -22,-35 C-25,-35 -28,-39 -28,-44Z" fill="url(#${id}flor)" ${L}/>
        <path d="M-20,-50 C-16,-66 -2,-73 8,-73 C20,-73 28,-67 33,-57" stroke="${t}" stroke-width="2.2" fill="none" stroke-dasharray="1 2.4"/>`,
    };
    case 'kimeshek': return {
      back: `<path d="M-33,-40 C-39,-82 -10,-105 10,-103 C35,-101 45,-80 41,-50 C41,-28 37,-10 31,0 L-28,0 C-34,-12 -35,-26 -33,-40Z" fill="#F7F4EC" stroke="${LINE}" stroke-width="1.2"/>`,
      front: `<path fill-rule="evenodd" d="M-31,-48 C-33,-80 -8,-98 10,-97 C32,-96 41,-76 38,-50 C37,-30 30,-10 20,-2 L-4,-2 C-20,-8 -31,-26 -31,-48Z M-19,-48 C-19,-66 -4,-74 8,-74 C22,-74 29,-62 29,-48 C29,-30 22,-14 10,-12 C-2,-12 -19,-28 -19,-48Z" fill="#F7F4EC" stroke="${LINE}" stroke-width="1.2"/>
        <path d="M-19,-48 C-19,-66 -4,-74 8,-74 C22,-74 29,-62 29,-48 C29,-30 22,-14 10,-12 C-2,-12 -19,-28 -19,-48Z" fill="none" stroke="url(#${id}orn)" stroke-width="4"/>
        <path d="M-27,-66 C-25,-97 0,-111 10,-109 C29,-105 39,-89 37,-66 C20,-75 -10,-75 -27,-66Z" fill="#FBFAF4" stroke="${LINE}" stroke-width="1.2"/>
        <path d="M-24,-74 C-6,-86 22,-88 35,-75 M-18,-88 C-2,-100 22,-100 30,-88" stroke="#D8D2C2" stroke-width="1.6" fill="none"/>`,
    };
    case 'fishcap': return {
      back: '',
      front: `<path d="M-26,-64 C-28,-83 -6,-91 10,-91 C29,-91 37,-80 34,-64Z" fill="${c}" ${L}/>
        <path d="M-22,-70 C-6,-76 18,-76 33,-70" stroke="${shade(c, -0.25)}" stroke-width="1.2" fill="none"/>
        <path d="M27,-66 C35,-67 46,-64 49,-60 C41,-58 33,-59 27,-61Z" fill="${shade(c, -0.2)}" ${L}/>
        ${h.badge ? `<path d="M2,-80 l3,-4 l3,4 l-3,4Z" fill="${h.badge}"/>` : ''}`,
    };
    default: return { back: '', front: '' };
  }
}

// ── волосы и борода ───────────────────────────────────
function hairSVG(s, id, reg) {
  const c = s.hair || '#24150D', hl = shade(c, 0.28);
  const hidden = ['scarf', 'kimeshek'].includes(s.hat?.type);
  if (hidden || s.hairStyle === 'none') return { back: '', front: '' };
  const covered = !!s.hat;
  let back = '', front = '';
  const style = s.hairStyle || (s.sex === 'f' ? 'braids' : 'short');
  if (style === 'bald') {
    back = `<path d="M-24,-42 C-27,-52 -25,-60 -21,-64 C-20,-56 -18,-48 -14,-42Z" fill="${c}"/>`;
    return { back, front };
  }
  back += `<path d="M-26,-44 C-32,-72 -12,-91 9,-90 C28,-89 38,-74 34,-56 C28,-66 20,-71 9,-71 C-2,-71 -10,-66 -16,-58 C-19,-52 -21,-45 -21,-37 C-24,-37 -26,-40 -26,-44Z" fill="${c}" stroke="${shade(c, -0.4)}" stroke-width="1"/>`;
  back += `<path d="M-18,-64 C-10,-80 10,-84 24,-76" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".55"/>`;
  if (style === 'braids') {
    const braid = (name, x, y, n) => `<g transform="translate(${x},${y})">${chainSVG(reg, name, n, 10, (i) => `<ellipse cx="${i % 2 ? 1 : -1}" cy="5" rx="4.2" ry="6" fill="${c}" stroke="${shade(c, -0.4)}" stroke-width=".7"/><path d="M-3,3 Q0,6 3,3" stroke="${hl}" stroke-width=".8" fill="none"/>${i === n - 1 ? `<g transform="translate(0,10)"><path d="M0,0 V5" stroke="#C3CAD2" stroke-width="1"/><path d="M-3,5 L3,5 L0,12Z" fill="#D8DEE6" stroke="#7C858F" stroke-width=".6"/><circle cy="13.5" r="1.4" fill="#C0504A"/></g>` : ''}`, { amp: 12, k: 70, d: 9 })}</g>`;
    back += braid('braidB', -22, -40, 6);
    front += braid('braidF', -12, -34, 6);
  } else if (style === 'pony') {
    back += `<g transform="translate(-24,-62) rotate(20)">${chainSVG(reg, 'pony', 4, 9, (i) => `<path d="M-${5 - i},0 C-${6 - i},5 -${5 - i},9 0,${10} C${5 - i},9 ${6 - i},5 ${5 - i},0Z" fill="${c}"/>`, { amp: 20, k: 50 })}</g>`;
  } else if (style === 'bun') {
    back += `<circle cx="-18" cy="-74" r="10" fill="${c}" stroke="${shade(c, -0.4)}" stroke-width="1"/><path d="M-24,-78 q6,-6 12,0" stroke="${hl}" stroke-width="1.2" fill="none"/>`;
  } else if (style === 'long') {
    back += `<path d="M-24,-50 C-32,-30 -30,-8 -22,8 L-10,8 C-14,-10 -16,-30 -14,-48Z" fill="${c}"/>`;
  }
  if (!covered) {
    front += style === 'short'
      ? `<path d="M-18,-60 C-10,-73 8,-77 20,-71 C27,-68 31,-62 33,-57 C24,-65 12,-67 4,-65 C-4,-63 -10,-59 -14,-52Z" fill="${c}"/>`
      : `<path d="M-19,-58 C-12,-72 6,-77 18,-72 C26,-69 31,-62 33,-56 C26,-63 16,-66 8,-64 C10,-60 6,-58 2,-58 C-4,-58 -10,-56 -14,-50Z" fill="${c}"/>`;
  } else {
    front += `<path d="M-22,-56 C-22,-50 -21,-44 -19,-40 C-17,-46 -16,-52 -15,-58Z" fill="${c}"/>`;
  }
  return { back, front };
}

function beardSVG(s) {
  const c = s.beardColor || s.hair || '#24150D', hl = shade(c, 0.3);
  switch (s.beard) {
    case 'long': return {
      beard: `<path d="M-16,-27 C-18,-12 -10,0 -3,14 C1,24 6,36 10,42 C14,35 17,25 21,14 C27,2 30,-10 30,-25 C26,-17 21,-13 13,-13 C6,-13 -6,-17 -16,-27Z" fill="${c}" stroke="${shade(c, -0.25)}" stroke-width="1"/>
        <path d="M-6,-10 Q0,10 7,32 M4,-12 Q8,10 11,36 M16,-12 Q18,6 16,26 M-12,-18 Q-8,-2 -1,12" stroke="${shade(c, -0.12)}" stroke-width="1" fill="none"/>
        <path d="M2,-14 Q8,4 9,22" stroke="${hl}" stroke-width="1" fill="none" opacity=".7"/>`,
      stache: `<path d="M0,-24 C5,-28 12,-26.5 13,-25 C14,-26.5 22,-28 26,-23 C25,-18 22,-15 21,-12 C20,-17 17,-21 13,-21.5 C9,-21 5,-17 2,-12 C1,-16 -1,-20 0,-24Z" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width=".8"/>`,
    };
    case 'short': return {
      beard: `<path d="M-16,-25 C-17,-14 -9,-5 2,-3 C10,-2 17,-4 22,-8 C27,-12 30,-18 30,-25 C24,-17 18,-14 12,-14 C6,-14 -5,-16 -16,-25Z" fill="${c}" opacity=".92"/>`,
      stache: `<path d="M2,-23.5 C6,-27 11,-26.5 13,-25 C15,-26.5 20,-27 24,-23 C20,-22 15,-22.5 13,-23 C11,-22.5 6,-21.5 2,-23.5Z" fill="${c}"/>`,
    };
    case 'moustache': return {
      beard: '',
      stache: `<path d="M1,-23.5 C5,-27.5 11,-26.5 13,-25 C15,-26.5 21,-27.5 25,-23.5 C22,-21 17,-22 13,-23 C9,-22 4,-21 1,-23.5Z" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width=".6"/>`,
    };
    default: return { beard: '', stache: '' };
  }
}

// ── голова ────────────────────────────────────────────
function headSVG(s, id, reg, G) {
  const skin = s.skin || '#E3B288', sd = shade(skin, -0.17), sdd = shade(skin, -0.34), sl = shade(skin, 0.18);
  const fem = s.sex === 'f', kid = s.age === 'child' || s.age === 'teen', old = s.age === 'elder';
  const iris = s.eyes || '#5A3A1C';
  const browC = s.brow || (old ? '#D8D4CC' : shade(s.hair || '#24150D', -0.1));
  const ry1 = kid ? 7.4 : fem ? 7 : 6.4, rx1 = kid ? 6.4 : 6, ry2 = ry1 - 0.5, rx2 = 4.3;
  Object.assign(G, { e1: [1, -45, rx1, ry1], e2: [21, -45, rx2, ry2], fem, kid, old });
  const hat = hatSVG(s, id, reg), hair = hairSVG(s, id, reg), bd = beardSVG(s);
  const FACE = kid
    ? 'M-24,-48 C-25,-72 -8,-82 8,-81 C25,-80 32,-67 32,-52 C32,-42 31,-34 29,-27 C26,-15 20,-8 10,-7 C1,-6 -10,-9 -17,-16 C-23,-23 -24,-34 -24,-48Z'
    : 'M-24,-50 C-25,-72 -8,-82 8,-81 C24,-80 32,-68 32,-52 C32,-44 31,-36 30,-30 C28,-18 22,-8 12,-6 C2,-4 -10,-8 -17,-16 C-23,-24 -24,-36 -24,-50Z';
  const eye = (n, [cx, cy, rx, ry]) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFDF6" stroke="${sdd}" stroke-width=".6"/>
    <g clip-path="url(#${id}c${n})">
      <g data-k="iris${n}"><circle cx="${cx}" cy="${cy}" r="${n === 1 ? 4.1 : 3.4}" fill="${iris}"/><circle cx="${cx}" cy="${cy}" r="${n === 1 ? 4.1 : 3.4}" fill="none" stroke="${shade(iris, -0.45)}" stroke-width=".9"/>
        <path d="M${cx - 2.6},${cy + 1} A2.8,2.8 0 0 0 ${cx + 2.6},${cy + 1}" stroke="${shade(iris, 0.35)}" stroke-width=".8" fill="none" opacity=".7"/>
        <circle cx="${cx}" cy="${cy}" r="${n === 1 ? 2.1 : 1.8}" fill="#120A06"/><circle cx="${cx - 1.4}" cy="${cy - 1.7}" r="1.25" fill="#fff"/><circle cx="${cx + 1.3}" cy="${cy + 1.5}" r=".55" fill="#fff" opacity=".85"/></g>
      <ellipse cx="${cx}" cy="${cy - ry * 0.7}" rx="${rx}" ry="${ry * 0.38}" fill="${sdd}" opacity=".16"/>
      <rect data-k="lid${n}" x="${cx - rx - 1}" y="${cy - ry - 1}" width="${rx * 2 + 2}" height="1" fill="${skin}"/>
      <rect data-k="llid${n}" x="${cx - rx - 1}" y="${cy + ry}" width="${rx * 2 + 2}" height="1" fill="${skin}"/>
    </g>
    <path data-k="lash${n}" fill="none" stroke="${LINE}" stroke-width="${fem ? 2.1 : 1.6}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${cx - rx + 1},${cy + ry + 1.4} Q${cx},${cy + ry + 2.6} ${cx + rx - 0.5},${cy + ry + 1}" stroke="${sd}" stroke-width=".7" fill="none" opacity=".7"/>
    ${old ? `<path d="M${cx + rx + 1},${cy - 1} l3,-2 M${cx + rx + 1},${cy + 1.5} l3.2,.6" stroke="${sd}" stroke-width=".7"/>` : ''}`;
  const lipC = mix(shade(skin, -0.14), '#C0504A', fem ? 0.5 : kid ? 0.35 : 0.22);
  G.lip = lipC;
  return `
  <defs>
    <radialGradient id="${id}fg" cx="40%" cy="42%" r="70%"><stop offset="0" stop-color="${sl}"/><stop offset=".62" stop-color="${skin}"/><stop offset="1" stop-color="${sd}"/></radialGradient>
    <clipPath id="${id}c1"><ellipse cx="${G.e1[0]}" cy="${G.e1[1]}" rx="${G.e1[2]}" ry="${G.e1[3]}"/></clipPath>
    <clipPath id="${id}c2"><ellipse cx="${G.e2[0]}" cy="${G.e2[1]}" rx="${G.e2[2]}" ry="${G.e2[3]}"/></clipPath>
    <clipPath id="${id}m"><path data-k="mclip" d="M0,0"/></clipPath>
  </defs>
  ${hat.back}${hair.back}
  <path d="M-10,4 L-8,-15 L11,-15 L12,4Z" fill="${sd}"/>
  <path d="M-8,-14 Q3,-6 11,-14" fill="${sdd}" opacity=".35"/>
  <g data-k="ear"><path d="M-21,-47 C-31,-50 -32,-29 -21,-29 C-19,-33 -19,-43 -21,-47Z" fill="${skin}" stroke="${LINE}" stroke-width="1.1"/>
    <path d="M-23,-43 C-28,-43 -28,-34 -23,-34" stroke="${sd}" stroke-width="1.1" fill="none"/>
    ${fem ? `<g transform="translate(-25,-29)">${chainSVG(reg, 'earring', 2, 4, (i) => i ? `<circle cy="3.5" r="2.4" fill="#C0504A" stroke="#7A2A20" stroke-width=".5"/>` : `<path d="M0,0 V4" stroke="#E7A93B" stroke-width="1"/>`, { amp: 20, k: 40 })}</g>` : ''}</g>
  <path d="${FACE}" fill="url(#${id}fg)" stroke="${LINE}" stroke-width="1.4"/>
  <path d="M24,-70 C31,-62 32,-48 30,-32 C28,-20 22,-10 14,-7 C22,-16 26,-30 26,-46 C26,-56 26,-64 24,-70Z" fill="${sdd}" opacity=".16"/>
  <path d="M-14,-13 Q1,-4 18,-9" stroke="${sd}" stroke-width="1" fill="none" opacity=".5"/>
  ${old ? `<path d="M-10,-66 Q4,-70 18,-66 M-8,-62 Q4,-65 16,-62" stroke="${sd}" stroke-width=".9" fill="none" opacity=".8"/><path d="M-6,-27 Q-9,-20 -6,-14 M27,-27 Q29,-21 26,-15" stroke="${sd}" stroke-width=".9" fill="none"/>` : ''}
  <g data-k="feat">
    <ellipse data-k="blush1" cx="-7" cy="-31" rx="6.5" ry="3.6" fill="#E77F62" opacity=".2"/>
    <ellipse data-k="blush2" cx="25" cy="-32" rx="3.4" ry="3" fill="#E77F62" opacity=".2"/>
    <path d="M-5,-53 Q1,-56 8,-53.4" stroke="${sd}" stroke-width=".8" fill="none" opacity=".8"/>
    <path d="M17,-53 Q21,-55 25,-53" stroke="${sd}" stroke-width=".7" fill="none" opacity=".8"/>
    ${eye(1, G.e1)}${eye(2, G.e2)}
    <g data-k="brow1"><path d="M-6.5,0.6 Q0,-3.2 7.5,-0.8" stroke="${browC}" stroke-width="${old ? 3.4 : fem ? 2.3 : 2.9}" fill="none" stroke-linecap="round"/></g>
    <g data-k="brow2"><path d="M-4.5,-0.8 Q1,-3 5.5,0.6" stroke="${browC}" stroke-width="${old ? 3 : fem ? 2 : 2.5}" fill="none" stroke-linecap="round"/></g>
    ${kid
      ? `<path d="M15,-39 C18,-35 22,-33 22.5,-31 C22,-29.3 19.5,-29.4 17.6,-30.5" fill="none" stroke="${sdd}" stroke-width="1.4" stroke-linecap="round"/>`
      : `<path d="M12,-50 C13,-43 18,-37 25,-32.5 C27.5,-31 26.5,-28.6 23,-28.6 C21,-28.7 19.5,-29.5 18.4,-30.4" fill="none" stroke="${sdd}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M20.5,-30.6 q1.6,1.2 3.4,.5" stroke="${shade(skin, -0.45)}" stroke-width="1" fill="none"/>
        <path d="M14.5,-45 q2,5 6.5,8" stroke="${sl}" stroke-width="1.2" fill="none" opacity=".8"/>`}
    ${bd.beard ? `<g data-k="beard">${bd.beard}</g>` : ''}
    <g data-k="mouth">
      <path data-k="lips" fill="${lipC}" stroke="${shade(lipC, -0.3)}" stroke-width=".7"/>
      <path data-k="inner" fill="#4A1610"/>
      <g clip-path="url(#${id}m)"><rect data-k="teeth" fill="#FFFDF5" width="0" height="0"/><ellipse data-k="tongue" fill="#C8504A" rx="0" ry="0"/></g>
      <path data-k="mline" fill="none" stroke="${shade(lipC, -0.5)}" stroke-width="1.3" stroke-linecap="round"/>
    </g>
    ${bd.stache}
  </g>
  ${hair.front}
  ${s.glasses ? `<g fill="none" stroke="#3A3A3A" stroke-width="1.4"><circle cx="1" cy="-45" r="8.5"/><ellipse cx="21" cy="-45" rx="5.6" ry="8"/><path d="M9.5,-46 Q13,-48 15.5,-46 M-7.5,-46 L-22,-48"/></g><path d="M-3,-50 l4,-2" stroke="#fff" stroke-width="1.2" opacity=".7"/>` : ''}
  ${hat.front}`;
}

// ── одежда и тело ─────────────────────────────────────
function torsoSVG(s, id, P, reg) {
  const o = s.outfit || {};
  const T = P.torso, W = P.sh, top = -T, waist = -T * 0.38;
  const main = o.color || '#3A5BA6', dk = shade(main, -0.3), inner = o.inner || '#F4EFE4';
  const belt = o.belt || '#6B4A2E';
  const type = o.type || 'chapan';
  const L = `stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"`;
  const cx = W * 0.3; // линия середины груди в ракурсе 3/4
  let back = '', body = '', hem = '', front = '';
  const shoulders = `M${-W},${top + 11} C${-W},${top + 2} ${-W + 8},${top - 2} -8,${top - 1} L12,${top - 1} C${W - 6},${top - 2} ${W + 1},${top + 2} ${W + 1},${top + 12}`;
  const shadeR = `<path d="M${cx + 4},${top + 1} C${W - 4},${top} ${W + 1},${top + 4} ${W + 1},${top + 12} L${W - 3},${waist} L${W + 1},4 L${cx + 4},4Z" fill="#000" opacity=".13"/>`;
  const belted = `<rect x="${-W + 1}" y="${waist - 4.5}" width="${W * 2}" height="9" rx="2" fill="${belt}" ${L}/>
    ${Array.from({ length: Math.floor(W * 2 / 9) }, (_, i) => `<rect x="${-W + 4 + i * 9}" y="${waist - 3}" width="5" height="6" rx="1" fill="#D8DEE6" stroke="#7C858F" stroke-width=".6"/>`).join('')}
    <rect x="${cx - 4}" y="${waist - 5.5}" width="9" height="11" rx="2" fill="#E7A93B" stroke="${LINE}" stroke-width=".9"/>`;
  const hemH = (k) => -waist + P.leg * k;

  if (type === 'chapan' || type === 'tunic' || type === 'fur' || type === 'apron' || type === 'armor') {
    const H = hemH(type === 'tunic' ? 0.5 : type === 'armor' ? 0.42 : 0.66);
    body = `<path d="${shoulders} L${W - 3},${waist} L${W + 1},4 L${-W - 1},4 L${-W + 3},${waist}Z" fill="url(#${id}cloth)" ${L}/>
      ${shadeR}
      <path d="M-7,${top - 1} L${cx - 1},${top + 14} L15,${top - 1}Z" fill="${inner}" ${L}/>
      <path d="M-4,${top - 1} L${cx - 1},${top + 12} L12,${top - 1}" stroke="${shade(inner, -0.2)}" stroke-width="1" fill="none"/>
      ${type === 'armor' ? `<path d="M${-W + 2},${top + 14} L${W - 1},${top + 14} L${W - 3},${waist - 4} L${-W + 4},${waist - 4}Z" fill="url(#${id}mail)" ${L}/>
        <path d="M${-W - 1},${top + 6} C${-W + 2},${top - 1} ${-W + 14},${top - 3} ${-W + 18},${top + 4} L${-W + 15},${top + 18} L${-W},${top + 18}Z" fill="url(#${id}steel)" ${L}/>
        <path d="M${cx - 6},${top + 18} h12 v14 h-12Z" fill="url(#${id}steel)" ${L}/><circle cx="${cx}" cy="${top + 25}" r="3" fill="#E7A93B"/>` : ''}
      <path d="M12,${top - 1} L16,${top - 1} L${cx + 4},${waist} L${cx},${waist}Z" fill="url(#${id}orn)" ${L}/>
      <path d="M${-W + 6},${top + 18} Q${-W + 10},${waist + 6} ${-W + 4},0 M${W - 6},${top + 20} Q${W - 10},${waist} ${W - 4},-2" stroke="${dk}" stroke-width="1" fill="none" opacity=".7"/>
      ${type === 'fur' ? `<path d="M-12,${top - 4} C-6,${top + 8} 6,${top + 10} 20,${top - 4} L18,${top + 6} C8,${top + 18} -6,${top + 16} -14,${top + 6}Z" fill="url(#${id}fur)" ${L}/>` : ''}
      ${belted}`;
    hem = `<path d="M${-W + 3},0 C${-W - 2},${H * 0.5} ${-W - 6},${H * 0.8} ${-W - 9},${H} L${cx + 1},${H} L${cx + 1},-2Z" fill="url(#${id}cloth)" ${L}/>
      <path d="M${cx - 1},-2 L${cx + 3},${H} L${W + 10},${H} C${W + 6},${H * 0.7} ${W + 2},${H * 0.4} ${W - 3},0Z" fill="${shade(main, -0.12)}" ${L}/>
      <path d="M${-W - 9},${H - 7} L${W + 10},${H - 7} L${W + 10},${H} L${-W - 9},${H}Z" fill="url(#${id}${type === 'fur' ? 'fur' : 'orn'})" ${L}/>
      <path d="M${cx - 1},0 L${cx + 4},0 L${cx + 7},${H} L${cx + 2},${H}Z" fill="url(#${id}orn)" ${L}/>
      <path d="M${-W + 2},${H * 0.25} Q${-W - 2},${H * 0.6} ${-W - 4},${H - 8} M${-6},4 Q${-8},${H * 0.5} ${-8},${H - 8}" stroke="${dk}" stroke-width="1" fill="none" opacity=".6"/>`;
    if (type === 'apron') {
      front += `<path d="M${-W + 8},${top + 22} L${W - 4},${top + 22} L${W - 1},${H * 0.85 + waist} L${-W + 5},${H * 0.85 + waist}Z" fill="${o.apron || '#9C7A54'}" ${L}/>
        <path d="M${-W + 8},${top + 22} L-6,${top - 1} M${W - 4},${top + 22} L16,${top - 1}" stroke="${shade(o.apron || '#9C7A54', -0.3)}" stroke-width="2"/>
        <rect x="${-W + 12}" y="${waist + 10}" width="${W}" height="14" rx="2" fill="none" stroke="${shade(o.apron || '#9C7A54', -0.35)}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
    }
  } else if (type === 'dress') {
    const H = hemH(0.94);
    body = `<path d="M${-W - 1},${top + 11} C${-W - 1},${top + 2} ${-W + 7},${top - 2} -7,${top - 1} L11,${top - 1} C${W - 5},${top - 2} ${W + 1},${top + 2} ${W + 1},${top + 12} L${W - 1},${top + 26} L${-W + 1},${top + 26}Z" fill="${inner}" ${L}/>
      <path d="M${-W + 3},${top + 6} C${-W + 3},${top + 1} ${-W + 9},${top - 1} -2,${top}
        L${cx - 3},${top + 22} L${cx + 3},${top + 22} L18,${top} C${W - 5},${top} ${W - 1},${top + 4} ${W - 1},${top + 12}
        L${W - 5},${waist} C${W + 2},${waist + 6} ${W + 4},-3 ${W + 6},6 L${-W - 6},6 C${-W - 4},-3 ${-W - 2},${waist + 6} ${-W + 4},${waist}Z" fill="url(#${id}cloth)" ${L}/>
      <path d="M-2,${top} L${cx - 3},${top + 22} L${cx - 3},6 M18,${top} L${cx + 3},${top + 22} L${cx + 3},6" stroke="url(#${id}orn)" stroke-width="3.2" fill="none"/>
      ${[0, 1, 2, 3].map((i) => `<circle cx="${cx}" cy="${top + 28 + i * 9}" r="1.8" fill="#E7A93B" stroke="${LINE}" stroke-width=".5"/>`).join('')}
      <path d="M-5,${top - 1} Q3,${top + 6} 13,${top - 1}" stroke="${shade(inner, -0.25)}" stroke-width="1.6" fill="none"/>
      ${shadeR}`;
    const sc = (y, col) => `<path d="M${-W - 16},${y} ${Array.from({ length: 9 }, (_, i) => `a${(2 * W + 34) / 18},5 0 0 0 ${(2 * W + 34) / 9},0`).join(' ')} L${W + 18},${y - 8} L${-W - 14},${y - 8}Z" fill="${col}" stroke="${LINE}" stroke-width="1"/>`;
    hem = `<path d="M${-W + 2},0 C${-W - 6},${H * 0.4} ${-W - 14},${H * 0.8} ${-W - 17},${H} L${W + 18},${H} C${W + 12},${H * 0.8} ${W + 6},${H * 0.4} ${W - 2},0Z" fill="${o.skirt || inner}" ${L}/>
      <path d="M${cx},0 C${cx + 3},${H * 0.5} ${cx + 6},${H * 0.8} ${cx + 8},${H}" stroke="${shade(o.skirt || inner, -0.2)}" stroke-width="1.2" fill="none"/>
      <path d="M${-W + 4},${H * 0.2} Q${-W - 4},${H * 0.6} ${-W - 10},${H - 10}" stroke="${shade(o.skirt || inner, -0.18)}" stroke-width="1" fill="none"/>
      ${sc(H - 12, shade(o.skirt || inner, -0.08))}${sc(H - 1, shade(o.skirt || inner, 0.1))}`;
  } else {
    // современная одежда: рубашка, жилет или куртка
    const jacket = type === 'jacket' || type === 'uniform';
    body = `<path d="${shoulders} L${W - 3},${waist} L${W},${jacket ? 14 : 4} L${-W},${jacket ? 14 : 4} L${-W + 3},${waist}Z" fill="${jacket ? `url(#${id}cloth)` : inner}" ${L}/>
      <path d="M-6,${top - 1} L${cx - 1},${top + 12} L14,${top - 1} L10,${top + 4} L${cx - 1},${top + 14} L-3,${top + 4}Z" fill="${shade(jacket ? main : inner, -0.12)}" ${L}/>
      ${type === 'vest' ? `<path d="M${-W + 4},${top + 6} L-4,${top + 2} L${cx - 2},${top + 30} L${cx - 2},${waist + 8} L${-W + 2},${waist + 8}Z M${W - 1},${top + 8} L17,${top + 2} L${cx + 2},${top + 30} L${cx + 2},${waist + 8} L${W},${waist + 8}Z" fill="${main}" ${L}/>
        <rect x="${-W + 6}" y="${top + 24}" width="12" height="10" rx="1.5" fill="${shade(main, -0.12)}" ${L}/><rect x="${cx + 6}" y="${top + 26}" width="10" height="9" rx="1.5" fill="${shade(main, -0.18)}" ${L}/>
        <rect x="${-W + 6}" y="${waist - 2}" width="14" height="10" rx="1.5" fill="${shade(main, -0.12)}" ${L}/>` : ''}
      ${jacket ? `<path d="M${cx},${top + 12} L${cx},14" stroke="${dk}" stroke-width="1.6"/>
        <rect x="${-W + 6}" y="${top + 20}" width="13" height="11" rx="1.5" fill="${shade(main, -0.1)}" ${L}/><path d="M${-W + 6},${top + 24} h13" stroke="${dk}" stroke-width="1"/>
        <rect x="${cx + 5}" y="${top + 20}" width="11" height="10" rx="1.5" fill="${shade(main, -0.18)}" ${L}/>
        ${o.badge ? `<path d="M${-W + 12},${top + 8} l5,-3 l5,3 v6 l-5,4 l-5,-4Z" fill="${o.badge}" stroke="${LINE}" stroke-width=".8"/>` : ''}` : ''}
      ${shadeR}
      ${jacket ? '' : belted}`;
    hem = '';
  }

  // вещи на спине
  if (s.back === 'shield') back += `<g transform="translate(${-W * 0.2},${-T * 0.58})"><circle r="25" fill="#8C5A2B" ${L}/><circle r="21" fill="url(#${id}orn2)"/><circle r="21" fill="none" stroke="#E7A93B" stroke-width="2"/><circle r="7" fill="#E7A93B" ${L}/><circle r="2.5" fill="#FFF4C8"/></g>`;
  if (s.back === 'dombra') back += `<g transform="translate(${W * 0.3},${-T * 0.25}) rotate(-28)"><path d="M-3,-96 L3,-96 L3,-30 L-3,-30Z" fill="#8C5A2B" ${L}/><path d="M0,-30 C-15,-26 -17,6 0,12 C17,6 15,-26 0,-30Z" fill="#B87333" ${L}/><path d="M-1,-96 V6 M1,-96 V6" stroke="#F4E3C1" stroke-width=".6"/><circle cy="-6" r="3" fill="#4A2A12"/><path d="M-4,-100 L4,-100 L3,-108 L-3,-108Z" fill="#6B3E1F"/></g>`;
  if (s.back === 'quiver') back += `<g transform="translate(${W * 0.1},${-T * 0.62}) rotate(18)"><rect x="-6" y="-30" width="12" height="50" rx="3" fill="#7A2A20" ${L}/>${[-3, 0, 3].map((x) => `<path d="M${x},-30 L${x},-44 M${x - 2},-44 L${x},-48 L${x + 2},-44" stroke="#6B4A2E" stroke-width="1.2" fill="#9AA3AD"/>`).join('')}</g>`;
  if (s.back === 'net') back += `<g transform="translate(${-W * 0.4},${-T * 0.7}) rotate(-20)"><path d="M0,0 C-12,20 -14,50 -4,70 C8,56 12,24 6,0Z" fill="#C9B88E" opacity=".9" ${L}/><path d="M-8,14 L6,26 M-10,30 L6,44 M-8,48 L4,58 M4,10 L-10,28 M6,28 L-10,46 M4,46 L-6,62" stroke="#8C7A54" stroke-width=".8"/></g>`;
  if (s.back === 'lasso') back += `<g transform="translate(${W * 0.1},${-T * 0.65})"><ellipse rx="16" ry="20" fill="none" stroke="#B9A07A" stroke-width="3"/><ellipse rx="12" ry="16" fill="none" stroke="#9C8462" stroke-width="2.4"/></g>`;
  // вещи спереди
  if (s.chest === 'binoculars') front += `<path d="M-6,${top} Q${cx},${top + 30} 16,${top}" stroke="#3A3A3A" stroke-width="1.2" fill="none"/><g transform="translate(${cx - 2},${top + 30})"><rect x="-9" y="-5" width="8" height="12" rx="2" fill="#2E2E2E"/><rect x="1" y="-5" width="8" height="12" rx="2" fill="#2E2E2E"/><rect x="-3" y="-2" width="6" height="4" fill="#444"/><circle cx="-5" cy="7" r="2.5" fill="#6A8CA8"/><circle cx="5" cy="7" r="2.5" fill="#6A8CA8"/></g>`;
  if (s.chest === 'camera') front += `<path d="M-6,${top} Q${cx},${top + 34} 16,${top}" stroke="#3A3A3A" stroke-width="1.2" fill="none"/><g transform="translate(${cx},${top + 34})"><rect x="-10" y="-7" width="20" height="14" rx="2" fill="#2E2E2E"/><circle r="5" fill="#6A8CA8" stroke="#111" stroke-width="1.4"/><rect x="4" y="-10" width="5" height="3" fill="#444"/></g>`;
  if (s.chest === 'whistle') front += `<path d="M-6,${top} Q${cx},${top + 22} 16,${top}" stroke="#E7A93B" stroke-width="1" fill="none"/><rect x="${cx - 3}" y="${top + 20}" width="7" height="4" rx="2" fill="#C0C6CC"/>`;
  if (s.chest === 'sword') front += `<g transform="translate(${-W + 2},${waist + 2}) rotate(18)"><rect x="-2" y="0" width="5" height="48" rx="2" fill="#5A3A1C" ${L}/><rect x="-6" y="-3" width="13" height="4" rx="1.5" fill="#E7A93B"/><rect x="-1.5" y="-14" width="4" height="11" fill="#7A2A20"/></g>`;
  if (s.chest === 'bag') front += `<path d="M${-W + 2},${top + 4} L${W - 6},${waist + 10}" stroke="#7A2A20" stroke-width="3"/><g transform="translate(${W - 10},${waist + 12})"><path d="M-12,-6 L12,-6 L10,14 L-10,14Z" fill="#A8322A" ${L}/><path d="M-12,-6 L12,-6 L8,4 L-8,4Z" fill="#7A2A20" ${L}/><circle cy="2" r="2" fill="#E7A93B"/></g>`;
  if (s.chest === 'dombra') front += `<g transform="translate(${-W * 0.25},${waist - 2}) rotate(58)"><path d="M-3,-104 L3,-104 L3,-28 L-3,-28Z" fill="#8C5A2B" ${L}/>
      <path d="M0,-28 C-17,-24 -19,12 0,18 C19,12 17,-24 0,-28Z" fill="#B87333" ${L}/><path d="M-11,-8 Q0,-14 11,-8" stroke="#6B3E1F" stroke-width="1" fill="none"/>
      <circle cy="-2" r="3.4" fill="#4A2A12"/><path d="M-1,-104 V14 M1,-104 V14" stroke="#F4E3C1" stroke-width=".6"/>
      ${[-90, -78, -66, -54, -42].map((y) => `<path d="M-3,${y} h6" stroke="#E7A93B" stroke-width=".8"/>`).join('')}
      <path d="M-4,-106 L4,-106 L3,-116 L-3,-116Z" fill="#6B3E1F"/><circle cx="-4" cy="-111" r="1.6" fill="#E7A93B"/><circle cx="4" cy="-111" r="1.6" fill="#E7A93B"/></g>`;
  if (s.chest === 'bib') front += `<path d="M-15,${top - 3} C-19,${top + 20} -10,${top + 36} 6,${top + 40} C24,${top + 36} 31,${top + 20} 27,${top - 3}Z" fill="#F7F4EC" ${L}/><path d="M-6,${top + 6} C-6,${top + 22} 2,${top + 30} 8,${top + 32} C16,${top + 30} 20,${top + 20} 20,${top + 6}Z" fill="url(#${id}orn)" opacity=".85" ${L}/>`;
  return { back, body, hem, front, waist };
}

function legSVG(s, P, n) {
  const o = s.outfit || {};
  const L1 = P.leg * 0.5, L2 = P.leg * 0.5;
  const tr = shade(o.pants || '#3A2A20', n === 2 ? -0.18 : 0);
  const boot = shade(o.boots || '#2B1A12', n === 2 ? -0.15 : 0);
  const modern = ['vest', 'jacket', 'uniform', 'shirt'].includes(o.type);
  const L = `stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"`;
  const bootSVG = modern
    ? `<path d="M-6.5,${L2 - 22} L6.5,${L2 - 22} L7,${L2 - 7} C11,${L2 - 7} 16,${L2 - 6} 17,${L2 - 3} L17,${L2} L-7.5,${L2} L-7.5,${L2 - 6}Z" fill="${boot}" ${L}/><path d="M-7.5,${L2 - 2} L17,${L2 - 2}" stroke="${shade(boot, 0.3)}" stroke-width="2"/>`
    : `<path d="M-6.8,${L2 - 30} L6.4,${L2 - 30} L6.8,${L2 - 7} C10,${L2 - 6} 15,${L2 - 5} 19,${L2 - 9} C20.5,${L2 - 4} 18,${L2} 13,${L2} L-6,${L2} L-7.4,${L2 - 4}Z" fill="${boot}" ${L}/>
       <path d="M-6.8,${L2 - 30} L6.4,${L2 - 30} L6.5,${L2 - 26} L-6.9,${L2 - 26}Z" fill="#E7A93B" opacity=".85"/>
       <path d="M-6,${L2 - 1} L-1,${L2 - 1} L-1,${L2 + 1} L-6,${L2 + 1}Z" fill="${shade(boot, -0.4)}"/>`;
  return `<g data-k="thigh${n}"><path d="M-7,-2 L7,-2 L6,${L1} L-6,${L1}Z" fill="${tr}" ${L}/>
    <g transform="translate(0,${L1})"><g data-k="knee${n}"><path d="M-6,-2 L6,-2 L5.4,${L2 - 18} L-5.4,${L2 - 18}Z" fill="${tr}" ${L}/>${bootSVG}</g></g></g>`;
}

function handSVG(skin, n) {
  const sd = shade(skin, -0.3), L = `stroke="${sd}" stroke-width=".9"`;
  return `<g data-k="hOpen${n}"><path d="M-5,-1 C-6.5,4 -5,10.5 0,11.5 C5,11.5 6.5,5 5.6,-1Z" fill="${skin}" ${L}/>
      <path d="M-2.6,6.5 v4 M0,7 v4.4 M2.6,6.5 v4" stroke="${sd}" stroke-width=".7"/>
      <path d="M4.6,1 C8.4,2 9.4,5.5 7.7,7 C6,6.4 5,4 4.6,3Z" fill="${skin}" ${L}/></g>
    <g data-k="hFist${n}" style="display:none"><ellipse cx="0" cy="4.2" rx="5.8" ry="5.4" fill="${skin}" ${L}/><path d="M-3.5,7 h7 M-3.8,4.5 h7.4" stroke="${sd}" stroke-width=".6"/><path d="M3.8,0 C7,1.5 7.4,5 5,6.2" fill="${skin}" ${L}/></g>
    <g data-k="hPoint${n}" style="display:none"><ellipse cx="0" cy="4" rx="5.6" ry="5.2" fill="${skin}" ${L}/><path d="M1.2,6 L2.6,17 C2.7,18.6 0.6,18.8 .3,17.2 L-.8,7Z" fill="${skin}" ${L}/><path d="M3.8,0 C7,1.5 7.4,5 5,6" fill="${skin}" ${L}/></g>`;
}

function armSVG(s, id, P, n) {
  const o = s.outfit || {};
  const skin = s.skin || '#E3B288';
  const main = o.color || '#3A5BA6';
  const type = o.type || 'chapan';
  const dk = n === 2 ? -0.2 : 0;
  const U = P.up, F = P.lo;
  const L = `stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"`;
  let upper, fore;
  if (type === 'dress') {
    const sl = shade(o.inner || '#F4EFE4', dk);
    upper = `<path d="M-7,-4 C-7,-7 7,-7 7,-4 L6,${U} L-6,${U}Z" fill="${shade(main, dk)}" ${L}/><path d="M-7,${U - 5} L7,${U - 5}" stroke="url(#${id}orn)" stroke-width="3"/>`;
    fore = `<path d="M-6,0 L6,0 L5,${F - 6} L-5,${F - 6}Z" fill="${sl}" ${L}/><path d="M-7,${F - 9} q3.5,4 7,0 q3.5,4 7,0 L7,${F - 4} L-7,${F - 4}Z" fill="${shade(sl, -0.08)}" ${L}/>`;
  } else if (['vest', 'shirt'].includes(type)) {
    const sl = shade(o.inner || '#F4EFE4', dk);
    upper = `<path d="M-7,-4 C-7,-7 7,-7 7,-4 L6,${U} L-6,${U}Z" fill="${sl}" ${L}/>`;
    fore = `<path d="M-6.4,0 L6.4,0 L6.4,8 L-6.4,8Z" fill="${shade(sl, -0.08)}" ${L}/><path d="M-5,8 L5,8 L4.6,${F - 2} L-4.6,${F - 2}Z" fill="${shade(skin, dk)}" ${L}/>`;
  } else {
    const c = shade(main, dk);
    const wide = type === 'chapan' || type === 'fur' || type === 'apron';
    upper = `<path d="M-8,-4 C-8,-8 8,-8 8,-4 L7,${U} L-7,${U}Z" fill="${c}" ${L}/>${type === 'armor' ? `<path d="M-8,-4 C-8,-8 8,-8 8,-4 L7,${U * 0.45} L-7,${U * 0.45}Z" fill="url(#${id}steel)" ${L}/>` : ''}`;
    fore = `<path d="M-7,0 L7,0 L${wide ? 9.5 : 7},${F - 4} L${wide ? -9.5 : -7},${F - 4}Z" fill="${c}" ${L}/>
      <path d="M${wide ? -9.5 : -7},${F - 9} L${wide ? 9.5 : 7},${F - 9} L${wide ? 9.5 : 7},${F - 3} L${wide ? -9.5 : -7},${F - 3}Z" fill="url(#${id}${type === 'fur' ? 'fur' : 'orn'})" ${L}/>`;
  }
  return `<g data-k="arm${n}">${upper}<g transform="translate(0,${U})"><g data-k="elbow${n}">${fore}
    <g transform="translate(0,${F - 3})"><g data-k="hand${n}">${n === 1 ? '<g data-k="item1"></g>' : '<g data-k="item2"></g>'}${handSVG(shade(skin, dk), n)}</g></g></g></g></g>`;
}

// ── вещи в руках ──────────────────────────────────────
export function itemSVG(kind) {
  const L = `stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"`;
  switch (kind) {
    case 'staff': return `<path d="M-2,-110 L2,-110 L3,96 L-3,96Z" fill="#8C5A2B" ${L}/><circle cy="-112" r="5" fill="#6B3E1F" ${L}/><path d="M-2.4,-80 h5 M-2.4,-74 h5" stroke="#E7A93B" stroke-width="1.6"/>`;
    case 'crook': return `<path d="M-2,-104 L2,-104 L3,96 L-3,96Z" fill="#9C6A3A" ${L}/><path d="M0,-104 C0,-122 18,-124 18,-110 C18,-102 12,-100 10,-104" stroke="#9C6A3A" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    case 'cane': return `<path d="M-2,-6 L2,-6 L3,74 L-3,74Z" fill="#6B4A2E" ${L}/><path d="M0,-6 C0,-16 -14,-18 -14,-8" stroke="#6B4A2E" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    case 'tile': return `<g transform="translate(0,10) rotate(10)"><rect x="-13" y="-13" width="26" height="26" rx="2" fill="#1C9AA0" ${L}/><path d="M0,-10 L10,0 L0,10 L-10,0Z" fill="#F4E3C1"/><circle r="4" fill="#23518F"/><path d="M-13,-13 L-9,-9 M13,13 L9,9 M13,-13 L9,-9 M-13,13 L-9,9" stroke="#F4E3C1" stroke-width="1.4"/></g>`;
    case 'brush': return `<g transform="rotate(-20)"><rect x="-2" y="-2" width="4" height="24" rx="1.5" fill="#9C6A3A" ${L}/><path d="M-5,22 L5,22 L6,34 L-6,34Z" fill="#D8C9A8" ${L}/><path d="M-4,26 v7 M0,26 v8 M4,26 v7" stroke="#9C8462" stroke-width=".8"/></g>`;
    case 'trowel': return `<g transform="rotate(-10)"><rect x="-2" y="-4" width="4" height="14" rx="1.5" fill="#6B3E1F"/><path d="M0,10 L-8,18 L0,34 L8,18Z" fill="#AEB6BF" ${L}/></g>`;
    case 'saukele': return `<g transform="translate(0,4)"><path d="M-14,0 L14,0 L4,-78 L-4,-78Z" fill="#B8382C" ${L}/>
      <path d="M-12,-10 L12,-10 M-10,-26 L10,-26 M-8,-42 L8,-42 M-6,-58 L6,-58" stroke="#E7A93B" stroke-width="2"/>
      ${[-9, -3, 3, 9].map((x) => `<path d="M${x},0 V10" stroke="#C3CAD2" stroke-width="1"/><circle cx="${x}" cy="12" r="2" fill="#C0504A"/>`).join('')}
      <path d="M0,-78 C-6,-86 -4,-96 0,-100 C4,-96 6,-86 0,-78Z" fill="#FBFAF6" stroke="#9C958A" stroke-width=".7"/>
      <circle cy="-34" r="3" fill="#D8DEE6" stroke="#7C858F" stroke-width=".6"/><circle cy="-18" r="2.4" fill="#C0504A"/></g>`;
    case 'magnifier': return `<g transform="rotate(-25)"><rect x="-2" y="-2" width="4" height="16" rx="2" fill="#2E2E2E"/><circle cy="24" r="10" fill="#CFE9F5" fill-opacity=".5" stroke="#5E6670" stroke-width="3"/><path d="M-4,20 q3,-4 7,-3" stroke="#fff" stroke-width="1.5" fill="none"/></g>`;
    case 'hammer': return `<g transform="rotate(-15)"><rect x="-2" y="-4" width="4" height="34" rx="1.5" fill="#9C6A3A" ${L}/><path d="M-12,28 L10,28 L12,34 L-6,36 L-12,34Z" fill="#7C858F" ${L}/></g>`;
    case 'scroll': return `<g transform="translate(0,8) rotate(80)"><rect x="-14" y="-7" width="28" height="14" fill="#F2E3BE" ${L}/><rect x="-17" y="-9" width="5" height="18" rx="2.5" fill="#C9A06A" ${L}/><rect x="12" y="-9" width="5" height="18" rx="2.5" fill="#C9A06A" ${L}/></g>`;
    case 'net': return `<g transform="translate(0,6)"><path d="M-6,0 C-20,16 -18,40 -4,52 C10,40 14,16 6,0Z" fill="#C9B88E" fill-opacity=".85" ${L}/><path d="M-12,14 L8,26 M-14,30 L8,42 M6,10 L-12,32 M10,26 L-8,48" stroke="#8C7A54" stroke-width=".8"/><circle cx="-4" cy="54" r="3" fill="#C0504A"/></g>`;
    case 'whip': return `<g transform="rotate(-10)"><rect x="-2" y="-2" width="4" height="22" rx="1.5" fill="#6B3E1F"/><path d="M0,20 C6,36 -6,50 2,64" stroke="#5A3A1C" stroke-width="2" fill="none"/></g>`;
    case 'bowl': return `<path d="M-12,4 Q0,20 12,4Z" fill="#B87333" ${L}/><ellipse cy="4" rx="12" ry="3" fill="#F4E3C1" ${L}/>`;
    case 'dombra': return `<g transform="rotate(-70)"><path d="M-3,-80 L3,-80 L3,-20 L-3,-20Z" fill="#8C5A2B" ${L}/><path d="M0,-20 C-16,-16 -18,16 0,22 C18,16 16,-16 0,-20Z" fill="#B87333" ${L}/><circle cy="4" r="3.2" fill="#4A2A12"/><path d="M-1,-80 V16 M1,-80 V16" stroke="#F4E3C1" stroke-width=".6"/></g>`;
    case 'feather': return `<path d="M0,0 C-6,-12 -2,-30 4,-38 C6,-26 6,-12 0,0Z" fill="#7A5A2E" ${L}/>`;
    case 'torch': return `<rect x="-2" y="-30" width="4" height="40" fill="#6B3E1F"/><path d="M0,-50 C-8,-40 -6,-32 0,-30 C6,-32 8,-40 0,-50Z" fill="#F4A23B"/>`;
    default: return '';
  }
}

// ── сборка персонажа ──────────────────────────────────
function buildPerson(spec, id, reg) {
  const P = { ...PROF[spec.age || 'adult'] };
  if (spec.sex === 'f') P.sh *= 0.87;
  const G = {};
  const t = torsoSVG(spec, id, P, reg);
  const shF = [-P.sh * 0.72, -P.torso + 8], shB = [P.sh * 0.62, -P.torso + 8];
  const head = headSVG(spec, id, reg, G);
  const svg = `<defs>${patterns(id, spec)}</defs>
    <ellipse data-k="shadow" cx="4" cy="2" rx="${P.sh * 1.45}" ry="7" fill="#1E1630" opacity=".22"/>
    <g data-k="body"><g transform="translate(0,${-P.leg})">
      <g transform="translate(7,0)">${legSVG(spec, P, 2)}</g>
      <g transform="translate(-6,0)">${legSVG(spec, P, 1)}</g>
      <g data-k="torso">
        <g transform="translate(${shB[0]},${shB[1]})">${armSVG(spec, id, P, 2)}</g>
        ${t.back}
        ${t.hem ? `<g transform="translate(0,${t.waist})"><g data-k="hem">${t.hem}</g></g>` : ''}
        ${t.body}${t.front}
        <g transform="translate(3,${-P.torso})"><g data-k="head" transform="scale(${P.head})">${head}</g></g>
        <g transform="translate(${shF[0]},${shF[1]})">${armSVG(spec, id, P, 1)}</g>
      </g>
    </g></g>`;
  return { svg, P, G };
}

// ── эмоции и позы ─────────────────────────────────────
export const EMO = {
  neutral: { brow: 0, tilt: 0, smile: 0.18, lid: 0.1, blush: 0.2, head: 0 },
  kind: { brow: 0.16, tilt: -0.25, smile: 0.5, lid: 0.13, blush: 0.32, head: -1 },
  calm: { brow: 0.05, tilt: -0.1, smile: 0.32, lid: 0.14, blush: 0.25, head: 0 },
  happy: { brow: 0.35, tilt: -0.1, smile: 0.85, lid: 0.16, blush: 0.55, head: -2 },
  laugh: { brow: 0.55, tilt: -0.2, smile: 1, lid: 0.55, blush: 0.75, head: -6, open: 0.35 },
  surprised: { brow: 1, tilt: -0.2, smile: 0, lid: 0, blush: 0.3, head: -3, open: 0.3 },
  sad: { brow: 0.25, tilt: -0.9, smile: -0.6, lid: 0.35, blush: 0.15, head: 6 },
  worried: { brow: 0.45, tilt: -0.8, smile: -0.3, lid: 0.15, blush: 0.15, head: 2 },
  serious: { brow: -0.45, tilt: 0.7, smile: -0.1, lid: 0.25, blush: 0.15, head: 0 },
  angry: { brow: -0.6, tilt: 1, smile: -0.5, lid: 0.25, blush: 0.4, head: 2 },
  thinking: { brow: 0.35, tilt: 0.3, smile: 0, lid: 0.28, blush: 0.15, head: -4, look: [0.4, -1] },
  proud: { brow: 0.2, tilt: 0, smile: 0.7, lid: 0.3, blush: 0.35, head: -5 },
  confused: { brow: 0.3, tilt: -0.4, smile: -0.2, lid: 0.1, blush: 0.2, head: 7, asym: 1 },
  sleepy: { brow: -0.1, tilt: 0, smile: 0.05, lid: 0.6, blush: 0.2, head: 4 },
};

// углы рук: [плечо вперёд°, локоть°, кисть]; F — ближняя рука, B — дальняя
export const POSES = {
  rest: { F: [6, 12, 'open'], B: [5, 10, 'open'] },
  talk: { F: [20, 72, 'open'], B: [6, 14, 'open'] },
  talk2: { F: [36, 56, 'open'], B: [14, 38, 'open'] },
  explain: { F: [52, 36, 'open'], B: [10, 22, 'open'] },
  open: { F: [26, 60, 'open'], B: [26, 60, 'open'] },
  point: { F: [8, 16, 'open'], B: [84, 6, 'point'] },
  heart: { F: [22, 126, 'open'], B: [5, 10, 'open'] },
  wave: { F: [8, 14, 'open'], B: [150, 30, 'open'] },
  hold: { F: [26, 84, 'fist'], B: [8, 20, 'open'] },
  give: { F: [64, 16, 'fist'], B: [8, 16, 'open'] },
  present: { F: [100, 34, 'fist'], B: [12, 24, 'open'] },
  think: { F: [20, 146, 'fist'], B: [14, 64, 'open'] },
  shrug: { F: [12, 88, 'open'], B: [12, 88, 'open'] },
  cheer: { F: [196, 8, 'fist'], B: [152, 10, 'fist'] },
  staff: { F: [56, 2, 'fist'], B: [5, 10, 'open'] },
  reach: { F: [42, 6, 'open'], B: [18, 12, 'open'] },
  play: { F: [8, 30, 'open'], B: [80, 8, 'fist'] },
  binoc: { F: [62, 150, 'fist'], B: [58, 146, 'fist'] },
  perch: { F: [86, 62, 'fist'], B: [6, 12, 'open'] },
  hips: { F: [-16, 70, 'fist'], B: [-14, 66, 'fist'] },
  chin: { F: [14, 150, 'fist'], B: [30, 100, 'open'] },
};

const VIS = {
  'а': [0.9, 1.05, 0.1], 'ә': [0.75, 1.12, 0], 'я': [0.82, 1, 0.1],
  'о': [0.62, 0.78, 0.85], 'ө': [0.55, 0.72, 0.8], 'ё': [0.6, 0.76, 0.8],
  'у': [0.42, 0.62, 1], 'ұ': [0.42, 0.62, 1], 'ү': [0.36, 0.62, 0.92], 'ю': [0.42, 0.62, 1],
  'и': [0.34, 1.2, 0], 'і': [0.3, 1.15, 0], 'ы': [0.42, 1.05, 0.1], 'е': [0.52, 1.15, 0], 'э': [0.56, 1.1, 0],
  'м': [0, 0.95, 0.05], 'б': [0, 0.95, 0.1], 'п': [0, 0.95, 0.05], 'ф': [0.12, 1, 0], 'в': [0.12, 1, 0],
};
export function viseme(ch) {
  const c = (ch || ' ').toLowerCase();
  if (VIS[c]) return VIS[c];
  if (/[ .,!?:;—«»\-\n()]/.test(c)) return [0.03, 1, 0];
  return [0.22, 1, 0.2];
}
export const isVowel = (ch) => /[аәяоөёуұүюиіыеэ]/i.test(ch || '');

function mouthGeo(o, w, r, s) {
  const mx = 11, my = -19;
  const hw = 7.4 * w * (1 - 0.36 * r);
  const cy = my - s * 2.4 + o * 1.2;
  const up = my - 1.4 - o * 2.2;
  const lo = my + 1 + o * 9.5 + r * o * 1.4;
  const ih = hw * 0.8;
  return {
    lips: `M${f1(mx - hw - 1)},${f1(cy)} C${f1(mx - hw * 0.5)},${f1(up - 2.4)} ${f1(mx + hw * 0.5)},${f1(up - 2.4)} ${f1(mx + hw + 1)},${f1(cy)} C${f1(mx + hw * 0.6)},${f1(lo + 3)} ${f1(mx - hw * 0.6)},${f1(lo + 3)} ${f1(mx - hw - 1)},${f1(cy)}Z`,
    inner: `M${f1(mx - ih)},${f1(cy)} C${f1(mx - ih * 0.5)},${f1(up)} ${f1(mx + ih * 0.5)},${f1(up)} ${f1(mx + ih)},${f1(cy)} C${f1(mx + ih * 0.55)},${f1(lo)} ${f1(mx - ih * 0.55)},${f1(lo)} ${f1(mx - ih)},${f1(cy)}Z`,
    line: `M${f1(mx - hw - 0.4)},${f1(cy)} Q${mx},${f1(my + s * 2.6 + o * 2.4)} ${f1(mx + hw + 0.4)},${f1(cy)}`,
    teeth: [mx - ih, up - 1, ih * 2, 2.4 + o * 1.6],
    tongue: [mx, lo - 1.4, ih * 0.62, Math.max(0, o - 0.2) * 3.4],
  };
}

// ── живой персонаж ────────────────────────────────────
export class Person {
  constructor(spec, opt = {}) {
    this.spec = spec;
    this.id = 'r' + (++UID);
    this.chainDefs = [];
    const { svg, P, G } = buildPerson(spec, this.id, this.chainDefs);
    this.P = P; this.G = G;
    this.el = document.createElementNS(NS, 'g');
    this.el.setAttribute('class', 'rig');
    this.el.innerHTML = svg;
    this.k = {};
    this.el.querySelectorAll('[data-k]').forEach((e) => { this.k[e.getAttribute('data-k')] = e; });
    this.chains = this.chainDefs.map((d) => {
      const els = [...this.el.querySelectorAll(`[data-d="${d.name}"]`)];
      return { ...d, els, sp: els.map(() => new Spring(d.base, d.k, d.d)) };
    });
    this.x = opt.x || 0; this.y = opt.y || 0; this.face = opt.face || 1; this.s = opt.s || 1;
    this.ph = Math.random() * 10;
    const sp = (v, k, d) => new Spring(v, k, d);
    this.sp = {
      lean: sp(P.stoop || 0, 60, 12), bob: sp(0, 120, 16), head: sp(0, 90, 13), turn: sp(0, 70, 12),
      shF: sp(6, 70, 12), elF: sp(12, 80, 13), shB: sp(5, 70, 12), elB: sp(10, 80, 13),
      brow: sp(0, 160, 16), tilt: sp(0, 160, 16), smile: sp(0.18, 90, 14), lid: sp(0.18, 220, 22), blush: sp(0.2, 30, 10),
      mo: sp(0, 420, 30), mw: sp(1, 300, 26), mr: sp(0, 300, 26), ix: sp(0, 260, 24), iy: sp(0, 260, 24),
      thF: sp(0, 160, 18), knF: sp(0, 160, 18), thB: sp(0, 160, 18), knB: sp(0, 160, 18), crouch: sp(0, 70, 13),
    };
    this.mood = EMO[spec.mood] ? spec.mood : 'calm';
    this.emoName = this.mood; this.emoT = 0;
    this.poseName = opt.pose || spec.pose || 'rest';
    this.pointAt = null;
    this.gaze = null; this.sacc = [0, 0]; this.saccT = 0;
    this.blinkT = rnd(1, 4); this.blinkK = 0;
    this.talking = false; this.vis = [0, 1, 0];
    this.gest = [];
    this.walk = null; this.phase = 0;
    this.items = { 1: null, 2: null };
    this.talkPoseT = 0; this.talkPose = null;
    this.itemUpright = { 1: false, 2: false };
    if (spec.hold) this.hold(spec.hold, 1);
    if (spec.hold2) this.hold(spec.hold2, 2);
    this.listenT = rnd(2, 5);
    this.apply();
  }

  mount(parent) { parent.appendChild(this.el); return this; }
  set(x, y, face = this.face, s = this.s) { this.x = x; this.y = y; this.face = face; this.s = s; this.apply(); return this; }

  // точки в мировых координатах сцены
  headPos() {
    const P = this.P;
    return { x: this.x + this.face * this.s * 8, y: this.y - this.s * (P.leg + P.torso + 46 * P.head) + this.s * this.sp.crouch.v * P.leg * 0.3 };
  }
  handPos() {
    const P = this.P;
    const a = (-this.sp.shF.v) * Math.PI / 180, b = a + (-this.sp.elF.v) * Math.PI / 180;
    const lx = -P.sh * 0.72 - Math.sin(a) * P.up - Math.sin(b) * P.lo;
    const ly = -P.leg - P.torso + 8 + Math.cos(a) * P.up + Math.cos(b) * P.lo;
    return { x: this.x + this.face * this.s * lx, y: this.y + this.s * ly };
  }

  emote(name, dur = 0) { this.emoName = EMO[name] ? name : this.mood; this.emoT = dur; return this; }
  setMood(name) { this.mood = EMO[name] ? name : 'neutral'; if (this.emoT <= 0) this.emoName = this.mood; return this; }
  pose(name, opt = {}) { this.poseName = POSES[name] ? name : 'rest'; this.pointAt = opt.at || null; this.talkPose = null; return this; }
  look(target) { this.gaze = target; return this; }
  gesture(name, dur) { this.gest.push({ name, t: 0, dur: dur || { nod: 0.55, nod2: 1, shake: 0.9, bow: 1.4, beat: 0.4, jump: 0.55, laugh: 1.2, flinch: 0.4, stomp: 0.5 }[name] || 0.6 }); return this; }
  talk(on) { this.talking = on; if (!on) this.vis = [0, 1, 0]; return this; }
  setViseme(v) { this.vis = v; }
  hold(kind, n = 1, html) {
    const g = this.k['item' + n];
    if (!g) return this;
    this.items[n] = kind;
    g.innerHTML = kind ? (html || itemSVG(kind)) : '';
    this.itemUpright[n] = ['staff', 'crook', 'cane', 'saukele', 'torch'].includes(kind);
    return this;
  }
  crouch(on) { this.sp.crouch.t = on ? 1 : 0; return this; }
  walkTo(x, speed = 120) {
    return new Promise((res) => {
      if (Math.abs(x - this.x) < 2) { res(); return; }
      this.face = x > this.x ? 1 : -1;
      this.walk = { x, speed, res };
    });
  }

  update(dt, t, wind = 0) {
    dt = clamp(dt || 0, 0, 0.1);
    const sp = this.sp, P = this.P;
    const E = EMO[this.emoName] || EMO.neutral;
    if (this.emoT > 0) { this.emoT -= dt; if (this.emoT <= 0) this.emoName = this.mood; }

    // ходьба
    let walking = false;
    if (this.walk) {
      const w = this.walk, d = w.x - this.x, step = w.speed * dt;
      if (Math.abs(d) <= step) { this.x = w.x; this.walk = null; w.res(); }
      else { this.x += Math.sign(d) * step; walking = true; this.phase += step / (P.leg * 0.85) * Math.PI; }
    }

    // позы рук
    let pose = POSES[this.poseName] || POSES.rest;
    if (this.talking && ['rest', 'staff', 'hold'].includes(this.poseName) === false && this.poseName !== 'play') { /* поза задана явно */ }
    if (this.talking && (this.poseName === 'rest' || this.poseName === 'staff' || this.poseName === 'hold')) {
      this.talkPoseT -= dt;
      if (this.talkPoseT <= 0 || !this.talkPose) { this.talkPose = ['talk', 'talk2', 'explain', 'open', 'talk'][Math.floor(Math.random() * 5)]; this.talkPoseT = rnd(1.2, 2.6); }
      const tp = POSES[this.talkPose];
      pose = this.poseName === 'rest' ? tp : { F: pose.F, B: tp.F };
    }
    let [fS, fE, fH] = pose.F, [bS, bE, bH] = pose.B;
    if (this.poseName === 'point' && this.pointAt) {
      const hx = this.x + this.face * this.s * (P.sh * 0.62), hy = this.y - this.s * (P.leg + P.torso - 8);
      const dx = (this.pointAt.x - hx) * this.face, dy = this.pointAt.y - hy;
      bS = clamp(Math.atan2(dx, dy) * 180 / Math.PI, 20, 150); bE = 4;
    }
    if (walking && this.poseName === 'rest') { fS += Math.sin(this.phase + Math.PI) * 16; bS += Math.sin(this.phase) * 16; }
    if (this.poseName === 'wave') bE += Math.sin(t * 9) * 22;
    if (this.poseName === 'play') { fE += Math.sin(t * 14) * 9; fS += Math.sin(t * 7) * 2; }
    sp.shF.t = fS; sp.elF.t = fE; sp.shB.t = bS; sp.elB.t = bE;
    this.handShape(1, fH); this.handShape(2, bH);

    // ноги
    if (walking) {
      sp.thF.t = Math.sin(this.phase) * 24; sp.knF.t = Math.max(0, Math.sin(this.phase + 1.2)) * 34;
      sp.thB.t = Math.sin(this.phase + Math.PI) * 24; sp.knB.t = Math.max(0, Math.sin(this.phase + Math.PI + 1.2)) * 34;
    } else if (sp.crouch.t > 0.5) {
      sp.thF.t = 64; sp.knF.t = 104; sp.thB.t = 18; sp.knB.t = 96;
    } else { sp.thF.t = 0; sp.knF.t = 0; sp.thB.t = 0; sp.knB.t = 0; }

    // эмоции, корпус, голова
    sp.brow.t = E.brow; sp.tilt.t = E.tilt; sp.smile.t = E.smile; sp.blush.t = E.blush;
    let lean = (P.stoop || 0) + Math.sin(t * 0.5 + this.ph) * 0.7;
    let bob = Math.sin(t * 1.7 + this.ph) * 0.7;
    let head = E.head + Math.sin(t * 0.7 + this.ph) * 1.2;
    let turn = 0;
    if (walking) bob += -Math.abs(Math.cos(this.phase)) * 3;
    if (sp.crouch.t > 0.5) { lean += 16; head += 6; }
    if (this.talking) { head += this.vis[0] * 2.2 - 0.6; bob += this.vis[0] * 0.6; }

    // жесты поверх позы
    for (const g of this.gest) {
      g.t += dt;
      const k = clamp(g.t / g.dur, 0, 1), bell = Math.sin(k * Math.PI);
      if (g.name === 'nod') head += bell * 9;
      if (g.name === 'nod2') head += Math.sin(k * Math.PI * 2) * 7 * (1 - k * 0.3);
      if (g.name === 'shake') { turn += Math.sin(k * Math.PI * 4) * 0.9 * (1 - k); head += Math.sin(k * Math.PI * 4) * 2; }
      if (g.name === 'bow') { lean += bell * 18; head += bell * 12; }
      if (g.name === 'beat') { sp.shF.t += bell * 14; }
      if (g.name === 'jump') bob -= bell * 22;
      if (g.name === 'laugh') { head -= bell * 6; bob += Math.sin(g.t * 26) * 1.6 * bell; }
      if (g.name === 'flinch') { lean -= bell * 8; head -= bell * 6; }
      if (g.name === 'stomp') bob += Math.abs(Math.sin(k * Math.PI * 3)) * 2;
    }
    this.gest = this.gest.filter((g) => g.t < g.dur);
    sp.lean.t = lean; sp.bob.t = bob; sp.head.t = head; sp.turn.t = turn;

    // взгляд
    this.saccT -= dt;
    if (this.saccT <= 0) { this.sacc = [rnd(-0.35, 0.35), rnd(-0.25, 0.25)]; this.saccT = rnd(0.4, 2.2); }
    let ix = this.sacc[0], iy = this.sacc[1];
    const tg = this.gaze && (this.gaze.headPos ? this.gaze.headPos() : this.gaze);
    if (tg) {
      const hp = this.headPos();
      const dx = (tg.x - hp.x) * this.face, dy = tg.y - hp.y;
      ix += clamp(dx / 110, -1.2, 1.2) * 1.9; iy += clamp(dy / 140, -1, 1) * 1.6;
      sp.head.t += clamp(dy / 26, -6, 9);
    } else if (E.look) { ix += E.look[0] * 2; iy += E.look[1] * 2; }
    sp.ix.t = clamp(ix, -2.4, 2.6); sp.iy.t = clamp(iy, -2, 2);

    // моргание
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blinkK = 0.16; this.blinkT = Math.random() < 0.15 ? 0.25 : rnd(2, 5); }
    let lid = E.lid;
    if (this.blinkK > 0) { this.blinkK -= dt; lid = 1; }
    if (iy > 1) lid += 0.12;
    sp.lid.t = clamp(lid, 0, 1);

    // губы
    if (this.talking) { sp.mo.t = this.vis[0]; sp.mw.t = this.vis[1]; sp.mr.t = this.vis[2]; }
    else { sp.mo.t = E.open || 0; sp.mw.t = 1; sp.mr.t = 0; }

    for (const key in sp) sp[key].step(dt);
    this.wind = wind;
    this.t = t;
    this.walking = walking;
    this.apply();
  }

  handShape(n, shape) {
    const want = shape || 'open';
    if (this['hs' + n] === want) return;
    this['hs' + n] = want;
    const show = (k, on) => { const e = this.k[k + n]; if (e) e.style.display = on ? '' : 'none'; };
    const hasItem = !!this.items[n];
    show('hOpen', want === 'open' && !hasItem); show('hFist', want === 'fist' || (hasItem && want !== 'point')); show('hPoint', want === 'point' && !hasItem);
  }

  apply() {
    const k = this.k, sp = this.sp, P = this.P, G = this.G;
    const T = (e, v) => e && e.setAttribute('transform', v);
    T(this.el, `translate(${f1(this.x)},${f1(this.y)}) scale(${f1(this.face * this.s * 100) / 100},${this.s})`);
    const cr = sp.crouch.v;
    T(k.body, `translate(0,${f1(sp.bob.v + cr * P.leg * 0.3)})`);
    T(k.torso, `rotate(${f1(sp.lean.v)})`);
    T(k.head, `scale(${P.head}) rotate(${f1(sp.head.v)})`);
    T(k.arm1, `rotate(${f1(-sp.shF.v)})`); T(k.elbow1, `rotate(${f1(-sp.elF.v)})`);
    T(k.arm2, `rotate(${f1(-sp.shB.v)})`); T(k.elbow2, `rotate(${f1(-sp.elB.v)})`);
    T(k.thigh1, `rotate(${f1(-sp.thF.v)})`); T(k.knee1, `rotate(${f1(sp.knF.v)})`);
    T(k.thigh2, `rotate(${f1(-sp.thB.v)})`); T(k.knee2, `rotate(${f1(sp.knB.v)})`);
    if (k.shadow) k.shadow.setAttribute('rx', f1(P.sh * 1.45 * (1 - Math.min(0.5, Math.abs(sp.bob.v) / 60))));
    // предметы держим вертикально
    for (const n of [1, 2]) {
      if (this.itemUpright[n]) {
        const a = (n === 1 ? sp.shF.v + sp.elF.v : sp.shB.v + sp.elB.v) - sp.lean.v;
        T(k['item' + n], `rotate(${f1(a)})`);
      } else T(k['item' + n], '');
    }
    const wl = (this.wind || 0) * this.face;
    if (k.hem) T(k.hem, `skewX(${f1(wl * 7 + (this.walking ? Math.sin(this.phase) * 4 : 0) + Math.sin((this.t || 0) * 2.3 + this.ph) * Math.abs(wl) * 2)})`);
    T(k.feat, `translate(${f1(sp.turn.v * 3.5)},0)`);
    T(k.ear, `translate(${f1(-sp.turn.v * 1.5)},0)`);
    // глаза
    const lid = clamp(sp.lid.v, 0, 1), happy = clamp(sp.smile.v - 0.6, 0, 1) * 0.6;
    for (const n of [1, 2]) {
      const [cx, cy, rx, ry] = n === 1 ? G.e1 : G.e2;
      T(k['iris' + n], `translate(${f1(sp.ix.v * (n === 1 ? 1 : 0.75))},${f1(sp.iy.v)})`);
      const ly = cy - ry + lid * ry * 2;
      if (k['lid' + n]) k['lid' + n].setAttribute('height', f1(Math.max(0.5, lid * ry * 2 + 1)));
      const lo = happy * ry * 0.7;
      if (k['llid' + n]) { k['llid' + n].setAttribute('y', f1(cy + ry - lo)); k['llid' + n].setAttribute('height', f1(lo + 1)); }
      if (k['lash' + n]) {
        const curve = (1 - lid) * 2.4;
        let d = `M${f1(cx - rx - 0.6)},${f1(ly + 0.6)} Q${cx},${f1(ly - curve)} ${f1(cx + rx + 0.7)},${f1(ly - 0.2)}`;
        if (G.fem && n === 1) d += ` l2,-1.8 M${f1(cx + rx - 1.4)},${f1(ly - curve * 0.6)} l1.4,-2`;
        k['lash' + n].setAttribute('d', d);
      }
    }
    // брови
    const br = sp.brow.v * 3.4, tl = sp.tilt.v * 13;
    T(k.brow1, `translate(1,${f1(-55 - br + (lid > 0.8 ? 1 : 0))}) rotate(${f1(tl)})`);
    T(k.brow2, `translate(21,${f1(-54.5 - br - (this.emoName === 'confused' ? 2 : 0))}) rotate(${f1(-tl)})`);
    const bl = clamp(sp.blush.v, 0, 1) * 0.55;
    if (k.blush1) { k.blush1.setAttribute('opacity', f1(bl * 100) / 100); k.blush2.setAttribute('opacity', f1(bl * 100) / 100); }
    // рот
    const m = mouthGeo(clamp(sp.mo.v, 0, 1.1), clamp(sp.mw.v, 0.5, 1.3), clamp(sp.mr.v, 0, 1), clamp(sp.smile.v, -1, 1));
    const op = sp.mo.v > 0.05;
    k.lips.setAttribute('d', m.lips);
    k.inner.setAttribute('d', op ? m.inner : 'M0,0');
    k.mclip.setAttribute('d', op ? m.inner : 'M0,0');
    k.mline.setAttribute('d', m.line);
    k.mline.setAttribute('opacity', op ? 0.35 : 1);
    k.teeth.setAttribute('x', f1(m.teeth[0])); k.teeth.setAttribute('y', f1(m.teeth[1])); k.teeth.setAttribute('width', f1(m.teeth[2])); k.teeth.setAttribute('height', f1(m.teeth[3]));
    k.tongue.setAttribute('cx', f1(m.tongue[0])); k.tongue.setAttribute('cy', f1(m.tongue[1])); k.tongue.setAttribute('rx', f1(m.tongue[2])); k.tongue.setAttribute('ry', f1(m.tongue[3]));
    if (k.beard) T(k.beard, `translate(0,${f1(sp.mo.v * 3)})`);
    // кисточки, косы, перья, ленты
    const tt = this.t || 0, dt = 1 / 60;
    for (const c of this.chains) {
      for (let i = 0; i < c.els.length; i++) {
        const s2 = c.sp[i];
        const sway = Math.sin(tt * (2.2 + i * 0.6) + this.ph + i) * (2 + Math.abs(wl) * 6);
        s2.t = (i === 0 ? c.base : 0) - wl * c.amp * (0.6 + i * 0.25) + sway - (this.walking ? Math.sin(this.phase) * 6 : 0) + sp.head.vel * 0.02;
        s2.step(dt);
        c.els[i].setAttribute('transform', `rotate(${f1(s2.v)})`);
      }
    }
  }
}
