/* i18n.js — 简体/繁體/English 三语（window.HDI18N）
   策略：页面源串=简体。繁体=字级转换（覆盖全站含知识库长文）；英文=界面词典精确匹配
   （专业术语本就英文为准，长文段落暂保留中文）。切换写 localStorage 后整页刷新。 */
(function () {
  const LS = 'hd_lang';
  const LANGS = [['zh-Hans', '简'], ['zh-Hant', '繁'], ['en', 'EN']];
  // 优先级：URL ?lang=（出图/分享指定语言）> localStorage > 默认 en
  const qlang = new URLSearchParams(location.search).get('lang');
  const lang = (['zh-Hans', 'zh-Hant', 'en'].includes(qlang) ? qlang : null) || localStorage.getItem(LS) || 'en';
  document.documentElement.lang = lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zh-TW' : 'zh-CN';

  // ── 简→繁 字表（按全站实际用字生成；咸/只/台/周/谷/系 等易错字有意不转）──
  const P = '专專业業东東两兩严嚴个個丰豐临臨为為举舉么麼义義乐樂习習乡鄉买買乱亂争爭产產亲親仅僅从從们們价價众眾优優会會传傳伦倫体體余餘侧側倾傾偿償兑兌关關养養内內写寫冲沖决決况況准準减減几幾则則创創别別剥剝办辦动動励勵区區华華单單卖賣厂廠历歷压壓厨廚参參双雙发發变變叠疊号號后後听聽启啟咙嚨响響唤喚围圍国國图圖圆圓场場块塊坚堅壮壯声聲处處复復够夠头頭学學实實宽寬对對寻尋导導将將尝嘗尽盡层層属屬岁歲师師带帶帮幫干乾并並广廣库庫应應开開异異强強归歸当當录錄怀懷态態总總恒恆恶惡悦悅惊驚惧懼愤憤愿願战戰户戶扩擴扰擾护護报報拥擁择擇挣掙损損换換据據数數断斷无無时時显顯晋晉机機权權条條来來极極构構枢樞标標树樹样樣桥橋检檢楼樓欢歡气氣汇匯沟溝没沒浅淺济濟浓濃涣渙涩澀淀澱渐漸温溫湿濕满滿潜潛灵靈点點炼煉热熱爱愛状狀独獨狭狹狮獅献獻环環现現电電画畫畅暢盖蓋盘盤着著矶磯础礎确確离離种種积積称稱稳穩竖豎签簽简簡类類纠糾红紅约約级級纯純纳納纵縱纽紐线線组組细細织織终終经經结結给給绝絕统統绪緒续續维維综綜编編缘緣缩縮网網联聯肾腎脉脈脑腦节節范範荐薦获獲虚虛蛊蠱蜕蛻衅釁补補装裝见見观觀视視览覽觉覺触觸计計订訂认認讨討让讓讲講许許论論讼訟设設证證评評识識词詞试試诚誠话話该該详詳说說请請诺諾读讀谁誰调調谈談谊誼谦謙谨謹贡貢责責败敗质質贯貫贲賁资資赋賦赶趕践踐车車轨軌转轉轮輪载載较較辅輔辑輯边邊达達过過迈邁运運这這进進远遠连連递遞逻邏遥遙采採里裡钥鑰钱錢链鏈锐銳错錯镜鏡长長门門闭閉问問间間闸閘阂閡阅閱阔闊阳陽阶階际際险險随隨隐隱难難静靜韵韻页頁顶頂项項顺順顿頓领領颐頤频頻题題颜顏饭飯饮飲饱飽饿餓马馬驯馴驱驅验驗骤驟鱼魚黄黃齐齊键鍵释釋荣榮亏虧夺奪愈癒尔爾迟遲钝鈍络絡寿壽忧憂虑慮';
  const M = {}; for (let i = 0; i < P.length; i += 2) M[P[i]] = P[i + 1];
  const s2t = s => s.replace(/[㐀-鿿]/g, c => M[c] || c);

  // ── 界面词典（简体精确串 → EN）──
  const EN = {
    '人类图排盘 · 观己': 'Human Design Chart · GuanJi', '人类图 · 知识库 · 观己': 'Human Design Knowledge Base · GuanJi',
    '命盘卡 · 观己': 'Chart Card · GuanJi', '· 人类图': '· Human Design', '· 人类图命盘': '· Human Design Chart',
    '命盘记录 · 观己': 'Saved Charts · GuanJi', '命盘记录': 'Saved Charts', '记录': 'Records',
    '盘主名字': 'Name', '如：张三 / Alex': 'e.g. Alex', '保存此盘': 'Save Chart', '✓ 已保存': '✓ Saved',
    '搜索：姓名 / 闸门号 / 类型 / 角色 / 通道…': 'Search: name / gate / type / profile / channel…',
    '全部': 'All', '★ 收藏': '★ Favorites', '收藏': 'Favorite', '打开': 'Open', '删除': 'Delete', '确定删除？': 'Delete this record?',
    '暂无记录，去排盘页生成并保存': 'No saved charts yet — generate one on the Chart page and save it',
    '反推': 'Rectify', '反推出生时间 · 观己': 'Birth Time Rectification · GuanJi', '反推出生时间': 'Birth Time Rectification',
    '只有人类图、没有出生时间？填入图上各行星的闸门(.爻线)——填得越多越准；至少需要 个性太阳。地球/南交点也可填（与太阳/北交点互为对宫，可作校验）。': 'Have a chart but no birth time? Enter each planet\'s gate(.line) — the more you fill, the tighter the result. Personality Sun is required. Earth/South Node are valid constraints too.',
    '闸门': 'Gate', '爻': 'Line', '起始年': 'From', '结束年': 'To', '显示时区 (IANA)': 'Display timezone (IANA)',
    '开始反推': 'Solve', '用中点出盘': 'Open chart', '至少填写：个性太阳的闸门': 'Required: Personality Sun gate',
    '无匹配：检查输入或放宽年份范围（爻线不确定就先留空）': 'No match — check inputs or widen the year range (leave uncertain lines blank)',
    '合盘': 'Composite', '合盘 · Penta · 观己': 'Connection & Penta · GuanJi', '· 合盘 · Penta': '· Connection & Penta',
    '合盘（2人）': 'Connection (2)', 'Penta（3-5人）': 'Penta (3–5)', '人 A（墨）': 'Person A (black)', '人 B（朱）': 'Person B (red)',
    '生成合盘': 'Build Connection', '生成 Penta': 'Build Penta', '请选择两个不同的人': 'Pick two different people', '请选择 3-5 人': 'Pick 3–5 people',
    '需要至少 2 条记录——先去「排盘」页生成并保存。': 'Need at least 2 saved records — generate & save charts first.',
    '合体定义中心': 'Defined together', '合体分裂数': 'Splits together', '成员': 'Members', '承载成员': 'Carried by', '暂无记录': 'No records yet',
    '两人之间没有形成任何通道连接。': 'No channels form between these two.',
    '双方皆有': 'Both', '金=通道完整 · 墨=半边 · 红字=缺口': 'Gold = complete · Ink = half · Red = gap',
    '排盘': 'Chart', '学习 · 知识库': 'Learn · Library', '知识库': 'Library', '— 示例盘 —': '— Samples —',
    '年': 'Year', '月': 'Month', '日': 'Day', '时': 'Hr', '分': 'Min',
    '出生地（决定时区）': 'Birth place (sets timezone)', '生成人类图': 'Generate Chart',
    '性别': 'Gender', '城市，如 上海 / Shanghai': 'City — e.g. Shanghai',
    '设计 Design（红）': 'Design (red)', '个性 Personality（黑）': 'Personality (black)',
    '自定义 IANA 时区（如 Asia/Shanghai）': 'Custom IANA timezone (e.g. Asia/Shanghai)',
    '时间微调 Time': 'Time', '高级：': 'Advanced:', 'Moshier(离线)': 'Moshier (offline)', 'JPL(高精)': 'JPL (precise)',
    '真交点': 'True Node', '平交点': 'Mean Node', '上海/北京/广州(中国)': 'Shanghai/Beijing (China)', '🇨🇳 中国 · 选省市区': '🇨🇳 China · region picker', '选择出生时间': 'Birth date & time', '选择出生地（中国）': 'Birth place (China)', '起始年': 'From year', '结束年': 'To year',
    '香港': 'Hong Kong', '台北': 'Taipei', '东京': 'Tokyo', '新加坡': 'Singapore', '曼谷': 'Bangkok', '伦敦': 'London',
    '巴黎': 'Paris', '纽约': 'New York', '洛杉矶': 'Los Angeles', '檀香山': 'Honolulu', '悉尼': 'Sydney', '— 自定义 IANA —': '— Custom IANA —',
    '类型': 'Type', '策略': 'Strategy', '内在权威': 'Inner Authority', '人生角色': 'Profile', '定义': 'Definition',
    '签名/非己': 'Signature / Not-Self', '已定义通道': 'Defined Channels', '设计 ⊙': 'Design ⊙', '个性 ⊙': 'Personality ⊙',
    '设计 ☉': 'Design ☉', '个性 ☉': 'Personality ☉', '设计 ☊': 'Design ☊', '个性 ☊': 'Personality ☊',
    '个性·墨(意识)': 'Personality · Black (Conscious)', '设计·朱(潜意识)': 'Design · Red (Unconscious)', '两者皆有': 'Both',
    '已定义中心': 'Defined Center', '你的解读 · 看懂自己': 'Your Reading', '观己 · 人类图命盘': 'GuanJi · Human Design Chart',
    // 枚举值
    '生产者': 'Generator', '显化生产者': 'Manifesting Generator', '显示者': 'Manifestor', '投射者': 'Projector', '反映者': 'Reflector',
    '等待，然后回应': 'Wait to Respond', '等待回应，再告知': 'Respond, then Inform', '行动前告知': 'Inform before Acting',
    '等待被邀请': 'Wait for the Invitation', '等待一个月亮周期': 'Wait a Lunar Cycle',
    '荐骨权威': 'Sacral Authority', '情绪权威': 'Emotional Authority', '直觉权威': 'Splenic Authority',
    '自我/意志力权威': 'Ego Authority', '自我投射权威': 'Self-Projected Authority', '心智/环境权威': 'Mental (Environment)', '月亮权威': 'Lunar Authority',
    '满足 / 挫败': 'Satisfaction / Frustration', '满足 / 挫败 / 愤怒': 'Satisfaction / Frustration / Anger',
    '平和 / 愤怒': 'Peace / Anger', '成功 / 苦涩': 'Success / Bitterness', '惊喜 / 失望': 'Surprise / Disappointment',
    '探究者': 'Investigator', '隐士': 'Hermit', '烈士': 'Martyr', '机会主义者': 'Opportunist', '异端者': 'Heretic', '人生导师': 'Role Model',
    '探究者 / 烈士': 'Investigator / Martyr', '探究者 / 机会主义者': 'Investigator / Opportunist',
    '隐士 / 机会主义者': 'Hermit / Opportunist', '隐士 / 异端者': 'Hermit / Heretic',
    '烈士 / 异端者': 'Martyr / Heretic', '烈士 / 人生导师': 'Martyr / Role Model',
    '机会主义者 / 人生导师': 'Opportunist / Role Model', '机会主义者 / 探究者': 'Opportunist / Investigator',
    '异端者 / 探究者': 'Heretic / Investigator', '异端者 / 隐士': 'Heretic / Hermit',
    '人生导师 / 隐士': 'Role Model / Hermit', '人生导师 / 烈士': 'Role Model / Martyr',
    '一分人(单一定义)': 'Single Definition', '二分人': 'Split Definition', '三分人': 'Triple Split', '四分人': 'Quadruple Split', '无定义': 'No Definition',
    // 知识库分类
    '内在权威 ': 'Inner Authority', '六爻': 'Six Lines', '九大中心': 'Nine Centers', '36通道': '36 Channels', '64闸门': '64 Gates', 'PHS 四箭头': 'PHS · Four Arrows',
    '搜索：类型 / 权威 / 闸门号或卦名 / 通道 / 中心…（如「41」「损」「情绪」「投射」）': 'Search: type / authority / gate / channel / center… (e.g. "41", "emotional")',
  };

  let cur = lang;
  function trText(n) {
    if (n.__l === cur) return;
    const p = n.parentElement; if (p && p.closest && p.closest('[data-noi18n]')) return; // 显式豁免区

    if (n.__s == null) n.__s = n.nodeValue;
    let out = n.__s;
    if (cur === 'zh-Hant') out = s2t(n.__s);
    else if (cur === 'en') { const t = n.__s.trim(); if (EN[t] != null) out = n.__s.replace(t, EN[t]); }
    n.__l = cur; n.__t = out;
    if (n.nodeValue !== out) n.nodeValue = out;
  }
  function trAttrs(el) {
    for (const a of ['placeholder', 'title']) {
      const v = el.getAttribute && el.getAttribute(a); if (!v) continue;
      if (cur === 'zh-Hant') el.setAttribute(a, s2t(v));
      else if (cur === 'en' && EN[v.trim()] != null) el.setAttribute(a, EN[v.trim()]);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1) return;
    trAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) trText(n);
    if (root.querySelectorAll) for (const el of root.querySelectorAll('[placeholder],[title]')) trAttrs(el);
  }

  function apply() {
    if (document.title && cur !== 'zh-Hans') document.title = cur === 'zh-Hant' ? s2t(document.title) : (EN[document.title.trim()] || document.title);
    walk(document.body);
  }

  // 动态渲染内容：增量翻译（出盘/知识库详情等 JS 注入的节点）
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') { const n = m.target; if (n.nodeValue === n.__t) continue; n.__s = n.nodeValue; n.__l = null; trText(n); }
      else for (const node of m.addedNodes) walk(node);
    }
  });

  // 语言切换胶囊（注入 header）
  function mountSwitch() {
    const head = document.querySelector('header'); if (!head) return;
    const st = document.createElement('style');
    st.textContent = '.langsw{display:inline-flex;gap:4px;margin-left:10px;vertical-align:middle}.langsw button{font-size:12px;padding:3px 10px;border:1px solid #D8CFC0;background:#fff;border-radius:999px;cursor:pointer;color:#8A7A5E}.langsw button.on{background:var(--li,#B3433A);color:#fff;border-color:transparent}';
    document.head.appendChild(st);
    const box = document.createElement('div'); box.className = 'langsw';
    for (const [code, label] of LANGS) {
      const b = document.createElement('button'); b.textContent = label; b.className = code === cur ? 'on' : '';
      b.onclick = () => { localStorage.setItem(LS, code); location.reload(); };
      box.appendChild(b);
    }
    head.appendChild(box);
  }

  function boot() { mountSwitch(); apply(); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.HDI18N = { lang: cur, s2t, EN };
})();
