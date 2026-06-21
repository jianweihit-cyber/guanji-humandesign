/// <reference path="../pb_data/types.d.ts" />
// 让 users.email 成为 presentable 字段：这样其它集合(如 charts)的 owner 关系列在后台
// 才能显示该用户邮箱，而不是「N/A」。纯展示层修复，不改数据、不改权限。
migrate((app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  const f = c.fields.getByName("email");
  if (f) { f.presentable = true; app.save(c); }
}, (app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  const f = c.fields.getByName("email");
  if (f) { f.presentable = false; app.save(c); }
})
