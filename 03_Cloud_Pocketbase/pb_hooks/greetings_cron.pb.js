/// <reference path="../pb_data/types.d.ts" />
// 观己·人类图 业务邮件：生日 + 来到观己周年(365×N 天) 的「人类图定制祝福」。
//   每日 cron 扫描用户 → 取其「本人(self)标记」命盘的生日 / 账号注册周年 → 按 类型/角色 出中英双语祝福 → 发信。
//   复用 mail_send 的发信骨架(Resend SMTP)；尊重 emailOptOut；按 收件人+种类+年份 去重防重发。
//   手动测试：POST /greet-test  头 X-Send-Key=<SEND_SECRET>  body:{email, kind:'birthday'|'anniversary', years?}
//     —— 绕过日期匹配，立刻给该用户发一封示例祝福（用于上线自测）。

// —— 五型 HD 特色文案（按 sum.type 英文键取）——
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

function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

// 组装一封祝福：返回 {subject, html}
function composeGreeting(kind, lang, nick, sum, years) {
  var en = (lang === 'en');
  var name = esc(nick || (en ? 'friend' : '朋友'));
  var type = (sum && sum.type) || '';
  var typeLabel = en ? type : ((sum && sum.typeZh) || type);
  var profile = (sum && sum.profile) || '';
  var line = typeLine(type, lang);
  var subject, lead;
  if (kind === 'anniversary') {
    subject = en ? ('🌟 ' + nick + ' — ' + years + (years > 1 ? ' years' : ' year') + ' with GuanJi')
                 : ('🌟 ' + nick + '，你来到观己已满 ' + years + ' 年');
    lead = en ? ('It\'s been ' + years + (years > 1 ? ' years' : ' year') + ' since you joined GuanJi · Human Design. Thank you for walking this path of self-knowing with us.')
              : ('不知不觉，你来到「观己 · 人类图」已经满 ' + years + ' 年了。谢谢你一路以来的自我观照与同行。');
  } else {
    subject = en ? ('🎂 Happy Birthday, ' + nick + ' · GuanJi Human Design')
                 : ('🎂 ' + nick + '，生日快乐 · 观己人类图');
    lead = en ? 'Wishing you a very happy birthday from all of us at GuanJi · Human Design.'
              : '观己 · 人类图，祝你生日快乐 🎂';
  }
  var typeBadge = typeLabel ? ('<div style="display:inline-block;background:#F6EFE2;border:1px solid #ECDDC4;border-radius:8px;padding:3px 10px;font-size:13px;color:#6B5B43;margin-top:6px">' + esc(typeLabel) + (profile ? ' · ' + esc(profile) : '') + '</div>') : '';
  var cta = en ? 'Open your chart' : '看看我的人类图';
  var foot = en
    ? 'You receive this because you have a GuanJi account. To stop these emails, open Account → System emails in the app.'
    : '你收到这封信，是因为你拥有观己账号。如不想再收到，可在 App 内「账号 → 系统邮件」关闭。';
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

// 发一封信（尊重退订 + 写 mail_log，可带去重 key）。返回 {ok, skipped, err}
function sendMail(app, to, subject, html, kind, dedupKey) {
  try {
    var u = app.findFirstRecordByData("users", "email", to);
    if (u && u.getBool("emailOptOut")) return { skipped: true, reason: "opted_out" };
  } catch (_) {}
  // 去重：同一 收件人 + kind + dedupKey(年份) 已发过则跳过
  if (dedupKey) {
    try {
      var dup = app.findRecordsByFilter("mail_log", 'recipient = {:r} && kind = {:k} && meta = {:m}', "-at", 1, 0, { r: to, k: kind, m: dedupKey });
      if (dup && dup.length) return { skipped: true, reason: "already_sent" };
    } catch (_) {}
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

// 取某用户「本人(self)标记」命盘的数据(含 input/sum)，无则取其最新一条命盘；都没有返回 null
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
    return fallback;   // 没有 self 标记时退而取最新一条(仍能算生日)
  } catch (_) { return null; }
}

// —— 每日 cron：08:30 服务器时区 —— 扫描用户，匹配生日 / 注册周年 → 发祝福 ——
cronAdd("hd_greetings", "30 8 * * *", function () {
  try {
    var now = new Date();
    var md = (("0" + (now.getUTCMonth() + 1)).slice(-2)) + "-" + (("0" + now.getUTCDate()).slice(-2)); // 今日 MM-DD(UTC)
    var year = String(now.getUTCFullYear());
    var page = 0, per = 200;
    while (page < 100) {
      var users = $app.findRecordsByFilter("users", 'verified = true && emailOptOut = false', "created", per, page * per);
      if (!users || !users.length) break;
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        try {
          var email = u.getString("email"); if (!email) continue;
          var lang = (u.getString("lang") === "en") ? "en" : "zh";
          var nick = u.getString("nickname") || (lang === "en" ? "friend" : "朋友");
          var data = selfChart($app, u.id);
          var sum = (data && data.sum) || {};
          // 生日：本人盘出生 月-日 == 今天
          if (data && data.input && data.input.month && data.input.day) {
            var bmd = (("0" + data.input.month).slice(-2)) + "-" + (("0" + data.input.day).slice(-2));
            if (bmd === md) { var g = composeGreeting("birthday", lang, nick, sum, 0); sendMail($app, email, g.subject, g.html, "birthday", year); }
          }
          // 周年：账号 created 的 月-日 == 今天，且满 1 年以上
          var cr = u.getString("created"); // "YYYY-MM-DD HH:mm:ss..."
          if (cr && cr.length >= 10) {
            var cmd = cr.slice(5, 7) + "-" + cr.slice(8, 10);
            var cy = parseInt(cr.slice(0, 4), 10);
            var years = now.getUTCFullYear() - cy;
            if (cmd === md && years >= 1) { var ga = composeGreeting("anniversary", lang, nick, sum, years); sendMail($app, email, ga.subject, ga.html, "anniversary", year); }
          }
        } catch (_) {}
      }
      if (users.length < per) break; page++;
    }
  } catch (_) {}
});

// —— 手动测试路由：立刻给指定邮箱发一封示例祝福（密钥保护，绕过日期匹配）——
routerAdd("POST", "/greet-test", function (e) {
  var k = ""; try { k = e.request.header.get("X-Send-Key"); } catch (_) {}
  if (!k) { try { k = e.request.url.query().get("k"); } catch (_) {} }
  var want = ""; try { want = $os.getenv("SEND_SECRET"); } catch (_) {}
  if (!want || k !== want) return e.json(403, { error: "forbidden" });
  var body = {}; try { body = e.requestInfo().body || {}; } catch (_) {}
  var email = body.email, kind = (body.kind === "anniversary") ? "anniversary" : "birthday", years = body.years || 1;
  if (!email) return e.json(400, { error: "missing email" });
  var lang = "zh", nick = "朋友", sum = {};
  try {
    var u = e.app.findFirstRecordByData("users", "email", email);
    if (u) {
      lang = (u.getString("lang") === "en") ? "en" : "zh";
      nick = u.getString("nickname") || nick;
      var d = selfChart(e.app, u.id); if (d && d.sum) sum = d.sum;
    }
  } catch (_) {}
  if (body.lang === "en" || body.lang === "zh") lang = body.lang;   // 可强制语言测试
  var g = composeGreeting(kind, lang, nick, sum, years);
  var r = sendMail(e.app, email, g.subject, g.html, kind + "-test", "");
  return e.json(200, { ok: !!r.ok, skipped: r.skipped || false, reason: r.reason || "", err: r.err || "", subject: g.subject, lang: lang });
});
