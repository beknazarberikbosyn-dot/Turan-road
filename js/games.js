// Экшен-испытания. Каждая игра рисуется на «сцене» 600×320, которая масштабируется под экран.
import * as audio from './audio.js';
import { heroMarkup } from './hero.js';
import { beast, beastName, eagle, fish, trash, item, ITEM_NAMES } from './sprites.js';

export const GW = 600, GH = 320;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const heartsHTML = (n, max) => Array.from({ length: max }, (_, i) => `<i class="g-heart ${i < n ? '' : 'off'}"></i>`).join('');
const KEYS_UP = ['Space', 'ArrowUp', 'KeyW'];

export const GAME_NAMES = {
  tiles: 'Мозаика', dig: 'Раскопки', runner: 'Скачка', trace: 'Петроглиф', dress: 'Золотой наряд',
  catcher: 'Ловкие руки', snap: 'Охота с фотоаппаратом', fish: 'Рыбалка', flight: 'Полёт беркута',
  archery: 'Стрельба из лука', rhythm: 'Ритм домбры', dam: 'Плотина',
};

// ── оболочка ──────────────────────────────────────────
export function playGame(host, spec, ctx = {}) {
  return new Promise((resolve) => {
    let fails = 0, session = null;
    host.innerHTML = `<div class="game">
      <div class="game-bar"><b class="game-title">${spec.title}</b><span class="game-hud" data-g="hud"></span></div>
      <div class="game-stage" data-g="stage">
        <div class="game-inner" data-g="inner"></div>
        <div class="game-cover" data-g="cover"></div>
      </div></div>`;
    const stage = host.querySelector('[data-g=stage]');
    const inner = host.querySelector('[data-g=inner]');
    const cover = host.querySelector('[data-g=cover]');
    const hud = host.querySelector('[data-g=hud]');
    const fit = () => { inner.style.transform = `scale(${stage.clientWidth / GW})`; };
    const ro = new ResizeObserver(fit); ro.observe(stage); fit();

    const coverBox = (html) => {
      cover.innerHTML = `<div class="gc-box">${html}</div>`;
      cover.hidden = false;
      const b = cover.querySelector('button');
      b?.focus({ preventScroll: true });
      stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const BG = { tiles: 'g-felt', dig: spec.skin === 'chalk' ? 'g-chalkbed' : 'g-sandbed', runner: 'g-runbg', trace: 'g-rock', dress: 'g-tent', catcher: 'g-canyonbg', snap: spec.mode === 'fish' ? 'g-lakebg' : 'g-safaribg', flight: 'g-skybg', archery: 'g-lakebg2', rhythm: 'g-yurtbg', dam: 'g-aralbg' };
    const intro = () => {
      inner.className = 'game-inner ' + BG[spec.type];
      coverBox(`<h4>${spec.title}</h4><p>${spec.how}</p>${spec.keys ? `<p class="gc-keys">${spec.keys}</p>` : ''}
        <button class="btn big ready" data-a="start">Начать</button>`);
    };

    const start = () => {
      cover.hidden = true;
      inner.innerHTML = ''; hud.innerHTML = '';
      inner.className = 'game-inner';
      stage.tabIndex = -1; stage.focus({ preventScroll: true });
      session = makeSession();
      window.__turanGame = session.api;
      audio.sfx.click();
      GAMES[spec.type](session.api, spec, ctx);
    };

    function makeSession() {
      let alive = true, raf = 0;
      const offs = [], timers = [];
      const stop = () => {
        alive = false; cancelAnimationFrame(raf);
        offs.splice(0).forEach((f) => f()); timers.splice(0).forEach(clearTimeout);
      };
      const end = (res) => {
        if (!alive) return;
        stop();
        spec.onEnd?.();
        setTimeout(() => {
          if (!document.body.contains(stage)) return;
          if (res.win) {
            audio.sfx.chime();
            const st = clamp(res.stars || 1, 1, 3);
            coverBox(`<h4>${res.title || 'Испытание пройдено!'}</h4>
              <div class="gc-stars" aria-label="${st} из 3">${[1, 2, 3].map((i) => `<i class="${i <= st ? 'on' : ''}" style="--d:${i * 0.15}s"></i>`).join('')}</div>
              ${res.msg ? `<p>${res.msg}</p>` : ''}
              <button class="btn big ready" data-a="done">Дальше</button>`);
            cover.querySelector('[data-a=done]').onclick = () => { audio.sfx.click(); ro.disconnect(); resolve({ win: true, stars: st }); };
          } else {
            fails++;
            audio.sfx.wrong();
            coverBox(`<h4>${res.title || 'Почти получилось!'}</h4><p>${res.msg || ''}</p>
              <div class="gc-row"><button class="btn big" data-a="again">Ещё раз</button>
              ${fails >= 2 ? '<button class="btn ghost" data-a="skip">Пропустить испытание</button>' : ''}</div>`);
            cover.querySelector('[data-a=again]').onclick = start;
            const sk = cover.querySelector('[data-a=skip]');
            if (sk) sk.onclick = () => { audio.sfx.click(); ro.disconnect(); resolve({ win: false, skipped: true }); };
          }
        }, res.win ? 700 : 450);
      };
      const api = {
        inner, W: GW, H: GH, ctx,
        get alive() { return alive; },
        hud(html) { hud.innerHTML = html; },
        loop(fn) {
          let last = performance.now();
          const step = (t) => {
            if (!alive) return;
            if (!document.body.contains(inner)) { stop(); spec.onEnd?.(); return; }
            const dt = Math.min(0.05, (t - last) / 1000); last = t;
            fn(dt, t / 1000);
            if (alive) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        },
        on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); offs.push(() => el.removeEventListener(ev, fn, opt)); },
        later(fn, ms) { const id = setTimeout(() => { if (alive) fn(); }, ms); timers.push(id); return id; },
        pt(e) { const r = inner.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * GW, y: (e.clientY - r.top) / r.height * GH }; },
        add(html, cls = '', parent = inner) {
          const d = document.createElement('div');
          d.className = 'g-abs ' + cls; d.innerHTML = html; parent.appendChild(d); return d;
        },
        put(el, x, y, extra = '') { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${extra}`; },
        burst(x, y, color = '#E7A93B', n = 10) {
          for (let i = 0; i < n; i++) {
            const p = api.add('', 'g-spark');
            const a = Math.random() * Math.PI * 2, r = rnd(20, 54);
            p.style.cssText += `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
            p.addEventListener('animationend', () => p.remove());
          }
        },
        float(x, y, text, color = '#fff') {
          const p = api.add(text, 'g-float');
          p.style.cssText += `left:${x}px;top:${y}px;color:${color}`;
          p.addEventListener('animationend', () => p.remove());
        },
        win: (stars, msg, title) => end({ win: true, stars, msg, title }),
        lose: (msg, title) => end({ win: false, msg, title }),
      };
      return { api, stop };
    }

    cover.addEventListener('click', (e) => { if (e.target.closest('[data-a=start]')) start(); });
    intro();
  });
}

