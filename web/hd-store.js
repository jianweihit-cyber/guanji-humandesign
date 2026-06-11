/* hd-store.js — 命盘记录本地存储（window.HDStore，localStorage）
   记录 = { id, name, input:{year,month,day,hour,minute,tz}, ts, fav,
            sum:{ type, typeZh, profile, authority, definition, gates:[..], channels:[..] } }
   只存输入+摘要，打开时按输入重新排盘（引擎即真相，升级算法旧记录自动受益）。 */
(function () {
  const KEY = 'hd_charts_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const write = (a) => localStorage.setItem(KEY, JSON.stringify(a));

  window.HDStore = {
    all() { return read().sort((x, y) => (y.fav - x.fav) || (y.ts - x.ts)); },
    get(id) { return read().find(r => r.id === id) || null; },
    add(rec) {
      const a = read();
      rec.id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      rec.ts = Date.now(); rec.fav = !!rec.fav;
      a.push(rec); write(a); return rec.id;
    },
    remove(id) { write(read().filter(r => r.id !== id)); },
    toggleFav(id) { const a = read(); const r = a.find(x => x.id === id); if (r) { r.fav = !r.fav; write(a); } return r && r.fav; },
    summarize(c) { // 从完整 chart 提摘要（供搜索：闸门/类型/角色/通道）
      return {
        type: c.type, typeZh: c.typeZh, profile: c.profile.str,
        authority: c.authority, definition: c.definitionZh,
        gates: [...new Set([...c.personality, ...c.design].map(a => a.gate))].sort((x, y) => x - y),
        channels: c.definedChannels.map(x => x.key),
      };
    },
  };
})();
