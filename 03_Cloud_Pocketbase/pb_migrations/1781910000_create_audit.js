/// <reference path="../pb_data/types.d.ts" />
// 审计表 audit：记录运营方对用户的策略调整（目前：会员档位 tier 变更）。
//   字段 action/target/detail/by/at（at=发生时间，ISO 字符串，由钩子填）。仅超管可见(rule 全 null)；
//   由 hook 以系统权限写入(e.app.save 绕过 API 规则)。全文本字段，迁移最稳。
migrate((app) => {
  const collection = new Collection({
    "type": "base",
    "name": "audit",
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false, "id": "text_audit_id", "max": 15, "min": 15,
        "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false,
        "primaryKey": true, "required": true, "system": true, "type": "text"
      },
      { "autogeneratePattern": "", "hidden": false, "id": "text_audit_action", "max": 40, "min": 0, "name": "action", "pattern": "", "presentable": true, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_audit_target", "max": 120, "min": 0, "name": "target", "pattern": "", "presentable": true, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_audit_detail", "max": 200, "min": 0, "name": "detail", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_audit_by", "max": 120, "min": 0, "name": "by", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_audit_at", "max": 40, "min": 0, "name": "at", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" }
    ],
    "id": "pbc_audit_0001",
    "indexes": [],
    "system": false
  });
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("audit");
  app.delete(collection);
})
