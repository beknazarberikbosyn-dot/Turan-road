// Постановка посещения точки: встреча → исследование → задания → тұмар-тас →
// путешествие в прошлое → подарок. А также вступление на Казыгурте и финал у костра.
import { Person } from './rig.js';
import { Horse } from './beasts.js';
import { RIGS, heroRig } from './story.js';
import { explore, runQuest } from './quests.js';
import { artifactSVG, stoneSVG } from './scenes.js';
import * as audio from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const STONE_X = 500, STONE_Y = 480, STONE_S = 1.3;

export function isGirl(h) { return h.look ? h.look === 'f' : h.type === 'sayahat'; }
export function heroMeta(h) {
  const girl = isGirl(h);
  return { name: h.name, role: '', color: girl ? '#C0504A' : '#3A5BA6', pitch: girl ? 300 : 210, y: 510 };
}
const pitchOf = (spec) => (spec.sex === 'f' ? (spec.age === 'elder' ? 200 : 235) : spec.age === 'elder' ? 108 : spec.age === 'child' ? 320 : 135);

// актёры «нашего времени»
function castHome(ctx, heroX = 300) {
  const { st, loc, sto, hero } = ctx;
  st.addHorse(hero.coat || 'tory', 150, 1);
  st.addEagle(152, 322, 1);
  st.addPerson('hero', heroRig(hero), heroX, 1, heroMeta(hero));
  st.addPerson('npc', RIGS[sto.npc], sto.npcX || 700, -1, { name: loc.npc.name, role: loc.npc.role, color: loc.npc.color, pitch: sto.pitch });
  for (const e of sto.extras || []) st.addPerson(e.id, RIGS[e.rig], e.x, e.face || -1, { name: e.name, role: e.role, color: e.color, pitch: e.pitch, s: e.s });
}

// ── встреча ───────────────────────────────────────────
async function meet(ctx) {
  const { st, loc } = ctx;
  const hero = st.get('hero'), npc = st.get('npc');
  npc.look(hero); hero.look(st.horse);
  await st.fade(false, 650);
  st.horse.nuzzle(1.6);
  hero.emote('happy', 1.6);
  await wait(reduced() ? 100 : 1000);
  hero.look(npc);
  const walking = st.walk('hero', 300);
  await wait(450);
  npc.pose('wave'); npc.emote('happy', 2.2);
  await walking;
  npc.pose(npc.basePose || 'rest');
  for (const id of Object.keys(st.cast)) if (!['hero', 'npc', 'eagle'].includes(id)) st.get(id)?.look?.(hero);
  await st.say('hero', 'Сәлеметсіз бе!', { to: 'npc', auto: 650 });
  ctx.guard();
  for (const t of loc.greet) { await st.say('npc', t, { to: 'hero' }); ctx.guard(); }
}

// ── камень памяти ─────────────────────────────────────
function stoneArt(color, id) {
  return `<defs><radialGradient id="${id}g"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset=".55" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
    <g class="ts-in">
    <ellipse class="ts-glow" cx="0" cy="-44" rx="96" ry="78" fill="url(#${id}g)" opacity=".3"/>
    <ellipse cx="0" cy="0" rx="44" ry="8" fill="#1E1630" opacity=".28"/>
    <path d="M-34,0 Q-44,-46 -20,-76 Q4,-98 26,-74 Q44,-46 34,0Z" fill="#5E5A6E" stroke="#2E1C12" stroke-width="1.6"/>
    <path d="M-20,-76 Q4,-98 26,-74 Q12,-78 0,-68 Q-12,-60 -20,-76Z" fill="#7A768C"/>
    <path d="M18,-60 Q30,-40 26,-6" stroke="#4A4658" stroke-width="3" fill="none" opacity=".6"/>
    <g class="ts-rune" opacity=".35" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M0,-66 L0,-18 M-12,-54 L12,-54 M-14,-30 L0,-18 L14,-30"/><circle cx="0" cy="-42" r="5"/></g>
    <g class="ts-sparks"></g></g>`;
}

