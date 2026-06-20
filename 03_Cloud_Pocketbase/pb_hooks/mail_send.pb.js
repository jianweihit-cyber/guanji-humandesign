/// <reference path="../pb_data/types.d.ts" />
// 发信路由 POST /send-mail?k=<SEND_SECRET>  body:{to,subject,html,kind}
//   流程：校验密钥 → 查 emailOptOut(退订则跳过) → 经配置的 SMTP(Resend) 发信 → 写 mail_log → 返回结果。
//   密钥从 Fly env SEND_SECRET 读，未配则一律 403。供定时任务/手动测试调用。
routerAdd("POST", "/send-mail", (e) => {
  var k = "", want = "";
  try { k = e.request.header.get("X-Send-Key"); } catch (_) {}       // 优先用头传密钥（不落访问日志）
  if (!k) { try { k = e.request.url.query().get("k"); } catch (_) {} } // 回退 query（兼容旧调用）
  try { want = $os.getenv("SEND_SECRET"); } catch (_) {}
  if (!want || k !== want) { return e.json(403, { error: "forbidden" }); }

  var body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  var to = body.to, subject = body.subject || "（无主题）", html = body.html || "", kind = body.kind || "test", meta = body.meta || "";
  if (!to) { return e.json(400, { error: "missing to" }); }

  // 尊重退订
  try {
    var u = e.app.findFirstRecordByData("users", "email", to);
    if (u && u.getBool("emailOptOut")) {
      return e.json(200, { skipped: true, reason: "opted_out" });
    }
  } catch (_) {}

  // 发信（经配置的 SMTP = Resend）
  var sent = false, errMsg = "";
  try {
    var st = e.app.settings();
    var msg = new MailerMessage({
      from: { address: st.meta.senderAddress, name: st.meta.senderName },
      to: [{ address: to }],
      subject: subject,
      html: html,
    });
    e.app.newMailClient().send(msg);
    sent = true;
  } catch (err) { errMsg = String(err); }

  // 写 mail_log
  var logId = "";
  try {
    var c = e.app.findCollectionByNameOrId("mail_log");
    var rec = new Record(c);
    rec.set("recipient", to);
    rec.set("subject", subject);
    rec.set("kind", kind);
    rec.set("status", sent ? "sent" : ("failed: " + errMsg).slice(0, 38));
    rec.set("at", (new Date()).toISOString());
    rec.set("meta", String(meta).slice(0, 300));
    rec.set("summary", String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200));
    e.app.save(rec);
    logId = rec.id;
  } catch (_) {}

  return e.json(200, { ok: sent, sent: sent, mailLogId: logId, err: errMsg });
});
