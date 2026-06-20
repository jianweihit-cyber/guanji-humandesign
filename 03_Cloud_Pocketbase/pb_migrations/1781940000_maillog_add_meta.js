/// <reference path="../pb_data/types.d.ts" />
// 给 mail_log 增加 meta 字段：记录这封邮件用了哪套模板变体（性别/季节/五行日主等），便于核验「功能 OK」。
migrate((app) => {
  const c = app.findCollectionByNameOrId("mail_log");
  c.fields.add(new Field({
    "autogeneratePattern": "", "hidden": false, "id": "text_ml_meta", "max": 300, "min": 0,
    "name": "meta", "pattern": "", "presentable": false, "primaryKey": false,
    "required": false, "system": false, "type": "text"
  }));
  return app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("mail_log");
  const f = c.fields.getByName("meta");
  if (f) c.fields.removeById(f.id);
  return app.save(c);
})
