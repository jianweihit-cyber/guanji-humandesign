// famous.js — 用出生时间可靠 + HD盘有公开记载的名人做外部校准
import { generateChart } from '../src/chart.js';
import { closeEphemeris } from '../src/ephemeris.js';

const cases = [
  // 奥巴马：出生证明公开，时间极可靠；夏威夷不实行夏令时(UTC-10)
  { name: 'Barack Obama', year: 1961, month: 8, day: 4, hour: 19, minute: 24, tz: 'Pacific/Honolulu' },
];

for (const cse of cases) {
  for (const node of ['TRUE', 'MEAN']) {
    const c = await generateChart({ ...cse, nodeType: node });
    console.log(`\n========== ${cse.name}  [node=${node}] ==========`);
    console.log(`UTC ${c.utc.iso} | 设计前 ${c.designDaysBefore.toFixed(2)}天`);
    console.log(`类型 ${c.type} | 权威 ${c.authority} | Profile ${c.profile.str} | 定义 ${c.definition}`);
    console.log(`轮回交叉 ${c.incarnationCross.notation}`);
    console.log(`太阳 个性 ${c.personality[0].gate}.${c.personality[0].line} / 设计 ${c.design[0].gate}.${c.design[0].line}`);
    console.log(`北交点 个性 ${c.personality[2].gate}.${c.personality[2].line} / 设计 ${c.design[2].gate}.${c.design[2].line}`);
    console.log(`已定义中心: ${c.definedCenters.join(', ')}`);
    console.log(`通道: ${c.definedChannels.map((x) => x.key).join(', ')}`);
  }
}
closeEphemeris();
