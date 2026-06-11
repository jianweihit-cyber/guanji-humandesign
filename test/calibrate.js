// calibrate.js — 校准与自检
import { generateChart } from '../src/chart.js';
import { longitudeToGateLine } from '../src/hd-core.js';
import { closeEphemeris } from '../src/ephemeris.js';
import { PLANETS, CHANNELS } from '../src/hd-data.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  console.log(`${ok ? '✅' : '❌'} ${name}: ${got}${ok ? '' : `  (期望 ${want})`}`);
  ok ? pass++ : fail++;
}

// ── 1) 轮盘映射 vs 官方闸门度数表 ──────────────────────────
console.log('=== 1) 闸门度数表校验（黄经→闸门）===');
// 摩羯=270起。26°22′30″摩羯=296.375；水瓶=300起。
const deg = (sign, d, m = 0, s = 0) => sign * 30 + d + m / 60 + s / 3600;
check('摩羯26°22′30″ → 60门', longitudeToGateLine(deg(9, 26, 22, 30) + 0.01).gate, 60);
check('水瓶02°00′00″ → 41门', longitudeToGateLine(deg(10, 2, 0, 0) + 0.01).gate, 41);
check('水瓶07°37′30″ → 19门', longitudeToGateLine(deg(10, 7, 37, 30) + 0.01).gate, 19);
check('水瓶13°15′00″ → 13门', longitudeToGateLine(deg(10, 13, 15, 0) + 0.01).gate, 13);
check('水瓶18°52′30″ → 49门', longitudeToGateLine(deg(10, 18, 52, 30) + 0.01).gate, 49);
// 爻：每爻 0.9375°，41门第1爻在 302.00–302.9375
check('水瓶02°00′ 第1爻', longitudeToGateLine(deg(10, 2, 0, 0) + 0.01).line, 1);
check('水瓶02°30′ 第1爻', longitudeToGateLine(deg(10, 2, 30, 0)).line, 1);
check('水瓶02°57′ 第2爻', longitudeToGateLine(deg(10, 2, 57, 0)).line, 2);

// ── 2) 通道表结构自检 ─────────────────────────────────────
console.log('\n=== 2) 通道/中心结构自检 ===');
check('通道总数 = 36', CHANNELS.length, 36);
const gatesInChannels = new Set(CHANNELS.flatMap((c) => c.gates));
check('通道覆盖闸门数 = 64', gatesInChannels.size, 64);

// ── 3) 完整样例盘 ─────────────────────────────────────────
console.log('\n=== 3) 样例命盘 ===');
const sample = { year: 1990, month: 3, day: 5, hour: 13, minute: 30, tz: 'Asia/Shanghai' };
const c = await generateChart(sample);

console.log(`输入: ${sample.year}-${sample.month}-${sample.day} ${sample.hour}:${String(sample.minute).padStart(2,'0')} ${sample.tz}`);
console.log(`UTC : ${c.utc.iso}`);
console.log(`设计层: 出生前 ${c.designDaysBefore.toFixed(3)} 天   星历: ${c.config.mode}/${c.config.node}`);
console.log(`\n类型     : ${c.typeZh} (${c.type})`);
console.log(`策略     : ${c.strategy}`);
console.log(`内在权威 : ${c.authorityZh}`);
console.log(`人生角色 : ${c.profile.str}  ${c.profile.zh}`);
console.log(`定义     : ${c.definitionZh}`);
console.log(`签名/非己: ${c.signature} / ${c.notSelf}`);
console.log(`轮回交叉 : ${c.incarnationCross.angleZh}`);
console.log(`           ${c.incarnationCross.notation}`);
console.log(`已定义中心(${c.definedCenters.length}): ${c.definedCenters.join(', ')}`);
console.log(`开放中心(${c.openCenters.length})  : ${c.openCenters.join(', ')}`);
console.log(`已定义通道(${c.definedChannels.length}):`);
for (const ch of c.definedChannels) console.log(`   ${ch.key.padEnd(7)} ${ch.zh}  [${ch.centers.join('-')}]`);

const sign = (l) => ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(l/30)] + (l%30|0) + '°';
console.log('\n行星激活    设计(红)            个性(黑)');
for (const { key, glyph, zh } of PLANETS) {
  const p = c.personality.find((a) => a.planet === key);
  const d = c.design.find((a) => a.planet === key);
  const f = (a) => `${a.gate}.${a.line}`.padEnd(6) + sign(a.lon).padEnd(10);
  console.log(`${glyph} ${zh.padEnd(4)}  ${f(d)}  ${f(p)}`);
}

// ── 4) 自检：Profile 必属 12 种合法组合 ───────────────────
console.log('\n=== 4) 一致性自检 ===');
check('Profile 合法(设计爻=个性爻+2或+3)', c.incarnationCross.angle !== null, true);
check('类型有效', ['Generator','Manifesting Generator','Manifestor','Projector','Reflector'].includes(c.type), true);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
closeEphemeris();
process.exit(fail ? 1 : 0);
