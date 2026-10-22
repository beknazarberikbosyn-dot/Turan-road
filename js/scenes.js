// Тұмары (обереги-артефакты) и камень памяти — всё нарисовано в SVG.

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
