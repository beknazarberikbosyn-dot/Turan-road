// Сюжетные задания, разыгранные прямо в сцене. Жители реагируют на каждый ход:
// исследование точек на картинке, правка текста, раскладка (по слоям, по порядку,
// по парам, по местам на картинке), разговор с вариантами ответа и экшен-испытание.
import * as audio from './audio.js';
import { beast, item } from './sprites.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
const shake = (el) => { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

// ── значки для карточек ────────────────────────────────
const I = {
  beam: '<g transform="rotate(-14 20 20)"><rect x="2" y="15" width="36" height="10" rx="2" fill="#2E2420"/><path d="M6,17 l3,-2 M15,17 l3,-2 M25,17 l3,-2" stroke="#E8742E" stroke-width="1.6"/></g><path d="M22,30 L36,27 L29,34Z" fill="#8C949C" stroke="#4E555C"/><path d="M8,33 L22,30" stroke="#6B4A2E" stroke-width="2"/>',
  soak: '<path d="M8,15 L32,15 L29,35 L11,35Z" fill="#9C6A3A" stroke="#5A3A1C"/><ellipse cx="20" cy="15" rx="12" ry="3.4" fill="#4FAFD0"/><path d="M14,5 L17,18 M21,3 L21,17 M28,6 L24,17" stroke="#C9A06A" stroke-width="2.6" stroke-linecap="round"/>',
  pound: '<path d="M7,22 Q20,42 33,22Z" fill="#8C7A64" stroke="#5E5040"/><rect x="6" y="19" width="28" height="4.5" rx="2" fill="#6E5E4A"/><path d="M28,3 L19,21" stroke="#9C6A3A" stroke-width="5.5" stroke-linecap="round"/><path d="M11,21 q4,-3 8,0 q4,-3 8,0" stroke="#E8E2D0" stroke-width="2.4" fill="none"/>',
  sieve: '<rect x="5" y="11" width="30" height="20" rx="2" fill="#E8E2D0" stroke="#9C6A3A" stroke-width="3"/><path d="M5,17 H35 M5,23 H35 M12,11 V31 M20,11 V31 M28,11 V31" stroke="#C9A06A" stroke-width=".8" opacity=".8"/><path d="M14,6 q6,6 12,0" stroke="#4FAFD0" stroke-width="2" fill="none"/>',
  dry: '<circle cx="29" cy="10" r="6" fill="#F2C14E"/><path d="M29,0 v3 M29,17 v3 M19,10 h3 M36,10 h3 M22,3 l2,2 M34,15 l2,2" stroke="#F2C14E" stroke-width="2"/><path d="M2,22 H36" stroke="#6B4A2E" stroke-width="1.6"/><path d="M5,22 L29,22 L31,35 L7,35Z" fill="#F7F2E6" stroke="#9C8A6A"/>',
  polish: '<path d="M4,22 L32,19 L36,35 L8,37Z" fill="#F7F2E6" stroke="#9C8A6A"/><ellipse cx="22" cy="20" rx="9" ry="5.5" fill="#7A768C" stroke="#4E4A5E"/><path d="M10,30 q6,-3 12,0 t12,0" stroke="#C9B88A" fill="none"/><path d="M30,10 l3,-3 M34,14 l3,-1" stroke="#E7A93B" stroke-width="1.6"/>',
  train: '<rect x="3" y="11" width="34" height="17" rx="2" fill="#7A2A20" stroke="#4A1A12"/><path d="M3,16 H37" stroke="#A8322A"/><circle cx="12" cy="31" r="4" fill="#2B2B2B"/><circle cx="28" cy="31" r="4" fill="#2B2B2B"/><path d="M9,22 q4,-4 8,0 q-4,4 -8,0Z M21,21 q4,-4 8,0 q-4,4 -8,0Z" fill="#C9D8E6"/>',
  cotton: '<path d="M20,38 V22" stroke="#3E8A4F" stroke-width="2.6"/><path d="M20,30 q-8,-2 -10,-8 M20,28 q8,-2 10,-8" stroke="#3E8A4F" stroke-width="2" fill="none"/><circle cx="13" cy="15" r="6.5" fill="#fff" stroke="#C9C4B8"/><circle cx="27" cy="15" r="6.5" fill="#fff" stroke="#C9C4B8"/><circle cx="20" cy="9" r="6.5" fill="#fff" stroke="#C9C4B8"/>',
  split: '<rect x="2" y="2" width="36" height="36" rx="5" fill="#E2C48E"/><path d="M5,7 Q14,3 19,9 Q21,18 12,22 Q4,20 5,7Z" fill="#4FAFD0"/><path d="M22,18 Q33,14 35,24 Q35,35 24,34 Q18,28 22,18Z" fill="#4FAFD0"/><path d="M9,28 l3,3 M28,8 l3,2" stroke="#C9A06A" stroke-width="1.6"/>',
  dam: '<path d="M2,15 H19 V38 H2Z" fill="#4FAFD0"/><path d="M5,20 q3,-2 6,0 M7,27 q3,-2 6,0" stroke="#fff" fill="none"/><path d="M17,10 L25,10 L31,38 L13,38Z" fill="#8C8A84" stroke="#5E5C56"/><path d="M27,37 H38" stroke="#E2C48E" stroke-width="4"/>',
};
const icon = (k) => (I[k] ? `<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">${I[k]}</svg>` : item(k, 40));

// картинки к легенде о Балхаше
const PICS = {
  love: '<rect width="120" height="72" fill="#BFE3F2"/><path d="M0,52 C40,46 80,58 120,50 V72 H0Z" fill="#9CC46A"/><path d="M0,62 C30,58 60,66 120,60" stroke="#4FAFD0" stroke-width="4" fill="none"/><g transform="translate(44,58)"><path d="M-8,0 L-5,-24 Q0,-28 5,-24 L8,0Z" fill="#2E9AA8"/><circle cy="-30" r="6" fill="#E3B288"/><path d="M-6,-32 q0,8 -3,14 M6,-32 q0,8 3,14" stroke="#24150D" stroke-width="2"/></g><g transform="translate(76,58)"><path d="M-8,0 L-6,-26 Q0,-30 6,-26 L8,0Z" fill="#7A5A3A"/><circle cy="-32" r="6" fill="#C98E66"/><path d="M-6,-36 Q0,-42 6,-36Z" fill="#3A2A20"/><path d="M10,-30 V0" stroke="#9C6A3A" stroke-width="2"/></g><path d="M60,16 c-4,-6 -12,-2 -8,4 l8,8 l8,-8 c4,-6 -4,-10 -8,-4Z" fill="#E0505A"/>',
  father: '<rect width="120" height="72" fill="#E9D3A8"/><path d="M0,58 H120 V72 H0Z" fill="#C9A06A"/><path d="M76,58 v-22 a22,14 0 0 1 44,0 v22Z" fill="#F4EFE4" stroke="#8C6A42"/><g transform="translate(46,60)"><path d="M-12,0 L-9,-34 Q0,-40 9,-34 L12,0Z" fill="#A8322A"/><circle cy="-42" r="8" fill="#C98E66"/><path d="M-8,-46 Q0,-56 8,-46Z" fill="#F2EBDD"/><path d="M-4,-36 q4,6 8,0" stroke="#F2F0EA" stroke-width="4"/><path d="M8,-30 L22,-46" stroke="#A8322A" stroke-width="5" stroke-linecap="round"/><path d="M-6,-46 l4,2 M6,-46 l-4,2" stroke="#2E1C12" stroke-width="1.6"/></g><g transform="translate(92,62) scale(.6)"><path d="M-8,0 L-5,-24 Q0,-28 5,-24 L8,0Z" fill="#2E9AA8"/><circle cy="-30" r="6" fill="#E3B288"/></g>',
  run: '<rect width="120" height="72" fill="#F2C99A"/><circle cx="96" cy="16" r="9" fill="#F7E3B0"/><path d="M0,56 H120 V72 H0Z" fill="#C9A06A"/>' + [[38, 0], [74, 4]].map(([x, d]) => `<g transform="translate(${x},${54 - d})"><path d="M-18,-10 Q-4,-20 14,-12 L22,-22 L26,-18 L18,-6 Q8,2 -14,0Z" fill="#7A4A2A"/><path d="M-14,0 L-22,10 M-6,0 L-2,10 M8,-2 L16,8 M14,-6 L22,2" stroke="#5A3A1C" stroke-width="3" stroke-linecap="round"/><path d="M-18,-10 Q-30,-14 -32,-4" stroke="#3A2A20" stroke-width="3" fill="none"/><circle cx="0" cy="-24" r="5" fill="#D9A27A"/><path d="M-4,-20 L4,-20 L2,-12 L-2,-12Z" fill="${d ? '#2E9AA8' : '#7A5A3A'}"/></g>`).join('') + '<path d="M6,48 q6,-2 10,0 M12,40 q5,-2 8,0" stroke="#E8D0A8" stroke-width="2" fill="none"/>',
  lake: '<rect width="120" height="72" fill="#E2C48E"/><path d="M0,10 C14,22 26,30 34,40 C40,46 46,48 50,48" stroke="#4FAFD0" stroke-width="6" fill="none"/><path d="M120,6 C104,20 92,34 84,42 C78,48 72,48 70,48" stroke="#3E7FA8" stroke-width="6" fill="none"/><path d="M30,48 C40,40 56,42 60,46 C64,42 80,40 92,48 C84,60 40,62 30,48Z" fill="#4FAFD0"/><path d="M60,44 V60" stroke="#E2C48E" stroke-width="2" stroke-dasharray="3 2"/><text x="16" y="66" font-size="9" fill="#5A3A1C" font-family="Lora, serif">Или</text><text x="84" y="66" font-size="9" fill="#5A3A1C" font-family="Lora, serif">Каратал</text>',
};
const pic = (k) => (PICS[k] ? `<svg viewBox="0 0 120 72" aria-hidden="true">${PICS[k]}</svg>` : '');

// ── общие куски панели ────────────────────────────────
function head(title, how) { return `<div class="q-head"><b>${esc(title)}</b><span>${esc(how)}</span></div>`; }

// ── исследование: точки на картинке ───────────────────
export function explore(ctx) {
  const { st, panel, loc, sto, CATS } = ctx;
  const facts = loc.facts.map((f, i) => ({ ...f, i, at: sto.facts[i] }));
  return new Promise((res) => {
    (async () => {
      await st.say('npc', sto.explore, { auto: 1, to: 'hero' });
      if (!ctx.alive()) return;
      st.fadeSub(4500);
      panel.innerHTML = `<div class="quest ex">${head('Записи в Шежіре', 'Нажимай на светящиеся точки на картинке или на карточки ниже — житель всё покажет и расскажет.')}
        <div class="ex-list">${facts.map((f) => `<button class="ex-note" data-i="${f.i}" style="--cat:${CATS[f.cat].color}"><span class="fact-cat">${CATS[f.cat].name}</span><b>${esc(f.title)}</b><p></p></button>`).join('')}</div>
        <div class="q-foot"><span class="q-stat">Узнано 0 из ${facts.length}</span></div></div>`;
      const notes = [...panel.querySelectorAll('.ex-note')];
      const stat = panel.querySelector('.q-stat');
      const seen = new Set();
      let busy = false;
      const hs = st.hotspots(facts.map((f) => ({ id: f.i, at: f.at, label: f.title })), (h) => open(h.id));
      const lock = (on) => { hs.btns.forEach((b, i) => { b.disabled = on; b.classList.toggle('dim', on && !seen.has(i)); }); notes.forEach((b) => (b.disabled = on)); };
      const open = async (i) => {
        if (busy) return;
        busy = true; lock(true);
        audio.sfx.page();
        const f = facts[i];
        const npc = st.get('npc');
        const self = String(f.at).startsWith('@');
        const p = st.pt(f.at) || { x: 480, y: 300 };
        notes.forEach((n) => n.classList.toggle('on', n === notes[i]));
        notes[i].querySelector('p').textContent = f.text;
        notes[i].classList.add('open');
        const cam = self ? null : { x: p.x * 0.62 + npc.x * 0.38, y: Math.min(p.y, 380) - 50 };
        await st.say('npc', f.text, self ? { to: 'hero', gesture: 'nod' } : { at: f.at, cam, zoom: 1.13, to: 'hero' });
        if (!ctx.alive()) return;
        st.clearSub();
        seen.add(i);
        hs.btns[i].classList.add('done'); notes[i].classList.add('done'); notes[i].classList.remove('on');
        stat.textContent = `Узнано ${seen.size} из ${facts.length}`;
        busy = false; lock(false);
        if (seen.size === facts.length) { hs.clear(); res(); }
      };
      notes.forEach((b) => b.addEventListener('click', () => open(+b.dataset.i)));
      ctx.reveal(panel.firstElementChild);
    })();
  });
}

// ── правка текста: таблички, этикетки, отчёты ─────────
function proofread(beat, ctx) {
  const { st, panel } = ctx;
  return new Promise((res) => {
    (async () => {
      await st.say('npc', beat.intro, { auto: 1, emo: 'worried', emoT: 3, to: 'hero' });
      if (!ctx.alive()) return;
      const ph = [];
      const text = beat.parts.map((p) => {
        if (typeof p === 'string') return esc(p);
        const i = ph.length;
        ph.push({ ...p, v: p.t, hints: 0 });
        return `<button class="pr-ph" data-i="${i}" aria-haspopup="listbox" aria-expanded="false">${esc(p.t)}</button>`;
      }).join('');
      panel.innerHTML = `<div class="quest pr pr-${beat.doc || 'sign'}">${head(beat.title, 'Нажимай на подозрительные слова и выбирай верный вариант. Осторожно: часть слов написана правильно.')}
        <div class="pr-doc"><p class="pr-text">${text}</p><div class="pr-pop" role="listbox" hidden></div></div>
        <div class="q-foot"><span class="q-stat" aria-live="polite">Изменено слов: 0</span><button class="btn" data-a="check">Проверить</button></div></div>`;
      const q = panel.firstElementChild, doc = q.querySelector('.pr-doc'), pop = q.querySelector('.pr-pop');
      const stat = q.querySelector('.q-stat'), check = q.querySelector('[data-a=check]');
      const btns = [...q.querySelectorAll('.pr-ph')];
      let cur = -1, fails = 0, done = false;
      const closePop = () => { pop.hidden = true; if (cur >= 0) btns[cur].setAttribute('aria-expanded', 'false'); cur = -1; };
      const openPop = (i) => {
        if (cur === i) { closePop(); return; }
        closePop();
        cur = i;
        const b = btns[i];
        pop.innerHTML = ph[i].opts.map((o) => `<button role="option" aria-selected="${o === ph[i].v}" data-v="${esc(o)}">${esc(o)}</button>`).join('');
        pop.hidden = false;
        const dr = doc.getBoundingClientRect(), br = b.getBoundingClientRect();
        const left = Math.max(6, Math.min(dr.width - pop.offsetWidth - 6, br.left - dr.left + br.width / 2 - pop.offsetWidth / 2));
        pop.style.left = left + 'px';
        pop.style.top = (br.bottom - dr.top + 6) + 'px';
        b.setAttribute('aria-expanded', 'true');
        (pop.querySelector('[aria-selected=true]') || pop.firstElementChild)?.focus({ preventScroll: true });
        audio.sfx.page();
        st.get('npc')?.look(st.get('hero'));
      };
      btns.forEach((b, i) => b.addEventListener('click', (e) => { e.stopPropagation(); if (!done) openPop(i); }));
      pop.addEventListener('click', (e) => {
        e.stopPropagation();
        const o = e.target.closest('[data-v]');
        if (!o || cur < 0) return;
        const p = ph[cur], b = btns[cur];
        p.v = o.dataset.v;
        b.textContent = p.v;
        b.classList.toggle('edited', p.v !== p.t);
        b.classList.remove('flash');
        stat.textContent = `Изменено слов: ${ph.filter((x) => x.v !== x.t).length}`;
        audio.sfx.click();
        st.get('hero')?.gesture('nod');
        closePop();
        b.focus({ preventScroll: true });
      });
      pop.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); const b = btns[cur]; closePop(); b?.focus(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const all = [...pop.children], k = all.indexOf(document.activeElement);
          all[(k + (e.key === 'ArrowDown' ? 1 : all.length - 1)) % all.length]?.focus();
        }
      });
      q.addEventListener('click', () => closePop());
      check.addEventListener('click', async (e) => {
        e.stopPropagation();
        closePop();
        const wrong = ph.filter((p) => p.v !== p.ok);
        check.disabled = true;
        if (!wrong.length) {
          done = true;
          btns.forEach((b, i) => { b.disabled = true; if (ph[i].v !== ph[i].t) b.classList.add('fixed'); });
          check.hidden = true;
          stat.textContent = 'Всё верно!';
          q.classList.add('solved');
          audio.sfx.correct();
          st.get('hero')?.emote('happy', 3);
          st.get('npc')?.gesture('nod2');
          await st.say('npc', beat.done, { emo: 'happy', emoT: 4, to: 'hero' });
          res();
          return;
        }
        fails++;
        audio.sfx.wrong();
        shake(doc);
        const n = wrong.length;
        const msg = n === 1 ? 'Почти! Осталась всего одна ошибка. Перечитай ещё раз.'
          : fails === 1 ? `Не всё. Я насчитал ещё ${n} ${plural(n, 'ошибку', 'ошибки', 'ошибок')}.`
            : `Ещё ${n} ${plural(n, 'ошибка', 'ошибки', 'ошибок')}. Не сдавайся!`;
        st.get('hero')?.emote('worried', 2);
        await st.say('npc', msg, { auto: 1, emo: n === 1 ? 'thinking' : 'worried', emoT: 2.5, to: 'hero' });
        if (fails >= 2 && ctx.alive()) {
          const p = wrong[0];
          let t;
          if (p.t === p.ok) t = `Кья! Зачем ты заменил «${p.ok}»? Там было написано верно.`;
          else if (!p.hints) t = `Кья! Присмотрись к словам «${p.v}».`;
          else t = `Кья! ${p.why || `Там должно быть «${p.ok}».`}`;
          p.hints++;
          const b = btns[ph.indexOf(p)];
          b.classList.add('flash');
          await st.hint(t, { auto: 1100 });
        }
        check.disabled = false;
      });
      ctx.reveal(q);
    })();
  });
}

