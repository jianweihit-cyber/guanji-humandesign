/// <reference path="../pb_data/types.d.ts" />
// 给 charts 加可选「备注图片」文件字段 noteImg：用户在记录上传一张图(活动合照/名片等)辅助辨识。
//   单文件、限图片、≤5MB、protected(私有，读取需 file token——与 charts owner 隔离一致，图片同属隐私)。
//   备注「文字」不在此——文字随整条记录存进 data(json)，本就同步，无需字段。
//   读写权限沿用 charts 现有五规则(登录且 owner=自己)，文件读取走 PocketBase file token。
migrate((app) => {
  const c = app.findCollectionByNameOrId("charts");
  function addIfMissing(f) { try { if (!c.fields.getByName(f.name)) c.fields.add(new Field(f)); } catch (e) { c.fields.add(new Field(f)); } }
  addIfMissing({
    "hidden": false, "id": "file_charts_noteimg", "name": "noteImg",
    "maxSelect": 1, "maxSize": 5242880,
    "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
    "thumbs": [], "protected": true, "presentable": false, "required": false, "system": false, "type": "file"
  });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("charts");
  const f = c.fields.getByName("noteImg");
  if (f) c.fields.removeById(f.id);
  app.save(c);
})