function holdStone(ctx, color) {
  const { st, panel } = ctx;
  return new Promise((res) => {
    panel.innerHTML = `<div class="quest stq"><div class="stone-wrap"><button class="stone-btn" aria-label="Зажми, чтобы зарядить камень памяти">${stoneSVG(color)}<span class="stone-ring"></span></button>
      <p class="lead center">Зажми тұмар-тас — на картинке или здесь — и держи, пока он не наполнится светом.</p></div></div>`;
    const btn = panel.querySelector('.stone-btn');
    const spot = st.hotspots([{ id: 'stone', at: [STONE_X, STONE_Y - 62], label: 'Зажми камень', cls: 'hold label' }], () => {}).btns[0];
    const hero = st.get('hero');
    const sparks = st.get('stone')?.el.querySelector('.ts-sparks');
    let p = 0, holding = false, last = performance.now(), done = false, sp = 0;
    const set = (v) => {
      if (done || holding === v) return;
      holding = v;
      if (v) { audio.sfx.hum(); hero.crouch(true); hero.pose('reach'); hero.emote('surprised', 0); }
      else { hero.crouch(false); hero.pose('rest'); hero.emote('calm'); }
    };
    for (const el of [btn, spot]) {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); el.setPointerCapture?.(e.pointerId); set(true); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, () => set(false)));
      el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); set(true); } });
      el.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') set(false); });
      el.addEventListener('click', (e) => e.stopPropagation());
    }
    const tick = (now) => {
      if (!btn.isConnected) return;
      const dt = Math.min(0.25, (now - last) / 1000); last = now;
      p = holding ? Math.min(1, p + dt / 1.6) : Math.max(0, p - dt * 0.9);
      st.charge = p;
      btn.style.setProperty('--p', p.toFixed(3));
      btn.classList.toggle('charging', holding);
      spot.style.setProperty('--p', p.toFixed(3));
      if (holding && sparks && (sp += dt) > 0.07) {
        sp = 0;
        const a = Math.random() * Math.PI * 2, c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('class', 'ts-spark'); c.setAttribute('r', (1.5 + Math.random() * 2.5).toFixed(1));
        c.setAttribute('cx', (Math.cos(a) * 26).toFixed(1)); c.setAttribute('cy', (-40 + Math.sin(a) * 30).toFixed(1));
        c.setAttribute('fill', Math.random() < 0.5 ? color : '#FFF6D8');
        c.style.setProperty('--dx', (Math.cos(a) * (40 + Math.random() * 50)).toFixed(0) + 'px');
        c.style.setProperty('--dy', (-60 - Math.random() * 80).toFixed(0) + 'px');
        sparks.appendChild(c);
        c.addEventListener('animationend', () => c.remove());
      }
      if (p >= 1 && !done) {
        done = true; holding = false;
        btn.classList.add('full');
        audio.sfx.portal?.();
        setTimeout(() => { hero.crouch(false); hero.pose('rest'); spot.remove(); res(); }, 380);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    ctx.reveal(panel.firstElementChild);
  });
}

async function stone(ctx) {
  const { st, loc } = ctx;
  const color = loc.artifact.color;
  st.charge = 0;
  const id = 'ts' + Math.random().toString(36).slice(2, 8);
  st.addProp('stone', stoneArt(color, id), STONE_X, STONE_Y, { s: STONE_S,
    update: (el, dt, t) => {
      const c = st.charge || 0;
      el._g ||= el.querySelector('.ts-glow'); el._r ||= el.querySelector('.ts-rune');
      el._g.setAttribute('opacity', (0.28 + c * 0.72 + Math.sin(t * 3) * 0.07).toFixed(2));
      el._r.setAttribute('opacity', (0.35 + c * 0.65 + Math.sin(t * 2.2) * 0.1).toFixed(2));
      el.setAttribute('transform', `translate(${(STONE_X + (c > 0.55 ? Math.sin(t * 46) * (c - 0.5) * 3 : 0)).toFixed(1)},${STONE_Y}) scale(${STONE_S})`);
    },
  });
  audio.sfx.chime();
  const hero = st.get('hero'), npc = st.get('npc');
  const at = { x: STONE_X, y: STONE_Y - 60 };
  for (const a of st.actors) if (a instanceof Person) { a.look(at); a.emote('surprised', 1.4); }
  await wait(700);
  await st.say('npc', 'Рахмет! Смотри — камень памяти откликнулся на твои знания. Он покажет тебе прошлое.', { at: [STONE_X, STONE_Y - 60], to: 'hero' });
  ctx.guard();
  await st.walk('hero', STONE_X - 84);
  hero.face = 1; hero.look(at);
  st.narrate('Зажми тұмар-тас и держи, пока он не наполнится светом.', { auto: 1, hold: true, top: true });
  await holdStone(ctx, color);
  ctx.guard();
}

