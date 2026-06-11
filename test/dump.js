// dump.js — 生成样例盘数据给渲染器（写成 JS 全局，file:// 与 http 都能用）
import { writeFileSync, mkdirSync } from 'node:fs';
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';

mkdirSync(new URL('../web', import.meta.url), { recursive: true });

const inputs = {
  obama: { label: '奥巴马 1961-08-04 19:24 檀香山', year: 1961, month: 8, day: 4, hour: 19, minute: 24, tz: 'Pacific/Honolulu' },
  sample: { label: '样例 1990-03-05 13:30 上海', year: 1990, month: 3, day: 5, hour: 13, minute: 30, tz: 'Asia/Shanghai' },
};

const out = {};
for (const [k, v] of Object.entries(inputs)) {
  const c = await generateChart(v);
  out[k] = { label: v.label, chart: c };
}
closeEphemeris();

const js = 'window.SAMPLE_CHARTS = ' + JSON.stringify(out) + ';\n';
writeFileSync(new URL('../web/sample-data.js', import.meta.url), js);
console.log('写入 web/sample-data.js ✓  含:', Object.keys(out).join(', '));
