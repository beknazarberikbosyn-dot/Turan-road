// Природно-историческая карта казахских земель: моря, озёра, реки, горы, пустыни.
// Никаких политических границ — только ландшафт. Координаты — примерные (широта, долгота).

export const W = 1152, H = 680;
export const VB = { x: -90, y: -80, w: W + 180, h: H + 160 };

// Простая равнопромежуточная проекция с поправкой на широту ~48°.
export function P(lat, lon) {
  return [(lon - 45) * 26.8, (56 - lat) * 40];
}

// ── генератор псевдослучайных чисел (чтобы карта всегда рисовалась одинаково)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => n.toFixed(1);

// Сглаживание ломаной в кривую Безье (Catmull–Rom)
export function smooth(pts, closed = false) {
  const n = pts.length;
  if (n < 2) return '';
  const g = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
const geoPath = (ll, closed) => smooth(ll.map(([a, b]) => P(a, b)), closed);

// ── вода ──────────────────────────────────────────────
const CASPIAN = [[47.1,51.9],[46.95,51.2],[46.8,50.2],[46.6,49.3],[46.2,48.6],[45.8,47.9],[45.0,47.2],[44.3,47.0],[43.6,47.5],[42.9,47.6],[42.0,48.3],[41.3,49.1],[40.6,49.9],[40.2,50.3],[39.6,49.4],[38.6,49.0],[38.2,50.8],[38.2,53.0],[39.4,53.4],[40.0,52.9],[40.6,52.9],[41.2,52.8],[41.5,53.2],[41.8,52.6],[42.4,52.6],[43.0,52.1],[43.6,51.2],[44.0,50.6],[44.5,50.2],[44.6,50.9],[45.0,51.2],[45.4,51.0],[45.5,52.4],[45.3,53.0],[45.9,53.1],[46.4,53.2],[46.8,52.7]];
const ARAL_1960 = [[46.85,61.3],[46.65,61.95],[46.05,61.85],[45.5,61.1],[44.6,60.7],[44.0,60.1],[43.45,59.4],[43.55,58.6],[44.3,58.2],[45.0,58.2],[45.6,58.45],[46.0,59.2],[46.35,59.9],[46.55,60.6]];
const ARAL_SMALL = [[46.78,61.55],[46.6,61.9],[46.25,61.7],[46.05,61.15],[46.15,60.6],[46.45,60.35],[46.62,60.85]];
const ARAL_WEST = [[45.65,58.62],[45.35,58.95],[44.8,58.85],[44.3,58.65],[44.35,58.32],[45.0,58.36]];
const BALKHASH = [[46.0,73.4],[46.45,74.0],[46.85,74.9],[46.62,75.4],[46.72,76.5],[46.82,77.7],[46.88,78.6],[46.72,79.25],[46.45,79.0],[46.35,77.8],[46.15,76.5],[46.25,75.45],[45.98,74.95],[45.62,74.4],[45.75,73.8]];
const ZAYSAN = [[48.15,83.4],[48.22,84.1],[48.1,84.9],[47.85,84.9],[47.8,84.1],[47.95,83.5]];
const ALAKOL = [[46.4,81.5],[46.3,82.0],[45.95,82.0],[45.85,81.6],[46.1,81.4]];
const TENGIZ = [[50.55,68.7],[50.55,69.3],[50.25,69.3],[50.2,68.8]];
const ISSYKKUL = [[42.78,76.2],[42.68,77.5],[42.5,78.3],[42.22,78.05],[42.15,76.9],[42.42,76.2]];
const KAPSHAGAY = [[43.95,77.05],[43.98,77.6],[43.82,77.75],[43.86,77.2]];

const RIVERS = [
  { name: 'Сырдария', pts: [[40.9,70.6],[41.15,69.0],[41.3,68.1],[42.2,68.0],[42.9,68.2],[43.6,67.6],[44.2,66.6],[44.85,65.5],[45.5,64.1],[45.8,62.1],[46.1,61.25]], w: 3 },
  { name: 'Әмудария', pts: [[38.8,64.2],[40.0,62.8],[41.2,61.2],[42.3,60.0],[43.4,59.2]], w: 3 },
  { name: 'Іле', pts: [[43.95,81.4],[43.85,80.3],[43.85,79.4],[43.9,78.2],[43.9,77.6],[44.3,76.6],[44.9,75.6],[45.45,74.6]], w: 2.6 },
  { name: 'Шарын', pts: [[43.0,79.6],[43.4,79.25],[43.85,79.35]], w: 1.4 },
  { name: 'Қаратал', pts: [[44.9,78.9],[45.4,78.2],[45.95,77.8],[46.3,77.9]], w: 1.4 },
  { name: 'Ертіс', pts: [[47.4,87.2],[47.8,85.6],[48.0,84.95],[48.15,83.35],[49.0,82.8],[49.95,82.6],[50.4,80.25],[51.0,79.0],[52.3,76.95],[53.3,75.5],[54.5,74.0],[56.0,73.6]], w: 3 },
  { name: 'Есіл', pts: [[50.3,73.6],[51.15,71.5],[51.1,70.0],[51.8,68.4],[52.6,68.9],[53.6,69.6],[54.85,69.2],[56.0,69.6]], w: 2.2 },
  { name: 'Жайық', pts: [[51.2,58.6],[51.6,56.6],[51.75,55.1],[51.25,52.5],[51.2,51.4],[50.2,51.6],[49.0,51.8],[48.0,51.8],[47.1,51.9]], w: 2.6 },
  { name: 'Тобыл', pts: [[50.6,61.6],[52.0,62.6],[53.2,63.6],[54.5,64.6],[56.0,65.4]], w: 2 },
  { name: 'Шу', pts: [[42.8,75.6],[43.4,74.4],[44.2,72.9],[44.8,71.2],[45.25,69.4]], w: 1.8 },
  { name: 'Талас', pts: [[42.5,72.2],[42.9,71.4],[43.5,70.6],[44.0,70.1]], w: 1.5 },
  { name: 'Сарысу', pts: [[48.9,70.8],[47.9,69.3],[47.0,68.0],[46.0,67.4]], w: 1.3 },
  { name: 'Торғай', pts: [[50.0,64.7],[49.2,64.0],[48.6,63.0],[48.4,62.2]], w: 1.3 },
  { name: 'Еділ', pts: [[48.9,44.6],[47.6,46.3],[46.35,48.0],[46.0,48.5]], w: 3 },
];

const MOUNTAINS = [
  { line: [[41.6,69.8],[41.9,71.0],[41.9,72.6],[41.6,74.5],[41.9,76.5],[42.1,78.5],[42.2,80.2],[42.4,82.0],[43.0,84.5],[43.3,86.5]], n: 44, s: 15, snow: true },
  { line: [[39.5,68.0],[39.4,70.5],[39.3,73.5]], n: 14, s: 16, snow: true },
  { line: [[43.05,75.6],[43.1,76.8],[43.05,77.8],[43.0,78.8]], n: 16, s: 13, snow: true },
  { line: [[42.6,72.4],[42.7,74.0],[42.7,75.5]], n: 10, s: 12, snow: true },
  { line: [[42.1,69.9],[42.4,70.6],[42.4,71.6]], n: 6, s: 10, snow: true },
  { line: [[43.25,79.4],[43.3,80.6]], n: 6, s: 10, snow: false },
  { line: [[44.6,78.4],[44.9,79.6],[45.2,80.6],[45.35,81.3]], n: 14, s: 12, snow: true },
  { line: [[47.15,80.8],[47.25,82.4],[47.25,84.0]], n: 10, s: 9, snow: false },
  { line: [[47.0,84.5],[47.15,86.0]], n: 6, s: 10, snow: true },
  { line: [[48.9,83.4],[49.4,84.6],[49.8,85.6],[49.85,86.6],[50.1,87.6]], n: 18, s: 14, snow: true },
  { line: [[48.6,85.8],[49.2,87.2],[49.6,88.4]], n: 8, s: 12, snow: true },
  { line: [[42.6,70.5],[43.2,69.6],[43.8,68.8],[44.3,68.1]], n: 12, s: 8, snow: false },
  { line: [[48.35,66.8],[48.75,67.05],[49.05,67.3]], n: 6, s: 7, snow: false },
  { line: [[47.9,58.6],[48.7,58.8],[49.6,59.0]], n: 8, s: 6, snow: false },
  { line: [[44.15,51.6],[44.3,52.3],[44.4,52.9]], n: 5, s: 5, snow: false },
];

// Мелкосопочник Сарыарки (холмы)
const HILL_AREAS = [
  { lat: [47.2, 50.6], lon: [70.5, 78.5], n: 70, s: 6 },
  { lat: [52.7, 53.3], lon: [69.6, 70.9], n: 12, s: 6 },
  { lat: [49.6, 50.6], lon: [79.0, 81.6], n: 18, s: 6 },
];

const DESERTS = [
  { c: [42.5, 64.5], rx: 3.2, ry: 1.5, kind: 'sand', name: 'Қызылқұм' },
  { c: [44.35, 71.4], rx: 2.6, ry: 0.75, kind: 'sand', name: 'Мойынқұм' },
  { c: [46.05, 70.2], rx: 3.0, ry: 0.9, kind: 'clay', name: 'Бетпақдала' },
  { c: [45.3, 76.6], rx: 1.6, ry: 0.55, kind: 'sand', name: '' },
  { c: [46.6, 62.6], rx: 1.2, ry: 0.55, kind: 'sand', name: '' },
  { c: [43.9, 56.6], rx: 2.3, ry: 1.5, kind: 'plateau', name: 'Үстірт' },
  { c: [47.45, 49.6], rx: 1.6, ry: 0.6, kind: 'sand', name: 'Нарын құмы' },
  { c: [47.2, 60.0], rx: 0.8, ry: 0.45, kind: 'sand', name: '' },
  { c: [39.7, 60.5], rx: 3.4, ry: 1.0, kind: 'sand', name: 'Қарақұм' },
  { c: [45.1, 60.0], rx: 1.1, ry: 1.0, kind: 'salt', name: 'Аралқұм' },
];

// Хвойные леса и рощи
const FORESTS = [
  { lat: [52.85, 53.25], lon: [69.9, 70.8], n: 40, tone: 'pine' },
  { lat: [49.0, 50.2], lon: [84.0, 87.4], n: 60, tone: 'larch' },
  { lat: [50.6, 51.2], lon: [79.8, 81.2], n: 16, tone: 'pine' },
  { lat: [43.0, 43.25], lon: [76.0, 78.6], n: 22, tone: 'larch' },
  { lat: [44.7, 45.2], lon: [78.6, 80.8], n: 14, tone: 'larch' },
  { lat: [54.3, 55.8], lon: [62.0, 74.0], n: 80, tone: 'birch' },
];

const LABELS = [
  // вода
  { t: 'Каспий теңізі', ll: [44.1, 50.2], cls: 'lbl-water lbl-big', rot: -72 },
  { t: 'Кіші Арал', ll: [46.15, 59.55], cls: 'lbl-water lbl-small' },
  { t: 'Арал 1960 ж.', ll: [44.0, 59.6], cls: 'lbl-water lbl-faint', rot: -55 },
  { t: 'Балқаш', ll: [47.25, 77.0], cls: 'lbl-water', rot: -3 },
  { t: 'Зайсан', ll: [48.6, 84.0], cls: 'lbl-water lbl-small' },
  { t: 'Алакөл', ll: [46.15, 83.35], cls: 'lbl-water lbl-small' },
  { t: 'Теңіз', ll: [50.05, 69.0], cls: 'lbl-water lbl-small' },
  // реки
  { t: 'Сырдария', ll: [44.75, 66.3], cls: 'lbl-river', rot: 35 },
  { t: 'Іле', ll: [44.7, 76.0], cls: 'lbl-river', rot: 40 },
  { t: 'Ертіс', ll: [51.75, 77.6], cls: 'lbl-river', rot: -38 },
  { t: 'Есіл', ll: [51.4, 69.2], cls: 'lbl-river', rot: 0 },
  { t: 'Жайық', ll: [49.6, 52.3], cls: 'lbl-river', rot: 88 },
  { t: 'Тобыл', ll: [53.8, 63.4], cls: 'lbl-river', rot: 45 },
  { t: 'Шу', ll: [43.75, 74.0], cls: 'lbl-river', rot: 35 },
  { t: 'Еділ', ll: [47.6, 46.6], cls: 'lbl-river', rot: 50 },
  // горы
  { t: 'Алтай', ll: [50.55, 85.0], cls: 'lbl-mount' },
  { t: 'Тянь-Шань', ll: [41.25, 74.6], cls: 'lbl-mount' },
  { t: 'Жетісу Алатауы', ll: [45.75, 80.2], cls: 'lbl-mount lbl-small', rot: -12 },
  { t: 'Тарбағатай', ll: [46.75, 82.6], cls: 'lbl-mount lbl-small' },
  { t: 'Қаратау', ll: [43.75, 70.0], cls: 'lbl-mount lbl-small', rot: -42 },
  { t: 'Мұғалжар', ll: [48.9, 59.6], cls: 'lbl-mount lbl-small', rot: -82 },
  // пустыни и степи
  { t: 'Сарыарқа', ll: [49.95, 74.4], cls: 'lbl-region' },
  { t: 'Қызылқұм', ll: [42.2, 64.3], cls: 'lbl-desert' },
  { t: 'Мойынқұм', ll: [44.85, 72.0], cls: 'lbl-desert lbl-small', rot: -8 },
  { t: 'Бетпақдала', ll: [46.45, 70.0], cls: 'lbl-desert lbl-small' },
  { t: 'Үстірт', ll: [44.3, 56.4], cls: 'lbl-desert' },
  { t: 'Каспий ойпаты', ll: [48.4, 49.4], cls: 'lbl-region lbl-small' },
  { t: 'Торғай даласы', ll: [50.7, 64.3], cls: 'lbl-region lbl-small' },
];

// ── вспомогательные построители ───────────────────────
function blob(c, rx, ry, rand, n = 14, jitter = 0.18) {
  const [cx, cy] = P(c[0], c[1]);
  const RX = rx * 26.8, RY = ry * 40;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - jitter + rand() * jitter * 2;
    pts.push([cx + Math.cos(a) * RX * k, cy + Math.sin(a) * RY * k]);
  }
  return smooth(pts, true);
}

