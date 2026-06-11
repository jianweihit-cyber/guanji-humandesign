// solve-check.js — 反推引擎盲测：拿 Mumbai 标定盘的 26 个 gate.line 反推出生时间
// 期望：1950-2030 范围内唯一命中，且区间包含真实出生时刻 1979-01-20 12:00 IST (UT 06:30)
import { generateChart } from '../src/chart.js';
import { solveBirth, jdToLocal } from '../src/hd-solve.js';
import { closeEphemeris } from '../src/ephemeris.js';

const truth = await generateChart({ year: 1979, month: 1, day: 20, hour: 12, minute: 0, tz: 'Asia/Kolkata' });
const toSide = (acts) => { const o = {}; for (const a of acts) o[a.planet] = { gate: a.gate, line: a.line }; return o; };
const targets = { personality: toSide(truth.chart ? truth.chart.personality : truth.personality), design: toSide(truth.chart ? truth.chart.design : truth.design) };

console.log('目标(个性☉):', targets.personality.Sun, ' 真实出生 JD(UT):', truth.birthJD.toFixed(4));
const t0 = Date.now();
const res = await solveBirth({ targets, yearFrom: 1950, yearTo: 2030, onProgress: (y) => { if (y % 20 === 0) process.stdout.write(`…${y} `); } });
console.log(`\n耗时 ${(Date.now() - t0) / 1000}s · 命中 ${res.length} 个区间`);
let pass = 0;
for (const r of res) {
  const hit = truth.birthJD >= r.jdStart && truth.birthJD <= r.jdEnd;
  const mins = ((r.jdEnd - r.jdStart) * 1440).toFixed(0);
  console.log(`  ${jdToLocal(r.jdStart, 'Asia/Kolkata')} ~ ${jdToLocal(r.jdEnd, 'Asia/Kolkata')} IST · 宽 ${mins} 分钟 ${hit ? '✅ 含真实时刻' : ''}`);
  if (hit) pass++;
}
closeEphemeris();
if (res.length === 1 && pass === 1) { console.log('✅ 反推盲测通过：唯一命中且包含真实出生时刻'); process.exit(0); }
console.log('❌ 反推盲测未达预期'); process.exit(1);
