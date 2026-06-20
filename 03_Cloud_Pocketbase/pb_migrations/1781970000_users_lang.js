/// <reference path="../pb_data/types.d.ts" />
// 给 users 补 lang 字段（用户默认语言：'zh' / 'en'）——决定昵称语种 + 生日/周年祝福邮件语言。
//   updateRule 已允许本人改 lang（不在禁改字段 tier/activeFrom/activeTo/verified 之列），无需调整规则。
//   幂等：字段已存在则跳过。
migrate((app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  try { if (!c.fields.getByName("lang")) c.fields.add(new Field({ "autogeneratePattern": "", "hidden": false, "id": "text_users_lang", "max": 8, "min": 0, "name": "lang", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" })); }
  catch (e) { c.fields.add(new Field({ "id": "text_users_lang", "name": "lang", "max": 8, "type": "text" })); }
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  const f = c.fields.getByName("lang"); if (f) c.fields.removeById(f.id);
  app.save(c);
})
