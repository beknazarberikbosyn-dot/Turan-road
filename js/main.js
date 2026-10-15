import { LOCS, START, INTRO, ENDING, CATS, GUIDE, EAGLE } from './data.js';
import * as audio from './audio.js';
import { MapView, P, locXY } from './map.js';
import { heroSVG, COATS, HERO_TYPES } from './hero.js';
import { sceneSVG, avatarSVG, artifactSVG, stoneSVG } from './scenes.js';
import { playGame, GAME_NAMES } from './games.js';

// ── состояние ─────────────────────────────────────────
const KEY = 'turanroad.v1';
const defaults = () => ({
  hero: null, introSeen: false, endingSeen: false, completed: [], pos: 'start', stars: {},
  settings: { bright: 1, music: 0.6, sfx: 0.8, speed: 'normal' },
});
let S = load();
function load() {
  try { const raw = JSON.parse(localStorage.getItem(KEY)); if (raw) return { ...defaults(), ...raw, settings: { ...defaults().settings, ...raw.settings } }; } catch (e) { /* пусто */ }
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* приватный режим */ } }

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reveal = (el) => { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); };
const fill = (t) => t.replace(/\{name\}/g, esc(S.hero?.name || 'жолаушы'));

const world = $('#world'), menu = $('#menu'), hud = $('#hud'), overlay = $('#overlay'), portal = $('#portal');
const map = new MapView($('#map'));

// ── настройки ─────────────────────────────────────────
function applySettings() {
  document.documentElement.style.setProperty('--bright', S.settings.bright);
  audio.setMusicVolume(S.settings.music);
  audio.setSfxVolume(S.settings.sfx);
}
applySettings();

// первое касание включает звук (так требуют браузеры)
let theme = 'menu';
const wake = () => { audio.unlockAudio(); audio.playTheme(theme); };
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, wake, { once: false, passive: true }));
function music(name) { theme = name; audio.playTheme(name); }

document.addEventListener('pointerover', (e) => { if (e.target.closest?.('.plank, .btn')) audio.sfx.hover(); });

// ── доступность точек: после первой открыта вся степь ──
const isFree = () => S.completed.includes(LOCS[0].id);
const isOpen = (id) => id === LOCS[0].id || isFree() || S.completed.includes(id);
const gameName = (l) => (l.game.type === 'snap' && l.game.mode === 'fish' ? GAME_NAMES.fish : GAME_NAMES[l.game.type]);
const starsHTML = (n = 0) => `<span class="stars-mini" aria-label="${n} из 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

// ── герой на карте ────────────────────────────────────
function heroPos() {
  if (S.pos === 'start') return P(START.lat, START.lon);
  const l = LOCS.find((x) => x.id === S.pos);
  return l ? locXY(l) : P(START.lat, START.lon);
}
function refreshMap() {
  map.render(START, LOCS, S);
  map.setHero(S.hero || { type: 'batyr', coat: 'tory' });
  const [x, y] = heroPos();
  map.placeHero(x, y, map.hero.dir || 1);
  renderHud();
}
refreshMap();
map.startLife();
map.setMenu(false);
renderMenuHero();

function renderMenuHero() {
  $('#menuHero').innerHTML = heroSVG(S.hero || { type: 'batyr', coat: 'tory' }, 'idle');
  $('#btnPlay').textContent = S.hero ? 'Продолжить' : 'Играть';
}

// ── HUD ───────────────────────────────────────────────
function renderHud() {
  const done = new Set(S.completed);
  $('#hudName').textContent = S.hero ? S.hero.name : '';
  $('#hudSub').textContent = S.hero ? `${HERO_TYPES[S.hero.type].name}, конь ${COATS[S.hero.coat].name}` : '';
  $('#hudAvatar').innerHTML = heroSVG(S.hero || { type: 'batyr', coat: 'tory' });
  $('#hudStones').innerHTML = LOCS.map((l) => `<span class="st ${done.has(l.id) ? 'on' : ''}" style="--c:${l.artifact.color}" title="${l.artifact.name}"></span>`).join('');
  $('#hudCount').textContent = `${done.size} из ${LOCS.length}`;
  const left = LOCS.length - done.size;
  $('#hudHint').textContent = !isFree() ? `Первая точка: ${LOCS[0].name}. Нажми на неё на карте.`
    : left ? `Выбери на карте любую точку — осталось камней: ${left}.` : 'Все камни собраны! Можно вернуться в любую точку.';
}

// ── всплывающее сообщение ─────────────────────────────
let toastT;
function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400);
}

// ── окна ──────────────────────────────────────────────
let modalClose = null;
function openModal(html, { cls = '', closable = true, onClose } = {}) {
  overlay.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${closable ? '<button class="x" aria-label="Закрыть">×</button>' : ''}${html}</div>`;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
  const m = overlay.firstElementChild;
  modalClose = closable ? () => { closeModal(); onClose?.(); } : null;
  $('.x', m)?.addEventListener('click', () => { audio.sfx.click(); modalClose?.(); });
  setTimeout(() => (m.querySelector('[autofocus]') || m.querySelector('button:not(.x), input, [tabindex]'))?.focus({ preventScroll: true }), 60);
  return m;
}
function closeModal() {
  overlay.classList.remove('open');
  overlay.hidden = true; overlay.innerHTML = ''; modalClose = null;
}
overlay.addEventListener('click', (e) => { if (e.target === overlay && modalClose) modalClose(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalClose) modalClose(); });

