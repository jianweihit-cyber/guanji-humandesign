/* hd-store.js — 排盘记录本地存储（window.HDStore，localStorage）
   记录 = { id, name, gender, v, ts, updatedAt, fav, tags:['self'|'family'|'friend'|'partner'|'other'],
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
  // 合盘 / Penta 链接记录（保存所选成员组合，可命名、去重、重开）
  const LKEY = 'hd_links_v1';
  const lread = () => { try { return JSON.parse(localStorage.getItem(LKEY)) || []; } catch (e) { return []; } };
  const lwrite = (a) => { try { localStorage.setItem(LKEY, JSON.stringify(a)); return true; } catch (e) { return false; } };

  window.HDStore = {
    SCHEMA,
    // 关系标记（可选，多选）；星标=fav 单独存。键稳定，供后端管理/定制问候分群
    TAGS: [
      { k: 'self', zh: '本人', tw: '本人', en: 'Self' },
      { k: 'family', zh: '家人', tw: '家人', en: 'Family' },
      { k: 'friend', zh: '朋友', tw: '朋友', en: 'Friend' },
      { k: 'partner', zh: '伙伴', tw: '夥伴', en: 'Partner' },
      { k: 'other', zh: '其他', tw: '其他', en: 'Other' },
    ],
    all() { return read().sort((x, y) => (y.fav - x.fav) || ((y.updatedAt || y.ts) - (x.updatedAt || x.ts))); },
    get(id) { return read().find(r => r.id === id) || null; },
    add(rec) {
      const a = read();
      rec.id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      rec.ts = Date.now(); rec.updatedAt = rec.ts; rec.v = SCHEMA; rec.fav = !!rec.fav;
      rec.tags = Array.isArray(rec.tags) ? rec.tags : [];
      a.push(rec);
      return write(a) ? rec.id : null;     // 写失败返回 null
    },
    remove(id) { return write(read().filter(r => r.id !== id)); },
    toggleFav(id) { const a = read(); const r = a.find(x => x.id === id); if (r) { r.fav = !r.fav; r.updatedAt = Date.now(); write(a); } return r && r.fav; },
    count() { return read().length; },
    // 批量写回（云同步拉回合并后整体落地；写失败返回 false 不谎报）
    replaceAll(arr) { return write(Array.isArray(arr) ? arr : []); },
    replaceLinks(arr) { return lwrite(Array.isArray(arr) ? arr : []); },
    summarize(c) { // 从完整 chart 提摘要（供搜索：闸门/类型/角色/通道）
      var pl = a => `${a.gate}.${a.line}`;   // 闸门.爻
      return {
        type: c.type, typeZh: c.typeZh, profile: c.profile.str,
        authority: c.authority, definition: c.definitionZh,
        gates: [...new Set([...c.personality, ...c.design].map(a => a.gate))].sort((x, y) => x - y), // 合并去重(供搜索/兼容)
        // 明确区分两层（个性=出生时刻/意识；设计=出生前88°/潜意识），按行星顺序列出 闸门.爻
        personality: c.personality.map(a => ({ planet: a.planet, gateLine: pl(a) })),
        design: c.design.map(a => ({ planet: a.planet, gateLine: pl(a) })),
        gatesP: [...new Set(c.personality.map(a => a.gate))].sort((x, y) => x - y),
        gatesD: [...new Set(c.design.map(a => a.gate))].sort((x, y) => x - y),
        channels: c.definedChannels.map(x => x.key),
      };
    },

    // ── 备份/恢复（防丢失安全网；也是换设备/换浏览器/换域名的迁移手段）──
    exportJSON() {
      return JSON.stringify({ app: 'guanji-humandesign', kind: 'charts-backup', schema: SCHEMA, exportedAt: Date.now(), records: read(), links: lread() }, null, 2);
    },
    // 导入：排盘+链接均按 id 合并去重，已存在则取 updatedAt 较新者；写失败抛 write-failed（防谎报成功）
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
      if (!write([...byId.values()])) throw new Error('write-failed');   // 配额满/隐私模式：不谎报成功
      // 合盘/Penta 链接（旧备份无 links 键自动兼容；守卫用 members 而非 input）
      let links = 0;
      const li = Array.isArray(data.links) ? data.links : [];
      if (li.length) {
        const lcur = lread(); const lById = new Map(lcur.map(r => [r.id, r]));
        for (const r of li) {
          if (!r || !r.id || !Array.isArray(r.members)) continue;
          const old = lById.get(r.id);
          if (!old) { lById.set(r.id, r); links++; }
          else if ((r.updatedAt || r.ts || 0) > (old.updatedAt || old.ts || 0)) { lById.set(r.id, r); }
        }
        if (!lwrite([...lById.values()])) throw new Error('write-failed');
      }
      return { added, updated, total: byId.size, links };
    },

    // 申请「持久化存储」豁免：尽量让浏览器在存储压力/ITP 下不清除本站数据（best-effort）
    async requestPersist() {
      try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) {}
      return false;
    },

    // ── 合盘 / Penta 链接记录 { id, name, kind:'conn'|'penta', members:[{id,name}], ts, v } ──
    linksAll() { return lread().sort((x, y) => (y.ts - x.ts)); },
    getLink(id) { return lread().find(r => r.id === id) || null; },
    addLink(rec) { const a = lread(); rec.id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); rec.ts = Date.now(); rec.updatedAt = rec.ts; rec.v = SCHEMA; a.push(rec); return lwrite(a) ? rec.id : null; },
    removeLink(id) { return lwrite(lread().filter(r => r.id !== id)); },
  };
})();
