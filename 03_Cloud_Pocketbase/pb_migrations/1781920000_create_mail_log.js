/// <reference path="../pb_data/types.d.ts" />
// 邮件发送记录 mail_log：每发一封系统邮件就留一条（收件人/主题/类型/状态/时间/内容摘要）。
//   仅超管可见(rule 全 null)；由发信路由以系统权限写入。全文本字段，迁移稳。
//   说明：真正的发信路由(生日祝福/年度汇总)在"发信那一程"建，发成功/失败都写这里。
migrate((app) => {
  const collection = new Collection({
    "type": "base",
    "name": "mail_log",
    "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text_ml_id", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_ml_to", "max": 160, "min": 0, "name": "recipient", "pattern": "", "presentable": true, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_ml_subj", "max": 200, "min": 0, "name": "subject", "pattern": "", "presentable": true, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_ml_kind", "max": 40, "min": 0, "name": "kind", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_ml_status", "max": 40, "min": 0, "name": "status", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_ml_at", "max": 40, "min": 0, "name": "at", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "text_ml_body", "max": 4000, "min": 0, "autogeneratePattern": "", "name": "summary", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" }
    ],
    "id": "pbc_maillog_0001",
    "indexes": [], "system": false
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("mail_log"));
})