// ── меню ──────────────────────────────────────────────
$('#btnPlay').addEventListener('click', () => { audio.sfx.click(); startGame(); });
$('#btnSettings').addEventListener('click', () => { audio.sfx.click(); openSettings(); });
$('#btnCredits').addEventListener('click', () => { audio.sfx.click(); openCredits(); });
$('#hudSettings').addEventListener('click', () => { audio.sfx.click(); openSettings(); });
$('#hudJournal').addEventListener('click', () => { audio.sfx.click(); openJournal(); });
$('#hudMenu').addEventListener('click', () => { audio.sfx.click(); backToMenu(); });
$('#zoomIn').addEventListener('click', () => { audio.sfx.page(); map.zoomBy(0.75); });
$('#zoomOut').addEventListener('click', () => { audio.sfx.page(); map.zoomBy(1.33); });
$('#hudCenter').addEventListener('click', () => { audio.sfx.page(); map.centerOn(map.hero.x, map.hero.y); });

let busy = false;
async function startGame() {
  if (busy) return; busy = true;
  wake();
  menu.classList.add('leaving');
  world.classList.remove('is-menu');
  world.classList.add('is-flying');
  audio.sfx.whoosh(2.6);
  music('map');
  await map.flyIn(reduced() ? 300 : 2600);
  world.classList.remove('is-flying');
  world.classList.add('is-map');
  menu.hidden = true;
  hud.hidden = false;
  requestAnimationFrame(() => hud.classList.add('show'));
  busy = false;
  if (!S.hero) openCreate();
  else if (!S.introSeen) runIntro();
  else toast(`С возвращением, ${S.hero.name}!`);
}

async function backToMenu() {
  if (busy) return; busy = true;
  hud.classList.remove('show');
  await wait(250);
  hud.hidden = true;
  world.classList.remove('is-map');
  world.classList.add('is-menu');
  menu.hidden = false;
  renderMenuHero();
  requestAnimationFrame(() => menu.classList.remove('leaving'));
  music('menu');
  await map.setMenu(true);
  busy = false;
}

// ── настройки ─────────────────────────────────────────
function openSettings() {
  const s = S.settings;
  const m = openModal(`
    <h2 class="m-title">Настройки</h2>
    <div class="set">
      <label class="set-row"><span>Яркость</span><input type="range" id="sBright" min="0.6" max="1.4" step="0.05" value="${s.bright}"><output>${Math.round(s.bright * 100)}%</output></label>
      <label class="set-row"><span>Музыка</span><input type="range" id="sMusic" min="0" max="1" step="0.05" value="${s.music}"><output>${Math.round(s.music * 100)}%</output></label>
      <label class="set-row"><span>Звуки</span><input type="range" id="sSfx" min="0" max="1" step="0.05" value="${s.sfx}"><output>${Math.round(s.sfx * 100)}%</output></label>
      <div class="set-row"><span>Скорость текста</span>
        <div class="seg" role="radiogroup">${[['slow', 'Медленно'], ['normal', 'Обычно'], ['fast', 'Быстро'], ['instant', 'Сразу']].map(([v, n]) => `<button role="radio" aria-checked="${s.speed === v}" data-v="${v}">${n}</button>`).join('')}</div>
      </div>
    </div>
    <div class="set-foot">
      <button class="btn ghost" id="sReset">Начать путешествие заново</button>
      <button class="btn" id="sDone">Готово</button>
    </div>`, { cls: 'modal-small' });
  const bind = (id, key, apply) => {
    const inp = $(id, m);
    inp.addEventListener('input', () => { s[key] = +inp.value; inp.nextElementSibling.textContent = Math.round(s[key] * 100) + '%'; apply(); save(); });
  };
  bind('#sBright', 'bright', applySettings);
  bind('#sMusic', 'music', applySettings);
  bind('#sSfx', 'sfx', () => { applySettings(); audio.sfx.click(); });
  $$('.seg button', m).forEach((b) => b.addEventListener('click', () => {
    s.speed = b.dataset.v; save(); audio.sfx.page();
    $$('.seg button', m).forEach((x) => x.setAttribute('aria-checked', x === b));
  }));
  $('#sDone', m).addEventListener('click', () => { audio.sfx.click(); closeModal(); });
  $('#sReset', m).addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Точно? Весь прогресс сотрётся'; audio.sfx.wrong(); return; }
    const keep = S.settings; S = defaults(); S.settings = keep; save();
    closeModal(); refreshMap(); renderMenuHero();
    if (!hud.hidden) backToMenu();
    toast('Прогресс сброшен. Путешествие начнётся заново.');
  });
}