// ── 1. Мозаика: поверни плитки (Туркестан) ────────────
function ornament() {
  const star = (cx, cy, r, fill) => `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="${fill}"/><rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="${fill}" transform="rotate(45 ${cx} ${cy})"/>`;
  return `<defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9F2EE"/><stop offset="1" stop-color="#23518F"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#tlg)"/>
    <rect x="8" y="8" width="284" height="284" fill="none" stroke="#E7A93B" stroke-width="7"/>
    <path d="M30,140 Q30,40 150,26 Q270,40 270,140" fill="none" stroke="#1C9AA0" stroke-width="12"/>
    <path d="M30,140 Q30,40 150,26 Q270,40 270,140" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>
    ${star(150, 168, 72, '#fff')}${star(150, 168, 64, '#1C9AA0')}
    <circle cx="150" cy="168" r="42" fill="#23518F" stroke="#fff" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<ellipse cx="150" cy="140" rx="7" ry="20" fill="#E7A93B" transform="rotate(${i * 45} 150 168)"/>`).join('')}
    <circle cx="150" cy="168" r="9" fill="#fff"/>
    <path d="M150,96 V60 M150,72 Q128,50 118,64 Q112,76 126,78 M150,72 Q172,50 182,64 Q188,76 174,78" stroke="#E7A93B" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M24,40 q20,-10 22,10 q-2,14 -14,10 M276,40 q-20,-10 -22,10 q2,14 14,10" stroke="#A8322A" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${30 + i * 30},282 l12,-20 l12,20Z" fill="#E7A93B" stroke="#fff" stroke-width="1.5"/>`).join('')}
    <circle cx="40" cy="250" r="8" fill="#fff"/><circle cx="260" cy="250" r="8" fill="#fff"/>`;
}

function tiles(api, spec) {
  const N = 3, S = 92, gap = 3, ox = 60, oy = (GH - (S * N + gap * (N - 1))) / 2;
  api.inner.classList.add('g-felt');
  api.add(`<svg width="0" height="0"><defs><g id="tileArt">${ornament()}</g></defs></svg>`);
  const ref = api.add(`<svg viewBox="0 0 300 300" width="150" height="150"><use href="#tileArt"/></svg><span>Так должно получиться</span>`, 'g-ref');
  api.put(ref, 410, 70);
  let rots = [];
  do { rots = Array.from({ length: N * N }, () => pick([0, 90, 180, 270])); } while (rots.filter((r) => r).length < 6);
  const min = rots.reduce((s, r) => s + ((360 - r) % 360) / 90, 0);
  let moves = 0, done = false;
  const upd = () => api.hud(`Ходов: <b>${moves}</b>`);
  upd();
  rots.forEach((r, i) => {
    const cx = i % N, cy = Math.floor(i / N);
    const b = document.createElement('button');
    b.className = 'g-abs g-tile';
    b.setAttribute('aria-label', `Плитка ${i + 1}, повернуть`);
    b.style.cssText = `width:${S}px;height:${S}px;left:${ox + cx * (S + gap)}px;top:${oy + cy * (S + gap)}px;transform:rotate(${r}deg)`;
    b.innerHTML = `<svg viewBox="${cx * 100} ${cy * 100} 100 100" width="${S}" height="${S}"><use href="#tileArt"/></svg>`;
    api.inner.appendChild(b);
    api.on(b, 'click', () => {
      if (done) return;
      rots[i] += 90; moves++; upd();
      b.style.transform = `rotate(${rots[i]}deg)`;
      audio.sfx.tock();
      if (rots[i] % 360 === 0) { b.classList.add('ok'); audio.sfx.pop(); } else b.classList.remove('ok');
      if (rots.every((x) => x % 360 === 0)) {
        done = true;
        api.inner.querySelectorAll('.g-tile').forEach((t) => t.classList.add('won'));
        api.burst(ox + 140, oy + 140, '#1C9AA0', 24);
        api.burst(ox + 140, oy + 140, '#E7A93B', 16);
        api.later(() => api.win(moves <= min + 2 ? 3 : moves <= min + 8 ? 2 : 1, 'Изразец снова на месте — купол засиял, как шестьсот лет назад.'), 900);
      }
    });
  });
}

// ── 2. Раскопки: смахни песок (Отрар, Мангистау) ──────
function dig(api, spec) {
  const chalk = spec.skin === 'chalk';
  const T = spec.time || 70;
  const kinds = spec.items;
  api.inner.classList.add(chalk ? 'g-chalkbed' : 'g-sandbed');
  // раскладываем находки
  const spots = [];
  for (const k of kinds) {
    let p, tries = 0;
    do { p = { x: rnd(50, 550), y: rnd(50, 270) }; tries++; } while (tries < 200 && spots.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < 90));
    spots.push({ ...p, kind: k, found: false });
  }
  spots.forEach((s) => {
    s.el = api.add(item(s.kind, 58), 'g-find');
    api.put(s.el, s.x - 29, s.y - 29, `rotate(${rnd(-30, 30).toFixed(0)}deg)`);
  });
  // покрывающий слой
  const cv = document.createElement('canvas');
  cv.width = GW; cv.height = GH; cv.className = 'g-abs g-cover-cv';
  api.inner.appendChild(cv);
  const c = cv.getContext('2d');
  c.fillStyle = chalk ? '#EFE7D6' : '#E2B978'; c.fillRect(0, 0, GW, GH);
  for (let i = 0; i < 9; i++) {
    c.fillStyle = chalk ? (i % 2 ? '#E6D3BC' : '#F6F0E4') : (i % 2 ? '#D8AA66' : '#EBC68A');
    const y = i * 38 + rnd(-6, 6);
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= GW; x += 50) c.lineTo(x, y + Math.sin(x / 70 + i) * 7);
    c.lineTo(GW, y + 16); c.lineTo(0, y + 16); c.fill();
  }
  for (let i = 0; i < 900; i++) {
    c.fillStyle = chalk ? `rgba(160,140,110,${rnd(0.1, 0.35)})` : `rgba(140,96,48,${rnd(0.1, 0.35)})`;
    c.fillRect(rnd(0, GW), rnd(0, GH), rnd(1, 3), rnd(1, 3));
  }
  const brush = api.add('', 'g-brush');
  const CS = 10, cols = GW / CS, rows = GH / CS;
  const cleared = new Uint8Array(cols * rows);
  let last = null, down = false, found = 0, left = T;
  const R = 26;
  const upd = () => api.hud(`Найдено <b>${found}/${kinds.length}</b> <span class="g-time">${Math.ceil(left)} с</span>`);
  upd();
  const scrape = (p) => {
    c.globalCompositeOperation = 'destination-out';
    c.lineCap = 'round'; c.lineWidth = R * 2;
    c.beginPath(); c.moveTo((last || p).x, (last || p).y); c.lineTo(p.x, p.y); c.stroke();
    c.globalCompositeOperation = 'source-over';
    const a = last || p, steps = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 8));
    for (let k = 0; k <= steps; k++) {
      const x = a.x + (p.x - a.x) * k / steps, y = a.y + (p.y - a.y) * k / steps;
      for (let gx = Math.floor((x - R) / CS); gx <= Math.floor((x + R) / CS); gx++) {
        for (let gy = Math.floor((y - R) / CS); gy <= Math.floor((y + R) / CS); gy++) {
          if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
          if (Math.hypot(gx * CS + 5 - x, gy * CS + 5 - y) < R) cleared[gy * cols + gx] = 1;
        }
      }
    }
    if (Math.random() < 0.35) {
      const d = api.add('', 'g-dust ' + (chalk ? 'chalk' : ''));
      d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
      d.addEventListener('animationend', () => d.remove());
    }
    last = p;
    for (const s of spots) {
      if (s.found) continue;
      let tot = 0, ok = 0;
      for (let gx = Math.floor((s.x - 22) / CS); gx <= Math.floor((s.x + 22) / CS); gx++) {
        for (let gy = Math.floor((s.y - 22) / CS); gy <= Math.floor((s.y + 22) / CS); gy++) {
          if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
          tot++; ok += cleared[gy * cols + gx];
        }
      }
      if (ok / tot > 0.62) {
        s.found = true; found++; upd();
        s.el.classList.add('found');
        audio.sfx.pop();
        api.burst(s.x, s.y, '#FFE7A3', 12);
        api.float(s.x, s.y - 34, ITEM_NAMES[s.kind] || '', '#2B2350');
        if (found === kinds.length) {
          api.later(() => api.win(left > T * 0.5 ? 3 : left > T * 0.25 ? 2 : 1, chalk ? 'Все окаменелости найдены! Им около ста миллионов лет.' : 'Все находки на месте. Отрар рассказал тебе свою историю.'), 700);
        }
      }
    }
  };
  api.on(api.inner, 'pointerdown', (e) => { down = true; last = null; api.inner.setPointerCapture?.(e.pointerId); scrape(api.pt(e)); });
  api.on(api.inner, 'pointermove', (e) => {
    const p = api.pt(e);
    api.put(brush, p.x - 24, p.y - 24);
    if (down) scrape(p);
  });
  const up = () => { down = false; last = null; };
  api.on(api.inner, 'pointerup', up); api.on(api.inner, 'pointercancel', up);
  api.loop((dt) => {
    left -= dt;
    if (Math.floor(left + dt) !== Math.floor(left)) upd();
    if (left <= 0) api.lose(chalk ? 'Солнце садится, пора в лагерь. Попробуй копать быстрее — веди щёткой широкими движениями.' : 'Ветер снова засыпал раскоп песком. Веди щёткой широкими движениями!');
  });
}

// ── 3. Скачка (Тараз) ─────────────────────────────────
function runner(api, spec, ctx) {
  const GY = 268;
  const need = spec.need || 8;
  api.inner.classList.add('g-runbg');
  const far = api.add(`<svg viewBox="0 0 1200 120" width="1200" height="120" preserveAspectRatio="none">${[0, 600].map((o) => `<path d="M${o},120 L${o + 60},50 L${o + 120},90 L${o + 200},30 L${o + 290},95 L${o + 360},45 L${o + 450},100 L${o + 520},40 L${o + 600},120Z" fill="#A9B7CC"/><path d="M${o + 185},42 L${o + 200},30 L${o + 215},42 L${o + 207},40 L${o + 200},46 L${o + 193},40Z M${o + 505},52 L${o + 520},40 L${o + 535},52 L${o + 520},50Z" fill="#fff"/>`).join('')}</svg>`, 'g-far');
  const mid = api.add(`<div class="g-caravan">${[0, 1, 2].map(() => beast('camel', 'walk')).join('')}</div><div class="g-caravan" style="left:600px">${[0, 1].map(() => beast('camel', 'walk')).join('')}</div>`, 'g-mid');
  const ground = api.add('', 'g-ground');
  const heroEl = api.add(`<svg viewBox="-4 -16 128 116" width="110" height="100" class="hero run">${heroMarkup(ctx.hero)}</svg>`, 'g-hero');
  let y = 0, vy = 0, jumps = 0, hearts = 3, inv = 0, got = 0, t = 0, dist = 0, nextObs = 300, nextItem = 160;
  const objs = [];
  const upd = () => api.hud(`${item(spec.collect, 22)} <b>${got}/${need}</b> <span class="g-hearts">${heartsHTML(hearts, 3)}</span>`);
  upd();
  const jump = () => {
    if (jumps >= 2) return;
    vy = jumps ? 480 : 600; jumps++;
    audio.sfx.jump();
  };
  api.on(api.inner, 'pointerdown', (e) => { e.preventDefault(); jump(); });
  api.on(window, 'keydown', (e) => { if (KEYS_UP.includes(e.code)) { e.preventDefault(); if (!e.repeat) jump(); } });
  const spawn = (kind, isItem, h = 0) => {
    const el = api.add(item(kind, isItem ? 36 : 46), isItem ? 'g-item' : 'g-obs');
    objs.push({ el, x: GW + 20, y: isItem ? GY - 36 - h : GY - 44, w: isItem ? 36 : 46, item: isItem, kind, done: false });
  };
  api.loop((dt) => {
    t += dt;
    const v = Math.min(380, 240 + t * 5);
    dist += v * dt;
    vy -= 1500 * dt; y += vy * dt;
    if (y <= 0) { y = 0; vy = 0; jumps = 0; }
    if (inv > 0) inv -= dt;
    heroEl.classList.toggle('blink', inv > 0);
    api.put(heroEl, 52, GY - 92 - y);
    far.style.transform = `translateX(${-(dist * 0.1) % 600}px)`;
    mid.style.transform = `translateX(${-(dist * 0.35) % 600}px)`;
    ground.style.backgroundPositionX = `${-dist}px`;
    if (dist > nextObs) { spawn(pick(spec.obstacles), false); nextObs = dist + rnd(320, 520); }
    if (dist > nextItem) { spawn(spec.collect, true, pick([0, 30, 70, 110])); nextItem = dist + rnd(170, 300); }
    const hx1 = 82, hx2 = 148, hy1 = GY - 66 - y, hy2 = GY - 6 - y;
    for (const o of objs) {
      o.x -= v * dt;
      api.put(o.el, o.x, o.y + (o.item ? Math.sin(t * 5 + o.x / 40) * 4 : 0));
      if (o.done) continue;
      const ox1 = o.x + 7, ox2 = o.x + o.w - 7, oy1 = o.y + 6, oy2 = o.y + o.w;
      if (ox1 < hx2 && ox2 > hx1 && oy1 < hy2 && oy2 > hy1) {
        if (o.item) {
          o.done = true; got++; upd(); o.el.classList.add('taken');
          audio.sfx.pop(); api.burst(o.x + 18, o.y + 18, '#E7A93B', 8);
          if (got >= need) api.later(() => api.win(hearts === 3 ? 3 : hearts === 2 ? 2 : 1, spec.winMsg), 300);
        } else if (inv <= 0) {
          o.done = true; hearts--; inv = 1.3; upd();
          audio.sfx.hit(); api.inner.classList.remove('shake'); void api.inner.offsetWidth; api.inner.classList.add('shake');
          if (hearts <= 0) api.lose('Конь споткнулся. Прыгай заранее — и не забывай про двойной прыжок!');
        }
      }
    }
    for (let i = objs.length - 1; i >= 0; i--) if (objs[i].x < -60) { objs[i].el.remove(); objs.splice(i, 1); }
    if (Math.random() < dt * 8 && y === 0) {
      const d = api.add('', 'g-dust');
      d.style.left = '70px'; d.style.top = GY - 6 + 'px';
      d.addEventListener('animationend', () => d.remove());
    }
  });
}

// ── 4. Петроглиф (Тамгалы) ────────────────────────────
const FIGURES = [
  {
    name: 'Солнцеголовый',
    strokes: [
      Array.from({ length: 11 }, (_, i) => { const a = (i % 10) / 10 * Math.PI * 2 - Math.PI / 2; return [300 + Math.cos(a) * 34, 92 + Math.sin(a) * 34]; }),
      [[300, 126], [300, 215]],
      [[248, 186], [300, 160], [352, 186]],
      [[266, 292], [300, 215], [334, 292]],
    ],
    extra: Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [[300 + Math.cos(a) * 42, 92 + Math.sin(a) * 42], [300 + Math.cos(a) * 60, 92 + Math.sin(a) * 60]]; }).concat([[[294, 92], [306, 92]]]),
  },
  {
    name: 'Бык',
    strokes: [
      [[180, 150], [250, 132], [330, 134], [388, 118], [430, 124], [452, 150], [424, 164], [396, 160], [382, 196], [292, 204], [204, 200], [176, 176], [180, 150]],
      [[370, 198], [374, 274]],
      [[214, 200], [206, 274]],
      [[412, 121], [398, 92], [428, 82]],
    ],
    extra: [[[350, 200], [348, 270]], [[236, 202], [232, 270]], [[180, 156], [150, 196]], [[150, 196], [144, 210]]],
  },
];

function trace(api) {
  api.inner.classList.add('g-rock');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320" class="g-old">
    <g stroke="#C9A982" stroke-width="3" fill="none" opacity=".28" stroke-linecap="round">
      <path d="M60,240 q14,-10 30,0 l2,16 M62,240 l-2,18 M88,240 l2,18 M90,238 q8,-14 0,-18"/>
      <path d="M500,70 l10,-14 l10,14 M510,56 v30 M496,72 h28 M500,86 l10,12 l10,-12"/>
      <circle cx="520" cy="250" r="12"/><path d="M520,262 v24"/>
    </g></svg>`);
  const svg = api.add('<svg viewBox="0 0 600 320" width="600" height="320"><g class="t-extra"></g><g class="t-lines"></g><line class="t-rubber" x1="0" y1="0" x2="0" y2="0"/><g class="t-dots"></g></svg>').firstElementChild;
  const gL = svg.querySelector('.t-lines'), gD = svg.querySelector('.t-dots'), gE = svg.querySelector('.t-extra'), rubber = svg.querySelector('.t-rubber');
  let fi = 0, si = 0, pi = 0, mistakes = 0, drawing = false, busy = false;
  const NS = 'http://www.w3.org/2000/svg';
  const fig = () => FIGURES[fi];
  const upd = () => api.hud(`Рисунок <b>${fi + 1}/${FIGURES.length}</b> · ошибок: ${mistakes}`);
  const drawDots = () => {
    gD.innerHTML = '';
    fig().strokes.forEach((st, s) => st.forEach(([x, y], p) => {
      if (!(s === si && p === pi) && p === st.length - 1 && st.length > 2 && x === st[0][0] && y === st[0][1]) return;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 9);
      const isNext = s === si && p === pi, isDone = s < si || (s === si && p < pi);
      c.setAttribute('class', `t-dot ${isNext ? 'next' : ''} ${isDone ? 'done' : ''}`);
      gD.appendChild(c);
    }));
  };
  const seg = (a, b, cls = 't-seg') => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
    l.setAttribute('class', cls);
    return l;
  };
  const next = () => fig().strokes[si][pi];
  const advance = () => {
    const st = fig().strokes[si];
    if (pi > 0) {
      gL.appendChild(seg(st[pi - 1], st[pi]));
      api.burst(st[pi][0], st[pi][1], '#F4E3C1', 6);
      audio.sfx.tock();
    } else audio.sfx.tock();
    pi++;
    if (pi >= st.length) {
      si++; pi = 0; drawing = false; rubber.style.opacity = 0;
      if (si >= fig().strokes.length) return figureDone();
    }
    drawDots();
  };
  const figureDone = () => {
    busy = true; gD.innerHTML = '';
    fig().extra.forEach(([a, b], i) => api.later(() => { gE.appendChild(seg(a, b, 't-seg extra')); audio.sfx.tock(); }, 60 * i));
    api.later(() => {
      audio.sfx.chime();
      svg.classList.add('glow');
      api.float(300, 26, `${fig().name}!`, '#FFE7A3');
    }, 60 * fig().extra.length + 100);
    api.later(() => {
      svg.classList.remove('glow');
      fi++;
      if (fi >= FIGURES.length) return api.win(mistakes <= 2 ? 3 : mistakes <= 6 ? 2 : 1, 'Твои рисунки теперь рядом с теми, что выбиты три тысячи лет назад.');
      gL.innerHTML = ''; gE.innerHTML = ''; si = 0; pi = 0; busy = false; upd(); drawDots();
    }, 60 * fig().extra.length + 1700);
  };
  const near = (p, q, r = 22) => Math.hypot(p.x - q[0], p.y - q[1]) < r;
  api.on(api.inner, 'pointerdown', (e) => {
    if (busy) return;
    const p = api.pt(e);
    api.inner.setPointerCapture?.(e.pointerId);
    if (near(p, next())) { drawing = true; advance(); return; }
    const st = fig().strokes[si];
    if (pi > 0 && near(p, st[pi - 1])) { drawing = true; return; }
    const any = fig().strokes.some((s) => s.some((q) => near(p, q, 14)));
    if (any) {
      mistakes++; upd(); audio.sfx.wrong();
      svg.classList.remove('nope'); void svg.getBoundingClientRect(); svg.classList.add('nope');
    }
  });
  api.on(api.inner, 'pointermove', (e) => {
    if (!drawing || busy) return;
    const p = api.pt(e);
    const st = fig().strokes[si];
    if (pi > 0) {
      const a = st[pi - 1];
      rubber.setAttribute('x1', a[0]); rubber.setAttribute('y1', a[1]); rubber.setAttribute('x2', p.x); rubber.setAttribute('y2', p.y);
      rubber.style.opacity = 1;
    }
    if (near(p, next(), 20)) advance();
  });
  const up = () => { drawing = false; rubber.style.opacity = 0; };
  api.on(api.inner, 'pointerup', up); api.on(api.inner, 'pointercancel', up);
  upd(); drawDots();
}

