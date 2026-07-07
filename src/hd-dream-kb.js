/* hd-dream-kb.js — 梦图 DreamRave 内容库（观己原创改写）
   事实骨架取自官方来源（Ra Uru Hu 讲座 / Jovian Archive / IHDS 公开文本）：
   门名 keynote、爻 keynote、三场性质、睡眠机制均为官方概念；描述文字全部观己白话原创改写，
   不照搬任何原文或第三方 App 文案。90 条「门×爻」正文官方未公开——刻意不编造，
   展示用「门keynote · 爻keynote」组合 + 门白话（诚实的公开基线）。
   来源备忘：jovianarchive.com the-dreamrave / understanding-dreams / Night Forces I 页 + Ra "Dream Rave I" 讲座文本。 */

// —— 15 门梦境 keynote + 观己白话（k=中文keynote ke=英文官方keynote）——
export const DREAM_GATE_KB = {
  // 光之场 Light Field —— 个性水晶的「造梦宣传部」：兜售灵性、美景与出离，不关心身体
  1:  { k: '喜悦', ke: 'Joy',        zh: '梦里无端涌起的欢喜与灵光。它让黑暗变得可以承受——也悄悄告诉你：美好在别处。', en: 'Sudden delight and inner light in dreams — it makes the dark bearable, while whispering that beauty lies elsewhere.' },
  8:  { k: '暗夜', ke: 'Darkness',   zh: '沉坠、无望、被困住的梦。灵魂在体验「撑住形体」的艰难，醒来后对光的渴望会更强。', en: 'Dreams of sinking, hopelessness, being trapped — the spirit enduring the weight of form; you wake craving the light.' },
  20: { k: '视象', ke: 'Sight',      zh: '画面极其鲜活的梦，以及那种「猛然惊醒」。它是把梦境信息带回清醒头脑的加速器。', en: 'Vividly visual dreams and the startled awakening — the speed-agent that ferries dream content back to the waking mind.' },
  57: { k: '谐调', ke: 'Attunement', zh: '梦里「听见」什么——声音、话语、乐句。别急着当作神谕，那是身体在夜里校音。', en: 'Hearing things in dreams — sounds, words, phrases. Not an oracle speaking; the body tuning itself at night.' },
  62: { k: '爱',   ke: 'Love',       zh: '藏在细节里的爱与秩序感。它是一扇「跨维度门户」，也是三大「梦桥门」之一——夜里的印象最容易经它带进白天。', en: 'Love hidden in the details — order and care. A cross-dimensional portal and one of the three bridge-gates; night impressions cross here into your day.' },
  // 地球平面 Earth Plane —— 与全人类清醒意识的接口：白天世界的情绪余波夜里涌入
  5:  { k: '时间', ke: 'Time',       zh: '时间在梦里失去刻度——故人重现、场景错位、似曾相识。这是与众生共享的古老节律。', en: 'Time loses its ruler in dreams — old faces return, scenes shuffle, déjà vu. An ancient rhythm shared with all life.' },
  12: { k: '突变', ke: 'Mutation',   zh: '梦里冒出的新念头、新出路，像旷野里的一声呼喊。也是「梦桥门」，灵感可能随你醒来。', en: 'New ideas and ways out surfacing in dreams, like a voice in the wilderness. A portal-bridge — inspiration may wake with you.' },
  15: { k: '混沌', ke: 'Chaos',      zh: '最杂乱无章的梦在这里：情节跳跃、极端混搭。别解读它，那只是节律的极端摆荡。', en: 'The most jumbled dreams live here — leaping plots, extreme mixes. Don’t decode it; it’s rhythm swinging to extremes.' },
  27: { k: '渴求', ke: 'Yearning',   zh: '「还不够」的梦——追逐、囤积、怕失去。集体的匮乏感夜里也在耳边低语。', en: '“Never enough” dreams — chasing, hoarding, fear of loss. The collective’s scarcity whispering after dark.' },
  50: { k: '欲',   ke: 'Sex',        zh: '欲望与亲密主题的梦。夜里吸收着集体意识的暗流，醒来未必与你本人有关。', en: 'Dreams of desire and intimacy — absorbing the collective undercurrent at night; not necessarily about you.' },
  // 魔域 Demon Realm —— 设计水晶的地界：作用于身体而非头脑，形体的原始驱力
  19: { k: '境地', ke: 'Environments', zh: '陌生或反复出现的场所，甚至「换了一副身体」。也是「梦桥门」，环境的压力感会渗进白天。', en: 'Strange or recurring places, even being in another body. A portal-bridge — environmental pressure can seep into daytime.' },
  28: { k: '恐惧', ke: 'Fear',       zh: '激烈、带恐惧的梦。它其实在替你「放血泄压」——夜里排掉恐惧，白天才轻。', en: 'Intense, fear-laden dreams — a pressure valve draining fear off at night so the day feels lighter.' },
  38: { k: '争斗', ke: 'Aggression', zh: '对抗、搏斗、非赢不可的梦。那是形体在寻找值得一搏的目标，纯粹的身体驱力。', en: 'Dreams of struggle and fight-to-win — the form hunting for a purpose worth the battle; pure body-drive.' },
  42: { k: '消逝', ke: 'Dying',      zh: '梦见死亡与终结，多半不是凶兆——是身体在替你「预演结束」，防止白天被压垮。', en: 'Dreams of death and endings — usually not an omen, but the body rehearsing closure to spare you from overwhelm.' },
  53: { k: '飞翔', ke: 'Flight',     zh: '飞行、穿越、摆脱重量的梦。形体在练习「不被身体困住」的自由感。', en: 'Flying, passing-through, weightless dreams — the form practicing freedom from its own limits.' },
};

