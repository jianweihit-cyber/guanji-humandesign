/// <reference path="../pb_data/types.d.ts" />
// 档位表 plans：把各会员档位的「云端记录数上限」做成后端可配置数据。
//   超管在后台 Collections → plans 改一行 chartCap 即时生效，无需改代码/重新部署。
//   chartCap <= 0 视为「不限」。listRule/viewRule 公开只读（前端要读取上限来显示与软提示）；
//   写入仅超管（create/update/deleteRule = null）。
migrate((app) => {
  const collection = new Collection({
    "type": "base",
    "name": "plans",
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_plans_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_plans_tier",
        "max": 20,
        "min": 0,
        "name": "tier",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_plans_cap",
        "max": null,
        "min": null,
        "name": "chartCap",
        "onlyInt": true,
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_plans_label",
        "max": 50,
        "min": 0,
        "name": "label",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_plans_0001",
    "indexes": ["CREATE UNIQUE INDEX `idx_plans_tier` ON `plans` (`tier`)"],
    "system": false
  });
  app.save(collection);

  const seed = [["free", 2000, "免费版"], ["pro", 0, "Pro 会员"], ["vip", 0, "VIP"]];
  for (let i = 0; i < seed.length; i++) {
    const r = new Record(collection);
    r.set("tier", seed[i][0]);
    r.set("chartCap", seed[i][1]);
    r.set("label", seed[i][2]);
    app.save(r);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("plans");
  app.delete(collection);
})
