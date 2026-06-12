// hd-data.js — 人类图权威常量表
// 轮序 gateOrder 取自 hdkit(MIT)并已与「水瓶座 60→41→19→13→49」校验一致；
// 36 通道 / 9 中心 / 闸门→中心 为本项目自建权威版（hdkit 的 ChatGPT 转写版有错，不采用）。

// ── 生命罗盘几何 ──────────────────────────────────────────
// 41 号闸门起于「水瓶座 2°00′00″」= 黄经 302°；沿黄经增大方向排列。
export const WHEEL_START = 302;       // 度
export const GATE_ARC = 360 / 64;     // 5.625°
export const LINE_ARC = GATE_ARC / 6; // 0.9375°
export const COLOR_ARC = LINE_ARC / 6;
export const TONE_ARC = COLOR_ARC / 6;
export const BASE_ARC = TONE_ARC / 5;

export const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

// ── 九大中心 ─────────────────────────────────────────────
// type: pressure 压力 / awareness 觉知 / motor 马达 / throat 表达 / identity 自我
// motor: 是否为四大马达之一（荐骨/情绪/意志/根）
export const CENTERS = {
  Head:        { zh: '头脑中心',   type: 'pressure',  motor: false },
  Ajna:        { zh: '逻辑中心',   type: 'awareness', motor: false },
  Throat:      { zh: '喉咙中心',   type: 'throat',    motor: false },
  G:           { zh: 'G中心(自我)', type: 'identity',  motor: false },
  Heart:       { zh: '意志力中心', type: 'motor',     motor: true  }, // Ego / Will
  Sacral:      { zh: '荐骨中心',   type: 'motor',     motor: true  },
  SolarPlexus: { zh: '情绪中心',   type: 'motor',     motor: true  }, // 也是觉知中心
  Spleen:      { zh: '直觉中心',   type: 'awareness', motor: false },
  Root:        { zh: '根部中心',   type: 'motor',     motor: true  }, // 也是压力中心
};
export const MOTOR_CENTERS = ['Sacral', 'SolarPlexus', 'Heart', 'Root'];

