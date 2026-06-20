// 祝福邮件共享库 —— 被 greetings_cron.pb.js 的 cron / route 各自 require。
// ⚠️ PocketBase hook 回调在隔离 VM 运行，访问不到 .pb.js 顶层函数；共享逻辑必须放普通模块经 require 注入。
// 纯 ES5；DB/邮件相关函数以 app 为参（cron 传 $app，route 传 e.app）。
// 精美卡片模板：离目 logo + 卡片框 + 正向励志 + 名人名句 + 男女不同 accent/名句 + 中英整套 + 按 message 覆盖发件名。

var LOGO = "https://humandesign.zaiyuxingzhe.com/web/logo-email.png";
var APP = "https://humandesign.zaiyuxingzhe.com/web/index.html";

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

// 组装祝福：返回 {subject, html, fromName}
function composeGreeting(kind, lang, nick, sum, years, gender, email) {
  var en = (lang === 'en');
  var fromName = en ? 'GuanJi · Human Design' : '观己 · 人类图';
  var accent = (gender === 'F') ? '#C2698A' : (gender === 'M') ? '#4E7BA6' : '#B3433A';
  var brand = '#B3433A';
  var type = (sum && sum.type) || '';
  var typeLabel = en ? type : ((sum && sum.typeZh) || type);
  var profile = (sum && sum.profile) || '';
  var line = typeLine(type, lang);
  var q = pickQuote(gender, hashStr(email) + (years || 0), lang);

  var subject, eyebrow, headline, lead, closing;
  if (kind === 'anniversary') {
    subject = en ? ('🌟 ' + nick + ' — ' + years + (years > 1 ? ' years' : ' year') + ' with GuanJi') : ('🌟 ' + nick + '，来到观己满 ' + years + ' 年 🎉');
    eyebrow = en ? ('✦ ' + years + (years > 1 ? ' YEARS' : ' YEAR') + ' WITH GUANJI') : '✦ 观己同行纪念日';
    headline = en ? ('Thank you for these ' + years + (years > 1 ? ' years' : ' year), ' + nick) : (nick + '，谢谢你这 ' + years + ' 年的同行');
    lead = en ? "You've returned, again and again, to look within — and grow. Every quiet step you've taken on this path, we've seen. That takes real courage."
              : "这一年里，你一次次回来，观照自己、向内生长。你在这条路上走过的每一步——哪怕安静无声——我们都看见了。这份坚持，本身就很了不起。";
    closing = en ? "Here's to the next chapter — may it be even more you." : "敬下一段旅程——愿它，更像你自己。";
  } else {
    subject = en ? ('🎂 Happy Birthday, ' + nick + ' · GuanJi') : ('🎂 ' + nick + '，生日快乐 · 观己人类图');
    eyebrow = en ? '✦ HAPPY BIRTHDAY' : '✦ 生日快乐';
    headline = en ? ('Happy birthday, ' + nick + ' 🎂') : (nick + '，生日快乐 🎂');
    lead = en ? "On your day, we just want to say it plainly: the world is brighter with you in it. May this new year hold you gently, surprise you kindly — and may you be truly seen, most of all by yourself."
              : "在你生日这天，想认真地对你说一句：因为有你，这个世界更亮了一点。愿新的一岁，被温柔以待、被惊喜眷顾——也愿你，被好好看见，尤其是被你自己。";
    closing = en ? "Step into this year exactly as you are — that's more than enough." : "就以你本来的样子，走进新的一岁——这就已经足够好了。";
  }

  var typeBox = typeLabel ? (
    '<tr><td style="padding:0 26px"><div style="background:#F7F0E3;border-left:4px solid ' + accent + ';border-radius:10px;padding:12px 14px;margin:6px 0 2px">'
    + '<div style="font-size:12px;color:#9b948a;letter-spacing:.5px">' + (en ? 'YOUR DESIGN' : '你的人类图') + ' · ' + esc(typeLabel) + (profile ? ' · ' + esc(profile) : '') + '</div>'
    + '<div style="font-size:14.5px;color:#3a3330;line-height:1.7;margin-top:5px">' + esc(line) + '</div></div></td></tr>'
  ) : '';

  var cta = en ? 'Open your chart' : '看看我的人类图';
  var foot = en ? 'You receive this because you have a GuanJi account. To stop these, open Account → System emails in the app.'
                : '你收到这封信，是因为你拥有观己账号。如不想再收到，可在 App 内「账号 → 系统邮件」关闭。';

  var html =
    '<div style="margin:0;padding:24px 12px;background:#F0E7D6">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#FCFAF4;border:1px solid #ECDDC4;border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">'
    // header
    + '<tr><td style="background:' + brand + ';background-image:linear-gradient(135deg,#B3433A,#8c2f28);padding:24px 20px;text-align:center">'
    + '<img src="' + LOGO + '" width="60" height="60" alt="观己" style="display:block;margin:0 auto 8px;border:0;outline:none">'
    + '<div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px">' + (en ? 'GuanJi · Human Design' : '观己 · 人类图') + '</div></td></tr>'
    // eyebrow + headline + lead
    + '<tr><td style="padding:24px 26px 4px"><div style="font-size:12px;font-weight:700;letter-spacing:2px;color:' + accent + '">' + esc(eyebrow) + '</div>'
    + '<h1 style="font-size:21px;line-height:1.4;margin:8px 0 6px;color:#3a3330">' + esc(headline) + '</h1>'
    + '<p style="font-size:15px;line-height:1.85;color:#5a5048;margin:6px 0 4px">' + esc(lead) + '</p></td></tr>'
    + typeBox
    // quote
    + '<tr><td style="padding:6px 26px"><div style="border-top:1px dashed #E2D5BC;border-bottom:1px dashed #E2D5BC;padding:16px 4px;margin:14px 0;text-align:center">'
    + '<div style="font-size:16px;font-style:italic;color:#6B5B43;line-height:1.7">&ldquo;' + esc(q.text) + '&rdquo;</div>'
    + '<div style="font-size:13px;color:#A99A80;margin-top:8px">— ' + esc(q.author) + '</div></div></td></tr>'
    // closing + cta
    + '<tr><td style="padding:2px 26px 4px"><p style="font-size:15px;line-height:1.8;color:#5a5048;margin:2px 0">' + esc(closing) + '</p></td></tr>'
    + '<tr><td style="padding:14px 26px 26px;text-align:center"><a href="' + APP + '" style="display:inline-block;background:' + brand + ';color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:15px;font-weight:600">' + esc(cta) + ' &rsaquo;</a></td></tr>'
    // footer
    + '<tr><td style="background:#F6EFE2;padding:16px 22px;text-align:center;border-top:1px solid #ECDDC4">'
    + '<div style="font-size:12px;color:#9b948a;line-height:1.6">' + esc(foot) + '</div>'
    + '<div style="font-size:12px;color:#C9BEA9;margin-top:6px">· ' + (en ? 'Zai Yu Xing Zhe' : '再遇行者') + ' ·</div></td></tr>'
    + '</table></div>';

  return { subject: subject, html: html, fromName: fromName };
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

// 取用户「本人(self)标记」命盘 data；无则取最新一条；都没有 null
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

module.exports = { esc: esc, typeLine: typeLine, composeGreeting: composeGreeting, sendMail: sendMail, selfChart: selfChart };
