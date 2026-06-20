/// <reference path="../pb_data/types.d.ts" />
// 临时：把 audit 设为公开只读，便于免登录核验钩子是否在写。核验后由 1781930002 立即还原为仅超管。
migrate((app) => {
  var c = app.findCollectionByNameOrId("audit");
  unmarshal({ "listRule": "", "viewRule": "" }, c);
  return app.save(c);
}, (app) => {
  var c = app.findCollectionByNameOrId("audit");
  unmarshal({ "listRule": null, "viewRule": null }, c);
  return app.save(c);
})
