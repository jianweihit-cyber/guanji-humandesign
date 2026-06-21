/// <reference path="../pb_data/types.d.ts" />
// charts 集合：每用户云端排盘记录。owner 关联 users(级联删) · cid=客户端记录id · data=整条记录JSON(≤200KB) ·
//   cupd=客户端更新时间(ms) · deleted=软删除 · created/updated 自动时间。五条规则均「登录且 owner=自己」→ 每人只读写自己。
//   ⚠️ 复用要点：集合务必用迁移建（别手动在后台建），否则克隆出的新后端会缺此表 → 推记录报 404。
migrate((app) => {
  const R = "@request.auth.id != \"\" && owner = @request.auth.id";
  const collection = new Collection({
    "type": "base",
    "name": "charts",
    "listRule": R, "viewRule": R, "createRule": R, "updateRule": R, "deleteRule": R,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text_charts_id", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "cascadeDelete": true, "collectionId": "_pb_users_auth_", "hidden": false, "id": "rel_charts_owner", "maxSelect": 1, "minSelect": 0, "name": "owner", "presentable": false, "required": true, "system": false, "type": "relation" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_charts_cid", "max": 60, "min": 0, "name": "cid", "pattern": "", "presentable": false, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "hidden": false, "id": "json_charts_data", "maxSize": 200000, "name": "data", "presentable": false, "required": false, "system": false, "type": "json" },
      { "hidden": false, "id": "number_charts_cupd", "max": null, "min": null, "name": "cupd", "onlyInt": false, "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "bool_charts_deleted", "name": "deleted", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate_charts_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_charts_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "id": "pbc_charts_0001",
    "indexes": ["CREATE INDEX `idx_charts_owner_cid` ON `charts` (`owner`, `cid`)"],
    "system": false
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("charts"));
})