function openCredits() {
  openModal(`
    <h2 class="m-title">Авторы</h2>
    <div class="credits">
      <p><b>Идея и проект</b><br>Бекназар Берікбосын</p>
      <p><b>Код, иллюстрации и музыка</b><br>созданы вместе с Claude (Anthropic). Вся музыка и звуки синтезируются прямо в браузере — без записанных файлов.</p>
      <p><b>Шрифты</b><br>Unbounded и Lora, Google Fonts</p>
      <p><b>О фактах</b><br>Исторические даты, легенды и природные факты собраны из общедоступных энциклопедических источников. Легенды отмечены как легенды — у многих из них несколько вариантов.</p>
      <p class="muted">Тұран жолы — путешествие по природе и истории казахских земель. Карта показывает ландшафт, а не государственные границы.</p>
    </div>
    <div class="set-foot"><button class="btn" id="cOk">Понятно</button></div>`, { cls: 'modal-small' });
  $('#cOk').addEventListener('click', () => { audio.sfx.click(); closeModal(); });
}

// ── создание героя ────────────────────────────────────
function openCreate() {
  const draft = { type: 'batyr', coat: 'tory', name: HERO_TYPES.batyr.defaultName };
  const m = openModal(`
    <h2 class="m-title">Кто отправится в путь?</h2>
    <div class="create">
      <div class="create-preview" id="cPrev"></div>
      <div class="create-form">
        <fieldset><legend>Герой</legend>
          <div class="choice" id="cType">${Object.entries(HERO_TYPES).map(([k, h]) => `<button role="radio" data-v="${k}" aria-checked="${k === draft.type}"><b>${h.name}</b><span>${h.about}</span></button>`).join('')}</div>
        </fieldset>
        <fieldset><legend>Масть коня</legend>
          <div class="coats" id="cCoat">${Object.entries(COATS).map(([k, c]) => `<button role="radio" data-v="${k}" aria-checked="${k === draft.coat}"><i style="--c:${c.body};--d:${c.dark}"></i><b>${c.name}</b><span>${c.ru}</span></button>`).join('')}</div>
        </fieldset>
        <label class="name"><span>Имя героя</span><input id="cName" maxlength="20" value="${draft.name}" autocomplete="off"></label>
      </div>
    </div>
    <div class="set-foot"><button class="btn big" id="cGo">Отправиться в путь</button></div>`, { cls: 'modal-create', closable: false });
  const prev = () => { $('#cPrev', m).innerHTML = heroSVG(draft, 'idle'); };
  prev();
  const nameInp = $('#cName', m);
  let typedName = false;
  nameInp.addEventListener('input', () => { typedName = true; draft.name = nameInp.value; });
  $$('#cType button', m).forEach((b) => b.addEventListener('click', () => {
    draft.type = b.dataset.v; audio.sfx.page();
    $$('#cType button', m).forEach((x) => x.setAttribute('aria-checked', x === b));
    if (!typedName) { draft.name = HERO_TYPES[draft.type].defaultName; nameInp.value = draft.name; }
    prev();
  }));
  $$('#cCoat button', m).forEach((b) => b.addEventListener('click', () => {
    draft.coat = b.dataset.v; audio.sfx.page();
    $$('#cCoat button', m).forEach((x) => x.setAttribute('aria-checked', x === b));
    prev();
  }));
  $('#cGo', m).addEventListener('click', () => {
    draft.name = (nameInp.value || '').trim() || HERO_TYPES[draft.type].defaultName;
    S.hero = { ...draft }; save();
    audio.sfx.unlock();
    closeModal(); refreshMap();
    runIntro();
  });
}

// ── диалоги ───────────────────────────────────────────
const SPEED = { slow: 38, normal: 22, fast: 10, instant: 0 };
function typeText(el, text) {
  return new Promise((res) => {
    const ms = SPEED[S.settings.speed] ?? 22;
    if (!ms || reduced()) { el.textContent = text; res(); return; }
    let i = 0, done = false;
    el.textContent = '';
    el.classList.add('typing');
    const finish = () => { if (done) return; done = true; clearInterval(t); el.textContent = text; el.classList.remove('typing'); res(); };
    const t = setInterval(() => {
      i += 1; el.textContent = text.slice(0, i);
      if (i % 3 === 0 && text[i] !== ' ') audio.sfx.hover && i % 9 === 0 && audio.sfx.hover();
      if (i >= text.length) finish();
    }, ms);
    el._skip = finish;
  });
}

