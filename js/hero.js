// Герой на коне — оригинальная SVG-иллюстрация. Смотрит вправо, viewBox 0 0 120 110.

export const COATS = {
  tory:  { name: 'Торы',  ru: 'гнедой',          body: '#8E4B2A', dark: '#2B1A12', light: '#B0693F' },
  kula:  { name: 'Құла',  ru: 'буланый',         body: '#D3A35F', dark: '#5A3A1C', light: '#E8C48A' },
  akboz: { name: 'Ақбоз', ru: 'серый в белизну', body: '#E9E4DA', dark: '#9A9286', light: '#FFFFFF' },
};

export const HERO_TYPES = {
  batyr:  { name: 'Батыр', about: 'Воин в шлеме-дулыге, с копьём и щитом. Смелый и сильный.', defaultName: 'Ер Тұран' },
  sayahat: { name: 'Жиһанкез', about: 'Путешественник в бөріке, с домброй за спиной. Любопытный и весёлый.', defaultName: 'Сапаргүл' },
};

export function heroMarkup({ type = 'batyr', coat = 'tory' } = {}) {
  const c = COATS[coat] || COATS.tory;
  const isBatyr = type === 'batyr';
  const coatColor = isBatyr ? '#3A5BA6' : '#B8382C';
  const trim = '#E7A93B';
  const skin = '#E3B288';

  const leg = (cls, x, fill) => `
    <g class="leg ${cls}">
      <rect x="${x}" y="60" width="6.5" height="27" rx="3" fill="${fill}"/>
      <rect x="${x - 0.5}" y="84" width="7.5" height="6" rx="2" fill="${c.dark}"/>
    </g>`;

  const spear = isBatyr ? `
    <g class="spear">
      <line x1="40" y1="70" x2="74" y2="-6" stroke="#6B4A2E" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M72.5,-3 L77,-14 L76,-1Z" fill="#C8CED6" stroke="#7C858F" stroke-width=".6"/>
      <path class="pennant" d="M71.5,2 L88,5 L74,11 L70.5,8Z" fill="#1C9AA0"/>
      <path d="M71,4 L80,5.5 L72,8.5Z" fill="#E7A93B"/>
    </g>` : '';

  const back = isBatyr
    ? `<circle cx="51" cy="40" r="8.5" fill="#8C5A2B" stroke="${trim}" stroke-width="2"/><circle cx="51" cy="40" r="2.2" fill="${trim}"/>`
    : `<g class="dombra"><path d="M38,30 L52,16" stroke="#6B3E1F" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M44,40 C36,44 30,36 34,30 C37,26 44,28 47,34 C48,37 47,39 44,40Z" fill="#B87333" stroke="#6B3E1F" stroke-width="1"/>
        <circle cx="40" cy="34" r="1.6" fill="#4A2A12"/></g>
       <g class="korzhyn"><rect x="27" y="47" width="14" height="13" rx="3" fill="#A8322A"/><path d="M29,52 h10 M29,56 h10" stroke="${trim}" stroke-width="1.2"/></g>`;

  const hat = isBatyr
    ? `<path d="M50.5,18.5 Q50,7 58,5.5 Q66,7 65.5,18.5Z" fill="#AEB6BF" stroke="#6E7781" stroke-width=".8"/>
       <line x1="58" y1="5.5" x2="58" y2="-1" stroke="#6E7781" stroke-width="1.6"/>
       <path d="M58,-1 Q53,-4 55,-8 Q58,-4 58,-1Z" fill="#B8382C"/>
       <path d="M50.5,17 L50.5,25 Q53,28 55,27 L55,18Z" fill="#8F98A2"/>
       <rect x="50" y="16.5" width="16" height="2.6" rx="1.3" fill="${trim}"/>`
    : `<path d="M50.5,17.5 Q51,7 58,6.5 Q65,7 65.5,17.5Z" fill="#B8382C"/>
       <rect x="49.5" y="14.5" width="17" height="5.5" rx="2.7" fill="#6B4A2E"/>
       <path d="M58,7 Q56,1 59,-3 Q60,2 58,7Z" fill="#FFFFFF" stroke="#D8D2C6" stroke-width=".6"/>
       <path d="M58.3,6 Q61,1 63,-1 Q61.5,3 58.3,6Z" fill="#F4F0E8"/>`;

  return `
  <g class="hero-art">
    <ellipse class="hero-shadow" cx="60" cy="93" rx="34" ry="5" fill="#2B2350" opacity=".22"/>
    <g class="hero-body">
      <path class="tail" d="M31,50 C16,51 11,66 15,82 C20,72 26,64 35,58Z" fill="${c.dark}"/>
      ${leg('leg-b2', 36, c.dark)}
      ${leg('leg-f2', 79, c.dark)}
      ${spear}
      <ellipse cx="57" cy="57" rx="29" ry="14.5" fill="${c.body}"/>
      <ellipse cx="55" cy="62" rx="20" ry="6" fill="${c.light}" opacity=".45"/>
      ${leg('leg-b1', 42, c.body)}
      ${leg('leg-f1', 73, c.body)}
      <g class="head">
        <path d="M73,50 L82,25 Q86,20 92,21 L96,33 L88,58Z" fill="${c.body}"/>
        <path d="M83,24 Q92,15 100,21 L111,33 Q114,40 107,41 L97,37 Q91,35 88,33Z" fill="${c.body}"/>
        <path d="M89,21 L91,12 L95,20Z" fill="${c.body}" stroke="${c.dark}" stroke-width=".8"/>
        <path d="M83,23 Q76,34 72,50 L79,50 Q81,38 88,26Z" fill="${c.dark}"/>
        <circle cx="98" cy="27" r="1.8" fill="#1A120D"/>
        <circle cx="108.5" cy="37" r="1.2" fill="#1A120D" opacity=".6"/>
        <path d="M90,25 L106,38" stroke="#5A2E18" stroke-width="1.2"/>
      </g>
      <path d="M45,45 L71,45 L69,64 L47,64Z" fill="#1C9AA0"/>
      <path d="M47,60 L69,60" stroke="${trim}" stroke-width="2" stroke-dasharray="3 2"/>
      <path d="M48,48 L68,48" stroke="${trim}" stroke-width="1.2"/>
      ${back}
      <g class="rider">
        <path d="M56,48 L59,67 L66,69 L66,64 L62,62 L61,48Z" fill="#3A2418"/>
        <path d="M48,51 Q49,30 55,25 L62,25 Q68,31 68,51Z" fill="${coatColor}"/>
        <path d="M58.5,26 L58.5,51" stroke="${trim}" stroke-width="1.4"/>
        <rect x="48.5" y="40" width="19.5" height="3.6" rx="1.5" fill="#6B4A2E"/>
        <circle cx="58.5" cy="41.8" r="1.6" fill="${trim}"/>
        <path d="M62,31 Q70,36 77,39" stroke="${coatColor}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <circle cx="77.5" cy="39.5" r="2.6" fill="${skin}"/>
        <path d="M78,39 L96,31" stroke="#3A2418" stroke-width=".9"/>
        <circle cx="58" cy="19.5" r="7" fill="${skin}"/>
        <circle cx="61.6" cy="19" r="1" fill="#2B1A12"/>
        <path d="M60,23 Q62,24 63.5,22.6" stroke="#8C4A2E" stroke-width=".8" fill="none"/>
        ${hat}
      </g>
    </g>
  </g>`;
}

export function heroSVG(opts, cls = '') {
  return `<svg class="hero ${cls}" viewBox="-4 -16 128 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${heroMarkup(opts)}</svg>`;
}
