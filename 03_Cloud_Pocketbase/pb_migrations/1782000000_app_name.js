/// <reference path="../pb_data/types.d.ts" />
// 把后台(/_/)与浏览器标题的 Application name 设为「观己 · 人类图」，便于和其它同架构(PocketBase)应用的后端一眼区分。
// 设置变更的标准位置=迁移(只跑一次，不会覆盖日后手动改名)。app.save(settings) 为官方文档写法。
migrate((app) => {
  const s = app.settings();
  s.meta.appName = "观己 · 人类图";
  if (!s.meta.appURL) s.meta.appURL = "https://humandesign.zaiyuxingzhe.com";
  app.save(s);
}, (app) => {
  const s = app.settings();
  s.meta.appName = "Acme";
  app.save(s);
})