function talkHTML(who) {
  return `<div class="talk">
    <div class="talk-av">${avatarSVG(who.avatar, who.color)}</div>
    <div class="talk-bubble"><div class="talk-who"><b>${esc(who.name)}</b><span>${esc(who.role)}</span></div><p class="talk-text" aria-live="polite"></p></div>
  </div>`;
}

// показывает реплики по одной; ждёт нажатия «Дальше»
async function dialog(container, lines, resolveWho, lastLabel = 'Дальше') {
  for (let i = 0; i < lines.length; i++) {
    const { who, text } = lines[i];
    const w = resolveWho(who);
    container.innerHTML = `${talkHTML(w)}<div class="actions"><button class="btn" data-next>${i === lines.length - 1 ? lastLabel : 'Дальше'}</button></div>`;
    if (who === 'eagle') audio.sfx.eagle();
    const p = $('.talk-text', container);
    const btn = $('[data-next]', container);
    reveal(btn);
    let typing = typeText(p, fill(text));
    await new Promise((res) => {
      const go = async () => {
        if (p._skip && p.classList.contains('typing')) { p._skip(); return; }
        audio.sfx.page(); res();
      };
      btn.addEventListener('click', go);
      $('.talk', container).addEventListener('click', () => p._skip?.());
    });
    await typing;
  }
}

async function runIntro() {
  const m = openModal(`
    <div class="scene">
      <div class="scene-art">${sceneSVG('peak', 'day')}</div>
      <div class="scene-head"><h2>${START.name}</h2><p>Начало пути</p></div>
      <div class="scene-body" id="sb"></div>
    </div>`, { cls: 'modal-scene', closable: false });
  music('village');
  await dialog($('#sb', m), INTRO, (w) => (w === 'eagle' ? EAGLE : GUIDE), 'В путь!');
  S.introSeen = true; save();
  closeModal();
  music('map');
  const first = LOCS[0];
  const [x, y] = locXY(first);
  map.centerOn((x + map.hero.x) / 2, (y + map.hero.y) / 2, 900);
  toast('Нажми на светящуюся точку «Түркістан», чтобы отправиться в путь.');
}

// ── выбор точки на карте ──────────────────────────────
map.onSelect = (id) => {
  if (busy || !overlay.hidden) return;
  const loc = LOCS.find((l) => l.id === id);
  if (!isOpen(id)) {
    audio.sfx.wrong();
    toast(`Сначала доберись до точки «${LOCS[0].name}» — оттуда открываются все дороги степи.`);
    return;
  }
  audio.sfx.click();
  openDestination(loc);
};

function openDestination(loc) {
  const done = S.completed.includes(loc.id);
  const here = S.pos === loc.id;
  const cats = [...new Set(loc.facts.map((f) => f.cat))];
  const m = openModal(`
    <div class="dest">
      <div class="dest-art">${sceneSVG(loc.kind, 'day')}${done ? `<div class="dest-tumar">${artifactSVG(loc.artifact.glyph, loc.artifact.color, 64)}</div>` : ''}</div>
      <div class="dest-body">
        <h2 class="m-title">${loc.name}</h2>
        <p class="m-sub">${loc.ru !== loc.name ? loc.ru + '. ' : ''}${loc.region}</p>
        <ul class="dest-info">
          <li><span>Тебя встретит</span><b>${esc(loc.npc.name)}, ${esc(loc.npc.role)}</b></li>
          <li><span>Испытание</span><b>${esc(loc.game.title)}</b>${gameName(loc) !== loc.game.title ? `<em>${gameName(loc)}</em>` : ''}</li>
          <li><span>Узнаешь про</span><div class="chips">${cats.map((c) => `<i style="--cat:${CATS[c].color}">${CATS[c].name}</i>`).join('')}</div></li>
          ${done ? `<li><span>Твой результат</span>${starsHTML(S.stars[loc.id])}</li>` : ''}
        </ul>
        <div class="set-foot">
          <button class="btn ghost" id="dStay">Остаться</button>
          <button class="btn big ready" id="dGo">${here ? 'Войти' : done ? 'Отправиться снова' : 'Отправиться'}</button>
        </div>
      </div>
    </div>`, { cls: 'modal-dest' });
  $('#dStay', m).addEventListener('click', () => { audio.sfx.click(); closeModal(); });
  $('#dGo', m).addEventListener('click', async () => {
    audio.sfx.unlock();
    closeModal();
    busy = true;
    const [x, y] = locXY(loc);
    if (S.pos !== loc.id) {
      await map.travel(x, y, () => audio.startHooves(), () => audio.stopHooves());
      S.pos = loc.id; save(); refreshMap();
    }
    busy = false;
    openLocation(loc);
  });
}

