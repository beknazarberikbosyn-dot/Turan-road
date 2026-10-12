// Иллюстрации мест, портреты жителей и артефакты — всё нарисовано в SVG.

const TONES = {
  day:   { sky: ['#6FC3EE', '#CDEBF7'], sun: '#FFE7A3', far: '#9CB6C9', ground: ['#CDBB7C', '#B39D5E'], tint: null },
  past:  { sky: ['#E9B66E', '#F8E2B8'], sun: '#FFF1C9', far: '#C9A57A', ground: ['#C9A469', '#A9844C'], tint: '#7A4A1E' },
  dusk:  { sky: ['#6A4C9C', '#E8A06A'], sun: '#FFD08A', far: '#8C6C9A', ground: ['#9C7A58', '#7C5C40'], tint: '#3B2350' },
  night: { sky: ['#1E2350', '#4A4C8A'], sun: '#F4F0D8', far: '#3A3F70', ground: ['#3E4A5A', '#2C3444'], tint: '#141838' },
  saka:  { sky: ['#D9925A', '#F6D7A0'], sun: '#FFF0C4', far: '#A6886E', ground: ['#B69A5E', '#957A44'], tint: '#5E3416' },
  cold:  { sky: ['#9FB7D6', '#E8EEF4'], sun: '#FFFFFF', far: '#A9B8C8', ground: ['#B7B49A', '#8E8C72'], tint: '#2E3E5E' },
};

let uid = 0;

