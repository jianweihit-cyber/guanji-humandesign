// build-celebs.mjs — 用本引擎为名人原始出生数据预计算命盘摘要，生成 src/hd-celebs.js
//
// 设计：名人库只存「出生输入(公开事实) + 命盘摘要(类型/角色/权威/通道)」，
//   页面用摘要即时展示、可按类型/角色筛选；点入某位名人时跳 index.html 用引擎实时重算
//   （引擎即真相，算法升级后点入自动享受新精度；与记录本一致）。
// 版权：原始数据仅含公开事实（姓名 / 出生日期·时间·地点 / Rodden 评级 / 一句身份简介），
//   盘面全部由本引擎计算，不照搬任何网站的盘面或解读文字。
//
// 用法：把研究产出的原始数组写入 tools/.cache/celebs-src.json 后，
//   node tools/build-celebs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dir, '.cache/celebs-src.json');
const OUT = resolve(__dir, '../src/hd-celebs.js');

const slug = (en) => en.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const out = [];
const seen = new Set();
let fail = 0;

for (const r of raw) {
  // 严守「质量优先」：只收 Rodden AA / A。例外：force=true（如创始人 Ra Uru Hu，时间为 DD 但体系标志性，页面会标「参考」）
  const rod = String(r.rodden || '').toUpperCase();
  if (rod !== 'AA' && rod !== 'A' && !r.force) { console.warn('SKIP rodden', r.name_en, r.rodden); continue; }
  let id = slug(r.name_en);
  while (seen.has(id)) id += '-2';
  seen.add(id);

  const input = { year: r.y, month: r.mo, day: r.d, hour: r.h, minute: r.mi, tz: r.tz };
  let c;
  try { c = await generateChart(input); }
  catch (e) { console.error('FAIL', r.name_en, e.message); fail++; continue; }

  out.push({
    id, zh: r.name_zh, en: r.name_en, cat: r.category,
    placeZh: r.place_zh, placeEn: r.place_en,
    rodden: rod, source: String(r.source || 'Astro-Databank').split(/[(;]/)[0].trim() || 'Astro-Databank',
    blurbZh: r.blurb_zh, blurbEn: r.blurb_en,
    input,
    sum: {
      type: c.type, typeZh: c.typeZh,
      authority: c.authority, authorityZh: c.authorityZh,
      profile: c.profile.str, profileZh: c.profile.zh,
      definition: c.definition, definitionZh: c.definitionZh,
      cross: c.incarnationCross.name || c.incarnationCross.notation,
      crossZh: c.incarnationCross.zhName || '',
      gates: [...new Set([...c.personality, ...c.design].map((a) => a.gate))].sort((x, y) => x - y),
      channels: c.definedChannels.map((x) => x.key),
    },
  });
}

const CAT_ORDER = { tech: 0, arts: 1, chinese: 2, hd: 3 };
out.sort((a, b) => (CAT_ORDER[a.cat] - CAT_ORDER[b.cat]) || a.en.localeCompare(b.en));

const byCat = out.reduce((m, x) => ((m[x.cat] = (m[x.cat] || 0) + 1), m), {});
const banner =
`// hd-celebs.js — 名人人类图库（自动生成，请勿手改）
// 改 tools/.cache/celebs-src.json 后跑：node tools/build-celebs.mjs
// 数据=公开出生事实（Rodden AA/A）+ 本引擎计算的命盘摘要；点入名人库会用 index.html 实时重算。
// 共 ${out.length} 位 — ${Object.entries(byCat).map(([k, v]) => k + ':' + v).join(' / ')}
`;
writeFileSync(OUT, banner + 'export const CELEBS = ' + JSON.stringify(out) + ';\n');
console.log(`✓ 生成 ${out.length} 位名人 → src/hd-celebs.js  (失败 ${fail})  分类:`, byCat);
closeEphemeris();
