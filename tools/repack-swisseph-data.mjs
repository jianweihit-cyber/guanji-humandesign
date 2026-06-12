// repack-swisseph-data.mjs — swisseph-wasm 星历数据包瘦身
// 原包 12.08MB 里 82% 是 HD 排盘永远用不到的小行星名册 seasnam.txt(9.93MB)
// 与恒星表 sefstars.txt(133KB)：HD 只算 日月+行星+真交点，二者无引用路径。
// 本脚本读取 wasm/swisseph.js 的 loadPackage 元数据 → 抽取保留文件重拼 .data
// → 回写新偏移表。幂等可重跑；npm 重装 swisseph-wasm 后需再跑一次。
// 用法：node tools/repack-swisseph-data.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../node_modules/swisseph-wasm/wasm/', import.meta.url));
const JS = DIR + 'swisseph.js', DATA = DIR + 'swisseph.data', LITE = DIR + 'swisseph-lite.data';
const DROP = new Set(['/sweph/seasnam.txt', '/sweph/sefstars.txt']);

// 瘦身包用新文件名 swisseph-lite.data：老访客按 immutable 缓存的旧 swisseph.data
// 不会和新偏移表错配（URL 一换，缓存天然失效）
// 备份原始包（只备份一次）；之后元数据与数据**永远以 .orig 为源**全量重生成，天然幂等
for (const f of [JS, DATA]) if (!fs.existsSync(f + '.orig')) fs.copyFileSync(f, f + '.orig');

const srcJs = fs.readFileSync(JS + '.orig', 'utf8');
const m = srcJs.match(/loadPackage\((\{files:\[.*?\],remote_package_size:\d+\})\)/s);
if (!m) throw new Error('未找到 loadPackage 元数据');
const meta = JSON.parse(m[1].replace(/(\w+):/g, '"$1":'));

const keep = meta.files.filter(f => !DROP.has(f.filename));
const dropped = meta.files.filter(f => DROP.has(f.filename));
if (!dropped.length) throw new Error('原始包中未找到待剔除文件，请检查 DROP 列表');

const data = fs.readFileSync(DATA + '.orig');
const parts = []; let off = 0;
const newFiles = keep.map(f => {
  const buf = data.subarray(f.start, f.end);
  const nf = { filename: f.filename, start: off, end: off + buf.length };
  off += buf.length; parts.push(buf); return nf;
});
const out = Buffer.concat(parts);
const newMeta = `{files:[${newFiles.map(f => `{filename:"${f.filename}",start:${f.start},end:${f.end}}`).join(',')}],remote_package_size:${out.length}}`;

// 用 .orig 的 js 做底，替换元数据字面量 + 远程包名改指 lite
let js = srcJs.replace(/loadPackage\(\{files:\[.*?\],remote_package_size:\d+\}\)/s, `loadPackage(${newMeta})`);
js = js.replace('var REMOTE_PACKAGE_BASE="swisseph.data"', 'var REMOTE_PACKAGE_BASE="swisseph-lite.data"');
if (!js.includes('swisseph-lite.data')) throw new Error('REMOTE_PACKAGE_BASE 替换失败');
fs.writeFileSync(LITE, out);
fs.copyFileSync(DATA + '.orig', DATA);   // 本地恢复原始包，构建镜像时再剔除
fs.writeFileSync(JS, js);
console.log(`✓ 重打包完成：${meta.remote_package_size} → ${out.length} B → swisseph-lite.data（剔除 ${dropped.map(d => d.filename).join(', ')}）`);
console.log('保留：', newFiles.map(f => `${f.filename}(${f.end - f.start}B)`).join(' '));
