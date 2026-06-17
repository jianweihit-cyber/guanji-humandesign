// merge-celebs.mjs — 汇总 tools/.cache/celebs-*.json（base + 各轮研究产出）→ celebs-src.json
// 按 name_en 去重（先到先留），只保留构建所需字段。然后跑 build-celebs.mjs 生成 src/hd-celebs.js。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const cache = resolve(__dir, '.cache');
const FIELDS = ['name_zh', 'name_en', 'category', 'y', 'mo', 'd', 'h', 'mi', 'tz', 'place_zh', 'place_en', 'rodden', 'source', 'blurb_zh', 'blurb_en', 'force'];

const files = readdirSync(cache).filter((f) => /^celebs-.*\.json$/.test(f) && f !== 'celebs-src.json').sort();
const seen = new Set();
const out = [];
for (const f of files) {
  let arr = JSON.parse(readFileSync(resolve(cache, f), 'utf8'));
  if (!Array.isArray(arr)) arr = arr.result || [];
  let kept = 0;
  for (const r of arr) {
    if (!r || r.confirmed === false) continue;
    const k = String(r.name_en || '').toLowerCase().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const o = {};
    for (const key of FIELDS) if (r[key] !== undefined) o[key] = r[key];
    out.push(o); kept++;
  }
  console.log(`  ${f}: +${kept}`);
}
writeFileSync(resolve(cache, 'celebs-src.json'), JSON.stringify(out));
console.log(`✓ 合并 ${out.length} 位 → tools/.cache/celebs-src.json（来源 ${files.length} 个文件）`);