function sampleLine(ll, n, rand, spread) {
  const xy = ll.map(([a, b]) => P(a, b));
  const segs = [];
  let total = 0;
  for (let i = 0; i < xy.length - 1; i++) {
    const L = Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]);
    segs.push(L); total += L;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (k + rand() * 0.8) / n * total, i = 0;
    while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const t = Math.min(1, d / segs[i]);
    const x = xy[i][0] + (xy[i + 1][0] - xy[i][0]) * t;
    const y = xy[i][1] + (xy[i + 1][1] - xy[i][1]) * t;
    out.push([x + (rand() - 0.5) * spread, y + (rand() - 0.5) * spread * 0.7]);
  }
  return out;
}

function landBlob() {
  // мягкий «войлочный» край земли
  const rand = rng(7);
  const pts = [];
  const step = 46;
  const x0 = -18, y0 = -14, x1 = W + 18, y1 = H + 14;
  const push = (x, y, nx, ny) => {
    const o = (rand() - 0.35) * 26;
    pts.push([x + nx * o, y + ny * o]);
  };
  for (let x = x0; x < x1; x += step) push(x, y0, 0, -1);
  for (let y = y0; y < y1; y += step) push(x1, y, 1, 0);
  for (let x = x1; x > x0; x -= step) push(x, y1, 0, 1);
  for (let y = y1; y > y0; y -= step) push(x0, y, -1, 0);
  return { d: smooth(pts, true), pts };
}

