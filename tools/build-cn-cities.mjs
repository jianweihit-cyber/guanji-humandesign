#!/usr/bin/env node
/* build-cn-cities.mjs — 由 cn-pca.json + pinyin-pro 生成「中国城市搜索索引」
   产物 web/cn-cities-v1.json：扁平数组，每条 [label, fullPinyin, initials, lvl]
     label      = 人性化显示/保存名（省 · 市 · 区，跳过「市辖区」占位），同时承担中文子串匹配
     fullPinyin = 叶子地名去行政后缀的全拼无声调（黄浦区→huangpu，上海市→shanghai）
     initials   = 叶子全名的拼音首字母（黄浦区→hpq，北京市→bjs）
     lvl        = 1 省 / 2 市 / 3 区县（用于排序：市级优先于区县）
   浏览器端不引 pinyin-pro，直接对本索引做字符串匹配（en/zh/拼音/首字母）。
   重新生成：npm run build:cn-cities（cn-pca 更新后须重跑）。
   pinyin-pro MIT © zhongnaiyao —— 仅构建期 devDependency，产物为纯数据。 */
import { pinyin } from 'pinyin-pro';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../web/cn-pca.json', import.meta.url));
const OUT = fileURLToPath(new URL('../web/cn-cities-v1.json', import.meta.url));
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const STRIP = /(省|市|区|县|盟|旗|自治州|自治县|地区|特别行政区)$/;
const full = s => pinyin(s.replace(STRIP, '') || s, { toneType: 'none', type: 'array' }).join('').replace(/[^a-z]/gi, '').toLowerCase();
const init = s => pinyin(s, { pattern: 'first', toneType: 'none', type: 'array' }).join('').replace(/[^a-z]/gi, '').toLowerCase();
const SKIP = new Set(['市辖区', '县', '省直辖县级行政区划', '自治区直辖县级行政区划']);

const rows = [];
const seen = new Set();
const push = (label, leaf, lvl) => {
  if (seen.has(label)) return; seen.add(label);
  rows.push([label, full(leaf), init(leaf), lvl]);
};
for (const prov of data) {
  push(prov.name, prov.name, 1);
  for (const city of prov.children || []) {
    const cityLabel = [prov.name, city.name].filter(x => !SKIP.has(x)).join(' · ');
    if (!SKIP.has(city.name)) push(cityLabel, city.name, 2);
    for (const dist of city.children || []) {
      if (SKIP.has(dist.name)) continue;
      const distLabel = [prov.name, city.name, dist.name].filter(x => !SKIP.has(x)).join(' · ');
      push(distLabel, dist.name, 3);
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(rows));
const kb = b => (b / 1024).toFixed(0) + 'KB';
console.log(`cn-cities-v1.json: ${rows.length} 条, ${kb(fs.statSync(OUT).size)} raw`);
console.log('样例:', JSON.stringify(rows.slice(0, 2)), JSON.stringify(rows.find(r => r[0].includes('黄浦'))), JSON.stringify(rows.find(r => r[1] === 'chongqing')));