export function sceneSVG(kind, toneName = 'day', opts = {}) {
  const t = TONES[toneName] || TONES.day;
  const id = 'sc' + (++uid);
  const G = 196; // линия земли
  let back = '', mid = '', front = '';

  const hills = (y, c, amp = 18, seed = 1) => {
    let d = `M0,${y}`;
    for (let x = 0; x <= 600; x += 60) d += ` Q${x + 30},${y - amp * (0.6 + ((x * seed) % 7) / 10)} ${x + 60},${y}`;
    return `<path d="${d} L600,240 L0,240Z" fill="${c}"/>`;
  };
  const mountains = (y, c, snow = true, scale = 1) => {
    const peaks = [[60, 80], [150, 50], [250, 90], [360, 40], [470, 75], [560, 55]];
    let o = '';
    for (const [x, h0] of peaks) {
      const h = h0 * scale, top = y - 140 * scale + h * 0.3;
      o += `<path d="M${x - 90},${y} L${x},${top} L${x + 90},${y}Z" fill="${c}"/>`;
      if (snow) o += `<path d="M${x - 26},${top + 38} L${x},${top} L${x + 26},${top + 38} L${x + 9},${top + 30} L${x},${top + 40} L${x - 10},${top + 30}Z" fill="#FBFBF7" opacity=".95"/>`;
    }
    return o;
  };
  const pine = (x, y, s = 1, c = '#2F5E36') => `<path d="M${x},${y - 46 * s} L${x + 14 * s},${y - 14 * s} L${x + 8 * s},${y - 14 * s} L${x + 18 * s},${y} L${x - 18 * s},${y} L${x - 8 * s},${y - 14 * s} L${x - 14 * s},${y - 14 * s}Z" fill="${c}"/><rect x="${x - 2 * s}" y="${y}" width="${4 * s}" height="${8 * s}" fill="#5A3A1C"/>`;
  const yurt = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-34,0 L-34,-22 Q0,-48 34,-22 L34,0Z" fill="#F2EBDD" stroke="#B9AA8C" stroke-width="1.5"/><path d="M-34,-22 Q0,-48 34,-22" fill="none" stroke="#A8322A" stroke-width="3"/><path d="M-34,-12 H34" stroke="#A8322A" stroke-width="2" stroke-dasharray="6 4"/><rect x="-8" y="-20" width="16" height="20" fill="#8C5A2B"/><path d="M-8,-20 h16 M0,-20 v20" stroke="#E7A93B" stroke-width="1.2"/></g>`;
  const fire = (x, y) => `<g class="fire" transform="translate(${x},${y})"><path d="M-14,4 L14,-2 M-14,-2 L14,4" stroke="#5A3A1C" stroke-width="4" stroke-linecap="round"/><path class="flame" d="M0,-30 C10,-18 12,-6 0,2 C-12,-6 -10,-18 0,-30Z" fill="#F4A23B"/><path class="flame" d="M0,-18 C5,-12 6,-4 0,1 C-6,-4 -5,-12 0,-18Z" fill="#FFE7A3"/></g>`;

  switch (kind) {
    case 'mausoleum': {
      back = hills(G - 30, t.far, 26, 3);
      mid = `
        <rect x="170" y="112" width="290" height="${G - 112}" fill="#D8BE92"/>
        <path d="M170,112 h290" stroke="#B9A07A" stroke-width="3"/>
        <rect x="372" y="78" width="70" height="36" fill="#CFB386"/>
        <path d="M368,82 Q407,8 446,82Z" fill="#1C9AA0"/>
        ${[380, 392, 404, 416, 428].map(x => `<path d="M${x},80 Q${407 + (x - 407) * 0.4},22 407,18" stroke="#13777C" stroke-width="1.6" fill="none"/>`).join('')}
        <rect x="372" y="98" width="70" height="7" fill="#1C9AA0"/>
        <path d="M196,112 Q222,74 248,112Z" fill="#1C9AA0"/>
        <rect x="240" y="58" width="112" height="${G - 58}" fill="#E0C79C"/>
        <path d="M262,${G} L262,112 Q296,74 330,112 L330,${G}Z" fill="#7A5A3A"/>
        <path d="M268,${G} L268,116 Q296,86 324,116 L324,${G}Z" fill="#5B4029"/>
        <rect x="240" y="64" width="112" height="9" fill="#1C9AA0"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${246 + i * 13}" y="${80 + (i % 2) * 2}" width="7" height="7" fill="#13777C" opacity=".8"/>`).join('')}
        <rect x="232" y="58" width="10" height="${G - 58}" fill="#C8AE84"/><rect x="350" y="58" width="10" height="${G - 58}" fill="#C8AE84"/>
        ${opts.scaffold ? Array.from({ length: 5 }, (_, i) => `<path d="M${226 + i * 34},${G} V40 M226,${60 + i * 30} H${366}" stroke="#8C6A42" stroke-width="2.5"/>`).join('') : `${[0, 1, 2, 3].map(i => `<circle cx="${252 + i * 30}" cy="66" r="1.6" fill="#5B4029"/>`).join('')}`}`;
      break;
    }
    case 'ruins': {
      back = hills(G - 24, t.far, 16, 2);
      mid = `
        <path d="M60,${G} Q160,110 300,120 Q440,112 540,${G}Z" fill="#C9AE7E"/>
        <path d="M200,${G - 40} h40 v-26 h12 v26 h30 v-14 h10 v14 h40" stroke="#9C7E52" stroke-width="7" fill="none"/>
        <rect x="320" y="146" width="90" height="40" fill="none" stroke="#7A5A3A" stroke-width="2" stroke-dasharray="6 4"/>
        <path d="M330,186 v-30 M350,186 v-30 M370,186 v-30 M390,186 v-30" stroke="#B39468" stroke-width="2"/>
        <path d="M410,150 l18,-26 l4,2 l-16,26Z" fill="#6B4A2E"/><path d="M426,124 l10,-6 l2,4 l-9,5Z" fill="#9AA3AD"/>
        <path d="M460,${G - 6} q20,-30 40,0Z" fill="#B49A6C"/>`;
      break;
    }
    case 'city': {
      back = hills(G - 26, t.far, 18, 4);
      mid = `
        <rect x="80" y="104" width="440" height="${G - 104}" fill="#CDAE7A"/>
        ${[80, 190, 300, 410, 500].map(x => `<rect x="${x - 6}" y="88" width="32" height="${G - 88}" fill="#BE9E69"/><path d="M${x - 6},88 h32" stroke="#A58552" stroke-width="3"/>`).join('')}
        <path d="M262,${G} L262,130 Q300,96 338,130 L338,${G}Z" fill="#5B4029"/>
        <path d="M140,104 Q160,76 180,104Z" fill="#1C9AA0"/><path d="M380,104 Q404,70 428,104Z" fill="#C46A3A"/>
        <rect x="455" y="70" width="10" height="34" fill="#BE9E69"/>
        <g opacity=".9">${[0, 1, 2].map(i => `<g transform="translate(${30 + i * 40},${G - 4})"><ellipse cx="0" cy="-14" rx="16" ry="11" fill="#C9A469"/><path d="M-6,-24 l4,-14 l4,14Z" fill="#8C5A2B"/><rect x="-12" y="-6" width="3" height="10" fill="#8C5A2B"/><rect x="9" y="-6" width="3" height="10" fill="#8C5A2B"/><rect x="-10" y="-30" width="14" height="10" rx="2" fill="#A8322A"/></g>`).join('')}</g>`;
      break;
    }
    case 'aisha': {
      back = mountains(G - 10, t.far, true, 0.75);
      mid = `
        <rect x="246" y="96" width="108" height="${G - 96}" fill="#D4935E"/>
        <rect x="240" y="96" width="14" height="${G - 96}" fill="#C47E48"/><rect x="346" y="96" width="14" height="${G - 96}" fill="#C47E48"/>
        ${Array.from({ length: 7 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${260 + c * 14}" y="${104 + r * 12}" width="9" height="8" fill="none" stroke="#9E5A2C" stroke-width="1.4" transform="rotate(${(r + c) % 2 ? 45 : 0} ${264.5 + c * 14} ${108 + r * 12})"/>`).join('')).join('')}
        <path d="M282,${G} L282,160 Q300,140 318,160 L318,${G}Z" fill="#6B3A1C"/>
        <path d="M262,96 Q300,58 338,96Z" fill="#C47E48"/>
        <path d="M120,${G} q24,-40 48,0" fill="#5C8A44"/><path d="M450,${G} q30,-56 60,0" fill="#5C8A44"/>`;
      break;
    }
    case 'petroglyph': {
      back = hills(G - 40, t.far, 30, 5);
      const rock = (x, y, w, h) => `<path d="M${x},${y + h} Q${x - 10},${y + h * 0.3} ${x + w * 0.3},${y} Q${x + w * 0.8},${y - 10} ${x + w},${y + h * 0.4} L${x + w + 8},${y + h}Z" fill="#5E4434"/>`;
      mid = `${rock(150, 96, 150, 100)}${rock(320, 112, 140, 84)}${rock(70, 140, 80, 56)}
        <g stroke="#E8CFA0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".92">
          <circle cx="222" cy="128" r="10"/>${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${222 + Math.cos(a) * 12},${128 + Math.sin(a) * 12} L${222 + Math.cos(a) * 18},${128 + Math.sin(a) * 18}"/>`; }).join('')}
          <path d="M222,140 V168 M222,150 L208,158 M222,150 L236,158 M222,168 L212,184 M222,168 L232,184"/>
          <path d="M350,150 q20,-12 44,0 l2,18 M354,150 l-2,22 M392,150 l2,22 M356,150 q-8,-16 4,-14 M392,148 q10,-12 0,-16"/>
          <path d="M260,160 q10,-8 22,0 M262,160 l-2,12 M280,160 l2,12 M282,160 l6,-8"/>
        </g>`;
      break;
    }
    case 'kurgan': {
      back = mountains(G - 30, t.far, true, 0.9);
      mid = `<path d="M90,${G} Q170,120 250,${G}Z" fill="#9FA66A"/><path d="M280,${G} Q330,150 380,${G}Z" fill="#A9AE73"/><path d="M400,${G} Q470,130 540,${G}Z" fill="#98A066"/>
        <path d="M150,${G - 40} q20,-6 40,0" stroke="#7E8752" stroke-width="2" fill="none"/>`;
      break;
    }
    case 'canyon': {
      back = mountains(G - 50, t.far, true, 0.6);
      const tower = (x, w, top, c1, c2) => `<path d="M${x},${G} L${x + 6},${top + 20} Q${x + w * 0.5},${top - 8} ${x + w - 6},${top + 20} L${x + w},${G}Z" fill="${c1}"/>${[0, 1, 2, 3].map(i => `<path d="M${x + 4},${top + 34 + i * 30} H${x + w - 4}" stroke="${c2}" stroke-width="4" opacity=".6"/>`).join('')}`;
      mid = `${tower(40, 90, 70, '#B5532E', '#8E3C1E')}${tower(140, 70, 100, '#C76B3B', '#9C4A25')}${tower(420, 80, 80, '#B5532E', '#8E3C1E')}${tower(500, 100, 60, '#A84A28', '#7E3418')}
        <path d="M210,${G} Q300,170 410,${G}Z" fill="#7E9A5A"/>
        <path d="M230,${G - 2} Q300,184 390,${G - 2}" stroke="#4FAFD0" stroke-width="7" fill="none"/>
        ${[250, 290, 330, 370].map((x, i) => `<circle cx="${x}" cy="${178 - (i % 2) * 6}" r="${12 + (i % 2) * 4}" fill="#4F7F3A"/>`).join('')}`;
      break;
    }
    case 'dune': {
      back = mountains(G - 20, '#8A8F9C', false, 0.8);
      mid = `<path d="M40,${G} Q160,60 300,72 Q420,90 560,${G}Z" fill="#E7BE73"/>
        <path d="M300,72 Q260,130 180,${G}" stroke="#C99A4E" stroke-width="3" fill="none"/>
        <path d="M300,72 Q420,90 560,${G} L300,${G}Z" fill="#D4A65A" opacity=".55"/>
        ${[[100, 186], [130, 190], [480, 188]].map(([x, y]) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="-10" rx="11" ry="6" fill="#B98A55"/><rect x="-8" y="-6" width="2" height="8" fill="#7A5A3A"/><rect x="6" y="-6" width="2" height="8" fill="#7A5A3A"/><path d="M10,-12 l6,-8 l2,2 l-5,8Z" fill="#B98A55"/><path d="M-11,-10 l-4,4" stroke="#3A2418" stroke-width="1.6"/></g>`).join('')}`;
      break;
    }
    case 'island': {
      back = `<rect x="0" y="${G - 40}" width="600" height="40" fill="#5DB3D2"/>`;
      mid = `<path d="M60,${G} Q300,120 560,${G}Z" fill="#D9BE84"/>
        <g transform="translate(360,${G - 30})"><rect x="0" y="-26" width="70" height="26" fill="#6E8A5C"/><rect x="70" y="-18" width="24" height="18" fill="#58714A"/><circle cx="14" cy="4" r="7" fill="#2B2B2B"/><circle cx="76" cy="4" r="7" fill="#2B2B2B"/></g>
        ${[[220, G - 18], [270, G - 22]].map(([x, y]) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="-10" rx="14" ry="7" fill="#C9A06A"/><rect x="-10" y="-6" width="2.4" height="12" fill="#7A5A3A"/><rect x="8" y="-6" width="2.4" height="12" fill="#7A5A3A"/><path d="M12,-12 l8,-10 l3,2 l-7,10Z" fill="#C9A06A"/><path d="M12,-14 l3,-10" stroke="#3A2418" stroke-width="1.6"/></g>`).join('')}`;
      break;
    }
    case 'lake': {
      back = hills(G - 50, t.far, 12, 2);
      mid = `<path d="M0,${G - 54} H600 V${G - 4} H0Z" fill="#5BB7D2"/>
        <path d="M300,${G - 54} H600 V${G - 4} H300Z" fill="#3E9A8A" opacity=".75"/>
        <path d="M282,${G - 54} Q300,${G - 30} 318,${G - 4}" stroke="#E9F6F8" stroke-width="3" fill="none" stroke-dasharray="6 6"/>
        <path d="M60,${G - 34} q10,-4 20,0 M420,${G - 20} q10,-4 20,0 M170,${G - 16} q10,-4 20,0" stroke="#E9F6F8" stroke-width="2" fill="none"/>
        <g transform="translate(240,${G - 40})"><path d="M-30,0 Q0,12 30,0 L22,-4 Q0,4 -22,-4Z" fill="#7A5A3A"/><rect x="-1" y="-28" width="2" height="26" fill="#5A3A1C"/></g>`;
      front = Array.from({ length: 18 }, (_, i) => `<path d="M${10 + i * 34},240 q${4 - (i % 3) * 3},-34 ${2 - (i % 2) * 6},-${40 + (i % 4) * 8}" stroke="#7E8A3A" stroke-width="3" fill="none"/>`).join('');
      break;
    }
    case 'tugai': {
      back = `<rect x="0" y="${G - 50}" width="600" height="60" fill="#8DB46A"/>`;
      mid = `<path d="M0,${G - 10} Q200,${G - 40} 600,${G - 20} V${G + 6} H0Z" fill="#5BB7D2"/>
        ${[60, 180, 470, 560].map(x => `<path d="M${x},${G - 30} q-6,-50 10,-80 q20,30 10,80Z" fill="#6E9A4E"/><rect x="${x + 2}" y="${G - 34}" width="5" height="22" fill="#6B4A2E"/>`).join('')}
        <path d="M300,${G - 8} q14,-8 30,-4 q14,-10 26,0 l4,8 q-30,8 -60,-4Z" fill="#D9883A"/>
        <path d="M306,${G - 10} l4,6 M318,${G - 12} l4,8 M332,${G - 12} l2,8 M344,${G - 10} l2,6" stroke="#2B1A12" stroke-width="2.6"/>`;
      front = Array.from({ length: 26 }, (_, i) => `<path d="M${i * 24},240 q${(i % 3) * 2 - 2},-60 ${(i % 2) * 8 - 4},-${70 + (i % 5) * 10}" stroke="#9C9A4E" stroke-width="3.4" fill="none"/>`).join('');
      break;
    }
    case 'forest': {
      back = `<rect x="0" y="${G - 70}" width="600" height="80" fill="#7FAE5C"/>`;
      mid = `<path d="M0,${G - 6} Q300,${G - 30} 600,${G - 6} V${G + 6} H0Z" fill="#5BB7D2"/>
        ${[40, 120, 200, 330, 420, 520].map((x, i) => `<rect x="${x - 4}" y="${G - 70 - i % 2 * 10}" width="8" height="${64 + i % 2 * 10}" fill="#6B4A2E"/><ellipse cx="${x}" cy="${G - 92 - i % 2 * 10}" rx="${38 + i % 3 * 6}" ry="${32 + i % 2 * 6}" fill="${i % 2 ? '#4F8A3A' : '#5E9A44'}"/>`).join('')}`;
      front = Array.from({ length: 6 }, (_, i) => `<path class="seedfall" d="M${80 + i * 90},${30 + i % 3 * 20} l8,3 l-8,3Z" fill="#B8C46A"/>`).join('');
      break;
    }
    case 'peak': {
      back = `<path d="M150,${G} L270,40 L300,64 L330,30 L460,${G}Z" fill="#8FA0B2"/>
        <path d="M232,84 L270,40 L300,64 L330,30 L372,80 L340,72 L330,86 L300,76 L280,90 L262,80Z" fill="#FBFBF7"/>
        ${mountains(G, '#7E91A6', true, 0.55)}`;
      mid = hills(G - 6, '#6E9A5A', 16, 3);
      front = [40, 90, 500, 560].map((x, i) => pine(x, 236, 1.2 - i % 2 * 0.2, '#3E6E3A')).join('');
      break;
    }
    case 'pinelake': {
      back = hills(G - 60, '#3E6E3A', 22, 4);
      mid = `<path d="M0,${G - 46} H600 V${G + 4} H0Z" fill="#4FA6C4"/>
        <path d="M60,${G - 44} L80,70 Q100,52 120,70 L140,96 L130,${G - 44}Z" fill="#9C8C82"/>
        <path d="M82,80 q20,-10 40,6 M78,110 q30,-10 56,4 M76,140 q30,-8 60,4" stroke="#7C6C64" stroke-width="3" fill="none"/>
        <path d="M330,${G - 40} q8,-32 26,-30 q18,6 16,30Z" fill="#8C7C72"/>
        <ellipse cx="350" cy="${G - 38}" rx="34" ry="5" fill="#2E7A96" opacity=".6"/>
        ${[180, 220, 470, 520, 570].map((x, i) => pine(x, G - 46, 0.9 + i % 2 * 0.2)).join('')}`;
      break;
    }
    case 'ulytau': {
      back = `<path d="M0,${G - 10} Q90,90 180,120 Q270,70 380,110 Q480,80 600,${G - 20} V240 H0Z" fill="${t.far}"/>`;
      mid = `${hills(G - 2, '#B7A46A', 14, 3)}
        <g transform="translate(420,${G - 6})"><rect x="-26" y="-40" width="52" height="40" fill="#C8A87A"/><path d="M-26,-40 Q0,-82 26,-40Z" fill="#B48C5E"/><path d="M-8,0 v-22 q8,-10 16,0 v22Z" fill="#6B4A2E"/></g>
        <path d="M0,${G + 10} Q200,${G - 4} 600,${G + 14}" stroke="#4FAFD0" stroke-width="6" fill="none"/>`;
      break;
    }
    case 'ships': {
      back = `<rect x="0" y="${G - 46}" width="600" height="8" fill="#6CC0DA" opacity=".9"/>`;
      const ship = (x, y, s, rot) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path d="M-60,0 L60,0 L48,24 L-50,24Z" fill="#9C4A25"/><path d="M-60,6 L60,6" stroke="#6B2E14" stroke-width="3"/><rect x="-20" y="-26" width="40" height="26" fill="#B5652E"/><rect x="-14" y="-20" width="8" height="8" fill="#3A2418"/><rect x="2" y="-20" width="8" height="8" fill="#3A2418"/><rect x="12" y="-52" width="5" height="28" fill="#7E3418"/></g>`;
      mid = `<path d="M0,${G - 38} H600 V240 H0Z" fill="#E2CA94"/>
        ${ship(170, G - 10, 1.05, -6)}${ship(420, G - 22, 0.75, 5)}
        ${[60, 300, 520].map(x => `<path d="M${x},${G + 20} q8,-24 16,0 M${x + 4},${G + 20} q-8,-18 -14,-4" stroke="#8C9A4A" stroke-width="2.4" fill="none"/>`).join('')}`;
      break;
    }
    case 'port': {
      back = `<rect x="0" y="${G - 70}" width="600" height="80" fill="#3E9ACB"/>`;
      mid = `${[90, 190, 480].map((x, i) => `<path d="M${x - 40},${G - 52 + i * 8} q40,12 80,0 l-8,14 q-32,8 -64,0Z" fill="${['#F2EEE4', '#B8382C', '#3F5FA8'][i]}"/><rect x="${x - 2}" y="${G - 92 + i * 8}" width="3" height="40" fill="#5A3A1C"/>`).join('')}
        <path d="M0,${G - 10} H600 V240 H0Z" fill="#8C6A42"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 52}" y="${G - 10}" width="4" height="40" fill="#5A3A1C"/>`).join('')}
        <path d="M360,${G - 12} q30,-30 60,0Z" fill="#9AA3AD"/>
        <path d="M230,70 q8,-6 16,0 q8,-6 16,0 M330,50 q6,-5 12,0 q6,-5 12,0" stroke="#fff" stroke-width="2.4" fill="none"/>`;
      break;
    }
    case 'chalk': {
      back = `<rect x="0" y="${G - 30}" width="600" height="40" fill="#E7D9BC"/>`;
      const cliff = (x, w, top) => `<path d="M${x},${G} L${x + 12},${top} L${x + w - 12},${top} L${x + w},${G}Z" fill="#F4EEE2"/>${[1, 2, 3, 4].map(i => `<path d="M${x + 6},${top + i * 22} H${x + w - 6}" stroke="${i % 2 ? '#E2B9A0' : '#D9CBB0'}" stroke-width="5"/>`).join('')}<path d="M${x + 12},${top} L${x + w - 12},${top} L${x + w - 18},${top + 6} L${x + 18},${top + 6}Z" fill="#C9B898"/>`;
      mid = `${cliff(20, 160, 80)}${cliff(420, 170, 70)}
        <path d="M250,${G} L264,60 L278,${G}Z" fill="#F4EEE2"/><path d="M300,${G} L318,72 L334,${G}Z" fill="#EEE5D5"/>
        <path d="M256,140 h18 M304,150 h24" stroke="#E2B9A0" stroke-width="5"/>`;
      front = `<g transform="translate(120,224)" stroke="#8C7A5A" stroke-width="2" fill="none"><path d="M0,0 m-10,0 a10,10 0 1,1 20,0 a7,7 0 1,1 -14,0 a4,4 0 1,1 8,0"/></g>`;
      break;
    }
    case 'ocean': {
      return `<svg class="scene-svg" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FB6D8"/><stop offset="1" stop-color="#14466E"/></linearGradient></defs>
        <rect width="600" height="240" fill="url(#${id}o)"/>
        ${[0, 1, 2, 3, 4].map(i => `<path d="M${60 + i * 120},0 L${100 + i * 120},240" stroke="#BDEBF7" stroke-width="22" opacity=".08"/>`).join('')}
        <path d="M0,214 Q150,196 300,212 Q450,226 600,206 V240 H0Z" fill="#E8E2CF"/>
        ${[[160, 90, 1.2], [380, 60, 0.9], [470, 140, 0.7]].map(([x, y, s]) => `<g class="ammo" transform="translate(${x},${y}) scale(${s})"><path d="M0,0 m-22,0 a22,22 0 1,1 44,0 a16,16 0 1,1 -32,0 a10,10 0 1,1 20,0 a5,5 0 1,1 -10,0" fill="#E6C88E" stroke="#9C7A4E" stroke-width="2.4"/><path d="M-22,0 q-12,6 -18,18 M-22,4 q-8,10 -10,20 M-22,-2 q-14,2 -22,10" stroke="#E6A0A0" stroke-width="2.4" fill="none"/></g>`).join('')}
        ${Array.from({ length: 12 }, (_, i) => `<circle class="bubble" cx="${30 + i * 48}" cy="${200 - (i * 37) % 160}" r="${2 + i % 3}" fill="none" stroke="#DFF5FB" stroke-width="1.4" style="animation-delay:${(i % 5) * 0.6}s"/>`).join('')}
        ${[80, 260, 520].map(x => `<path d="M${x},214 q-4,-30 4,-50 q6,20 0,50" fill="#5E8A5A"/>`).join('')}
      </svg>`;
    }
    case 'camp':
    default: {
      back = kind === 'camp' ? mountains(G - 20, t.far, toneName !== 'night', 0.7) : hills(G - 30, t.far);
      mid = `${hills(G, t.ground[0], 8, 2)}${yurt(140, G - 2, 1.2)}${yurt(430, G - 6, 0.9)}${yurt(520, G - 10, 0.7)}${fire(300, G + 6)}
        <g transform="translate(220,${G - 2})"><path d="M0,0 L4,-30 L10,-30 L14,0Z" fill="#3A2418"/></g>`;
      break;
    }
  }

  const stars = toneName === 'night'
    ? Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 53) % 120}" r="${(i % 3) * 0.5 + 0.6}" fill="#fff" opacity="${0.5 + (i % 4) * 0.12}"/>`).join('')
    : '';
  const sunY = toneName === 'night' ? 46 : toneName === 'dusk' ? 120 : 52;

  return `<svg class="scene-svg" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.ground[0]}"/><stop offset="1" stop-color="${t.ground[1]}"/></linearGradient>
    </defs>
    <rect width="600" height="240" fill="url(#${id}s)"/>
    ${stars}
    <circle cx="500" cy="${sunY}" r="26" fill="${t.sun}" opacity=".95"/>
    <circle cx="500" cy="${sunY}" r="40" fill="${t.sun}" opacity=".25"/>
    <g class="sc-clouds" opacity=".85"><path d="M60,58 q10,-18 30,-10 q14,-16 32,0 q16,-2 16,12 H56Z" fill="#fff"/><path d="M300,36 q8,-12 22,-6 q10,-12 24,0 q12,0 12,10 H296Z" fill="#fff" opacity=".8"/></g>
    ${back}
    <rect x="0" y="${G}" width="600" height="${240 - G}" fill="url(#${id}g)"/>
    ${mid}
    ${front}
    ${t.tint ? `<rect width="600" height="240" fill="${t.tint}" opacity=".18" style="mix-blend-mode:multiply"/>` : ''}
  </svg>`;
}

// ── портреты жителей ───────────────────────────────────
export function avatarSVG(type, color = '#3F5FA8') {
  const skin = '#E3B288';
  if (type === 'eagle') {
    return `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="#CDEBF7"/>
      <path d="M14,70 Q20,38 40,30 Q60,38 66,70Z" fill="#6B4A2E"/>
      <path d="M26,70 Q30,48 40,44 Q50,48 54,70Z" fill="#8C6440"/>
      <ellipse cx="40" cy="28" rx="13" ry="14" fill="#C9A06A"/>
      <path d="M40,24 L52,30 Q50,38 42,36Z" fill="#E7A93B"/><path d="M50,32 Q52,36 46,37" fill="#3A2418"/>
      <circle cx="44" cy="23" r="2.6" fill="#1A120D"/><circle cx="44.8" cy="22.2" r=".8" fill="#fff"/>
      <path d="M30,18 Q38,14 48,18" stroke="#8C6440" stroke-width="3" fill="none"/></svg>`;
  }
  const hats = {
    elder: `<path d="M24,26 Q24,8 40,8 Q56,8 56,26Z" fill="#F2EBDD"/><path d="M22,26 H58 L56,22 H24Z" fill="#1A1A1A"/><path d="M40,8 L40,4" stroke="#1A1A1A" stroke-width="2"/>
            <path d="M32,44 Q40,62 48,44" fill="#F4F0E8"/>`,
    kalpak: `<path d="M24,26 Q26,4 40,6 Q54,4 56,26Z" fill="#F2EBDD"/><path d="M22,27 L30,20 L30,27Z M58,27 L50,20 L50,27Z" fill="#1A1A1A"/><path d="M32,12 Q40,16 48,12" stroke="#A8322A" stroke-width="1.6" fill="none"/>`,
    borik: `<path d="M26,24 Q26,8 40,8 Q54,8 54,24Z" fill="#A8322A"/><rect x="23" y="20" width="34" height="8" rx="4" fill="#6B4A2E"/>`,
    cap: `<path d="M25,24 Q26,10 40,10 Q54,10 55,24Z" fill="${color}"/><path d="M40,22 H62 Q60,26 52,26 H40Z" fill="${color}" opacity=".85"/>`,
    scarf: `<path d="M22,30 Q20,8 40,8 Q60,8 58,30 Q56,22 40,20 Q24,22 22,30Z" fill="#1A1A1A"/><path d="M24,14 Q40,4 56,14 L54,18 Q40,10 26,18Z" fill="${color}"/><circle cx="40" cy="9" r="2" fill="#E7A93B"/>`,
    kimeshek: `<path d="M20,46 Q16,12 40,8 Q64,12 60,46 Q56,40 54,30 Q52,18 40,18 Q28,18 26,30 Q24,40 20,46Z" fill="#F6F2EA"/><path d="M26,14 Q40,4 54,14 L52,20 Q40,12 28,20Z" fill="#F6F2EA" stroke="#D8CDBA"/><path d="M30,56 Q40,62 50,56" stroke="#E7A93B" stroke-width="2.4" fill="none"/>`,
  };
  const body = `<path d="M12,80 Q14,56 40,52 Q66,56 68,80Z" fill="${type === 'elder' ? '#4A3A2A' : color}"/><path d="M40,54 L40,80" stroke="#E7A93B" stroke-width="2"/>`;
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="#F4E3C1"/>
    ${body}<circle cx="40" cy="34" r="15" fill="${skin}"/>
    <circle cx="35" cy="34" r="1.6" fill="#2B1A12"/><circle cx="45" cy="34" r="1.6" fill="#2B1A12"/>
    <path d="M35,41 Q40,44 45,41" stroke="#8C4A2E" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="31" cy="39" r="2.6" fill="#E89A7A" opacity=".5"/><circle cx="49" cy="39" r="2.6" fill="#E89A7A" opacity=".5"/>
    ${hats[type] || hats.kalpak}</svg>`;
}

// ── артефакты: тұмар (треугольный оберег) со знаком ──────
export function artifactSVG(glyph, color = '#1C9AA0', size = 64) {
  const g = {
    tile: `<rect x="-11" y="-11" width="22" height="22" rx="2" fill="${color}"/><path d="M0,-8 L8,0 L0,8 L-8,0Z" fill="#F4E3C1"/><circle r="2.4" fill="${color}"/>`,
    coin: `<circle r="12" fill="${color}" stroke="#7A5A2E" stroke-width="1.6"/><rect x="-3.5" y="-3.5" width="7" height="7" fill="#F4E3C1"/><circle r="8.5" fill="none" stroke="#F4E3C1" stroke-width=".8" stroke-dasharray="2 2"/>`,
    terracotta: `<rect x="-11" y="-11" width="22" height="22" rx="1" fill="${color}"/><path d="M-11,0 H11 M0,-11 V11 M-11,-11 L11,11 M11,-11 L-11,11" stroke="#7E3A18" stroke-width="1.4"/><circle r="4" fill="${color}" stroke="#7E3A18" stroke-width="1.4"/>`,
    sun: `<circle r="6" fill="${color}"/>${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${Math.cos(a) * 8},${Math.sin(a) * 8} L${Math.cos(a) * 13},${Math.sin(a) * 13}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}`,
    plaque: `<path d="M-12,8 Q-10,-4 0,-4 Q8,-4 10,6 L12,8Z" fill="${color}"/><path d="M4,-4 Q2,-14 10,-14 Q14,-10 8,-8" stroke="${color}" stroke-width="2.4" fill="none"/><path d="M-6,8 v4 M6,8 v4" stroke="${color}" stroke-width="2.4"/>`,
    seed: `<path d="M-2,10 Q-12,-4 2,-13 Q8,-4 2,10Z" fill="${color}"/><ellipse cx="0" cy="8" rx="3" ry="4" fill="#5A3A1C"/>`,
    sand: `<path d="M-10,10 Q-12,-2 -4,-6 L-4,-10 H4 V-6 Q12,-2 10,10Z" fill="${color}"/><path d="M-6,-10 H6" stroke="#6B4A2E" stroke-width="2"/>${[[-4, 4], [2, 2], [4, 7], [-1, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#F4E3C1"/>`).join('')}`,
    drop: `<path d="M-7,-2 Q-7,-12 -7,-12 Q-14,0 -7,6 Q0,0 -7,-12Z" fill="#4FAFD0"/><path d="M7,-6 Q0,6 7,12 Q14,6 7,-6Z" fill="#3D9A8C"/>`,
    feather: `<path d="M-8,12 Q-6,-6 10,-14 Q4,4 -8,12Z" fill="${color}"/><path d="M-8,12 L8,-12" stroke="#F4E3C1" stroke-width="1.2"/>`,
    arrow: `<path d="M-12,12 L10,-10" stroke="#6B4A2E" stroke-width="2.4"/><path d="M10,-10 L4,-10 L12,-14 L10,-4Z" fill="#9AA3AD"/><path d="M-12,12 l-2,-6 l6,2Z M-9,9 l-2,-6 l6,2Z" fill="${color}"/>`,
    string: `<path d="M-12,-2 Q-6,-12 0,-2 T12,-2" stroke="${color}" stroke-width="2.4" fill="none"/><path d="M-6,6 Q-2,0 4,4 Q8,8 4,12 Q-2,14 -6,6Z" fill="#B87333"/>`,
    shell: `<path d="M-12,8 Q-12,-10 0,-12 Q12,-10 12,8Z" fill="${color}"/>${[-8, -4, 0, 4, 8].map(x => `<path d="M0,10 L${x},-9" stroke="#F4E3C1" stroke-width="1.2"/>`).join('')}`,
    ammonite: `<path d="M0,0 m-12,0 a12,12 0 1,1 24,0 a9,9 0 1,1 -18,0 a6,6 0 1,1 12,0 a3,3 0 1,1 -6,0" fill="${color}" stroke="#6B5A3A" stroke-width="1.8"/>`,
  }[glyph] || '';
  return `<svg class="tumar" width="${size}" height="${size}" viewBox="-32 -34 64 64" aria-hidden="true">
    <path d="M0,-30 L28,22 L-28,22Z" fill="#F4E3C1" stroke="#A8322A" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0,-21 L20,16 L-20,16Z" fill="none" stroke="#E7A93B" stroke-width="1.4" stroke-dasharray="3 2"/>
    <g transform="translate(0,4) scale(.78)">${g}</g>
    <path d="M-6,-30 Q0,-40 6,-30" stroke="#A8322A" stroke-width="2" fill="none"/>
  </svg>`;
}

// Камень памяти (до прикосновения)
export function stoneSVG(color = '#1C9AA0') {
  return `<svg class="stone" viewBox="0 0 200 160" aria-hidden="true">
    <defs><radialGradient id="stoneGlow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="stone-glow" cx="100" cy="86" rx="90" ry="70" fill="url(#stoneGlow)"/>
    <ellipse cx="100" cy="146" rx="60" ry="9" fill="#2B2350" opacity=".25"/>
    <path d="M52,140 Q40,92 70,56 Q100,26 132,50 Q162,80 150,140Z" fill="#5E5A6E"/>
    <path d="M70,56 Q100,26 132,50 Q118,48 104,58 Q86,70 70,56Z" fill="#7A768C"/>
    <g class="stone-rune" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M100,124 V92"/>
      <path d="M100,100 Q80,74 66,88 Q56,102 70,108 Q80,110 80,100"/>
      <path d="M100,100 Q120,74 134,88 Q144,102 130,108 Q120,110 120,100"/>
    </g>
  </svg>`;
}
