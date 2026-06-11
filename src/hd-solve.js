// hd-solve.js — 反推出生时间（生时校正/无生时排盘）
// 输入：个性/设计 各行星的 gate(.line) 约束（可部分留空）→ 输出：所有满足约束的 UT 时间区间。
// 原理：个性太阳 gate.line 每年只对应 ~23h（gate 则 ~5.7天）窗口；慢行星按年过滤；
//       月亮 1 爻 ≈1.7h 在窗内扫描；命中点再验全部 13×2 天体（设计层=88°太阳弧回推）。
import { initEphemeris, lonSpeed, allBodies, solveDesignJD, julianDayUT, degnorm } from './ephemeris.js';
import { GATE_ORDER, WHEEL_START, GATE_ARC, LINE_ARC } from './hd-data.js';
import { longitudeToGateLine } from './hd-core.js';

const SLOW = ['Pluto', 'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'NorthNode', 'SouthNode'];

const hasAny = (side) => side && Object.values(side).some(t => t && t.gate);
const matchOne = (gl, t) => gl.gate === t.gate && (!t.line || gl.line === t.line);
function matchSide(bodies, side) {
  for (const k in side) {
    const t = side[k]; if (!t || !t.gate) continue;
    if (!matchOne(longitudeToGateLine(bodies[k].lon), t)) return false;
  }
  return true;
}
function sunWindowLon(t) { // 个性太阳目标黄经区间 [起点, 宽度]
  const i = GATE_ORDER.indexOf(t.gate);
  const s = degnorm(WHEEL_START + i * GATE_ARC + (t.line ? (t.line - 1) * LINE_ARC : 0));
  return [s, t.line ? LINE_ARC : GATE_ARC];
}
function solveSunLon(targetLon, jdGuess) { // 牛顿法：太阳到达指定黄经的 JD
  let jd = jdGuess;
  for (let i = 0; i < 10; i++) {
    const { lon, speed } = lonSpeed('Sun', jd);
    let d = degnorm(targetLon - lon); if (d > 180) d -= 360;
    if (Math.abs(d) < 1e-7) break;
    jd += d / (speed || 0.9856);
  }
  return jd;
}

// 全约束校验（含设计层）
function fullMatch(jd, pT, dT, withDesign) {
  if (!matchSide(allBodies(jd), pT)) return false;
  if (withDesign) { if (!matchSide(allBodies(solveDesignJD(jd).jd), dT)) return false; }
  return true;
}
// 在 [bad, good] 或 [good, bad] 间二分边界（goodSide=true 表示 b 端匹配）
function bisect(a, b, pT, dT, wd, goodAtB) {
  for (let i = 0; i < 10; i++) {
    const m = (a + b) / 2;
    const ok = fullMatch(m, pT, dT, wd);
    if (ok === goodAtB) b = m; else a = m;
  }
  return (a + b) / 2;
}

export async function solveBirth({ targets, yearFrom = 1920, yearTo = 2030, maxResults = 12, onProgress } = {}) {
  await initEphemeris();
  const pT = targets.personality || {}, dT = targets.design || {};
  if (!pT.Sun || !pT.Sun.gate) throw new Error('need-personality-sun');
  const wd = hasAny(dT);
  const [w0, ww] = sunWindowLon(pT.Sun);
  const moonT = pT.Moon && pT.Moon.gate ? pT.Moon : null;
  const STEP = 10 / 1440; // 10 分钟扫描步长（月亮 1 爻 ≈ 102 分钟，不会漏）
  const results = [];

  for (let y = yearFrom; y <= yearTo; y++) {
    if (onProgress) { const stop = onProgress(y, results); if (stop === false) break; }
    // ① 当年太阳窗口
    const jd0 = julianDayUT(y, 1, 1, 0);
    const d0 = degnorm(w0 - lonSpeed('Sun', jd0).lon);
    const jdA = solveSunLon(w0, jd0 + d0 / 0.9856);
    let jdB = solveSunLon(degnorm(w0 + ww), jdA + ww / 0.9856);
    if (jdB <= jdA) jdB = jdA + ww / 0.9856;
    // ② 慢行星按 gate 杀年份（窗口中点一次采样；line 留给精验）
    const mid = allBodies((jdA + jdB) / 2);
    let alive = true;
    for (const k of SLOW) {
      const t = pT[k]; if (!t || !t.gate) continue;
      if (longitudeToGateLine(mid[k].lon).gate !== t.gate) { alive = false; break; }
    }
    if (!alive) continue;
    // ③ 窗内扫描：月亮先行（单天体便宜），命中再全验（含设计）
    let runStart = null; const runs = [];
    const probe = (jd) => {
      if (moonT && !matchOne(longitudeToGateLine(lonSpeed('Moon', jd).lon), moonT)) return false;
      return fullMatch(jd, pT, dT, wd);
    };
    for (let jd = jdA; jd <= jdB + 1e-9; jd += STEP) {
      const ok = probe(jd);
      if (ok && runStart == null) runStart = jd;
      if (!ok && runStart != null) { runs.push([runStart, jd - STEP]); runStart = null; }
    }
    if (runStart != null) runs.push([runStart, jdB]);
    // ④ 边界二分到 ~36 秒精度
    for (const [a, b] of runs) {
      const lo = bisect(a - STEP, a, pT, dT, wd, true);
      const hi = bisect(b, b + STEP, pT, dT, wd, false);
      results.push({ jdStart: lo, jdEnd: hi });
      if (results.length >= maxResults) return results;
    }
    if (y % 4 === 0) await new Promise(r => setTimeout(r)); // 让出主线程刷进度
  }
  return results;
}

// JD(UT) → 指定时区的本地时间串 "YYYY-MM-DD HH:MM"
export function jdToLocal(jd, tz) {
  const d = new Date((jd - 2440587.5) * 86400000);
  try { return d.toLocaleString('sv-SE', { timeZone: tz, hour12: false }).slice(0, 16); }
  catch (e) { return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
}