// ── 36 通道 ──────────────────────────────────────────────
// {gates:[a,b], centers:[X,Y], zh, en}
export const CHANNELS = [
  { gates: [1, 8],   centers: ['G', 'Throat'],            zh: '灵感通道',   en: 'Inspiration' },
  { gates: [2, 14],  centers: ['G', 'Sacral'],            zh: '律动通道',   en: 'The Beat' },
  { gates: [3, 60],  centers: ['Sacral', 'Root'],         zh: '突变通道',   en: 'Mutation' },
  { gates: [4, 63],  centers: ['Ajna', 'Head'],           zh: '逻辑通道',   en: 'Logic' },
  { gates: [5, 15],  centers: ['Sacral', 'G'],            zh: '韵律通道',   en: 'Rhythm' },
  { gates: [6, 59],  centers: ['SolarPlexus', 'Sacral'],  zh: '亲密通道',   en: 'Mating' },
  { gates: [7, 31],  centers: ['G', 'Throat'],            zh: '领导通道',   en: 'The Alpha' },
  { gates: [9, 52],  centers: ['Sacral', 'Root'],         zh: '专注通道',   en: 'Concentration' },
  { gates: [10, 20], centers: ['G', 'Throat'],            zh: '觉醒通道',   en: 'Awakening' },
  { gates: [10, 34], centers: ['G', 'Sacral'],            zh: '探索通道',   en: 'Exploration' },
  { gates: [10, 57], centers: ['G', 'Spleen'],            zh: '完美形体通道', en: 'Perfected Form' },
  { gates: [11, 56], centers: ['Ajna', 'Throat'],         zh: '好奇通道',   en: 'Curiosity' },
  { gates: [12, 22], centers: ['Throat', 'SolarPlexus'],  zh: '开放通道',   en: 'Openness' },
  { gates: [13, 33], centers: ['G', 'Throat'],            zh: '浪子通道',   en: 'The Prodigal' },
  { gates: [16, 48], centers: ['Throat', 'Spleen'],       zh: '波长通道',   en: 'The Wavelength' },
  { gates: [17, 62], centers: ['Ajna', 'Throat'],         zh: '接纳通道',   en: 'Acceptance' },
  { gates: [18, 58], centers: ['Spleen', 'Root'],         zh: '评判通道',   en: 'Judgment' },
  { gates: [19, 49], centers: ['Root', 'SolarPlexus'],    zh: '综合通道',   en: 'Synthesis' },
  { gates: [20, 34], centers: ['Throat', 'Sacral'],       zh: '魅力通道',   en: 'Charisma' },
  { gates: [20, 57], centers: ['Throat', 'Spleen'],       zh: '脑波通道',   en: 'The Brainwave' },
  { gates: [21, 45], centers: ['Heart', 'Throat'],        zh: '金钱通道',   en: 'Money' },
  { gates: [23, 43], centers: ['Throat', 'Ajna'],         zh: '架构通道',   en: 'Structuring' },
  { gates: [24, 61], centers: ['Ajna', 'Head'],           zh: '觉知通道',   en: 'Awareness' },
  { gates: [25, 51], centers: ['G', 'Heart'],             zh: '启蒙通道',   en: 'Initiation' },
  { gates: [26, 44], centers: ['Heart', 'Spleen'],        zh: '臣服通道',   en: 'Surrender' },
  { gates: [27, 50], centers: ['Sacral', 'Spleen'],       zh: '守护通道',   en: 'Preservation' },
  { gates: [28, 38], centers: ['Spleen', 'Root'],         zh: '挣扎通道',   en: 'Struggle' },
  { gates: [29, 46], centers: ['Sacral', 'G'],            zh: '发现通道',   en: 'Discovery' },
  { gates: [30, 41], centers: ['SolarPlexus', 'Root'],    zh: '识别通道',   en: 'Recognition' },
  { gates: [32, 54], centers: ['Spleen', 'Root'],         zh: '蜕变通道',   en: 'Transformation' },
  { gates: [34, 57], centers: ['Sacral', 'Spleen'],       zh: '力量通道',   en: 'Power' },
  { gates: [35, 36], centers: ['Throat', 'SolarPlexus'],  zh: '无常通道',   en: 'Transitoriness' },
  { gates: [37, 40], centers: ['SolarPlexus', 'Heart'],   zh: '社群通道',   en: 'Community' },
  { gates: [39, 55], centers: ['Root', 'SolarPlexus'],    zh: '情绪通道',   en: 'Emoting' },
  { gates: [42, 53], centers: ['Sacral', 'Root'],         zh: '成熟通道',   en: 'Maturation' },
  { gates: [47, 64], centers: ['Ajna', 'Head'],           zh: '抽象通道',   en: 'Abstraction' },
];

// 闸门→中心（由通道表推导 + 自检：每门只属一个中心）
export const GATE_CENTER = (() => {
  const m = {};
  for (const ch of CHANNELS) {
    const [ga, gb] = ch.gates;
    const [ca, cb] = ch.centers;
    for (const [g, c] of [[ga, ca], [gb, cb]]) {
      if (m[g] && m[g] !== c) throw new Error(`闸门${g} 中心冲突: ${m[g]} vs ${c}`);
      m[g] = c;
    }
  }
  return m;
})();

// ── 13 天体（每层）显示信息 ───────────────────────────────
export const PLANETS = [
  { key: 'Sun',       glyph: '☉', zh: '太阳',   en: 'Sun' },
  { key: 'Earth',     glyph: '⨁', zh: '地球',   en: 'Earth' },
  { key: 'Moon',      glyph: '☽', zh: '月亮',   en: 'Moon' },
  { key: 'NorthNode', glyph: '☊', zh: '北交点', en: 'North Node' },
  { key: 'SouthNode', glyph: '☋', zh: '南交点', en: 'South Node' },
  { key: 'Mercury',   glyph: '☿', zh: '水星',   en: 'Mercury' },
  { key: 'Venus',     glyph: '♀', zh: '金星',   en: 'Venus' },
  { key: 'Mars',      glyph: '♂', zh: '火星',   en: 'Mars' },
  { key: 'Jupiter',   glyph: '♃', zh: '木星',   en: 'Jupiter' },
  { key: 'Saturn',    glyph: '♄', zh: '土星',   en: 'Saturn' },
  { key: 'Uranus',    glyph: '♅', zh: '天王星', en: 'Uranus' },
  { key: 'Neptune',   glyph: '♆', zh: '海王星', en: 'Neptune' },
  { key: 'Pluto',     glyph: '♇', zh: '冥王星', en: 'Pluto' },
];