// —— 六爻通用梦境 keynote（官方：每一爻跨所有梦境门通用；role=该爻在梦里穿梭的两极「角色」原型，官方 Line-value roles）——
export const DREAM_LINE_KB = {
  1: { k: '秘密', ke: 'Secrets',    zh: '梦里埋着一条不肯明说的线索', en: 'a clue buried, not yet spoken', role: '英雄 / 山羊', roleEn: 'Hero / Goat' },
  2: { k: '占有', ke: 'Possession', zh: '抓住不放、怕失去的底色',     en: 'holding on, fearing the loss', role: '魔术师 · 黑白之间', roleEn: 'Magician · White/Black' },
  3: { k: '动荡', ke: 'Turmoil',    zh: '翻搅不安，逼出新的方向',     en: 'churning unrest forcing a new direction', role: '烈士 / 征服者', roleEn: 'Martyr / Conquerer' },
  4: { k: '执念', ke: 'Obsession',  zh: '反复纠缠同一处的执迷',       en: 'circling the same spot, obsessively', role: '奴隶 / 主人', roleEn: 'Slave / Master' },
  5: { k: '幻梦', ke: 'Fantasy',    zh: '童话与神话般的滤镜',         en: 'a fairytale, mythic filter', role: '叛逆者 / 顺从者', roleEn: 'Rebel / Conformist' },
  6: { k: '愿景', ke: 'Vision',     zh: '瞥见尚未到来的图景',         en: 'a glimpse of what is not yet', role: '圣人 / 罪人', roleEn: 'Saint / Sinner' },
};

// —— 三场解说（观己白话原创；性质为官方定义）——
export const DREAM_FIELD_KB = {
  light: {
    zh: '个性水晶的「造梦宣传部」：兜售喜悦、灵光与超脱，暗示「离开身体才自由」。梦见美好与灵性时，记得它自有立场——不必全信。',
    en: 'The Personality crystal’s dream-propaganda bureau: selling joy, light and transcendence, hinting that freedom means leaving the body. Beautiful, mystical dreams have an agenda — enjoy, don’t enlist.',
  },
  earth: {
    zh: '与全人类清醒意识相接的界面：白天世界的愤怒、失望、紧张，夜里以梦的形式涌进来。换个居住地，这一场的梦常会跟着变。',
    en: 'The interface with humanity’s waking consciousness: the day-world’s anger, disappointment and tension pour in as dreams. Move to a new place and these dreams often change with it.',
  },
  demon: {
    zh: '设计水晶的地界，作用于身体而非头脑：生存、食欲、目标感这些原始驱力在此翻涌。名字吓人，其实多是身体夜里的「泄压与预演」。',
    en: 'The Design crystal’s territory, working on the body, not the mind: survival, appetite, purpose churn here. Scary name — mostly the body venting pressure and rehearsing at night.',
  },
};

// —— 梦桥门（官方 Portal Bridges：夜间信息经 62/12/19 桥到清醒端 17/22/49）——
export const DREAM_PORTALS = { 62: 17, 12: 22, 19: 49 };

// —— 梦境「角色 Persona」：清醒时你是13个激活的复杂综合体；一入睡，这套复杂个性整个消失，
//    只剩一个「人格激活」跟着你进梦，它就是你梦里的单一角色。有些人梦中连人格激活都没有，
//    人格只能从「地球平面」借来。（官方 Persona 概念，观己白话）——
export const DREAM_PERSONA = {
  zh: '清醒的「你」是 13 个行星激活拼出来的复杂个性。可一旦入睡，这套复杂的自我整个熄灭——只剩下一个「人格激活」跟着你走进梦里，那就是你梦中的单一角色。所以梦里的你，往往像个陌生人：更简单、更极端、甚至是完全不同的类型。醒来别把梦里那个角色当成真正的自己。',
  en: 'Awake, “you” are a complex weave of 13 planetary activations. The moment you fall asleep that whole complex self switches off — only one personality activation follows you into the dream, and that becomes your single dream-character. So the you in dreams feels like a stranger: simpler, more extreme, even a different type. Don’t mistake that character for who you really are.',
};

