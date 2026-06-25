#!/usr/bin/env node
/**
 * 多语言预渲染构建：把 web/ 按语言各生成一套静态页 → dist/{cn,en,tc}/web/
 *   - 复用 web/i18n.js 自身的 EN 词典 + s2t(简→繁)，构建期翻译静态文本节点 + placeholder/title + <title>
 *   - 跳过 <script>/<style> 与 [data-noi18n] 子树（与运行时 i18n 同语义）
 *   - 资源引用(css/js/svg/png/json/wasm 等)若是相对路径 → 重写为 /web/ 绝对，三语共享、不重复拷
 *   - 页面链接(*.html)保持相对 → 在 /en/ 前缀下自动指向同语言版本
 *   - 设 <html lang>，并标记 data-prerendered（i18n.js 据此走「前缀模式」、不再做首屏翻译）
 * 用法：node tools/build-i18n.mjs   （部署前自动跑，见 deploy 流程）
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { parse } from 'node-html-parser';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'web');
const OUT = join(ROOT, 'dist');
const LANGS = [{ code: 'cn', hd: 'zh-Hans', htmlLang: 'zh-CN' }, { code: 'en', hd: 'en', htmlLang: 'en' }, { code: 'tc', hd: 'zh-Hant', htmlLang: 'zh-TW' }];

// —— 1) 沙箱执行 web/i18n.js，取出它自己的 EN 词典 + s2t（零漂移）——
function loadI18n() {
  const src = readFileSync(join(WEB, 'i18n.js'), 'utf8');
  const noop = () => {};
  const elStub = () => ({ style: {}, setAttribute: noop, getAttribute: () => null, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], closest: () => null, classList: { add: noop, remove: noop } });
  const sandbox = {
    window: {}, navigator: { language: 'en' }, location: { search: '', pathname: '/', hash: '' },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: Object.assign(elStub(), { documentElement: elStub(), body: elStub(), head: elStub(), title: '', readyState: 'complete', createElement: elStub, createTreeWalker: () => ({ nextNode: () => null }) }),
    MutationObserver: class { observe() {} disconnect() {} },
    NodeFilter: { SHOW_TEXT: 4 }, URLSearchParams, setTimeout: noop, console,
  };
  sandbox.window.HDI18N = null;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'i18n.js' });
  const api = sandbox.window.HDI18N;
  if (!api || !api.EN || !api.s2t) throw new Error('failed to extract i18n EN/s2t');
  return api; // {EN, s2t}
}

const SKIP_TAGS = new Set(['script', 'style', 'textarea', 'code', 'pre']);
const ASSET_RE = /\.(css|js|mjs|svg|png|jpg|jpeg|webp|gif|ico|json|wasm|data|woff2?|ttf)$/i;

// 翻一段纯文本（与 i18n.trText 同语义：EN 整段 trim 精确匹配；tc 逐字 s2t）
function trText(raw, lang, I) {
  if (lang.hd === 'zh-Hant') return I.s2t(raw);
  if (lang.hd === 'en') { const t = raw.trim(); if (I.EN[t] != null) return raw.replace(t, I.EN[t]); }
  return raw;
}
function trAttr(v, lang, I) {
  if (v == null) return v;
  if (lang.hd === 'zh-Hant') return I.s2t(v);
  if (lang.hd === 'en') { const t = v.trim(); if (I.EN[t] != null) return I.EN[t]; }
  return v;
}

// 递归翻译节点（跳过 script/style、[data-noi18n] 子树）
function walk(node, lang, I) {
  if (node.nodeType === 3) { node.rawText = node.parentNode && false ? node.rawText : node.rawText; return; } // 文本节点单独处理（见下）
}

function processHTML(html, lang, I) {
  const root = parse(html, { lowerCaseTagName: false, comment: true, voidTag: { closingSlash: true } });

  function rec(el, noi18n) {
    if (!el.childNodes) return;
    for (const ch of el.childNodes) {
      if (ch.nodeType === 3) { // text node
        if (!noi18n && ch.rawText && ch.rawText.trim()) {
          const out = trText(ch.rawText, lang, I);
          if (out !== ch.rawText) ch.rawText = out;
        }
        continue;
      }
      if (ch.nodeType !== 1) continue; // skip comments etc.
      const tag = (ch.rawTagName || '').toLowerCase();
      // 资源引用绝对化（所有元素，含 script/link 的 src/href；相对资源 → /web/ 共享，相对 *.html 保持相对=同语言）
      for (const a of ['href', 'src']) {
        if (!ch.hasAttribute || !ch.hasAttribute(a)) continue;
        const v = ch.getAttribute(a);
        if (!v || /^(https?:|data:|#|\/|mailto:|tel:)/i.test(v)) continue;
        if (ASSET_RE.test(v.split('?')[0])) ch.setAttribute(a, '/web/' + v);
      }
      if (SKIP_TAGS.has(tag)) continue; // script/style 等：不翻译其文本、不递归子树
      const childNoi18n = noi18n || (ch.hasAttribute && ch.hasAttribute('data-noi18n'));
      // 属性：placeholder / title
      for (const a of ['placeholder', 'title']) {
        if (ch.hasAttribute && ch.hasAttribute(a)) { const nv = trAttr(ch.getAttribute(a), lang, I); if (nv != null) ch.setAttribute(a, nv); }
      }
      rec(ch, childNoi18n);
    }
  }
  rec(root, false);

  // <html lang> + 预渲染标记
  const htmlEl = root.querySelector('html');
  if (htmlEl) { htmlEl.setAttribute('lang', lang.htmlLang); htmlEl.setAttribute('data-prerendered', lang.code); }
  // <title> 翻译
  const titleEl = root.querySelector('title');
  if (titleEl) { const nv = trText(titleEl.rawText, lang, I); if (nv !== titleEl.rawText) titleEl.set_content ? titleEl.set_content(nv) : (titleEl.rawText = nv); }

  return root.toString();
}

function run() {
  const I = loadI18n();
  const files = readdirSync(WEB).filter(f => f.endsWith('.html'));
  try { rmSync(OUT, { recursive: true, force: true }); } catch (e) {}
  let n = 0;
  for (const lang of LANGS) {
    const dir = join(OUT, lang.code, 'web');
    mkdirSync(dir, { recursive: true });
    for (const f of files) {
      const html = readFileSync(join(WEB, f), 'utf8');
      writeFileSync(join(dir, f), processHTML(html, lang, I));
      n++;
    }
    console.log('  ✓ ' + lang.code + '/web/  (' + files.length + ' pages, lang=' + lang.hd + ')');
  }
  console.log('构建完成：' + n + ' 个页面 → dist/{cn,en,tc}/web/');
}
run();