// ── 类型 / 策略 / 签名 / 非自己主题 ───────────────────────
export const TYPE_INFO = {
  'Generator':             { zh: '生产者',     strategy: '等待，然后回应', signature: '满足', notSelf: '挫败' },
  'Manifesting Generator': { zh: '显化生产者', strategy: '等待回应，再告知', signature: '满足', notSelf: '挫败 / 愤怒' },
  'Manifestor':            { zh: '显示者',     strategy: '行动前告知',     signature: '平和', notSelf: '愤怒' },
  'Projector':             { zh: '投射者',     strategy: '等待被邀请',     signature: '成功', notSelf: '苦涩' },
  'Reflector':             { zh: '反映者',     strategy: '等待一个月亮周期', signature: '惊喜', notSelf: '失望' },
};

// ── 内在权威 ─────────────────────────────────────────────
export const AUTHORITY_ZH = {
  Emotional: '情绪权威（等待情绪清明）',
  Sacral: '荐骨权威（当下的身体回应）',
  Splenic: '直觉权威（当下一次性的直觉）',
  Ego: '自我/意志力权威',
  SelfProjected: '自我投射权威（说出来听自己的声音）',
  Mental: '心智/环境权威（无内在权威·需正确环境与人讨论）',
  Lunar: '月亮权威（一个月亮周期）',
};

// ── 人生角色 Profile → 轮回交叉角度 ───────────────────────
// key = `${个性日爻}/${设计日爻}`
export const PROFILE_ANGLE = {
  '1/3': 'Right Angle', '1/4': 'Right Angle',
  '2/4': 'Right Angle', '2/5': 'Right Angle',
  '3/5': 'Right Angle', '3/6': 'Right Angle',
  '4/6': 'Right Angle',
  '4/1': 'Juxtaposition',
  '5/1': 'Left Angle', '5/2': 'Left Angle',
  '6/2': 'Left Angle', '6/3': 'Left Angle',
};
export const ANGLE_ZH = {
  'Right Angle': '右角度交叉（个人命运）',
  'Juxtaposition': '并列交叉（固定命运）',
  'Left Angle': '左角度交叉（人际/业力命运）',
};
export const PROFILE_ZH = {
  1: '探究者', 2: '隐士', 3: '烈士', 4: '机会主义者', 5: '异端者', 6: '人生导师',
};

// ── PHS / Variable（四箭头）名表 ───────────────────────────
// 推导(对标 SharpAstrology + 用户案例验证)：
//   Determination=设计☉颜色 · Cognition=设计☉音调 · Environment=设计北交点颜色
//   Motivation=个性☉颜色 · View=个性北交点颜色 · 箭头朝向=各自音调(1-3 Left / 4-6 Right)
export const PHS_NAMES = {
  determination: ['Appetite', 'Taste', 'Thirst', 'Touch', 'Sound', 'Light'],        // by color 1-6
  cognition:     ['Smell', 'Taste', 'Outer Vision', 'Inner Vision', 'Feeling', 'Touch'], // by tone 1-6
  environment:   ['Caves', 'Markets', 'Kitchens', 'Mountains', 'Valleys', 'Shores'], // by color 1-6
  motivation:    ['Fear', 'Hope', 'Desire', 'Need', 'Guilt', 'Innocence'],          // by color 1-6
  view:          ['Survival', 'Possibility', 'Power', 'Wanting', 'Probability', 'Personal'], // by color 1-6
};

