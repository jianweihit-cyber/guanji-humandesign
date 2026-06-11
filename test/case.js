// case.js — 案例对比跑测器：给生日 → 打印全部可对比细节
// 用法:
//   node test/case.js 1985-06-15 08:00 Asia/Shanghai
//   node test/case.js 1961-08-04 19:24 Pacific/Honolulu MEAN SWIEPH
//   node test/case.js 1990-03-05 13:30 +08:00            (也可直接给UTC偏移)
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';
import { PLANETS } from '../src/hd-data.js';

const [dateStr, timeStr, tzStr, node, mode] = process.argv.slice(2);
if (!dateStr || !timeStr || !tzStr) {
  console.log('用法: node test/case.js YYYY-MM-DD HH:MM <IANA时区|+08:00> [TRUE|MEAN] [MOSEPH|SWIEPH]');
  process.exit(1);
}
const [Y, Mo, D] = dateStr.split('-').map(Number);
const [H, Mi] = timeStr.split(':').map(Number);
const input = { year: Y, month: Mo, day: D, hour: H, minute: Mi };
if (/^[+-]\d{1,2}(:?\d{2})?$/.test(tzStr)) {
  const sign = tzStr[0] === '-' ? -1 : 1;
  const m = tzStr.slice(1).split(':');
  input.tzOffset = sign * (Number(m[0]) + (m[1] ? Number(m[1]) / 60 : 0));
} else input.tz = tzStr;
if (node) input.nodeType = node;
if (mode) input.ephemerisMode = mode;

const c = await generateChart(input);
const SIGN = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
const ds = l => { const s=SIGN[Math.floor(l/30)]; let t=Math.round((l%30)*3600); const dd=Math.floor(t/3600); t-=dd*3600; const m=Math.floor(t/60), sec=t-m*60; return `${s}${dd}°${String(m).padStart(2,'0')}'${String(sec).padStart(2,'0')}"`; };
const A = a => `${(a.gate+'.'+a.line).padEnd(5)} c${a.color}t${a.tone}b${a.base}  ${ds(a.lon)}`;

console.log('═'.repeat(72));
console.log(`输入  ${dateStr} ${timeStr} ${tzStr}    UTC ${c.utc.iso}`);
console.log(`星历  ${c.config.mode} / ${c.config.node}    设计层 = 出生前 ${c.designDaysBefore.toFixed(3)} 天 (JD ${c.designJD.toFixed(5)})`);
console.log('═'.repeat(72));
console.log(`类型    ${c.type}  (${c.typeZh})`);
console.log(`策略    ${c.strategy}     签名/非己  ${c.signature} / ${c.notSelf}`);
console.log(`权威    ${c.authority}  (${c.authorityZh})`);
console.log(`角色    ${c.profile.str}  (${c.profile.zh})`);
console.log(`定义    ${c.definition}  (${c.definitionZh})`);
console.log(`轮回交叉 ${c.incarnationCross.notation}`);
const ar = o => (o === 'Left' ? '◄' : '►');
console.log(`PHS  Determination ${c.phs.determination}${ar(c.phs.arrows.digestion)}  Cognition ${c.phs.cognition}  Environment ${c.phs.environment}${ar(c.phs.arrows.environment)}`);
console.log(`     Motivation ${c.phs.motivation}${ar(c.phs.arrows.awareness)}  View ${c.phs.view}${ar(c.phs.arrows.perspective)}`);
console.log('─'.repeat(72));
console.log('行星      设计(红/潜意识)              ｜ 个性(黑/意识)');
const pBy = Object.fromEntries(c.personality.map(a=>[a.planet,a]));
const dBy = Object.fromEntries(c.design.map(a=>[a.planet,a]));
for (const { key, glyph, zh } of PLANETS) {
  console.log(`${glyph}${zh}`.padEnd(6) + A(dBy[key]).padEnd(30) + '｜ ' + A(pBy[key]));
}
console.log('─'.repeat(72));
console.log(`已定义中心(${c.definedCenters.length})  ${c.definedCenters.join(', ')}`);
console.log(`开放中心(${c.openCenters.length})    ${c.openCenters.join(', ')}`);
console.log(`已定义通道(${c.definedChannels.length})  ${c.definedChannels.map(x=>x.key+' '+x.zh).join('  |  ')}`);
console.log('═'.repeat(72));
closeEphemeris();
