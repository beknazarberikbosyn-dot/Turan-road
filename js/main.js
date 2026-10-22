import { LOCS, START, INTRO, ENDING, CATS, GUIDE } from './data.js';
import * as audio from './audio.js';
import { MapView, P, locXY } from './map.js';
import { heroSVG, COATS, HERO_TYPES } from './hero.js';
import { artifactSVG } from './scenes.js';
import { playGame, GAME_NAMES } from './games.js';
import { Stage } from './stage.js';
import { backdrop, SW, SH } from './backdrop.js';
import { STORY } from './story.js';
import { visit, prologue, epilogue, rigPreview, isGirl } from './visit.js';

// ── состояние ─────────────────────────────────────────
const KEY = 'turanroad.v1';
const defaults = () => ({
  hero: null, introSeen: false, endingSeen: false, completed: [], pos: 'start', stars: {},
  settings: { bright: 1, music: 0.6, sfx: 0.8, voice: 0.7, speed: 'normal' },
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
const fill = (t) => t.replace(/\{name\}/g, S.hero?.name || 'жолаушы');

const world = $('#world'), menu = $('#menu'), hud = $('#hud'), overlay = $('#overlay'), portal = $('#portal');
const map = new MapView($('#map'));

// ── настройки ─────────────────────────────────────────
function applySettings() {
  document.documentElement.style.setProperty('--bright', S.settings.bright);
  audio.setMusicVolume(S.settings.music);
  audio.setSfxVolume(S.settings.sfx);
  audio.setVoiceVolume?.(S.settings.voice);
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
      <label class="set-row"><span>Голоса</span><input type="range" id="sVoice" min="0" max="1" step="0.05" value="${s.voice}"><output>${Math.round(s.voice * 100)}%</output></label>
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
  bind('#sVoice', 'voice', () => { applySettings(); audio.voice?.(170 + Math.random() * 60, 'a'); });
  $$('.seg button', m).forEach((b) => b.addEventListener('click', () => {
    s.speed = b.dataset.v; save(); audio.sfx.page();
    if (activeStage) activeStage.speed = s.speed;
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
  const draft = { type: 'batyr', coat: 'tory', look: 'm', name: HERO_TYPES.batyr.defaultName };
  const m = openModal(`
    <h2 class="m-title">Кто отправится в путь?</h2>
    <div class="create">
      <div class="create-preview" id="cPrev"><svg class="rig-prev" viewBox="0 -20 420 340" aria-hidden="true"></svg></div>
      <div class="create-form">
        <fieldset><legend>Герой</legend>
          <div class="choice" id="cType">${Object.entries(HERO_TYPES).map(([k, h]) => `<button role="radio" data-v="${k}" aria-checked="${k === draft.type}"><b>${h.name}</b><span>${h.about}</span></button>`).join('')}</div>
        </fieldset>
        <fieldset><legend>Облик</legend>
          <div class="seg look" id="cLook" role="radiogroup">${[['m', 'Мальчик'], ['f', 'Девочка']].map(([v, n]) => `<button role="radio" data-v="${v}" aria-checked="${v === draft.look}">${n}</button>`).join('')}</div>
        </fieldset>
        <fieldset><legend>Масть коня</legend>
          <div class="coats" id="cCoat">${Object.entries(COATS).map(([k, c]) => `<button role="radio" data-v="${k}" aria-checked="${k === draft.coat}"><i style="--c:${c.body};--d:${c.dark}"></i><b>${c.name}</b><span>${c.ru}</span></button>`).join('')}</div>
        </fieldset>
        <label class="name"><span>Имя героя</span><input id="cName" maxlength="20" value="${draft.name}" autocomplete="off"></label>
      </div>
    </div>
    <div class="set-foot"><button class="btn big" id="cGo">Отправиться в путь</button></div>`, { cls: 'modal-create', closable: false });
  const prev = rigPreview($('#cPrev svg', m), draft);
  const nameInp = $('#cName', m);
  let typedName = false, pickedLook = false;
  const radio = (sel, b) => $$(sel + ' button', m).forEach((x) => x.setAttribute('aria-checked', x === b));
  nameInp.addEventListener('input', () => { typedName = true; draft.name = nameInp.value; });
  $$('#cType button', m).forEach((b) => b.addEventListener('click', () => {
    draft.type = b.dataset.v; audio.sfx.page();
    radio('#cType', b);
    if (!pickedLook) { draft.look = draft.type === 'sayahat' ? 'f' : 'm'; radio('#cLook', $(`#cLook [data-v="${draft.look}"]`, m)); }
    if (!typedName) { draft.name = draft.look === 'f' && draft.type === 'batyr' ? 'Томирис' : draft.look === 'm' && draft.type === 'sayahat' ? 'Сапар' : HERO_TYPES[draft.type].defaultName; nameInp.value = draft.name; }
    prev.set(draft);
  }));
  $$('#cLook button', m).forEach((b) => b.addEventListener('click', () => {
    draft.look = b.dataset.v; pickedLook = true; audio.sfx.page();
    radio('#cLook', b);
    if (!typedName) { draft.name = draft.look === 'f' && draft.type === 'batyr' ? 'Томирис' : draft.look === 'm' && draft.type === 'sayahat' ? 'Сапар' : HERO_TYPES[draft.type].defaultName; nameInp.value = draft.name; }
    prev.set(draft);
  }));
  $$('#cCoat button', m).forEach((b) => b.addEventListener('click', () => {
    draft.coat = b.dataset.v; audio.sfx.page();
    radio('#cCoat', b);
    prev.set(draft);
  }));
  $('#cGo', m).addEventListener('click', () => {
    draft.name = (nameInp.value || '').trim() || HERO_TYPES[draft.type].defaultName;
    S.hero = { ...draft }; save();
    audio.sfx.unlock();
    prev.stop();
    closeModal(); refreshMap();
    runIntro();
  });
}

// ── окно-сцена: заголовок, живая сцена, панель заданий ──
let activeStage = null;
function sceneModal(title, sub, steps, opt = {}) {
  const m = openModal(`
    <div class="sc2-top"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>${steps ? `<ol class="steps">${steps.map((s, i) => `<li data-i="${i}">${s}</li>`).join('')}</ol>` : ''}</div>
    <div class="sc2-stage"></div>
    <div class="sc2-panel"></div>`, { cls: 'modal-scene2', ...opt });
  const host = $('.sc2-stage', m), panel = $('.sc2-panel', m);
  const st = new Stage(host, { kind: opt.kind, tone: opt.tone, speed: S.settings.speed });
  st.fadeEl.classList.add('on');
  activeStage = st;
  new MutationObserver(() => m.classList.toggle('tasking', panel.childElementCount > 0)).observe(panel, { childList: true });
  return { m, st, host, panel };
}
const guardOf = (host) => () => { if (!host.isConnected) throw 'closed'; };
const revealIn = (el, block = 'nearest') => el?.scrollIntoView({ block, behavior: reduced() ? 'auto' : 'smooth' });

async function runIntro() {
  const { st, host } = sceneModal(START.name, 'Начало пути', null, { closable: false, kind: 'kazygurt' });
  music('village');
  try {
    await prologue({ st, hero: S.hero, lines: INTRO, guide: GUIDE, fill, guard: guardOf(host) });
  } catch (e) { if (e !== 'closed') console.error(e); }
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

// неподвижная картинка места из тех же слоёв, что и живая сцена
function postcard(kind) {
  const b = backdrop(kind, {});
  return `<svg class="postcard" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${b.bg}${b.mid}${b.fg}</svg>`;
}

function openDestination(loc) {
  const done = S.completed.includes(loc.id);
  const here = S.pos === loc.id;
  const cats = [...new Set(loc.facts.map((f) => f.cat))];
  const sto = STORY[loc.id];
  const quest = sto.quest.find((q) => q.type !== 'game');
  const m = openModal(`
    <div class="dest">
      <div class="dest-art">${postcard(loc.kind)}${done ? `<div class="dest-tumar">${artifactSVG(loc.artifact.glyph, loc.artifact.color, 64)}</div>` : ''}</div>
      <div class="dest-body">
        <h2 class="m-title">${loc.name}</h2>
        <p class="m-sub">${loc.ru !== loc.name ? loc.ru + '. ' : ''}${loc.region}</p>
        <ul class="dest-info">
          <li><span>Тебя встретит</span><b>${esc(loc.npc.name)}, ${esc(loc.npc.role)}</b></li>
          ${quest ? `<li><span>Задание</span><b>${esc(quest.title)}</b></li>` : ''}
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

// ── прохождение точки: живая сцена ────────────────────
async function openLocation(loc) {
  const replay = S.completed.includes(loc.id);
  const sto = STORY[loc.id];
  const steps = ['Встреча', 'Исследование', ...sto.quest.map((q) => (q.type === 'game' ? 'Испытание' : 'Задание')), 'Тұмар-тас'];
  const { m, st, host, panel } = sceneModal(loc.name, `${loc.ru !== loc.name ? loc.ru + '. ' : ''}${loc.region}`, steps, {
    kind: loc.kind, tone: sto.tone, onClose: () => { music('map'); refreshMap(); portal.classList.remove('on'); portal.hidden = true; },
  });
  music('village');
  const setStep = (i) => $$('.steps li', m).forEach((li) => { li.classList.toggle('on', +li.dataset.i === i); li.classList.toggle('past', +li.dataset.i < i); });
  const ctx = {
    st, panel, modal: m, loc, sto, hero: S.hero, CATS,
    alive: () => host.isConnected, guard: guardOf(host), reveal: revealIn,
    music, playGame, setStep, portalIn: portalFx, portalOut: portalOff,
    onStars: (n) => { S.stars[loc.id] = Math.max(S.stars[loc.id] || 0, n); save(); },
  };
  try {
    await visit(ctx);
    reward(panel, loc, replay);
  } catch (e) {
    if (e !== 'closed') console.error(e);
  }
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

function reward(panel, loc, replay) {
  const firstUnlock = !replay && loc.id === LOCS[0].id;
  if (!replay) S.completed.push(loc.id);
  const left = LOCS.length - S.completed.length;
  save();
  audio.sfx.chime();
  const all = S.completed.length === LOCS.length;
  panel.innerHTML = `
    <div class="reward">
      <div class="reward-art">${artifactSVG(loc.artifact.glyph, loc.artifact.color, 120)}</div>
      <div><p class="task-n">${replay ? 'Этот камень уже в твоём қоржыне' : 'Новый тұмар в твоём қоржыне!'}</p>
      <h3 class="reward-name">${loc.artifact.name}</h3><p>${loc.artifact.desc}</p>
      ${S.stars[loc.id] ? `<p>Испытание: ${starsHTML(S.stars[loc.id])}</p>` : ''}
      ${firstUnlock ? '<p class="unlock"><b>Вся степь открыта!</b> Теперь ты сам выбираешь, куда скакать дальше: в горы Алтая, к Аральскому морю или к поющему бархану.</p>' : !replay && left ? `<p class="unlock">Осталось камней: <b>${left}</b>. Выбирай на карте любую точку.</p>` : ''}</div>
    </div>
    <div class="actions"><button class="btn big ready" id="rGo">${all && !S.endingSeen ? 'Завершить путь' : 'В путь!'}</button></div>`;
  revealIn($('#rGo', panel));
  $('#rGo', panel).focus({ preventScroll: true });
  $('#rGo', panel).addEventListener('click', () => {
    audio.sfx.unlock();
    closeModal();
    music('map');
    refreshMap();
    if (firstUnlock) {
      toast('Все дороги открыты! Выбирай любую точку на карте.');
      map.overview(1600);
    }
    if (all && !S.endingSeen) runEnding();
  });
}

async function runEnding() {
  const { st, host } = sceneModal('Тұран жолы пройден', 'Все тринадцать камней собраны', null, { closable: false, kind: 'camp', tone: 'night' });
  music('menu');
  try {
    await epilogue({ st, hero: S.hero, lines: ENDING, guide: GUIDE, fill, guard: guardOf(host) });
  } catch (e) { if (e !== 'closed') console.error(e); }
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
window.__turan = { get S() { return S; }, get stage() { return activeStage; }, LOCS, map, STORY, openLocation, runIntro, runEnding };
