// Вступительный фильм (около 30 секунд): жизнь и путь героя в шести кадрах,
// а поверх — сказ-жыр о нём. Имя, облик, конь и путь берутся из созданного героя.
import { Stage } from './stage.js';
import { RIGS, heroRig } from './story.js';
import { isGirl } from './visit.js';
import { heroSVG, COATS } from './hero.js';
import { eagle as eagleSprite } from './sprites.js';
import { SW, SH } from './backdrop.js';
import * as audio from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SHOT = 4600;

// ── сказ о герое ──────────────────────────────────────
function verses(h) {
  const girl = isGirl(h), g = (m, f) => (girl ? f : m);
  const name = h.name || 'жолаушы';
  const coat = (COATS[h.coat] || COATS.tory).ru;
  return [
    `Ерте, ерте, ертеде… Когда степь была молодой, а небо — без края, в белой юрте у подножия Казыгурта ${g('родился', 'родилась')} ${name}.`,
    `${g('Он', 'Она')} ${g('рос', 'росла')} под звон домбры и шёпот ковыля, а дед Сапар рассказывал ${g('ему', 'ей')} о батырах, мудрецах и тайнах Великой степи.`,
    h.type === 'batyr'
      ? `Год за годом крепла рука: ${name} ${g('учился', 'училась')} держать копьё и щит и не отступать перед бурей.`
      : `Год за годом ${name} ${g('учился', 'училась')} слушать: песню домбры, голоса птиц и дорогу звёзд.`,
    `Однажды из табуна вышел ${coat} конь — и с тех пор они не расставались. Нет друга вернее в долгой дороге.`,
    'Над ними кружил беркут Қыран, чьи глаза видят всю степь. Так начался путь, о котором сложат жыр.',
    `Теперь ${name} на вершине Казыгурта. Тринадцать камней памяти ждут ${g('его', 'её')}. Жолың болсын, ${h.type === 'batyr' ? 'батыр' : 'жиһанкез'}!`,
  ];
}

// ── персонажи фильма ──────────────────────────────────
const MOM = { age: 'adult', sex: 'f', skin: '#E3B288', hair: '#24150D', hairStyle: 'braids', hat: { type: 'kimeshek' }, outfit: { type: 'dress', color: '#2E6A9A', trim: '#E7A93B', inner: '#F7F2E6', skirt: '#24486A' }, mood: 'kind' };
const BABY = '<g transform="translate(-20,-16)"><ellipse cx="20" cy="12" rx="21" ry="11" fill="#F7F2E6" stroke="#C9B88A" stroke-width="1.2"/><path d="M4,12 C10,6 26,6 34,10" stroke="#B8382C" stroke-width="2.4" fill="none"/><circle cx="35" cy="8" r="7" fill="#E8B48C" stroke="#B87B55" stroke-width=".8"/><path d="M31,4 Q36,-1 41,5" stroke="#F7F2E6" stroke-width="3" fill="none"/><path d="M33,9 h1.6 M37,9 h1.6" stroke="#5A3A22" stroke-width="1" stroke-linecap="round"/></g>';
const child = (h) => ({ ...heroRig(h), age: 'child', hat: { type: 'takiya', color: isGirl(h) ? '#B8382C' : '#2E6A9A', trim: '#F4E3C1' }, outfit: { type: 'chapan', color: h.type === 'batyr' ? '#3A5BA6' : '#B8382C', trim: '#E7A93B', inner: '#F4EFE4', pants: '#3A2A20' }, back: undefined, chest: undefined, mood: 'happy' });

// камера: медленный наезд или проезд за время кадра
const camT = (z, x, y) => `translate(${((x / SW) * (1 - z) * 100).toFixed(2)}%,${((y / SH) * (1 - z) * 100).toFixed(2)}%) scale(${z})`;
function kenBurns(st, a, b, ms) {
  const c = st.cam;
  c.style.transition = 'none';
  c.style.transform = camT(...a);
  void c.offsetWidth;
  c.style.transition = `transform ${ms}ms cubic-bezier(.35,0,.45,1)`;
  c.style.transform = camT(...b);
}

