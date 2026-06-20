/// <reference path="../pb_data/types.d.ts" />
// 给 users(auth) 补会员/账号字段 + 收紧规则（字段写保护）。
//   字段：tier(free/pro/vip) · nickname · emailOptOut · activeFrom · activeTo。
//   createRule：注册只允许 tier 不传或=free（堵注册即提权）。
//   updateRule：仅本人、且不得携带 tier/activeFrom/activeTo/verified（与 users_guard 钩子双保险）。
//   ⚠️ 复用要点：会员/账号字段固化为迁移（别手动在后台加），幂等(已存在字段跳过)。
migrate((app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  function addIfMissing(f) { try { if (!c.fields.getByName(f.name)) c.fields.add(new Field(f)); } catch (e) { c.fields.add(new Field(f)); } }
  addIfMissing({ "autogeneratePattern": "", "hidden": false, "id": "text_users_tier", "max": 20, "min": 0, "name": "tier", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" });
  addIfMissing({ "autogeneratePattern": "", "hidden": false, "id": "text_users_nick", "max": 40, "min": 0, "name": "nickname", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" });
  addIfMissing({ "hidden": false, "id": "bool_users_optout", "name": "emailOptOut", "presentable": false, "required": false, "system": false, "type": "bool" });
  addIfMissing({ "hidden": false, "id": "date_users_afrom", "max": "", "min": "", "name": "activeFrom", "presentable": false, "required": false, "system": false, "type": "date" });
  addIfMissing({ "hidden": false, "id": "date_users_ato", "max": "", "min": "", "name": "activeTo", "presentable": false, "required": false, "system": false, "type": "date" });
  c.createRule = "@request.body.tier:isset = false || @request.body.tier = \"free\"";
  c.updateRule = "id = @request.auth.id && @request.body.tier:isset = false && @request.body.activeFrom:isset = false && @request.body.activeTo:isset = false && @request.body.verified:isset = false";
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("_pb_users_auth_");
  ["tier", "nickname", "emailOptOut", "activeFrom", "activeTo"].forEach(function (n) { const f = c.fields.getByName(n); if (f) c.fields.removeById(f.id); });
  app.save(c);
})
