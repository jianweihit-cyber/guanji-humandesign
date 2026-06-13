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

// Penta：3-5 人小组场域，仅用 喉-G-荐骨 纵列 6 通道 / 12 闸门
export const PENTA_CHANNELS = [
  { key: '7-31',  gates: [31, 7],  zh: '对外领导', en: 'Leadership',    roles: { 31: '对外发声', 7: '内部领导' }, rolesEn: { 31: 'Outer voice', 7: 'Inner direction' } },
  { key: '1-8',   gates: [8, 1],   zh: '创意示范', en: 'Contribution',  roles: { 8: '示范推广', 1: '创意方向' }, rolesEn: { 8: 'Role model', 1: 'Creative direction' } },
  { key: '13-33', gates: [33, 13], zh: '复盘传承', en: 'Retrospective', roles: { 33: '经验传承', 13: '倾听复盘' }, rolesEn: { 33: 'Witness', 13: 'Listener' } },
  { key: '5-15',  gates: [15, 5],  zh: '节奏流程', en: 'Rhythm',        roles: { 15: '场域节奏', 5: '固定流程' }, rolesEn: { 15: 'Flow of the field', 5: 'Fixed rhythm' } },
  { key: '2-14',  gates: [2, 14],  zh: '资源方向', en: 'Direction',     roles: { 2: '资源把关', 14: '资源动力' }, rolesEn: { 2: 'Keeper of direction', 14: 'Resource power' } },
  { key: '29-46', gates: [46, 29], zh: '承诺坚持', en: 'Commitment',    roles: { 46: '推进完成', 29: '承诺投入' }, rolesEn: { 46: 'Drive to complete', 29: 'Commitment' } },
];
export const PENTA_GATES = PENTA_CHANNELS.flatMap(c => c.gates);

export function penta(charts) { // charts: [{name, chart}]
  const carriers = {}; for (const g of PENTA_GATES) carriers[g] = [];
  for (const m of charts) {
    const gs = unionGates(m.chart);
    for (const g of PENTA_GATES) if (gs.has(g)) carriers[g].push(m.name);
  }
  const channels = PENTA_CHANNELS.map(ch => {
    const [gA, gB] = ch.gates;
    const ok = carriers[gA].length > 0 && carriers[gB].length > 0;
    return { ...ch, complete: ok };
  });
  const gaps = PENTA_GATES.filter(g => carriers[g].length === 0);
  return { carriers, channels, gaps, complete: gaps.length === 0, size: charts.length };
}
