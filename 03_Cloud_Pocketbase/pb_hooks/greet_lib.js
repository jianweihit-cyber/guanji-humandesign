// 祝福邮件共享库 —— 被 greetings_cron.pb.js 的 cron / route 各自 require。
// ⚠️ PocketBase hook 回调在隔离 VM 运行，访问不到 .pb.js 顶层函数；共享逻辑必须放普通模块经 require 注入。
// 纯 ES5；DB/邮件相关函数以 app 为参（cron 传 $app，route 传 e.app）。
// 精美卡片模板：离目 logo + 卡片框 + 正向励志 + 名人名句 + 男女不同 accent/名句 + 中英整套 + 按 message 覆盖发件名。

var LOGO_RED = "https://humandesign.zaiyuxingzhe.com/web/logo-email-red.png";   // 红方块·奶油眼(奶油/极简模板用)
var LOGO_CREAM = "https://humandesign.zaiyuxingzhe.com/web/logo-email.png";     // 奶油底·红眼(经典红头模板用)
var LOGO = LOGO_RED;   // 向后兼容
var APP = "https://humandesign.zaiyuxingzhe.com/web/index.html";
var SITE = "humandesign.zaiyuxingzhe.com";
var ADMIN = "admin@zaiyuxingzhe.com";   // 会员续期联系（管理员）；改这里即可换