// ── прохождение точки ─────────────────────────────────
const STEPS = ['Знакомство', 'Знания', 'Испытание', 'Вопросы', 'Тұмар-тас'];

async function openLocation(loc) {
  const replay = S.completed.includes(loc.id);
  const m = openModal(`
    <div class="scene">
      <div class="scene-art" id="art">${sceneSVG(loc.kind, 'day')}<div class="era" id="era" hidden></div><div class="scene-hero">${heroSVG(S.hero, 'idle')}</div><div class="scene-npc">${avatarSVG(loc.npc.avatar, loc.npc.color)}</div></div>
      <div class="scene-head">
        <div><h2>${loc.name}</h2><p>${loc.ru !== loc.name ? loc.ru + '. ' : ''}${loc.region}</p></div>
        <ol class="steps" id="steps">${STEPS.map((s, i) => `<li data-i="${i}">${s}</li>`).join('')}</ol>
      </div>
      <div class="scene-body" id="sb"></div>
    </div>`, { cls: 'modal-scene', onClose: () => { music('map'); } });
  music('village');
  const sb = $('#sb', m);
  const setStep = (i) => $$('#steps li', m).forEach((li) => { li.classList.toggle('on', +li.dataset.i === i); li.classList.toggle('past', +li.dataset.i < i); });
  const npc = loc.npc;
  const who = (w) => (w === 'eagle' ? EAGLE : npc);

  try {
    // 1. знакомство
    setStep(0);
    await dialog(sb, loc.greet.map((t) => ({ who: 'npc', text: t })), who, 'Узнать больше');

    // 2. знания — карточки
    setStep(1);
    await explore(sb, loc);

    // 3. экшен-испытание
    setStep(2);
    await dialog(sb, [{ who: 'npc', text: loc.game.intro }], who, 'Принять испытание');
    m.classList.add('gaming');
    music('menu');
    const res = await playGame(sb, loc.game, { hero: S.hero });
    guardOpen(sb);
    m.classList.remove('gaming');
    music('village');
    if (res.win) { S.stars[loc.id] = Math.max(S.stars[loc.id] || 0, res.stars); save(); }

    // 4. вопросы
    setStep(3);
    await dialog(sb, [{ who: 'npc', text: res.win ? 'Вот это ловкость! А теперь проверим, что ты запомнил.' : 'Ничего, в следующий раз получится! А теперь проверим, что ты запомнил.' }], who, 'К вопросам');
    const tasks = pickTasks(loc.mission.tasks);
    for (let i = 0; i < tasks.length; i++) await runTask(sb, tasks[i], i, tasks.length);

    // 5. камень памяти и путешествие во времени
    setStep(4);
    await stoneStep(sb, loc);
    await timeTravel(m, sb, loc);
    await reward(sb, loc, replay);
  } catch (e) {
    if (e !== 'closed') console.error(e);
  }
}

function guardOpen(sb) { if (!document.body.contains(sb)) throw 'closed'; }

// два вопроса: один обычный и один «действием» (порядок или выбор нескольких)
function pickTasks(tasks) {
  const q = tasks.find((t) => t.type === 'quiz');
  const other = tasks.find((t) => t.type !== 'quiz');
  return other ? [q, other] : tasks.slice(0, 2);
}

function explore(sb, loc) {
  return new Promise((res) => {
    const opened = new Set();
    sb.innerHTML = `
      <p class="lead">Нажми на каждую карточку, чтобы узнать, чем знаменито это место.</p>
      <div class="facts">${loc.facts.map((fct, i) => {
        const c = CATS[fct.cat];
        return `<button class="fact" data-i="${i}" style="--cat:${c.color}" aria-expanded="false">
          <span class="fact-cat">${c.name}</span><b class="fact-title">${fct.title}</b>
          <span class="fact-text">${fct.text}</span></button>`;
      }).join('')}</div>
      <div class="actions"><span class="counter" id="fc">Открыто 0 из ${loc.facts.length}</span><button class="btn" id="fNext" disabled>К заданию</button></div>`;
    $$('.fact', sb).forEach((b) => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', !open);
      if (!open) audio.sfx.page();
      opened.add(b.dataset.i);
      $('#fc', sb).textContent = `Открыто ${opened.size} из ${loc.facts.length}`;
      if (opened.size === loc.facts.length) { $('#fNext', sb).disabled = false; $('#fNext', sb).classList.add('ready'); }
    }));
    $('#fNext', sb).addEventListener('click', () => { audio.sfx.click(); res(); });
  });
}

