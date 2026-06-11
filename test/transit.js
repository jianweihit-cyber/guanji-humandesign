// transit.js — 独立校验：一年里"太阳所在闸门"的变化序列必须 == 生命罗盘轮序
// 这是不依赖任何"已知名人盘"的硬校验：轮序 + 星历 联合正确才会通过。
import { initEphemeris, julianDayUT, lonSpeed, closeEphemeris } from '../src/ephemeris.js';
import { longitudeToGateLine } from '../src/hd-core.js';
import { GATE_ORDER } from '../src/hd-data.js';

await initEphemeris();

// 逐日扫描 2025 全年，记录太阳闸门的切换序列与日期
let prev = null;
const seq = [];           // 出现过的闸门顺序
const enterDate = {};     // 每个闸门的进入日期
for (let doy = 0; doy < 366; doy++) {
  const jd = julianDayUT(2025, 1, 1, 12, 0, 0) + doy;
  const g = longitudeToGateLine(lonSpeed('Sun', jd).lon).gate;
  if (g !== prev) {
    seq.push(g);
    const d = new Date(Date.UTC(2025, 0, 1) + doy * 86400000);
    enterDate[g] = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    prev = g;
  }
}

// 把扫描序列与 GATE_ORDER 对齐（GATE_ORDER 从 41 起，太阳1月在41号附近）
const uniq = [...new Set(seq)];
const start = GATE_ORDER.indexOf(uniq[0]);
const rotated = [...GATE_ORDER.slice(start), ...GATE_ORDER.slice(0, start)];
let okSeq = uniq.length === 64;
for (let i = 0; i < uniq.length; i++) if (uniq[i] !== rotated[i % 64]) okSeq = false;

console.log('=== 太阳过境闸门序列 vs 轮序 ===');
console.log('全年覆盖闸门数:', uniq.length, '(应=64)');
console.log('序列与轮序一致:', okSeq ? '✅ 完全一致' : '❌ 不一致');
console.log('\n=== Rave 新年（太阳入 41 号门）===');
console.log('太阳进入 41 号门日期:', enterDate[41], '(公认 Rave 新年 ≈ 1/20~1/22)');
console.log('太阳进入 30 号门日期:', enterDate[30] || '(未跨年内)');
console.log('\n前 8 个过境:', uniq.slice(0, 8).map(g => `${g}(${enterDate[g]})`).join(' → '));

closeEphemeris();
const pass = okSeq && ['1/19','1/20','1/21','1/22','1/23'].includes(enterDate[41]);
console.log('\n结果:', pass ? '✅ 独立天象校验通过' : '⚠️ 需复核');
process.exit(pass ? 0 : 1);
