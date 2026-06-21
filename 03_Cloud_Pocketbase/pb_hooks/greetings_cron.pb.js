/// <reference path="../pb_data/types.d.ts" />
// 观己·人类图 业务邮件：生日 + 来到观己周年(365×N 天) 的「人类图定制祝福」。
//   每日 cron 扫用户 → 取其「本人(self)标记」排盘的生日 / 账号注册周年 → 按 类型/角色 出中英双语祝福 → 发信。
//   ⚠️ PB hook 回调是隔离 VM，访问不到本文件顶层函数 → 共享逻辑放 greet_lib.js，在每个回调内 require 注入。
//   手动测试：POST /greet-test  头 X-Send-Key=<SEND_SECRET>  body:{email, kind:'birthday'|'anniversary', years?, lang?}

// —— 每日 cron：08:30 —— 扫描用户，匹配生日 / 注册周年 → 发祝福 ——
cronAdd("hd_greetings", "30 8 * * *", function () {
  try {
    var G = require(__hooks + "/greet_lib.js");
    var now = new Date();
    var md = (("0" + (now.getUTCMonth() + 1)).slice(-2)) + "-" + (("0" + now.getUTCDate()).slice(-2));
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
          var data = G.selfChart($app, u.id);
          var sum = (data && data.sum) || {};
          var gender = (data && data.gender) || '';
          var crStr = u.getString("created");   // 与观己相伴天数(生日寄语「已相伴 N 天」)
          var joinDays = (crStr && crStr.length >= 10) ? Math.floor((now.getTime() - new Date(crStr.slice(0, 10) + "T00:00:00Z").getTime()) / 86400000) : 0;
          if (data && data.input && data.input.month && data.input.day) {
            var bmd = (("0" + data.input.month).slice(-2)) + "-" + (("0" + data.input.day).slice(-2));
            if (bmd === md) { var g = G.composeGreeting("birthday", lang, nick, sum, 0, gender, email, joinDays); G.sendMail($app, email, g.subject, g.html, "birthday", year, g.fromName); }
          }
          var cr = u.getString("created");
          if (cr && cr.length >= 10) {
            var cmd = cr.slice(5, 7) + "-" + cr.slice(8, 10);
            var years = now.getUTCFullYear() - parseInt(cr.slice(0, 4), 10);
            if (cmd === md && years >= 1) { var ga = G.composeGreeting("anniversary", lang, nick, sum, years, gender, email); G.sendMail($app, email, ga.subject, ga.html, "anniversary", year, ga.fromName); }
          }
          // 会员到期提醒：付费档(tier≠free)且有 activeTo → 到期前 30/14/7/3/1 天 + 过期，各去重
          var tier = u.getString("tier") || "free";
          var atStr = u.getString("activeTo");
          if (tier !== "free" && atStr && atStr.length >= 10) {
            var atDate = atStr.slice(0, 10);
            var dl = Math.ceil((new Date(atDate + "T23:59:59Z").getTime() - now.getTime()) / 86400000);
            if ([30, 14, 7, 3, 1].indexOf(dl) >= 0) { var gm = G.composeMembership(lang, nick, gender, dl, false, tier); G.sendMail($app, email, gm.subject, gm.html, "membership-expiring", "exp" + dl + "@" + atDate, gm.fromName); }
            else if (dl <= 0) { var ge = G.composeMembership(lang, nick, gender, dl, true, tier); G.sendMail($app, email, ge.subject, ge.html, "membership-expired", "expired@" + atDate, ge.fromName); }
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
  var email = body.email, kind = body.kind || "birthday", years = body.years || 1;
  if (!email) return e.json(400, { error: "missing email" });
  try {
    var G = require(__hooks + "/greet_lib.js");
    var lang = "zh", nick = "", sum = {}, gender = "";
    try {
      var u = e.app.findFirstRecordByData("users", "email", email);
      if (u) { lang = (u.getString("lang") === "en") ? "en" : "zh"; nick = u.getString("nickname") || ""; var d = G.selfChart(e.app, u.id); if (d) { if (d.sum) sum = d.sum; gender = d.gender || ""; } }
    } catch (_) {}
    if (body.lang === "en" || body.lang === "zh") lang = body.lang;
    if (body.gender === "M" || body.gender === "F") gender = body.gender;   // 测试可强制性别
    if (body.nick) nick = body.nick;                                        // 测试可强制昵称
    if (!nick) nick = (lang === "en" ? "friend" : "朋友");
    var g;
    if (kind === "membership-expired") g = G.composeMembership(lang, nick, gender, (body.daysLeft != null ? body.daysLeft : 0), true, body.tier || "pro");
    else if (kind === "membership-expiring") g = G.composeMembership(lang, nick, gender, (body.daysLeft != null ? body.daysLeft : 7), false, body.tier || "pro");
    else g = G.composeGreeting(kind === "anniversary" ? "anniversary" : "birthday", lang, nick, sum, years, gender, email || "seed", (body.days != null ? body.days : 128));
    var r = G.sendMail(e.app, email, g.subject, g.html, kind + "-test", "", g.fromName);
    return e.json(200, { ok: !!r.ok, skipped: r.skipped || false, reason: r.reason || "", err: r.err || "", subject: g.subject, lang: lang, gender: gender });
  } catch (ex) {
    return e.json(200, { ok: false, error: String((ex && ex.stack) || ex) });
  }
});
