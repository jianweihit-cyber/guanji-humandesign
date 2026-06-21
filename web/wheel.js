/* wheel.js — 观己通用滚动选择器（window.HDWheel）
   底部弹层 + 多列滚轮：5 项可见、中间项放大、scroll-snap 吸附、选中变化时震动反馈。
   API: HDWheel.open({ title, cols:[{values, value}], onChange(i,vals), onDone(vals) }) */
(function () {
  const IH = 38, VISIBLE = 5, PAD = IH * 2; // 行高/可见行/上下留白
  const REPEAT = 7;                         // 循环列：值复制份数(奇数，中间份为基准；滚到边缘无缝回中)
  const css = `
  .whl-mask{position:fixed;inset:0;background:rgba(40,30,15,.35);z-index:999;opacity:0;transition:opacity .18s}
  .whl-mask.on{opacity:1}
  .whl-sheet{position:fixed;left:50%;bottom:0;transform:translate(-50%,100%);transition:transform .22s ease-out;
    width:min(96vw,440px);background:#FFFDF8;border-radius:16px 16px 0 0;z-index:1000;
    box-shadow:0 -8px 30px rgba(60,40,10,.18);padding-bottom:env(safe-area-inset-bottom)}
  .whl-sheet.on{transform:translate(-50%,0)}
  .whl-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #F0E8D8}
  .whl-head b{font-size:15px}
  .whl-btn{border:none;background:none;font-size:15px;padding:6px 10px;cursor:pointer;color:#8A7A5E}
  .whl-btn.ok{color:#B3433A;font-weight:700}
  .whl-body{position:relative;display:flex;padding:0 10px}
  .whl-col{flex:1;height:${IH * VISIBLE}px;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .whl-col::-webkit-scrollbar{display:none}
  .whl-col .pad{height:${PAD}px}
  .whl-it{height:${IH}px;line-height:${IH}px;text-align:center;scroll-snap-align:center;
    font-size:14px;color:#A89C86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:font-size .08s,color .08s}
  .whl-it.on{font-size:18px;font-weight:700;color:#2B2B26}
  .whl-band{position:absolute;left:10px;right:10px;top:${PAD}px;height:${IH}px;pointer-events:none;
    border-top:1px solid #E0CFAE;border-bottom:1px solid #E0CFAE;background:rgba(233,196,106,.08);border-radius:8px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const vib = () => { try { navigator.vibrate && navigator.vibrate(4); } catch (e) {} };

  function open(opts) {
    const mask = document.createElement('div'); mask.className = 'whl-mask';
    const sheet = document.createElement('div'); sheet.className = 'whl-sheet';
    const T = (window.HDI18N && window.HDI18N.lang === 'en');
    sheet.innerHTML = `<div class="whl-head"><button class="whl-btn" data-x>${T ? 'Cancel' : '取消'}</button><b>${opts.title || ''}</b><button class="whl-btn ok" data-ok>${T ? 'Done' : '确定'}</button></div><div class="whl-body"><div class="whl-band"></div></div>`;
    const body = sheet.querySelector('.whl-body');
    const state = []; // 每列 {el, values, idx}

    const strip = (values, loop) => loop ? Array.from({ length: values.length * REPEAT }, (_, k) => values[k % values.length]) : values;
    function buildCol(ci, col) {
      const el = document.createElement('div'); el.className = 'whl-col';
      const loop = !!col.loop && col.values.length > 2;   // 循环列(年份不循环)
      const idx0 = Math.max(0, col.values.indexOf(col.value));
      el.innerHTML = `<div class="pad"></div>${strip(col.values, loop).map(v => `<div class="whl-it">${v}</div>`).join('')}<div class="pad"></div>`;
      body.appendChild(el);
      const mid = (REPEAT - 1) / 2;
      const s = { el, values: col.values, idx: idx0, loop };
      state[ci] = s;
      const items = () => el.querySelectorAll('.whl-it');
      const markPos = (pos) => { const its = items(); for (let i = 0; i < its.length; i++) its[i].classList.toggle('on', i === pos); };
      const startPos = loop ? (mid * col.values.length + idx0) : idx0;
      s.pos = startPos;
      requestAnimationFrame(() => { el.scrollTop = startPos * IH; markPos(startPos); });
      let t = null;
      el.addEventListener('scroll', () => {
        const L = s.values.length;
        const p = Math.max(0, Math.round(el.scrollTop / IH));
        s.pos = p;
        const realIdx = loop ? (((p % L) + L) % L) : Math.min(Math.max(0, p), L - 1);
        markPos(p);
        if (realIdx !== s.idx) { s.idx = realIdx; vib(); if (opts.onChange) opts.onChange(ci, vals(), set); }
        clearTimeout(t); t = setTimeout(() => {
          el.scrollTo({ top: p * IH, behavior: 'smooth' });
          if (loop && (p < L || p >= L * (REPEAT - 1))) {   // 滚进首/末份 → 滚动停后无缝回中间份(同值不同份，视觉无感)
            const newP = mid * L + realIdx;
            setTimeout(() => { el.scrollTop = newP * IH; s.pos = newP; markPos(newP); }, 210);
          }
        }, 90);
      }, { passive: true });
      el.addEventListener('click', (e) => { // 点击某行直接选中
        const it = e.target.closest('.whl-it'); if (!it) return;
        const i = [...items()].indexOf(it); el.scrollTo({ top: i * IH, behavior: 'smooth' });
      });
    }
    const vals = () => state.map(s => s.values[s.idx]);
    // set(ci, values, keep) — 联动重建某列（如 月→日数、省→市）
    const set = (ci, values, value) => {
      const s = state[ci]; if (!s) return;
      s.values = values;
      const keep = value != null ? value : s.values[Math.min(s.idx, values.length - 1)];
      const realIdx = Math.max(0, values.indexOf(keep));
      s.idx = realIdx;
      s.el.innerHTML = `<div class="pad"></div>${strip(values, s.loop).map(v => `<div class="whl-it">${v}</div>`).join('')}<div class="pad"></div>`;
      const pos = s.loop ? ((REPEAT - 1) / 2 * values.length + realIdx) : realIdx;
      s.pos = pos;
      requestAnimationFrame(() => { s.el.scrollTop = pos * IH; s.el.querySelectorAll('.whl-it').forEach((it, i) => it.classList.toggle('on', i === pos)); });
    };
    opts.cols.forEach((c, i) => buildCol(i, c));

    const close = () => { mask.classList.remove('on'); sheet.classList.remove('on'); setTimeout(() => { mask.remove(); sheet.remove(); }, 220); };
    mask.onclick = close;
    sheet.querySelector('[data-x]').onclick = close;
    sheet.querySelector('[data-ok]').onclick = () => { vib(); opts.onDone && opts.onDone(vals(), state.map(s => s.idx)); close(); };
    document.body.appendChild(mask); document.body.appendChild(sheet);
    requestAnimationFrame(() => { mask.classList.add('on'); sheet.classList.add('on'); });
    return { set, close };
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const dim = (y, m) => new Date(y, m, 0).getDate();

  // 年月日时分 五列（自动按年月调整天数）
  function openDateTime({ y, mo, d, h, mi, title, onDone }) {
    open({
      title, cols: [
        { values: range(1900, 2035), value: +y },              // 年份不循环(有界范围)
        { values: range(1, 12), value: +mo, loop: true },
        { values: range(1, dim(+y, +mo)), value: +d, loop: true },
        { values: range(0, 23), value: +h, loop: true },
        { values: range(0, 59), value: +mi, loop: true },
      ],
      onChange(ci, v, set) { if (ci === 0 || ci === 1) set(2, range(1, dim(+v[0], +v[1]))); },
      onDone(v) { onDone(+v[0], +v[1], +v[2], +v[3], +v[4]); },
    });
  }
  function openYear({ y, title, onDone }) {
    open({ title, cols: [{ values: range(1900, 2035), value: +y }], onDone(v) { onDone(+v[0]); } });
  }

  window.HDWheel = { open, openDateTime, openYear, range };
})();
