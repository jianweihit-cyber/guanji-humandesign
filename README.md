# 观己 · 人类图 GuanJi Human Design

离线优先的人类图（Human Design）排盘引擎与全功能 Web 应用：排盘 / 命盘记录 / 反推出生时间（生时校正）/ 合盘 & Penta / 知识库，简体·繁體·English 三语。

**Live:** https://humandesign.zaiyuxingzhe.com （备用 https://guanji-humandesign.fly.dev）

## 功能 Features

- **排盘 Chart** — 即时盘（打开即按当前时间出盘）、出生盘、时间滑块实时重算；类型/内在权威/人生角色/定义/轮回交叉/PHS 四箭头（颜色×音调→具体左右型）
- **Bodygraph** — 对标专业软件的标准布局（含 20/10/34/57 整合区"三通"走线），红=设计/黑=个性/红黑相间=双重激活
- **记录 Records** — 本地保存、按 姓名/闸门号/类型/角色/通道 搜索、收藏
- **反推 Rectify** — 只有图没有出生时间？由各行星 gate.line 反演出生时间窗（实测 130 年范围 <0.1s 唯一命中、窗口可窄至 34 分钟）
- **合盘 Connection / Penta** — 两人四类通道（友谊/主导/妥协/电磁）；3-5 人 Penta 场域角色与缺口
- **知识库 Library** — 类型/权威/六爻/角色/九中心/36通道/64闸门(易经卦象)/PHS 全表，可搜索可深链

精度：星历采用 Swiss Ephemeris（Moshier 离线模式，可切 JPL 高精度），经多重独立案例逐项校准（26 天体激活、类型、轮回交叉、PHS 全对标通过）。

## 本地运行 Run locally

```bash
npm install            # 安装 swisseph-wasm
python3 -m http.server 8789   # 在项目根目录启动（必须 serve 根目录）
# 打开 http://localhost:8789/web/index.html
```

测试：`node test/logic-check.js`、`node test/calibrate.js`、`node test/solve-check.js`

## 部署 Deploy (Fly.io)

```bash
fly apps create <your-app-name>
fly deploy --ha=false --depot=false
```

## 许可 License

- **代码**：[GPL-3.0](LICENSE)。
- **「观己」品牌与知识库中文解读文案**：© 再遇行者，保留所有权利，不在 GPL 授权范围内——详见 [NOTICE](NOTICE)。
- 本项目使用 **Swiss Ephemeris** © [Astrodienst AG](https://www.astro.com/swisseph/)（双重许可，此处走 GPL 路线）。闭源/商业分发需购买 Swiss Ephemeris Professional License。

## 贡献 Contributing

**Issue-only**：欢迎提 Issue 反馈问题与建议；目前**不接受 Pull Request**（保留作者对后续版本整体重新授权的权利，见 NOTICE 第 4 条）。

---

观己 · 以东方之眼，照见自己 | 再遇行者
