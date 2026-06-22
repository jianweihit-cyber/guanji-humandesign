/// <reference path="../pb_data/types.d.ts" />
// 安全加固：把 users(最敏感集合：email/tier/activeTo) 的读取权限【显式钉死为仅本人】，
// 不再依赖建库时的默认值(默认值可能被后台误改成"登录可读"→任何注册用户分页拉全量邮箱+会员情报)。
// 同时给 updateRule 再加 emailVisibility 守卫(用户不得自改邮箱可见性)。与 users_guard 钩子纵深防御。
migrate((app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  c.listRule = "id = @request.auth.id";
  c.viewRule = "id = @request.auth.id";
  c.updateRule = "id = @request.auth.id && @request.body.tier:isset = false && @request.body.activeFrom:isset = false && @request.body.activeTo:isset = false && @request.body.verified:isset = false && @request.body.emailVisibility:isset = false";
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  c.updateRule = "id = @request.auth.id && @request.body.tier:isset = false && @request.body.activeFrom:isset = false && @request.body.activeTo:isset = false && @request.body.verified:isset = false";
  app.save(c);
})
