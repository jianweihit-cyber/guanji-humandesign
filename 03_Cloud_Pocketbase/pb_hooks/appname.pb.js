/// <reference path="../pb_data/types.d.ts" />
// 把后台(/_/)与浏览器标题的 Application name 固化为「观己 · 人类图」，便于和其它同架构(PocketBase)应用的后端一眼区分。
// best-effort：先 e.next() 让启动继续，再 try/catch 设置；即使设置 API 异常也绝不影响后端启动。
onBootstrap((e) => {
  e.next();
  try {
    var s = $app.settings();
    if (s.meta.appName !== "观己 · 人类图") {
      s.meta.appName = "观己 · 人类图";
      if (!s.meta.appURL) s.meta.appURL = "https://humandesign.zaiyuxingzhe.com";
      $app.save(s);
    }
  } catch (err) { try { console.log("[appname] set failed:", err); } catch (_) {} }
});
