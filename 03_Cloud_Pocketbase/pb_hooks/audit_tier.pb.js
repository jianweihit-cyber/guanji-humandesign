/// <reference path="../pb_data/types.d.ts" />
// 综合审计：注册 + users 任意字段变更（前后值）→ 写 audit。全内联（无 helper/logger，最稳）。fail-open。
onRecordCreateRequest((e) => {
  try {
    var c = e.app.findCollectionByNameOrId("audit");
    var a = new Record(c);
    a.set("action", "user_create");
    a.set("target", e.record.getString("email") || e.record.id);
    a.set("detail", "注册 · tier=" + (e.record.getString("tier") || "free"));
    a.set("by", "自助注册");
    a.set("at", (new Date()).toISOString());
    e.app.save(a);
  } catch (err) {}
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  try {
    var rec = e.record;
    var orig = rec.original ? rec.original() : null;
    if (orig) {
      var tgt = rec.getString("email") || rec.id;
      var fields = ["tier", "verified", "email", "emailVisibility", "nickname", "emailOptOut", "activeFrom", "activeTo", "lang"];
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i], ov = "", nv = "";
        try { ov = String(orig.get(f)); } catch (_) {}
        try { nv = String(rec.get(f)); } catch (_) {}
        if (ov !== nv) {
          var act = (f === "emailOptOut") ? (nv === "true" ? "email_optout" : "email_optin")
                  : (f === "verified" && nv === "true") ? "verify"
                  : (f === "activeFrom" || f === "activeTo") ? "membership_change"
                  : (f + "_change");
          var c = e.app.findCollectionByNameOrId("audit");
          var a = new Record(c);
          a.set("action", act);
          a.set("target", tgt);
          a.set("detail", f + ": " + (ov || "(空)") + " → " + (nv || "(空)"));
          a.set("by", "user/admin");
          a.set("at", (new Date()).toISOString());
          e.app.save(a);
        }
      }
    }
  } catch (err) {}
  e.next();
}, "users");