// ── 5. Золотой наряд (Есик) ───────────────────────────
const PIECES = [
  { id: 'ibex', name: 'Горный козёл', x: 150, y: 14, w: 40, h: 28, svg: '<path d="M6,26 L8,14 Q10,8 18,8 L30,8 L34,4 L36,8 L34,14 L32,26 M12,14 L12,26 M28,14 L28,26 M32,6 Q26,-4 18,-2" stroke="#B9873A" stroke-width="3.4" fill="#E7A93B" stroke-linejoin="round" stroke-linecap="round"/>' },
  { id: 'arrows', name: 'Золотые стрелы', x: 150, y: 50, w: 44, h: 32, svg: '<g stroke="#B9873A" stroke-width="3" stroke-linecap="round"><path d="M6,30 L10,4 M16,30 L18,2 M28,30 L26,2 M38,30 L34,4"/></g><g fill="#E7A93B"><path d="M10,4 l-4,6 h8Z M18,2 l-4,6 h8Z M26,2 l-4,6 h8Z M34,4 l-4,6 h8Z"/></g>' },
  { id: 'horse', name: 'Крылатые кони', x: 150, y: 82, w: 54, h: 24, svg: '<path d="M4,20 L8,10 Q12,6 20,8 L28,8 Q30,2 26,0 L34,2 Q40,0 44,4 L50,8 L46,10 L40,8 L38,20 M12,12 L12,22 M30,10 L32,22 M18,8 Q20,-2 30,-4 Q24,2 22,8" stroke="#B9873A" stroke-width="2.6" fill="#E7A93B" stroke-linejoin="round"/>' },
  { id: 'torque', name: 'Золотая гривна', x: 150, y: 132, w: 50, h: 18, svg: '<path d="M4,4 Q25,22 46,4" stroke="#E7A93B" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="4" cy="4" r="4" fill="#B9873A"/><circle cx="46" cy="4" r="4" fill="#B9873A"/>' },
  { id: 'belt', name: 'Пояс с бляшками', x: 150, y: 190, w: 84, h: 18, svg: '<rect x="1" y="3" width="82" height="12" rx="3" fill="#8C5A2B"/>' + [6, 20, 34, 48, 62, 74].map((x) => `<rect x="${x}" y="1" width="9" height="16" rx="2" fill="#E7A93B" stroke="#B9873A" stroke-width="1.4"/>`).join('') },
  { id: 'akinak', name: 'Акинак — меч саков', x: 198, y: 222, w: 18, h: 64, svg: '<rect x="6" y="18" width="6" height="44" rx="2" fill="#C8CED6" stroke="#7C858F"/><rect x="1" y="14" width="16" height="5" rx="2" fill="#E7A93B"/><rect x="6" y="2" width="6" height="12" fill="#B9873A"/><circle cx="9" cy="3" r="4" fill="#E7A93B"/>' },
];

