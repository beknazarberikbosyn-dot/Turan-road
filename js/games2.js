// Сюжетные испытания-головоломки: орнамент купола (Туркестан), караван (Тараз), новая роща (Шарын).
// Те же правила оболочки, что в games.js: сцена 600×320, api.win / api.lose, api.solve для проверки.
import * as audio from './audio.js';
import { item } from './sprites.js';

const GW = 600, GH = 320;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const NS = 'http://www.w3.org/2000/svg';

// ════ 1. Туркестан: орнамент купола ═══════════════════
// Каждый изразец несёт белую ленту гириха. Узор верен, когда лента без разрывов
// переходит из плитки в плитку и не выходит к краю панно.
const ROT = (m, r) => [0, 1, 2, 3].map((i) => m[(i - (r % 4) + 4) % 4]);
const shapeOf = (m) => Math.min(...[0, 1, 2, 3].map((r) => parseInt(ROT(m, r).join(''), 2)));
const EDGE = [[50, 0], [100, 50], [50, 100], [0, 50]];

function girihArt(mask, k) {
  const n = mask.reduce((s, v) => s + v, 0);
  const qstar = (cx, cy) => `<path d="M${cx},${cy - 15} L${cx + 4},${cy - 4} L${cx + 15},${cy} L${cx + 4},${cy + 4} L${cx},${cy + 15} L${cx - 4},${cy + 4} L${cx - 15},${cy} L${cx - 4},${cy - 4}Z" fill="#23518F" stroke="#F4E3C1" stroke-width="1.6"/>`;
  const r = (s) => { let x = Math.sin(k * 97.3 + s * 13.1) * 43758.5; return x - Math.floor(x); };
  const crackle = Array.from({ length: 4 }, (_, i) => `<path d="M${(r(i) * 90 + 5).toFixed(1)},${(r(i + 9) * 90 + 5).toFixed(1)} l${(r(i + 3) * 18 - 9).toFixed(1)},${(r(i + 5) * 18 - 9).toFixed(1)} l${(r(i + 7) * 14 - 7).toFixed(1)},${(r(i + 2) * 14 - 7).toFixed(1)}" stroke="#E9FBF8" stroke-width=".7" fill="none" opacity=".35"/>`).join('');
  const bands = mask.map((v, d) => (v ? `<path d="M50,50 L${EDGE[d][0]},${EDGE[d][1]}" stroke="#C9973A" stroke-width="19" stroke-linecap="butt"/>` : '')).join('')
    + mask.map((v, d) => (v ? `<path d="M50,50 L${EDGE[d][0]},${EDGE[d][1]}" stroke="#FBF6EA" stroke-width="13"/><path d="M50,50 L${EDGE[d][0]},${EDGE[d][1]}" stroke="#23518F" stroke-width="2.2" stroke-dasharray="5 4"/>` : '')).join('');
  const dots = [[25, 25], [75, 25], [75, 75], [25, 75]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#F4E3C1" opacity=".75"/><circle cx="${x}" cy="${y}" r="1.4" fill="#23518F"/>`).join('');
  const center = n >= 2
    ? `<path d="M50,30 L56,44 L70,50 L56,56 L50,70 L44,56 L30,50 L44,44Z" fill="#FBF6EA" stroke="#C9973A" stroke-width="2.4"/><path d="M50,36 L60,40 L64,50 L60,60 L50,64 L40,60 L36,50 L40,40Z" fill="none" stroke="#C9973A" stroke-width="1.2"/><circle cx="50" cy="50" r="7" fill="#23518F" stroke="#E7A93B" stroke-width="1.6"/>`
    : `<circle cx="50" cy="50" r="15" fill="#FBF6EA" stroke="#C9973A" stroke-width="3"/><circle cx="50" cy="50" r="7" fill="#23518F"/><circle cx="50" cy="50" r="2.4" fill="#E7A93B"/>`;
  return `<rect width="100" height="100" fill="url(#ggGlaze)"/><rect width="100" height="100" fill="url(#ggShine)"/>${crackle}
    ${qstar(0, 0)}${qstar(100, 0)}${qstar(0, 100)}${qstar(100, 100)}${dots}${bands}${center}
    <rect x="2.5" y="2.5" width="95" height="95" fill="none" stroke="#0E5C66" stroke-width="2" opacity=".5"/>`;
}

export function girih(api) {
  const N = 4, S = 66, ox = 30, oy = 26;
  api.inner.classList.add('g-tilebg');
  // решение: случайные ленты между соседями, к краю — ни одной
  let sol;
  do {
    sol = Array.from({ length: N * N }, () => [0, 0, 0, 0]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (x < N - 1 && Math.random() < 0.58) { sol[i][1] = 1; sol[i + 1][3] = 1; }
      if (y < N - 1 && Math.random() < 0.58) { sol[i][2] = 1; sol[i + N][0] = 1; }
    }
  } while (sol.some((m) => !m.some(Boolean)) || new Set(sol.map(shapeOf)).size < 3);
  // два места пустые: туда встанут запасные изразцы
  const cand = shuffle(sol.map((m, i) => i).filter((i) => { const c = sol[i].reduce((s, v) => s + v, 0); return c === 2 || c === 3; }));
  const holes = [cand[0], cand.find((i) => shapeOf(sol[i]) !== shapeOf(sol[cand[0]])) ?? cand[1]];
  const SHAPES = [[1, 0, 0, 0], [1, 1, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0], [1, 1, 1, 1]];
  const need = new Set(holes.map((i) => shapeOf(sol[i])));
  const decoys = shuffle(SHAPES.filter((m) => !need.has(shapeOf(m)))).slice(0, 2);
  const tray = shuffle([...holes.map((i) => ({ mask: sol[i] })), ...decoys.map((m) => ({ mask: m }))]).map((t, k) => ({ ...t, rot: Math.floor(Math.random() * 4), k, at: -1 }));
  const cells = sol.map((m, i) => ({ mask: m, rot: holes.includes(i) ? 0 : 1 + Math.floor(Math.random() * 3), deg: 0, spare: null, empty: holes.includes(i) }));
  cells.forEach((c) => { c.deg = c.rot * 90; });
  let moves = 0, done = false, sel = null;
  const minMoves = cells.reduce((s, c) => s + (c.empty ? 1 : (4 - c.rot) % 4), 0);

  api.add(`<svg width="0" height="0" aria-hidden="true"><defs>
    <linearGradient id="ggGlaze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2FB7B2"/><stop offset=".6" stop-color="#1A8E98"/><stop offset="1" stop-color="#127082"/></linearGradient>
    <radialGradient id="ggShine" cx=".28" cy=".22" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs></svg>`);
  // рама панно: кирпич и золотой бордюр
  api.add(`<svg viewBox="0 0 ${N * S + 28} ${N * S + 28}" width="${N * S + 28}" height="${N * S + 28}">
    <rect width="100%" height="100%" rx="8" fill="#B07A4A"/><rect x="3" y="3" width="${N * S + 22}" height="${N * S + 22}" rx="6" fill="none" stroke="#8C5A30" stroke-width="2" stroke-dasharray="14 3"/>
    <rect x="9" y="9" width="${N * S + 10}" height="${N * S + 10}" fill="#7A4A26" stroke="#E7A93B" stroke-width="3"/></svg>`, 'g-gframe');
  api.put(api.inner.lastElementChild, ox - 14, oy - 14);

  const els = cells.map((c, i) => {
    const b = document.createElement('button');
    b.className = 'g-abs g-gtile' + (c.empty ? ' empty' : '');
    b.style.cssText = `width:${S}px;height:${S}px;left:${ox + (i % N) * S}px;top:${oy + Math.floor(i / N) * S}px`;
    b.setAttribute('aria-label', c.empty ? `Пустое место ${i + 1}` : `Изразец ${i + 1}, повернуть`);
    b.innerHTML = c.empty ? '<span>?</span>' : `<svg viewBox="0 0 100 100" width="${S}" height="${S}" style="transform:rotate(${c.deg}deg)">${girihArt(c.mask, i)}</svg>`;
    api.inner.appendChild(b);
    return b;
  });
  const marks = api.add(`<svg viewBox="0 0 ${N * S} ${N * S}" width="${N * S}" height="${N * S}" class="g-gmarks"></svg>`, 'g-gmarkw').firstElementChild;
  api.put(marks.parentNode, ox, oy);

  // правая часть: правило мастера и запасные изразцы
  api.add(`<b>Правило мастера</b><span>Белая лента не обрывается: она переходит в соседний изразец. К краю панно ленты не выходят.</span>`, 'g-grule');
  api.put(api.inner.lastElementChild, 330, 18);
  api.add('<b>Запасные изразцы Нұрлана</b><span>Подходят не все — выбери нужные и поставь на пустые места.</span>', 'g-gtrayl');
  api.put(api.inner.lastElementChild, 330, 128);
  const trayEls = tray.map((t, k) => {
    const b = document.createElement('button');
    b.className = 'g-abs g-gspare';
    b.style.cssText = `left:${336 + k * 64}px;top:212px`;
    b.setAttribute('aria-label', `Запасной изразец ${k + 1}`);
    b.innerHTML = `<svg viewBox="0 0 100 100" width="56" height="56" style="transform:rotate(${t.rot * 90}deg)">${girihArt(t.mask, 40 + k)}</svg>`;
    api.inner.appendChild(b);
    return b;
  });

  const eff = (i) => { const c = cells[i]; if (c.empty) return null; return ROT(c.mask, c.rot); };
  const nb = (i, d) => { const x = i % N, y = Math.floor(i / N); const nx = x + [0, 1, 0, -1][d], ny = y + [-1, 0, 1, 0][d]; return nx < 0 || ny < 0 || nx >= N || ny >= N ? -1 : ny * N + nx; };
  const upd = () => api.hud(`Поворотов и вставок: <b>${moves}</b>`);
  const check = () => {
    let bad = 0, open = 0, s = '';
    const mark = (i, d, st) => {
      const [ex, ey] = EDGE[d];
      s += `<circle class="gm ${st}" cx="${(i % N) * S + ex * S / 100}" cy="${Math.floor(i / N) * S + ey * S / 100}" r="${st === 'ok' ? 5 : 6.5}"/>`;
      if (st === 'bad') bad++;
      if (st === 'open') open++;
    };
    for (let i = 0; i < N * N; i++) {
      const e = eff(i);
      if (!e) { open++; continue; }
      for (let d = 0; d < 4; d++) {
        const j = nb(i, d);
        if (j < 0) { if (e[d]) mark(i, d, 'bad'); continue; }
        const ej = eff(j);
        if (!ej) { if (e[d]) mark(i, d, 'open'); continue; }
        if (d === 0 || d === 3) continue;
        const a = e[d], b = ej[(d + 2) % 4];
        if (a || b) mark(i, d, a && b ? 'ok' : 'bad');
      }
    }
    marks.innerHTML = s;
    if (!bad && !open && !done) {
      done = true;
      els.forEach((b) => b.classList.add('won'));
      audio.sfx.chime();
      api.burst(ox + N * S / 2, oy + N * S / 2, '#E7A93B', 26); api.burst(ox + N * S / 2, oy + N * S / 2, '#2FB7B2', 18);
      api.later(() => api.win(moves <= minMoves + 4 ? 3 : moves <= minMoves + 14 ? 2 : 1, 'Лента гириха снова бежит без разрывов — купол засиял, как шестьсот лет назад.'), 1100);
    }
  };
  const selectSpare = (k) => {
    sel = sel === k ? null : k;
    trayEls.forEach((b, j) => b.classList.toggle('sel', j === sel));
    els.forEach((b, i) => b.classList.toggle('target', sel !== null && (cells[i].empty || cells[i].spare !== null)));
  };
  const drawCell = (i) => {
    const c = cells[i], b = els[i];
    b.classList.toggle('empty', c.empty);
    b.classList.toggle('spare', c.spare !== null);
    b.innerHTML = c.empty ? '<span>?</span>' : `<svg viewBox="0 0 100 100" width="${S}" height="${S}" style="transform:rotate(${c.deg}deg)">${girihArt(c.mask, c.spare !== null ? 40 + c.spare : i)}</svg>`;
  };
  els.forEach((b, i) => api.on(b, 'click', () => {
    if (done) return;
    const c = cells[i];
    if (sel !== null && (c.empty || c.spare !== null)) {
      // ставим запасной изразец (прежний запасной возвращается на полку)
      if (c.spare !== null) { tray[c.spare].at = -1; trayEls[c.spare].hidden = false; }
      const t = tray[sel];
      Object.assign(c, { mask: t.mask, rot: t.rot, deg: t.rot * 90, spare: sel, empty: false });
      t.at = i; trayEls[sel].hidden = true;
      moves++; audio.sfx.stone();
      selectSpare(sel); drawCell(i); upd(); check();
      return;
    }
    if (c.empty) { audio.sfx.wrong(); api.float(ox + (i % N) * S + S / 2, oy + Math.floor(i / N) * S + 10, 'Выбери запасной изразец', '#FFF8DE'); return; }
    c.rot = (c.rot + 1) % 4; c.deg += 90; moves++;
    b.firstElementChild.style.transform = `rotate(${c.deg}deg)`;
    audio.sfx.tock(); upd(); check();
  }));
  // вернуть вставленный запасной на полку: двойное нажатие
  els.forEach((b, i) => api.on(b, 'dblclick', () => {
    const c = cells[i];
    if (done || c.spare === null) return;
    tray[c.spare].at = -1; trayEls[c.spare].hidden = false;
    Object.assign(c, { spare: null, empty: true });
    drawCell(i); check();
  }));
  trayEls.forEach((b, k) => api.on(b, 'click', () => { if (!done) { audio.sfx.click(); selectSpare(k); } }));
  upd(); check();
  api.solve = () => {
    holes.forEach((h) => {
      const k = tray.findIndex((t) => t.mask === sol[h]);
      Object.assign(cells[h], { mask: sol[h], rot: 0, deg: 0, spare: k, empty: false });
      trayEls[k].hidden = true; drawCell(h);
    });
    cells.forEach((c, i) => { if (!holes.includes(i)) { c.rot = 0; c.deg = Math.ceil(c.deg / 360) * 360; els[i].firstElementChild.style.transform = `rotate(${c.deg}deg)`; } });
    check();
  };
}

// ════ 2. Тараз: навьючить караван ═════════════════════
const GOODS = {
  silk: { name: 'Шёлк', art: '<rect x="6" y="10" width="38" height="26" rx="6" fill="#A8322A"/><path d="M6,18 H44 M6,28 H44" stroke="#E7A93B" stroke-width="2"/><ellipse cx="44" cy="23" rx="5" ry="13" fill="#C0504A"/><path d="M44,12 q-4,11 0,22" stroke="#7A1E16" fill="none"/>' },
  silk2: { name: 'Шёлк', art: '<rect x="6" y="10" width="38" height="26" rx="6" fill="#2E6A9A"/><path d="M6,18 H44 M6,28 H44" stroke="#F4E3C1" stroke-width="2"/><ellipse cx="44" cy="23" rx="5" ry="13" fill="#4E8AB8"/><path d="M44,12 q-4,11 0,22" stroke="#1E4A6A" fill="none"/>' },
  paper: { name: 'Бумага', art: '<rect x="8" y="12" width="34" height="24" rx="2" fill="#F2E8D0" stroke="#9C8A6A"/><path d="M8,18 H42 M8,24 H42 M8,30 H42" stroke="#C9B88A"/><path d="M25,10 V38 M8,24 H42" stroke="#A8322A" stroke-width="2.4"/>' },
  spice: { name: 'Специи', art: '<path d="M12,38 Q8,20 16,12 L34,12 Q42,20 38,38Z" fill="#C9973A"/><path d="M14,14 Q25,6 36,14" stroke="#7A5A2E" stroke-width="3" fill="none"/><circle cx="20" cy="26" r="2" fill="#A8322A"/><circle cx="28" cy="30" r="2" fill="#7A3E1E"/><circle cx="31" cy="22" r="2" fill="#A8322A"/>' },
  carpet: { name: 'Ковёр', art: '<rect x="2" y="14" width="38" height="20" rx="10" fill="#7A1E2C"/><path d="M6,20 H36 M6,28 H36" stroke="#E7A93B" stroke-width="2" stroke-dasharray="4 3"/><circle cx="38" cy="24" r="10" fill="#9A2E3C" stroke="#E7A93B" stroke-width="2"/><path d="M38,16 a8,8 0 1,1 -.1,0" fill="none" stroke="#5A1420" stroke-width="1.2"/><circle cx="38" cy="24" r="4" fill="#E7A93B"/>' },
  tea: { name: 'Чай', art: '<rect x="10" y="14" width="30" height="22" rx="3" fill="#5A3A22"/><path d="M14,18 h22 v14 h-22Z" fill="none" stroke="#C9A06A" stroke-dasharray="3 2"/><text x="25" y="29" font-size="9" text-anchor="middle" fill="#E7A93B" font-family="serif">茶</text>' },
  jug: { name: 'Кувшин', art: '<path d="M19,6 h12 v5 Q41,14 40,27 Q38,40 25,40 Q12,40 10,27 Q9,14 19,11Z" fill="#2E9AA8" stroke="#1C6E7A" stroke-width="1.4"/><path d="M12,24 h26" stroke="#F4E3C1" stroke-width="3"/><path d="M40,17 q7,2 3,11" stroke="#2E9AA8" stroke-width="3" fill="none"/>' },
};
const camelSVG = (k) => `<svg viewBox="0 0 160 176" width="160" height="176" aria-hidden="true">
  <ellipse cx="80" cy="172" rx="52" ry="5" fill="#2B2350" opacity=".2"/>
  <g class="cleg b"><rect x="54" y="112" width="11" height="58" rx="5" fill="#A8804E"/></g><g class="cleg b2"><rect x="95" y="112" width="11" height="58" rx="5" fill="#A8804E"/></g>
  <g class="cleg f"><rect x="61" y="116" width="12" height="56" rx="5" fill="#C9A06A"/><rect x="59" y="164" width="16" height="8" rx="4" fill="#6B4A2E"/></g>
  <g class="cleg f2"><rect x="87" y="116" width="12" height="56" rx="5" fill="#C9A06A"/><rect x="85" y="164" width="16" height="8" rx="4" fill="#6B4A2E"/></g>
  <path d="M60,72 Q58,46 72,42 Q80,40 82,52 Q86,38 96,42 Q106,48 100,72Z" fill="#9C7442"/>
  <path d="M64,50 q4,-6 8,-4 M90,46 q6,-4 9,2" stroke="#6B4A2E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="80" cy="96" rx="46" ry="30" fill="#C9A06A"/>
  <path d="M40,90 Q80,66 120,90 L114,112 Q80,96 46,112Z" fill="#A8322A"/>
  <path d="M44,98 Q80,78 116,98" stroke="#E7A93B" stroke-width="2.4" fill="none" stroke-dasharray="5 3"/>${[52, 66, 80, 94, 108].map((x) => `<path d="M${x},108 v8" stroke="#E7A93B" stroke-width="2"/><circle cx="${x}" cy="118" r="2" fill="#F4E3C1"/>`).join('')}
  <path d="M70,82 Q66,52 74,30 Q78,18 86,30 Q92,52 90,82Z" fill="#C9A06A"/>
  <path d="M72,40 q8,-4 14,0 M71,52 q10,-4 17,0 M71,64 q10,-4 18,0" stroke="#A8804E" stroke-width="2.4" fill="none"/>
  <g class="chead"><ellipse cx="80" cy="22" rx="14" ry="13" fill="#C9A06A"/><ellipse cx="80" cy="33" rx="10" ry="8" fill="#D9B88A"/>
  <path d="M66,12 l-6,-6 l2,8Z M94,12 l6,-6 l-2,8Z" fill="#A8804E"/><path d="M70,10 q10,-8 20,0" stroke="#6B4A2E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="74" cy="20" r="2.6" fill="#2B1A12"/><circle cx="86" cy="20" r="2.6" fill="#2B1A12"/><circle cx="74.8" cy="19.2" r=".8" fill="#fff"/><circle cx="86.8" cy="19.2" r=".8" fill="#fff"/>
  <path d="M71,17 q3,-2 6,0 M83,17 q3,-2 6,0" stroke="#6B4A2E" stroke-width="1.6" fill="none"/>
  <ellipse cx="76" cy="34" rx="1.8" ry="1.2" fill="#5A3A22"/><ellipse cx="84" cy="34" rx="1.8" ry="1.2" fill="#5A3A22"/><path d="M75,39 q5,3 10,0" stroke="#5A3A22" stroke-width="1.4" fill="none"/>
  <path d="M66,26 Q80,40 94,26" stroke="#A8322A" stroke-width="2.4" fill="none"/></g>
  <path d="M46,84 Q30,86 24,98 M114,84 Q130,86 136,98" stroke="#6B4A2E" stroke-width="3" fill="none"/>
  <text x="80" y="146" text-anchor="middle" class="g-cname">${['Ақтайлақ', 'Қоңыр', 'Сары атан'][k]}</text></svg>`;

export function caravan(api) {
  api.inner.classList.add('g-caravanbg');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320" aria-hidden="true">
    <path d="M0,150 L60,96 L120,128 L190,74 L260,124 L330,84 L400,130 L470,80 L540,118 L600,92 V170 H0Z" fill="#A9B7CC"/>
    <path d="M178,86 L190,74 L202,86 L196,84 L190,90Z M458,92 L470,80 L482,92 L470,88Z" fill="#fff"/>
    <path d="M0,170 Q150,150 300,166 T600,160 V320 H0Z" fill="#C8B486"/>
    <path d="M0,250 Q200,236 360,248 T600,244" stroke="#B39A66" stroke-width="22" fill="none" opacity=".5"/>
    ${Array.from({ length: 18 }, (_, i) => `<path d="M${(i * 67) % 600},${200 + (i * 41) % 110} l3,-8 l3,8" stroke="#8C7A4E" stroke-width="1.4" fill="none"/>`).join('')}
    ${[30, 570].map((x) => `<g transform="translate(${x},168)"><rect x="-3" y="-36" width="6" height="36" fill="#6B4A2E"/><ellipse cx="0" cy="-44" rx="16" ry="20" fill="#5E8A3E"/></g>`).join('')}
  </svg>`);
  // генерация: у каждого верблюда левый и правый вьюк равны, в одном вьюке не больше 4 гирек
  const CY = 140, CX = (k) => 30 + k * 190;
  const splits = { 2: [[2], [1, 1]], 3: [[3], [2, 1]], 4: [[3, 1], [2, 2]] };
  let sides;
  do {
    sides = [];
    for (let c = 0; c < 3; c++) { const s = pick([2, 3, 4]); sides.push(pick(splits[s]), pick(splits[s])); }
  } while (sides.flat().length > 10 || sides.flat().length < 7);
  const goods = [];
  let jugDone = false;
  sides.forEach((ws) => ws.forEach((w) => {
    let kind;
    if (w === 1 && !jugDone && !ws.includes(3)) { kind = 'jug'; jugDone = true; } else kind = w === 3 ? 'carpet' : w === 2 ? pick(['silk', 'silk2', 'spice']) : pick(['paper', 'tea']);
    goods.push({ kind, w, at: null });
  }));
  const items = shuffle(goods).map((g, k) => ({ ...g, k }));
  const camels = [0, 1, 2].map((k) => {
    const el = api.add(`${camelSVG(k)}<div class="g-bask l" data-c="${k}" data-s="0"><i></i><b>0</b></div><div class="g-bask r" data-c="${k}" data-s="1"><i></i><b>0</b></div>`, 'g-camel');
    api.put(el, CX(k), CY);
    return { el, k };
  });
  let sel = null, fails = 0, done = false, drag = null;
  const sink = (c, s) => { const d = (W(c, s) - W(c, 1 - s)) * 4; return Math.max(-12, Math.min(12, d)); };
  const W = (c, s) => items.filter((it) => it.at && it.at[0] === c && it.at[1] === s).reduce((a, it) => a + it.w, 0);
  const cardHTML = (it) => `<svg viewBox="0 0 50 46" width="46" height="42">${GOODS[it.kind].art}</svg><span class="g-wts">${'<i></i>'.repeat(it.w)}</span><small>${GOODS[it.kind].name}</small>`;
  const cards = items.map((it) => {
    const b = document.createElement('button');
    b.className = 'g-abs g-good' + (it.kind === 'jug' ? ' fragile' : '');
    b.innerHTML = cardHTML(it);
    b.setAttribute('aria-label', `${GOODS[it.kind].name}, вес ${it.w}`);
    api.inner.appendChild(b);
    return b;
  });
  const go = api.add('<button class="btn g-go" disabled>Караван, в путь!</button>', 'g-gobox');
  api.put(go, 226, 86);
  const goBtn = go.firstElementChild;
  const layout = () => {
    let pool = 0;
    const inBask = {};
    items.forEach((it, k) => {
      const b = cards[k];
      b.classList.toggle('sel', sel === k);
      if (!it.at) { b.classList.remove('in'); api.put(b, 10 + pool * 54, 8); pool++; return; }
      const key = it.at.join('-'); const n = inBask[key] = (inBask[key] || 0) + 1;
      const [ck, sd] = it.at;
      const bx = CX(ck) + (sd ? 113 : -5), by = CY + 99 + sink(ck, sd) - (n - 1) * 34;
      b.classList.add('in'); api.put(b, bx, by, 'scale(.62)');
    });
    let allIn = items.every((it) => it.at);
    camels.forEach((c) => {
      const L = W(c.k, 0), R = W(c.k, 1);
      c.el.querySelector('.l b').textContent = L; c.el.querySelector('.r b').textContent = R;
      c.el.querySelector('.l').style.transform = `translateY(${sink(c.k, 0)}px)`; c.el.querySelector('.r').style.transform = `translateY(${sink(c.k, 1)}px)`;
      c.el.querySelector('.l').classList.toggle('over', L > 4); c.el.querySelector('.r').classList.toggle('over', R > 4);
      const tilt = Math.max(-14, Math.min(14, (R - L) * 4.5));
      c.el.querySelector('svg').style.transform = `rotate(${tilt}deg)`;
      c.el.classList.toggle('even', L === R && L > 0);
    });
    // хрупкий кувшин рядом с ковром
    const jug = items.find((it) => it.kind === 'jug');
    const crack = jug && jug.at && items.some((it) => it !== jug && it.at && it.at.join() === jug.at.join() && it.w >= 3);
    cards[items.indexOf(jug)]?.classList.toggle('danger', !!crack);
    goBtn.disabled = !allIn || done;
    api.hud(`Навьючено <b>${items.filter((it) => it.at).length}/${items.length}</b>`);
  };
  const place = (k, c, s) => { items[k].at = c === null ? null : [c, s]; audio.sfx.page(); sel = null; layout(); };
  const baskAt = (p) => {
    for (const c of camels) for (const s of [0, 1]) {
      const x = CX(c.k) + (s ? 112 : -6), y = CY + 40;
      if (p.x > x - 8 && p.x < x + 62 && p.y > y && p.y < y + 120) return [c.k, s];
    }
    return null;
  };
  cards.forEach((b, k) => api.on(b, 'pointerdown', (e) => {
    if (done) return;
    e.preventDefault();
    const p = api.pt(e);
    drag = { k, sx: p.x, sy: p.y, moved: false };
    api.inner.setPointerCapture?.(e.pointerId);
  }));
  api.on(api.inner, 'pointermove', (e) => {
    if (!drag) return;
    const p = api.pt(e);
    if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) { drag.moved = true; cards[drag.k].classList.add('drag'); }
    if (drag.moved) api.put(cards[drag.k], p.x - 27, p.y - 30);
  });
  const up = (e) => {
    if (!drag) return;
    const { k, moved } = drag; drag = null;
    cards[k].classList.remove('drag');
    if (moved) { const t = baskAt(api.pt(e)); if (t) place(k, t[0], t[1]); else place(k, null); return; }
    if (items[k].at && sel === null) { place(k, null); return; }
    sel = sel === k ? null : k; audio.sfx.click(); layout();
  };
  api.on(api.inner, 'pointerup', up); api.on(api.inner, 'pointercancel', up);
  api.on(api.inner, 'click', (e) => {
    if (sel === null || e.target.closest('.g-good')) return;
    const t = baskAt(api.pt(e));
    if (t) place(sel, t[0], t[1]);
  });
  api.on(goBtn, 'click', () => {
    if (done) return;
    const probs = [];
    camels.forEach((c) => {
      const L = W(c.k, 0), R = W(c.k, 1);
      if (L > 4 || R > 4) probs.push([c, 'Слишком тяжело: в одном вьюке больше 4 гирек']);
      else if (L !== R) probs.push([c, `Кренится: слева ${L}, справа ${R}`]);
    });
    const jug = items.find((it) => it.kind === 'jug');
    if (jug && items.some((it) => it !== jug && it.at.join() === jug.at.join() && it.w >= 3)) probs.push([camels[jug.at[0]], 'Ковёр раздавит хрупкий кувшин']);
    if (probs.length) {
      fails++; audio.sfx.wrong();
      probs.forEach(([c, msg], i) => {
        c.el.classList.remove('balk'); void c.el.offsetWidth; c.el.classList.add('balk');
        api.later(() => api.float(110 + c.k * 190, 116, msg, '#FFF8DE'), i * 250);
      });
      return;
    }
    done = true; layout();
    audio.sfx.chime();
    camels.forEach((c, i) => api.later(() => c.el.classList.add('walk'), i * 220));
    api.later(() => api.win(fails === 0 ? 3 : fails === 1 ? 2 : 1, 'Вьюки ровные, кувшин цел — караван снова на Шёлковом пути, и шёлк для свадебного платья доедет!'), 2300);
  });
  layout();
  api.solve = () => {
    // раскладываем так же, как при генерации: сначала кувшин, потом остальное по весу
    items.forEach((it) => { it.at = null; });
    const free = (w, jug) => items.find((it) => !it.at && it.w === w && (it.kind === 'jug') === jug);
    sides.forEach((ws, si) => {
      const jugSide = ws.includes(1) && !ws.includes(3) && items.some((it) => it.kind === 'jug' && !it.at);
      ws.forEach((w, n) => { const it = (jugSide && w === 1 && n === ws.indexOf(1) && free(1, true)) || free(w, false) || free(w, true); if (it) it.at = [Math.floor(si / 2), si % 2]; });
    });
    layout();
    goBtn.click();
  };
}

// ════ 3. Шарын: новая роща ════════════════════════════
export function grove(api) {
  const C = 10, R = 5, S = 44, ox = 18, oy = 82;
  api.inner.classList.add('g-grovebg');
  let grid, need, best;
  const idx = (x, y) => y * C + x;
  const gen = () => {
    grid = Array.from({ length: C * R }, () => ({ t: 'soil' }));
    // река петляет по нижним рядам, а в одном месте к ней сбегает ручей
    for (let x = 0; x < C; x++) { const y = 4 - (Math.sin(x * 0.9 + rnd(0, 6)) > 0.35 ? 1 : 0); grid[idx(x, 4)].t = 'water'; if (y === 3) grid[idx(x, 3)].t = 'water'; }
    const cx = 2 + Math.floor(rnd(0, 6));
    for (let y = 1; y < 4; y++) grid[idx(cx, y)].t = 'water';
    // тропа наискосок
    let px = Math.floor(rnd(5, 9));
    for (let y = 0; y < R; y++) { const c = grid[idx(px, y)]; if (c.t === 'soil') c.t = 'path'; px = Math.max(0, Math.min(C - 1, px + pick([-1, 0, 0, 1]))); }
    // камни и старые ясени
    for (let n = 0; n < 6; n++) { const c = grid[idx(Math.floor(rnd(0, C)), Math.floor(rnd(0, 4)))]; if (c.t === 'soil') c.t = 'stone'; }
    for (let n = 0; n < 2; n++) { const c = grid[idx(Math.floor(rnd(0, C)), Math.floor(rnd(1, 4)))]; if (c.t === 'soil') c.t = 'tree'; }
  };
  const wet = (x, y) => { for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) if (grid[idx(i, j)].t === 'water' && Math.abs(i - x) + Math.abs(j - y) <= 2) return true; return false; };
  const near = (x, y, set) => { for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) { if (i === x && j === y) continue; if (i < 0 || j < 0 || i >= C || j >= R) continue; const t = set ? set.has(idx(i, j)) : false; if (t || grid[idx(i, j)].t === 'tree') return true; } return false; };
  const why = (x, y, planted) => {
    const c = grid[idx(x, y)];
    if (c.t === 'water') return 'Это река!';
    if (c.t === 'stone') return 'На камне ясень не вырастет';
    if (c.t === 'path') return 'Здесь тропа — саженец затопчут';
    if (c.t === 'tree') return 'Тут уже растёт ясень';
    if (!wet(x, y)) return 'Слишком сухо — далеко от воды';
    if (near(x, y, planted)) return 'Тесно: ясеню нужен свет вокруг';
    return '';
  };
  const greedy = () => {
    let top = [];
    for (let k = 0; k < 24; k++) {
      const set = new Set();
      for (const i of shuffle(grid.map((_, i) => i))) { const x = i % C, y = Math.floor(i / C); if (!why(x, y, set)) set.add(i); }
      if (set.size > top.length) top = [...set];
    }
    return top;
  };
  do { gen(); best = greedy(); } while (best.length < 5);
  need = Math.min(6, best.length);
  const planted = new Set();
  let mistakes = 0, done = false;
  // клетки поля
  const cellArt = (c, x, y) => {
    const w = wet(x, y) && c.t === 'soil';
    if (c.t === 'water') return `<rect width="${S}" height="${S}" fill="#4FAFD0"/><path d="M6,${14 + (x % 2) * 6} q8,-5 16,0 t16,0 M2,${32 - (x % 2) * 5} q8,-5 16,0 t16,0" stroke="#BDE6F2" stroke-width="2" fill="none" class="g-ripple"/>`;
    const base = `<rect width="${S}" height="${S}" fill="${w ? '#7E6440' : '#C9A26A'}"/>${Array.from({ length: 5 }, (_, i) => `<circle cx="${(i * 17 + x * 7 + y * 3) % 40 + 2}" cy="${(i * 11 + x * 5 + y * 13) % 40 + 2}" r="${1 + (i % 2)}" fill="${w ? '#5E4A2E' : '#A88450'}"/>`).join('')}${w ? `<path d="M4,${S - 6} q4,-8 8,0 M30,${S - 8} q3,-7 6,0" stroke="#5E8A3E" stroke-width="2" fill="none"/>` : ''}`;
    if (c.t === 'stone') return base + '<ellipse cx="22" cy="26" rx="16" ry="11" fill="#8C8A84"/><ellipse cx="18" cy="22" rx="9" ry="5" fill="#B5B2AA"/><ellipse cx="22" cy="36" rx="16" ry="3" fill="#000" opacity=".15"/>';
    if (c.t === 'path') return base + `<rect width="${S}" height="${S}" fill="#E2CDA0" opacity=".85"/><path d="M12,8 l3,5 M26,22 l3,5 M14,32 l3,5" stroke="#B89A66" stroke-width="3" stroke-linecap="round"/>`;
    if (c.t === 'tree') return base;
    return base;
  };
  api.add(`<svg viewBox="0 0 600 82" width="600" height="82" aria-hidden="true"><path d="M0,0 H600 V60 L560,70 L520,58 L470,72 L420,60 L360,74 L300,62 L240,72 L180,58 L120,70 L60,60 L0,72Z" fill="#B5532E"/>
    <path d="M0,16 H600 M0,34 H600 M0,50 H600" stroke="#8E3C1E" stroke-width="5" opacity=".45"/><path d="M40,0 l10,60 M200,0 l-6,62 M380,0 l8,64 M520,0 l-8,58" stroke="#8E3C1E" stroke-width="3" opacity=".4"/></svg>`);
  const field = api.add(`<svg viewBox="0 0 ${C * S} ${R * S}" width="${C * S}" height="${R * S}" class="g-field">${grid.map((c, i) => `<g transform="translate(${(i % C) * S},${Math.floor(i / C) * S})">${cellArt(c, i % C, Math.floor(i / C))}</g>`).join('')}
    <g class="g-gridl">${Array.from({ length: C + 1 }, (_, i) => `<path d="M${i * S},0 V${R * S}"/>`).join('')}${Array.from({ length: R + 1 }, (_, i) => `<path d="M0,${i * S} H${C * S}"/>`).join('')}</g></svg>`);
  api.put(field, ox, oy);
  // старые ясени поверх поля
  grid.forEach((c, i) => {
    if (c.t !== 'tree') return;
    const t = api.add('<svg viewBox="0 0 80 96" width="80" height="96"><rect x="36" y="56" width="8" height="38" fill="#6B4A2E"/><ellipse cx="40" cy="40" rx="36" ry="30" fill="#3E7A34"/><ellipse cx="30" cy="30" rx="20" ry="16" fill="#4F8A3A"/><ellipse cx="52" cy="46" rx="16" ry="12" fill="#2F6A2A"/></svg>', 'g-oldtree');
    api.put(t, ox + (i % C) * S - 18, oy + Math.floor(i / C) * S - 54);
  });
  const sprouts = new Map();
  api.add(`<b>Правила лесника</b><span class="w">ближе двух клеток к воде</span><span class="s">не на камнях и тропе</span><span class="l">вокруг — свободная клетка</span>`, 'g-grules');
  api.put(api.inner.lastElementChild, 466, 92);
  const upd = () => api.hud(`${item('seed', 22)} Посажено <b>${planted.size}/${need}</b> · ошибок: ${mistakes}`);
  const cellAt = (p) => { const x = Math.floor((p.x - ox) / S), y = Math.floor((p.y - oy) / S); return x < 0 || y < 0 || x >= C || y >= R ? null : [x, y]; };
  const plant = (x, y) => {
    const i = idx(x, y);
    const el = api.add('<svg viewBox="0 0 44 54" width="44" height="54"><path d="M22,52 V24" stroke="#5E8A3E" stroke-width="3"/><path d="M22,32 Q8,26 6,14 Q18,16 22,30 M22,26 Q34,18 38,8 Q26,10 22,24" fill="#7FB35A"/><ellipse cx="22" cy="52" rx="10" ry="3" fill="#5E4A2E"/></svg>', 'g-sprout');
    api.put(el, ox + x * S, oy + y * S - 12);
    sprouts.set(i, el); planted.add(i);
  };
  const finish = () => {
    done = true;
    sprouts.forEach((el) => el.classList.add('grow'));
    audio.sfx.chime(); api.burst(ox + C * S / 2, oy + R * S / 2, '#B8E07A', 24);
    api.later(() => api.win(mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1, 'Саженцы у самой воды, и каждому хватит света. Через несколько лет здесь зашумит новая ясеневая роща.'), 1300);
  };
  api.on(api.inner, 'click', (e) => {
    if (done) return;
    const c = cellAt(api.pt(e));
    if (!c) return;
    const [x, y] = c, i = idx(x, y);
    if (planted.has(i)) { sprouts.get(i).remove(); sprouts.delete(i); planted.delete(i); audio.sfx.page(); upd(); return; }
    const w = why(x, y, planted);
    if (w) {
      mistakes++; audio.sfx.wrong(); upd();
      const m = api.add('', 'g-badcell'); api.put(m, ox + x * S, oy + y * S); m.addEventListener('animationend', () => m.remove());
      api.float(ox + x * S + S / 2, oy + y * S - 4, w, '#FFF8DE');
      return;
    }
    plant(x, y); audio.sfx.pop(); api.burst(ox + x * S + S / 2, oy + y * S + S / 2, '#B8E07A', 8); upd();
    if (planted.size >= need) finish();
  });
  upd();
  api.solve = () => { [...sprouts.values()].forEach((el) => el.remove()); sprouts.clear(); planted.clear(); best.slice(0, need).forEach((i) => plant(i % C, Math.floor(i / C))); upd(); finish(); };
}