// —— 签名与场景 Signature & Scene：每种类型有「签名(对了的感觉)」和「非己主题(错了的感觉)」。
//    睡着时签名会「翻转成场景」——从签名开始、以非己主题收尾，所以人一天里最沉重的时刻常是清晨刚醒。
//    （官方 Signature/Scene 概念，观己白话）——
export const DREAM_SIGNATURE = {
  Generator:   { sig: '满足', nonself: '沮丧', sigEn: 'Satisfaction', nonselfEn: 'Frustration' },
  'Manifesting Generator': { sig: '满足', nonself: '沮丧', sigEn: 'Satisfaction', nonselfEn: 'Frustration' },
  Manifestor:  { sig: '平和', nonself: '愤怒', sigEn: 'Peace', nonselfEn: 'Anger' },
  Projector:   { sig: '成功', nonself: '苦涩', sigEn: 'Success', nonselfEn: 'Bitterness' },
  Reflector:   { sig: '惊喜', nonself: '失望', sigEn: 'Surprise', nonselfEn: 'Disappointment' },
  note: {
    zh: '每种类型都有一个「签名」（对了的感觉）和一个「非己主题」（错了的感觉）。梦里这两端会连成一场「场景」——梦常从签名开头、以非己主题收尾。这就是为什么很多人一天里最沉的时刻，是清晨刚醒的那一下：你和非己的另一端一起醒来了。清醒时按自己的策略与权威生活，是唯一的解药。',
    en: 'Every type has a Signature (the feeling of being on track) and a Not-Self theme (off track). In dreams these two ends link into a “scene” — dreams often open on the Signature and close on the Not-Self theme. That’s why the heaviest moment of many people’s day is the instant of waking: you wake with the not-self end. Living your Strategy & Authority by day is the only remedy.',
  },
};

// —— 弱点 Weak Point：把「梦境盘」和「清醒盘」并排比，看夜里的梦波在哪个门上给你留下最大压力残基——
//    那个点就是你被夜间制约得最狠、最容易在白天冒充成「你以为的自己」的地方。（官方分析法，观己白话）——
export const DREAM_WEAKPOINT = {
  zh: '把你的梦境盘和清醒盘并排看，梦里被反复激活、清醒盘却薄弱或空缺的门，就是你的「弱点」——夜里被环境制约得最深的地方。它不属于清醒的你，却常在白天冒充成「你以为的自己」，推着你去想、去做一些其实对你并不健康的事。认出它，是松开这股夜间牵引的第一步。',
  en: 'Set your dream chart beside your waking chart: a gate lit up again and again in dreams, yet weak or empty when you’re awake, is your Weak Point — where night-time conditioning bites deepest. It isn’t the waking you, but it masquerades as “who you think you are,” nudging you toward thoughts and moves that aren’t actually healthy for you. Spotting it is the first step to loosening that nightly pull.',
};

// —— 官方统计（Adrian Kobler / Jovian Archive）：入睡后众生相 ——
export const DREAM_STATS = {
  types: [ ['Reflector','反映者',67.56], ['Generator','生产者',16.64], ['Projector','投射者',14.93], ['Manifesting Generator','显示生产者',0.72], ['Manifestor','显示者',0.16] ],
  personaPct: 96.94, typeChangePct: 86.74, noDefPct: 67.56,
  note: { zh: '官方统计：入睡后约 67.6% 的人变成反映者，86.7% 的人类型会改变——梦里的你，多半不是清醒的那个你。', en: 'Official stats: in sleep ~67.6% become Reflectors and 86.7% change type — the dreaming you is usually not the waking you.' },
};

// —— 睡眠小贴士（官方机制的观己转写）——
export const DREAM_TIPS = [
  { zh: '睡着后头脑与情绪中心整体下线——夜里没有「你」在把关，所以睡眠是人一生中被环境制约最深的时段。', en: 'In sleep the mind and emotional centers go offline — no “you” standing guard, which makes sleep the deepest conditioning window of your life.' },
  { zh: '尽量睡在自己的气场里：与人同床时，对方的气场会整夜写入你的梦。条件允许，独睡一张床、留出入睡缓冲。', en: 'Sleep in your own aura when you can: sharing a bed lets another aura write into your dreams all night. Given the choice, take your own bed and wind down solo.' },
  { zh: '梦不是谜语，别逐字解梦——醒来记得的只是头脑重组的残片。真正的防护是在白天按自己的策略与权威生活。', en: 'Dreams aren’t riddles to decode — what you recall is residue reassembled by the mind. The real protection is living your Strategy & Authority by day.' },
  { zh: '约三分之二的人入睡后会变成「反映者式」的梦境体质：全开放、采样环境。这不是缺陷，是夜里的常态。', en: 'About two-thirds of us become reflector-like sleepers — fully open, sampling the environment. Not a flaw; it’s the night’s normal.' },
];