// ── сборка SVG карты ───────────────────────────────────
export function buildMapSVG() {
  const rand = rng(42);
  const land = landBlob();
  let o = '';

  o += `<defs>
    <radialGradient id="cloudSea" cx="50%" cy="45%" r="75%">
      <stop offset="0" stop-color="#B9ACDA"/><stop offset=".65" stop-color="#9C8CC6"/><stop offset="1" stop-color="#7D6AA8"/>
    </radialGradient>
    <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7FB463"/><stop offset=".22" stop-color="#9DBE6B"/>
      <stop offset=".45" stop-color="#C6C177"/><stop offset=".66" stop-color="#DCC183"/><stop offset="1" stop-color="#E4C48D"/>
    </linearGradient>
    <radialGradient id="puff"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="meadow"><stop offset="0" stop-color="#6FA454" stop-opacity=".55"/><stop offset="1" stop-color="#6FA454" stop-opacity="0"/></radialGradient>
    <radialGradient id="ochre"><stop offset="0" stop-color="#D9A866" stop-opacity=".5"/><stop offset="1" stop-color="#D9A866" stop-opacity="0"/></radialGradient>
    <pattern id="pSand" width="16" height="11" patternUnits="userSpaceOnUse">
      <rect width="16" height="11" fill="#EBCB8C"/><path d="M1,8 Q4.5,4 8,8 M9,3.5 Q12,0.5 15,3.5" stroke="#D2AA66" stroke-width="1.1" fill="none"/>
    </pattern>
    <pattern id="pClay" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#DCC6A0"/><circle cx="3" cy="3" r="1" fill="#C4A77E"/><circle cx="8" cy="7.5" r=".8" fill="#C4A77E"/>
    </pattern>
    <pattern id="pPlateau" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect width="12" height="12" fill="#DECBA6"/><path d="M0,6 H12" stroke="#C9B088" stroke-width="1"/>
    </pattern>
    <pattern id="pSalt" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#EEE6D3"/><circle cx="2.5" cy="2.5" r="1" fill="#fff"/><circle cx="7" cy="6.5" r="1.2" fill="#fff"/>
    </pattern>
    <pattern id="pWave" width="22" height="12" patternUnits="userSpaceOnUse">
      <rect width="22" height="12" fill="#4FAFD0"/><path d="M2,7 q3,-3 6,0 q3,3 6,0" stroke="#7FCBE4" stroke-width="1.1" fill="none" opacity=".8"/>
    </pattern>
    <clipPath id="landClip"><path d="${land.d}"/></clipPath>
  </defs>`;

  // небо-облака вокруг земли
  o += `<rect x="${VB.x - 600}" y="${VB.y - 600}" width="${VB.w + 1200}" height="${VB.h + 1200}" fill="url(#cloudSea)"/>`;
  // тень земли
  o += `<path d="${land.d}" fill="#4A3A78" opacity=".35" transform="translate(6,14)"/>`;

  o += `<g clip-path="url(#landClip)">`;
  o += `<rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="url(#landGrad)"/>`;

  // пятна лугов и охры
  for (let i = 0; i < 26; i++) {
    const lat = 47 + rand() * 9, lon = 46 + rand() * 42;
    const [x, y] = P(lat, lon);
    o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(40 + rand() * 70)}" ry="${f(20 + rand() * 30)}" fill="url(#meadow)"/>`;
  }
  for (let i = 0; i < 18; i++) {
    const lat = 39 + rand() * 7, lon = 46 + rand() * 42;
    const [x, y] = P(lat, lon);
    o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(50 + rand() * 70)}" ry="${f(20 + rand() * 30)}" fill="url(#ochre)"/>`;
  }

  // пустыни и плато
  const dr = rng(11);
  for (const d of DESERTS) {
    const fill = { sand: 'url(#pSand)', clay: 'url(#pClay)', plateau: 'url(#pPlateau)', salt: 'url(#pSalt)' }[d.kind];
    o += `<path d="${blob(d.c, d.rx, d.ry, dr, 16, 0.2)}" fill="${fill}" opacity=".92"/>`;
  }

  // травяные кустики
  let tufts = '';
  const tr = rng(5);
  for (let i = 0; i < 650; i++) {
    const lat = 45 + tr() * 11, lon = 45.5 + tr() * 42;
    const [x, y] = P(lat, lon);
    tufts += `M${f(x - 2.4)},${f(y)} L${f(x)},${f(y - 4.2)} L${f(x + 2.4)},${f(y)} `;
  }
  o += `<path d="${tufts}" stroke="#5E7F3E" stroke-width=".9" fill="none" opacity=".35" stroke-linecap="round"/>`;

  // старое Аральское море
  o += `<path d="${geoPath(ARAL_1960, true)}" fill="#BFD8D3" opacity=".45" stroke="#4FAFD0" stroke-width="1.4" stroke-dasharray="5 4"/>`;

  // вода
  const water = (ll) => `<path d="${geoPath(ll, true)}" fill="url(#pWave)" stroke="#E9F6F8" stroke-width="2.5"/>`;
  o += water(CASPIAN) + water(ARAL_SMALL) + water(ARAL_WEST) + water(BALKHASH) + water(ZAYSAN) + water(ALAKOL) + water(TENGIZ) + water(ISSYKKUL) + water(KAPSHAGAY);
  // пресная и солёная части Балхаша
  const bEast = BALKHASH.slice(3, 12);
  o += `<path d="${geoPath(bEast, true)}" fill="#3D9A8C" opacity=".35"/>`;

  // реки
  for (const r of RIVERS) {
    const d = geoPath(r.pts, false);
    o += `<path d="${d}" stroke="#E9F6F8" stroke-width="${r.w + 2.4}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
    o += `<path d="${d}" stroke="#3C9BC0" stroke-width="${r.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // холмы
  const hr = rng(21);
  const hills = [];
  for (const a of HILL_AREAS) {
    for (let i = 0; i < a.n; i++) {
      const [x, y] = P(a.lat[0] + hr() * (a.lat[1] - a.lat[0]), a.lon[0] + hr() * (a.lon[1] - a.lon[0]));
      hills.push([x, y, a.s * (0.7 + hr() * 0.7)]);
    }
  }
  hills.sort((a, b) => a[1] - b[1]);
  for (const [x, y, s] of hills) {
    o += `<path d="M${f(x - s * 1.4)},${f(y)} Q${f(x)},${f(y - s * 1.7)} ${f(x + s * 1.4)},${f(y)}Z" fill="#B7A46A"/>`;
    o += `<path d="M${f(x)},${f(y - s * 0.85)} Q${f(x + s * 0.8)},${f(y - s * 0.6)} ${f(x + s * 1.4)},${f(y)} L${f(x)},${f(y)}Z" fill="#9C8957"/>`;
  }

  // горы
  const mr = rng(33);
  const peaks = [];
  for (const m of MOUNTAINS) {
    for (const [x, y] of sampleLine(m.line, m.n, mr, m.s * 1.6)) {
      peaks.push({ x, y, s: m.s * (0.7 + mr() * 0.6), snow: m.snow });
    }
  }
  peaks.sort((a, b) => a.y - b.y);
  for (const p of peaks) {
    const { x, y, s } = p, h = s * 1.5;
    o += `<path d="M${f(x - s)},${f(y)} L${f(x)},${f(y - h)} L${f(x + s)},${f(y)}Z" fill="#A47E5A"/>`;
    o += `<path d="M${f(x)},${f(y - h)} L${f(x + s)},${f(y)} L${f(x + s * 0.15)},${f(y)}Z" fill="#7C5C40"/>`;
    if (p.snow) {
      o += `<path d="M${f(x - s * 0.38)},${f(y - h * 0.62)} L${f(x)},${f(y - h)} L${f(x + s * 0.38)},${f(y - h * 0.62)} L${f(x + s * 0.14)},${f(y - h * 0.68)} L${f(x)},${f(y - h * 0.6)} L${f(x - s * 0.16)},${f(y - h * 0.7)}Z" fill="#FBFBF7"/>`;
    }
  }

  // леса
  const fr = rng(9);
  const trees = [];
  for (const a of FORESTS) {
    for (let i = 0; i < a.n; i++) {
      const [x, y] = P(a.lat[0] + fr() * (a.lat[1] - a.lat[0]), a.lon[0] + fr() * (a.lon[1] - a.lon[0]));
      trees.push([x, y, a.tone]);
    }
  }
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, tone] of trees) {
    if (tone === 'birch') {
      o += `<circle cx="${f(x)}" cy="${f(y - 4)}" r="3.6" fill="#6E9F4E"/><rect x="${f(x - 0.5)}" y="${f(y - 2)}" width="1" height="3" fill="#F2EEE4"/>`;
    } else {
      const c = tone === 'pine' ? '#2F5E36' : '#3E6E3A';
      o += `<path d="M${f(x - 3.4)},${f(y)} L${f(x)},${f(y - 9)} L${f(x + 3.4)},${f(y)}Z" fill="${c}"/>`;
    }
  }

  // подписи
  for (const l of LABELS) {
    const [x, y] = P(l.ll[0], l.ll[1]);
    const rot = l.rot ? ` transform="rotate(${l.rot} ${f(x)} ${f(y)})"` : '';
    o += `<text x="${f(x)}" y="${f(y)}" class="${l.cls}"${rot}>${l.t}</text>`;
  }
  o += `</g>`;

  // войлочный шов по краю
  o += `<path d="${land.d}" fill="none" stroke="#F4E3C1" stroke-width="7"/>`;
  o += `<path d="${land.d}" fill="none" stroke="#A8322A" stroke-width="2" stroke-dasharray="7 6" transform="translate(0,0)" opacity=".7"/>`;

  // облачка по краю
  const cr = rng(77);
  let puffs = '';
  land.pts.forEach(([x, y], i) => {
    if (cr() < 0.55) {
      const r = 26 + cr() * 46;
      const ox = (x < W / 2 ? -1 : 1) * cr() * 30, oy = (y < H / 2 ? -1 : 1) * cr() * 26;
      puffs += `<circle cx="${f(x + ox)}" cy="${f(y + oy)}" r="${f(r)}" fill="url(#puff)"/>`;
    }
  });
  o += `<g class="edge-puffs">${puffs}</g>`;

  // роза ветров
  const [rx, ry] = P(40.6, 84.2);
  o += `<g class="compass" transform="translate(${f(rx)},${f(ry)})">
    <circle r="30" fill="#F4E3C1" stroke="#A8322A" stroke-width="2"/>
    <circle r="24" fill="none" stroke="#A8322A" stroke-width="1" stroke-dasharray="3 3"/>
    <path d="M0,-27 L6,0 L0,27 L-6,0Z" fill="#A8322A"/><path d="M-27,0 L0,5 L27,0 L0,-5Z" fill="#1C9AA0"/>
    <circle r="4" fill="#E7A93B"/>
    <text y="-33" class="lbl-compass">С</text>
  </g>`;

  o += `<g id="routeLayer"></g><g id="lifeLayer"></g><g id="dustLayer"></g><g id="heroLayer"></g><g id="markerLayer"></g>`;
  return o;
}
