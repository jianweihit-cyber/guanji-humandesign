/* hd-account.js — 人类图 云端账号 + 记录云同步（账号条 UI + 登录/注册/验证码 + 同步开关 + HDStore 胶水）
   依赖：nickpool.js(window.NICKPOOL) · hd-cloud.js(window.GC) · hd-store.js(window.HDStore)
   设计：加法为主——包裹 HDStore 的写操作触发同步，各页现有调用零改；本地优先、自愿开启。 */
(function () {
  if (!window.GC || !window.HDStore) return;
  var GC = window.GC, HD = window.HDStore;

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
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(fullSync, 1200); }
  async function fullSync() {
    if (!GC.syncOn() || syncing) return; syncing = true;
    try {
      var res = await GC.fullSync(HD.all());
      if (res) {
        if (res.downloaded || res.removed) { applying = true; try { HD.replaceAll(res.merged); } finally { applying = false; } rerender(); }
        for (var i = 0; i < res.toPush.length; i++) { try { await GC.pushChart(res.toPush[i]); } catch (e) {} }
        if (res.downloaded) toast('☁ 已从云端恢复 / 更新 ' + res.downloaded + ' 条');
      }
    } catch (e) {}
    syncing = false;
  }

  // —— 包裹 HDStore 写操作 → 自动同步（index/history/connect 各页现有调用零改）——
  ['add', 'remove', 'toggleFav', 'addLink', 'removeLink'].forEach(function (m) {
    var orig = HD[m]; if (typeof orig !== 'function') return;
    HD[m] = function () {
      var r = orig.apply(HD, arguments);
      if (!applying && GC.syncOn()) {
        if (m === 'remove') { try { GC.softDelete(arguments[0]); } catch (e) {} }
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
      el.innerHTML = '<span class="ha-ic">☁</span><span class="ha-tx"><b>' + esc(GC.nick()) + '</b><i>' + esc(u.email) + ' · ' + (GC.syncOn() ? '云同步已开' : '仅本机') + (GC.verified() ? '' : ' · 未验证') + '</i></span><span class="ha-go">账号 ›</span>';
    } else {
      el.innerHTML = '<span class="ha-ic">☁</span><span class="ha-tx"><b>登录 / 注册</b><i>开启云端备份，换设备也能恢复记录</i></span><span class="ha-go">›</span>';
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
      var u = GC.user();
      return '<div class="ha-h">账号 · 云端备份<button class="ha-x" data-act="close">✕</button></div>'
        + '<div class="ha-row"><span>昵称</span><b>' + esc(GC.nick()) + '</b><button class="ha-link" data-act="nick">改</button></div>'
        + '<div class="ha-row"><span>邮箱</span><b>' + esc(u.email) + '</b></div>'
        + '<div class="ha-row"><span>邮箱验证</span><b>' + (u.verified ? '<i style="color:#3a7d44;font-style:normal">已验证 ✓</i>' : '<i style="color:#9b948a;font-style:normal">未验证</i> <button class="ha-link" data-act="resend">重发</button>') + '</b></div>'
        + '<div class="ha-sync"><div><b>云端同步</b><i>' + (GC.syncOn() ? '已开 · 记录自动备份、跨设备恢复' : '已关 · 仅存本机') + '</i></div><button class="ha-toggle' + (GC.syncOn() ? ' on' : '') + '" data-act="sync" aria-label="云同步开关"><span></span></button></div>'
        + '<p class="ha-note">开启即同意将「邮箱 + 命盘记录」加密存于服务器，用于备份与跨设备恢复。仅你本人可见，可随时关闭或注销。</p>'
        + '<button class="ha-btn ghost" data-act="logout">退出登录</button>';
    }
    return '<div class="ha-h">登录 / 注册<button class="ha-x" data-act="close">✕</button></div>'
      + '<input id="ha-email" class="ha-in" type="email" placeholder="邮箱" autocomplete="username" inputmode="email">'
      + '<input id="ha-pass" class="ha-in" type="password" placeholder="密码（至少 8 位）" autocomplete="current-password">'
      + '<div class="ha-btns"><button class="ha-btn" data-act="login">登录</button><button class="ha-btn ghost" data-act="register">注册</button></div>'
      + '<div class="ha-or"><span>或</span></div>'
      + '<div id="ha-otp"><button class="ha-link" data-act="otp">用邮箱验证码登录（免密码）</button></div>'
      + '<p class="ha-note">开启云端备份后，换设备 / 清缓存也能恢复命盘记录。默认仅存本机，登录并开启同步才上云。</p>';
  }

  // —— 事件委托 ——
  document.addEventListener('click', async function (e) {
    var hit = e.target.closest('[data-act]'); if (!hit || !document.getElementById('hd-acct-modal')) return;
    var a = hit.getAttribute('data-act');
    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    try {
      if (a === 'close') return close();
      if (a === 'login') { var e1 = val('ha-email'), p1 = val('ha-pass'); if (!e1 || !p1) return toast('请填邮箱和密码'); await GC.login(e1, p1); GC.setSync(true); toast('已登录'); panel(); bar(); fullSync(); }
      else if (a === 'register') { var e2 = val('ha-email'), p2 = val('ha-pass'); if (!e2 || p2.length < 8) return toast('邮箱必填，密码至少 8 位'); await GC.register(e2, p2); GC.setSync(true); toast('注册成功，已登录（验证邮件已发）'); panel(); bar(); fullSync(); }
      else if (a === 'otp') { var e3 = val('ha-email'); if (!e3) return toast('请先填邮箱'); window._hdOtp = await GC.requestOTP(e3); document.getElementById('ha-otp').innerHTML = '<input id="ha-code" class="ha-in" type="text" inputmode="numeric" placeholder="输入邮箱收到的验证码"><button class="ha-btn" data-act="otplogin" style="width:100%">验证码登录</button>'; toast('验证码已发到邮箱'); }
      else if (a === 'otplogin') { var c = val('ha-code'); if (!c || !window._hdOtp) return toast('请输入验证码'); await GC.loginOTP(window._hdOtp, c); GC.setSync(true); toast('已登录'); panel(); bar(); fullSync(); }
      else if (a === 'sync') { var on = !GC.syncOn(); GC.setSync(on); panel(); bar(); if (on) fullSync(); else toast('已关闭云同步（记录仍在本机）'); }
      else if (a === 'resend') { var u = GC.user(); if (u) { await GC.requestVerify(u.email); toast('验证邮件已重发'); } }
      else if (a === 'nick') { var cur = GC.nick(); var nv = prompt('改昵称（默认是系统赠的雅号，可自定）', cur); if (nv != null) { await GC.setNickname(nv.trim()); panel(); bar(); } }
      else if (a === 'logout') { GC.setSync(false); GC.logout(); toast('已退出'); panel(); bar(); }
    } catch (err) { toast(err && err.offline ? '网络不可达，请检查网络' : ('操作失败：' + (err && err.message || ''))); }
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
    + '.ha-note{font-size:12px;color:#9b948a;line-height:1.6;margin:12px 0 0}';
  document.head.appendChild(css);

  // —— 启动：渲染账号条 + 已登录则刷新并同步 ——
  function boot() { bar(); if (GC.loggedIn()) { GC.refresh().then(function () { bar(); fullSync(); }); } }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
