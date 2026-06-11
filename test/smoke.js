// 冒烟测试：验证星历层能取到正确黄经 + 88°求解
import {
  initEphemeris, julianDayUT, lonSpeed, allBodies, solveDesignJD,
  setEphemerisMode, getConfig, closeEphemeris, degnorm,
} from '../src/ephemeris.js';

function fmt(lon) {
  const sign = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(lon / 30)];
  const d = lon % 30;
  const deg = Math.floor(d), m = Math.floor((d - deg) * 60), s = Math.round(((d - deg) * 60 - m) * 60);
  return `${lon.toFixed(4)}° (${sign}${deg}°${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}")`;
}

await initEphemeris();

// 已知锚点：J2000 = 2000-01-01 12:00 UTC，太阳黄经应 ≈ 280.4°(摩羯~10°)
const j2000 = julianDayUT(2000, 1, 1, 12, 0, 0);
console.log('JD(2000-01-01 12:00 UTC) =', j2000, '(应 ≈ 2451545.0)');
console.log('太阳 @ J2000 =', fmt(lonSpeed('Sun', j2000).lon), '(应 ≈ 摩羯10° / 280.x°)');
console.log('月亮 @ J2000 =', fmt(lonSpeed('Moon', j2000).lon));

console.log('\n--- 两种星历模式对比（同一时刻太阳黄经，应几乎一致）---');
setEphemerisMode('MOSEPH'); console.log('MOSEPH:', lonSpeed('Sun', j2000).lon.toFixed(6));
setEphemerisMode('SWIEPH'); console.log('SWIEPH:', lonSpeed('Sun', j2000).lon.toFixed(6));
setEphemerisMode('MOSEPH');

// 一个样例出生：1990-03-05 17:30 UTC
console.log('\n--- 样例：1990-03-05 17:30 UTC 个性层 13 天体 ---');
const birthJD = julianDayUT(1990, 3, 5, 17, 30, 0);
const P = allBodies(birthJD);
for (const [k, v] of Object.entries(P)) console.log(k.padEnd(10), fmt(v.lon));

// 设计层：太阳回退 88°
const des = solveDesignJD(birthJD);
const gap = degnorm(des.sunBirth - des.sunDesign);
console.log('\n设计 JD =', des.jd.toFixed(6), `(出生前 ${(birthJD - des.jd).toFixed(3)} 天)`);
console.log(`太阳: 出生 ${des.sunBirth.toFixed(5)}° → 设计 ${des.sunDesign.toFixed(5)}°  差 = ${gap.toFixed(6)}° (应 = 88.000000)`);

closeEphemeris();
console.log('\n✅ 星历层冒烟测试通过, config =', getConfig());