// ── путешествие во времени ────────────────────────────
// ответы с «прямой речью»: слова в кавычках произносит житель прошлого, остальное — рассказчик
function splitSpeech(text) {
  const out = [];
  const re = /«([^»]*)»/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index).trim();
    if (before) out.push({ who: 'narr', text: before.replace(/:$/, '.') });
    let q = m[1].replace(/,?\s*—\s*(?:тихо\s+)?(?:говорит|отвечает|улыбается|смеётся|спрашивает|шепчет)[^—]*—\s*/gi, '. ').replace(/\s+\./g, '.').trim();
    if (!/[.!?…]$/.test(q)) q += '.';
    out.push({ who: 'era', text: q });
    last = m.index + m[0].length;
  }
  let after = text.slice(last).trim().replace(/^[,.\s—]+/, '');
  if (after) {
    const mm = after.match(/^(?:говорит|отвечает|улыбается|кивает)\s+([а-яё]+)\s+и\s+(.*)$/i);
    if (mm) after = cap(mm[1]) + ' ' + mm[2];
    if (!/^(?:говорит|отвечает)\s+[а-яё]+\.?$/i.test(after)) out.push({ who: 'narr', text: cap(after) });
  }
  return out.length ? out : [{ who: 'narr', text }];
}

async function travel(ctx) {
  const { st, panel, loc, sto } = ctx;
  const tm = loc.time, tt = sto.time || {};
  await ctx.portalIn();
  ctx.guard();
  const sc = { kind: tm.kind, variant: tm.scaffold ? 'past' : undefined, ...(tt.scene || {}) };
  sc.tone = sc.tone || tm.tone || 'past';
  st.clearActors(); st.clearSub(); st.camReset();
  panel.innerHTML = '';
  st.setScene(sc.kind, sc);
  st.era(tm.era);
  ctx.music('time');
  const heroOn = sc.kind !== 'ocean';
  if (heroOn) st.addPerson('hero', heroRig(ctx.hero), 250, 1, heroMeta(ctx.hero));
  let era = null;
  if (tt.who) {
    const spec = RIGS[tt.who];
    era = st.addPerson('era', spec, 670, -1, { name: tt.name, role: tt.role, color: '#9C6A3A', pitch: pitchOf(spec) });
  }
  if (tt.horse) st.addHorse(tt.horse.coat, tt.horse.x, -1, 0.85);
  await ctx.portalOut();
  ctx.guard();
  const hero = st.get('hero');
  if (era) {
    era.look(hero); hero?.look(era);
    era.emote('surprised', 1.4); hero?.emote('surprised', 1.4);
    await wait(800);
    if (tt.hello) { await st.say('era', tt.hello, { to: 'hero', emo: 'kind', emoT: 2 }); ctx.guard(); }
  }
  for (let i = 0; i < tm.steps.length; i++) {
    const step = tm.steps[i];
    const last = i === tm.steps.length - 1;
    if (!step.choices) {
      await st.narrate(step.text, { lastBtn: last ? 'Вернуться в своё время' : 'Дальше' });
      ctx.guard();
      continue;
    }
    const lowChoice = (tt.at || []).some((a) => (st.pt(a)?.y || 0) > 330);
    await st.narrate(step.text, { auto: 1, hold: true, top: lowChoice });
    ctx.guard();
    const k = await new Promise((resolve) => {
      const pickK = (n) => { hs.clear(); panel.innerHTML = ''; audio.sfx.click(); resolve(n); };
      const pts = step.choices.map((c, n) => st.pt((tt.at || [])[n]) || { x: 300 + n * 360, y: 330 });
      // подписи двух близких точек разводим: одну над точкой, другую под ней
      const near = pts.length > 1 && Math.abs(pts[0].x - pts[1].x) < 260 && Math.abs(pts[0].y - pts[1].y) < 90;
      const lower = near ? (pts[0].y >= pts[1].y ? 0 : 1) : -1;
      const hs = st.hotspots(step.choices.map((c, n) => ({ id: n, at: [pts[n].x, pts[n].y], label: c.label, cls: 'chooser' + (n === lower ? ' below' : '') })), (h) => pickK(h.id));
      panel.innerHTML = `<div class="quest tk tk-time"><div class="q-head"><b>Что сделаешь?</b><span>Выбери на картинке или здесь.</span></div>
        <div class="tk-opts">${step.choices.map((c, n) => `<button class="tk-opt" data-n="${n}">${c.label}</button>`).join('')}</div></div>`;
      panel.querySelectorAll('.tk-opt').forEach((b) => b.addEventListener('click', () => pickK(+b.dataset.n)));
      ctx.reveal(panel.firstElementChild);
    });
    ctx.guard();
    const toEra = String((tt.at || [])[k]).startsWith('@era');
    const target = st.pt((tt.at || [])[k]);
    if (hero && target) {
      const x = Math.max(110, Math.min(860, target.x + (target.x > hero.x ? -90 : 90)));
      if (era && !toEra && Math.abs(era.x - x) < 100) {
        // житель прошлого уступает дорогу и оборачивается к гостю
        const side = x <= era.x ? 1 : -1;
        let ex = era.x + side * 130;
        if (ex > 900 || ex < 60) ex = era.x - side * 130 * 1.6;
        era.walkTo(Math.max(60, Math.min(900, ex)), 110).then(() => { era.face = hero.x > era.x ? 1 : -1; era.look(hero); });
      }
      if (Math.abs(x - hero.x) > 30) await st.walk('hero', x);
      hero.face = target.x >= hero.x ? 1 : -1;
      hero.look(target);
      if (era) { era.face = hero.x > era.x ? 1 : -1; era.look(hero); }
    }
    const parts = splitSpeech(step.choices[k].reply);
    for (let n = 0; n < parts.length; n++) {
      const pt = parts[n];
      const lastPart = n === parts.length - 1;
      const o = { lastBtn: last && lastPart ? 'Вернуться в своё время' : 'Дальше' };
      if (pt.who === 'era' && era) await st.say('era', pt.text, { ...o, to: 'hero' });
      else await st.narrate(pt.text, { ...o, cam: target ? { x: target.x, y: target.y - 20 } : null });
      ctx.guard();
    }
  }
  await ctx.portalIn();
  ctx.guard();
  st.era(''); st.clearActors(); st.clearSub(); st.camReset();
  panel.innerHTML = '';
  st.setScene(loc.kind, { tone: sto.tone });
  castHome(ctx, STONE_X - 84);
  ctx.music('village');
  await ctx.portalOut();
}