// ── раскладка: по слоям, по порядку, по парам, по местам на картинке ──
function arrange(beat, ctx) {
  const { st, panel } = ctx;
  const mode = beat.mode;
  return new Promise((res) => {
    (async () => {
      await st.say('npc', beat.intro, { auto: 1, to: 'hero' });
      if (!ctx.alive()) return;
      if (beat.mode === 'place') st.fadeSub(6000);
      // идентификаторы мест сравниваем строками: так они приходят из data-атрибутов
      const sid = (v) => (v == null ? null : String(v));
      const cards = shuffle(beat.cards).map((c) => ({ ...c, ok: sid(c.ok), at: null, locked: false }));
      const extra = cards.some((c) => c.ok == null);
      const single = mode !== 'bins';
      const targets = mode === 'place' ? [...new Set(cards.map((c) => c.ok).filter(Boolean))].map((id) => ({ id })) : beat.slots.map((x) => ({ ...x, id: sid(x.id) }));
      const photos = targets.some((x) => x.beast);
      const how = {
        bins: 'Перетащи каждую находку в свой слой — или нажми на находку, а потом на слой.',
        order: 'Перетащи карточки по местам в правильном порядке — или нажимай: карточка, потом место.',
        match: extra ? 'Перетащи подписи на места. Одна подпись лишняя — оставь её внизу.' : 'Перетащи каждую карточку на своё место — или нажимай: карточка, потом место.',
        place: 'Перетащи подпись прямо на картинку — к нужному кружку. Или нажми на подпись, а потом на кружок.',
      }[mode];
      const slotHTML = (s) => `<div class="ar-slot" data-slot="${s.id}" role="button" tabindex="0" aria-label="${esc(s.label)}">
        <div class="ar-lab">${s.beast ? `<span class="ar-photo">${beast(s.beast, 'still')}</span>` : ''}<b>${esc(s.label)}</b>${s.hint ? `<small>${esc(s.hint)}</small>` : ''}</div><div class="ar-in"></div></div>`;
      const cardHTML = (c) => `<button class="ar-card${c.pic ? ' has-pic' : ''}" data-card="${c.id}">${c.icon ? `<span class="ar-ico">${icon(c.icon)}</span>` : ''}${c.pic ? `<span class="ar-pic">${pic(c.pic)}</span>` : ''}<span class="ar-t">${esc(c.t)}${c.clue ? `<small>${esc(c.clue)}</small>` : ''}</span><i class="ar-where"></i></button>`;
      panel.innerHTML = `<div class="quest ar ar-${mode}${beat.pics ? ' ar-pics' : photos ? ' ar-photos' : mode !== 'bins' && mode !== 'place' ? ' ar-rows' : ''}">${head(beat.title, how)}
        ${mode === 'place' ? '' : `<div class="ar-slots">${targets.map(slotHTML).join('')}</div>`}
        <div class="ar-tray" data-slot="tray">${cards.map(cardHTML).join('')}</div>
        <div class="q-foot"><span class="q-stat" aria-live="polite"></span><button class="btn" data-a="check" disabled>Проверить</button></div></div>`;
      const q = panel.firstElementChild, tray = q.querySelector('.ar-tray');
      const stat = q.querySelector('.q-stat'), check = q.querySelector('[data-a=check]');
      const el = (id) => q.querySelector(`[data-card="${id}"]`);
      let spots = null;
      if (mode === 'place') {
        spots = st.hotspots(targets.map((t) => ({ id: t.id, at: t.id, label: 'Сюда?', cls: 'drop' })), (h) => { if (sel) moveTo(sel, h.id); else { const c = cards.find((x) => x.at === h.id && !x.locked); if (c) select(c.id); } });
        spots.btns.forEach((b, i) => { b.dataset.slot = targets[i].id; });
      }
      const need = mode === 'bins' ? cards.length : Math.min(targets.length, cards.filter((c) => c.ok != null).length);
      let sel = null, fails = 0, solved = false, dragged = false;

      const layout = () => {
        for (const c of cards) {
          const e = el(c.id);
          const home = c.at && mode !== 'place' ? q.querySelector(`[data-slot="${c.at}"] .ar-in`) : tray;
          if (e.parentElement !== home) home.appendChild(e);
          e.classList.toggle('placed', !!c.at);
          e.classList.toggle('ok', c.locked);
          e.querySelector('.ar-where').textContent = mode === 'place' && c.at ? 'на картинке' : '';
        }
        q.querySelectorAll('.ar-slot').forEach((s) => s.classList.toggle('full', single && cards.some((c) => c.at === s.dataset.slot)));
        if (spots) spots.btns.forEach((b, i) => {
          const c = cards.find((x) => x.at === targets[i].id);
          b.querySelector('span').textContent = c ? c.t : 'Сюда?';
          b.classList.toggle('filled', !!c); b.classList.toggle('label', !!c); b.classList.toggle('ok', !!c?.locked);
        });
        const placed = cards.filter((c) => c.at).length;
        check.disabled = solved || placed < need;
        stat.textContent = solved ? 'Всё на своих местах!' : `Разложено: ${placed} из ${need}`;
      };
      const select = (id) => {
        sel = id && sel !== id ? id : null;
        q.querySelectorAll('.ar-card').forEach((b) => b.classList.toggle('sel', b.dataset.card === sel));
        q.classList.toggle('picking', !!sel);
        st.hot.classList.toggle('picking', !!sel && mode === 'place');
      };
      const moveTo = (id, target) => {
        const c = cards.find((x) => x.id === id);
        if (!c || c.locked || solved) return;
        if (target !== 'tray' && single) {
          const occ = cards.find((x) => x.at === target && x !== c);
          if (occ) { if (occ.locked) { audio.sfx.wrong(); return; } occ.at = c.at; }
        }
        c.at = target === 'tray' ? null : target;
        audio.sfx.page();
        select(null);
        layout();
        if (c.at) st.get('npc')?.look(mode === 'place' ? st.pt(c.at) : st.get('hero'));
      };

      // нажатия
      q.addEventListener('click', (e) => {
        if (dragged) { dragged = false; return; }
        const card = e.target.closest('.ar-card');
        if (card) {
          const c = cards.find((x) => x.id === card.dataset.card);
          if (!c || c.locked || solved) return;
          if (sel && sel !== c.id && c.at && mode !== 'place') { moveTo(sel, c.at); return; }
          audio.sfx.click();
          select(c.id);
          return;
        }
        const slot = e.target.closest('[data-slot]');
        if (slot && sel) moveTo(sel, slot.dataset.slot);
      });
      q.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.ar-slot')) { e.preventDefault(); if (sel) moveTo(sel, e.target.dataset.slot); }
      });
      // перетаскивание мышью и пальцем
      q.addEventListener('pointerdown', (e) => {
        const card = e.target.closest('.ar-card');
        if (!card || e.button > 0) return;
        const c = cards.find((x) => x.id === card.dataset.card);
        if (!c || c.locked || solved) return;
        const sx = e.clientX, sy = e.clientY;
        let ghost = null, over = null;
        const hit = (x, y) => document.elementFromPoint(x, y)?.closest('[data-slot]');
        const move = (ev) => {
          if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 7) {
            ghost = card.cloneNode(true);
            ghost.classList.add('ar-ghost');
            ghost.classList.remove('sel', 'dragging');
            ghost.style.width = card.offsetWidth + 'px';
            document.body.appendChild(ghost);
            card.classList.add('dragging');
            select(null);
          }
          if (!ghost) return;
          ev.preventDefault();
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          const t = hit(ev.clientX, ev.clientY);
          if (t !== over) { over?.classList.remove('over'); over = t; over?.classList.add('over'); }
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          if (!ghost) return;
          dragged = true;
          setTimeout(() => { dragged = false; }, 60);
          ghost.remove(); card.classList.remove('dragging'); over?.classList.remove('over');
          const t = ev.type === 'pointerup' ? hit(ev.clientX, ev.clientY) : null;
          if (t) moveTo(c.id, t.dataset.slot);
        };
        window.addEventListener('pointermove', move, { passive: false });
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      });

      check.addEventListener('click', async (e) => {
        e.stopPropagation();
        select(null);
        const good = (c) => (c.ok == null ? !c.at : c.at === c.ok);
        const total = cards.filter((c) => c.ok != null).length;
        const bad = cards.filter((c) => c.at && !good(c));
        cards.forEach((c) => { if (c.at && good(c)) c.locked = true; });
        const okN = cards.filter((c) => c.ok != null && c.at === c.ok).length;
        if (okN === total && !bad.length) {
          solved = true;
          layout();
          q.classList.add('solved');
          audio.sfx.correct();
          spots?.btns.forEach((b) => { b.disabled = true; });
          st.get('npc')?.gesture('nod2');
          st.get('hero')?.emote('happy', 3);
          if (beat.tell) {
            const slotsEl = [...q.querySelectorAll('.ar-slot')];
            for (let i = 0; i < beat.tell.length; i++) {
              slotsEl.forEach((s, k) => s.classList.toggle('now', k === i));
              const l = beat.tell[i];
              await st.say(l.who, l.text, { emo: l.emo, emoT: 3, to: l.who === 'npc' ? 'kid' : 'npc' });
              if (!ctx.alive()) return;
            }
            slotsEl.forEach((s) => s.classList.remove('now'));
          }
          await st.say('npc', beat.done, { emo: 'happy', emoT: 4, to: 'hero' });
          spots?.clear();
          res();
          return;
        }
        fails++;
        audio.sfx.wrong();
        bad.forEach((c) => { c.at = null; shake(el(c.id)); });
        layout();
        const left = total - okN;
        st.get('hero')?.emote('worried', 2);
        await st.say('npc', okN ? `Верно ${okN} из ${total}. Остальное я вернул — подумай ещё.` : 'Пока ни одной на своём месте. Давай ещё раз, не торопись.', { auto: 1, emo: left === 1 ? 'thinking' : 'worried', emoT: 2.5, to: 'hero' });
        if (mode === 'place') st.fadeSub(4000);
        if (fails >= 2 && ctx.alive()) {
          const miss = cards.find((c) => c.ok != null && c.at !== c.ok);
          const where = (id) => { const s = targets.find((x) => x.id === id); return s?.label ? `«${s.label}»` : 'вон тот кружок'; };
          if (fails === 2 || !miss) await st.hint('Кья! ' + beat.hint, { auto: 1200 });
          else {
            await st.hint(`Кья! «${miss.t.split(/[:—]/)[0].trim()}» — ${mode === 'place' ? 'смотри, куда я лечу' : 'это ' + where(miss.ok)}.`, { auto: 1200 });
            if (mode === 'place') { const p = st.pt(miss.ok); if (p && st.eagle) { await st.eagle.flyTo(p.x, p.y - 20, 0.8, 40); st.eagle.setSpread(true); await wait(900); await st.eagle.flyTo(st.perch.x, st.perch.y, 0.9, 50); } }
          }
        }
      });
      layout();
      ctx.reveal(q);
    })();
  });
}

