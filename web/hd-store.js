/* hd-store.js — 命盘记录本地存储（window.HDStore，localStorage）
   记录 = { id, name, gender, v, ts, updatedAt, fav,
            input:{year,month,day,hour,minute,tz,place?},
            sum:{ type, typeZh, profile, authority, definition, gates:[..], channels:[..] } }
   只存输入+摘要，打开时按输入重新排盘（引擎即真相，升级算法旧记录自动受益）。
   设计为「本地优先」存储层：所有读写走这一个模块，将来接云同步只换实现、四个页面零改动。
   每条带 id + updatedAt + v(schema版本)，是未来无损同步/迁移的基础。 */
(function () {
  const KEY = 'hd_charts_v1';
  const SCHEMA = 1;                       // 记录结构版本，未来迁移用
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  // 写入带容错：隐私模式/配额满时不静默失败，返回 false 让调用方提示用户
  const write = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { console.warn('HDStore 写入失败', e); return false; } };

  window.HDStore = {
    SCHEMA,
    all() { return read().sort((x, y) => (y.fav - x.fav) || ((y.updatedAt || y.ts) - (x.updatedAt || x.ts))); },
    get(id) { return read().find(r => r.id === id) || null; },
    add(rec) {
      const a = read();
      rec.id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      rec.ts = Date.now(); rec.updatedAt = rec.ts; rec.v = SCHEMA; rec.fav = !!rec.fav;
      a.push(rec);
      return write(a) ? rec.id : null;     // 写失败返回 null
    },
    remove(id) { return write(read().filter(r => r.id !== id)); },
    toggleFav(id) { const a = read(); const r = a.find(x => x.id === id); if (r) { r.fav = !r.fav; r.updatedAt = Date.now(); write(a); } return r && r.fav; },
    count() { return read().length; },
    summarize(c) { // 从完整 chart 提摘要（供搜索：闸门/类型/角色/通道）
      return {
        type: c.type, typeZh: c.typeZh, profile: c.profile.str,
        authority: c.authority, definition: c.definitionZh,
        gates: [...new Set([...c.personality, ...c.design].map(a => a.gate))].sort((x, y) => x - y),
        channels: c.definedChannels.map(x => x.key),
      };
    },

    // ── 备份/恢复（防丢失安全网；也是换设备/换浏览器/换域名的迁移手段）──
    exportJSON() {
      return JSON.stringify({ app: 'guanji-humandesign', kind: 'charts-backup', schema: SCHEMA, exportedAt: Date.now(), records: read() }, null, 2);
    },
    // 导入：按 id 合并去重，已存在则取 updatedAt 较新的一条；返回 {added, updated, total}
    importJSON(text) {
      let data; try { data = JSON.parse(text); } catch (e) { throw new Error('bad-json'); }
      const incoming = Array.isArray(data) ? data : (data.records || []);
      if (!Array.isArray(incoming)) throw new Error('bad-format');
      const cur = read(); const byId = new Map(cur.map(r => [r.id, r]));
      let added = 0, updated = 0;
      for (const r of incoming) {
        if (!r || !r.id || !r.input) continue;
        const old = byId.get(r.id);
        if (!old) { byId.set(r.id, r); added++; }
        else if ((r.updatedAt || r.ts || 0) > (old.updatedAt || old.ts || 0)) { byId.set(r.id, r); updated++; }
      }
      write([...byId.values()]);
      return { added, updated, total: byId.size };
    },

    // 申请「持久化存储」豁免：尽量让浏览器在存储压力/ITP 下不清除本站数据（best-effort）
    async requestPersist() {
      try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) {}
      return false;
    },
  };
})();
