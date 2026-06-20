# 观己·人类图 云端后端（PocketBase）— 由五行后端克隆

> 这套后端是从「观己·五行」的成熟后端**整套克隆**而来（账号 + 云端记录同步 + 系统邮件 + 运营后台）。
> 完整原理 / 配方 / 踩坑 / 克隆步骤见上层 **`../../观己云后端复用手册.md`**。

- 引擎：PocketBase v0.39（单 Go 二进制 + SQLite，数据在 `/pb/pb_data` 加密卷）
- 后端 app：`guanji-humandesign-cloud`（region sin，与人类图静态站 `guanji-humandesign` 分离）
- 客户端 BASE：默认 `https://guanji-humandesign-cloud.fly.dev`（见 `web/hd-cloud.js`；上自有子域后改 `cloud-hd.zaiyuxingzhe.com`）

## 已克隆 / 已剔除

- **保留（通用）**：迁移建表（users/charts/plans/audit/mail_log）+ 钩子 `charts_cap` / `users_guard` / `audit_tier` / `mail_send`（通用发信路由 `/send-mail`）+ 运营后台 `pb_public/dashboard.html`。
- **已剔除（五行专属）**：生日邮件模板 `mail_birthday.pb.js`、五行圆图 `wx-circles.png`、五行红底 logo `email-logo.png`。人类图如需业务邮件，按本 App 调性另写，复用 `/send-mail` 骨架。

## 🚀 上线 checklist（哥本人，约 15 分钟）

```bash
# 1) 建 app + 卷
fly apps create guanji-humandesign-cloud
fly volumes create pb_data --region sin --size 1 -a guanji-humandesign-cloud --yes
# 2) 首次部署（建表迁移自动跑）
cd "03_Cloud_Pocketbase" && fly deploy --ha=false --yes --depot=false
# 3) 建超管（密码你自己设、记本机密码库）
fly ssh console -a guanji-humandesign-cloud -C "/pb/pocketbase superuser upsert <你的邮箱> <你设的密码>"
# 4) 设发信密钥
fly secrets set SEND_SECRET='<随机串>' -a guanji-humandesign-cloud
# 5) 健康检查
curl -s -o /dev/null -w "%{http_code}\n" https://guanji-humandesign-cloud.fly.dev/api/health   # 期望 200
```

然后在后台 `https://guanji-humandesign-cloud.fly.dev/_/` 设一次（详见手册 §6）：
- Mail：SMTP `smtp.resend.com:465` / user `resend` / pass=Resend key / 发件 `noreply@zaiyuxingzhe.com` / senderName「观己·人类图」
- `meta.appURL` = **后端域名**（裸 .fly.dev 或自有子域）
- Rate limits 开启 + trustedProxy=`Fly-Client-IP`

> 可选自有子域：Cloudflare 加 `CNAME cloud-hd → guanji-humandesign-cloud.fly.dev`（灰云 DNS-only）→ `fly certs add cloud-hd.zaiyuxingzhe.com -a guanji-humandesign-cloud` → 把 `hd-cloud.js` 的 BASE 与后台 appURL 同步改。

## 前端集成（静态站 web/）

1. 页面引入 `<script src="nickpool.js"></script><script src="hd-cloud.js"></script>`。✅ **无需改 Dockerfile**——HD 的 Dockerfile 是 `COPY web /usr/share/nginx/html/web` 整目录拷贝，放进 `web/` 的这俩文件自动包含（不像五行要逐个 COPY）。
2. **CSP**：HD 当前 `deploy/nginx.conf` **没有 Content-Security-Policy** → fetch 到后端**开箱即可用，不会被拦**。⚠️ 将来若给 HD 补五行那套安全头（HSTS/CSP/X-Frame-Options…，建议补），**CSP 的 `connect-src` 记得放行后端域**，否则会触发「网络不可达」（见手册 §7）。
3. 账号页 UI（抄五行 renderAccount/gcAcctBar/gcToggleSync/gcEditNickname/gcToggleEmail/gcExpRemind）+ 与 `HDStore` 的同步胶水：给 `HDStore` 加一个 `replaceAll(arr)` 批量写回，并在 `add/remove/toggleFav` 后挂 `GC.syncOn() && 防抖 fullSync(HDStore.all())`、`remove` 时 `GC.softDelete(id)`。`HDStore` 记录天生带 `id`+`updatedAt`（ms），与 `fullSync` 完全兼容。（合盘/Penta `links` 同步可作 Phase 2。）
4. 隐私政策（`web/` 下相应页）补「云端同步与账号（可选）」章节，坚持「文化学习·自我认知，非算命、非封建迷信」定位（合规语境保留该措辞）。

> 黄金法则：后端整套照搬（已剔专属件），客户端只改 BASE，难点都在手册的踩坑清单里替你磨平了。