function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
function hashStr(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

// 五型 HD 特色寄语
function typeLine(type, lang) {
  var EN = {
    'Generator': "As a Generator, your power is response — say yes to what truly lights you up, and watch this year fill with satisfaction.",
    'Manifesting Generator': "As a Manifesting Generator, you're built for speed and many loves — chase what excites you, skip the rest, live it vivid.",
    'Manifestor': "As a Manifestor, you're here to begin — initiate freely, inform with grace, and let your impact ripple outward in peace.",
    'Projector': "As a Projector, your gift is to see deeply — and this year, may the right people see you, and invite the brilliance you carry.",
    'Reflector': "As a Reflector, you mirror the whole sky — give yourself time, and let the clearest, most surprising path reveal itself."
  };
  var ZH = {
    'Generator': "作为生产者，你的力量是「回应」——对那些真正点亮你的事说 yes，这一年就会被满足填满。",
    'Manifesting Generator': "作为显化生产者，你天生又快又多元——奔向让你兴奋的，跳过其余的，把日子过得鲜活。",
    'Manifestor': "作为显示者，你生来就是「发起」的人——自在地开始、温柔地告知，让你的影响向外荡漾、内心安然。",
    'Projector': "作为投射者，你的天赋是看得深——愿今年对的人看见你，邀请你绽放你所怀的光。",
    'Reflector': "作为反映者，你映照整片天空——给自己时间，让最清澈、最惊喜的那条路自己浮现。"
  };
  var m = (lang === 'en') ? EN : ZH;
  return m[type] || (lang === 'en' ? "May this year unfold in your own true rhythm." : "愿你这一年，按自己的节奏，舒展生长。");
}

// 名人名句池（正向、被看见、能量感）；按性别取不同倾向 + 通用池。{zh,en,azh,aen}
var Q_F = [
  { zh: "没有什么能遮蔽你由内而外的光。", en: "Nothing can dim the light that shines from within.", azh: "玛雅·安杰卢", aen: "Maya Angelou" },
  { zh: "想要无可取代，就要与众不同。", en: "In order to be irreplaceable, one must always be different.", azh: "可可·香奈儿", aen: "Coco Chanel" },
  { zh: "没有什么不可能——“impossible”本身就写着“I'm possible”。", en: "Nothing is impossible; the word itself says 'I'm possible'.", azh: "奥黛丽·赫本", aen: "Audrey Hepburn" },
  { zh: "未来属于那些相信梦想之美的人。", en: "The future belongs to those who believe in the beauty of their dreams.", azh: "埃莉诺·罗斯福", aen: "Eleanor Roosevelt" }
];
var Q_M = [
  { zh: "我们身后之事、身前之事，都远不及我们内在之事。", en: "What lies behind us and before us are tiny matters compared to what lies within us.", azh: "爱默生", aen: "R. W. Emerson" },
  { zh: "你一生的幸福，取决于你思想的品质。", en: "The happiness of your life depends upon the quality of your thoughts.", azh: "马可·奥勒留", aen: "Marcus Aurelius" },
  { zh: "你的时间有限，别浪费它去过别人的生活。", en: "Your time is limited, so don't waste it living someone else's life.", azh: "史蒂夫·乔布斯", aen: "Steve Jobs" },
  { zh: "朝着梦想的方向自信前行，过你想象中的生活。", en: "Go confidently in the direction of your dreams; live the life you've imagined.", azh: "梭罗", aen: "H. D. Thoreau" }
];
var Q_ALL = [
  { zh: "你所追寻的，也在追寻你。", en: "What you seek is seeking you.", azh: "鲁米", aen: "Rumi" },
  { zh: "在你生命的中心，你早已知道答案，知道你是谁。", en: "At the center of your being you have the answer; you know who you are.", azh: "老子", aen: "Lao Tzu" },
  { zh: "无论你能做什么、或梦想能做什么，现在就开始。", en: "Whatever you can do, or dream you can, begin it now.", azh: "歌德", aen: "Goethe" },
  { zh: "成为你自己，因为别人都有人做了。", en: "Be yourself; everyone else is already taken.", azh: "王尔德", aen: "Oscar Wilde" }
];
function pickQuote(gender, seed, lang) {
  var pool = (gender === 'F') ? Q_F.concat(Q_ALL) : (gender === 'M') ? Q_M.concat(Q_ALL) : Q_ALL.concat(Q_F).concat(Q_M);
  var q = pool[seed % pool.length];
  return { text: lang === 'en' ? q.en : q.zh, author: lang === 'en' ? q.aen : q.azh };
}

// ===== 多套邮件模板（chrome=外壳；inner=中间 <tr> 们）。新增模板：写个 chromeXxx + 注册到 CHROMES/inner。 =====
var FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'PingFang SC','Microsoft YaHei',sans-serif";
function footText(en) {
  return en ? 'You receive this because you have a GuanJi account. To stop these, open Account → System emails in the app, or simply reply to let us know.'
            : '你收到这封信，是因为你拥有观己账号。如不想再收到此类邮件，可在 App「账号」页关闭通知，或直接回复本邮件告知。';
}
function tagline(en) { return en ? 'Know Yourself · Self-Discovery · Inner Cultivation' : '认识自己 · 自我探索 · 观己修心 · 知行合一'; }

// 外壳①「通透奶油」(aurora)：奶油卡+红顶边+红方块logo+花饰头部+厚footer
function chromeAurora(en, accent, inner) {
  return '<div style="margin:0;padding:26px 12px;background:#F3EADA">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#FCFAF4;border-radius:18px;border-top:3px solid #B3433A;overflow:hidden;box-shadow:0 2px 16px rgba(120,70,30,.08);font-family:' + FF + '">'
    + '<tr><td style="padding:32px 24px 4px;text-align:center">'
    + '<img src="' + LOGO_RED + '" width="64" height="64" alt="观己" style="display:block;margin:0 auto 12px;border:0;outline:none;border-radius:16px">'
    + '<div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#3a3330">' + (en ? 'GUANJI' : '观　己 · 人类图') + '</div>'
    + (en ? '<div style="font-size:12px;letter-spacing:3px;color:#A99A80;margin-top:4px">HUMAN DESIGN</div>' : '')
    + '<div style="color:' + accent + ';font-size:15px;letter-spacing:8px;margin:16px 0 0">❀&nbsp;&nbsp;❀&nbsp;&nbsp;❀</div></td></tr>'
    + inner
    + '<tr><td style="padding:20px 22px 26px;text-align:center;border-top:1px solid #EEE3CE">'
    + '<div style="font-size:14px;font-weight:700;color:#B3433A;letter-spacing:1px">' + (en ? 'Zai Yu Xing Zhe · GuanJi' : '再遇行者 · 观己') + '</div>'
    + '<div style="font-size:12.5px;color:#A99A80;margin-top:4px">' + SITE + '</div>'
    + '<div style="font-size:12px;color:#C09A5E;letter-spacing:1px;margin-top:10px">' + tagline(en) + '</div>'
    + '<div style="font-size:11.5px;color:#B8AE9C;line-height:1.7;margin-top:12px">' + footText(en) + '</div>'
    + '</td></tr></table></div>';
}
// 外壳②「经典红头」(classic)：红渐变头部+奶油底logo+简洁footer（旧版，保留）
function chromeClassic(en, accent, inner) {
  return '<div style="margin:0;padding:24px 12px;background:#F0E7D6">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#FCFAF4;border:1px solid #ECDDC4;border-radius:18px;overflow:hidden;font-family:' + FF + '">'
    + '<tr><td style="background:#B3433A;background-image:linear-gradient(135deg,#B3433A,#8c2f28);padding:24px 20px;text-align:center">'
    + '<img src="' + LOGO_CREAM + '" width="60" height="60" alt="观己" style="display:block;margin:0 auto 8px;border:0;outline:none">'
    + '<div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px">' + (en ? 'GuanJi · Human Design' : '观己 · 人类图') + '</div></td></tr>'
    + inner
    + '<tr><td style="background:#F6EFE2;padding:16px 22px;text-align:center;border-top:1px solid #ECDDC4">'
    + '<div style="font-size:12px;color:#9b948a;line-height:1.6">' + footText(en) + '</div>'
    + '<div style="font-size:12px;color:#C9BEA9;margin-top:6px">· ' + (en ? 'Zai Yu Xing Zhe · ' + SITE : '再遇行者 · ' + SITE) + ' ·</div></td></tr>'
    + '</table></div>';
}
// 外壳③「极简」(minimal)：素白卡+小红logo+发丝线+留白+极简footer
function chromeMinimal(en, accent, inner) {
  return '<div style="margin:0;padding:30px 14px;background:#FBF8F1">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:460px;margin:0 auto;background:#FFFFFF;border:1px solid #EFE7D7;border-radius:14px;overflow:hidden;font-family:' + FF + '">'
    + '<tr><td style="padding:30px 30px 0;text-align:center">'
    + '<img src="' + LOGO_RED + '" width="44" height="44" alt="观己" style="display:block;margin:0 auto 10px;border:0;outline:none;border-radius:11px">'
    + '<div style="font-size:12px;font-weight:600;letter-spacing:4px;color:#A99A80">' + (en ? 'GUANJI · HUMAN DESIGN' : '观己 · 人类图') + '</div>'
    + '<div style="width:34px;height:2px;background:' + accent + ';margin:16px auto 0;border-radius:2px"></div></td></tr>'
    + inner
    + '<tr><td style="padding:22px 30px 30px;text-align:center;border-top:1px solid #F2ECDF">'
    + '<div style="font-size:12.5px;color:#A99A80">' + (en ? 'Zai Yu Xing Zhe · ' : '再遇行者 · ') + SITE + '</div>'
    + '<div style="font-size:11px;color:#C3BAA8;line-height:1.7;margin-top:8px">' + footText(en) + '</div>'
    + '</td></tr></table></div>';
}
// 外壳④「岩板」(ink)：深岩石板头部+浅身+钢蓝细线+方角，沉稳硬朗（男士款）
function chromeInk(en, accent, inner) {
  return '<div style="margin:0;padding:26px 12px;background:#E7E9EC">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #DCE0E4;border-radius:12px;overflow:hidden;font-family:' + FF + '">'
    + '<tr><td style="background:#2B3640;background-image:linear-gradient(135deg,#34424d,#222a31);padding:28px 24px;text-align:center">'
    + '<img src="' + LOGO_RED + '" width="60" height="60" alt="观己" style="display:block;margin:0 auto 10px;border:0;outline:none;border-radius:14px">'
    + '<div style="color:#EDEFF1;font-size:18px;font-weight:700;letter-spacing:3px">' + (en ? 'GUANJI' : '观　己 · 人类图') + '</div>'
    + '<div style="color:#8FA3B0;font-size:11px;letter-spacing:3px;margin-top:5px">HUMAN DESIGN</div>'
    + '<div style="width:40px;height:2px;background:' + accent + ';margin:16px auto 0"></div></td></tr>'
    + inner
    + '<tr><td style="padding:20px 24px 26px;text-align:center;background:#F6F7F8;border-top:1px solid #E6E9EC">'
    + '<div style="font-size:13.5px;font-weight:700;color:#3A4750;letter-spacing:1px">' + (en ? 'Zai Yu Xing Zhe · GuanJi' : '再遇行者 · 观己') + '</div>'
    + '<div style="font-size:12px;color:#8a97a0;margin-top:4px">' + SITE + '</div>'
    + '<div style="font-size:11.5px;color:#9AA6AE;line-height:1.7;margin-top:10px">' + footText(en) + '</div>'
    + '</td></tr></table></div>';
}
var CHROMES = { aurora: chromeAurora, classic: chromeClassic, minimal: chromeMinimal, ink: chromeInk };
var DEFAULT_TPL = 'aurora';
function chromeOf(tpl) { return CHROMES[tpl] || CHROMES[DEFAULT_TPL]; }

// 祝福正文(inner) —— 三套排版，吃同一个 content 对象 c
function gInnerAurora(c) {
  var p = 'font-size:15px;line-height:1.95;color:#5a5048;margin:0;text-align:justify';
  return ''
    + (c.typeLabel ? '<tr><td style="padding:6px 26px 0;text-align:center"><span style="display:inline-block;border:1px solid ' + c.accent + ';color:' + c.accent + ';border-radius:999px;padding:5px 18px;font-size:13px;letter-spacing:1px">' + esc(c.typeLabel) + (c.profile ? ' · ' + esc(c.profile) : '') + '</span></td></tr>' : '')
    + '<tr><td style="padding:14px 30px 2px;text-align:center"><div style="font-size:24px;font-weight:700;color:#3a3330;letter-spacing:1px">' + esc(c.bigTitle) + '</div>'
    + '<div style="font-size:14px;color:#8a7c66;margin-top:9px">' + c.subline + '</div></td></tr>'
    + '<tr><td style="padding:18px 30px 4px"><p style="' + p + '">' + esc(c.lead) + '</p></td></tr>'
    + (c.line ? '<tr><td style="padding:10px 30px 4px"><p style="' + p + '">' + esc(c.line) + '</p></td></tr>' : '')
    + '<tr><td style="padding:8px 30px 4px"><p style="' + p + '">' + esc(c.closing) + '</p></td></tr>'
    + '<tr><td style="padding:8px 30px"><div style="border-top:1px solid #EEE3CE;border-bottom:1px solid #EEE3CE;padding:18px 6px;margin:8px 0;text-align:center">'
    + '<div style="font-size:15.5px;font-style:italic;color:#6B5B43;line-height:1.7">&ldquo;' + esc(c.quote.text) + '&rdquo;</div>'
    + '<div style="font-size:12.5px;color:#A99A80;margin-top:8px">— ' + esc(c.quote.author) + '</div></div></td></tr>'
    + '<tr><td style="padding:2px 30px 0;text-align:center"><div style="font-size:13px;color:#8a7c66;line-height:1.6">📅 ' + esc(c.companion) + '</div></td></tr>'
    + '<tr><td style="padding:18px 30px 28px;text-align:center"><a href="' + APP + '" style="display:inline-block;background:#B3433A;color:#fff;text-decoration:none;padding:12px 30px;border-radius:999px;font-size:15px;font-weight:600">' + esc(c.cta) + ' &rsaquo;</a></td></tr>';
}
function gInnerClassic(c) {
  var typeBox = c.typeLabel ? '<tr><td style="padding:0 26px"><div style="background:#F7F0E3;border-left:4px solid ' + c.accent + ';border-radius:10px;padding:12px 14px;margin:6px 0 2px"><div style="font-size:12px;color:#9b948a;letter-spacing:.5px">' + (c.en ? 'YOUR DESIGN' : '你的人类图') + ' · ' + esc(c.typeLabel) + (c.profile ? ' · ' + esc(c.profile) : '') + '</div><div style="font-size:14.5px;color:#3a3330;line-height:1.7;margin-top:5px">' + esc(c.line) + '</div></div></td></tr>' : '';
  return ''
    + '<tr><td style="padding:24px 26px 4px"><div style="font-size:12px;font-weight:700;letter-spacing:2px;color:' + c.accent + '">' + esc(c.eyebrow) + '</div>'
    + '<h1 style="font-size:21px;line-height:1.4;margin:8px 0 6px;color:#3a3330">' + esc(c.headline) + '</h1>'
    + '<p style="font-size:15px;line-height:1.85;color:#5a5048;margin:6px 0 4px">' + esc(c.lead) + '</p></td></tr>'
    + typeBox
    + '<tr><td style="padding:6px 26px"><div style="border-top:1px dashed #E2D5BC;border-bottom:1px dashed #E2D5BC;padding:16px 4px;margin:14px 0;text-align:center"><div style="font-size:16px;font-style:italic;color:#6B5B43;line-height:1.7">&ldquo;' + esc(c.quote.text) + '&rdquo;</div><div style="font-size:13px;color:#A99A80;margin-top:8px">— ' + esc(c.quote.author) + '</div></div></td></tr>'
    + '<tr><td style="padding:2px 26px 4px"><p style="font-size:15px;line-height:1.8;color:#5a5048;margin:2px 0">' + esc(c.closing) + '</p></td></tr>'
    + '<tr><td style="padding:14px 26px 26px;text-align:center"><a href="' + APP + '" style="display:inline-block;background:#B3433A;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:15px;font-weight:600">' + esc(c.cta) + ' &rsaquo;</a></td></tr>';
}
function gInnerMinimal(c) {
  var p = 'font-size:14.5px;line-height:1.9;color:#5a5048;margin:0;text-align:center';
  return ''
    + '<tr><td style="padding:18px 34px 0;text-align:center">'
    + (c.typeLabel ? '<div style="font-size:12px;letter-spacing:1px;color:' + c.accent + ';margin-bottom:8px">' + esc(c.typeLabel) + (c.profile ? ' · ' + esc(c.profile) : '') + '</div>' : '')
    + '<div style="font-size:23px;font-weight:700;color:#2E2B26;letter-spacing:1px">' + esc(c.bigTitle) + '</div>'
    + '<div style="font-size:13.5px;color:#9b9078;margin-top:8px">' + c.subline + '</div></td></tr>'
    + '<tr><td style="padding:16px 34px 4px"><p style="' + p + '">' + esc(c.lead) + '</p></td></tr>'
    + '<tr><td style="padding:14px 34px"><div style="font-size:17px;font-style:italic;color:#6B5B43;line-height:1.75;text-align:center">&ldquo;' + esc(c.quote.text) + '&rdquo;</div><div style="font-size:12.5px;color:#A99A80;margin-top:10px;text-align:center">— ' + esc(c.quote.author) + '</div></td></tr>'
    + '<tr><td style="padding:6px 34px 0;text-align:center"><div style="font-size:12.5px;color:#9b9078">📅 ' + esc(c.companion) + '</div></td></tr>'
    + '<tr><td style="padding:20px 34px 26px;text-align:center"><a href="' + APP + '" style="display:inline-block;border:1.5px solid ' + c.accent + ';color:' + c.accent + ';text-decoration:none;padding:10px 26px;border-radius:999px;font-size:14px;font-weight:600">' + esc(c.cta) + ' &rsaquo;</a></td></tr>';
}
function gInnerInk(c) {  // 左对齐·方角徽标·左竖线引言·方角深色按钮(男士款)
  var p = 'font-size:15px;line-height:1.9;color:#3f4a52;margin:0';
  return ''
    + (c.typeLabel ? '<tr><td style="padding:22px 30px 0"><span style="display:inline-block;background:#EEF2F5;color:' + c.accent + ';border-radius:6px;padding:5px 14px;font-size:12.5px;letter-spacing:1px;font-weight:600">' + esc(c.typeLabel) + (c.profile ? ' · ' + esc(c.profile) : '') + '</span></td></tr>' : '')
    + '<tr><td style="padding:14px 30px 0"><div style="font-size:23px;font-weight:700;color:#222b32;letter-spacing:.5px">' + esc(c.bigTitle) + '</div>'
    + '<div style="font-size:13.5px;color:#8a97a0;margin-top:7px">' + c.subline + '</div></td></tr>'
    + '<tr><td style="padding:16px 30px 4px"><p style="' + p + '">' + esc(c.lead) + '</p></td></tr>'
    + (c.line ? '<tr><td style="padding:10px 30px 4px"><p style="' + p + '">' + esc(c.line) + '</p></td></tr>' : '')
    + '<tr><td style="padding:8px 30px 4px"><p style="' + p + '">' + esc(c.closing) + '</p></td></tr>'
    + '<tr><td style="padding:12px 30px"><div style="border-left:3px solid ' + c.accent + ';background:#F6F8F9;padding:14px 16px;border-radius:0 8px 8px 0"><div style="font-size:15px;font-style:italic;color:#3f4a52;line-height:1.7">' + esc(c.quote.text) + '</div><div style="font-size:12.5px;color:#8a97a0;margin-top:8px">— ' + esc(c.quote.author) + '</div></div></td></tr>'
    + '<tr><td style="padding:10px 30px 0"><div style="font-size:13px;color:#8a97a0">📅 ' + esc(c.companion) + '</div></td></tr>'
    + '<tr><td style="padding:18px 30px 28px"><a href="' + APP + '" style="display:inline-block;background:#2B3640;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">' + esc(c.cta) + ' &rsaquo;</a></td></tr>';
}
var GINNER = { aurora: gInnerAurora, classic: gInnerClassic, minimal: gInnerMinimal, ink: gInnerInk };

// 组装祝福：返回 {subject, html, fromName}。days=相伴天数(生日用)。template=aurora|classic|minimal(默认 aurora)。
function composeGreeting(kind, lang, nick, sum, years, gender, email, days, template) {
  var en = (lang === 'en');
  var fromName = en ? 'GuanJi · Human Design' : '观己 · 人类图';
  var accent = (gender === 'F') ? '#C2698A' : (gender === 'M') ? '#4E7BA6' : '#B3433A';
  var type = (sum && sum.type) || '';
  var typeLabel = en ? type : ((sum && sum.typeZh) || type);
  var profile = (sum && sum.profile) || '';
  var line = typeLine(type, lang);
  var q = pickQuote(gender, hashStr(email) + (years || 0), lang);

  var subject, bigTitle, eyebrow, headline, lead, closing, companion;
  if (kind === 'anniversary') {
    subject = en ? ('🌟 ' + nick + ' — ' + years + (years > 1 ? ' years' : ' year') + ' with GuanJi') : ('🌟 ' + nick + '，来到观己满 ' + years + ' 年 🎉');
    bigTitle = en ? 'Happy Anniversary' : '周年快乐';
    eyebrow = en ? ('✦ ' + years + (years > 1 ? ' YEARS' : ' YEAR') + ' WITH GUANJI') : '✦ 观己同行纪念日';
    headline = en ? ('Thank you for ' + (years > 1 ? ('these ' + years + ' years') : 'this past year') + ', ' + nick) : (nick + '，谢谢你这 ' + years + ' 年的同行');
    lead = en ? "You've returned, again and again, to look within — and grow. Every quiet step you've taken on this path, we've seen. That takes real courage."
              : "这一年里，你一次次回来，观照自己、向内生长。你在这条路上走过的每一步——哪怕安静无声——我们都看见了。这份坚持，本身就很了不起。";
    closing = en ? "Here's to the next chapter — may it be even more you." : "敬下一段旅程——愿它，更像你自己。";
    companion = en ? ('You and GuanJi · Human Design, ' + years + (years > 1 ? ' years' : ' year') + ' together · thank you for the company')
                   : ('你与 观己 · 人类图，已相伴 ' + years + ' 年 · 谢谢一路同行');
  } else {
    subject = en ? ('🎂 Happy Birthday, ' + nick + ' · GuanJi') : ('🎂 ' + nick + '，生日快乐 · 观己人类图');
    bigTitle = en ? 'Happy Birthday' : '生日快乐';
    eyebrow = en ? '✦ HAPPY BIRTHDAY' : '✦ 生日快乐';
    headline = en ? ('Happy birthday, ' + nick + ' 🎂') : (nick + '，生日快乐 🎂');
    lead = en ? "On your day, we just want to say it plainly: the world is brighter with you in it. May this new year hold you gently, surprise you kindly — and may you be truly seen, most of all by yourself."
              : "在你生日这天，想认真地对你说一句：因为有你，这个世界更亮了一点。愿新的一岁，被温柔以待、被惊喜眷顾——也愿你，被好好看见，尤其是被你自己。";
    closing = en ? "Step into this year exactly as you are — that's more than enough." : "就以你本来的样子，走进新的一岁——这就已经足够好了。";
    companion = (days && days > 0) ? (en ? ('You and GuanJi · Human Design, ' + days + ' days together · thank you for the company') : ('你与 观己 · 人类图，已相伴 ' + days + ' 天 · 谢谢一路同行'))
                                   : (en ? 'Thank you for walking this path with us · may this year shine' : '谢谢一路同行 · 愿新的一岁闪闪发亮');
  }
  var subline = en ? ('GuanJi · a note for <span style="color:' + accent + '">' + esc(nick) + '</span>')
                   : ('观己 · 写给「<span style="color:' + accent + '">' + esc(nick) + '</span>」的人类图寄语');
  var c = { en: en, accent: accent, nick: nick, typeLabel: typeLabel, profile: profile, line: line, lead: lead, closing: closing, quote: q, bigTitle: bigTitle, eyebrow: eyebrow, headline: headline, subline: subline, companion: companion, cta: (en ? 'Open your chart' : '看看我的人类图') };
  var tpl = (template && CHROMES[template]) ? template : DEFAULT_TPL;
  var inner = (GINNER[tpl] || GINNER[DEFAULT_TPL])(c);
  return { subject: subject, html: chromeOf(tpl)(en, accent, inner), fromName: fromName };
}

// 会员到期 / 即将到期 提醒邮件 {subject, html, fromName}。template 同 composeGreeting。
function composeMembership(lang, nick, gender, daysLeft, expired, tier, template) {
  var en = (lang === 'en');
  var fromName = en ? 'GuanJi · Human Design' : '观己 · 人类图';
  var accent = (gender === 'F') ? '#C2698A' : (gender === 'M') ? '#4E7BA6' : '#B3433A';
  var tn = (tier === 'vip') ? 'VIP' : (tier === 'pro') ? 'Pro' : tier;
  var subject, eyebrow, headline, lead;
  if (expired) {
    subject = en ? ('🔔 ' + nick + ', your GuanJi ' + tn + ' membership has expired') : ('🔔 ' + nick + '，你的观己 ' + tn + ' 会员已到期');
    eyebrow = en ? '✦ MEMBERSHIP EXPIRED' : '✦ 会员已到期';
    headline = en ? (nick + ', your ' + tn + ' has expired') : (nick + '，你的 ' + tn + ' 会员到期了');
    lead = en ? ("Your " + tn + " membership has come to a close — but your journey of self-knowing continues. Renew anytime to keep full access; just reach out and we'll extend it for you.")
              : ("你的 " + tn + " 会员到这里告一段落——但你向内观照的旅程不会停。随时可以续期，联系管理员即可为你延长，继续解锁全部功能。");
  } else {
    subject = en ? ('⏳ ' + nick + ', your GuanJi ' + tn + ' expires in ' + daysLeft + (daysLeft > 1 ? ' days' : ' day')) : ('⏳ ' + nick + '，观己 ' + tn + ' 会员还剩 ' + daysLeft + ' 天');
    eyebrow = en ? ('✦ ' + daysLeft + (daysLeft > 1 ? ' DAYS LEFT' : ' DAY LEFT')) : ('✦ 会员还剩 ' + daysLeft + ' 天');
    headline = en ? ('A gentle heads-up, ' + nick) : (nick + '，温馨提醒');
    lead = en ? ("Your " + tn + " membership has " + daysLeft + (daysLeft > 1 ? ' days' : ' day') + " left. To keep your full access uninterrupted, renew anytime — reach out to the admin and we'll extend it for you.")
              : ("你的 " + tn + " 会员还有 " + daysLeft + " 天到期。想不中断地继续享有全部功能，随时可以续期——联系管理员，我们就为你延长。");
  }
  var cta = en ? 'Contact admin to renew' : '联系管理员续期';
  var mailto = 'mailto:' + ADMIN + '?subject=' + encodeURIComponent(en ? 'GuanJi membership renewal' : '观己会员续期');
  var p = 'font-size:15px;line-height:1.95;color:#5a5048;margin:0;text-align:justify';
  var body = ''
    + '<tr><td style="padding:6px 26px 0;text-align:center"><span style="display:inline-block;border:1px solid ' + accent + ';color:' + accent + ';border-radius:999px;padding:5px 18px;font-size:13px;letter-spacing:1px">' + esc(eyebrow) + '</span></td></tr>'
    + '<tr><td style="padding:14px 30px 2px;text-align:center"><div style="font-size:22px;font-weight:700;color:#3a3330;letter-spacing:1px">' + esc(headline) + '</div></td></tr>'
    + '<tr><td style="padding:16px 30px 4px"><p style="' + p + '">' + esc(lead) + '</p></td></tr>'
    + '<tr><td style="padding:18px 30px 28px;text-align:center"><a href="' + mailto + '" style="display:inline-block;background:#B3433A;color:#fff;text-decoration:none;padding:12px 30px;border-radius:999px;font-size:15px;font-weight:600">' + esc(cta) + ' &rsaquo;</a>'
    + '<div style="font-size:12px;color:#9b948a;margin-top:10px">' + esc(en ? ('or write to ' + ADMIN) : ('或来信 ' + ADMIN)) + '</div></td></tr>';
  var tpl = (template && CHROMES[template]) ? template : DEFAULT_TPL;
  return { subject: subject, html: chromeOf(tpl)(en, accent, body), fromName: fromName };
}

// 发一封信（尊重退订 + 写 mail_log + 可去重 + 可覆盖发件名）。返回 {ok, skipped, reason, err}
function sendMail(app, to, subject, html, kind, dedupKey, fromName) {
  try { var u = app.findFirstRecordByData("users", "email", to); if (u && u.getBool("emailOptOut")) return { skipped: true, reason: "opted_out" }; } catch (_) {}
  if (dedupKey) {
    try { var dup = app.findRecordsByFilter("mail_log", 'recipient = {:r} && kind = {:k} && meta = {:m}', "-at", 1, 0, { r: to, k: kind, m: dedupKey }); if (dup && dup.length) return { skipped: true, reason: "already_sent" }; } catch (_) {}
  }
  var sent = false, errMsg = "";
  try {
    var st = app.settings();
    var msg = new MailerMessage({ from: { address: st.meta.senderAddress, name: fromName || st.meta.senderName }, to: [{ address: to }], subject: subject, html: html });
    app.newMailClient().send(msg);
    sent = true;
  } catch (err) { errMsg = String(err); }
  try {
    var c = app.findCollectionByNameOrId("mail_log");
    var rec = new Record(c);
    rec.set("recipient", to); rec.set("subject", subject); rec.set("kind", kind);
    rec.set("status", sent ? "sent" : ("failed: " + errMsg).slice(0, 38));
    rec.set("at", (new Date()).toISOString()); rec.set("meta", String(dedupKey || "").slice(0, 60));
    rec.set("summary", String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200));
    app.save(rec);
  } catch (_) {}
  return { ok: sent, err: errMsg };
}

// 取用户「本人(self)标记」排盘 data；无则取最新一条；都没有 null
function selfChart(app, ownerId) {
  try {
    var rows = app.findRecordsByFilter("charts", 'owner = {:o} && deleted = false', "-cupd", 200, 0, { o: ownerId });
    if (!rows || !rows.length) return null;
    var fallback = null;
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i].get("data"); if (typeof d === "string") { try { d = JSON.parse(d); } catch (_) { d = null; } }
      if (!d) continue;
      if (!fallback) fallback = d;
      if (d.tags && d.tags.indexOf && d.tags.indexOf("self") >= 0) return d;
    }
    return fallback;
  } catch (_) { return null; }
}

module.exports = { esc: esc, typeLine: typeLine, composeGreeting: composeGreeting, composeMembership: composeMembership, sendMail: sendMail, selfChart: selfChart };