function dress(api, spec) {
  const T = spec.time || 60;
  api.inner.classList.add('g-tent');
  const fig = api.add(`<svg viewBox="0 0 300 320" width="300" height="320">
    <path d="M150,4 L178,100 L122,100Z" fill="#3A2A1C"/>
    <circle cx="150" cy="110" r="14" fill="#E3B288"/><circle cx="145" cy="108" r="1.6" fill="#2B1A12"/><circle cx="155" cy="108" r="1.6" fill="#2B1A12"/>
    <path d="M116,128 Q150,120 184,128 L194,240 L106,240Z" fill="#7A2A20"/>
    <path d="M150,128 V240" stroke="#5A1E16" stroke-width="2"/>
    <path d="M116,132 L92,200 L102,204 L124,150 M184,132 L208,200 L198,204 L176,150" fill="#7A2A20"/>
    <rect x="118" y="240" width="26" height="56" fill="#3A2A1C"/><rect x="156" y="240" width="26" height="56" fill="#3A2A1C"/>
    <rect x="114" y="292" width="34" height="14" rx="5" fill="#2B1A12"/><rect x="152" y="292" width="34" height="14" rx="5" fill="#2B1A12"/>
  </svg>`, 'g-figure');
  api.put(fig, 0, 0);
  const pieces = [];
  PIECES.forEach((p) => {
    const slot = api.add(`<svg viewBox="0 0 ${p.w} ${p.h}" width="${p.w}" height="${p.h}">${p.svg}</svg>`, 'g-slot');
    api.put(slot, p.x - p.w / 2, p.y - p.h / 2);
    pieces.push(p);
  });
  const move = (p, x, y) => { p.px = x; p.py = y; api.put(p.el, x, y); };
  const order = [...pieces].sort(() => Math.random() - 0.5);
  order.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    p.hx = 360 + col * 115 + 50 - p.w / 2; p.hy = 52 + row * 92 + 30 - p.h / 2;
    p.el = api.add(`<svg viewBox="0 0 ${p.w} ${p.h}" width="${p.w}" height="${p.h}">${p.svg}</svg><span>${p.name}</span>`, 'g-piece');
    p.el.style.setProperty('--w', p.w + 'px');
    move(p, p.hx, p.hy);
    p.placed = false;
  });
  api.add('<span>Перетащи украшения на воина</span>', 'g-tray');
  api.put(api.inner.querySelector('.g-tray'), 340, 10);
  let placed = 0, left = T, drag = null;
  const upd = () => api.hud(`На месте <b>${placed}/${PIECES.length}</b> <span class="g-time">${Math.ceil(left)} с</span>`);
  upd();
  api.on(api.inner, 'pointerdown', (e) => {
    const el = e.target.closest('.g-piece');
    if (!el) return;
    const p = pieces.find((q) => q.el === el);
    if (!p || p.placed) return;
    const pt = api.pt(e);
    drag = { p, dx: pt.x - p.px, dy: pt.y - p.py };
    el.classList.add('drag'); el.classList.remove('back');
    api.inner.setPointerCapture?.(e.pointerId);
    audio.sfx.page();
  });
  api.on(api.inner, 'pointermove', (e) => {
    if (!drag) return;
    const pt = api.pt(e);
    move(drag.p, pt.x - drag.dx, pt.y - drag.dy);
  });
  const drop = (e) => {
    if (!drag) return;
    const { p } = drag; drag = null;
    p.el.classList.remove('drag');
    const pt = api.pt(e);
    const cx = p.px + p.w / 2, cy = p.py + p.h / 2;
    if (Math.hypot(cx - p.x, cy - p.y) < 40 || Math.hypot(pt.x - p.x, pt.y - p.y) < 34) {
      p.placed = true; placed++; upd();
      p.el.classList.add('placed', 'back');
      move(p, p.x - p.w / 2, p.y - p.h / 2);
      audio.sfx.pop(); api.burst(p.x, p.y, '#FFE7A3', 10);
      api.float(p.x + 70, p.y - 6, p.name, '#FFE7A3');
      if (placed === PIECES.length) {
        fig.classList.add('gold');
        api.burst(150, 150, '#E7A93B', 26);
        api.later(() => api.win(left > T * 0.5 ? 3 : left > T * 0.25 ? 2 : 1, 'Золотой человек снова в полном наряде — как в 1969 году, когда его нашли археологи.'), 900);
      }
    } else {
      p.el.classList.add('back');
      move(p, p.hx, p.hy);
      if (cx < 300) audio.sfx.wrong();
    }
  };
  api.on(api.inner, 'pointerup', drop); api.on(api.inner, 'pointercancel', drop);
  api.loop((dt) => {
    left -= dt;
    if (Math.floor(left + dt) !== Math.floor(left)) upd();
    if (left <= 0) api.lose('Время вышло. Подсказка: у каждой пустой рамки — свой узор.');
  });
}