// беззвучный разговор: губы двигаются, пока персонаж рассказывает
function mumble(p, ms) {
  const V = [[0.8, 1.05, 0.1], [0.5, 0.8, 0.8], [0.3, 1.15, 0], [0, 0.95, 0.05], [0.6, 1, 0.2], [0.04, 1, 0]];
  p.talk(true);
  const id = setInterval(() => p.setViseme(V[Math.floor(Math.random() * V.length)]), 95);
  setTimeout(() => { clearInterval(id); p.talk(false); }, ms);
}

// ── закатная скачка: силуэты на фоне солнца ───────────
function hillsPath(base, amp, n, seed) {
  const hs = Array.from({ length: n }, (_, i) => base - amp * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.9 + seed))));
  const step = 960 / n;
  let d = `M0,${SH + 10} L0,${hs[0].toFixed(1)}`;
  for (let k = 0; k < n * 2; k++) {
    const x = (k + 1) * step, y = hs[(k + 1) % n];
    d += ` Q${(x - step / 2).toFixed(1)},${(Math.min(y, hs[k % n]) - amp * 0.35).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d} L1920,${SH + 10}Z`;
}
function sunsetSVG() {
  const grass = Array.from({ length: 64 }, (_, i) => { const x = i * 30 + (i % 3) * 7; return `<path d="M${x},458 q3,-16 7,-22 M${x + 6},458 q1,-12 -4,-18 M${x + 10},458 q4,-10 9,-13" stroke="#1B0C24" stroke-width="2.2" fill="none"/>`; }).join('');
  return `<svg viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="fsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2160"/><stop offset=".45" stop-color="#C2496A"/><stop offset=".8" stop-color="#F59A5A"/><stop offset="1" stop-color="#FFD58A"/></linearGradient>
      <radialGradient id="fsSun"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".55" stop-color="#FFE29A"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${SW}" height="${SH}" fill="url(#fsSky)"/>
    <circle cx="620" cy="350" r="230" fill="url(#fsSun)" opacity=".55"/>
    <circle cx="620" cy="350" r="96" fill="#FFF0C2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${120 + i * 180},${90 + (i % 2) * 40} q60,-14 130,0" stroke="#FFD9B0" stroke-width="3" fill="none" opacity=".35"/>`).join('')}
    <g class="fs-layer fs-far"><path d="${hillsPath(372, 120, 6, 0.4)}" fill="#8A4570"/></g>
    <g class="fs-layer fs-mid"><path d="${hillsPath(410, 70, 8, 2.1)}" fill="#55264E"/></g>
    <g class="fs-layer fs-near"><path d="M0,458 L1920,458 L1920,560 L0,560Z" fill="#1B0C24"/>${grass}</g>
  </svg>`;
}

// ── сам фильм ─────────────────────────────────────────
export function playFilm(hero) {
  return new Promise((resolve) => {
    const lines = verses(hero);
    const root = document.createElement('div');
    root.className = 'film';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Вступление: сказ о герое');
    root.innerHTML = `
      <div class="film-frame">
        <div class="film-stage"></div>
        <div class="film-sil">${sunsetSVG()}
          <div class="fs-dust"><i></i><i></i><i></i><i></i></div>
          <div class="fs-rider">${heroSVG(hero, 'run')}</div>
          <div class="fs-eagle">${eagleSprite('flap')}</div>
        </div>
        <div class="film-lights">${Array.from({ length: 13 }, (_, i) => `<i style="left:${46 + i * 4 + (i % 2) * 1.5}%;top:${55 + Math.sin(i * 1.7) * 3}%;animation-delay:${(i * 0.13).toFixed(2)}s,${(i * 0.13 + 1.2).toFixed(2)}s"></i>`).join('')}</div>
        <div class="film-vignette"></div>
        <div class="film-bar top"></div><div class="film-bar bottom"></div>
        <p class="film-text" aria-live="polite"></p>
        <div class="film-title"><b>Тұран жолы</b><span>Путь начинается</span></div>
      </div>
      <button class="film-skip">Пропустить ›</button>`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s);
    const st = new Stage($('.film-stage'), { kind: 'camp', tone: 'night', speed: 'instant' });
    st.fadeEl.classList.add('on');
    const text = $('.film-text');
    let done = false, typer = 0;

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(typer);
      document.removeEventListener('keydown', onKey, true);
      root.classList.add('out');
      setTimeout(() => { root.remove(); resolve(); }, reduced() ? 50 : 650);
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); finish(); } };
    document.addEventListener('keydown', onKey, true);
    $('.film-skip').addEventListener('click', () => { audio.sfx.click(); finish(); });
    setTimeout(() => $('.film-skip').focus({ preventScroll: true }), 80);

    // строка сказа пишется буква за буквой
    const write = (t, ms) => {
      clearInterval(typer);
      text.classList.remove('fade');
      text.innerHTML = '<span></span><i class="q"></i>';
      const span = text.firstChild;
      if (reduced()) { span.textContent = t; return; }
      let k = 0;
      const every = Math.max(14, ms / t.length);
      typer = setInterval(() => {
        k += 1; span.textContent = t.slice(0, k);
        if (k >= t.length) { clearInterval(typer); text.lastChild.remove(); }
      }, every);
    };
    const cut = async (fn) => {
      if (done) return;
      await st.fade(true, 420);
      if (done) return;
      st.clearActors();
      fn();
      await st.fade(false, 520);
    };

    const shots = [
      // 1. ночь рождения: мать поднимает младенца к небу
      async () => {
        await cut(() => {
          st.setScene('camp', { tone: 'night' });
          const mom = st.addPerson('mom', MOM, 600, -1);
          mom.hold('gift', 1, BABY); mom.pose('hold'); mom.look({ x: 560, y: 260 });
          const ata = st.addPerson('ata', RIGS.sapar, 770, -1);
          ata.look(mom);
          kenBurns(st, [1, 480, 300], [1.2, 620, 300], SHOT + 600);
        });
        write(lines[0], 3400);
        await wait(1500); if (done) return;
        const mom = st.get('mom'), ata = st.get('ata');
        mom.pose('present'); mom.look({ x: 640, y: 40 }); mom.emote('happy', 4);
        await wait(700); if (done) return;
        ata.pose('heart'); ata.gesture('bow'); ata.emote('happy', 3);
        $('.film-frame').classList.add('star');
      },
      // 2. детство: дед рассказывает, ребёнок слушает
      async () => {
        $('.film-frame').classList.remove('star');
        await cut(() => {
          st.setScene('kazygurt', {});
          const kid = st.addPerson('kid', child(hero), 360, 1);
          const ata = st.addPerson('ata', RIGS.sapar, 560, -1);
          kid.look(ata); ata.look(kid);
          ata.pose('explain');
          kenBurns(st, [1.12, 260, 300], [1.12, 680, 300], SHOT + 600);
        });
        write(lines[1], 3500);
        const kid = st.get('kid'), ata = st.get('ata');
        mumble(ata, 3200);
        await wait(1100); if (done) return;
        kid.gesture('nod'); kid.emote('surprised', 1);
        ata.pose('point', { at: { x: 600, y: 300 } }); ata.look({ x: 600, y: 300 }); kid.look({ x: 600, y: 300 });
        await wait(1500); if (done) return;
        ata.pose('explain'); ata.look(kid); kid.look(ata);
        kid.gesture('jump'); kid.emote('laugh', 2);
      },
      // 3. юность: копьё батыра или домбра жиһанкеза
      async () => {
        const batyr = hero.type === 'batyr';
        await cut(() => {
          st.setScene('ulytau', {});
          if (batyr) {
            const h = st.addPerson('hero', heroRig(hero), 420, 1);
            h.hold('staff', 1); h.pose('staff'); h.emote('serious', 5);
            const ata = st.addPerson('ata', RIGS.sapar, 690, -1); ata.look(h);
          } else {
            const h = st.addPerson('hero', { ...heroRig(hero), chest: 'dombra', back: undefined }, 400, 1);
            h.pose('play'); h.emote('happy', 5);
            const a = st.addPerson('kid1', RIGS.nurbol, 590, -1), b = st.addPerson('kid2', RIGS.ayaru, 670, -1);
            const ata = st.addPerson('ata', RIGS.sapar, 790, -1);
            [a, b, ata].forEach((p) => p.look(h));
          }
          kenBurns(st, [1, 480, 280], [1.16, 450, 300], SHOT + 600);
        });
        write(lines[2], 3300);
        const h = st.get('hero');
        if (batyr) {
          for (const p of ['cheer', 'point', 'staff', 'cheer']) {
            await wait(900); if (done) return;
            h.pose(p, { at: { x: 900, y: 260 } }); h.look({ x: 900, y: 260 }); h.gesture(p === 'cheer' ? 'stomp' : 'beat');
          }
          st.get('ata')?.gesture('nod2'); st.get('ata')?.emote('proud', 3);
        } else {
          for (let i = 0; i < 3; i++) {
            await wait(1100); if (done) return;
            st.get('kid1')?.gesture('nod'); st.get('kid2')?.gesture(i === 2 ? 'jump' : 'nod2'); st.get('ata')?.gesture('nod');
          }
          st.get('kid2')?.emote('laugh', 2); st.get('ata')?.emote('proud', 3);
        }
      },
      // 4. встреча с конём
      async () => {
        await cut(() => {
          st.setScene('aisha', {});
          st.addHorse(hero.coat || 'tory', 660, -1);
          const h = st.addPerson('hero', heroRig(hero), 200, 1);
          h.look(st.horse);
          kenBurns(st, [1.04, 420, 300], [1.2, 520, 320], SHOT + 600);
        });
        write(lines[3], 3300);
        const h = st.get('hero');
        st.horse.toss();
        await st.walk('hero', 440, 115); if (done) return;
        h.pose('reach'); h.emote('surprised', 0.8);
        st.horse.nuzzle(2);
        await wait(800); if (done) return;
        h.pose('heart'); h.emote('happy', 3); h.gesture('laugh');
      },
      // 5. скачка на закате, над героем — беркут
      async () => {
        $('.film-sil').classList.add('on');
        write(lines[4], 3300);
        await wait(SHOT - 400);
      },
      // 6. рассвет на Казыгурте: беркут садится, вдали загораются тринадцать камней
      async () => {
        st.clearActors();
        st.setScene('kazygurt', { tone: 'dusk' });
        st.addHorse(hero.coat || 'tory', 210, 1);
        const h = st.addPerson('hero', heroRig(hero), 410, 1);
        h.look({ x: 900, y: 300 }); h.pose('hips');
        st.addEagle(1040, 40, -1);
        st.eagle.setSpread(true);
        kenBurns(st, [1.25, 420, 300], [1, 480, 280], SHOT + 1600);
        $('.film-sil').classList.remove('on');
        write(lines[5], 3400);
        await wait(700); if (done) return;
        st.eagle.flyTo(212, 322, 2.2, 120).then(() => { if (st.eagle) st.eagle.face = 1; });
        h.look(st.eagle);
        await wait(1500); if (done) return;
        $('.film-lights').classList.add('on');
        h.look({ x: 900, y: 300 }); h.pose('wave'); h.emote('happy', 4);
        await wait(1600); if (done) return;
        h.pose('hips');
        $('.film-title').classList.add('on');
        await wait(2400);
      },
    ];

    (async () => {
      await wait(250);
      for (let i = 0; i < shots.length && !done; i++) {
        const t0 = performance.now();
        await shots[i]();
        const left = SHOT - (performance.now() - t0);
        if (left > 0 && i < shots.length - 1) await wait(left);
        if (!done && i < shots.length - 1) text.classList.add('fade');
      }
      finish();
    })();
  });
}
