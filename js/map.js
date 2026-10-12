// Интерактивная карта: камера (viewBox), перетаскивание, зум, маршрут, точки и герой.
import { P, VB, W, H, buildMapSVG } from './geo.js';
import { heroMarkup } from './hero.js';

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

  // ── маршрут и точки ──────────────────────────────────
  render(start, locs, state) {
    const done = new Set(state.completed);
    const unlockedIdx = locs.findIndex((l) => !done.has(l.id));
    const pts = [P(start.lat, start.lon), ...locs.map(locXY)];

    let r = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12, my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
      const open = i <= (unlockedIdx === -1 ? locs.length : unlockedIdx);
      const walked = i < (unlockedIdx === -1 ? locs.length : unlockedIdx);
      r += `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" class="road ${walked ? 'road-walked' : open ? 'road-open' : 'road-closed'}"/>`;
    }
    this.route.innerHTML = r;

    const [sx, sy] = pts[0];
    let m = `<g class="mk-start" transform="translate(${sx},${sy})">
      <path d="M-14,4 L0,-18 L14,4Z" fill="#7C5C40"/><path d="M-5,-10 L0,-18 L5,-10Z" fill="#FBFBF7"/>
      <text y="20" class="mk-label">${start.name}</text></g>`;
    // закрытые рисуем первыми, следующую точку — последней, чтобы её было удобно нажать
    const order = locs.map((l, i) => i).sort((a, b) => rank(a) - rank(b));
    function rank(i) { return done.has(locs[i].id) ? 1 : i === unlockedIdx ? 2 : 0; }
    order.forEach((i) => {
      const l = locs[i];
      const [x, y] = pts[i + 1];
      const isDone = done.has(l.id);
      const isNext = i === unlockedIdx;
      const locked = !isDone && !isNext;
      const cls = isDone ? 'mk-done' : isNext ? 'mk-next' : 'mk-locked';
      const label = locked ? `${l.name}, закрыто` : `${l.name}${isDone ? ', пройдено' : ', следующая точка'}`;
      m += `<g class="mk ${cls}" data-id="${l.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" tabindex="${locked ? -1 : 0}" role="button" aria-label="${label}">
        ${isNext ? '<circle class="mk-pulse" r="14"/>' : ''}
        <circle class="mk-hit" r="22"/>
        ${isDone
          ? '<path class="mk-body" d="M0,-16 L14,10 L-14,10Z"/><circle r="3.6" cy="1" fill="#A8322A"/>'
          : `<circle class="mk-body" r="12.5"/><text class="mk-num" y="4.5">${i + 1}</text>`}
        <text class="mk-label" ${l.label === 'top' ? 'y="-21"' : l.label === 'left' ? 'x="-20" y="4" style="text-anchor:end"' : `y="${isDone ? 26 : 28}"`}>${l.name}</text>
      </g>`;
    });
    this.markers.innerHTML = m;
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
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * tx;
        const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * ty;
        this.placeHero(x, y, dir);
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