// ── 6. Ловкие руки: семена ясеня (Шарын) ──────────────
function catcher(api, spec) {
  const need = spec.need || 12, T = spec.time || 50;
  api.inner.classList.add('g-canyonbg');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320">
    <path d="M0,0 H90 L80,60 L100,120 L70,200 L90,320 H0Z" fill="#B5532E"/><path d="M0,40 H86 M0,110 H96 M0,180 H80 M0,250 H84" stroke="#8E3C1E" stroke-width="6" opacity=".5"/>
    <path d="M600,0 H510 L522,70 L498,140 L528,220 L508,320 H600Z" fill="#B5532E"/><path d="M600,50 H514 M600,130 H502 M600,200 H522 M600,270 H512" stroke="#8E3C1E" stroke-width="6" opacity=".5"/>
    ${[180, 300, 420].map((x) => `<rect x="${x - 5}" y="0" width="10" height="34" fill="#6B4A2E"/><ellipse cx="${x}" cy="30" rx="64" ry="34" fill="#4F8A3A"/><ellipse cx="${x - 20}" cy="20" rx="36" ry="20" fill="#5E9A44"/>`).join('')}
    <path d="M0,306 Q300,292 600,306 V320 H0Z" fill="#4FAFD0"/>
  </svg>`);
  const basket = api.add(`<svg viewBox="0 0 90 46" width="90" height="46"><path d="M4,8 H86 L76,42 H14Z" fill="#C0861F" stroke="#7A5A2E" stroke-width="3"/><path d="M10,18 H80 M14,30 H76" stroke="#7A5A2E" stroke-width="2"/><path d="M26,8 v34 M45,8 v34 M64,8 v34" stroke="#7A5A2E" stroke-width="2"/><path d="M4,8 H86" stroke="#A8322A" stroke-width="5"/></svg>`, 'g-basket');
  let bx = 255, keyDir = 0, got = 0, hearts = 3, left = T, t = 0, nextSeed = 0.4, nextRock = 2.2, inv = 0;
  const objs = [];
  const upd = () => api.hud(`${item('seed', 22)} <b>${got}/${need}</b> <span class="g-hearts">${heartsHTML(hearts, 3)}</span> <span class="g-time">${Math.ceil(left)} с</span>`);
  upd();
  api.on(api.inner, 'pointermove', (e) => { bx = clamp(api.pt(e).x - 45, 70, 440); });
  api.on(api.inner, 'pointerdown', (e) => { bx = clamp(api.pt(e).x - 45, 70, 440); });
  api.on(window, 'keydown', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keyDir = -1; e.preventDefault(); } if (e.code === 'ArrowRight' || e.code === 'KeyD') { keyDir = 1; e.preventDefault(); } });
  api.on(window, 'keyup', (e) => { if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) keyDir = 0; });
  api.loop((dt) => {
    t += dt; left -= dt;
    if (Math.floor(left + dt) !== Math.floor(left)) upd();
    bx = clamp(bx + keyDir * 430 * dt, 70, 440);
    api.put(basket, bx, 262);
    if (inv > 0) inv -= dt;
    basket.classList.toggle('blink', inv > 0);
    nextSeed -= dt; nextRock -= dt;
    if (nextSeed <= 0) {
      const tx = pick([180, 300, 420]) + rnd(-50, 50);
      objs.push({ el: api.add(item('seed', 34), 'g-seed'), x: tx, y: 40, vy: rnd(55, 85) + t * 1.2, sway: rnd(0, 6), seed: true });
      nextSeed = rnd(0.55, 1.0);
    }
    if (nextRock <= 0) {
      const x = rnd(100, 470);
      const warn = api.add('!', 'g-warn'); api.put(warn, x + 4, 4);
      api.later(() => { warn.remove(); objs.push({ el: api.add(item('rock', 40), 'g-rock-o'), x, y: -40, vy: 200 + t * 2, seed: false }); }, 650);
      nextRock = rnd(1.6, 2.8) - Math.min(0.8, t / 60);
    }
    for (const o of objs) {
      if (o.dead) continue;
      o.y += o.vy * dt;
      const sx = o.seed ? Math.sin(t * 2.4 + o.sway) * 26 : 0;
      api.put(o.el, o.x + sx, o.y, o.seed ? `rotate(${(t * 300 + o.sway * 50) % 360}deg)` : `rotate(${o.y}deg)`);
      const cx = o.x + sx + 18, cy = o.y + 18;
      if (cy > 262 && cy < 300 && cx > bx + 4 && cx < bx + 86) {
        o.dead = true; o.el.remove();
        if (o.seed) {
          got++; upd(); audio.sfx.pop(); api.burst(cx, 262, '#B8C46A', 8);
          if (got >= need) api.win(hearts === 3 ? 3 : 2, 'Семена ясеня собраны. Лесники посадят их у реки, и роща станет больше.');
        } else if (inv <= 0) {
          hearts--; inv = 1.2; upd(); audio.sfx.hit();
          if (hearts <= 0) api.lose('Камни с обрыва помешали. Следи за знаком «!» — он показывает, где упадёт камень.');
        }
      } else if (o.y > 330) { o.dead = true; o.el.remove(); }
    }
    if (left <= 0) api.lose(`Собрано ${got} из ${need}. Двигай корзину под кружащиеся семена!`);
  });
}

// ── 7. Фотоохота и рыбалка (Алтын-Эмель, Балхаш) ──────
function snap(api, spec) {
  const fishMode = spec.mode === 'fish';
  const need = spec.need || 7;
  let shots = spec.film || 12, got = 0, left = spec.time || 0, t = 0, nextSpawn = 0.2;
  const counts = {};
  api.inner.classList.add(fishMode ? 'g-lakebg' : 'g-safaribg');
  if (fishMode) {
    api.add(`<svg viewBox="0 0 600 320" width="600" height="320"><path d="M300,60 Q290,190 310,320" stroke="#E9F6F8" stroke-width="3" stroke-dasharray="8 8" fill="none" opacity=".6"/>
      <text x="150" y="304" class="g-lbl">пресная вода</text><text x="450" y="304" class="g-lbl">солоноватая вода</text></svg>`);
    api.add(`<svg viewBox="0 0 160 60" width="160" height="60"><path d="M10,38 Q80,58 150,38 L136,28 H24Z" fill="#8C5A2B"/><rect x="78" y="0" width="4" height="30" fill="#5A3A1C"/><path d="M82,2 L120,24 H82Z" fill="#F2EEE4"/></svg>`, 'g-boat');
  } else {
    api.add(`<svg viewBox="0 0 600 320" width="600" height="320">
      <path d="M0,130 L80,70 L150,110 L240,50 L330,104 L420,60 L520,100 L600,70 V140 H0Z" fill="#9AA4B8"/>
      <path d="M180,150 Q330,40 520,150Z" fill="#E7BE73"/><path d="M330,62 Q300,110 250,150" stroke="#C99A4E" stroke-width="3" fill="none"/>
      <path d="M0,150 H600 V320 H0Z" fill="#D9BE84"/>${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 71) % 600},${160 + (i * 37) % 150} l4,-9 l4,9" stroke="#9C8A4E" stroke-width="1.6" fill="none"/>`).join('')}
    </svg>`);
  }
  const album = api.add('', 'g-album');
  const finder = api.add(fishMode ? '' : '<i></i><i></i><i></i><i></i>', fishMode ? 'g-net' : 'g-finder');
  const objs = [];
  const label = fishMode ? 'Рыба' : 'Снимков';
  const upd = () => api.hud(`${label}: <b>${got}/${need}</b> ${fishMode ? `<span class="g-time">${Math.ceil(left)} с</span>` : `<span class="g-film">плёнка: ${shots}</span>`}`);
  upd();
  const spawn = () => {
    const kinds = spec.targets;
    const k = pick(kinds);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const n = k.herd ? Math.ceil(rnd(1, k.herd)) : 1;
    const y = rnd(k.y[0], k.y[1]);
    for (let i = 0; i < n; i++) {
      const html = k.fish ? fish(k.fish) : k.trash ? trash(k.trash) : beast(k.kind);
      const el = api.add(html, 'g-target' + (k.trash ? ' trash' : ''));
      el.style.width = k.size + 'px';
      objs.push({ el, k, dir, x: dir > 0 ? -k.size - i * k.size * 0.9 : GW + i * k.size * 0.9, y: y + rnd(-10, 10), v: rnd(k.v[0], k.v[1]) * dir, ph: rnd(0, 6), done: false });
    }
  };
  let mouse = { x: 300, y: 200 };
  api.on(api.inner, 'pointermove', (e) => { mouse = api.pt(e); });
  api.on(api.inner, 'pointerdown', (e) => {
    const p = api.pt(e); mouse = p;
    if (!fishMode) {
      if (shots <= 0) return;
      shots--; audio.sfx.shutter();
      const fl = api.add('', 'g-flash'); fl.addEventListener('animationend', () => fl.remove());
    } else {
      audio.sfx.splash();
      const sp = api.add('', 'g-splash'); api.put(sp, p.x - 30, p.y - 30); sp.addEventListener('animationend', () => sp.remove());
    }
    let best = null, bd = 1e9;
    for (const o of objs) {
      if (o.done) continue;
      const cx = o.x + o.k.size / 2, cy = o.y + o.k.size * 0.32;
      const dx = Math.abs(cx - p.x), dy = Math.abs(cy - p.y);
      const ok = fishMode ? Math.hypot(dx, dy) < 44 : dx < 58 && dy < 44;
      if (ok && dx + dy < bd) { bd = dx + dy; best = o; }
    }
    if (best) {
      best.done = true;
      if (best.k.trash) {
        best.el.classList.add('caught'); left += 3; audio.sfx.pop();
        api.float(best.x + 20, best.y - 10, 'Озеро чище! +3 с', '#DFF5FB');
      } else {
        got++;
        const nm = best.k.name;
        counts[nm] = (counts[nm] || 0) + 1;
        if (fishMode) { best.el.classList.add('caught'); } else {
          best.el.classList.add('snapped');
          const th = document.createElement('div'); th.className = 'g-thumb'; th.innerHTML = best.el.innerHTML + `<span>${nm}</span>`;
          album.appendChild(th);
        }
        audio.sfx.pop();
        api.float(best.x + best.k.size / 2, best.y - 14, `${nm}!`, '#FFF8DE');
        if (got >= need) {
          const st = fishMode ? (left > 15 ? 3 : left > 6 ? 2 : 1) : (shots >= 4 ? 3 : shots >= 2 ? 2 : 1);
          api.later(() => api.win(st, fishMode ? `Улов готов: ${Object.entries(counts).map(([k, v]) => `${k} — ${v}`).join(', ')}.` : `Отличные кадры: ${Object.entries(counts).map(([k, v]) => `${k} — ${v}`).join(', ')}. Их покажут на стенде у входа в парк.`), 500);
        }
      }
    } else if (!fishMode) api.float(p.x, p.y - 30, 'Мимо!', '#fff');
    upd();
    if (!fishMode && shots <= 0 && got < need) api.later(() => api.lose('Плёнка закончилась. Жми, когда животное в центре рамки — и лучше тех, что бегут медленнее.'), 400);
  });
  api.loop((dt) => {
    t += dt;
    if (fishMode) { left -= dt; if (Math.floor(left + dt) !== Math.floor(left)) upd(); if (left <= 0) return api.lose(`Поймано ${got} из ${need}. Жми прямо на рыбу — сеть падает туда, куда ты нажал.`); }
    api.put(finder, mouse.x - (fishMode ? 40 : 60), mouse.y - (fishMode ? 40 : 45));
    nextSpawn -= dt;
    if (nextSpawn <= 0 && objs.filter((o) => !o.done).length < 7) { spawn(); nextSpawn = rnd(0.7, 1.5); }
    for (const o of objs) {
      o.x += o.v * dt * (o.done ? 1.6 : 1);
      const bob = fishMode ? Math.sin(t * 2 + o.ph) * 6 : 0;
      api.put(o.el, o.x, o.y + bob, o.dir < 0 ? 'scaleX(-1)' : '');
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.done && !o.rm) {
        o.rm = true;
        api.later(() => { o.el.remove(); const j = objs.indexOf(o); if (j >= 0) objs.splice(j, 1); }, 900);
      } else if (!o.done && (o.x < -o.k.size * 3 || o.x > GW + o.k.size * 3)) {
        o.el.remove(); objs.splice(i, 1);
      }
    }
  });
}

// ── 8. Полёт беркута (Алтай) ──────────────────────────
function flight(api, spec) {
  const need = spec.need || 8;
  api.inner.classList.add('g-skybg');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320"><path d="M330,320 L420,110 L445,140 L470,100 L560,320Z" fill="#C3CFDD"/><path d="M405,146 L420,110 L445,140 L470,100 L488,140 L470,134 L458,150 L445,146 L430,156Z" fill="#fff"/></svg>`);
  const mid = api.add(`<svg viewBox="0 0 1200 140" width="1200" height="140" preserveAspectRatio="none">${[0, 600].map((o) => `<path d="M${o},140 L${o + 50},60 L${o + 110},110 L${o + 190},40 L${o + 280},100 L${o + 350},50 L${o + 440},110 L${o + 520},30 L${o + 600},140Z" fill="#7E91A6"/>`).join('')}</svg>`, 'g-far2');
  const bird = api.add(eagle('fly'), 'g-eagle');
  let y = 140, vy = 0, hold = false, hearts = 3, inv = 0, got = 0, dist = 0, t = 0, nextObs = 260;
  const objs = [];
  const upd = () => api.hud(`${item('maralspot', 22)} <b>${got}/${need}</b> <span class="g-hearts">${heartsHTML(hearts, 3)}</span>`);
  upd();
  const set = (v) => { hold = v; bird.classList.toggle('flap', v); };
  api.on(api.inner, 'pointerdown', (e) => { e.preventDefault(); set(true); });
  api.on(window, 'pointerup', () => set(false));
  api.on(window, 'keydown', (e) => { if (KEYS_UP.includes(e.code)) { e.preventDefault(); set(true); } });
  api.on(window, 'keyup', (e) => { if (KEYS_UP.includes(e.code)) set(false); });
  const peak = (bottom) => {
    const h = rnd(bottom ? 100 : 60, bottom ? 175 : 105), w = rnd(130, 190);
    const el = api.add(`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bottom
      ? `<path d="M0,${h} L${w / 2},0 L${w},${h}Z" fill="#5E6E82"/><path d="M${w / 2},0 L${w},${h} L${w / 2 + 10},${h}Z" fill="#4A586A"/><path d="M${w / 2 - 22},${44} L${w / 2},0 L${w / 2 + 22},44 L${w / 2 + 8},36 L${w / 2},46 L${w / 2 - 8},36Z" fill="#fff"/>`
      : `<path d="M0,0 L${w / 2},${h} L${w},0Z" fill="#6A6276"/><path d="M${w / 2},${h} L${w},0 L${w / 2 + 8},0Z" fill="#544C60"/>`}</svg>`, 'g-peak');
    return { el, x: GW + 10, w, h, bottom };
  };
  api.loop((dt) => {
    t += dt;
    const v = Math.min(240, 160 + t * 2.2);
    dist += v * dt;
    const target = hold ? -210 : 170;
    vy += (target - vy) * Math.min(1, dt * 5);
    y = clamp(y + vy * dt, 18, GH - 18);
    if (inv > 0) inv -= dt;
    bird.classList.toggle('blink', inv > 0);
    api.put(bird, 120 - 40, y - 26, `rotate(${clamp(vy / 9, -20, 22)}deg)`);
    mid.style.transform = `translateX(${-(dist * 0.25) % 600}px)`;
    if (dist > nextObs) {
      const bottom = Math.random() < 0.65;
      const o = peak(bottom); objs.push(o);
      if (Math.random() < 0.5 && !bottom) objs.push(Object.assign(peak(true), { x: GW + 10 + rnd(60, 120) }));
      const gapY = bottom ? rnd(50, GH - o.h - 40) : rnd(o.h + 40, GH - 60);
      objs.push({ el: api.add(item('maralspot', 40), 'g-item'), x: GW + 10 + o.w / 2 + rnd(-10, 40), y: gapY, item: true, w: 40 });
      nextObs = dist + rnd(220, 330);
    }
    for (const o of objs) {
      o.x -= v * dt;
      if (o.item) {
        api.put(o.el, o.x - 20, o.y - 20, `scale(${1 + Math.sin(t * 6) * 0.06})`);
        if (!o.done && Math.hypot(o.x - 120, o.y - y) < 32) {
          o.done = true; got++; upd(); o.el.classList.add('taken');
          audio.sfx.pop(); api.burst(o.x, o.y, '#E7A93B', 8); api.float(o.x, o.y - 30, 'Марал замечен!', '#FFF8DE');
          if (got >= need) api.later(() => api.win(hearts === 3 ? 3 : hearts === 2 ? 2 : 1, 'Қыран нашёл все стада маралов. Теперь их можно вести на летний жайлау.'), 300);
        }
      } else {
        api.put(o.el, o.x, o.bottom ? GH - o.h : 0);
        const dx = Math.abs(120 - (o.x + o.w / 2));
        if (dx < o.w / 2 && inv <= 0) {
          const k = 1 - dx / (o.w / 2);
          const hit = o.bottom ? y + 14 > GH - o.h * k : y - 12 < o.h * k;
          if (hit) {
            hearts--; inv = 1.3; upd(); audio.sfx.hit();
            if (hearts <= 0) api.lose('Скалы слишком близко! Отпускай кнопку пораньше — беркут плавно снижается.');
          }
        }
      }
    }
    for (let i = objs.length - 1; i >= 0; i--) if (objs[i].x < -220) { objs[i].el.remove(); objs.splice(i, 1); }
  });
}