function hintBox(text) {
  return `<div class="hint" role="status"><div class="hint-av">${avatarSVG('eagle')}</div><p><b>Қыран подсказывает:</b> ${esc(text)}</p></div>`;
}

function runTask(sb, task, idx, total) {
  return new Promise((res) => {
    const head = `<p class="task-n">Вопрос ${idx + 1} из ${total}</p><h3 class="task-q">${esc(task.q)}</h3>`;
    const success = (msg = 'Верно! Так и есть.') => {
      audio.sfx.correct();
      $('.task-feedback', sb).innerHTML = `<p class="ok">${msg}</p>`;
      const a = $('.actions', sb);
      a.innerHTML = `<button class="btn ready" id="tNext">${idx === total - 1 ? 'Готово!' : 'Следующий вопрос'}</button>`;
      reveal($('#tNext', sb));
      $('#tNext', sb).addEventListener('click', () => { audio.sfx.click(); res(); });
    };
    const fail = () => {
      audio.sfx.wrong();
      sb.querySelector('.task').classList.remove('shake'); void sb.offsetWidth; sb.querySelector('.task').classList.add('shake');
      $('.task-feedback', sb).innerHTML = hintBox(task.hint);
    };

    if (task.type === 'quiz') {
      const opts = shuffle(task.options.map((t, i) => ({ t, ok: i === task.answer })));
      sb.innerHTML = `<div class="task">${head}<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.t)}</button>`).join('')}</div><div class="task-feedback"></div></div><div class="actions"></div>`;
      $$('.opt', sb).forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        const o = opts[+b.dataset.i];
        if (o.ok) { $$('.opt', sb).forEach((x) => (x.disabled = true)); b.classList.add('right'); success(); }
        else { b.classList.add('wrong'); b.disabled = true; fail(); }
      }));
    }

    if (task.type === 'pick') {
      const opts = shuffle(task.options.map((t, i) => ({ t, ok: task.correct.includes(i) })));
      sb.innerHTML = `<div class="task">${head}<div class="opts pick">${opts.map((o, i) => `<button class="opt" role="checkbox" aria-checked="false" data-i="${i}"><i></i>${esc(o.t)}</button>`).join('')}</div><div class="task-feedback"></div></div><div class="actions"><button class="btn" id="tCheck">Проверить</button></div>`;
      $$('.opt', sb).forEach((b) => b.addEventListener('click', () => { if (b.disabled) return; audio.sfx.page(); b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }));
      $('#tCheck', sb).addEventListener('click', () => {
        const btns = $$('.opt', sb);
        const ok = btns.every((b) => (b.getAttribute('aria-checked') === 'true') === opts[+b.dataset.i].ok);
        if (ok) { btns.forEach((b) => { b.disabled = true; if (opts[+b.dataset.i].ok) b.classList.add('right'); }); success('Всё верно — ты ничего не упустил!'); }
        else fail();
      });
    }

    if (task.type === 'order') {
      const items = shuffle(task.items.map((t, i) => ({ t, i })));
      let seq = [];
      sb.innerHTML = `<div class="task">${head}<p class="lead">Нажимай на события по порядку.</p>
        <ol class="seq" id="seq"></ol>
        <div class="opts">${items.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.t)}</button>`).join('')}</div>
        <div class="task-feedback"></div></div>
        <div class="actions"><button class="btn ghost" id="tClear">Сбросить</button></div>`;
      const draw = () => {
        $('#seq', sb).innerHTML = seq.map((k) => `<li>${esc(items[k].t)}</li>`).join('') || '<li class="empty">Здесь появится твоя цепочка событий</li>';
        $$('.opt', sb).forEach((b) => (b.disabled = seq.includes(+b.dataset.k)));
      };
      draw();
      $$('.opt', sb).forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        audio.sfx.page();
        seq.push(+b.dataset.k); draw();
        if (seq.length === items.length) {
          const ok = seq.every((k, pos) => items[k].i === pos);
          if (ok) success('Правильно! История сложилась.');
          else { fail(); setTimeout(() => { seq = []; draw(); }, 900); }
        }
      }));
      $('#tClear', sb).addEventListener('click', () => { seq = []; draw(); audio.sfx.page(); });
    }
  });
}

