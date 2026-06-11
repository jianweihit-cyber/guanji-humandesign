// logic-check.js — 用 HumanDesignApp 截图的 26 个 gate.line 反推，验证类型/权威/Profile/定义推导
// （不走星历，直接由 gate.line→黄经→computeChart，专测推导分支：显示者/MG/反映者等）
import { computeChart } from '../src/hd-core.js';
import { GATE_ORDER, WHEEL_START, GATE_ARC, LINE_ARC } from '../src/hd-data.js';

const PORDER = ['Sun','Earth','Moon','NorthNode','SouthNode','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const gl2lon = (g, l) => { const i = GATE_ORDER.indexOf(g); return (WHEEL_START + i * GATE_ARC + (l - 1) * LINE_ARC + LINE_ARC / 2) % 360; };
const parse = gl => { const [g, l] = String(gl).split('.').map(Number); return { lon: gl2lon(g, l) }; };
function bodies(list) { const o = {}; PORDER.forEach((p, i) => o[p] = parse(list[i])); return o; }

// [design[13], personality[13]] in panel order
const CASES = [
  { name: 'Li Jianhua', type: 'Manifestor', authority: 'Splenic', profile: '4/6', def: 'Single',
    d: ['26.6','45.6','8.6','51.5','57.5','9.1','44.4','63.2','63.4','5.3','26.6','58.2','44.2'],
    p: ['22.4','47.4','56.3','21.3','48.3','55.1','19.2','24.6','25.4','26.5','11.5','58.5','44.3'] },
  { name: 'Hu Yang', type: 'Manifesting Generator', authority: 'Sacral', profile: '5/1', def: 'Split',
    d: ['43.1','23.1','32.5','34.4','20.4','28.6','28.2','34.3','50.5','49.6','54.5','54.5','14.1'],
    p: ['13.5','7.5','10.4','14.6','8.6','37.1','49.5','41.6','1.1','55.1','61.4','61.2','14.4'] },
  { name: 'Chen Ye', type: 'Reflector', authority: 'Lunar', profile: '4/6', def: 'None',
    d: ['11.6','12.6','46.1','13.5','7.5','54.3','41.3','34.2','52.4','38.6','58.2','38.3','1.4'],
    p: ['36.4','6.4','14.4','13.3','7.3','36.2','19.3','41.3','15.4','61.3','58.6','38.6','1.5'] },
];

let pass = 0, fail = 0;
const ck = (n, got, want) => { const ok = got === want; console.log(`  ${ok ? '✅' : '❌'} ${n}: ${got}${ok ? '' : ` (期望 ${want})`}`); ok ? pass++ : fail++; };
for (const c of CASES) {
  const chart = computeChart({ personalityBodies: bodies(c.p), designBodies: bodies(c.d) });
  console.log(`\n== ${c.name} ==  通道: ${chart.definedChannels.map(x => x.key).join(', ') || '无'}`);
  ck('类型', chart.type, c.type);
  ck('权威', chart.authority, c.authority);
  ck('Profile', chart.profile.str, c.profile);
  ck('定义', chart.definition, c.def);
}
console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
