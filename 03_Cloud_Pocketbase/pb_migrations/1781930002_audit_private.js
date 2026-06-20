/// <reference path="../pb_data/types.d.ts" />
// 还原：核验完毕，audit 设回「仅超管可见」(listRule/viewRule = null)。
migrate((app) => {
  var c = app.findCollectionByNameOrId("audit");
  unmarshal({ "listRule": null, "viewRule": null }, c);
  return app.save(c);
}, (app) => {
  var c = app.findCollectionByNameOrId("audit");
  unmarshal({ "listRule": "", "viewRule": "" }, c);
  return app.save(c);
})
