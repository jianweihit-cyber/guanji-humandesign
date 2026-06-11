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

// ── 3. EN 知识表（类型/权威/角色/中心，键名归一到引擎代码）──
const normKey = (s, map) => { for (const [pat, code] of map) if (s.toLowerCase().includes(pat)) return code; return null; };
const AUTH_MAP = [['self-projected','SelfProjected'],['self projected','SelfProjected'],['emotional','Emotional'],['solar','Emotional'],['sacral','Sacral'],['splenic','Splenic'],['spleen','Splenic'],['ego','Ego'],['heart','Ego'],['will','Ego'],['mental','Mental'],['environment','Mental'],['outer','Mental'],['lunar','Lunar'],['moon','Lunar']];
const CENTER_MAP = [['head','Head'],['crown','Head'],['ajna','Ajna'],['mind','Ajna'],['throat','Throat'],['g cent','G'],['identity','G'],['self','G'],['heart','Heart'],['ego','Heart'],['will','Heart'],['sacral','Sacral'],['solar','SolarPlexus'],['emotion','SolarPlexus'],['spleen','Spleen'],['splenic','Spleen'],['root','Root']];
const EN_KB = { types: en.types || {}, profiles: en.profiles || {}, authorities: {}, centers: {} };
for (const [k, v] of Object.entries(en.authorities || {})) { const c = normKey(k, AUTH_MAP); if (c && !EN_KB.authorities[c]) EN_KB.authorities[c] = v; }
for (const [k, v] of Object.entries(en.centers || {})) { const c = normKey(k, CENTER_MAP); if (c && !EN_KB.centers[c]) EN_KB.centers[c] = v; }
console.log('EN_KB: auth', Object.keys(EN_KB.authorities).length, '| centers', Object.keys(EN_KB.centers).length, '| types', Object.keys(EN_KB.types).length, '| profiles', Object.keys(EN_KB.profiles).length);

writeFileSync(S('hd-book-data.js'),
  '// hd-book-data.js — 闸门/通道权威信息（由 test/build-book-data.js 自参考书笔记生成，勿手改）\n'
  + '// 中文名/主旨/回路 源自《人类图：区分的科学》提炼；英文名/keynote 源自 Ra/Jovian 标准（Complete Guide）\n'
  + 'export const GATE_INFO = ' + JSON.stringify(GATE_INFO, null, 1) + ';\n\n'
  + 'export const CHANNEL_INFO = ' + JSON.stringify(CHANNEL_INFO, null, 1) + ';\n\n'
  + 'export const EN_KB = ' + JSON.stringify(EN_KB, null, 1) + ';\n');

console.log('✓ hd-crosses-zh.js 192 条 | GATE_INFO 64 | CHANNEL_INFO 36');
console.log('样例:', zh.Right[1], '|', JSON.stringify(GATE_INFO[1], null, 0).slice(0, 120));
console.log('样例:', JSON.stringify(CHANNEL_INFO['1-8'], null, 0).slice(0, 140));
