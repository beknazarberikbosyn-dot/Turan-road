// Сцена-режиссёр: собирает фон, персонажей и погоду, ведёт камеру,
// показывает субтитры и синхронизирует с ними губы и голоса,
// разыгрывает взаимодействия: приветствие, указание, передача предмета.
import { Person, viseme, isVowel, shade, clamp } from './rig.js';
import { Horse, Eagle } from './beasts.js';
import { backdrop, SW, SH } from './backdrop.js';
import { Weather } from './weather.js';
import * as audio from './audio.js';

const CPS = { slow: 16, normal: 30, fast: 56, instant: 0 };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const NS = 'http://www.w3.org/2000/svg';
const VOW = { 'а': 'a', 'ә': 'a', 'я': 'a', 'о': 'o', 'ө': 'o', 'ё': 'o', 'у': 'u', 'ұ': 'u', 'ү': 'u', 'ю': 'u', 'и': 'i', 'і': 'i', 'ы': 'e', 'е': 'e', 'э': 'e' };

export function splitText(text, max = 150) {
  const parts = text.match(/[^.!?…]+[.!?…]*[»"]?\s*/g) || [text];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export class Stage {
  constructor(host, opt = {}) {
    this.host = host;
    this.speed = opt.speed || 'normal';
    host.innerHTML = `
      <div class="stage-wrap">
        <div class="stage" tabindex="-1">
          <div class="st-cam">
            <svg class="st-bg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice"></svg>
            <svg class="st-mid" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice"></svg>
            <svg class="st-act" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice"><g class="st-actors"></g></svg>
            <canvas class="st-wx"></canvas>
            <svg class="st-fg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice"></svg>
            <div class="st-hot"></div>
          </div>
          <div class="st-tint"></div>
          <div class="st-era" hidden></div>
          <div class="st-fade"></div>
        </div>
        <div class="st-sub" aria-live="polite"><b class="st-name"></b><span class="st-text"></span><i class="st-more" hidden></i></div>
      </div>
      <div class="st-ctrl"></div>`;
    const q = (s) => host.querySelector(s);
    this.el = q('.stage'); this.wrap = q('.stage-wrap'); this.cam = q('.st-cam');
    this.bg = q('.st-bg'); this.mid = q('.st-mid'); this.fg = q('.st-fg');
    this.actorsG = q('.st-actors'); this.hot = q('.st-hot');
    this.sub = q('.st-sub'); this.subName = q('.st-name'); this.subText = q('.st-text'); this.more = q('.st-more');
    this.ctrl = q('.st-ctrl'); this.tint = q('.st-tint'); this.eraEl = q('.st-era'); this.fadeEl = q('.st-fade');
    this.wx = new Weather(q('.st-wx'));
    this.actors = []; this.cast = {}; this.tickers = new Set();
    this.gust = 0; this.gustT = 3; this.windBase = 0.4;
    this.sayN = 0; this.cut = null; this.paused = false; this.lifeT = 3; this.glances = [];
    this.advance = null;
    this.onKey = (e) => {
      if (!this.advance) return;
      if (['Enter', ' ', 'ArrowRight'].includes(e.key) && !e.target.closest?.('input, textarea')) {
        if (e.target.closest?.('button') && !e.target.closest('.st-next')) return;
        e.preventDefault(); this.advance();
      }
    };
    document.addEventListener('keydown', this.onKey);
    this.wrap.addEventListener('click', (e) => { if (e.target.closest('.st-hot button')) return; this.advance?.(); });
    this.setScene(opt.kind || 'camp', opt);
    this.loop();
  }

  // ── сцена ──
  setScene(kind, o = {}) {
    const b = backdrop(kind, o);
    this.b = b;
    this.bg.innerHTML = b.bg; this.mid.innerHTML = b.mid; this.fg.innerHTML = b.fg;
    this.anchors = { ...b.anchors };
    this.windBase = o.wind ?? b.wind ?? 0.4;
    const fires = Object.entries(b.anchors).filter(([k]) => k === 'fire').map(([, v]) => [v[0], v[1] + 20]);
    this.weatherModes = o.weather || b.weather || [];
    this.wx.set(this.weatherModes, { fires: fires.length ? fires : [[480, 470]] });
    this.sways = [...this.mid.querySelectorAll('[data-sway]'), ...this.fg.querySelectorAll('[data-sway]')].map((el) => ({
      el, amp: +el.getAttribute('data-sway'), px: +el.getAttribute('data-px'), py: +el.getAttribute('data-py'), ph: Math.random() * 6,
    }));
    this.clouds = [...this.mid.querySelectorAll('.bd-cloud')].map((el) => ({ el, sp: +el.getAttribute('data-cloud') || 1, x: +el.getAttribute('data-x') || 0 }));
    this.el.dataset.tone = o.tone || '';
    this.el.classList.toggle('under', !!b.under);
    audio.ambience?.(this.weatherModes, kind);
  }
  pt(a) {
    if (!a) return null;
    if (Array.isArray(a)) return { x: a[0], y: a[1] };
    if (typeof a === 'string' && a[0] === '@') {
      const [id, part] = a.slice(1).split(':');
      const ac = this.get(id);
      if (!ac) return null;
      if (part === 'head' && ac.headPos) return ac.headPos();
      return { x: ac.x, y: ac.y - (ac.P ? (ac.P.leg + ac.P.torso * 0.55) * ac.s : 60) };
    }
    if (typeof a === 'string') { const v = this.anchors[a]; return v ? { x: v[0], y: v[1] } : null; }
    if (a.headPos) return a.headPos();
    return a;
  }

  // ── актёры ──
  addPerson(id, spec, x, face = 1, meta = {}) {
    const p = new Person(spec, { x, y: meta.y ?? 505, face, s: meta.s ?? 1 });
    p.mount(this.actorsG);
    p.basePose = spec.pose || 'rest';
    this.actors.push(p);
    this.cast[id] = { actor: p, name: meta.name || '', role: meta.role || '', color: meta.color || '#A8322A', pitch: meta.pitch || 150 };
    return p;
  }
  addHorse(coat, x, face = 1, s = 0.95, id = 'horse') {
    const h = new Horse(coat, { x, y: 500, face, s });
    h.mount(this.actorsG); this.actors.push(h);
    if (id === 'horse') this.horse = h;
    this.cast[id] = { actor: h, name: '' };
    return h;
  }
  addEagle(x, y, face = 1, meta = {}) {
    const e = new Eagle({ x, y, face, s: meta.s ?? 0.95 });
    e.z = 260;
    e.mount(this.actorsG); this.actors.push(e); this.eagle = e; this.perch = { x, y, face };
    this.cast.eagle = { actor: e, name: meta.name || 'Қыран', role: 'беркут', color: '#7A5A2E', pitch: 520, bird: true };
    return e;
  }
  remove(id) {
    const c = this.cast[id];
    if (!c) return;
    c.actor.el.remove();
    this.actors = this.actors.filter((a) => a !== c.actor);
    delete this.cast[id];
  }
  get(id) { return this.cast[id]?.actor; }
  addProp(id, html, x, y, o = {}) {
    const el = document.createElementNS(NS, 'g');
    el.setAttribute('class', 'st-prop');
    el.setAttribute('transform', `translate(${x},${y})${o.s ? ` scale(${o.s})` : ''}`);
    el.innerHTML = html;
    this.actorsG.appendChild(el);
    const prop = { el, x, y, z: o.z || 0, prop: true, update: o.update ? (dt, t) => o.update(el, dt, t) : () => {} };
    this.actors.push(prop);
    this.cast[id] = { actor: prop, name: '' };
    return prop;
  }
  clearActors() {
    this.cut?.();
    for (const a of this.actors) a.el.remove();
    this.actors = []; this.cast = {}; this.horse = null; this.eagle = null; this.glances = [];
  }
  speaking() { return this.actors.some((a) => a.talking); }

  // ── цикл анимации ──
  loop() {
    let last = performance.now();
    const step = (now) => {
      if (!this.host.isConnected) { this.destroy(); return; }
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const t = now / 1000;
      if (this.paused) { this.raf = requestAnimationFrame(step); return; }
      this.gustT -= dt;
      if (this.gustT <= 0) { this.gustTarget = (Math.random() < 0.5 ? 1 : 0.6) * (0.4 + Math.random() * 0.6); this.gustT = 4 + Math.random() * 6; this.gustLen = 1.6; }
      if (this.gustLen > 0) { this.gustLen -= dt; this.gust += (this.gustTarget - this.gust) * dt * 2; } else this.gust += (0 - this.gust) * dt * 0.8;
      const wb = this.windBase;
      this.wind = wb * (0.62 + 0.3 * Math.sin(t * 0.37) + 0.14 * Math.sin(t * 1.3 + 2)) + this.gust * Math.sign(wb || 1) * Math.abs(wb) * 0.9;
      // глубина: кто ниже — тот ближе
      const order = [...this.actors].sort((a, b) => (a.y + (a.z || 0)) - (b.y + (b.z || 0)));
      if (order.some((a, i) => this.actorsG.children[i] !== a.el)) order.forEach((a) => this.actorsG.appendChild(a.el));
      for (const a of this.actors) a.update(dt, t, this.wind);
      for (const s of this.sways) {
        const a = this.wind * s.amp * 4 + Math.sin(t * 1.7 + s.ph) * s.amp * (0.6 + Math.abs(this.wind));
        s.el.setAttribute('transform', `rotate(${a.toFixed(2)} ${s.px} ${s.py})`);
      }
      for (const c of this.clouds) {
        const span = SW + 420;
        let x = (c.x + 210 + t * c.sp * (8 + Math.abs(this.wind) * 14) * Math.sign(this.wind || 1)) % span;
        if (x < 0) x += span;
        c.el.setAttribute('transform', `translate(${(x - 210 - c.x).toFixed(1)},0)`);
      }
      this.wx.update(dt, t, this.wind);
      this.life(dt);
      for (const fn of this.tickers) fn(dt, t);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  // живость: люди переглядываются, кивают собеседнику, смотрят по сторонам
  life(dt) {
    for (const g of this.glances) {
      g.t -= dt;
      if (g.t <= 0 && g.p.gaze === g.to) g.p.look(g.prev);
    }
    this.glances = this.glances.filter((g) => g.t > 0);
    this.lifeT -= dt;
    if (this.lifeT > 0) return;
    this.lifeT = 1.6 + Math.random() * 2.6;
    const people = this.actors.filter((a) => a instanceof Person && !a.talking && !a.walk);
    if (!people.length) return;
    const p = people[Math.floor(Math.random() * people.length)];
    if (this.speaking()) { if (Math.random() < 0.45) p.gesture(Math.random() < 0.7 ? 'nod' : 'nod2'); return; }
    if (this.glances.some((g) => g.p === p)) return;
    const spots = Object.values(this.anchors || {});
    const others = this.actors.filter((a) => a !== p && (a instanceof Person || a === this.eagle || a === this.horse));
    let to;
    if (others.length && Math.random() < 0.55) to = others[Math.floor(Math.random() * others.length)];
    else if (spots.length) { const v = spots[Math.floor(Math.random() * spots.length)]; to = { x: v[0], y: v[1] }; }
    if (!to) return;
    this.glances.push({ p, to, prev: p.gaze, t: 1.1 + Math.random() * 1.4 });
    p.look(to);
  }
  pause(on) {
    if (this.paused === on) return;
    this.paused = on;
    if (on) { this.cut?.(); audio.ambience?.([]); } else audio.ambience?.(this.weatherModes, this.b.kind);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this.onKey);
    this.tickers.clear();
    audio.ambience?.([]);
  }

  // ── камера ──
  focus(target, z = 1.07) {
    if (reduced()) return;
    const p = this.pt(target);
    if (!p) return this.camReset();
    const x = Math.min(Math.max(p.x, 0), SW), y = Math.min(Math.max(p.y + 60, 0), SH);
    this.cam.style.transform = `translate(${((x / SW) * (1 - z) * 100).toFixed(2)}%,${((y / SH) * (1 - z) * 100).toFixed(2)}%) scale(${z})`;
  }
  camReset() { this.cam.style.transform = ''; }
  era(text) { this.eraEl.hidden = !text; this.eraEl.textContent = text || ''; this.wrap.classList.toggle('has-era', !!text); }
  async fade(on, ms = 450) { this.fadeEl.classList.toggle('on', on); await wait(reduced() ? 50 : ms); }

  // ── речь ──
  async say(id, text, o = {}) {
    const c = this.cast[id];
    if (!c || !c.actor.talk) return this.narrate(text, o);
    const a = c.actor;
    const n = ++this.sayN;
    a._say = n;
    const atP = o.at ? this.pt(o.at) : null;
    let turned = 0;
    if (atP && a instanceof Person && (atP.x - a.x) * a.face < -30) { turned = a.face; a.face = -a.face; }
    const max = this.wrap.clientWidth < 620 ? 120 : 160;
    const chunks = splitText(text, max);
    const others = this.actors.filter((x) => x !== a && !(x instanceof Horse));
    for (const x of others) if (!o.keepLook) x.look?.(a);
    const listener = o.to ? this.cast[o.to]?.actor : others.find((x) => x instanceof Person) || others[0];
    if (o.look) a.look?.(this.pt(o.look)); else if (listener) a.look?.(listener);
    if (o.emo) a.emote?.(o.emo, o.emoT || 0);
    let posed = false;
    if (o.pose) { a.pose?.(o.pose, { at: this.pt(o.at) }); posed = true; }
    else if (o.at && a.pose) { a.pose('point', { at: this.pt(o.at) }); posed = true; }
    else if (/^(Сәлем|Ассалау|Қош|Рахмет|Сау бол|Сәт сапар|Жақсы)/i.test(text) && a.pose) { a.pose('heart'); a.gesture('bow'); posed = true; }
    if (o.gesture) a.gesture?.(o.gesture);
    this.subAt(atP || (o.cam ? this.pt(o.cam) : null), o.top);
    this.focus(o.cam ?? (a.headPos ? { x: a.headPos().x, y: a.headPos().y + 80 } : null), o.zoom || 1.07);
    let cut = false;
    for (let i = 0; i < chunks.length; i++) {
      const last = i === chunks.length - 1;
      // длинную реплику читаем по частям: сама уходит только последняя
      await this.line(c, chunks[i], { ...o, last, auto: last ? o.auto : 0 });
      if (!this.host.isConnected) return;
      if (this.sayN !== n) { cut = true; break; }
    }
    if (a._say === n) {
      if (posed && !o.keepPose && a.pose) a.pose(a.basePose || 'rest');
      if (turned && !o.keepPose) a.face = turned;
    }
    if (!o.keepCam && !cut) this.camReset();
  }
  async narrate(text, o = {}) {
    const n = ++this.sayN;
    const chunks = splitText(text, this.wrap.clientWidth < 620 ? 130 : 180);
    this.subAt(o.cam ? this.pt(o.cam) : null, o.top);
    if (o.cam) this.focus(o.cam, o.zoom || 1.06);
    for (let i = 0; i < chunks.length; i++) {
      const last = i === chunks.length - 1;
      await this.line(null, chunks[i], { ...o, last, auto: last ? o.auto : 0 });
      if (this.sayN !== n || !this.host.isConnected) return;
    }
    if (o.cam && !o.keepCam) this.camReset();
  }

  line(c, text, o = {}) {
    this.cut?.();
    return new Promise((res) => {
      const a = c?.actor;
      this.sub.classList.toggle('narr', !c);
      this.sub.style.setProperty('--who', c?.color ? shade(c.color, 0.45) : '#E7A93B');
      this.subName.textContent = c ? c.name : '';
      if (c && c.role && o.role !== false) { const sm = document.createElement('small'); sm.textContent = c.role; this.subName.appendChild(sm); }
      this.subText.textContent = '';
      this.more.hidden = true;
      this.sub.classList.add('show');
      const cps = CPS[this.speed] ?? 30;
      const total = text.length;
      let shown = cps ? 0 : total, acc = 0, typingDone = !cps, mouthT = cps ? 0 : Math.min(2.4, total / 26), lastBlip = 0, open = 0;
      if (!cps) this.subText.textContent = text;
      if (a?.talk) a.talk(true);
      const speakChar = (ch, t) => {
        if (!a) return;
        const low = (ch || '').toLowerCase();
        if (isVowel(low)) {
          a.setViseme?.(viseme(low)); open = 1;
          if (t - lastBlip > 0.075) { lastBlip = t; audio.voice?.(c.pitch * (0.92 + Math.random() * 0.16), VOW[low] || 'a', c.bird); }
        } else if (/[мбп]/.test(low)) a.setViseme?.([0, 0.95, 0.05]);
        else if (/[\s.,!?—:;«»]/.test(low)) a.setViseme?.([0.04, 1, 0]);
        else if (open) a.setViseme?.([0.18, 1, 0.15]);
      };
      const finish = () => {
        typingDone = true; shown = total; this.subText.textContent = text;
        if (a?.talk) a.talk(false);
        this.more.hidden = false;
        if (o.auto) { setTimeout(done, o.auto); if (o.hold) this.more.hidden = true; return; }
        this.showNext(o.btn || (o.last ? (o.lastBtn || 'Дальше') : 'Дальше'));
        if (/!$/.test(text.trim())) for (const x of this.actors) if (x !== a && x.gesture && Math.random() < 0.6) x.gesture('nod');
      };
      const tick = (dt, t) => {
        if (!typingDone) {
          acc += dt * cps;
          while (acc >= 1 && shown < total) { acc -= 1; shown++; speakChar(text[shown - 1], t); }
          this.subText.textContent = text.slice(0, shown);
          if (shown >= total) { this.tickers.delete(tick); finish(); }
        }
      };
      const tickInstant = (dt, t) => {
        mouthT -= dt;
        const k = Math.floor((1 - Math.max(0, mouthT) / Math.min(2.4, total / 26 || 1)) * total);
        speakChar(text[k] || ' ', t);
        if (mouthT <= 0) { this.tickers.delete(tickInstant); if (a?.talk) a.talk(false); }
      };
      let fin = false;
      const done = () => {
        if (fin) return; fin = true;
        if (this.cut === done) this.cut = null;
        this.tickers.delete(tick); this.tickers.delete(tickInstant);
        if (a?.talk) a.talk(false);
        if (this.advance === adv) { this.advance = null; this.hideNext(); }
        res();
      };
      this.cut = done;
      const adv = () => {
        if (!typingDone) { this.tickers.delete(tick); finish(); return; }
        if (o.auto) return;
        audio.sfx.page();
        done();
      };
      this.advance = adv;
      if (cps) this.tickers.add(tick); else { this.tickers.add(tickInstant); finish(); }
    });
  }
  // если показываем что-то внизу картинки, субтитры уходят наверх
  subAt(p, top) { this.sub.classList.toggle('top', !!top || (!!p && p.y > 330)); }
  // убрать субтитры через время, если за это время никто ничего не сказал
  fadeSub(ms = 3500) { const n = this.sayN; setTimeout(() => { if (this.sayN === n && !this.cut && this.host.isConnected) this.clearSub(); }, ms); }
  showNext(label) {
    this.ctrl.innerHTML = `<button class="btn st-next">${esc(label)}</button>`;
    const b = this.ctrl.firstElementChild;
    b.addEventListener('click', (e) => { e.stopPropagation(); this.advance?.(); });
    b.focus({ preventScroll: true });
  }
  hideNext() { this.ctrl.innerHTML = ''; this.more.hidden = true; }
  clearSub() { this.cut?.(); this.sub.classList.remove('show'); this.subText.textContent = ''; this.subName.textContent = ''; }

  // ── точки на картинке ──
  hotspots(list, onPick) {
    this.hot.innerHTML = '';
    const btns = list.map((h) => {
      const p = this.pt(h.at) || { x: 480, y: 270 };
      const b = document.createElement('button');
      b.className = 'st-spot' + (h.done ? ' done' : '') + (h.cls ? ' ' + h.cls : '');
      b.style.left = (p.x / SW * 100).toFixed(2) + '%';
      b.style.top = (p.y / SH * 100).toFixed(2) + '%';
      b.innerHTML = `<i></i><span>${esc(h.label)}</span>`;
      b.setAttribute('aria-label', h.label);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (!b.disabled) onPick(h, b); });
      this.hot.appendChild(b);
      return b;
    });
    return { btns, clear: () => { this.hot.innerHTML = ''; } };
  }

  // ── взаимодействия ──
  async greet(ids) {
    const as = ids.map((i) => this.get(i)).filter(Boolean);
    as.forEach((a) => { a.pose('heart'); a.gesture('bow'); a.emote('happy', 2); });
    await wait(1300);
    as.forEach((a) => a.pose(a.basePose || 'rest'));
  }
  async walk(id, x, speed = 130) { const a = this.get(id); if (a?.walkTo) await a.walkTo(x, speed); }
  async give(fromId, toId, html, o = {}) {
    const A = this.get(fromId), B = this.get(toId);
    if (!A || !B) return;
    const home = o.home ?? A.x;
    const keep = o.keep ?? A.items[1];
    const gap = 92;
    const tx = B.x + (A.x > B.x ? gap : -gap);
    A.hold('gift', 1, html);
    A.pose('hold');
    await A.walkTo(tx, 120);
    A.face = B.x > A.x ? 1 : -1; B.face = -A.face;
    A.look(B); B.look(A);
    A.pose('give'); B.pose('reach'); B.emote('surprised', 0.8);
    await wait(700);
    A.hold(null, 1); B.hold('gift', 1, html);
    B.pose('present'); B.emote('happy', 3); A.emote('happy', 3);
    audio.sfx.chime();
    await wait(1100);
    A.hold(keep && keep !== 'gift' ? keep : null, 1);
    A.pose(A.basePose || 'rest');
    if (Math.abs(home - A.x) > 4) await A.walkTo(home, 110);
    A.face = B.x > A.x ? 1 : -1;
    A.look(B);
  }
  // беркут подлетает к герою, подсказывает и возвращается
  async hint(text, o = {}) {
    const e = this.eagle;
    if (!e) return this.narrate(text, o);
    const hero = this.get('hero');
    const home = this.perch || { x: e.x, y: e.y, face: e.face };
    const hp = hero ? hero.headPos() : { x: 300, y: 260 };
    audio.sfx.eagle?.();
    await e.flyTo(clamp(hp.x + 74, 70, 890), hp.y - 34, 0.9, 50);
    e.setSpread(true); e.look(hero || null);
    await this.say('eagle', text, { to: 'hero', ...o });
    await e.flyTo(home.x, home.y, 0.9, 50);
    e.face = home.face; e.look(null);
  }
  async eagleTo(x, y) { if (this.eagle) { audio.sfx.eagle(); await this.eagle.flyTo(x, y, 1.4, 90); } }
}
