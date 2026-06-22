/* hd-account.js — 人类图 云端账号 + 记录云同步（账号条 UI + 登录/注册/验证码 + 同步开关 + HDStore 胶水）
   依赖：nickpool.js(window.NICKPOOL) · hd-cloud.js(window.GC) · hd-store.js(window.HDStore)
   设计：加法为主——包裹 HDStore 的写操作触发同步，各页现有调用零改；本地优先、自愿开启。 */
(function () {
  if (!window.GC || !window.HDStore) return;
  var GC = window.GC, HD = window.HDStore;

  // —— i18n：账号 UI 三语（不依赖词典，直接出对应语言，避免 EN 下露中文 / 闪烁）——
  function T(zh, en, tw) { var g = (window.HDI18N && window.HDI18N.lang) || 'zh-Hans'; return g === 'en' ? en : (g === 'zh-Hant' ? (tw || zh) : zh); }
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;   // 基本邮箱格式校验，挡随手乱填
  var authMode = 'login';                      // 登录 / 注册 子模式
  var ADMIN = 'admin@zaiyuxingzhe.com';        // 会员续期联系（管理员）；改这里即可换

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(msg) {
    var t = document.createElement('div'); t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#3a3330;color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transition:opacity .2s;max-width:86%;text-align:center';
    document.body.appendChild(t); requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 250); }, 2600);
  }
  function rerender() { try { if (window.HDRerender) window.HDRerender(); } catch (e) {} }

  // —— 同步编排（防抖 + 拉回写本地 + 推本地较新）——
  var syncing = false, timer = null, applying = false;
  var pendingDel = [];   // 在途软删 Promise：fullSync 先等它们落库再 pull，避免删除被云端复活
  var tombstones = {};   // 本会话已软删的 id(charts cid / links lid)，pull 合并时兜底过滤(双保险)
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(fullSync, 1200); }
  function markDeleted(id, p) { if (id) tombstones[id] = 1; if (p && p.then) pendingDel.push(p.catch(function () {})); }
  function writeFailToast() { toast(T('本地写入失败（空间不足或隐私模式），请清理空间或先导出备份', 'Local save failed (storage full / private mode) — free up space or export a backup.', '本地寫入失敗（空間不足或隱私模式），請清理空間或先匯出備份')); }
  async function fullSync() {
    if (!GC.syncOn() || syncing) return; syncing = true;
    try {
      if (pendingDel.length) { try { await Promise.all(pendingDel.splice(0)); } catch (e) {} }   // 先等在途删除落库
      var res = await GC.fullSync(HD.all());
      if (res) {
        var merged = res.merged.filter(function (r) { return !tombstones[r.id]; });   // 兜底：不复活本会话已删
        if (res.downloaded || res.removed || merged.length !== res.merged.length) {
          applying = true; var okW = HD.replaceAll(merged); applying = false;
          if (okW === false) { writeFailToast(); rerender(); syncing = false; return; }   // 写失败不谎报成功
          rerender();
        }
        for (var i = 0; i < res.toPush.length; i++) { try { await GC.pushChart(res.toPush[i]); } catch (e) {} }
      }
      // 合盘 / Penta 链接同步（与排盘记录并行对账）
      var lres = (GC.fullSyncLinks && HD.linksAll) ? await GC.fullSyncLinks(HD.linksAll()) : null;
      if (lres) {
        var lmerged = lres.merged.filter(function (r) { return !tombstones[r.id]; });
        if (lres.downloaded || lres.removed || lmerged.length !== lres.merged.length) {
          applying = true; var okL = HD.replaceLinks(lmerged); applying = false;
          if (okL === false) { writeFailToast(); } else { rerender(); }
        }
        for (var j = 0; j < lres.toPush.length; j++) { try { await GC.pushLink(lres.toPush[j]); } catch (e) {} }
      }
      rerender();   // 徽标时序：对账后无条件刷新一次(纯上传 / 零下载场景也更新 ☁ 已上云徽标)
      var dn = (res ? res.downloaded : 0) + (lres ? lres.downloaded : 0);
      if (dn) toast(T('☁ 已从云端恢复 / 更新 ' + dn + ' 条', '☁ Restored / updated ' + dn + ' record(s) from cloud', '☁ 已從雲端恢復 / 更新 ' + dn + ' 條'));
    } catch (e) {
      if (e && e.status === 401) { try { GC.logout(); } catch (_) {} rerender(); toast(T('登录已过期，请重新登录', 'Session expired — please sign in again', '登入已過期，請重新登入')); }
    }
    syncing = false;
  }

  // —— 包裹 HDStore 写操作 → 自动同步（index/history/connect 各页现有调用零改）——
  ['add', 'remove', 'toggleFav', 'addLink', 'removeLink'].forEach(function (m) {
    var orig = HD[m]; if (typeof orig !== 'function') return;
    HD[m] = function () {
      var r = orig.apply(HD, arguments);
      if (!applying && GC.syncOn()) {
        if (m === 'remove') { try { markDeleted(arguments[0], GC.softDelete(arguments[0])); } catch (e) {} }
        else if (m === 'removeLink') { try { markDeleted(arguments[0], GC.softDeleteLink(arguments[0])); } catch (e) {} }
        schedule();
      }
      return r;
    };
  });

  // —— 账号条（容器 #hd-acct 存在才渲染；其它页无容器则只跑同步胶水）——
  function bar() {
    var el = document.getElementById('hd-acct'); if (!el) return;
    if (GC.loggedIn()) {
      var u = GC.user();
      var sub = (GC.syncOn() ? T('云同步已开', 'Cloud sync on', '雲同步已開') : T('仅本机', 'Local only', '僅本機')) + (GC.verified() ? '' : ' · ' + T('未验证', 'unverified', '未驗證'));
      el.innerHTML = '<span class="ha-ic">☁</span><span class="ha-tx"><b>' + esc(GC.nick()) + '</b><i>' + esc(u.email) + ' · ' + sub + '</i></span><span class="ha-go">' + T('账号 ›', 'Account ›', '帳號 ›') + '</span>';
    } else {
      el.innerHTML = '<span class="ha-ic">☁</span><span class="ha-tx"><b>' + T('登录 / 注册', 'Sign in / Sign up', '登入 / 註冊') + '</b><i>' + T('开启云端备份，换设备也能恢复记录', 'Enable cloud backup — restore records on any device', '開啟雲端備份，換裝置也能恢復記錄') + '</i></span><span class="ha-go">›</span>';
    }
    el.onclick = panel;
  }

  function panel() {
    var box = document.getElementById('hd-acct-modal');
    if (!box) { box = document.createElement('div'); box.id = 'hd-acct-modal'; document.body.appendChild(box); }
    box.className = 'ha-modal';
    box.innerHTML = '<div class="ha-card">' + cardBody() + '</div>';
    box.onclick = function (e) { if (e.target === box) close(); };
  }
  function close() { var b = document.getElementById('hd-acct-modal'); if (b) b.remove(); }

  function cardBody() {
    if (GC.loggedIn()) {
      var u = GC.user(), vr = GC.verified(), dl = GC.defaultLang(), em = GC.emailOn(), mb = GC.membership();
      var renewLink = ' <a class="ha-link" href="mailto:' + ADMIN + '?subject=' + encodeURIComponent(T('观己会员续期', 'GuanJi membership renewal', '觀己會員續期')) + '">' + T('联系续期', 'Renew', '聯絡續期') + '</a>';
      var paid = (mb.tier !== 'free');
      var tn = (mb.tier === 'vip' ? 'VIP' : mb.tier === 'pro' ? 'Pro' : mb.tier);
      var endDate = mb.activeTo ? String(mb.activeTo).slice(0, 10) : '';
      // 会员行：始终透明显示档位 + 有效期(即使还很久也显示) + 剩余天数
      var memHtml;
      if (!paid) memHtml = '<i style="font-style:normal;color:#6B5B43">' + T('免费版', 'Free', '免費版') + '</i>';
      else if (mb.expired) memHtml = '<i style="font-style:normal;color:#c0392b">' + tn + ' · ' + T('已过期', 'expired', '已過期') + (endDate ? '（' + endDate + '）' : '') + '</i>';
      else {
        var leftTxt = (mb.daysLeft != null) ? ' · ' + T('剩 ' + mb.daysLeft + ' 天', mb.daysLeft + ' days left', '剩 ' + mb.daysLeft + ' 天') : '';
        var col = (mb.daysLeft != null && mb.daysLeft <= 30) ? '#C77B30' : '#3a7d44';
        memHtml = '<i style="font-style:normal;color:' + col + '">' + tn + (endDate ? ' · ' + T('有效期至 ' + endDate, 'valid until ' + endDate, '有效期至 ' + endDate) : '') + leftTxt + '</i>';
      }
      // 临期/过期提醒横幅：付费档 ≤30天 或 已过期 时醒目展示，按 30→15→当天→已过期 升级配色
      var memNotice = '';
      if (paid && (mb.expired || (mb.daysLeft != null && mb.daysLeft <= 30))) {
        var lvl, icon, msg;
        if (mb.expired) { lvl = 'exp'; icon = '⚠️'; msg = T('您的会员已于 ' + endDate + ' 到期，当前已按免费版计。续期后即可恢复会员权益。', 'Your membership expired on ' + endDate + ' — you are now on the Free plan. Renew to restore your benefits.', '您的會員已於 ' + endDate + ' 到期，目前已按免費版計。續期後即可恢復會員權益。'); }
        else if (mb.daysLeft <= 0) { lvl = 'exp'; icon = '⏳'; msg = T('您的会员今天到期。如需继续，请联系管理员续期。', 'Your membership expires today. Please contact the admin to renew.', '您的會員今天到期。如需繼續，請聯絡管理員續期。'); }
        else if (mb.daysLeft <= 15) { lvl = 'soon'; icon = '⏳'; msg = T('您的会员将于 ' + endDate + ' 到期，仅剩 ' + mb.daysLeft + ' 天，建议尽快续期。', 'Your membership expires on ' + endDate + ' — only ' + mb.daysLeft + ' days left. We recommend renewing soon.', '您的會員將於 ' + endDate + ' 到期，僅剩 ' + mb.daysLeft + ' 天，建議盡快續期。'); }
        else { lvl = 'warn'; icon = '🔔'; msg = T('您的会员将于 ' + endDate + ' 到期（剩 ' + mb.daysLeft + ' 天），可提前联系管理员续期。', 'Your membership expires on ' + endDate + ' (' + mb.daysLeft + ' days left). You can renew early via the admin.', '您的會員將於 ' + endDate + ' 到期（剩 ' + mb.daysLeft + ' 天），可提前聯絡管理員續期。'); }
        memNotice = '<div class="ha-mem ' + lvl + '"><span class="ha-mem-i">' + icon + '</span><div>' + msg + renewLink + '</div></div>';
      }
      var syncSub = GC.syncOn() ? T('已开 · 记录自动备份、跨设备恢复', 'On · auto backup & cross-device restore', '已開 · 記錄自動備份、跨裝置恢復')
        : (vr ? T('已关 · 仅存本机', 'Off · local only', '已關 · 僅存本機') : T('需先完成邮箱验证才能开启', 'Verify your email to enable', '需先完成信箱驗證才能開啟'));
      var vrow = vr
        ? '<i style="color:#3a7d44;font-style:normal">' + T('已验证 ✓', 'Verified ✓', '已驗證 ✓') + '</i>'
        : '<i style="color:#c0392b;font-style:normal">' + T('未验证', 'Not verified', '未驗證') + '</i> <button class="ha-link" data-act="resend">' + T('重发邮件', 'Resend', '重發郵件') + '</button> <button class="ha-link" data-act="recheck">' + T('我已验证', "I've verified", '我已驗證') + '</button>';
      return '<div class="ha-h">' + T('账号 · 云端备份', 'Account · Cloud backup', '帳號 · 雲端備份') + '<button class="ha-x" data-act="close">✕</button></div>'
        + memNotice
        + '<div class="ha-row"><span>' + T('昵称', 'Nickname', '暱稱') + '</span><b>' + esc(GC.nick()) + '</b><button class="ha-link" data-act="nick">' + T('改', 'Edit', '改') + '</button></div>'
        + '<div class="ha-row"><span>' + T('邮箱', 'Email', '信箱') + '</span><b>' + esc(u.email) + '</b></div>'
        + '<div class="ha-row"><span>' + T('邮箱验证', 'Email verify', '信箱驗證') + '</span><b>' + vrow + '</b></div>'
        + '<div class="ha-row"><span>' + T('会员', 'Membership', '會員') + '</span><b>' + memHtml + '</b></div>'
        + '<div class="ha-row"><span>' + T('默认语言', 'Default language', '預設語言') + '</span><b><button class="ha-pick' + (dl === 'zh' ? ' on' : '') + '" data-act="lang-zh">中文</button><button class="ha-pick' + (dl === 'en' ? ' on' : '') + '" data-act="lang-en">English</button></b></div>'
        + '<div class="ha-sync"><div><b>' + T('云端同步', 'Cloud sync', '雲端同步') + '</b><i>' + syncSub + '</i></div><button class="ha-toggle' + (GC.syncOn() ? ' on' : '') + (vr ? '' : ' off-disabled') + '" data-act="sync" aria-label="sync"><span></span></button></div>'
        + '<div class="ha-sync"><div><b>' + T('系统邮件', 'System emails', '系統郵件') + '</b><i>' + (em ? T('已开 · 生日/周年祝福、重要通知', 'On · birthday & anniversary blessings, key notices', '已開 · 生日/週年祝福、重要通知') : T('已关 · 不再发送系统邮件', 'Off · no system emails', '已關 · 不再發送系統郵件')) + '</i></div><button class="ha-toggle' + (em ? ' on' : '') + '" data-act="emailtoggle" aria-label="email"><span></span></button></div>'
        + '<p class="ha-note">' + T('开启同步即同意将「邮箱 + 排盘记录」加密存于服务器，用于备份与跨设备恢复，仅你本人可见，可随时关闭或注销。', 'Enabling sync stores your email + chart records encrypted on the server for backup and cross-device restore — visible only to you, turn off or delete anytime.', '開啟同步即同意將「信箱 + 排盤記錄」加密存於伺服器，用於備份與跨裝置恢復，僅你本人可見，可隨時關閉或登出。')
        + ' ' + T('提供邮箱即表示同意接收观己的定期系统邮件（生日 / 周年祝福、重要通知）；不想接收可随时关闭上方「系统邮件」开关。', 'By providing your email you agree to receive periodic GuanJi emails (birthday & anniversary blessings, key notices); turn off "System emails" above anytime.', '提供信箱即表示同意接收觀己的定期系統郵件（生日 / 週年祝福、重要通知）；不想接收可隨時關閉上方「系統郵件」開關。') + '</p>'
        + '<button class="ha-btn ghost" data-act="logout">' + T('退出登录', 'Log out', '登出') + '</button>';
    }
    var reg = authMode === 'register';
    return '<div class="ha-h">' + (reg ? T('注册', 'Sign up', '註冊') : T('登录', 'Sign in', '登入')) + '<button class="ha-x" data-act="close">✕</button></div>'
      + '<div class="ha-tabs"><button class="ha-tab' + (reg ? '' : ' on') + '" data-act="mode-login">' + T('登录', 'Sign in', '登入') + '</button><button class="ha-tab' + (reg ? ' on' : '') + '" data-act="mode-register">' + T('注册', 'Sign up', '註冊') + '</button></div>'
      + '<input id="ha-email" class="ha-in" type="email" placeholder="' + T('邮箱', 'Email', '信箱') + '" autocomplete="username" inputmode="email">'
      + (reg ? '<input id="ha-nick" class="ha-in" type="text" maxlength="30" placeholder="' + T('昵称（选填，留空自动取雅号）', 'Nickname (optional — auto-assigned if blank)', '暱稱（選填，留空自動取雅號）') + '">' : '')
      + '<input id="ha-pass" class="ha-in" type="password" placeholder="' + T('密码（至少 8 位）', 'Password (min 8)', '密碼（至少 8 位）') + '" autocomplete="' + (reg ? 'new-password' : 'current-password') + '">'
      + (reg ? '<input id="ha-pass2" class="ha-in" type="password" placeholder="' + T('再次输入密码', 'Confirm password', '再次輸入密碼') + '" autocomplete="new-password">' : '')
      + (reg ? '<label class="ha-chk"><input type="checkbox" id="ha-agree"><span>' + T('我已阅读并同意', 'I have read and agree to the', '我已閱讀並同意') + ' <a href="terms.html" target="_blank" rel="noopener">' + T('《用户协议》与《隐私政策》', 'Terms & Privacy Policy', '《使用者協議》與《隱私政策》') + '</a></span></label>' : '')
      + '<button class="ha-btn" data-act="' + (reg ? 'register' : 'login') + '" style="width:100%">' + (reg ? T('注册', 'Create account', '註冊') : T('登录', 'Sign in', '登入')) + '</button>'
      + '<div class="ha-or"><span>' + T('或', 'or', '或') + '</span></div>'
      + '<div id="ha-otp"><button class="ha-link" data-act="otp">' + T('用邮箱验证码登录（免密码）', 'Sign in with email code (no password)', '用信箱驗證碼登入（免密碼）') + '</button></div>'
      + '<p class="ha-note">' + (reg
        ? T('注册后请到邮箱完成验证，验证通过才能开启云同步。默认仅存本机。', 'After signing up, verify via the email we send — cloud sync unlocks only after verification. Local-only by default.', '註冊後請到信箱完成驗證，驗證通過才能開啟雲同步。預設僅存本機。')
        : T('开启云端备份后，换设备 / 清缓存也能恢复排盘记录。默认仅存本机，登录并开启同步才上云。', 'With cloud backup on, restore records after switching devices or clearing cache. Local-only by default.', '開啟雲端備份後，換裝置 / 清快取也能恢復排盤記錄。預設僅存本機，登入並開啟同步才上雲。') + ' <a href="terms.html" target="_blank" rel="noopener" style="color:#6B5B43;text-decoration:underline">' + T('《用户协议与隐私》', 'Terms & Privacy', '《使用者協議與隱私》') + '</a>')
        + '</p>';
  }

  // 开启云同步前的「敏感个人信息 + 跨境存储」单独同意（PIPL）。本机记一次，已同意则静默放行。
  function ensureXBorderConsent() {
    try { if (localStorage.getItem('gc_xb_consent') === '1') return true; } catch (e) {}
    var ok = confirm(T(
      '开启云同步将把你的「邮箱 + 排盘记录（含出生日期 / 时间 / 地点等敏感个人信息）」加密上传并存储于境外（新加坡，接收方 Fly.io / Cloudflare）服务器，用于备份与跨设备恢复。此为单独同意项，你可随时关闭，或邮件申请删除。确定开启？',
      'Enabling cloud sync uploads and stores your email + chart records (including sensitive birth date/time/place) encrypted on overseas servers (Singapore; recipients Fly.io / Cloudflare) for backup and cross-device restore. This is a separate consent — you can turn it off anytime, or email us to delete. Enable now?',
      '開啟雲同步將把你的「信箱 + 排盤記錄（含出生日期 / 時間 / 地點等敏感個人資料）」加密上傳並儲存於境外（新加坡，接收方 Fly.io / Cloudflare）伺服器，用於備份與跨裝置恢復。此為單獨同意項，你可隨時關閉，或郵件申請刪除。確定開啟？'));
    if (ok) { try { localStorage.setItem('gc_xb_consent', '1'); } catch (e) {} }
    return ok;
  }

  // —— 事件委托 ——
  document.addEventListener('click', async function (e) {
    var hit = e.target.closest('[data-act]'); if (!hit || !document.getElementById('hd-acct-modal')) return;
    var a = hit.getAttribute('data-act');
    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    try {
      if (a === 'close') return close();
      else if (a === 'mode-login') { authMode = 'login'; return panel(); }
      else if (a === 'mode-register') { authMode = 'register'; return panel(); }
      else if (a === 'login') {
        var e1 = val('ha-email'), p1 = val('ha-pass');
        if (!EMAIL.test(e1)) return toast(T('请输入有效邮箱', 'Enter a valid email', '請輸入有效信箱'));
        if (!p1) return toast(T('请输入密码', 'Enter your password', '請輸入密碼'));
        await GC.login(e1, p1);
        if (GC.verified() && ensureXBorderConsent()) GC.setSync(true);   // 已验证 + 单独同意 才自动开同步
        toast(T('已登录', 'Signed in', '已登入')); panel(); bar(); if (GC.syncOn()) fullSync();
      }
      else if (a === 'register') {
        var e2 = val('ha-email'), p2 = val('ha-pass'), p2b = val('ha-pass2'), nk = val('ha-nick');
        if (!EMAIL.test(e2)) return toast(T('请输入有效邮箱', 'Enter a valid email', '請輸入有效信箱'));
        if (p2.length < 8) return toast(T('密码至少 8 位', 'Password needs 8+ characters', '密碼至少 8 位'));
        if (p2 !== p2b) return toast(T('两次密码不一致', 'Passwords do not match', '兩次密碼不一致'));
        var agree = document.getElementById('ha-agree');
        if (!agree || !agree.checked) return toast(T('请先勾选同意《用户协议》与《隐私政策》', 'Please check the box to agree to the Terms & Privacy Policy', '請先勾選同意《使用者協議》與《隱私政策》'));
        await GC.register(e2, p2, nk);
        if (nk) { try { await GC.setNickname(nk); } catch (e) {} }
        GC.setSync(false);                                // 关键：注册不自动开同步，验证后才能开
        toast(T('注册成功 · 验证邮件已发，请到邮箱完成验证后再开启云同步', 'Account created · check your email to verify, then enable cloud sync', '註冊成功 · 驗證郵件已發，請到信箱完成驗證後再開啟雲同步'));
        panel(); bar();
      }
      else if (a === 'otp') { var e3 = val('ha-email'); if (!EMAIL.test(e3)) return toast(T('请先填有效邮箱', 'Enter a valid email first', '請先填有效信箱')); window._hdOtp = await GC.requestOTP(e3); document.getElementById('ha-otp').innerHTML = '<input id="ha-code" class="ha-in" type="text" inputmode="numeric" placeholder="' + T('输入邮箱收到的验证码', 'Enter the code from your email', '輸入信箱收到的驗證碼') + '"><label class="ha-chk"><input type="checkbox" id="ha-agree-otp"><span>' + T('我已阅读并同意', 'I have read and agree to the', '我已閱讀並同意') + ' <a href="terms.html" target="_blank" rel="noopener">' + T('《用户协议》与《隐私政策》', 'Terms & Privacy Policy', '《使用者協議》與《隱私政策》') + '</a></span></label><button class="ha-btn" data-act="otplogin" style="width:100%">' + T('验证码登录', 'Sign in with code', '驗證碼登入') + '</button>'; toast(T('验证码已发到邮箱', 'Code sent to your email', '驗證碼已發到信箱')); }
      else if (a === 'otplogin') { var c = val('ha-code'); if (!c || !window._hdOtp) return toast(T('请输入验证码', 'Enter the code', '請輸入驗證碼')); var ag = document.getElementById('ha-agree-otp'); if (!ag || !ag.checked) return toast(T('请先勾选同意《用户协议》与《隐私政策》', 'Please check the box to agree to the Terms & Privacy Policy', '請先勾選同意《使用者協議》與《隱私政策》')); await GC.loginOTP(window._hdOtp, c); if (ensureXBorderConsent()) GC.setSync(true); toast(T('已登录', 'Signed in', '已登入')); panel(); bar(); if (GC.syncOn()) fullSync(); }
      else if (a === 'sync') {
        if (!GC.syncOn()) {                               // 想开同步：先确保已验证邮箱
          if (!GC.verified()) { try { await GC.refresh(); } catch (e) {} }
          if (!GC.verified()) { panel(); bar(); return toast(T('请先完成邮箱验证，再开启云同步', 'Verify your email before enabling cloud sync', '請先完成信箱驗證，再開啟雲同步')); }
          if (!ensureXBorderConsent()) { panel(); bar(); return; }
          GC.setSync(true); panel(); bar(); fullSync();
        } else { GC.setSync(false); panel(); bar(); toast(T('已关闭云同步（记录仍在本机）', 'Cloud sync off (records stay on this device)', '已關閉雲同步（記錄仍在本機）')); }
      }
      else if (a === 'resend') { var u = GC.user(); if (u) { await GC.requestVerify(u.email); toast(T('验证邮件已重发', 'Verification email resent', '驗證郵件已重發')); } }
      else if (a === 'recheck') { await GC.refresh(); panel(); bar(); toast(GC.verified() ? T('邮箱已验证 ✓', 'Email verified ✓', '信箱已驗證 ✓') : T('尚未验证，请点邮件中的链接', 'Not verified yet — click the link in the email', '尚未驗證，請點郵件中的連結')); }
      else if (a === 'lang-zh') { await GC.setDefaultLang('zh'); try { if ((window.HDI18N && window.HDI18N.lang) === 'en') { localStorage.setItem('hd_lang', 'zh-Hans'); return location.reload(); } } catch (e) {} panel(); bar(); toast('默认语言：中文'); }
      else if (a === 'lang-en') { await GC.setDefaultLang('en'); try { if ((window.HDI18N && window.HDI18N.lang) !== 'en') { localStorage.setItem('hd_lang', 'en'); return location.reload(); } } catch (e) {} panel(); bar(); toast('Default language: English'); }
      else if (a === 'emailtoggle') { var enx = !GC.emailOn(); await GC.setEmailOn(enx); panel(); toast(enx ? T('已开启系统邮件', 'System emails on', '已開啟系統郵件') : T('已关闭系统邮件（生日/周年祝福等将不再发送）', 'System emails off (no more blessings or notices)', '已關閉系統郵件（生日/週年祝福等將不再發送）')); }
      else if (a === 'nick') { var cur = GC.nick(); var nv = prompt(T('改昵称（留空恢复系统雅号）', 'Edit nickname (blank = system name)', '改暱稱（留空恢復系統雅號）'), cur); if (nv != null) { await GC.setNickname(nv.trim()); panel(); bar(); } }
      else if (a === 'logout') { if (!confirm(T('确定退出登录？退出后此设备不再自动同步。', 'Log out? This device will stop auto-syncing.', '確定登出？登出後此裝置不再自動同步。'))) return; GC.setSync(false); GC.logout(); toast(T('已退出', 'Logged out', '已登出')); panel(); bar(); }
    } catch (err) { toast(err && err.offline ? T('网络不可达，请检查网络', 'Network unreachable — check your connection', '網路不可達，請檢查網路') : (T('操作失败：', 'Failed: ', '操作失敗：') + (err && err.message || ''))); }
  });

  // —— 样式（HD 色系）——
  var css = document.createElement('style');
  css.textContent = '#hd-acct{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #EDE4D4;border-radius:12px;padding:11px 14px;margin:10px 0 0;cursor:pointer}'
    + '#hd-acct .ha-ic{font-size:18px;color:#6B5B43}#hd-acct .ha-tx{flex:1;min-width:0}#hd-acct .ha-tx b{display:block;font-size:14px;color:#3a3330}#hd-acct .ha-tx i{font-style:normal;font-size:12px;color:#9b948a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}#hd-acct .ha-go{font-size:12px;color:#9b948a;flex:none}'
    + '.ha-modal{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:9998;padding:18px}'
    + '.ha-card{background:#FCFAF4;border-radius:16px;padding:20px 18px;width:100%;max-width:360px;max-height:86vh;overflow:auto;box-sizing:border-box}'
    + '.ha-h{font-size:16px;font-weight:700;color:#3a3330;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}'
    + '.ha-x{border:none;background:none;font-size:18px;color:#9b948a;cursor:pointer;line-height:1}'
    + '.ha-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #EDE4D4;font-size:14px}.ha-row>span{color:#9b948a;min-width:60px;flex:none}.ha-row>b{flex:1;color:#3a3330;display:flex;align-items:center;gap:8px;font-weight:600}'
    + '.ha-link{border:none;background:none;color:#6B5B43;text-decoration:underline;font-size:13px;cursor:pointer;padding:0}'
    + '.ha-in{width:100%;padding:11px 13px;margin-bottom:10px;border:1px solid #EDE4D4;border-radius:10px;background:#fff;font-size:14px;box-sizing:border-box;font-family:inherit}'
    + '.ha-btns{display:flex;gap:8px}.ha-btn{flex:1;padding:11px;border:none;border-radius:10px;background:#6B5B43;color:#fff;font-size:14px;cursor:pointer;font-family:inherit}.ha-btn.ghost{background:#fff;color:#6B5B43;border:1px solid #D8CFC0}'
    + '.ha-or{text-align:center;color:#C9BEA9;font-size:12px;margin:12px 0;border-top:1px solid #EDE4D4;line-height:0}.ha-or span{background:#FCFAF4;padding:0 10px;position:relative;top:-6px}'
    + '.ha-sync{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px}.ha-sync b{font-size:14px;color:#3a3330}.ha-sync i{display:block;font-style:normal;font-size:12px;color:#9b948a;margin-top:2px}'
    + '.ha-toggle{width:44px;height:26px;border-radius:13px;border:none;background:#D8CFC0;position:relative;cursor:pointer;flex:none}.ha-toggle.on{background:#6B5B43}.ha-toggle span{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}.ha-toggle.on span{left:21px}'
    + '.ha-chk{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:#6B5B43;line-height:1.5;margin:2px 0 12px;cursor:pointer}.ha-chk input{margin-top:1px;flex:none;width:16px;height:16px;accent-color:#6B5B43}.ha-chk a{color:#6B5B43;text-decoration:underline}'
    + '.ha-note{font-size:12px;color:#9b948a;line-height:1.6;margin:12px 0 0}'
    + '.ha-mem{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.55;margin:0 0 14px}.ha-mem-i{flex:none;font-size:15px;line-height:1.45}.ha-mem.warn{background:#FBF3E2;color:#8A6516;border:1px solid #F0E0BC}.ha-mem.soon{background:#FBEAD9;color:#9A4F12;border:1px solid #F1CFA8}.ha-mem.exp{background:#FBE6E3;color:#A3271B;border:1px solid #F0C2BB}.ha-mem a.ha-link{color:inherit;font-weight:700}'
    + '.ha-tabs{display:flex;gap:6px;margin-bottom:12px}.ha-tab{flex:1;padding:8px;border:1px solid #D8CFC0;border-radius:10px;background:#fff;color:#8A7A5E;font-size:14px;cursor:pointer;font-family:inherit}.ha-tab.on{background:#6B5B43;color:#fff;border-color:transparent;font-weight:600}'
    + '.ha-toggle.off-disabled{opacity:.4;cursor:not-allowed}'
    + '.ha-pick{border:1px solid #D8CFC0;background:#fff;color:#8A7A5E;border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer;font-family:inherit;margin-left:6px}.ha-pick.on{background:#6B5B43;color:#fff;border-color:transparent;font-weight:600}';
  document.head.appendChild(css);

  // —— 启动：渲染账号条 + 已登录则刷新并同步 ——
  function boot() { bar(); if (GC.loggedIn()) { GC.refresh().then(function () { bar(); fullSync(); }); } }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
