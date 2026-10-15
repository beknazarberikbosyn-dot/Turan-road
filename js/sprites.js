// Спрайты для испытаний и оживлённой карты. Все смотрят вправо.

// ── четвероногие ───────────────────────────────────────
// o: { body, belly, dark, horns, ears, tail, lw, lh, neck }
function quad(o) {
  const lw = o.lw || 4.5, lh = o.lh || 22, top = 40;
  const leg = (cls, x, fill) => `<g class="leg ${cls}"><rect x="${x}" y="${top}" width="${lw}" height="${lh}" rx="2" fill="${fill}"/><rect x="${x - 0.3}" y="${top + lh - 3}" width="${lw + 0.6}" height="3.4" rx="1.2" fill="${o.hoof || '#2B1A12'}"/></g>`;
  const horns = {
    lyre: `<path d="M84,12 Q80,2 84,-6 M88,12 Q86,2 92,-5" stroke="#3A2A1C" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    curl: `<path d="M83,14 Q72,6 76,18 Q80,28 88,22 Q92,16 86,12" stroke="#C9A97A" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    antler: `<path d="M84,12 L80,-6 M80,-6 L74,-12 M80,-6 L84,-14 M82,2 L76,-2 M88,12 L92,-6 M92,-6 L98,-12 M92,-6 L90,-14 M90,2 L96,-1" stroke="#6B4A2E" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    scimitar: `<path d="M84,12 Q78,-4 66,-10" stroke="#4A3826" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M90,26 l0,8" stroke="${o.dark}" stroke-width="3" stroke-linecap="round"/>`,
    none: '',
  }[o.horns || 'none'];
  const ears = o.ears === 'long'
    ? `<path d="M83,14 L80,-2 L86,10Z" fill="${o.body}" stroke="${o.dark}" stroke-width=".8"/><path d="M86,13 L87,-1 L90,12Z" fill="${o.body}" stroke="${o.dark}" stroke-width=".8"/>`
    : `<path d="M83,14 L81,6 L87,12Z" fill="${o.body}"/>`;
  return `
    <path class="tail" d="M23,30 Q14,34 ${o.tail === 'long' ? '12,52' : '16,42'}" stroke="${o.dark}" stroke-width="${o.tail === 'long' ? 3.5 : 2.5}" fill="none" stroke-linecap="round"/>
    ${leg('leg-b2', 28, o.dark)}${leg('leg-f2', 64, o.dark)}
    <ellipse cx="46" cy="32" rx="${o.bodyRx || 25}" ry="${o.bodyRy || 11}" fill="${o.body}"/>
    <ellipse cx="46" cy="38" rx="${(o.bodyRx || 25) - 6}" ry="4.5" fill="${o.belly}"/>
    ${o.stripe ? `<path d="M26,23 Q46,${o.neck ? 17 : 19} 70,22" stroke="${o.dark}" stroke-width="2.4" fill="none"/>` : ''}
    ${leg('leg-b1', 33, o.body)}${leg('leg-f1', 59, o.body)}
    <g class="head">
      <path d="M64,30 L76,${o.neck || 12} L88,14 L80,36Z" fill="${o.body}"/>
      <ellipse cx="88" cy="18" rx="9" ry="5.5" fill="${o.body}" transform="rotate(24 88 18)"/>
      <ellipse cx="94" cy="22" rx="3.6" ry="3" fill="${o.muzzle || o.belly}"/>
      ${ears}${horns}
      <circle cx="87" cy="16" r="1.4" fill="#1A120D"/>
    </g>`;
}

