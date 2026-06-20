// 祝福邮件共享库 —— 被 greetings_cron.pb.js 的 cron / route 各自 require。
// ⚠️ PocketBase 的 hook 回调在隔离 VM 运行，访问不到 .pb.js 顶层函数；共享逻辑必须放普通模块经 require 注入。
// 纯 ES5；DB/邮件相关函数以 app 为参（cron 传 $app，route 传 e.app）。

function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

// 五型 HD 特色寄语（按 sum.type 英文键）
function typeLine(type, lang) {
  var EN = {
    'Generator': "As a Generator, may this year follow what truly lights you up — respond to what excites you, and live in deep satisfaction.",
    'Manifesting Generator': "As a Manifesting Generator, may you move fast toward what you love, skip the detours, and live a vivid, satisfied life.",
    'Manifestor': "As a Manifestor, may you initiate freely, inform with ease, and live your own impact — in peace.",
    'Projector': "As a Projector, may you be seen and invited, your insight landing where it's truly valued, and live in success.",
    'Reflector': "As a Reflector, may you take your time — a whole lunar cycle — to mirror the clearest choices, and live in delight."
  };
  var ZH = {
    'Generator': "作为生产者，愿你今年也跟着那份「回应」与热爱前行，去做点亮你的事，活出满满的满足。",
    'Manifesting Generator': "作为显化生产者，愿你又快又准地奔向热爱，跳过弯路，把日子过得多彩而满足。",
    'Manifestor': "作为显示者，愿你自在地发起、坦然地告知，活出属于你的那份影响力与平和。",
    'Projector': "作为投射者，愿你被看见、被邀请，把独到的洞见用在对的人与事上，迎来真正的成功。",
    'Reflector': "作为反映者，愿你慢下来、给自己一个月亮周期，映照出最清澈的选择，活出一次次惊喜。"
  };
  var m = (lang === 'en') ? EN : ZH;
  return m[type] || (lang === 'en' ? "May this year unfold in your own true rhythm." : "愿你这一年，按自己的节奏，舒展生长。");
}

// 组装祝福 {subject, html}
function composeGreeting(kind, lang, nick, sum, years) {
  var en = (lang === 'en');
  var type = (sum && sum.type) || '';
  var typeLabel = en ? type : ((sum && sum.typeZh) || type);
  var profile = (sum && sum.profile) || '';
  var line = typeLine(type, lang);
  var subject, lead;
  if (kind === 'anniversary') {
    subject = en ? ('🌟 ' + nick + ' — ' + years + (years > 1 ? ' years' : ' year') + ' with GuanJi') : ('🌟 ' + nick + '，你来到观己已满 ' + years + ' 年');
    lead = en ? ('It\'s been ' + years + (years > 1 ? ' years' : ' year') + ' since you joined GuanJi · Human Design. Thank you for walking this path of self-knowing with us.') : ('不知不觉，你来到「观己 · 人类图」已经满 ' + years + ' 年了。谢谢你一路以来的自我观照与同行。');
  } else {
    subject = en ? ('🎂 Happy Birthday, ' + nick + ' · GuanJi Human Design') : ('🎂 ' + nick + '，生日快乐 · 观己人类图');
    lead = en ? 'Wishing you a very happy birthday from all of us at GuanJi · Human Design.' : '观己 · 人类图，祝你生日快乐 🎂';
  }
  var typeBadge = typeLabel ? ('<div style="display:inline-block;background:#F6EFE2;border:1px solid #ECDDC4;border-radius:8px;padding:3px 10px;font-size:13px;color:#6B5B43;margin-top:6px">' + esc(typeLabel) + (profile ? ' · ' + esc(profile) : '') + '</div>') : '';
  var cta = en ? 'Open your chart' : '看看我的人类图';
  var foot = en ? 'You receive this because you have a GuanJi account. To stop these emails, open Account → System emails in the app.' : '你收到这封信，是因为你拥有观己账号。如不想再收到，可在 App 内「账号 → 系统邮件」关闭。';
  var html =
    '<div style="max-width:480px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3a3330;line-height:1.75">'
    + '<div style="font-size:22px">☯️ <b>观己 · Human Design</b></div>'
    + '<h2 style="font-size:19px;margin:16px 0 4px">' + esc(en ? ('Dear ' + nick + ',') : (nick + '，你好')) + '</h2>'
    + '<p style="font-size:15px;margin:8px 0">' + esc(lead) + '</p>'
    + typeBadge
    + '<p style="font-size:15px;margin:14px 0;color:#5a5048">' + esc(line) + '</p>'
    + '<p style="margin:18px 0"><a href="https://humandesign.zaiyuxingzhe.com/web/index.html" style="display:inline-block;background:#B3433A;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:14px">' + esc(cta) + ' ›</a></p>'
    + '<p style="font-size:12px;color:#9b948a;border-top:1px solid #EDE4D4;padding-top:12px;margin-top:20px">' + esc(foot) + '</p>'
    + '<p style="font-size:12px;color:#9b948a">· 再遇行者 ·</p>'
    + '</div>';
  return { subject: subject, html: html };
}

// 发一封信（尊重退订 + 写 mail_log + 可去重）。返回 {ok, skipped, reason, err}
function sendMail(app, to, subject, html, kind, dedupKey) {
  try { var u = app.findFirstRecordByData("users", "email", to); if (u && u.getBool("emailOptOut")) return { skipped: true, reason: "opted_out" }; } catch (_) {}
  if (dedupKey) {
    try { var dup = app.findRecordsByFilter("mail_log", 'recipient = {:r} && kind = {:k} && meta = {:m}', "-at", 1, 0, { r: to, k: kind, m: dedupKey }); if (dup && dup.length) return { skipped: true, reason: "already_sent" }; } catch (_) {}
  }
  var sent = false, errMsg = "";
  try {
    var st = app.settings();
    var msg = new MailerMessage({ from: { address: st.meta.senderAddress, name: st.meta.senderName }, to: [{ address: to }], subject: subject, html: html });
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
