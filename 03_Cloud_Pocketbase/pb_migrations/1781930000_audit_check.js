/// <reference path="../pb_data/types.d.ts" />
// 诊断用：启动时数一下 audit 表条数并打日志（确认审计钩子是否真在写）。无 schema 改动。
migrate((app) => {
  try {
    var n = app.countRecords("audit");
    app.logger().info("[audit-check] audit count = " + n);
  } catch (e) {
    app.logger().error("[audit-check] ERR " + String(e));
  }
}, (app) => {})