// PHS 左右具体型名（用户提供的参考表）：每变量按 Color 1-6 给 [左型, 右型]，
// 实际取哪侧由 Tone 决定（1-3 → 左 / 4-6 → 右）。每型 = [en, zh]
export const PHS_LR = {
  determination: [ // 饮食 · 设计 ☉/⊕
    [['Consecutive','连续型'],['Alternating','交替型']],
    [['Open','开放型'],['Closed','封闭型']],
    [['Hot','热食型'],['Cold','冷食型']],
    [['Calm','平静型'],['Stimulating','刺激型']],
    [['High','高频型'],['Low','低频型']],
    [['Direct','直接型'],['Indirect','间接型']],
  ],
  environment: [ // 环境 · 设计 ☊/☋
    [['Selective','选择型'],['Blending','混合型']],
    [['Internal','内部型'],['External','外部型']],
    [['Hot/Wet','湿热型'],['Cool/Dry','干冷型']],
    [['Active','主动型'],['Passive','被动型']],
    [['Narrow','狭窄型'],['Wide','宽阔型']],
    [['Natural','天然型'],['Artificial','人造型']],
  ],
  motivation: [ // 动机 · 个性 ☉/⊕（左=Strategic / 右=Receptive）
    [['Communalist','民主'],['Separatist','独立']],
    [['Theist','有神'],['Anti-theist','无神']],
    [['Leader','领导'],['Follower','跟随']],
    [['Master','大师'],['Novice','新手']],
    [['Conditioner','制约者'],['Conditioned','被制约']],
    [['Observer','观察者'],['Observed','被观察']],
  ],
  view: [ // 视野 · 个性 ☊/☋（左=Focused / 右=Peripheral）
    [['Communalist','民主'],['Separatist','独立']],
    [['Theist','有神'],['Anti-theist','无神']],
    [['Leader','领导'],['Follower','跟随']],
    [['Master','大师'],['Novice','新手']],
    [['Conditioner','制约者'],['Conditioned','被制约']],
    [['Observer','观察者'],['Observed','被观察']],
  ],
};
// 动机/视野的左右侧别总称
export const PHS_SIDE = {
  motivation: [['Strategic','策略型'],['Receptive','接纳型']],
  view:       [['Focused','聚焦型'],['Peripheral','广角型']],
};
// PHS 中文底名（颜色 1-6）；个性侧 Tone 名（天星表）
export const PHS_ZH = {
  determination: ['食欲','口味','渴望','感触','声音','光线'],
  cognition:     ['嗅觉','味觉','外在视觉','内在视觉','感觉','触觉'],
  environment:   ['洞穴','市场','厨房','高山','谷地','海岸'],
  motivation:    ['求存/恐惧','希望/可能性','欲望/渴望','需求/想要','内疚/罪恶感','纯真'],
  view:          ['求存','可能性','权力','想要','可行性/机率','个人'],
};
export const PHS_PTONES = [['Security','安全感'],['Uncertainty','可能性'],['Action','行动'],['InnerVision','想象力/内观'],['Feeling','评估'],['Touch','接受']]; // 个性侧 Tone 1-6

// 易经卦名（英文，来自 hdkit；中文卦名后续补）+ HD 闸门名
export const GATE_ICHING = {
  1:'The Creative',2:'The Receptive',3:'Difficulties at the Beginning',4:'Youthful Folly',5:'Waiting',6:'Conflict',7:'The Army',8:'Holding Together',9:'The Taming Power of the Small',10:'Treading',11:'Peace',12:'Standstill',13:'The Fellowship of Man',14:'Possession in Great Measure',15:'Modesty',16:'Enthusiasm',17:'Following',18:'Work on What Has Been Spoilt',19:'Approach',20:'Contemplation',21:'Biting Through',22:'Grace',23:'Splitting Apart',24:'Returning',25:'Innocence',26:'The Taming Power of the Great',27:'Nourishment',28:'Preponderance of the Great',29:'The Abysmal',30:'The Clinging Fire',31:'Influence',32:'Duration',33:'Retreat',34:'The Power of the Great',35:'Progress',36:'Darkening of the Light',37:'The Family',38:'Opposition',39:'Obstruction',40:'Deliverance',41:'Decrease',42:'Increase',43:'Breakthrough',44:'Coming to Meet',45:'Gathering Together',46:'Pushing Upward',47:'Oppression',48:'The Well',49:'Revolution',50:'The Cauldron',51:'The Arousing',52:'Keeping Still',53:'Development',54:'The Marrying Maiden',55:'Abundance',56:'The Wanderer',57:'The Gentle',58:'The Joyous',59:'Dispersion',60:'Limitation',61:'Inner Truth',62:'Preponderance of the Small',63:'After Completion',64:'Before Completion',
};
