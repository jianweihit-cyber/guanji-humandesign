// chart.js — 排盘编排：输入 → 时区/UTC → 儒略日 → 两层星历 → 推导排盘
import {
  initEphemeris, julianDayUT, allBodies, solveDesignJD,
  setEphemerisMode, setNodeType, getConfig,
} from './ephemeris.js';
import { computeChart } from './hd-core.js';

// 某瞬间(UTC Date)在某 IANA 时区的偏移(分钟)
function tzOffsetMinutes(utcDate, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(utcDate)) p[part.type] = part.value;
  let hour = p.hour === '24' ? 0 : Number(p.hour);
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hour, +p.minute, +p.second);
  return (asUTC - utcDate.getTime()) / 60000;
}

// 本地时间 → UTC 各分量。opts: { tz:'Asia/Shanghai' } 或 { tzOffset: 8 }
export function localToUTCParts(y, mo, d, h, mi, s, opts) {
  let ms;
  if (opts.tzOffset != null) {
    ms = Date.UTC(y, mo - 1, d, h, mi, s) - opts.tzOffset * 3600 * 1000;
  } else if (opts.tz) {
    const naive = Date.UTC(y, mo - 1, d, h, mi, s);
    let off = tzOffsetMinutes(new Date(naive), opts.tz);  // 初估
    ms = naive - off * 60000;
    off = tzOffsetMinutes(new Date(ms), opts.tz);          // 修正一次(处理夏令时切换)
    ms = naive - off * 60000;
  } else {
    throw new Error('需要 tz(IANA) 或 tzOffset(小时)');
  }
  const u = new Date(ms);
  return {
    parts: [u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(),
            u.getUTCHours(), u.getUTCMinutes(), u.getUTCSeconds()],
    iso: u.toISOString(),
  };
}

export async function generateChart(input) {
  await initEphemeris();
  if (input.ephemerisMode) setEphemerisMode(input.ephemerisMode);
  if (input.nodeType) setNodeType(input.nodeType);

  const { parts, iso } = localToUTCParts(
    input.year, input.month, input.day, input.hour, input.minute, input.second || 0, input,
  );
  const [Y, Mo, D, H, Mi, S] = parts;
  const birthJD = julianDayUT(Y, Mo, D, H, Mi, S);

  const personalityBodies = allBodies(birthJD);
  const design = solveDesignJD(birthJD);
  const designBodies = allBodies(design.jd);

  const chart = computeChart({ personalityBodies, designBodies });
  return {
    input,
    utc: { iso, parts },
    birthJD,
    designJD: design.jd,
    designDaysBefore: birthJD - design.jd,
    config: getConfig(),
    ...chart,
  };
}