// ── 9. Стрельба из лука: жамбы ату (Бурабай) ──────────
function archery(api, spec, ctx) {
  const needHits = spec.need || 3;
  let arrows = spec.arrows || 8, hits = 0, t = 0, wind = 0, aim = null, flying = null;
  api.inner.classList.add('g-lakebg2');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320">
    <path d="M330,250 L360,110 Q380,80 400,100 L420,140 L440,250Z" fill="#9C8C82"/><path d="M360,112 q20,-10 40,6 M352,160 q36,-10 70,4" stroke="#7C6C64" stroke-width="3" fill="none"/>
    ${[40, 520, 570, 260].map((x, i) => `<path d="M${x},${250 - i * 4} l16,-48 l16,48Z" fill="#2F5E36"/>`).join('')}
    <path d="M0,250 H600 V320 H0Z" fill="#7FA05A"/>
    <rect x="497" y="40" width="6" height="210" fill="#6B4A2E"/><rect x="470" y="38" width="60" height="6" rx="3" fill="#6B4A2E"/>
  </svg>`);
  const rope = api.add('<svg width="600" height="320" viewBox="0 0 600 320"><line x1="0" y1="0" x2="0" y2="0" stroke="#5A3A1C" stroke-width="2"/></svg>').querySelector('line');
  const target = api.add(`<svg viewBox="0 0 44 30" width="44" height="30"><path d="M4,8 Q22,0 40,8 L36,26 Q22,30 8,26Z" fill="#D8DEE6" stroke="#7C858F" stroke-width="2"/><ellipse cx="22" cy="11" rx="12" ry="4" fill="#fff" opacity=".6"/></svg>`, 'g-zhamby');
  api.add(`<svg viewBox="-4 -16 128 116" width="140" height="127">${heroMarkup(ctx.hero)}</svg>`, 'g-archer');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320"><path d="M124,178 Q156,212 124,246" stroke="#6B3E1F" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M124,178 Q156,212 124,246" stroke="#E7A93B" stroke-width="1.5" fill="none" stroke-dasharray="3 5"/><line x1="124" y1="178" x2="124" y2="246" stroke="#F4E3C1" stroke-width="1.2"/></svg>`);
  const flag = api.add('', 'g-wind');
  const guide = api.add('<svg width="600" height="320" viewBox="0 0 600 320"><line class="bowline" x1="0" y1="0" x2="0" y2="0"/><g class="dots"></g></svg>', 'g-guide').firstElementChild;
  const arrowEl = api.add('<svg viewBox="0 0 50 8" width="50" height="8"><path d="M0,4 H42" stroke="#6B4A2E" stroke-width="2.4"/><path d="M42,0 L50,4 L42,8Z" fill="#9AA3AD"/><path d="M0,0 l8,4 l-8,4 M4,0 l8,4 l-8,4" stroke="#A8322A" stroke-width="1.6" fill="none"/></svg>', 'g-arrow');
  arrowEl.style.opacity = 0;
  const A = { x: 132, y: 212 };
  const newWind = () => { wind = Math.round(rnd(-50, 50)); flag.innerHTML = `Ветер ${wind === 0 ? 'стих' : `${wind > 0 ? '→' : '←'} ${Math.abs(Math.round(wind / 10))}`}`; };
  newWind();
  const upd = () => api.hud(`Попаданий <b>${hits}/${needHits}</b> · стрел: ${'➶'.repeat(arrows)}`);
  upd();
  const tpos = () => { const a = Math.sin(t * 1.5) * 0.32, L = 92; return { x: 500 + Math.sin(a) * L, y: 44 + Math.cos(a) * L, a }; };
  api.on(api.inner, 'pointerdown', (e) => { if (flying || arrows <= 0) return; aim = { s: api.pt(e), c: api.pt(e) }; api.inner.setPointerCapture?.(e.pointerId); });
  api.on(api.inner, 'pointermove', (e) => { if (aim) aim.c = api.pt(e); });
  const vel = () => {
    const dx = aim.s.x - aim.c.x, dy = aim.s.y - aim.c.y;
    const len = Math.min(150, Math.hypot(dx, dy));
    const p = len / 150, ang = Math.atan2(dy, dx);
    return { vx: Math.cos(ang) * p * 700, vy: Math.sin(ang) * p * 700, p };
  };
  const release = () => {
    if (!aim) return;
    const v = vel(); aim = null;
    guide.querySelector('.dots').innerHTML = ''; guide.querySelector('.bowline').setAttribute('x2', 0);
    if (v.p < 0.12) return;
    arrows--; upd(); audio.sfx.arrow();
    flying = { x: A.x, y: A.y, vx: v.vx, vy: v.vy };
    arrowEl.style.opacity = 1;
  };
  api.on(api.inner, 'pointerup', release); api.on(api.inner, 'pointercancel', release);
  api.loop((dt) => {
    t += dt;
    const tp = tpos();
    api.put(target, tp.x - 22, tp.y - 6, `rotate(${-tp.a * 57}deg)`);
    rope.setAttribute('x1', 500); rope.setAttribute('y1', 44); rope.setAttribute('x2', tp.x); rope.setAttribute('y2', tp.y);
    if (aim) {
      const v = vel();
      const g = guide.querySelector('.dots');
      let s = '';
      for (let i = 1; i <= 7; i++) { const tt = i * 0.045; s += `<circle cx="${A.x + v.vx * tt + 0.5 * wind * tt * tt}" cy="${A.y + v.vy * tt + 190 * tt * tt}" r="${3 - i * 0.25}"/>`; }
      g.innerHTML = s;
      const bl = guide.querySelector('.bowline');
      bl.setAttribute('x1', A.x); bl.setAttribute('y1', A.y); bl.setAttribute('x2', A.x - v.vx * 0.06); bl.setAttribute('y2', A.y - v.vy * 0.06);
    }
    if (flying) {
      const f = flying;
      f.vx += wind * dt; f.vy += 380 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      api.put(arrowEl, f.x - 42, f.y - 4, `rotate(${Math.atan2(f.vy, f.vx) * 57}deg)`);
      arrowEl.style.transformOrigin = '42px 4px';
      if (Math.hypot(f.x - tp.x, f.y - (tp.y + 8)) < 24) {
        hits++; upd(); flying = null; arrowEl.style.opacity = 0;
        audio.sfx.correct(); api.burst(tp.x, tp.y + 8, '#fff', 14); api.float(tp.x - 30, tp.y - 26, 'Дәл тидің!', '#FFE7A3');
        target.classList.remove('hit'); void target.offsetWidth; target.classList.add('hit');
        newWind();
        if (hits >= needHits) api.later(() => api.win(arrows >= 4 ? 3 : arrows >= 2 ? 2 : 1, 'Жамбы ату — древнее состязание лучников. Ты попал, хотя до вершины Окжетпес, по легенде, не долетела ни одна стрела!'), 600);
      } else if (f.y > 330 || f.x > 640 || f.x < -40) {
        flying = null; arrowEl.style.opacity = 0;
        api.float(clamp(f.x, 40, 560), 230, 'Мимо', '#fff'); newWind();
        if (arrows <= 0 && hits < needHits) api.later(() => api.lose('Стрелы закончились. Учитывай ветер — смотри на флажок перед выстрелом.'), 300);
      }
    }
  });
}

