/// <reference path="../pb_data/types.d.ts" />
// 兜底：确保 charts.noteImg 文件字段存在。PB 迁移只跑一次——若 1782030000 首次应用时该文件字段
// 因任何原因没真正建上(静默)，重部署也不会重跑它；故用本「新」迁移幂等补加(已存在则 no-op)。
migrate((app) => {
  const c = app.findCollectionByNameOrId("charts");
  if (!c.fields.getByName("noteImg")) {
    c.fields.add(new Field({
      "hidden": false, "id": "file_charts_noteimg", "name": "noteImg",
      "maxSelect": 1, "maxSize": 5242880,
      "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
      "thumbs": [], "protected": true, "presentable": false, "required": false, "system": false, "type": "file"
    }));
    app.save(c);
  }
}, (app) => { /* 不回滚字段(避免误删用户已上传图片)；如需删见 1782030000 down */ })