function stoneStep(sb, loc) {
  return new Promise((res) => {
    sb.innerHTML = `
      ${talkHTML(loc.npc)}
      <div class="stone-wrap"><button class="stone-btn" id="stone" aria-label="Зажми, чтобы зарядить камень памяти">${stoneSVG(loc.artifact.color)}<span class="stone-ring"></span></button>
      <p class="lead center">Зажми тұмар-тас и держи, пока он не наполнится светом.</p></div>`;
    typeText($('.talk-text', sb), 'Рахмет! Смотри — камень памяти откликнулся на твои знания. Он покажет тебе прошлое.');
    audio.sfx.chime();
    const btn = $('#stone', sb);
    reveal(btn);
    let p = 0, holding = false, last = performance.now(), done = false, hum = 0;
    const set = (v) => { holding = v; if (v) audio.sfx.hum(); };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture?.(e.pointerId); set(true); });
    ['pointerup', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, () => set(false)));
    btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); set(true); } });
    btn.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') set(false); });
    const tick = (now) => {
      if (!document.body.contains(btn)) return;
      const dt = Math.min(0.25, (now - last) / 1000); last = now;
      p = holding ? Math.min(1, p + dt / 1.0) : Math.max(0, p - dt * 1.2);
      btn.style.setProperty('--p', p.toFixed(3));
      btn.classList.toggle('charging', holding);
      if (holding && (hum += dt) > 0.3) { hum = 0; sparkle(btn, loc.artifact.color); }
      if (p >= 1 && !done) { done = true; btn.classList.add('full'); setTimeout(res, 350); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function sparkle(el, color) {
  const s = document.createElement('i');
  s.className = 'spark';
  const a = Math.random() * Math.PI * 2;
  s.style.cssText = `--dx:${Math.cos(a) * 110}px;--dy:${Math.sin(a) * 80 - 20}px;background:${color}`;
  el.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}

async function portalFx() {
  audio.sfx.portal();
  portal.hidden = false;
  requestAnimationFrame(() => portal.classList.add('on'));
  await wait(reduced() ? 200 : 1500);
}
async function portalOff() {
  portal.classList.remove('on');
  await wait(reduced() ? 50 : 500);
  portal.hidden = true;
}

async function timeTravel(m, sb, loc) {
  guardOpen(sb);
  await portalFx();
  music('time');
  const tm = loc.time;
  const tone = tm.tone || 'past';
  const art = $('#art', m);
  art.firstElementChild.outerHTML = sceneSVG(tm.kind, tone, { scaffold: tm.scaffold });
  art.classList.add('past');
  const era = $('#era', m); era.hidden = false; era.textContent = tm.era;
  await portalOff();

  for (let i = 0; i < tm.steps.length; i++) {
    guardOpen(sb);
    const step = tm.steps[i];
    const last = i === tm.steps.length - 1;
    await new Promise((res) => {
      sb.innerHTML = `<div class="time-step"><p class="time-text"></p>
        ${step.choices ? `<div class="opts">${step.choices.map((c, k) => `<button class="opt" data-k="${k}">${esc(c.label)}</button>`).join('')}</div><div class="time-reply"></div>` : ''}</div>
        <div class="actions"><button class="btn" id="tGo" ${step.choices ? 'hidden' : ''}>${last ? 'Вернуться в своё время' : 'Дальше'}</button></div>`;
      const p = $('.time-text', sb);
      typeText(p, step.text);
      const go = $('#tGo', sb);
      const art = $('#art', m);
      $$('.hot', art).forEach((h) => h.remove());
      if (step.choices) {
        const HOT = [[26, 58], [70, 44]];
        step.choices.forEach((c, k) => {
          const h = document.createElement('button');
          h.className = 'hot'; h.dataset.k = k;
          h.style.left = HOT[k % 2][0] + '%'; h.style.top = HOT[k % 2][1] + '%';
          h.innerHTML = `<span>${esc(c.label)}</span>`;
          h.setAttribute('aria-label', c.label);
          art.appendChild(h);
        });
        const choose = (k) => {
          p._skip?.();
          audio.sfx.page();
          $$('.opt', sb).forEach((x) => { x.disabled = true; x.classList.toggle('chosen', +x.dataset.k === k); });
          $$('.hot', art).forEach((h) => { h.disabled = true; h.classList.toggle('chosen', +h.dataset.k === k); });
          const r = $('.time-reply', sb);
          typeText(r, step.choices[k].reply);
          go.hidden = false; reveal(go);
        };
        $$('.opt', sb).forEach((b) => b.addEventListener('click', () => { if (!b.disabled) choose(+b.dataset.k); }));
        $$('.hot', art).forEach((h) => h.addEventListener('click', () => { if (!h.disabled) choose(+h.dataset.k); }));
      } else reveal(go);
      go.addEventListener('click', () => { audio.sfx.click(); res(); });
    });
  }
  guardOpen(sb);
  $$('.hot', art).forEach((h) => h.remove());
  await portalFx();
  art.classList.remove('past');
  art.firstElementChild.outerHTML = sceneSVG(loc.kind, 'day');
  $('#era', m).hidden = true;
  music('village');
  await portalOff();
}

function reward(sb, loc, replay) {
  return new Promise((res) => {
    const firstUnlock = !replay && loc.id === LOCS[0].id;
    if (!replay) S.completed.push(loc.id);
    const left = LOCS.length - S.completed.length;
    save();
    audio.sfx.chime();
    const all = S.completed.length === LOCS.length;
    sb.innerHTML = `
      <div class="reward">
        <div class="reward-art">${artifactSVG(loc.artifact.glyph, loc.artifact.color, 120)}</div>
        <div><p class="task-n">${replay ? 'Этот камень уже в твоём қоржыне' : 'Новый тұмар в твоём қоржыне!'}</p>
        <h3 class="reward-name">${loc.artifact.name}</h3><p>${loc.artifact.desc}</p>
        ${S.stars[loc.id] ? `<p>Испытание: ${starsHTML(S.stars[loc.id])}</p>` : ''}
        ${firstUnlock ? '<p class="unlock"><b>Вся степь открыта!</b> Теперь ты сам выбираешь, куда скакать дальше: в горы Алтая, к Аральскому морю или к поющему бархану.</p>' : !replay && left ? `<p class="unlock">Осталось камней: <b>${left}</b>. Выбирай на карте любую точку.</p>` : ''}</div>
      </div>
      <div class="actions"><button class="btn big ready" id="rGo">${all && !S.endingSeen ? 'Завершить путь' : 'В путь!'}</button></div>`;
    reveal($('#rGo', sb));
    $('#rGo', sb).addEventListener('click', async () => {
      audio.sfx.unlock();
      closeModal();
      music('map');
      refreshMap();
      if (firstUnlock) {
        toast('Все дороги открыты! Выбирай любую точку на карте.');
        map.overview(1600);
      }
      if (all && !S.endingSeen) runEnding();
      res();
    });
  });
}

async function runEnding() {
  const m = openModal(`
    <div class="scene">
      <div class="scene-art">${sceneSVG('camp', 'night')}</div>
      <div class="scene-head"><h2>Тұран жолы пройден</h2><p>Все тринадцать камней собраны</p></div>
      <div class="scene-body" id="sb"></div>
    </div>`, { cls: 'modal-scene', closable: false });
  music('menu');
  await dialog($('#sb', m), ENDING, (w) => (w === 'eagle' ? EAGLE : GUIDE), 'Открыть журнал');
  S.endingSeen = true; save();
  closeModal(); music('map');
  openJournal();
}

// ── журнал Шежіре ─────────────────────────────────────
function openJournal(selectId) {
  const done = new Set(S.completed);
  const first = selectId || S.completed[S.completed.length - 1] || LOCS[0].id;
  const m = openModal(`
    <h2 class="m-title">Шежіре — журнал путешественника</h2>
    <p class="m-sub">Камни памяти: ${done.size} из ${LOCS.length}</p>
    <div class="journal">
      <ul class="j-list">${LOCS.map((l, i) => `<li><button data-id="${l.id}" ${done.has(l.id) ? '' : 'disabled'} aria-pressed="false">
        <span class="j-ico">${done.has(l.id) ? artifactSVG(l.artifact.glyph, l.artifact.color, 34) : `<span class="j-lock">${i + 1}</span>`}</span>
        <span><b>${l.name}</b><small>${done.has(l.id) ? l.artifact.name : 'ещё не пройдено'}</small>${done.has(l.id) && S.stars[l.id] ? starsHTML(S.stars[l.id]) : ''}</span></button></li>`).join('')}</ul>
      <div class="j-page" id="jPage"></div>
    </div>`, { cls: 'modal-journal' });
  const show = (id) => {
    const l = LOCS.find((x) => x.id === id);
    $$('.j-list button', m).forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === id));
    if (!l || !done.has(id)) {
      $('#jPage', m).innerHTML = `<p class="lead">Пройди первую точку на карте — и здесь появятся её факты и камень памяти.</p>`;
      return;
    }
    $('#jPage', m).innerHTML = `
      <div class="j-head">${artifactSVG(l.artifact.glyph, l.artifact.color, 72)}<div><h3>${l.name}</h3><p>${l.region}</p></div></div>
      ${l.facts.map((f) => `<div class="j-fact" style="--cat:${CATS[f.cat].color}"><span class="fact-cat">${CATS[f.cat].name}</span><b>${f.title}</b><p>${f.text}</p></div>`).join('')}
      <div class="j-fact" style="--cat:#6A4C9C"><span class="fact-cat">Путешествие во времени</span><b>${l.time.era}</b><p>${l.time.steps.map((s) => s.text).join(' ')}</p></div>`;
    $('#jPage', m).scrollTop = 0;
  };
  $$('.j-list button', m).forEach((b) => b.addEventListener('click', () => { audio.sfx.page(); show(b.dataset.id); }));
  show(first);
}

// для отладки в консоли
window.__turan = { S, LOCS, map };