// ── 10. Ритм домбры (Улытау) ──────────────────────────
function rhythm(api, spec) {
  const BPM = 104, beat = 60 / BPM, HX = 110, SPEED = 250;
  const LANE_Y = [128, 206];
  const bars = [
    [[0, 0], [1, 1], [0, 2], [1, 3]],
    [[0, 0], [0, 1], [1, 2], [1, 3]],
    [[0, 0], [1, 0.5], [0, 1], [1, 2], [0, 3]],
    [[0, 0], [1, 1], [0, 1.5], [0, 2], [1, 3]],
    [[0, 0], [1, 0.5], [0, 1], [1, 1.5], [0, 2], [1, 3]],
    [[1, 0], [0, 1], [1, 2], [0, 2.5], [0, 3]],
    [[0, 0], [1, 0.5], [0, 1], [1, 1.5], [0, 2], [1, 2.5], [0, 3]],
    [[0, 0], [1, 1], [0, 2], [1, 2.5], [0, 3]],
    [[0, 0], [1, 0.5], [0, 1], [1, 1.5], [0, 2], [1, 2.5], [0, 3], [1, 3.5]],
    [[0, 0], [1, 2]],
  ];
  const melody = [74, 76, 78, 81, 79, 78, 76, 74, 71, 74];
  const notes = [];
  bars.forEach((b, bi) => b.forEach(([lane, pos], k) => notes.push({ lane, time: (bi * 4 + pos) * beat, m: lane === 0 ? melody[(bi + k) % melody.length] : (bi % 2 ? 57 : 50), hit: false, miss: false })));
  const total = notes.length;
  const endT = (bars.length * 4) * beat + 1;
  audio.duck(true);
  spec.onEnd = () => audio.duck(false);
  api.inner.classList.add('g-yurtbg');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320">
    <path d="M60,96 Q-14,170 60,244 Q110,282 128,236 L140,200 L140,134 L128,104 Q110,58 60,96Z" fill="#B87333" stroke="#6B3E1F" stroke-width="4"/>
    <circle cx="70" cy="170" r="10" fill="#4A2A12"/>
    <rect x="128" y="146" width="472" height="40" fill="#8C5A2B"/>
    ${[200, 270, 340, 410, 480, 550].map((x) => `<rect x="${x}" y="146" width="4" height="40" fill="#E7A93B"/>`).join('')}
  </svg>`);
  const strings = LANE_Y.map((y, i) => api.add(`<svg viewBox="0 0 600 20" width="600" height="20" preserveAspectRatio="none"><path d="M0,10 H600" stroke="#F4E3C1" stroke-width="${i ? 3 : 2.2}"/></svg>`, 'g-string'));
  strings.forEach((s, i) => api.put(s, 0, LANE_Y[i] - 10));
  const rings = LANE_Y.map((y, i) => { const r = api.add(`<span>${i ? '↓' : '↑'}</span>`, 'g-ring'); api.put(r, HX - 26, y - 26); return r; });
  notes.forEach((n) => { n.el = api.add(item('note', 40), 'g-note'); n.el.style.opacity = 0; });
  let t0 = audio.clock() + 2.2, lastBeat = -1, hits = 0, combo = 0;
  const upd = () => api.hud(`Нот: <b>${hits}/${total}</b> · серия: ${combo}`);
  upd();
  const msg = api.add('Приготовься…', 'g-count');
  const press = (lane) => {
    const now = audio.clock() - t0;
    let best = null, bd = 1;
    for (const n of notes) if (!n.hit && !n.miss && n.lane === lane && Math.abs(n.time - now) < bd) { bd = Math.abs(n.time - now); best = n; }
    rings[lane].classList.remove('tap'); void rings[lane].offsetWidth; rings[lane].classList.add('tap');
    if (best && bd < 0.17) {
      best.hit = true; hits++; combo++; upd();
      best.el.classList.add('hit');
      audio.note(best.m, 0.24);
      strings[lane].classList.remove('vib'); void strings[lane].offsetWidth; strings[lane].classList.add('vib');
      api.burst(HX, LANE_Y[lane], lane ? '#E7A93B' : '#7FD6DA', 6);
      if (bd < 0.07) api.float(HX + 30, LANE_Y[lane] - 40, 'Керемет!', '#FFE7A3');
    } else { combo = 0; upd(); audio.note(lane ? 45 : 62, 0.06); }
  };
  api.on(window, 'keydown', (e) => {
    if (e.repeat) return;
    if (['ArrowUp', 'KeyW', 'KeyF'].includes(e.code)) { e.preventDefault(); press(0); }
    if (['ArrowDown', 'KeyS', 'KeyJ', 'Space'].includes(e.code)) { e.preventDefault(); press(1); }
  });
  api.on(api.inner, 'pointerdown', (e) => { e.preventDefault(); press(api.pt(e).y < 167 ? 0 : 1); });
  api.loop(() => {
    const now = audio.clock() - t0;
    if (now < 0) {
      const c = Math.ceil(-now / beat);
      msg.textContent = c > 4 ? 'Приготовься…' : String(c);
    } else if (msg.parentNode) msg.remove();
    const b = Math.floor(now / beat);
    if (b !== lastBeat && now > -4 * beat) {
      lastBeat = b; audio.beat(b % 4 === 0 ? 0.9 : 1.4, b % 4 === 0 ? 0.22 : 0.1);
      rings.forEach((r) => { r.classList.remove('pulse'); void r.offsetWidth; r.classList.add('pulse'); });
    }
    for (const n of notes) {
      const x = HX + (n.time - now) * SPEED;
      if (!n.hit) {
        n.el.style.opacity = x < 640 ? (n.miss ? 0.25 : 1) : 0;
        api.put(n.el, x - 20, LANE_Y[n.lane] - 20);
      }
      if (!n.hit && !n.miss && n.time - now < -0.18) { n.miss = true; combo = 0; upd(); }
    }
    if (now > endT) {
      const r = hits / total;
      if (r >= 0.6) api.win(r >= 0.9 ? 3 : r >= 0.75 ? 2 : 1, `Ты сыграл ${Math.round(r * 100)}% нот. Так звучал кюй — без единого слова, только струны.`);
      else api.lose(`Сыграно ${Math.round(r * 100)}% нот, а для кюя нужно хотя бы 60%. Жми, когда нота касается кольца.`);
    }
  });
}

// ── 11. Плотина (Арал) ────────────────────────────────
function dam(api, spec) {
  const T = spec.time || 40;
  api.inner.classList.add('g-aralbg');
  const water = api.add('', 'g-water');
  api.add(`<svg viewBox="0 0 600 320" width="600" height="320">
    <path d="M0,170 H600 V320 H0Z" fill="#E6D8B4"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 83) % 600}" cy="${190 + (i * 47) % 120}" r="${2 + i % 3}" fill="#fff" opacity=".7"/>`).join('')}
    <path d="M380,300 L470,300 L462,312 H388Z" fill="#9C4A25"/><rect x="410" y="284" width="26" height="16" fill="#B5652E"/>
    <path d="M0,160 H600 V182 H0Z" fill="#8C6A42"/><path d="M0,160 H600" stroke="#6B4A2E" stroke-width="3"/>
  </svg>`);
  const HOLES = Array.from({ length: 7 }, (_, i) => 60 + i * 80);
  const leaks = HOLES.map((x) => {
    const el = api.add('<i></i><b></b>', 'g-leak'); api.put(el, x - 30, 150);
    return { x, el, open: false, cool: rnd(0, 1.5) };
  });
  const fishes = [0, 1, 2].map((i) => { const f = api.add(fish(['sazan', 'sudak', 'bream'][i]), 'g-afish'); f.style.opacity = 0; return f; });
  let level = 35, left = T, t = 0, nextLeak = 0.8, plugs = 0;
  const gauge = api.add('<div><i></i></div><span>Малый Арал</span>', 'g-gauge');
  const upd = () => api.hud(`Уровень моря <b>${Math.round(level)}%</b> <span class="g-time">${Math.ceil(left)} с</span>`);
  upd();
  api.on(api.inner, 'pointerdown', (e) => {
    const p = api.pt(e);
    const l = leaks.find((q) => q.open && Math.abs(q.x - p.x) < 40 && p.y > 110 && p.y < 260);
    if (!l) return;
    l.open = false; l.cool = rnd(2.5, 5); plugs++;
    l.el.classList.remove('open'); l.el.classList.add('plug');
    api.later(() => l.el.classList.remove('plug'), 600);
    audio.sfx.stone(); api.burst(l.x, 170, '#8C8478', 8);
  });
  api.loop((dt) => {
    t += dt; left -= dt;
    const open = leaks.filter((l) => l.open).length;
    level = clamp(level + (8 - 5.5 * open) * dt, 0, 100);
    water.style.height = `${30 + level * 1.3}px`;
    gauge.querySelector('i').style.height = level + '%';
    fishes.forEach((f, i) => {
      const show = level > 45 + i * 15;
      f.style.opacity = show ? 1 : 0;
      api.put(f, 80 + ((t * 40 + i * 190) % 520), 160 - level * 0.8 + i * 18, (Math.floor((t * 40 + i * 190) / 520) % 2) ? 'scaleX(-1)' : '');
    });
    if (Math.floor(left + dt) !== Math.floor(left)) upd();
    leaks.forEach((l) => { if (!l.open) l.cool -= dt; });
    nextLeak -= dt;
    if (nextLeak <= 0) {
      const c = leaks.filter((l) => !l.open && l.cool <= 0);
      if (c.length && open < 4) { const l = pick(c); l.open = true; l.el.classList.add('open'); audio.sfx.splash(); }
      nextLeak = rnd(0.6, 1.25) - Math.min(0.3, t / 100);
    }
    if (level >= 100) { upd(); return api.win(left > T * 0.5 ? 3 : left > T * 0.2 ? 2 : 1, 'Плотина держит! Вода в Малом Арале поднялась, и рыба вернулась — как после 2005 года.'); }
    if (level <= 0) return api.lose('Вода ушла через щели. Закрывай каждую струю, как только она появится.');
    if (left <= 0) api.lose(`Уровень дошёл до ${Math.round(level)}%. Нужно 100% — закрывай щели быстрее!`);
  });
}

const GAMES = { tiles, dig, runner, trace, dress, catcher, snap, flight, archery, rhythm, dam };