// ── разговор: герой отвечает за жителя ────────────────
async function talk(beat, ctx) {
  const { st, panel, hero } = ctx;
  if (beat.intro) { await st.say(beat.intro.who, beat.intro.text, { emo: beat.intro.emo, to: 'hero' }); ctx.guard(); }
  for (let k = 0; k < beat.steps.length; k++) {
    const step = beat.steps[k];
    const who = st.cast[step.who] ? step.who : 'npc';
    const asker = st.cast[who];
    const opts = shuffle(step.choices);
    const tried = new Set();
    let solved = false;
    st.get(who)?.emote('thinking', 1.2);
    while (!solved) {
      await st.say(who, step.say, { auto: 1, to: 'hero' });
      ctx.guard();
      const pick = await new Promise((resolve) => {
        panel.innerHTML = `<div class="quest tk">${head(beat.title, `${asker?.name || 'Житель'} спрашивает. Что ответит ${hero.name}?`)}
          <p class="tk-n">Вопрос ${k + 1} из ${beat.steps.length}</p>
          <p class="tk-q">${esc(step.say)}</p>
          <div class="tk-opts">${opts.map((o, i) => `<button class="tk-opt${tried.has(o) ? ' tried' : ''}" data-i="${i}" ${tried.has(o) ? 'disabled' : ''}>${esc(o.t)}</button>`).join('')}</div></div>`;
        panel.querySelectorAll('.tk-opt').forEach((b) => b.addEventListener('click', () => { audio.sfx.click(); resolve(opts[+b.dataset.i]); }));
        ctx.reveal(panel.firstElementChild);
        (panel.querySelector('.tk-opt:not([disabled])'))?.focus({ preventScroll: true });
      });
      panel.querySelectorAll('.tk-opt').forEach((b) => { b.disabled = true; b.classList.toggle('chosen', opts[+b.dataset.i] === pick); });
      await st.say('hero', pick.t, { auto: 450, to: who });
      ctx.guard();
      const r = pick.react;
      if (r) {
        const rw = st.cast[r.who] ? r.who : 'npc';
        await st.say(rw, r.text, { emo: r.emo, emoT: 3, gesture: r.gesture || (pick.ok ? 'nod' : (r.emo === 'laugh' ? 'laugh' : 'shake')), to: 'hero' });
        ctx.guard();
      }
      if (pick.ok) {
        solved = true;
        audio.sfx.correct();
        st.get('hero')?.emote('happy', 2.5);
      } else {
        tried.add(pick);
        audio.sfx.wrong();
        st.get('hero')?.emote('confused', 2);
        if (pick.hint) { await st.hint('Кья! ' + pick.hint); ctx.guard(); }
      }
    }
  }
  panel.innerHTML = '';
  if (beat.done) await st.say(beat.done.who, beat.done.text, { emo: 'happy', emoT: 3, to: 'hero' });
}

