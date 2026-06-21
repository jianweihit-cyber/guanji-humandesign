/// <reference path="../pb_data/types.d.ts" />
// links 集合：每用户云端「合盘 / Penta」记录（与 charts 平行）。owner 关联 users(级联删) ·
//   lid=客户端链接id('l...') · data=整条链接JSON(name/kind/members[{id,name}]，仅成员名+引用、不含出生数据) ·
//   cupd=客户端更新时间(ms) · deleted=软删除。五条规则均「登录且 owner=自己」→ 每人只读写自己。
//   注：members 只存 {id,name}，敏感出生数据仍在各自 charts 里(数据最小化友好)。
migrate((app) => {
  const R = "@request.auth.id != \"\" && owner = @request.auth.id";
  const collection = new Collection({
    "type": "base",
    "name": "links",
    "listRule": R, "viewRule": R, "createRule": R, "updateRule": R, "deleteRule": R,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text_links_id", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "cascadeDelete": true, "collectionId": "_pb_users_auth_", "hidden": false, "id": "rel_links_owner", "maxSelect": 1, "minSelect": 1, "name": "owner", "presentable": false, "required": true, "system": false, "type": "relation" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_links_lid", "max": 60, "min": 0, "name": "lid", "pattern": "", "presentable": false, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "hidden": false, "id": "json_links_data", "maxSize": 100000, "name": "data", "presentable": false, "required": false, "system": false, "type": "json" },
      { "hidden": false, "id": "number_links_cupd", "max": null, "min": null, "name": "cupd", "onlyInt": false, "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "bool_links_deleted", "name": "deleted", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate_links_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_links_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "id": "pbc_links_0001",
    "indexes": ["CREATE INDEX `idx_links_owner_lid` ON `links` (`owner`, `lid`)"],
    "system": false
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("links"));
})