// ── подарок ───────────────────────────────────────────
async function present(ctx) {
  const { st, loc } = ctx;
  const art = artifactSVG(loc.artifact.glyph, loc.artifact.color, 40);
  const gift = `<g transform="translate(-20,-30)">${art}</g>`;
  const hero = st.get('hero'), npc = st.get('npc');
  st.addProp('tumar', `<ellipse cx="0" cy="2" rx="20" ry="4" fill="#1E1630" opacity=".25"/><g class="ts-tumar"><g transform="translate(-24,-50) scale(1.2)">${art}</g></g>`, STONE_X, STONE_Y);
  hero.look({ x: STONE_X, y: STONE_Y - 20 }); npc.look({ x: STONE_X, y: STONE_Y - 20 });
  hero.emote('surprised', 1.5);
  await st.narrate('На месте камня лежит маленький тұмар.', { auto: 900 });
  ctx.guard();
  const home = npc.x;
  await npc.walkTo(STONE_X + 46, 130);
  npc.face = -1;
  npc.crouch(true);
  await wait(650);
  st.remove('tumar');
  const keep = npc.items[1];
  npc.hold('gift', 1, gift);
  npc.crouch(false);
  audio.sfx.chime();
  await wait(500);
  await st.give('npc', 'hero', gift, { home, keep });
  ctx.guard();
  hero.pose('present');
  st.eagle?.look(hero);
  await st.say('npc', `«${loc.artifact.name}» теперь твой. Береги его: в нём память этой земли.`, { to: 'hero', emo: 'kind', emoT: 3 });
  ctx.guard();
  hero.pose('hold');
}

