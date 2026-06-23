/// <reference path="../pb_data/types.d.ts" />
// 给 users 加可选「手机号」字段：注册时可填，后续作联系 / 通知用。
//   非必填、不唯一(允许空)、最长 30(容国际号/区号/分隔符)；不设强格式校验，前端做轻校验即可。
//   读写权限沿用 users 现有规则(listRule/viewRule=仅本人；普通用户可更新自己的 phone，不在写保护字段清单内)。
migrate((app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  function addIfMissing(f) { try { if (!c.fields.getByName(f.name)) c.fields.add(new Field(f)); } catch (e) { c.fields.add(new Field(f)); } }
  addIfMissing({ "autogeneratePattern": "", "hidden": false, "id": "text_users_phone", "max": 30, "min": 0, "name": "phone", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  const f = c.fields.getByName("phone");
  if (f) c.fields.removeById(f.id);
  app.save(c);
})