const BEASTS = {
  kulan: { name: 'Кулан', svg: quad({ body: '#C9A06A', belly: '#F3E6CC', dark: '#5A3A1C', ears: 'long', stripe: true, muzzle: '#F3E6CC' }) },
  jeyran: { name: 'Джейран', svg: quad({ body: '#C98E52', belly: '#FBF3E4', dark: '#4A2E18', horns: 'lyre', lw: 3, lh: 25, bodyRx: 22, bodyRy: 9 }) },
  arkhar: { name: 'Архар', svg: quad({ body: '#8C6A48', belly: '#E8DCC6', dark: '#3A2A1C', horns: 'curl', bodyRx: 26, bodyRy: 12 }) },
  maral: { name: 'Марал', svg: quad({ body: '#9C5A32', belly: '#D9B98E', dark: '#3A2418', horns: 'antler', lh: 24 }) },
  ibex: { name: 'Тау-теке', svg: quad({ body: '#8E7A60', belly: '#D9CDB6', dark: '#3A2A1C', horns: 'scimitar' }) },
  saiga: { name: 'Сайгак', svg: quad({ body: '#D8B98A', belly: '#F6EEDD', dark: '#6B4A2E', horns: 'lyre', lw: 3.4, lh: 20, muzzle: '#C9A57A' }) },
  irbis: {
    name: 'Ирбис',
    svg: `<path class="tail" d="M22,30 Q2,30 4,48 Q6,58 16,54" stroke="#BDB9B0" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g class="leg leg-b2"><rect x="28" y="36" width="6" height="22" rx="3" fill="#A9A49A"/></g>
      <g class="leg leg-f2"><rect x="64" y="36" width="6" height="22" rx="3" fill="#A9A49A"/></g>
      <ellipse cx="46" cy="32" rx="27" ry="10.5" fill="#E2DED4"/>
      ${[[32, 28], [42, 26], [52, 29], [60, 26], [38, 35], [50, 36], [26, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="#6E6A62" stroke-width="1.4"/>`).join('')}
      <g class="leg leg-b1"><rect x="33" y="36" width="6.5" height="22" rx="3" fill="#E2DED4"/></g>
      <g class="leg leg-f1"><rect x="59" y="36" width="6.5" height="22" rx="3" fill="#E2DED4"/></g>
      <g class="head"><circle cx="79" cy="24" r="10" fill="#E2DED4"/><path d="M72,16 l2,-6 l4,5Z M82,14 l4,-5 l1,7Z" fill="#E2DED4"/>
      <circle cx="83" cy="22" r="1.5" fill="#2B2B2B"/><path d="M87,27 l2,1" stroke="#6E6A62" stroke-width="1.4"/>
      <circle cx="74" cy="27" r="1.6" fill="#6E6A62"/><circle cx="76" cy="19" r="1.2" fill="#6E6A62"/></g>`,
  },
  camel: {
    name: 'Верблюд',
    svg: `<g class="leg leg-b2"><rect x="30" y="38" width="4.5" height="26" rx="2" fill="#8C6440"/></g><g class="leg leg-f2"><rect x="62" y="38" width="4.5" height="26" rx="2" fill="#8C6440"/></g>
      <ellipse cx="47" cy="32" rx="24" ry="11" fill="#C49460"/><path d="M30,26 Q36,6 44,24 Q50,8 58,26Z" fill="#C49460"/>
      <path d="M36,22 Q40,14 44,24 Q48,14 52,24" fill="#A8322A"/><rect x="32" y="26" width="30" height="5" fill="#1C9AA0"/>
      <g class="leg leg-b1"><rect x="35" y="38" width="4.5" height="26" rx="2" fill="#C49460"/></g><g class="leg leg-f1"><rect x="57" y="38" width="4.5" height="26" rx="2" fill="#C49460"/></g>
      <g class="head"><path d="M68,30 Q78,24 78,10 L84,8 Q86,22 74,34Z" fill="#C49460"/><ellipse cx="85" cy="10" rx="7" ry="4.5" fill="#C49460"/><circle cx="85" cy="8" r="1.2" fill="#2B1A12"/></g>`,
  },
  tiger: {
    name: 'Тигр',
    svg: `<path class="tail" d="M22,28 Q4,24 6,42" stroke="#D9883A" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="46" cy="32" rx="27" ry="11" fill="#D9883A"/>${[30, 38, 46, 54, 62].map((x) => `<path d="M${x},22 q-2,6 0,12" stroke="#2B1A12" stroke-width="2.4" fill="none"/>`).join('')}
      <g class="leg leg-f1"><rect x="60" y="36" width="7" height="22" rx="3" fill="#D9883A"/></g><g class="leg leg-b1"><rect x="31" y="36" width="7" height="22" rx="3" fill="#D9883A"/></g>
      <g class="head"><circle cx="80" cy="25" r="10" fill="#D9883A"/><circle cx="84" cy="22" r="1.5" fill="#1A120D"/><path d="M86,28 q-4,3 -8,1" stroke="#fff" stroke-width="2.4" fill="none"/></g>`,
  },
};

export function beast(kind, cls = 'run') {
  const b = BEASTS[kind];
  return `<svg class="beast ${cls}" viewBox="0 -16 104 84" aria-hidden="true">${b.svg}</svg>`;
}
export const beastName = (k) => BEASTS[k].name;

// ── беркут ─────────────────────────────────────────────
export function eagle(cls = '') {
  return `<svg class="eagle ${cls}" viewBox="-60 -40 120 80" aria-hidden="true">
    <g class="wing wing-back"><path d="M-6,-2 Q-24,-34 -56,-30 Q-38,-22 -32,-12 Q-44,-12 -50,-4 Q-30,-6 -10,6Z" fill="#5A3E26"/></g>
    <path d="M-30,4 L-46,0 L-44,12 Z" fill="#4A321E"/>
    <ellipse cx="0" cy="4" rx="24" ry="9" fill="#6B4A2E"/>
    <ellipse cx="4" cy="8" rx="14" ry="4" fill="#8C6440"/>
    <circle cx="24" cy="-1" r="8" fill="#C9A06A"/>
    <path d="M30,-3 L38,1 L30,4Z" fill="#E7A93B"/><path d="M36,1 q1,3 -3,3" stroke="#2B1A12" stroke-width="1.2" fill="none"/>
    <circle cx="26" cy="-3" r="1.6" fill="#1A120D"/>
    <g class="wing wing-front"><path d="M0,0 Q-10,-38 -48,-38 Q-30,-26 -26,-16 Q-40,-14 -46,-6 Q-24,-6 -4,10Z" fill="#7C5636"/>
      <path d="M-48,-38 l6,6 M-44,-33 l5,5 M-40,-28 l5,5" stroke="#4A321E" stroke-width="1.4"/></g>
  </svg>`;
}

// ── рыбы и мусор ──────────────────────────────────────
export function fish(kind = 'sazan') {
  const c = { sazan: ['#D9A83A', '#B8862A', '#F6E2A8'], sudak: ['#8FA88A', '#5E7A5A', '#E2ECD6'], bream: ['#B9B6A6', '#8C8878', '#EEEDE4'] }[kind];
  return `<svg class="fish" viewBox="0 0 80 40" aria-hidden="true">
    <path class="fin-tail" d="M14,20 L0,6 L4,20 L0,34Z" fill="${c[1]}"/>
    <ellipse cx="40" cy="20" rx="28" ry="${kind === 'bream' ? 14 : 11}" fill="${c[0]}"/>
    <ellipse cx="42" cy="25" rx="20" ry="4.5" fill="${c[2]}" opacity=".8"/>
    <path d="M30,${kind === 'bream' ? 7 : 10} Q40,0 50,${kind === 'bream' ? 7 : 10}Z" fill="${c[1]}"/>
    ${kind === 'sudak' ? [28, 36, 44, 52].map((x) => `<path d="M${x},12 v14" stroke="${c[1]}" stroke-width="2.2"/>`).join('') : ''}
    <path d="M58,12 Q54,20 58,28" stroke="${c[1]}" stroke-width="1.4" fill="none"/>
    <circle cx="61" cy="17" r="2.6" fill="#fff"/><circle cx="61.5" cy="17" r="1.4" fill="#1A120D"/>
  </svg>`;
}
export function trash(kind = 'bottle') {
  return kind === 'bottle'
    ? `<svg class="trash" viewBox="0 0 60 30" aria-hidden="true"><rect x="4" y="8" width="40" height="15" rx="6" fill="#9CD4D8" opacity=".85"/><rect x="44" y="11" width="10" height="9" rx="2" fill="#9CD4D8"/><rect x="53" y="10" width="5" height="11" rx="1.5" fill="#3F5FA8"/><rect x="14" y="10" width="16" height="11" fill="#fff" opacity=".7"/></svg>`
    : `<svg class="trash" viewBox="0 0 60 30" aria-hidden="true"><path d="M8,6 Q30,0 52,6 L46,26 Q30,30 14,26Z" fill="#E8E4DA" opacity=".9"/><path d="M20,6 Q22,0 26,6 M34,6 Q38,0 40,6" stroke="#C9C4B8" stroke-width="2" fill="none"/></svg>`;
}

// ── предметы ──────────────────────────────────────────
const ITEMS = {
  coin: `<circle cx="20" cy="20" r="15" fill="#C9973A" stroke="#7A5A2E" stroke-width="2"/><rect x="15" y="15" width="10" height="10" fill="#F4E3C1"/><circle cx="20" cy="20" r="11" fill="none" stroke="#F4E3C1" stroke-width="1" stroke-dasharray="2 2"/>`,
  shard: `<path d="M6,10 L30,4 L36,22 L22,36 L8,28Z" fill="#B85C34"/><path d="M10,14 Q22,8 32,12 M10,22 Q22,16 34,20" stroke="#F4E3C1" stroke-width="2" fill="none"/>`,
  jug: `<path d="M14,6 h12 v5 Q34,14 33,26 Q31,36 20,36 Q9,36 7,26 Q6,14 14,11Z" fill="#C46A3A"/><path d="M9,22 h22" stroke="#1C9AA0" stroke-width="3"/><path d="M33,16 q6,2 2,10" stroke="#C46A3A" stroke-width="3" fill="none"/>`,
  scroll: `<rect x="8" y="8" width="24" height="26" rx="2" fill="#F2E3BE"/><rect x="5" y="5" width="30" height="6" rx="3" fill="#C9A06A"/><rect x="5" y="31" width="30" height="6" rx="3" fill="#C9A06A"/><path d="M12,16 h16 M12,21 h14 M12,26 h16" stroke="#6B4A2E" stroke-width="1.6"/>`,
  lamp: `<path d="M4,24 Q8,14 24,16 L36,12 L32,20 Q30,30 16,30 Q6,30 4,24Z" fill="#9C7A4E"/><path d="M36,12 l3,-6 l2,4" stroke="#E7A93B" stroke-width="2.4" fill="#F4A23B"/>`,
  ammonite: `<g transform="translate(20 20)"><path d="M0,0 m-15,0 a15,15 0 1,1 30,0 a11,11 0 1,1 -22,0 a7,7 0 1,1 14,0 a3.5,3.5 0 1,1 -7,0" fill="#C9B48A" stroke="#7A6646" stroke-width="2"/></g>`,
  urchin: `<circle cx="20" cy="22" r="13" fill="#D8C9A8" stroke="#8C7A5A" stroke-width="2"/>${[0, 1, 2, 3, 4].map((i) => { const a = i / 5 * Math.PI * 2 - Math.PI / 2; return `<path d="M20,22 L${20 + Math.cos(a) * 12},${22 + Math.sin(a) * 12}" stroke="#8C7A5A" stroke-width="2" stroke-dasharray="2 2"/>`; }).join('')}`,
  tooth: `<path d="M8,32 Q20,0 32,32 Q20,26 8,32Z" fill="#6E6A62"/><path d="M14,28 Q20,10 26,28" stroke="#9C988E" stroke-width="2" fill="none"/>`,
  shell: `<path d="M6,30 Q6,8 20,6 Q34,8 34,30Z" fill="#E6D2B4" stroke="#9C8462" stroke-width="2"/>${[12, 16, 20, 24, 28].map((x) => `<path d="M20,32 L${x},10" stroke="#9C8462" stroke-width="1.3"/>`).join('')}`,
  silk: `<rect x="6" y="10" width="28" height="20" rx="4" fill="#B8382C"/><path d="M6,16 h28 M6,24 h28" stroke="#E7A93B" stroke-width="2"/><ellipse cx="34" cy="20" rx="4" ry="10" fill="#8C2A20"/>`,
  paper: `<path d="M8,6 h20 l6,6 v22 h-26Z" fill="#F6EEDD" stroke="#B9A07A" stroke-width="2"/><path d="M12,16 h16 M12,21 h16 M12,26 h10" stroke="#6B4A2E" stroke-width="1.6"/>`,
  stone: `<path d="M4,34 Q2,18 14,12 Q26,6 34,16 Q40,26 36,34Z" fill="#8C8478"/><path d="M14,14 Q22,10 30,16" stroke="#B5ADA0" stroke-width="3" fill="none"/>`,
  saxaul: `<path d="M20,38 L20,22 M20,28 L10,16 M20,24 L30,12 M12,18 L6,14 M28,14 L34,10" stroke="#6B4A2E" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="12" r="5" fill="#8C9A5A"/><circle cx="32" cy="9" r="5" fill="#8C9A5A"/><circle cx="18" cy="16" r="4" fill="#7E8A4E"/>`,
  log: `<rect x="2" y="20" width="36" height="14" rx="7" fill="#8C5A2B"/><ellipse cx="34" cy="27" rx="5" ry="7" fill="#C49460"/><circle cx="34" cy="27" r="2" fill="#8C5A2B"/>`,
  edelweiss: `${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="20" cy="10" rx="4" ry="9" fill="#F4F2EA" stroke="#C9C4B0" stroke-width="1" transform="rotate(${i * 60} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="5" fill="#E7C94B"/>`,
  seed: `<path d="M20,36 Q4,16 22,4 Q30,16 20,36Z" fill="#B8C46A" stroke="#7E8A3A" stroke-width="1.6"/><ellipse cx="20" cy="31" rx="4" ry="5" fill="#6B4A2E"/>`,
  rock: `<path d="M6,30 Q4,14 16,8 Q30,4 36,18 Q38,32 26,36 Q12,38 6,30Z" fill="#9C5A3A"/><path d="M14,12 Q22,8 30,14" stroke="#C47E58" stroke-width="3" fill="none"/>`,
  maralspot: `<circle cx="20" cy="20" r="17" fill="#FFF8DE" stroke="#E7A93B" stroke-width="3"/><path d="M12,26 l2,-8 h10 l3,-4 l3,2 l-3,4 l0,6 M16,26 v4 M24,26 v4 M27,14 l-2,-6 M29,15 l3,-5" stroke="#9C5A32" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  note: `<circle cx="20" cy="20" r="16" fill="#6A4C9C" stroke="#F4E3C1" stroke-width="3"/><path d="M20,30 V14 M20,18 Q12,10 9,17 Q8,23 13,23 M20,18 Q28,10 31,17 Q32,23 27,23" stroke="#F4E3C1" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
};
export function item(kind, size = 40, cls = '') {
  return `<svg class="it ${cls}" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">${ITEMS[kind]}</svg>`;
}
export const ITEM_NAMES = {
  coin: 'Монета', shard: 'Черепок с узором', jug: 'Кувшин', scroll: 'Свиток', lamp: 'Масляный светильник',
  ammonite: 'Аммонит', urchin: 'Морской ёж', tooth: 'Зуб древней акулы', shell: 'Раковина',
  silk: 'Шёлк', paper: 'Бумага', edelweiss: 'Эдельвейс', seed: 'Крылатка ясеня', maralspot: 'Марал',
};
