// hd-connect.js — 合盘（2人连结盘）与 Penta（3-5人场域）推导
// 连结盘四类通道（按经典规则）：
//   Companionship 友谊 = 双方各自完整拥有该通道
//   Dominance     主导 = 一方完整、另一方两门皆无（单向示范/学习）
//   Compromise    妥协 = 一方完整、另一方只挂一门（单门方=妥协方）
//   Electromagnetic 电磁 = 你一门我一门，合而成道（吸引与摩擦并存）
import { CHANNELS, CENTERS } from './hd-data.js';

export const unionGates = (c) => new Set([...c.personality, ...c.design].map(a => a.gate));

function comps(centers, edges) { // 连通分量
  const adj = {}; centers.forEach(c => adj[c] = []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set(); let n = 0;
  for (const c of centers) {
    if (seen.has(c)) continue; n++;
    const st = [c]; seen.add(c);
    while (st.length) { for (const nb of adj[st.pop()]) if (!seen.has(nb)) { seen.add(nb); st.push(nb); } }
  }
  return n;
}

// 两人连结盘
export function connection(cA, cB) {
  const A = unionGates(cA), B = unionGates(cB);
  const both = new Set([...A].filter(g => B.has(g)));
  const channels = []; const centers = new Set(); const edges = [];
  for (const ch of CHANNELS) {
    const [g1, g2] = ch.gates;
    const a1 = A.has(g1), a2 = A.has(g2), b1 = B.has(g1), b2 = B.has(g2);
    const aFull = a1 && a2, bFull = b1 && b2;
    const together = (a1 || b1) && (a2 || b2);
    if (!together) continue;
    let cat;
    if (aFull && bFull) cat = 'companionship';
    else if (aFull && !b1 && !b2) cat = 'dominanceA';
    else if (bFull && !a1 && !a2) cat = 'dominanceB';
    else if (aFull) cat = 'compromiseB';      // B 只挂一门 → B 妥协
    else if (bFull) cat = 'compromiseA';      // A 只挂一门 → A 妥协
    else cat = 'electromagnetic';             // 各出一门
    channels.push({ key: `${Math.min(g1, g2)}-${Math.max(g1, g2)}`, zh: ch.zh, en: ch.en, gates: ch.gates, centers: ch.centers, cat });
    centers.add(ch.centers[0]); centers.add(ch.centers[1]);
    edges.push(ch.centers);
  }
  const definedCenters = [...centers];
  const n = comps(definedCenters, edges);
  // 仅合盘新增（双方单独都没有、合体才有）的通道
  const newTogether = channels.filter(c => ['electromagnetic'].includes(c.cat));
  return { channels, definedCenters, splits: n, openCenters: Object.keys(CENTERS).filter(k => !centers.has(k)), newTogether,
    gatesA: A, gatesB: B, gatesBoth: both };
}

// Penta：3-5 人小组场域，仅用 喉-G-荐骨 纵列 6 通道 / 12 闸门（BG5 体系）
// desc/descEn = 该功能对团队的意义；roles = 两个闸门各自承担的角色
export const PENTA_CHANNELS = [
  { key: '7-31',  gates: [31, 7],  zh: '领导', en: 'Leadership',
    desc: '团队的方向与对外发声——谁来定调、把方向说出去', descEn: 'Direction & the outer voice — who sets the course and speaks for the team',
    roles: { 31: '对外发声', 7: '内部领导' }, rolesEn: { 31: 'Outer voice', 7: 'Inner direction' } },
  { key: '1-8',   gates: [8, 1],   zh: '贡献', en: 'Contribution',
    desc: '原创与示范——团队的创意从哪来、如何被看见', descEn: 'Originality & role-modeling — where the creativity comes from and how it is shown',
    roles: { 8: '示范推广', 1: '创意方向' }, rolesEn: { 8: 'Role model', 1: 'Creative direction' } },
  { key: '13-33', gates: [33, 13], zh: '见证', en: 'Witnessing',
    desc: '经验的传承与复盘——团队记得什么、从过去学到什么', descEn: 'Memory & reflection — what the team remembers and learns from its past',
    roles: { 33: '经验传承', 13: '倾听复盘' }, rolesEn: { 33: 'Witness', 13: 'Listener' } },
  { key: '5-15',  gates: [15, 5],  zh: '节奏', en: 'Rhythm',
    desc: '团队的节律与人性化流动——固定流程 + 适应弹性', descEn: 'Cadence & human flow — fixed routine balanced with adaptive flow',
    roles: { 15: '场域节奏', 5: '固定流程' }, rolesEn: { 15: 'Flow of the field', 5: 'Fixed rhythm' } },
  { key: '2-14',  gates: [2, 14],  zh: '方向与资源', en: 'Direction & Resources',
    desc: '资源的把关与动力——往哪走、用什么走', descEn: 'Resources & steering — where to go and the fuel to get there',
    roles: { 2: '资源把关', 14: '资源动力' }, rolesEn: { 2: 'Keeper of direction', 14: 'Resource power' } },
  { key: '29-46', gates: [46, 29], zh: '坚持成事', en: 'Perseverance',
    desc: '承诺与专注——把事真正推进到完成、对世界说「是」', descEn: 'Commitment & devotion — actually carrying things through, saying yes to the world',
    roles: { 46: '推进完成', 29: '承诺投入' }, rolesEn: { 46: 'Drive to complete', 29: 'Commitment' } },
];
export const PENTA_GATES = PENTA_CHANNELS.flatMap(c => c.gates);

// 12 闸门关键词与含义（对照 BG5 标准图：纪律/展示/传统 · 未来/当下/过去 · 内在流动/物质/发现 · 家/需求/世界）
export const PENTA_GATE_INFO = {
  31: { zh: '纪律', en: 'Discipline',  dZh: '对外发声、影响他人，把方向说出去', dEn: 'The outer leadership voice that influences and directs' },
  8:  { zh: '展示', en: 'Demonstration', dZh: '示范与推广，让团队的贡献被看见', dEn: 'Role-modeling that makes the contribution visible' },
  33: { zh: '传统', en: 'Tradition',   dZh: '沉淀经验、回顾与传承', dEn: 'Distilling and passing on experience' },
  7:  { zh: '未来', en: 'Future',      dZh: '内部方向，为未来定位', dEn: 'Inner direction, positioning for the future' },
  1:  { zh: '当下', en: 'Present',     dZh: '创意源头，此刻的原创方向', dEn: 'The creative source — original direction in the now' },
  13: { zh: '过去', en: 'Past',        dZh: '倾听与复盘，承接过往', dEn: 'Listening and reflecting on what has been' },
  15: { zh: '内在流动', en: 'Inner Flow', dZh: '团队的节奏与人性化流动', dEn: 'The human rhythm and flow of the field' },
  2:  { zh: '物质', en: 'Material',    dZh: '资源与方向的把关者', dEn: 'Keeper of resources and direction' },
  46: { zh: '发现', en: 'Discovery',   dZh: '专注投入，把事推进到完成', dEn: 'Devotion that drives things to completion' },
  5:  { zh: '家', en: 'Home',         dZh: '固定的节律与流程', dEn: 'Fixed rhythm and routine' },
  14: { zh: '需求', en: 'Demands',     dZh: '资源的动力与产能', dEn: 'The power and capacity behind resources' },
  29: { zh: '世界', en: 'World',       dZh: '承诺与坚持，对世界说「是」', dEn: 'Commitment and perseverance — saying yes to the world' },
};

export const PENTA_INTRO = {
  zh: 'Penta 是 3–5 人小组的能量场（BG5 体系）。它只看「喉咙–G–荐骨」纵列的 12 个闸门、6 条功能通道——团队要顺畅运转，这 6 个功能最好都有人「承载」。没人承载的闸门＝团队的「缺口」，是容易卡住、需要有意识补位的地方。Penta 不是个人盘的简单叠加，而是把小组当成一个整体来看。',
  en: 'A Penta is the energy field of a 3–5 person group (the BG5 model). It looks only at the 12 gates and 6 functional channels along the Throat–G–Sacral column. For the team to run smoothly, each of these six functions is best “carried” by someone. A gate no one carries is a “gap” — where the group tends to stall and needs conscious covering. A Penta is not a simple stack of individual charts, but the group seen as one whole.',
};

export function penta(charts) { // charts: [{id?, name, chart}]；carriers 存 id(无则回退 name)，避免同名成员折叠
  const carriers = {}; for (const g of PENTA_GATES) carriers[g] = [];
  for (const m of charts) {
    const gs = unionGates(m.chart);
    const tag = m.id != null ? m.id : m.name;
    for (const g of PENTA_GATES) if (gs.has(g)) carriers[g].push(tag);
  }
  const channels = PENTA_CHANNELS.map(ch => {
    const [gA, gB] = ch.gates;
    const ok = carriers[gA].length > 0 && carriers[gB].length > 0;
    return { ...ch, complete: ok };
  });
  const gaps = PENTA_GATES.filter(g => carriers[g].length === 0);
  return { carriers, channels, gaps, complete: gaps.length === 0, size: charts.length };
}
