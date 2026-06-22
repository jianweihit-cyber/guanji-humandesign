/// <reference path="../pb_data/types.d.ts" />
// 服务端强制「云端记录数上限」。从 plans 集合读取登录用户档位(tier)的 chartCap：
//   cap <= 0 视为不限。fail-open：读取/计数任何异常一律放行(cap=0)，绝不因 hook bug 拦住正常存盘；
//   只有「确实查到一个 >0 的上限且已达到」才拒绝创建。
onRecordCreateRequest((e) => {
  let cap = 0, ownerId = "";
  try {
    var ri = (typeof e.requestInfo === "function") ? e.requestInfo() : e.requestInfo;
    var auth = ri && ri.auth;
    if (auth && auth.collection && auth.collection().name === "users") {
      ownerId = auth.id;
      var tier = auth.getString("tier") || "free";
      // 会员过期自动回落：tier≠free 且 activeTo 已过期(按日期字典序比较，避开 Goja Date 解析) → 当 free 计上限。
      if (tier !== "free") {
        var at = "";
        try { at = String(auth.getString("activeTo") || "").slice(0, 10); } catch (_) {}
        if (at) {
          var todayStr = (new Date()).toISOString().slice(0, 10);
          if (at < todayStr) tier = "free";
        }
      }
      var plan = e.app.findFirstRecordByData("plans", "tier", tier);
      if (plan) cap = plan.getInt("chartCap");
    }
  } catch (err) {
    cap = 0; // 查不到 plans / 任何异常 → 不限制(保安全，不误伤正常用户)
  }
  if (cap > 0 && ownerId) {
    var n = 0;
    try {
      n = e.app.countRecords("charts", $dbx.exp("owner = {:o} AND deleted = false", { o: ownerId }));  // 软删不占配额(否则删了也腾不出空间)
    } catch (err) {
      n = 0; // 计数失败 → 放行
    }
    if (n >= cap) {
      throw new BadRequestError("已达当前档位的云端备份上限（" + cap + " 条）。可删除部分记录，或升级后继续。");
    }
  }
  e.next();
}, "charts");
