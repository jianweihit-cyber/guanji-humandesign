// make-report.js — 生成命盘卡数据 web/report-data.js（供 report.html 出图）
import { writeFileSync } from 'node:fs';
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';

// 对标案例：HumanDesignApp.com 的 Mumbai 1979-01-20 12:00（逐项已校准一致）
const input = { year: 1979, month: 1, day: 20, hour: 12, minute: 0, tz: 'Asia/Kolkata' };
const c = await generateChart(input);
const label = `对标案例 · 1979-01-20 12:00 · Mumbai`;
writeFileSync(new URL('../web/report-data.js', import.meta.url), 'window.HD_CHART=' + JSON.stringify({ label, chart: c }) + ';\n');
console.log('写入 web/report-data.js ✓', label, '|', c.typeZh, c.profile.str, c.definitionZh, '| 通道', c.definedChannels.map(x=>x.key).join(','));
closeEphemeris();
