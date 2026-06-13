#!/usr/bin/env node
/* build-world-zh.mjs — 由 GeoNames alternateNamesV2 提取「世界城市中文名」稀疏 sidecar
   产物 web/world-cities-zh-v1.json：与 world-cities-v1.json 行序严格对齐的并行数组，
     每条 = 该城中文名(字符串) 或 0（GeoNames 无中文名时）。
   作用：让中文用户直接打「慕尼黑 / 巴黎 / 东京」就能在 3.3 万海外城里找到（humdes 连中文都不支持）。
   依赖（仅构建期，均 .gitignore）：
     tools/.cache/alternateNamesV2.zip  ← curl https://download.geonames.org/export/dump/alternateNamesV2.zip
     tools/.cache/world-geonameids.json ← 由 build-world-cities.mjs 同遍生成（保证对齐）
   重新生成：npm run build:world && npm run build:world-zh
   数据 CC-BY 4.0 © GeoNames.org（NOTICE 已署名）。 */
import fs from 'node:fs';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CACHE = fileURLToPath(new URL('./.cache/', import.meta.url));
const TXT = CACHE + 'alternateNamesV2.txt';
const GIDF = CACHE + 'world-geonameids.json';
const OUT = fileURLToPath(new URL('../web/world-cities-zh-v1.json', import.meta.url));

if (!fs.existsSync(GIDF)) { console.error('缺 world-geonameids.json，先跑 npm run build:world'); process.exit(1); }
if (!fs.existsSync(TXT)) {
  if (!fs.existsSync(CACHE + 'alternateNamesV2.zip')) { console.error('缺 alternateNamesV2.zip，先 curl 下载到 tools/.cache/'); process.exit(1); }
  console.log('解压 alternateNamesV2.zip …'); execSync('unzip -o alternateNamesV2.zip', { cwd: CACHE, stdio: 'inherit' });
}

// 繁→简：用 opencc-js（专业 OpenCC 词库，覆盖完整）。GeoNames 的 zh 别名简繁混杂，统一转简体存储，
// 显示干净；繁体模式下由 i18n 的 s2t 再转回繁体；匹配则运行期 cz 归一，三端一致。
import * as OpenCC from 'opencc-js';
const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' });

const order = JSON.parse(fs.readFileSync(GIDF, 'utf8'));   // [geonameid,...] 与 v1 同序
const want = new Set(order);
// gid -> 候选中文名集合：{ pref:[], zh:[], hant:[] }
const cand = new Map();
const rl = readline.createInterface({ input: fs.createReadStream(TXT), crlfDelay: Infinity });
let scanned = 0;
for await (const ln of rl) {
  // 快速预过滤：只关心含 zh/pinyin 的行（pinyin 暂不入 sidecar，但留扩展）
  const t = ln.split('\t');
  const gid = +t[1], iso = t[2], name = t[3];
  if (!want.has(gid)) continue;
  if (iso !== 'zh' && iso !== 'zh-Hant') continue;
  scanned++;
  let c = cand.get(gid); if (!c) { c = { pref: [], zh: [], hant: [] }; cand.set(gid, c); }
  if (iso === 'zh-Hant') c.hant.push(name);
  else if (t[4] === '1') c.pref.push(name);     // isPreferredName
  else c.zh.push(name);
}
const shortest = a => a.slice().sort((x, y) => x.length - y.length)[0];
const pick = gid => {
  const c = cand.get(gid); if (!c) return 0;
  return c.pref[0] || shortest(c.zh) || shortest(c.hant) || 0;
};
const sidecar = order.map(g => { const n = pick(g); return n ? t2s(n) : 0; });   // 统一转简体
fs.writeFileSync(OUT, JSON.stringify(sidecar));
const have = sidecar.filter(Boolean).length;
const kb = b => (b / 1024).toFixed(0) + 'KB';
console.log(`world-cities-zh-v1.json: ${have}/${order.length} 有中文名 (${(have / order.length * 100).toFixed(1)}%), ${kb(fs.statSync(OUT).size)} raw, 扫描命中 ${scanned} 行`);
console.log('抽样:', [2867714, 2988507, 1850147].map(g => t2s(pick(g))).join(' / '), '| NYC/London/Soho:',
  [5128581, 2643743, 2637469].map(g => { const n = pick(g); return n ? t2s(n) : '(无)'; }).join(' / '));
