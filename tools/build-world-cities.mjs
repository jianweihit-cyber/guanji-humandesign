#!/usr/bin/env node
/* build-world-cities.mjs — 由 GeoNames 生成海外城市联想库（与 humdes.com 同源数据）
   输入（tools/.cache/，由 download.geonames.org/export/dump/ 下载）：
     cities15000.zip / admin1CodesASCII.txt / countryInfo.txt
   输出 web/world-cities-v1.json：[[city, admin1, country, tz, pop], ...] 按人口降序。
   数据许可 CC-BY 4.0 © GeoNames.org —— 署名见 NOTICE 与 README。
   重新生成：cd tools/.cache && curl -O https://download.geonames.org/export/dump/{cities15000.zip,admin1CodesASCII.txt,countryInfo.txt}
            然后 node tools/build-world-cities.mjs */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CACHE = fileURLToPath(new URL('./.cache/', import.meta.url));
const OUT = fileURLToPath(new URL('../web/world-cities-v1.json', import.meta.url));

if (!fs.existsSync(CACHE + 'cities15000.txt'))
  execSync('unzip -o cities15000.zip', { cwd: CACHE, stdio: 'inherit' });

// admin1：CN.22 → Beijing（取 name 列；带变音的原名更好看）
const admin1 = {};
for (const ln of fs.readFileSync(CACHE + 'admin1CodesASCII.txt', 'utf8').split('\n')) {
  const [code, name] = ln.split('\t');
  if (code && name) admin1[code] = name;
}
// country：CN → China（countryInfo 第 5 列）
const country = {};
for (const ln of fs.readFileSync(CACHE + 'countryInfo.txt', 'utf8').split('\n')) {
  if (!ln || ln[0] === '#') continue;
  const c = ln.split('\t');
  if (c[0] && c[4]) country[c[0]] = c[4];
}

const rows = [];
for (const ln of fs.readFileSync(CACHE + 'cities15000.txt', 'utf8').split('\n')) {
  if (!ln) continue;
  const c = ln.split('\t');
  // 0 id, 1 name, 2 ascii, 8 country, 10 admin1, 14 pop, 17 tz
  const name = c[1], cc = c[8], a1 = admin1[cc + '.' + c[10]] || '', tz = c[17], pop = +c[14] || 0;
  if (!name || !cc || !tz) continue;
  rows.push([name, a1 === name ? '' : a1, country[cc] || cc, tz, pop]);
}
rows.sort((x, y) => y[4] - x[4]);
// 同名同区同国去重（保留人口大的）
const seen = new Set(); const out = [];
for (const r of rows) { const k = r[0] + '|' + r[1] + '|' + r[2]; if (seen.has(k)) continue; seen.add(k); out.push(r); }

fs.writeFileSync(OUT, JSON.stringify(out));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`world-cities-v1.json: ${out.length} cities, ${kb} KB`);
console.log('sample:', JSON.stringify(out.slice(0, 3)));
const bj = out.find(r => r[0] === 'Beijing');
console.log('Beijing check:', JSON.stringify(bj));
