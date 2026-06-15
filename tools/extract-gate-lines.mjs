#!/usr/bin/env node
/* extract-gate-lines.mjs — 从 99_RefBooks/_notes/webfull/gate-NN.md 抽取「爻线结构 + 源文」
   产物 tools/.cache/gate-lines-src.json（含 humdes 版权源文，仅供改写参考，.gitignore 不入库不部署）
   结构：{ "12": { theme, lines: { "1": {title, meaning, polarities:[{planet,type,text}]} ... } } }
   planet=行星英文(归一去 The )，type='exalted'|'detriment'。
   仅抽事实骨架(哪爻哪行星 exalted/detriment)+源文；原创双语描述由后续 workflow 生成，绝不照搬源文。*/
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../99_RefBooks/_notes/webfull/', import.meta.url));
const OUT = fileURLToPath(new URL('./.cache/gate-lines-src.json', import.meta.url));
fs.mkdirSync(fileURLToPath(new URL('./.cache/', import.meta.url)), { recursive: true });

const clean = p => p.replace(/^The\s+/i, '').trim();
const out = {};
for (let g = 1; g <= 64; g++) {
  const f = fs.existsSync(SRC + 'gate-' + g + '.md') ? SRC + 'gate-' + g + '.md'
          : fs.existsSync(SRC + 'gate-0' + g + '.md') ? SRC + 'gate-0' + g + '.md' : null;
  if (!f) { console.warn('缺 gate', g); continue; }
  let md = fs.readFileSync(f, 'utf8');
  const theme = (md.match(/^# Gate \d+ (.+)$/m) || [])[1] || '';
  const lines = {};
  // 归一化各种爻标题写法（### / #### / **Line N**）为统一切块标记
  md = md.replace(/^#{2,4}\s*Line (\d)/gm, '@@@LINE $1@@@')
         .replace(/^\*\*Line (\d)\*\*/gm, '@@@LINE $1@@@');
  // 切块：捕获行号 + 同行标题尾（格式B：### Line 1 — Title. meaning）
  const parts = md.split(/@@@LINE (\d)@@@([^\n]*)\n/m);
  for (let i = 1; i < parts.length; i += 3) {
    const ln = parts[i], head = (parts[i + 1] || '').replace(/^\s*[—-]\s*/, '').trim(), body = parts[i + 2] || '';
    let title = '', meaning = '';
    if (head) { const k = head.indexOf('.'); title = k > 0 ? head.slice(0, k).trim() : head; meaning = k > 0 ? head.slice(k + 1).trim() : ''; }
    else { const tm = body.match(/\*\*([^*\n]+?)\*\*\s*([^\n]*)/); if (tm) { title = tm[1].replace(/\.$/, '').trim(); meaning = tm[2].replace(/^[.\s]+/, '').trim(); } }
    const polarities = [];
    // 格式B：- **Exalted (Jupiter exalted):** text   /  - **Detriment (Mars in detriment):** text
    let m, reB = /^-\s*\*\*(Exalted|Detriment)\s*\(([^)]+?)\s+(?:exalted|in detriment)\):\*\*\s*(.+)$/gim;
    while ((m = reB.exec(body))) polarities.push({ planet: clean(m[2]), type: m[1].toLowerCase() === 'exalted' ? 'exalted' : 'detriment', text: m[3].trim() });
    if (!polarities.length) { // 格式A/E：(可选 -) **Venus exalted.** text  /  **Mercury in detriment.** text
      let reA = /^(?:-\s*)?\*\*(.+?)\s+(exalted|in detriment)\.\*\*\s*(.+)$/gim;
      while ((m = reA.exec(body))) polarities.push({ planet: clean(m[1]), type: m[2].toLowerCase() === 'exalted' ? 'exalted' : 'detriment', text: m[3].trim() });
    }
    if (!polarities.length) { // 格式C/F：- (▲/▼) Sun exalted. text  /  - The Earth in detriment. text（无粗体，可带▲▼）
      let reC = /^-\s*[▲▼]?\s*([A-Z][A-Za-z. ]+?)\s+(exalted|in detriment)\.\s*(.+)$/gim;
      while ((m = reC.exec(body))) polarities.push({ planet: clean(m[1]), type: m[2].toLowerCase() === 'exalted' ? 'exalted' : 'detriment', text: m[3].trim() });
    }
    if (/^-|\bexalted\b|\bin detriment\b/i.test(meaning)) meaning = '';   // 清极性 bleed
    if (!meaning && title.includes('. ')) { const k = title.indexOf('. '); meaning = title.slice(k + 2).trim(); title = title.slice(0, k).trim(); }
    lines[ln] = { title, meaning, polarities };
  }
  out[g] = { theme, lines };
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
// 校验
let gates = 0, lineCnt = 0, polCnt = 0, missing = [];
for (let g = 1; g <= 64; g++) { const e = out[g]; if (!e) { missing.push(g); continue; } gates++;
  for (let l = 1; l <= 6; l++) { const ld = e.lines[l]; if (!ld || !ld.title) missing.push(g + '.' + l); else { lineCnt++; polCnt += ld.polarities.length; } } }
console.log(`gate-lines-src.json: ${gates}/64 门, ${lineCnt}/384 爻, ${polCnt} 个 ▲▼ 极性`);
if (missing.length) console.warn('⚠️ 缺失:', missing.join(','));
console.log('抽样 12.1:', JSON.stringify(out[12].lines['1']));
