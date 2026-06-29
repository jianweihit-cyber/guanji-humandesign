/// <reference path="../pb_data/types.d.ts" />
// famous 集合：后台可维护的「名人库」补充条目。前端 celebs.html 把静态 hd-celebs.js 与本集合合并展示，
//   类型/Profile/权威等摘要由「前端引擎实时算盘」得出(本集合只存录入项：名/类/地/可靠度/简介/出生数据)。
//   权限：published 的记录「公开只读」(任何人可 list/view)；增删改一律仅超管(后台 /_/ 维护) → 用户改不了、防误操作、前后端统一。
//   ⚠️ 复用要点：集合务必用迁移建(别手动后台建)，否则克隆/重建后端会缺表。
migrate((app) => {
  const PUB = "published = true";   // 公开只读：仅返回已发布条目
  const collection = new Collection({
    "type": "base",
    "name": "famous",
    "listRule": PUB, "viewRule": PUB,
    "createRule": null, "updateRule": null, "deleteRule": null,   // 仅超管(后台)可写
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text_famous_id", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_zh", "max": 60, "min": 0, "name": "zh", "pattern": "", "presentable": true, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_en", "max": 80, "min": 0, "name": "en", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_cat", "max": 20, "min": 0, "name": "cat", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_placezh", "max": 80, "min": 0, "name": "placeZh", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_placeen", "max": 120, "min": 0, "name": "placeEn", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_rodden", "max": 10, "min": 0, "name": "rodden", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_source", "max": 120, "min": 0, "name": "source", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_blurbzh", "max": 300, "min": 0, "name": "blurbZh", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text_famous_blurben", "max": 400, "min": 0, "name": "blurbEn", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "json_famous_input", "maxSize": 4000, "name": "input", "presentable": false, "required": true, "system": false, "type": "json" },
      { "hidden": false, "id": "number_famous_sort", "max": null, "min": null, "name": "sort", "onlyInt": true, "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "bool_famous_published", "name": "published", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate_famous_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_famous_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "id": "pbc_famous_0001",
    "indexes": [],
    "system": false
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("famous"));
})
