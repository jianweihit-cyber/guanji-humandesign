/* theme.js — 主题/背景切换（右下角 🎨 浮动按钮，6 套配色，localStorage 持久化、三语）
 * 应用方式：html[data-theme]（hd.css 里各主题块据此覆盖 chrome 变量；盘面语义色不变）。
 * 首屏防闪：各页 <head> 的 foucguard 内联脚本已先一步读 hd_theme 应用 data-theme，本文件只管 UI。
 * 引入：各页 <script src="theme.js" defer></script>（在 hd-store/i18n 之后即可；本身不依赖它们，有 HDI18N 则本地化）。
 */
(function () {
  var THEMES = [
    { k: '', zh: '离卦·暖', en: 'Hexagram · Warm', tw: '離卦·暖', bg: '#FBF6EE', ac: '#A8321F', cd: '#ffffff' },
    { k: 'ink', zh: '夜·墨', en: 'Ink · Dark', tw: '夜·墨', bg: '#17140F', ac: '#E68A5C', cd: '#221D17' },
    { k: 'celadon', zh: '青·瓷', en: 'Celadon', tw: '青·瓷', bg: '#E9F0EC', ac: '#2E7D6B', cd: '#FBFDFB' },
    { k: 'parchment', zh: '羊皮·古卷', en: 'Parchment', tw: '羊皮·古卷', bg: '#F1E7CE', ac: '#9A5A28', cd: '#FBF4E1' },
    { k: 'cosmos', zh: '星河·夜', en: 'Cosmos', tw: '星河·夜', bg: '#13121E', ac: '#A78BFA', cd: '#1E1C2E' },
    { k: 'sakura', zh: '晨樱·绯', en: 'Sakura', tw: '晨櫻·緋', bg: '#FBEDEE', ac: '#C75B72', cd: '#FFFAFA' }
  ];
  var KEY = 'hd_theme';
  function lang() { return (window.HDI18N && window.HDI18N.lang) || 'zh-Hans'; }
  function lbl(o) { var L = lang(); return L === 'en' ? o.en : L === 'zh-Hant' ? o.tw : o.zh; }
  function cur() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function apply(k) { var d = document.documentElement; if (k) d.setAttribute('data-theme', k); else d.removeAttribute('data-theme'); }
  function save(k) { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (e) {} }

  function build() {
    if (document.getElementById('hdThemeBtn')) return;
    var L = lang();
    var btn = document.createElement('button');
    btn.id = 'hdThemeBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', L === 'en' ? 'Theme' : L === 'zh-Hant' ? '主題' : '主题');
    btn.textContent = '🎨';
    var pop = document.createElement('div');
    pop.id = 'hdThemePop';
    pop.hidden = true;
    pop.innerHTML = '<div class="hdtp-h">' + (L === 'en' ? 'Theme' : L === 'zh-Hant' ? '主題' : '主题') + '</div>'
      + THEMES.map(function (o) {
        return '<button type="button" class="hdtp-it' + (cur() === o.k ? ' on' : '') + '" data-k="' + o.k + '">'
          + '<span class="hdtp-sw" style="background:' + o.bg + '"><i style="background:' + o.cd + '"></i><b style="background:' + o.ac + '"></b></span>'
          + '<span class="hdtp-nm">' + lbl(o) + '</span>'
          + '<span class="hdtp-ck">' + (cur() === o.k ? '✓' : '') + '</span></button>';
      }).join('');

    var css = document.createElement('style');
    css.textContent =
      '#hdThemeBtn{position:fixed;right:16px;bottom:16px;z-index:9000;width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:var(--card);box-shadow:0 4px 16px rgba(0,0,0,.16);font-size:20px;cursor:pointer;line-height:1;padding:0;transition:transform .12s}'
      + '#hdThemeBtn:active{transform:scale(.92)}'
      + '#hdThemePop{position:fixed;right:16px;bottom:68px;z-index:9001;width:200px;background:var(--card);border:1px solid var(--border);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.22);padding:8px;animation:hdtpUp .16s ease}'
      + '@keyframes hdtpUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
      + '.hdtp-h{font-size:12px;color:var(--sub);padding:4px 8px 6px}'
      + '.hdtp-it{display:flex;align-items:center;gap:10px;width:100%;border:none;background:none;cursor:pointer;padding:8px;border-radius:10px;color:var(--ink);font-size:14px;font-family:inherit;text-align:left}'
      + '.hdtp-it:hover{background:var(--surface-2)}'
      + '.hdtp-it.on{background:var(--surface-2)}'
      + '.hdtp-sw{position:relative;width:26px;height:26px;border-radius:7px;flex:none;border:1px solid rgba(0,0,0,.12);overflow:hidden}'
      + '.hdtp-sw i{position:absolute;left:3px;top:3px;width:11px;height:11px;border-radius:3px}'
      + '.hdtp-sw b{position:absolute;right:3px;bottom:3px;width:9px;height:9px;border-radius:50%}'
      + '.hdtp-nm{flex:1;min-width:0}.hdtp-ck{color:var(--li);font-weight:700;width:14px}';
    document.head.appendChild(css);
    document.body.appendChild(btn);
    document.body.appendChild(pop);

    btn.onclick = function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; };
    pop.onclick = function (e) {
      var it = e.target.closest && e.target.closest('.hdtp-it'); if (!it) return;
      var k = it.getAttribute('data-k'); apply(k); save(k); pop.hidden = true;
      // 刷新勾选态
      pop.querySelectorAll('.hdtp-it').forEach(function (x) {
        var on = x.getAttribute('data-k') === k; x.classList.toggle('on', on);
        var ck = x.querySelector('.hdtp-ck'); if (ck) ck.textContent = on ? '✓' : '';
      });
    };
    document.addEventListener('click', function () { pop.hidden = true; });
  }

  apply(cur());   // 兜底再应用一次（foucguard 已先应用过）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
