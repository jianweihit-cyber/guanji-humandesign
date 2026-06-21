// make-ref-report.js — 用 HumanDesignApp 截图反推的 gate.line 出参考案例排盘卡数据
// 用法: node test/make-ref-report.js [li|hu|chen]
import { writeFileSync } from 'node:fs';
import { computeChart } from '../src/hd-core.js';
import { GATE_ORDER, WHEEL_START, GATE_ARC, LINE_ARC } from '../src/hd-data.js';

const PORDER = ['Sun','Earth','Moon','NorthNode','SouthNode','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const gl2lon = (g, l) => { const i = GATE_ORDER.indexOf(g); return (WHEEL_START + i * GATE_ARC + (l - 1) * LINE_ARC + LINE_ARC / 2) % 360; };
const bodies = list => { const o = {}; PORDER.forEach((p, i) => { const [g, l] = String(list[i]).split('.').map(Number); o[p] = { lon: gl2lon(g, l) }; }); return o; };

const CASES = {
  li:   { label: '对标 · Li Jianhua（显示者 4/6）',
    d: ['26.6','45.6','8.6','51.5','57.5','9.1','44.4','63.2','63.4','5.3','26.6','58.2','44.2'],
    p: ['22.4','47.4','56.3','21.3','48.3','55.1','19.2','24.6','25.4','26.5','11.5','58.5','44.3'] },
  hu:   { label: '对标 · Hu Yang（显示生产者 5/1）',
    d: ['43.1','23.1','32.5','34.4','20.4','28.6','28.2','34.3','50.5','49.6','54.5','54.5','14.1'],
    p: ['13.5','7.5','10.4','14.6','8.6','37.1','49.5','41.6','1.1','55.1','61.4','61.2','14.4'] },
  chen: { label: '对标 · Chen Ye（反映者 4/6）',
    d: ['11.6','12.6','46.1','13.5','7.5','54.3','41.3','34.2','52.4','38.6','58.2','38.3','1.4'],
    p: ['36.4','6.4','14.4','13.3','7.3','36.2','19.3','41.3','15.4','61.3','58.6','38.6','1.5'] },
};
const key = process.argv[2] || 'hu';
const c = CASES[key];
const chart = computeChart({ personalityBodies: bodies(c.p), designBodies: bodies(c.d) });
writeFileSync(new URL('../web/report-data.js', import.meta.url), 'window.HD_CHART=' + JSON.stringify({ label: c.label, chart }) + ';\n');
console.log('写入 ✓', c.label, '|', chart.typeZh, chart.authority, chart.profile.str, chart.definitionZh, '| 通道', chart.definedChannels.map(x => x.key).join(','));