// ── экшен-испытание ───────────────────────────────────
async function game(beat, ctx) {
  const { st, panel, loc, modal } = ctx;
  await st.say('npc', loc.game.intro, { lastBtn: 'Принять испытание', to: 'hero' });
  ctx.guard();
  modal.classList.add('gaming');
  st.pause(true);
  ctx.music('menu');
  const res = await ctx.playGame(panel, loc.game, { hero: ctx.hero });
  ctx.guard();
  panel.innerHTML = '';
  modal.classList.remove('gaming');
  st.pause(false);
  ctx.music('village');
  ctx.reveal(st.wrap, 'start');
  const npc = st.get('npc'), hero = st.get('hero');
  if (res.win) {
    ctx.onStars(res.stars);
    npc.pose('cheer'); npc.gesture('jump'); npc.emote('laugh', 2);
    hero.pose('cheer'); hero.gesture('jump'); hero.emote('happy', 4);
    audio.sfx.chime();
    for (const id of Object.keys(st.cast)) if (!['npc', 'hero', 'eagle'].includes(id)) { st.get(id)?.gesture?.('jump'); st.get(id)?.emote?.('happy', 3); }
    await wait(900);
    hero.pose('rest'); npc.pose(npc.basePose || 'rest');
    await st.say('npc', beat.win, { emo: 'happy', emoT: 4, to: 'hero' });
  } else {
    hero.emote('sad', 2);
    await st.say('npc', beat.lose, { emo: 'kind', emoT: 3, to: 'hero', gesture: 'nod' });
  }
  return res;
}

export async function runQuest(beat, ctx) {
  if (beat.type === 'proofread') return proofread(beat, ctx);
  if (beat.type === 'arrange') return arrange(beat, ctx);
  if (beat.type === 'talk') return talk(beat, ctx);
  if (beat.type === 'game') return game(beat, ctx);
  return null;
}
