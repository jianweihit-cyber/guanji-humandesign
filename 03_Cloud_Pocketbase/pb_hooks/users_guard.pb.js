/// <reference path="../pb_data/types.d.ts" />
// 会员字段硬守卫：阻断「普通用户(users 集合鉴权)自助修改」会员/计费字段 tier/activeFrom/activeTo。
//   仅当请求鉴权身份属于 users 集合(即普通登录用户)且这些字段确有变更时才拒绝；
//   超管(_superusers)与系统/无鉴权(令牌验证流、迁移、e.app.save)一律放行 → 后台授予会员不受影响。
//   与 collection updateRule 互为纵深防御；与 audit 钩子(只记录)互补(本钩子负责拦截)。
onRecordUpdateRequest((e) => {
  var orig = null;
  try { orig = e.record.original ? e.record.original() : null; } catch (_) {}
  if (orig) {
    var authColl = "";
    try {
      var auth = e.requestInfo().auth;
      if (auth && auth.collection) authColl = auth.collection().name;
    } catch (_) {}
    if (authColl === "users") { // 普通用户自助更新 → 守卫敏感字段
      var guarded = ["tier", "activeFrom", "activeTo"];
      for (var i = 0; i < guarded.length; i++) {
        var f = guarded[i], ov = "", nv = "";
        try { ov = String(orig.get(f)); } catch (_) {}
        try { nv = String(e.record.get(f)); } catch (_) {}
        if (ov !== nv) {
          throw new ForbiddenError("无权修改会员字段（" + f + "）。会员调整请联系客服。");
        }
      }
    }
  }
  e.next();
}, "users");
