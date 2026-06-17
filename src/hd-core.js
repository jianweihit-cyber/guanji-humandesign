// hd-core.js — 人类图推导引擎（纯逻辑，输入黄经，不依赖星历实现）
import {
  WHEEL_START, GATE_ARC, LINE_ARC, COLOR_ARC, TONE_ARC, BASE_ARC,
  GATE_ORDER, CENTERS, MOTOR_CENTERS, CHANNELS, GATE_CENTER, PLANETS,
  TYPE_INFO, AUTHORITY_ZH, PROFILE_ANGLE, ANGLE_ZH, PROFILE_ZH, GATE_ICHING, PHS_NAMES,
  PHS_LR, PHS_SIDE, PHS_ZH,
} from './hd-data.js';
import { CROSSES } from './hd-crosses.js';
import { CROSSES_ZH } from './hd-crosses-zh.js';
import { CHANNEL_INFO } from './hd-book-data.js';

const degnorm = (x) => ((x % 360) + 360) % 360;

// 黄经 → 闸门/爻/颜色/音调/基调
export function longitudeToGateLine(lon) {
  const off = degnorm(lon - WHEEL_START);
  const gi = Math.floor(off / GATE_ARC);              // 0..63
  const gate = GATE_ORDER[gi];
  let w = off - gi * GATE_ARC;                         // 闸门内偏移 0..5.625
  const line = Math.floor(w / LINE_ARC) + 1;          // 1..6
  w -= (line - 1) * LINE_ARC;
  const color = Math.floor(w / COLOR_ARC) + 1;        // 1..6
  w -= (color - 1) * COLOR_ARC;
  const tone = Math.floor(w / TONE_ARC) + 1;          // 1..6
  w -= (tone - 1) * TONE_ARC;
  const base = Math.floor(w / BASE_ARC) + 1;          // 1..5
  return { gate, line, color, tone, base, center: GATE_CENTER[gate] };
}

// 一层 13 天体黄经 → 激活数组
export function buildActivations(bodies) {
  return PLANETS.map(({ key, glyph, zh, en }) => {
    const { lon } = bodies[key];
    const gl = longitudeToGateLine(lon);
    return { planet: key, glyph, zh, en, lon, ...gl };   // 带出 en，供 EN 模式行星名（North Node/South Node）
  });
}

// 无向图连通分量
function components(nodes, edges) {
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [a, b] of edges) {
    if (adj.has(a) && adj.has(b)) { adj.get(a).push(b); adj.get(b).push(a); }
  }
  const seen = new Set();
  const comps = [];
  for (const n of nodes) {
    if (seen.has(n)) continue;
    const stack = [n], comp = [];
    seen.add(n);
    while (stack.length) {
      const x = stack.pop();
      comp.push(x);
      for (const y of adj.get(x)) if (!seen.has(y)) { seen.add(y); stack.push(y); }
    }
    comps.push(comp);
  }
  return comps;
}

// 从「喉咙」出发，能否经已定义通道到达任一马达中心
function motorToThroat(definedCenters, definedEdges) {
  if (!definedCenters.has('Throat')) return false;
  const adj = new Map([...definedCenters].map((n) => [n, []]));
  for (const [a, b] of definedEdges) { adj.get(a).push(b); adj.get(b).push(a); }
  const seen = new Set(['Throat']); const stack = ['Throat'];
  while (stack.length) {
    const x = stack.pop();
    if (MOTOR_CENTERS.includes(x)) return true;
    for (const y of adj.get(x)) if (!seen.has(y)) { seen.add(y); stack.push(y); }
  }
  return false;
}

