/* hd-dream.js — 梦图 DreamRave 引擎（观己·人类图）
 *
 * 算法（经 2 张 Maia Mechanics 官方报告逐项验证，见 docs/梦图_DreamRave_研究.md）：
 *   · 梦图「个性」= 出生那一刻的 13 天体（与清醒盘个性完全相同）——官方盘逐项全对。
 *   · 梦图「设计」= 月亮从出生位置「回退 88°」的时刻（≈出生前 5.9 天）——CL 官方盘
 *     设计侧 ☉1.6/♀50.6/☽50.1/♃19.3/♇28.4/☿5.1 逐项全对；即二手文献所说 "88° of the Moon"。
 *   · 映射 = 标准 64 闸门 Rave Mandala 轮序（复用 longitudeToGateLine，无独立梦境轮）。
 *   · 梦境 bodygraph = 仅 5 中心 / 15 闸门（喉·G·荐骨·脾·根），激活过滤到 15 门；
 *     通道 = 标准 36 通道表过滤到两端都在 15 门内（恰 6 条）。
 *   · 类型/权威/定义 = 与清醒盘同规则跑缩减盘（多数人坍缩为反映者 Reflector）。
 */
import {
  initEphemeris, julianDayUT, allBodies, degnorm, lonSpeed,
  setEphemerisMode, setNodeType, getConfig,
} from './ephemeris.js';
import { buildActivations } from './hd-core.js';
import { CHANNELS, GATE_CENTER } from './hd-data.js';
import { localToUTCParts } from './chart.js';

// ── 梦境结构常量（官方报告 + 3 方来源互证）──
export const DREAM_GATES = [1, 5, 8, 12, 15, 19, 20, 27, 28, 38, 42, 50, 53, 57, 62];
const DREAM_SET = new Set(DREAM_GATES);
export const DREAM_CENTERS = ['Throat', 'G', 'Sacral', 'Spleen', 'Root'];
// 三个「场」：光之场 / 地球平面 / 魔域（15 门的 keynote 分组）
export const DREAM_FIELDS = [
  { k: 'light', zh: '光之场', tw: '光之場', en: 'Light Field', gates: [1, 8, 20, 57, 62] },
  { k: 'earth', zh: '地球平面', tw: '地球平面', en: 'Earth Plane', gates: [5, 12, 15, 27, 50] },
  { k: 'demon', zh: '魔域', tw: '魔域', en: 'Demon Realm', gates: [19, 28, 38, 42, 53] },
];
// 梦境可成立的通道 = 标准 36 表过滤两端都在 15 门（6 条：1-8 5-15 20-57 27-50 28-38 42-53）
export const DREAM_CHANNELS = CHANNELS.filter(
  (ch) => DREAM_SET.has(ch.gates[0]) && DREAM_SET.has(ch.gates[1]),
);

// 「设计 = 月亮回退 88°」牛顿法求解（月速 ~13.176°/日；50 轮收敛到 1e-8）
export function solveDreamDesignJD(birthJD) {
  const moonB = lonSpeed('Moon', birthJD).lon;
  const target = degnorm(moonB - 88);
  let jd = birthJD - 88 / 13.176;
  for (let i = 0; i < 60; i++) {
    const m = lonSpeed('Moon', jd);
    let d = degnorm(m.lon - target);
    if (d > 180) d -= 360;
    if (Math.abs(d) < 1e-8) break;
    jd -= d / (m.speed && m.speed > 5 ? m.speed : 13.176);
  }
  return jd;
}

const dreamActivations = buildActivations;   // 13 天体 → {planet,glyph,zh,en,lon,gate,line,color,tone,base}

/* 梦境类型/权威/定义（与清醒同规则、跑缩减盘）：
   - 定义中心 = 成立梦境通道两端的中心；连通分量 → 定义(无/一分/二分…)
   - 类型：梦境通道里喉只连 G(1-8)与脾(20-57)，均非动力中心 → Manifestor 不可能；
           荐骨有定义 → Generator；否则有任一定义 → Projector；全无 → Reflector。
   - 权威：荐骨定义 → Sacral；否则脾定义 → Splenic；否则 None（Reflector=月循环）。 */
function deriveDream(actP, actD) {
  const activated = new Set([...actP, ...actD].map((a) => a.gate));
  const channels = DREAM_CHANNELS.filter(
    (ch) => activated.has(ch.gates[0]) && activated.has(ch.gates[1]),
  );
  const defined = new Set();
  channels.forEach((ch) => { defined.add(GATE_CENTER[ch.gates[0]]); defined.add(GATE_CENTER[ch.gates[1]]); });
  // 连通分量（在 5 中心图上）
  const adj = {};
  channels.forEach((ch) => {
    const a = GATE_CENTER[ch.gates[0]], b = GATE_CENTER[ch.gates[1]];
    (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a);
  });
  const seen = new Set(); let comp = 0;
  for (const c of defined) {
    if (seen.has(c)) continue;
    comp++; const st = [c];
    while (st.length) { const x = st.pop(); if (seen.has(x)) continue; seen.add(x); (adj[x] || []).forEach((y) => st.push(y)); }
  }
  const type = defined.size === 0 ? 'Reflector'
    : defined.has('Sacral') ? 'Generator' : 'Projector';
  const typeZh = { Reflector: '反映者', Generator: '生产者', Projector: '投射者' }[type];
  const authority = defined.has('Sacral') ? 'Sacral' : defined.has('Spleen') ? 'Splenic' : 'None';
  const authorityZh = { Sacral: '荐骨', Splenic: '直觉(脾)', None: '无（月循环/环境）' }[authority];
  const definition = comp === 0 ? 'None' : comp === 1 ? 'Single' : comp === 2 ? 'Split' : 'Triple Split';
  const definitionZh = comp === 0 ? '无定义' : comp === 1 ? '一分' : comp === 2 ? '二分' : '三分';
  return { channels, definedCenters: [...defined], type, typeZh, authority, authorityZh, definition, definitionZh };
}

/* 生成梦图。input 同 generateChart：{year,month,day,hour,minute,tz,ephemerisMode?,nodeType?} */
export async function generateDreamChart(input) {
  await initEphemeris();
  if (input.ephemerisMode) setEphemerisMode(input.ephemerisMode);
  if (input.nodeType) setNodeType(input.nodeType);

  const { parts, iso } = localToUTCParts(
    input.year, input.month, input.day, input.hour, input.minute, input.second || 0, input,
  );
  const birthJD = julianDayUT(...parts);
  const designJD = solveDreamDesignJD(birthJD);

  const pAll = dreamActivations(allBodies(birthJD));
  const dAll = dreamActivations(allBodies(designJD));
  const personality = pAll.filter((a) => DREAM_SET.has(a.gate));   // 落在 15 门内的激活
  const design = dAll.filter((a) => DREAM_SET.has(a.gate));

  const derived = deriveDream(personality, design);

  // 按「场」分组（先个性后设计，供页面直接渲染）
  const fields = DREAM_FIELDS.map((f) => ({
    ...f,
    acts: [
      ...personality.filter((a) => f.gates.includes(a.gate)).map((a) => ({ ...a, side: 'P' })),
      ...design.filter((a) => f.gates.includes(a.gate)).map((a) => ({ ...a, side: 'D' })),
    ].sort((x, y) => x.gate - y.gate || (x.side === 'P' ? -1 : 1)),
  }));

  return {
    input, utc: { iso, parts }, birthJD, designJD,
    designDaysBefore: birthJD - designJD,
    config: getConfig(),
    personality, design, fields,
    ...derived,
  };
}
