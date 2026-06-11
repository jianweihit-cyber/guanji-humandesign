// build-crosses.js — 解析 SharpAstrology 源码的 192 项 switch → src/hd-crosses.js
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../_reference/sharp/IncarnationCross.cs', import.meta.url), 'utf8');

const re = /\(Gates\.Key(\d+),\s*Angles\.(Right|Left|Juxtaposition)\)\s*=>\s*IncarnationCrosses\.(\w+)/g;
const CROSSES = { Right: {}, Left: {}, Juxtaposition: {} };
let n = 0, m;
function display(enumName) {
  const mm = enumName.match(/^(RightAngle|LeftAngle|Juxtaposition)CrossOf(.+?)(\d+)?$/);
  const angle = { RightAngle: 'Right Angle', LeftAngle: 'Left Angle', Juxtaposition: 'Juxtaposition' }[mm[1]];
  let theme = mm[2].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  theme = theme.replace(/^The /, 'the ');
  let num = '';
  if (mm[1] !== 'Juxtaposition') num = ' ' + (mm[3] || '1');   // 右/左角度按四象限编号1-4
  else if (mm[3]) num = ' ' + mm[3];
  return `The ${angle} Cross of ${theme}${num}`;
}
while ((m = re.exec(src))) { CROSSES[m[2]][+m[1]] = display(m[3]); n++; }

writeFileSync(new URL('../src/hd-crosses.js', import.meta.url),
  '// hd-crosses.js — 192 轮回交叉英文名（解析自 SharpAstrology MIT，键=个性太阳闸门）\n' +
  'export const CROSSES = ' + JSON.stringify(CROSSES, null, 0) + ';\n');

console.log(`解析 ${n} 项 → src/hd-crosses.js`);
console.log('Right[60] =', CROSSES.Right[60], '(应=Right Angle Cross of Laws 4)');
console.log('Right[3]  =', CROSSES.Right[3]);
console.log('计数  Right', Object.keys(CROSSES.Right).length, 'Left', Object.keys(CROSSES.Left).length, 'Juxta', Object.keys(CROSSES.Juxtaposition).length);
