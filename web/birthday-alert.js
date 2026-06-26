/* 今日生日弹框提醒 —— 每天首次打开 App（任意主页面）只提醒一次
 * 逻辑：扫本机所有排盘记录的出生「月-日」，若有人「今天」过生日，弹一次友好提醒，鼓励送上问候。
 *   · 一天一次：localStorage hd_bday_alert 记当天日期，无论有无生日当天只处理一次（一次提醒即可）。
 *   · 纯本地、不依赖云：只读 HDStore.all() 的 input.month/day，不碰命局、不联网。
 *   · 三语：跟随 HDI18N.lang（en / zh-Hant / zh-Hans）。
 * 引入：index.html 与 history.html 各 <script src="birthday-alert.js"></script>（在 hd-store.js / i18n.js 之后）。
 */
(function () {
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  function run() {
    try {
      if (!window.HDStore || !HDStore.all) return;
      var I = window.HDI18N, lang = (I && I.lang) || 'zh-Hans';
      var t = function (zh, en, tw) { return lang === 'en' ? en : lang === 'zh-Hant' ? (tw || (I && I.s2t ? I.s2t(zh) : zh)) : zh; };

      var KEY = 'hd_bday_alert', today = todayKey();
      try { if (localStorage.getItem(KEY) === today) return; } catch (e) {}   // 当天已处理过

      var d = new Date(), mo = d.getMonth() + 1, da = d.getDate();
      var hits = HDStore.all().filter(function (r) { return r && r.input && +r.input.month === mo && +r.input.day === da; });

      try { localStorage.setItem(KEY, today); } catch (e) {}   // 标记当天已处理（无论有无生日，保证只提醒一次）
      if (!hits.length) return;

      showPopup(hits.map(function (r) {
        var nm = (r.name || '').trim() || t('未命名', 'Unnamed', '未命名');
        var self = (r.tags || []).indexOf('self') >= 0;
        return { name: nm, self: self };
      }), t);
    } catch (e) {}
  }

  function showPopup(people, t) {
    if (document.getElementById('bdayAlert')) return;
    var selfTxt = t('（本人）', ' (You)', '（本人）');
    var rows = people.map(function (p) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#FBF6EC;border:1px solid #ECE0CC;border-radius:10px;margin-top:8px">'
        + '<span style="font-size:18px">🎂</span>'
        + '<span style="font-weight:700;color:#3A3027">' + esc(p.name) + '</span>'
        + (p.self ? '<span style="font-size:12px;color:#B25B3E">' + esc(selfTxt) + '</span>' : '')
        + '</div>';
    }).join('');

    var title = people.length > 1
      ? t('今天有 ' + people.length + ' 位过生日 🎉', people.length + ' birthdays today 🎉', '今天有 ' + people.length + ' 位過生日 🎉')
      : t('今天有人过生日 🎉', 'A birthday today 🎉', '今天有人過生日 🎉');
    var sub = t('别忘了送上一句生日祝福～', 'Don’t forget to send your birthday wishes ♥', '別忘了送上一句生日祝福～');
    var ok = t('知道啦', 'Got it', '知道啦');

    var wrap = document.createElement('div');
    wrap.id = 'bdayAlert';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(40,32,24,.42);padding:20px;animation:bdayFade .18s ease';
    wrap.innerHTML =
      '<div style="width:100%;max-width:340px;background:#FFFDF8;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;font-family:inherit">'
      + '<div style="background:linear-gradient(135deg,#C0492E,#D98248);padding:20px 22px 16px;text-align:center;color:#fff">'
      + '<div style="font-size:32px;line-height:1">🎂</div>'
      + '<div style="font-size:17px;font-weight:800;margin-top:6px">' + esc(title) + '</div>'
      + '<div style="font-size:13px;opacity:.92;margin-top:4px">' + esc(sub) + '</div>'
      + '</div>'
      + '<div style="padding:14px 18px 4px">' + rows + '</div>'
      + '<div style="padding:14px 18px 18px"><button id="bdayOk" style="width:100%;padding:12px;border:0;border-radius:12px;background:#C0492E;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">' + esc(ok) + '</button></div>'
      + '</div>';
    if (!document.getElementById('bdayKf')) {
      var st = document.createElement('style'); st.id = 'bdayKf';
      st.textContent = '@keyframes bdayFade{from{opacity:0}to{opacity:1}}';
      document.head.appendChild(st);
    }
    var close = function () { try { wrap.remove(); } catch (e) {} };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', function onEsc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } });
    document.body.appendChild(wrap);
    var b = document.getElementById('bdayOk'); if (b) b.onclick = close;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // 给 hd-store / i18n 一点加载余量后再跑
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 450); });
  else setTimeout(run, 450);
})();
