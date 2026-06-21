# ③ 数据最小化 + 后台 MFA — 方案评估

> 配合 `docs/商用安全认证路线图.md`「只做三件事」之③、`docs/安全-备份与留痕.md`。
> 本文是评估 + 取舍，供拍板；标 ✅ 的是我可直接落地的低风险项。

## 0. 结论先行（TL;DR）

- **现状**：排盘记录把 **出生年月日时分 + 地点 + 姓名**（`input`）上云（charts.data）——这是**唯一的高敏感项**；合盘/Penta（links）已只存成员名+引用、**无出生数据** ✅；账号存邮箱/昵称/会员档位等。
- **核心取舍**：app 的「跨设备恢复 + 打开重算」要么让服务器持有 `input`，要么持有 `input` 的**密文**。**客户端加密**是"既保功能又最小化"的最优解，代价是"忘密码=无法解密"需设计。
- **推荐路线**：A（立即·低成本·零风险）裁冗余派生字段 → C（低成本）后台超管 MFA → B（中期·最大隐私提升）出生数据客户端加密。

## 1. 现在到底上传了什么（数据流体检）

| 对象 | 存哪 | 含哪些字段 | 敏感度 |
|---|---|---|---|
| **charts.data** | 云端 charts 集合 | `input{year,month,day,hour,minute,tz,place}` + name + gender + tags + `sum{type,profile,authority,definition,gates,channels, personality, design, gatesP, gatesD}` | 🔴 **高**（出生数据） |
| **links.data** | 云端 links 集合 | name + kind + `members[{id,name}]`（成员名+引用） | 🟢 低（无出生数据，已最小化） |
| **users** | 云端 users | email, nickname, lang, tier, activeFrom/To, emailOptOut | 🟡 中（账号必需） |
| 传输/存储 | — | 全站 HTTPS + Fly 卷静态加密（已有）；但**超管/admin 可明文读 charts** | — |

## 2. 敏感度排序

1. 🔴 **出生时间 + 地点 + 命盘**：可推断身份、作息，叠加命理可推断信仰倾向 → PIPL 敏感个人信息 + 跨境（新加坡）。
2. 🟡 邮箱、姓名。
3. 🟢 昵称、tier、links。

## 3. 方案选项对比

| 方案 | 做法 | 隐私 | 功能完整 | 复杂度 | 后台可调试 |
|---|---|---|---|---|---|
| 0 现状 | 全量上云（input+完整 sum） | 低 | 满 | 无 | 明文可读 |
| **A 裁字段** | 云端 data 去掉**可重算的** personality/design/gatesP/gatesD，只留 input + 列表/搜索所需精简 sum | 略升 | 满 | 低 ✅ | 明文可读 |
| **B 客户端加密** | 对 `input`(+姓名)用口令派生密钥加密→服务器只存**密文** + 列表所需最小明文摘要(type/profile…) | 🟢 **高** | 满（客户端解密→重算） | 中 | 出生数据**不可读** |
| C 极简上云 | 只上 sum 摘要、不上 input | 高 | ❌ 残（跨设备无法"打开重算"，只能看摘要） | 低 | 仅摘要可读 |

> C 牺牲核心功能（换设备打不开完整盘），不推荐。

## 4. 推荐：分阶段

### Phase A — 裁冗余字段（✅ 立即可做·零风险·不破坏功能）
云端 `charts.data` 只保留：`input + name + gender + tags + 精简 sum(type/typeZh/profile/authority/definition/gates/channels)`，**去掉 `personality / design / gatesP / gatesD`**——这些打开记录时本就由引擎重算，不必上云。
- 收益：减少上云数据量与冗余的派生敏感信息；列表显示与搜索（按类型/角色/闸门/通道）不受影响；打开重算照常。
- 做法：`hd-cloud.pushChart` 上传前对 `data` 做一次"瘦身"投影；拉回时缺失字段打开时重算补齐。

### Phase B — 出生数据客户端加密（中期·最大隐私提升·需拍板 UX）
对最敏感的 `input`（出生数据）+ `name` 做**端到端加密**：
- **密钥来源（二选一，需你定）**：
  - ① **登录口令派生**（PBKDF2/Argon2）——零额外记忆；但"改密/忘密 = 旧密文无法解密"（需迁移流程或接受丢失）。
  - ② **独立"数据密码"**——与登录解耦、可单独管理；代价是用户多记一个密码。
- 服务器存：**密文 blob** + 列表/搜索所需的最小**明文派生摘要**（type/profile/authority/gates——不直接暴露出生时刻）。
- 收益：服务器脱库 / 超管 / 跨境第三方都**读不到出生数据**；PIPL 敏感信息 + 跨境风险**大幅下降**（密文）；契合"数据最小化/去标识化"监管期望，是落地页可写的强力卖点。
- 代价：忘密恢复设计；后台无法再明文排错（隐私优先，可接受）；实现复杂度中等。

### Phase C — 后台超管 MFA（低成本）
- PocketBase v0.23+ 支持集合级 **MFA**：对 `_superusers` 开启后，超管登录需"两种方式"（密码 + 邮箱 OTP）。
- 操作：`/_/` → _superusers 集合 / Settings → 开 MFA（具体位置以你 PB v0.39 界面为准，我可陪你点）。
- ⚠️ 联动：`dashboard.html` 超管登录走 `/api/collections/_superusers/auth-with-password`，开 MFA 后该端点会要求二次验证 → 我需给 dashboard **补一个 OTP 输入步骤**（Phase C 的小改）。
- 另建议：Fly / Cloudflare / GitHub 账号也开 2FA（已在安全文档列为待办）。

## 5. links 与 users
- **links**：已最小化（仅成员名 + 引用，无出生数据），无需改。
- **users**：邮箱（登录必需）、昵称（可选）、tier/有效期（会员必需）——无明显可裁项；用途已在隐私政策声明、不二次使用。

## 6. 建议执行顺序
1. **Phase A**（我现在就能做，零风险，先落地瘦身）。
2. **Phase C MFA**（你后台开 + 我给 dashboard 补 OTP）。
3. **Phase B 客户端加密**（最大隐私提升）——需你先定：密钥用 **登录口令** 还是 **独立数据密码**？忘密 **接受丢失** 还是 **做恢复机制**？定了我再实现。

---
**待拍板**：① Phase A 是否现在就做？② MFA 现在开吗（我同步给 dashboard 加 OTP）？③ Phase B 走哪种密钥模型？
