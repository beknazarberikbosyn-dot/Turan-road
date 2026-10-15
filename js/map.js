// Интерактивная карта: камера (viewBox), перетаскивание, зум, маршрут, точки и герой.
import { P, VB, W, H, buildMapSVG } from './geo.js';
import { heroMarkup } from './hero.js';
import * as SP from './sprites.js';

const NS = 'http://www.w3.org/2000/svg';

// позиция точки на карте (с небольшим сдвигом для слишком близких мест)
export function locXY(l) {
  const [x, y] = P(l.lat, l.lon);
  return l.nudge ? [x + l.nudge[0], y + l.nudge[1]] : [x, y];
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class MapView {
  constructor(svg) {
    this.svg = svg;
    svg.innerHTML = buildMapSVG();
    this.route = svg.querySelector('#routeLayer');
    this.markers = svg.querySelector('#markerLayer');
    this.heroLayer = svg.querySelector('#heroLayer');
    this.dustLayer = svg.querySelector('#dustLayer');
    this.mode = 'menu';
    this.vb = { ...VB };
    this.hero = { x: 0, y: 0, dir: 1 };
    this.pointers = new Map();
    this.onSelect = null;
    this.following = false;
    this.apply();
    this.bind();
    window.addEventListener('resize', () => { this.fit(); });
  }

  // размер без учёта 3D-наклона сцены в меню
  size() { const p = this.svg.parentElement; return { cw: p.offsetWidth || innerWidth, ch: p.offsetHeight || innerHeight }; }

  apply() {
    const { x, y, w, h } = this.vb;
    this.svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  }

  // вид всей карты для меню
  menuView() {
    return { x: VB.x + 60, y: VB.y + 40, w: VB.w - 120, h: VB.h - 80 };
  }

  // целевой вид для игрового режима с центром (cx, cy)
  playView(cx, cy, zoom = 1) {
    const { cw, ch } = this.size();
    const upp = Math.min(VB.w / cw, VB.h / ch) * 0.72 / zoom;
    const w = cw * upp, h = ch * upp;
    return this.clamp({ x: cx - w / 2, y: cy - h / 2, w, h });
  }

  clamp(v) {
    const { cw, ch } = this.size();
    const maxW = Math.min(VB.w * 1.05, VB.h * 1.05 * cw / ch);
    const minW = Math.max(180, 260 * cw / ch * 0.5);
    let w = Math.max(minW, Math.min(maxW, v.w));
    const h = w * ch / cw;
    const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    let x = cx - w / 2, y = cy - h / 2;
    const pad = 40;
    x = Math.max(VB.x - pad, Math.min(VB.x + VB.w + pad - w, x));
    y = Math.max(VB.y - pad, Math.min(VB.y + VB.h + pad - h, y));
    if (w > VB.w) x = VB.x + (VB.w - w) / 2;
    if (h > VB.h) y = VB.y + (VB.h - h) / 2;
    return { x, y, w, h };
  }

  fit() {
    if (this.mode === 'map') { this.vb = this.clamp(this.vb); this.apply(); }
  }

  tweenTo(target, ms = 1200) {
    return new Promise((res) => {
      if (reduced()) ms = Math.min(ms, 200);
      const from = { ...this.vb }, t0 = performance.now();
      cancelAnimationFrame(this._tw);
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms), e = ease(k);
        for (const key of ['x', 'y', 'w', 'h']) this.vb[key] = from[key] + (target[key] - from[key]) * e;
        this.apply();
        if (k < 1) this._tw = requestAnimationFrame(step); else res();
      };
      this._tw = requestAnimationFrame(step);
    });
  }

  setMenu(animated = true) {
    this.mode = 'menu';
    const v = this.menuView();
    if (animated) return this.tweenTo(v, 2200);
    this.vb = v; this.apply(); return Promise.resolve();
  }

  flyIn(ms = 2600) {
    this.mode = 'map';
    return this.tweenTo(this.playView(this.hero.x, this.hero.y), ms);
  }

  centerOn(x, y, ms = 700) { return this.tweenTo(this.clamp({ ...this.vb, x: x - this.vb.w / 2, y: y - this.vb.h / 2 }), ms); }

  zoomBy(f, sx, sy) {
    const { cw, ch } = this.size();
    const r = this.svg.getBoundingClientRect();
    const px = sx == null ? 0.5 : (sx - r.left) / cw, py = sy == null ? 0.5 : (sy - r.top) / ch;
    const ax = this.vb.x + this.vb.w * px, ay = this.vb.y + this.vb.h * py;
    const w = this.vb.w * f, h = this.vb.h * f;
    this.vb = this.clamp({ x: ax - w * px, y: ay - h * py, w, h });
    this.apply();
  }

  bind() {
    const s = this.svg;
    s.addEventListener('wheel', (e) => {
      if (this.mode !== 'map') return;
      e.preventDefault();
      this.zoomBy(Math.pow(1.0016, e.deltaY), e.clientX, e.clientY);
    }, { passive: false });

    s.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'map') return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragDist = 0;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    s.addEventListener('pointermove', (e) => {
      if (this.mode !== 'map' || !this.pointers.has(e.pointerId)) return;
      const prev = this.pointers.get(e.pointerId);
      const cur = { x: e.clientX, y: e.clientY };
      this.pointers.set(e.pointerId, cur);
      const { cw } = this.size();
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch) this.zoomBy(this.pinch / d, (a.x + b.x) / 2, (a.y + b.y) / 2);
        this.pinch = d; this.dragDist += 10;
        return;
      }
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      this.dragDist += Math.abs(dx) + Math.abs(dy);
      if (this.dragDist > 6) {
        s.setPointerCapture?.(e.pointerId);
        s.classList.add('dragging');
        const k = this.vb.w / cw;
        this.vb = this.clamp({ ...this.vb, x: this.vb.x - dx * k, y: this.vb.y - dy * k });
        this.apply();
      }
    });
    const up = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      s.classList.remove('dragging');
    };
    s.addEventListener('pointerup', up);
    s.addEventListener('pointercancel', up);

    s.addEventListener('click', (e) => {
      if (this.mode !== 'map' || this.dragDist > 6) return;
      const mk = e.target.closest('.mk');
      if (mk && this.onSelect) this.onSelect(mk.dataset.id);
    });
    s.addEventListener('keydown', (e) => {
      const mk = e.target.closest?.('.mk');
      if (mk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.onSelect?.(mk.dataset.id); }
    });
  }

  // ── дороги и точки ───────────────────────────────────
  // После первой точки открываются все дороги: игрок сам выбирает, куда ехать.
  render(start, locs, state) {
    const done = new Set(state.completed);
    const free = done.has(locs[0].id);
    const pts = [P(start.lat, start.lon), ...locs.map(locXY)];
    this.pts = pts;
    if (!this.edges) {
      const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
      const set = new Map([[key(0, 1), [0, 1]]]);
      pts.forEach((p, i) => {
        pts.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j !== i)
          .sort((u, v) => u[1] - v[1]).slice(0, 2).forEach(([j]) => set.set(key(i, j), [i, j]));
      });
      this.edges = [...set.values()];
    }
    const here = state.pos === 'start' ? 0 : locs.findIndex((l) => l.id === state.pos) + 1;
    const seen = (k) => k === 0 || done.has(locs[k - 1].id);
    const open = (k) => k === 0 || k === 1 || free;
    let r = '';
    for (const [a, b] of this.edges) {
      const [x1, y1] = pts[a], [x2, y2] = pts[b];
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.1, my = (y1 + y2) / 2 - (x2 - x1) * 0.1;
      let cls = 'road-closed';
      if (seen(a) && seen(b)) cls = 'road-walked';
      else if (open(a) && open(b)) cls = (a === here || b === here) ? 'road-open' : 'road-free';
      r += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" class="road ${cls}"/>`;
    }
    this.route.innerHTML = r;

    const [sx, sy] = pts[0];
    let m = `<g class="mk-start" transform="translate(${sx},${sy})">
      <path d="M-14,4 L0,-18 L14,4Z" fill="#7C5C40"/><path d="M-5,-10 L0,-18 L5,-10Z" fill="#FBFBF7"/>
      <text y="20" class="mk-label">${start.name}</text></g>`;
    const rank = (i) => (done.has(locs[i].id) ? 1 : (i === 0 || free) ? 2 : 0);
    locs.map((l, i) => i).sort((a, b) => rank(a) - rank(b)).forEach((i) => {
      const l = locs[i];
      const [x, y] = pts[i + 1];
      const isDone = done.has(l.id);
      const isOpen = !isDone && (i === 0 || free);
      const cls = isDone ? 'mk-done' : isOpen ? 'mk-open' : 'mk-locked';
      const label = `${l.name}: ${isDone ? 'пройдено' : isOpen ? 'можно отправиться' : 'закрыто'}`;
      m += `<g class="mk ${cls}" data-id="${l.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" tabindex="${isDone || isOpen ? 0 : -1}" role="button" aria-label="${label}">
        ${isOpen && !free ? '<circle class="mk-pulse" r="14"/>' : ''}
        <circle class="mk-hit" r="22"/>
        ${isDone
          ? '<path class="mk-body" d="M0,-16 L14,10 L-14,10Z"/><circle r="3.6" cy="1" fill="#A8322A"/>'
          : `<circle class="mk-body" r="12"/>${isOpen ? '<path class="mk-star" d="M0,-6 L1.8,-1.8 L6,0 L1.8,1.8 L0,6 L-1.8,1.8 L-6,0 L-1.8,-1.8Z"/>' : '<circle r="3.5" fill="#EDE6F2"/>'}`}
        <text class="mk-label" ${l.label === 'top' ? 'y="-21"' : l.label === 'left' ? 'x="-20" y="4" style="text-anchor:end"' : `y="${isDone ? 26 : 28}"`}>${l.name}</text>
      </g>`;
    });
    this.markers.innerHTML = m;
  }

  // показать всю открытую степь
  overview(ms = 1400) {
    const { cw, ch } = this.size();
    const w = Math.min(VB.w, VB.h * cw / ch * 1.02);
    return this.tweenTo(this.clamp({ x: VB.x + (VB.w - w) / 2, y: VB.y + (VB.h - w * ch / cw) / 2, w, h: w * ch / cw }), ms);
  }

  // ── жизнь на карте: караваны, стада, беркут ────────
  startLife() {
    const L = this.svg.querySelector('#lifeLayer');
    const sprite = (html, w, h) => html.replace('<svg ', `<svg width="${w}" height="${h}" x="${-w / 2}" y="${-h + 2}" `);
    const add = (html) => { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; L.appendChild(g); return g; };
    const poly = (ll) => {
      const xy = ll.map(([a, b]) => P(a, b)), seg = [];
      let tot = 0;
      for (let i = 0; i < xy.length - 1; i++) { const d = Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]); seg.push(d); tot += d; }
      return { xy, seg, tot, at(u) {
        let d = u * tot, i = 0;
        while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
        const k = seg[i] ? d / seg[i] : 0;
        return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * k, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * k];
      } };
    };
    const ents = [];
    // тени облаков
    for (let i = 0; i < 3; i++) {
      const g = add(`<ellipse rx="${120 + i * 40}" ry="${46 + i * 12}" class="cloud-shadow"/>`);
      ents.push({ g, kind: 'cloud', y: 120 + i * 190, x0: -200 + i * 420, v: 9 + i * 3 });
    }
    const caravan = poly([[42.9, 71.37], [42.95, 70.0], [42.85, 68.3], [43.3, 68.27], [43.9, 67.2]]);
    for (let i = 0; i < 3; i++) ents.push({ g: add(sprite(SP.beast('camel', 'walk'), 20, 16)), kind: 'path', path: caravan, u: 0.2 + i * 0.012, v: 7, dir: 1 });
    const kulans = poly([[44.25, 77.6], [44.05, 78.6], [44.2, 79.7]]);
    for (let i = 0; i < 3; i++) ents.push({ g: add(sprite(SP.beast('kulan'), 18, 13)), kind: 'path', path: kulans, u: 0.3 + i * 0.03, v: 16, dir: 1 });
    const [scx, scy] = P(46.1, 70.0);
    for (let i = 0; i < 5; i++) ents.push({ g: add(sprite(SP.beast('saiga'), 15, 11)), kind: 'herd', cx: scx, cy: scy, rx: 70, ry: 16, a: i * 0.12, v: 0.22 });
    const [ax, ay] = P(48.9, 66.6);
    for (let i = 0; i < 2; i++) ents.push({ g: add(sprite(SP.beast('arkhar', 'walk'), 15, 11)), kind: 'herd', cx: ax, cy: ay, rx: 26, ry: 8, a: i * 0.5, v: 0.12 });
    const [mx, my] = P(49.8, 85.6);
    for (let i = 0; i < 2; i++) ents.push({ g: add(sprite(SP.beast('maral', 'walk'), 17, 14)), kind: 'herd', cx: mx, cy: my, rx: 30, ry: 7, a: i * 0.4 + 2, v: 0.1 });
    [[45.2, 50.4], [44.6, 50.9], [46.3, 50.9]].forEach(([la, lo], i) => {
      const [x, y] = P(la, lo);
      ents.push({ g: add('<g class="seal"><ellipse rx="7" ry="3.4" fill="#7E8A96"/><circle cx="6" cy="-2" r="3" fill="#7E8A96"/><circle cx="7" cy="-2.6" r=".7" fill="#1A1A1A"/></g>'), kind: 'bob', x, y, ph: i * 2 });
    });
    const fishG = add(`<g class="jump-fish" opacity="0"><path d="M-6,0 Q0,-4 6,0 Q0,4 -6,0Z M-6,0 L-9,-3 L-9,3Z" fill="#E7A93B"/></g><circle class="jump-ring" r="2" fill="none" stroke="#E9F6F8" stroke-width="1.5" opacity="0"/>`);
    const lakes = [[46.4, 74.9], [46.6, 77.5], [44.0, 50.2], [46.3, 61.3]];
    let fishT = 2, fishA = null;
    const eg = add(`<g class="companion">${sprite(SP.eagle(), 30, 20)}</g>`);
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      for (const e of ents) {
        let x, y, dir = 1;
        if (e.kind === 'cloud') { x = ((e.x0 + t * e.v) % (W + 600)) - 300; y = e.y + Math.sin(t / 9 + e.y) * 20; e.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); continue; }
        if (e.kind === 'path') {
          e.u += (e.v / e.path.tot) * dt * e.dir;
          if (e.u > 1) { e.u = 1; e.dir = -1; } if (e.u < 0) { e.u = 0; e.dir = 1; }
          const [px, py] = e.path.at(e.u), [qx] = e.path.at(Math.min(1, Math.max(0, e.u + 0.01 * e.dir)));
          x = px; y = py; dir = qx >= px ? 1 : -1;
        } else if (e.kind === 'herd') {
          e.a += e.v * dt;
          x = e.cx + Math.cos(e.a) * e.rx; y = e.cy + Math.sin(e.a) * e.ry;
          dir = -Math.sin(e.a) >= 0 ? 1 : -1;
        } else if (e.kind === 'bob') {
          x = e.x + Math.sin(t / 3 + e.ph) * 6; y = e.y + Math.sin(t * 1.4 + e.ph) * 1.4;
          e.g.setAttribute('opacity', (0.55 + 0.45 * Math.max(0, Math.sin(t / 2 + e.ph))).toFixed(2));
        }
        e.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${dir},1)`);
      }
      // прыжок рыбы
      fishT -= dt;
      const fg = fishG.querySelector('.jump-fish'), ring = fishG.querySelector('.jump-ring');
      if (fishT <= 0 && !fishA) { const [la, lo] = lakes[Math.floor(Math.random() * lakes.length)]; const [x, y] = P(la, lo); fishA = { x, y, k: 0 }; }
      if (fishA) {
        fishA.k += dt / 0.9;
        const k = fishA.k;
        fg.setAttribute('opacity', k < 1 ? 1 : 0);
        fg.setAttribute('transform', `translate(${(fishA.x - 10 + k * 20).toFixed(1)},${(fishA.y - Math.sin(k * Math.PI) * 14).toFixed(1)}) rotate(${(-60 + k * 120).toFixed(0)})`);
        ring.setAttribute('cx', fishA.x + 10); ring.setAttribute('cy', fishA.y);
        ring.setAttribute('r', (2 + Math.max(0, k - 0.9) * 30).toFixed(1));
        ring.setAttribute('opacity', k > 0.9 ? Math.max(0, 1.4 - k).toFixed(2) : 0);
        if (k > 1.4) { fishA = null; fishT = 2 + Math.random() * 3; }
      }
      // беркут кружит над героем
      const a = t * 0.9;
      const ex = this.hero.x + 30 + Math.cos(a) * 34, ey = this.hero.y - 26 + Math.sin(a) * 12;
      eg.setAttribute('transform', `translate(${ex.toFixed(1)},${ey.toFixed(1)}) scale(${-Math.sin(a) >= 0 ? 1 : -1},1)`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  dust(x, y) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', 4);
    c.setAttribute('class', 'map-dust');
    this.dustLayer.appendChild(c);
    setTimeout(() => c.remove(), 800);
  }

  // ── герой ────────────────────────────────────────────
  setHero(opts) {
    this.heroOpts = opts;
    this.heroLayer.innerHTML = `<g id="heroG" class="hero idle"><g class="hero-flip"><g transform="translate(-60,-92) scale(1)">${heroMarkup(opts)}</g></g></g>`;
    this.heroG = this.heroLayer.querySelector('#heroG');
    this.flip = this.heroLayer.querySelector('.hero-flip');
    this.placeHero(this.hero.x, this.hero.y, this.hero.dir);
  }

  placeHero(x, y, dir = this.hero.dir) {
    this.hero = { x, y, dir };
    if (!this.heroG) return;
    // герой стоит чуть правее и ниже точки, чтобы не закрывать её
    this.heroG.setAttribute('transform', `translate(${(x + 30).toFixed(1)},${(y + 16).toFixed(1)}) scale(.42)`);
    this.flip.setAttribute('transform', `scale(${dir},1)`);
  }

  travel(tx, ty, onStart, onEnd) {
    return new Promise((res) => {
      const { x: x0, y: y0 } = this.hero;
      const dist = Math.hypot(tx - x0, ty - y0);
      if (dist < 2) { res(); return; }
      const dir = tx >= x0 ? 1 : -1;
      const mx = (x0 + tx) / 2 + (ty - y0) * 0.12, my = (y0 + ty) / 2 - (tx - x0) * 0.12;
      const ms = reduced() ? 300 : Math.max(1400, Math.min(5200, dist * 7));
      this.heroG.classList.remove('idle'); this.heroG.classList.add('run');
      onStart?.();
      const t0 = performance.now();
      let lastDust = 0;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * tx;
        const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * ty;
        this.placeHero(x, y, dir);
        if (now - lastDust > 70) { lastDust = now; this.dust(x + 30 - dir * 16 + (Math.random() - 0.5) * 6, y + 14); }
        // камера следует за героем
        const cx = this.vb.x + this.vb.w / 2, cy = this.vb.y + this.vb.h / 2;
        this.vb = this.clamp({ ...this.vb, x: this.vb.x + (x - cx) * 0.08, y: this.vb.y + (y - cy) * 0.08 });
        this.apply();
        if (k < 1) requestAnimationFrame(step);
        else {
          this.heroG.classList.remove('run'); this.heroG.classList.add('idle');
          onEnd?.(); res();
        }
      };
      requestAnimationFrame(step);
    });
  }
}

export { P };
