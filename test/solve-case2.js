// solve-case2.js — 用户提供的面板截图（红=设计左 / 黑=个性右）反推出生时间 + 自洽交叉检验
import { solveBirth, jdToLocal } from '../src/hd-solve.js';
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';

const gl = s => { const [g, l] = s.split('.').map(Number); return { gate: g, line: l }; };
const P = { Sun:'36.4', Earth:'6.4', Moon:'14.4', NorthNode:'13.3', SouthNode:'7.3', Mercury:'36.2', Venus:'19.3', Mars:'41.3', Jupiter:'15.4', Saturn:'61.3', Uranus:'58.6', Neptune:'38.6', Pluto:'1.5' };
const D = { Sun:'11.6', Earth:'12.6', Moon:'46.1', NorthNode:'13.5', SouthNode:'7.5', Mercury:'54.3', Venus:'41.3', Mars:'34.2', Jupiter:'52.4', Saturn:'38.6', Uranus:'58.2', Neptune:'38.3', Pluto:'1.4' };
const side = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, gl(v)]));
const targets = { personality: side(P), design: side(D) };

const t0 = Date.now();
const res = await solveBirth({ targets, yearFrom: 1900, yearTo: 2030, onProgress: y => { if (y % 30 === 0) process.stdout.write(`…${y} `); } });
console.log(`\n耗时 ${(Date.now() - t0) / 1000}s · 命中 ${res.length} 个区间`);
for (const r of res) {
  const w = ((r.jdEnd - r.jdStart) * 1440).toFixed(0);
  console.log(`  UTC  ${jdToLocal(r.jdStart, 'UTC')} ~ ${jdToLocal(r.jdEnd, 'UTC')} · 宽 ${w} 分钟`);
  console.log(`  北京 ${jdToLocal(r.jdStart, 'Asia/Shanghai')} ~ ${jdToLocal(r.jdEnd, 'Asia/Shanghai')}`);
}
if (res.length) {
  // 自洽检验：取中点出盘，26 个激活逐项必须等于输入
  const midJD = (res[0].jdStart + res[0].jdEnd) / 2;
  const [d, hm] = jdToLocal(midJD, 'Asia/Shanghai').split(' ');
  const [Y, Mo, Dd] = d.split('-').map(Number), [H, Mi] = hm.split(':').map(Number);
  const c = await generateChart({ year: Y, month: Mo, day: Dd, hour: H, minute: Mi, tz: 'Asia/Shanghai' });
  let bad = 0;
  for (const a of c.personality) { const t = P[a.planet]; if (t !== a.gate + '.' + a.line) { bad++; console.log(`  ❌ P ${a.planet}: ${a.gate}.${a.line} ≠ ${t}`); } }
  for (const a of c.design) { const t = D[a.planet]; if (t !== a.gate + '.' + a.line) { bad++; console.log(`  ❌ D ${a.planet}: ${a.gate}.${a.line} ≠ ${t}`); } }
  console.log(bad ? `❌ ${bad} 项不符` : '✅ 自洽检验：中点出盘 26/26 项与输入完全一致');
  console.log(`盘摘要: ${c.type} ${c.profile.str} · ${c.authority} · ${c.definitionZh} · ${c.incarnationCross.name || ''}`);
  console.log(`通道: ${c.definedChannels.map(x => x.key).join(', ')}`);
}
closeEphemeris();
