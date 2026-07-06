// ephemeris.js — 星历抽象层（人类图引擎）
// 用 swisseph-wasm（瑞士星历表 WASM）。
//   · 默认 MOSEPH(Moshier)：纯算法、无需数据文件、离线、许可干净   —— B 路线
//   · 可切 SWIEPH(JPL)：随包自带 swisseph.data，离线最高精度          —— A 路线
// 切换只改一个 flag —— 这就是「先 B，留好切 A 口子」的接缝。
import SwissEph from 'swisseph-wasm';

// 人类图每一层的 13 个激活，顺序固定（个性层/设计层各一份）
export const HD_BODIES = [
  'Sun', 'Earth', 'NorthNode', 'SouthNode', 'Moon',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

let swe = null;
let MODE = 'MOSEPH';   // 'MOSEPH' | 'SWIEPH'
let NODE = 'TRUE';     // 'TRUE' | 'MEAN'（月交点；HD 主流用真交点）

export function setEphemerisMode(mode) { MODE = mode; }
export function setNodeType(t) { NODE = t; }
export function getConfig() { return { mode: MODE, node: NODE }; }

let sweP = null;   // 初始化 Promise 缓存：并发调用共享同一次 init（否则第二个调用拿到未就绪实例 → ccall undefined）
export async function initEphemeris() {
  if (!sweP) {
    sweP = (async () => { const s = new SwissEph(); await s.initSwissEph(); swe = s; return s; })()
      .catch((e) => { sweP = null; throw e; });   // 失败允许重试
  }
  return sweP;
}

export function degnorm(x) { return ((x % 360) + 360) % 360; }

function calcFlags() {
  const base = MODE === 'SWIEPH' ? swe.SEFLG_SWIEPH : swe.SEFLG_MOSEPH;
  return base | swe.SEFLG_SPEED;
}

// UT 公历 → 儒略日(UT)
export function julianDayUT(y, mo, d, h = 0, mi = 0, s = 0) {
  return swe.julday(y, mo, d, h + mi / 60 + s / 3600);
}

function bodyCode(name) {
  switch (name) {
    case 'Sun': return swe.SE_SUN;
    case 'Moon': return swe.SE_MOON;
    case 'Mercury': return swe.SE_MERCURY;
    case 'Venus': return swe.SE_VENUS;
    case 'Mars': return swe.SE_MARS;
    case 'Jupiter': return swe.SE_JUPITER;
    case 'Saturn': return swe.SE_SATURN;
    case 'Uranus': return swe.SE_URANUS;
    case 'Neptune': return swe.SE_NEPTUNE;
    case 'Pluto': return swe.SE_PLUTO;
    case 'NorthNode': return NODE === 'MEAN' ? swe.SE_MEAN_NODE : swe.SE_TRUE_NODE;
    default: return null;
  }
}

// 单个天体的黄经(回归·地心) + 速度(度/天)
export function lonSpeed(name, jd) {
  if (name === 'Earth') {            // 地球 = 太阳 + 180°
    const s = lonSpeed('Sun', jd);
    return { lon: degnorm(s.lon + 180), speed: s.speed };
  }
  if (name === 'SouthNode') {        // 南交点 = 北交点 + 180°
    const n = lonSpeed('NorthNode', jd);
    return { lon: degnorm(n.lon + 180), speed: n.speed };
  }
  const r = swe.calc_ut(jd, bodyCode(name), calcFlags());
  if (!r || typeof r[0] !== 'number' || Number.isNaN(r[0])) {
    throw new Error(`calc_ut 失败: ${name} @ jd=${jd} -> ${JSON.stringify(r)}`);
  }
  return { lon: degnorm(r[0]), speed: r[3] };
}

// 一层的全部 13 天体
export function allBodies(jd) {
  const out = {};
  for (const b of HD_BODIES) out[b] = lonSpeed(b, jd);
  return out;
}

// 求解「设计时刻」：太阳黄经正好比出生时少 88°00′00″（约出生前 89 天）
// 牛顿法，用太阳速度收敛；返回 {jd, sunBirth, sunDesign}
export function solveDesignJD(birthJD) {
  const sunB = lonSpeed('Sun', birthJD).lon;
  const target = degnorm(sunB - 88);
  let jd = birthJD - 88 / 0.9856;   // 初值
  let last = jd;
  for (let i = 0; i < 12; i++) {
    const { lon, speed } = lonSpeed('Sun', jd);
    let diff = degnorm(lon - target);
    if (diff > 180) diff -= 360;     // 取最短有向角
    if (Math.abs(diff) < 1e-8) break;
    last = jd;
    jd -= diff / speed;              // speed ≈ +0.9856 度/天
  }
  return { jd, sunBirth: sunB, sunDesign: lonSpeed('Sun', jd).lon };
}

export function closeEphemeris() { if (swe) { swe.close(); swe = null; } }
