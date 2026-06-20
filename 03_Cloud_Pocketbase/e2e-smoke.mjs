/* e2e-smoke.mjs — 云后端上线前必跑的端到端联调（Node 18+，自带 fetch，零依赖）。
   用真实后端跑一遍：注册 → 登录 → 推记录 → 拉回 → 越权隔离 → 提权拦截 → 清理。
   能提前抓出「charts 缺表(404 collection context)」「越权」「提权」这类致命坑，别带到线上。
   用法：改下面 BASE 一个变量，然后 `node e2e-smoke.mjs`。测试账号用 @example.com，跑完自动删。 */

const BASE = 'https://cloud-hd.zaiyuxingzhe.com';   // ← 改成你的后端域名（或 https://<app>-cloud.fly.dev）

const PASS = '✅ PASS', FAIL = '❌ FAIL';
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
let ok = true;
const check = (cond, label, extra = '') => { console.log(`${cond ? PASS : FAIL}  ${label}${extra ? '  — ' + extra : ''}`); if (!cond) ok = false; };

const mk = (s) => `hdtest_${Date.now().toString(36)}${s}@example.com`;
const PW = 'Test12345!';

async function register(email) {
  const r = await fetch(`${BASE}/api/collections/users/records`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW, passwordConfirm: PW, tier: 'free', emailVisibility: false }),
  });
  return { status: r.status, body: await j(r) };
}
async function login(email) {
  const r = await fetch(`${BASE}/api/collections/users/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password: PW }),
  });
  const b = await j(r); return { status: r.status, token: b.token, uid: b.record && b.record.id, tier: b.record && b.record.tier };
}

(async () => {
  try {
    console.log(`\n=== e2e-smoke @ ${BASE} ===\n`);
    // 1) 健康
    const h = await fetch(`${BASE}/api/health`); check(h.status === 200, '1) 后端健康 /api/health', `HTTP ${h.status}`);

    // 2) 注册 A
    const emailA = mk('a'); const ra = await register(emailA);
    check(ra.status === 200, '2) 注册 A', `HTTP ${ra.status}` + (ra.status !== 200 ? ' ' + JSON.stringify(ra.body).slice(0, 120) : ''));

    // 3) 登录 A（顺便验 users_fields 迁移：tier 应=free）
    const A = await login(emailA);
    check(!!A.token, '3) 登录 A 拿 token', `tier=${A.tier || '(空,users_fields迁移可能没跑)'}`);
    if (!A.token) throw new Error('登录失败，后续跳过');

    // 4) 推一条命盘记录（charts 表存在性的关键测试）
    const cid = 'c' + Date.now().toString(36);
    const data = { id: cid, name: '测试·罗伯特', gender: 'M', input: { year: 1990, month: 6, day: 15, hour: 14, minute: 30, tz: '+08:00' }, updatedAt: Date.now() };
    const rp = await fetch(`${BASE}/api/collections/charts/records`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': A.token },
      body: JSON.stringify({ owner: A.uid, cid, data, cupd: Date.now(), deleted: false }),
    });
    const pbody = await j(rp);
    check(rp.status === 200, '4) 推命盘到 charts', rp.status === 200 ? '' : `HTTP ${rp.status} ${JSON.stringify(pbody).slice(0, 140)}`);
    if (rp.status === 404) console.log('   🔴 404「collection context」= charts 表没建！回手册 §2 确认 create_charts 迁移在 + 已部署。');

    // 5) 拉回核对
    const rl = await fetch(`${BASE}/api/collections/charts/records?filter=` + encodeURIComponent(`owner="${A.uid}"`), { headers: { 'Authorization': A.token } });
    const lb = await j(rl); const it = lb.items && lb.items[0];
    check(!!it && it.data && it.data.name === '测试·罗伯特', '5) 拉回数据一致', it ? `取回 ${lb.items.length} 条` : '空');

    // 6) 越权隔离：B 读 A 的盘应 0 条
    const emailB = mk('b'); await register(emailB); const B = await login(emailB);
    let crossLen = -1;
    if (B.token) { const rc = await fetch(`${BASE}/api/collections/charts/records?filter=` + encodeURIComponent(`owner="${A.uid}"`), { headers: { 'Authorization': B.token } }); const cb = await j(rc); crossLen = (cb.items || []).length; }
    check(crossLen === 0, '6) 越权隔离（B 读 A 的盘 = 0 条）', `读到 ${crossLen} 条`);

    // 7) 提权拦截：B 把自己改成 vip 应被拒
    let promo = 999;
    if (B.token) { const rpr = await fetch(`${BASE}/api/collections/users/records/${B.uid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': B.token }, body: JSON.stringify({ tier: 'vip' }) }); promo = rpr.status; }
    check(promo >= 400, '7) 提权拦截（B 自改 tier=vip 被拒）', `HTTP ${promo}` + (promo < 400 ? ' 🔴 没拦住！检查 users updateRule + users_guard 钩子' : ''));

    // 8) 清理（自助注销→级联删 charts）
    if (A.token) await fetch(`${BASE}/api/collections/users/records/${A.uid}`, { method: 'DELETE', headers: { 'Authorization': A.token } });
    if (B.token) await fetch(`${BASE}/api/collections/users/records/${B.uid}`, { method: 'DELETE', headers: { 'Authorization': B.token } });
    console.log('8) 🧹 清理两个测试账号（级联删 charts）');

    console.log(`\n=== 结论：${ok ? '✅ 全过，可上线' : '❌ 有失败项，见上（别上线）'} ===\n`);
    process.exit(ok ? 0 : 1);
  } catch (e) { console.log('✗ 异常：', e.message); process.exit(1); }
})();
