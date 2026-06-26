/* theme.js — 主题/背景切换：6 套配色，做成「语言切换同一行的彩色圈圈」，点圈即切换
 * 应用方式：html[data-theme]（hd.css 各主题块覆盖 chrome 变量；盘面语义色不变）。
 * 首屏防闪：各页 <head> foucguard 内联脚本已先读 hd_theme 应用 data-theme，本文件只管 UI。
 * 圈圈插入到 i18n.js 注入的 .langsw（语言胶囊）里，与 简/繁/EN 同排；找不到则兜底浮于右下角。
 * 引入：各页 <script src="theme.js" defer></script>。
 */
(function () {
  var THEMES = [
    { k: '', zh: '离卦·暖', en: 'Warm', tw: '離卦·暖', bg: '#FBF6EE', ac: '#A8321F' },
    { k: 'ink', zh: '夜·墨', en: 'Ink', tw: '夜·墨', bg: '#1B1711', ac: '#E68A5C' },
    { k: 'celadon', zh: '青·瓷', en: 'Celadon', tw: '青·瓷', bg: '#E9F0EC', ac: '#2E7D6B' },
    { k: 'parchment', zh: '羊皮·古卷', en: 'Parchment', tw: '羊皮·古卷', bg: '#F1E7CE', ac: '#9A5A28' },
    { k: 'cosmos', zh: '星河·夜', en: 'Cosmos', tw: '星河·夜', bg: '#1A1730', ac: '#A78BFA' },
    { k: 'sakura', zh: '晨樱·绯', en: 'Sakura', tw: '晨櫻·緋', bg: '#FBEDEE', ac: '#C75B72' }
  ];
  var KEY = 'hd_theme';
  function lang() { return (window.HDI18N && window.HDI18N.lang) || 'zh-Hans'; }
  function lbl(o) { var L = lang(); return L === 'en' ? o.en : L === 'zh-Hant' ? o.tw : o.zh; }
  function cur() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function apply(k) { var d = document.documentElement; if (k) d.setAttribute('data-theme', k); else d.removeAttribute('data-theme'); }
  function save(k) { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (e) {} }

  function ensureCss() {
    if (document.getElementById('hdThemeCss')) return;
    var css = document.createElement('style'); css.id = 'hdThemeCss';
    css.textContent =
      '.themesw{display:inline-flex;gap:5px;align-items:center;flex-wrap:wrap}'
      + '.themesw .tsep{width:1px;height:16px;background:var(--border);margin:0 2px;opacity:.7}'
      + '.themesw .tsw{width:17px;height:17px;border-radius:50%;border:2px solid;padding:0;cursor:pointer;box-sizing:border-box;transition:transform .1s;-webkit-appearance:none;appearance:none}'
      + '.themesw .tsw:hover{transform:scale(1.2)}'
      + '.themesw .tsw.on{box-shadow:0 0 0 2px var(--card),0 0 0 3.5px var(--li)}'
      // 兜底浮钮容器
      + '#themeswFloat{position:fixed;right:14px;bottom:14px;z-index:9000;background:var(--card);border:1px solid var(--border);border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.16);padding:7px 9px}';
    document.head.appendChild(css);
  }

  function makeRow() {
    var row = document.createElement('span'); row.className = 'themesw';
    THEMES.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tsw' + (cur() === o.k ? ' on' : '');
      b.setAttribute('data-k', o.k);
      b.setAttribute('aria-label', lbl(o)); b.title = lbl(o);
      b.style.background = o.bg; b.style.borderColor = o.ac;
      b.onclick = function (e) {
        e.stopPropagation(); var k = o.k; apply(k); save(k);
        row.querySelectorAll('.tsw').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-k') === k); });
      };
      row.appendChild(b);
    });
    var sep = document.createElement('span'); sep.className = 'tsep'; row.appendChild(sep);   // 分隔线在圈圈之后，圈圈整体在语言前面
    return row;
  }

  function build() {
    if (document.querySelector('.themesw')) return;
    ensureCss();
    var ls = document.querySelector('.langsw');
    if (ls) { ls.insertBefore(makeRow(), ls.firstChild); return true; }   // 圈圈放到语言(简/繁/EN)前面
    return false;
  }

  function boot() {
    // 等 i18n.js 注入 .langsw；最多轮询 ~4s，仍无则兜底右下角浮钮
    var tries = 0;
    var iv = setInterval(function () {
      if (build() || ++tries > 40) {
        clearInterval(iv);
        if (!document.querySelector('.themesw')) {   // 兜底：无 .langsw（如个别独立页）
          ensureCss();
          var f = document.createElement('div'); f.id = 'themeswFloat'; f.appendChild(makeRow());
          document.body.appendChild(f);
        }
      }
    }, 100);
  }

  apply(cur());   // 兜底再应用一次（foucguard 已先应用过）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