// 主入口：个性层 + 设计层黄经 → 完整命盘
export function computeChart({ personalityBodies, designBodies }) {
  const personality = buildActivations(personalityBodies);
  const design = buildActivations(designBodies);

  const pBy = Object.fromEntries(personality.map((a) => [a.planet, a]));
  const dBy = Object.fromEntries(design.map((a) => [a.planet, a]));

  // 激活闸门集合（26 个激活，去重后的闸门）
  const activated = new Set([...personality, ...design].map((a) => a.gate));

  // 已定义通道 / 中心 / 边
  const definedChannels = CHANNELS.filter(
    (ch) => activated.has(ch.gates[0]) && activated.has(ch.gates[1]),
  );
  const definedEdges = definedChannels.map((ch) => ch.centers);
  const definedCenters = new Set(definedEdges.flat());
  const openCenters = Object.keys(CENTERS).filter((c) => !definedCenters.has(c));

  // 类型
  const sacralDefined = definedCenters.has('Sacral');
  const mtt = motorToThroat(definedCenters, definedEdges);
  let type;
  if (sacralDefined) type = mtt ? 'Manifesting Generator' : 'Generator';
  else if (mtt) type = 'Manifestor';
  else if (definedCenters.size === 0) type = 'Reflector';
  else type = 'Projector';
  const ti = TYPE_INFO[type];

  // 内在权威（层级）
  let authority;
  if (definedCenters.has('SolarPlexus')) authority = 'Emotional';
  else if (definedCenters.has('Sacral')) authority = 'Sacral';
  else if (definedCenters.has('Spleen')) authority = 'Splenic';
  else if (definedCenters.has('Heart')) authority = 'Ego';
  else if (definedCenters.has('G')) authority = 'SelfProjected';
  else if (['Throat', 'Ajna', 'Head'].some((c) => definedCenters.has(c))) authority = 'Mental';
  else authority = 'Lunar';

  // 人生角色 Profile = 个性日爻 / 设计日爻
  const pLine = pBy.Sun.line;
  const dLine = dBy.Sun.line;
  const profileStr = `${pLine}/${dLine}`;
  const angle = PROFILE_ANGLE[profileStr] || null; // null = 异常（应为 12 种之一）

  // 轮回交叉：个性日地 + 设计日地（名字按 个性太阳闸门 + 角度 查表）
  const crossGates = [pBy.Sun.gate, pBy.Earth.gate, dBy.Sun.gate, dBy.Earth.gate];
  const angleKey = angle === 'Right Angle' ? 'Right' : angle === 'Left Angle' ? 'Left' : angle === 'Juxtaposition' ? 'Juxtaposition' : null;
  const crossName = angleKey ? (CROSSES[angleKey]?.[pBy.Sun.gate] || null) : null;
  const incarnationCross = {
    angle,
    angleZh: angle ? ANGLE_ZH[angle] : '异常Profile(请校准)',
    name: crossName,
    zhName: angleKey ? (CROSSES_ZH[angleKey]?.[pBy.Sun.gate] || null) : null,
    gates: crossGates,
    notation: `${crossName || (angle ? angle + ' Cross' : 'Cross')} (${crossGates[0]}/${crossGates[1]} | ${crossGates[2]}/${crossGates[3]})`,
  };

  // PHS / Variable 四变量（颜色/音调/箭头朝向）
  const ori = (t) => (t <= 3 ? 'Left' : 'Right');
  const dSun = dBy.Sun, pSun = pBy.Sun, dNode = dBy.NorthNode, pNode = pBy.NorthNode;
  const variables = {
    digestion:   { color: dSun.color, tone: dSun.tone, base: dSun.base, orientation: ori(dSun.tone) }, // 设计☉
    awareness:   { color: pSun.color, tone: pSun.tone, base: pSun.base, orientation: ori(pSun.tone) }, // 个性☉
    environment: { color: dNode.color, tone: dNode.tone, base: dNode.base, orientation: ori(dNode.tone) }, // 设计北交点
    perspective: { color: pNode.color, tone: pNode.tone, base: pNode.base, orientation: ori(pNode.tone) }, // 个性北交点
  };
  // 颜色×朝向 → 左右具体型（含中文底名 / 动机·视野的侧别总称）
  const lr = (sys, gl) => {
    const i = gl.tone <= 3 ? 0 : 1;
    const [en, zh] = PHS_LR[sys][gl.color - 1][i];
    const t = { en, zh, baseZh: PHS_ZH[sys][gl.color - 1] };
    if (PHS_SIDE[sys]) { const [sen, szh] = PHS_SIDE[sys][i]; t.side = { en: sen, zh: szh }; }
    return t;
  };
  const phs = {
    determination: PHS_NAMES.determination[dSun.color - 1],
    cognition: PHS_NAMES.cognition[dSun.tone - 1],
    environment: PHS_NAMES.environment[dNode.color - 1],
    motivation: PHS_NAMES.motivation[pSun.color - 1],
    view: PHS_NAMES.view[pNode.color - 1],
    types: {
      determination: lr('determination', dSun),
      environment: lr('environment', dNode),
      motivation: lr('motivation', pSun),
      view: lr('view', pNode),
    },
    arrows: {
      digestion: variables.digestion.orientation,     // 底-左（设计/身体）
      awareness: variables.awareness.orientation,      // 顶-左（个性/心智·动机）
      environment: variables.environment.orientation,  // 底-右（设计/环境）
      perspective: variables.perspective.orientation,  // 顶-右（个性/视角）
    },
  };

  // 定义（连通分量数）
  const comps = components([...definedCenters], definedEdges);
  const defMap = { 0: 'None', 1: 'Single', 2: 'Split', 3: 'Triple Split', 4: 'Quadruple Split' };
  const defZh = { 0: '无定义', 1: '一分人(单一定义)', 2: '二分人', 3: '三分人', 4: '四分人' };
  const definition = defMap[comps.length] ?? `${comps.length}-Split`;

  return {
    type,
    typeZh: ti.zh,
    strategy: ti.strategy,
    signature: ti.signature,
    notSelf: ti.notSelf,
    authority,
    authorityZh: AUTHORITY_ZH[authority],
    profile: {
      personalityLine: pLine,
      designLine: dLine,
      str: profileStr,
      zh: `${PROFILE_ZH[pLine]} / ${PROFILE_ZH[dLine]}`,
    },
    definition,
    definitionZh: defZh[comps.length] ?? definition,
    incarnationCross,
    definedCenters: [...definedCenters],
    openCenters,
    definedChannels: definedChannels.map((ch) => {
      const key = `${ch.gates[0]}-${ch.gates[1]}`;
      const bi = CHANNEL_INFO[key] || {};   // 书中标准名优先（《区分的科学》）
      return { key, gates: ch.gates, centers: ch.centers, zh: bi.zh ? bi.zh + '通道' : ch.zh, en: bi.en || ch.en };
    }),
    variables,
    phs,
    activatedGates: [...activated].sort((a, b) => a - b),
    personality,
    design,
    meta: { gateName: GATE_ICHING },
  };
}