export async function visit(ctx) {
  const { st, sto } = ctx;
  ctx.setStep(0);
  castHome(ctx, 215);
  await meet(ctx);
  ctx.guard();
  ctx.setStep(1);
  await explore(ctx);
  ctx.guard();
  let i = 2;
  for (const q of sto.quest) { ctx.setStep(i++); ctx.panel.innerHTML = ''; await runQuest(q, ctx); ctx.guard(); }
  ctx.setStep(i);
  ctx.panel.innerHTML = '';
  await stone(ctx);
  await travel(ctx);
  await present(ctx);
  st.clearSub();
}

// ── вступление и финал ────────────────────────────────
export async function prologue(ctx) {
  const { st, hero, lines, guide, fill } = ctx;
  st.addHorse(hero.coat || 'tory', 150, 1);
  st.addPerson('hero', heroRig(hero), 300, 1, heroMeta(hero));
  st.addPerson('guide', RIGS.sapar, 690, -1, { name: guide.name, role: guide.role, color: '#2F5E46', pitch: 105 });
  st.addEagle(1040, 40, -1);
  st.perch = { x: 152, y: 322, face: 1 };
  st.eagle.setSpread(true);
  const h = st.get('hero'), g = st.get('guide');
  g.look(h); h.look(g);
  await st.fade(false, 700);
  const acts = [{ at: 'ark' }, { at: 'view' }, { gesture: 'beat' }, {}, { gesture: 'nod' }];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], a = acts[i] || {};
    const last = i === lines.length - 1;
    if (l.who === 'eagle') {
      audio.sfx.eagle?.();
      h.look(st.eagle); g.look(st.eagle);
      await st.eagle.flyTo(st.perch.x, st.perch.y, reduced() ? 0.2 : 2.2, 140);
      st.eagle.face = 1;
      h.emote('surprised', 1.2);
      await st.say('eagle', fill(l.text), { to: 'hero', lastBtn: last ? 'В путь!' : 'Дальше' });
    } else {
      await st.say('guide', fill(l.text), { to: 'hero', at: a.at, gesture: a.gesture, lastBtn: last ? 'В путь!' : 'Дальше' });
    }
    ctx.guard();
  }
}

export async function epilogue(ctx) {
  const { st, hero, lines, guide, fill } = ctx;
  st.addHorse(hero.coat || 'tory', 150, 1);
  st.addEagle(152, 322, 1);
  st.addPerson('hero', heroRig(hero), 330, 1, heroMeta(hero));
  st.addPerson('guide', RIGS.sapar, 650, -1, { name: guide.name, role: guide.role, color: '#2F5E46', pitch: 105 });
  await st.fade(false, 800);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const last = i === lines.length - 1;
    await st.say(l.who === 'eagle' ? 'eagle' : 'guide', fill(l.text), { to: 'hero', lastBtn: last ? 'Открыть журнал' : 'Дальше', emo: l.who === 'eagle' ? undefined : 'kind' });
    if (i === 0) { st.get('hero').pose('cheer'); st.get('hero').emote('happy', 3); await wait(800); st.get('hero').pose('rest'); }
    ctx.guard();
  }
}

// ── живой предпросмотр героя при создании ─────────────
export function rigPreview(svg, hero) {
  let horse, person, raf = 0, last = performance.now();
  const build = (h) => {
    svg.innerHTML = '';
    horse = new Horse(h.coat || 'tory', { x: 120, y: 300, face: 1, s: 0.86 });
    horse.mount(svg);
    person = new Person(heroRig(h), { x: 300, y: 304, face: -1, s: 1.05 });
    person.mount(svg);
    person.look({ x: 210, y: 140 });
    person.emote('happy', 1.5);
  };
  build(hero);
  let wave = 2;
  const step = (now) => {
    if (!svg.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    wave -= dt;
    if (wave <= 0) { wave = 5 + Math.random() * 4; person.pose(Math.random() < 0.5 ? 'wave' : 'hips'); setTimeout(() => person.pose('rest'), 1600); }
    const wind = 0.35 + Math.sin(t * 0.5) * 0.2;
    horse.update(dt, t, wind); person.update(dt, t, wind);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return { set(h) { build(h); person.gesture('jump'); }, stop() { cancelAnimationFrame(raf); } };
}
