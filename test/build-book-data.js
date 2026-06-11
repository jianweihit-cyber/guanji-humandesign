// build-book-data.js — 把 99_RefBooks/_notes 的权威笔记编译成引擎数据文件
//   产出1 src/hd-crosses-zh.js  ：CROSSES_ZH（192 轮回交叉中文名，含角度前缀）
//   产出2 src/hd-book-data.js   ：GATE_INFO（64 门：中文名/卦/别名/主旨/回路/英文名/keynote）
//                                 CHANNEL_INFO（36 通道：中文名/主旨/回路/英文名/keynote）
import { readFileSync, writeFileSync } from 'node:fs';

const N = (p) => new URL('../99_RefBooks/_notes/' + p, import.meta.url);
const S = (p) => new URL('../src/' + p, import.meta.url);

// ── 1. 轮回交叉中文名 ──
const idx = JSON.parse(readFileSync(N('crosses-index.json'), 'utf8'));
const PREFIX = { Right: '右角度交叉之', Left: '左角度交叉之', Juxtaposition: '并列交叉之' };
const zh = {};
for (const [angle, m] of Object.entries(idx)) {
  zh[angle] = {};
  for (const [gate, v] of Object.entries(m)) {
    const base = String(v.title).replace(/\d+$/, '').trim();
    zh[angle][gate] = PREFIX[angle] + base;
  }
}
const cnt = Object.values(zh).reduce((a, m) => a + Object.keys(m).length, 0);
if (cnt !== 192) throw new Error('crosses zh != 192: ' + cnt);
writeFileSync(S('hd-crosses-zh.js'),
  '// hd-crosses-zh.js — 192 轮回交叉中文名（由 test/build-book-data.js 自《人类图轮回交叉全书》索引生成，勿手改）\n'
  + 'export const CROSSES_ZH = ' + JSON.stringify(zh, null, 1) + ';\n');

// ── 2. 闸门 / 通道 信息表 ──
const en = JSON.parse(readFileSync(N('en-terms.json'), 'utf8'));
const rows = (md) => readFileSync(N(md), 'utf8').split('\n')
  .filter(l => /^\|\s*\d/.test(l))
  .map(l => l.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length));

const GATE_INFO = {};
for (const c of rows('gates-zh.md')) {
  const g = parseInt(c[0]);
  const m = c[1].match(/^(.+?)（(.+?)卦?）／?(.*?)(?:的闸门)?$/) || [null, c[1], '', ''];
  const e = (en.gates && en.gates[g]) || {};
  GATE_INFO[g] = { zh: m[1], hexZh: m[2], alias: m[3] || '', center: c[2],
    theme: c[3], circuit: c[4], en: e.name || '', keynote: e.keynote || '' };
}
if (Object.keys(GATE_INFO).length !== 64) throw new Error('gates != 64: ' + Object.keys(GATE_INFO).length);

const CHANNEL_INFO = {};
for (const c of rows('channels-zh.md')) {
  const key = c[0].replace(/[—–]/g, '-');
  const m = c[1].match(/^(.+?)的信道(?:（(.+?)）)?$/) || c[1].match(/^(.+?)(?:（(.+?)）)?$/) || [null, c[1], ''];
  const e = (en.channels && en.channels[key]) || {};
  CHANNEL_INFO[key] = { zh: m[1], keyline: m[2] || '', theme: c[2], circuit: c[3],
    en: e.name || '', keynote: e.keynote || '' };
}
if (Object.keys(CHANNEL_INFO).length !== 36) throw new Error('channels != 36: ' + Object.keys(CHANNEL_INFO).length);

writeFileSync(S('hd-book-data.js'),
  '// hd-book-data.js — 闸门/通道权威信息（由 test/build-book-data.js 自参考书笔记生成，勿手改）\n'
  + '// 中文名/主旨/回路 源自《人类图：区分的科学》提炼；英文名/keynote 源自 Ra/Jovian 标准（Complete Guide）\n'
  + 'export const GATE_INFO = ' + JSON.stringify(GATE_INFO, null, 1) + ';\n\n'
  + 'export const CHANNEL_INFO = ' + JSON.stringify(CHANNEL_INFO, null, 1) + ';\n');

console.log('✓ hd-crosses-zh.js 192 条 | GATE_INFO 64 | CHANNEL_INFO 36');
console.log('样例:', zh.Right[1], '|', JSON.stringify(GATE_INFO[1], null, 0).slice(0, 120));
console.log('样例:', JSON.stringify(CHANNEL_INFO['1-8'], null, 0).slice(0, 140));
