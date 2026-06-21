#!/usr/bin/env node
/**
 * 观己·人类图 — charts 集合体检：核查每条云端排盘记录的 owner 是否填充。
 *
 * 背景：charts.owner 是 required 关系且 createRule 强制 owner=自己——正常 app 建的记录 owner 必非空。
 *   后台若显示「N/A」，多半是 users 没设 presentable 字段(已加迁移修复)，owner 其实有值。
 *   本脚本直连 API 用 expand=owner 把真实 owner 邮箱打出来，一锤定音；并能清理真正的空 owner 孤儿记录。
 *
 * 用法：
 *   PB_ADMIN_EMAIL='超管邮箱' PB_ADMIN_PW='超管密码' node check-charts.mjs            # 只体检、只读
 *   PB_ADMIN_EMAIL=... PB_ADMIN_PW=... node check-charts.mjs --delete-orphans         # 删除 owner 为空的孤儿记录(谨慎)
 *   可选 PB_BASE 覆盖后端地址(默认线上 cloud-hd)。
 */
const BASE = (process.env.PB_BASE || 'https://cloud-hd.zaiyuxingzhe.com').replace(/\/+$/, '');
const EMAIL = process.env.PB_ADMIN_EMAIL, PW = process.env.PB_ADMIN_PW;
const DELETE_ORPHANS = process.argv.includes('--delete-orphans');
function die(m) { console.error('✗ ' + m); process.exit(1); }
if (!EMAIL || !PW) die('请提供超管凭证：PB_ADMIN_EMAIL=... PB_ADMIN_PW=... node check-charts.mjs');

async function main() {
  // 1) 超管登录
  const ar = await fetch(BASE + '/api/collections/_superusers/auth-with-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PW }),
  });
  const aj = await ar.json().catch(() => ({}));
  if (!ar.ok || !aj.token) die('超管登录失败：' + (aj.message || ar.status));
  const auth = { Authorization: aj.token };
  console.log('✓ 超管登录成功\n');

  // 2) 拉全部 charts(展开 owner)
  let page = 1, items = [];
  while (page < 100) {
    const r = await fetch(BASE + '/api/collections/charts/records?perPage=200&expand=owner&page=' + page, { headers: auth });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) die('读取 charts 失败：' + (j.message || r.status));
    items = items.concat(j.items || []);
    if (!j.items || j.items.length < 200) break; page++;
  }

  // 3) 体检报告
  const orphans = [];
  console.log('共 ' + items.length + ' 条 charts：\n');
  console.log('  id'.padEnd(18) + 'cid'.padEnd(22) + 'owner(邮箱)'.padEnd(30) + 'deleted');
  console.log('  ' + '-'.repeat(76));
  for (const it of items) {
    const ownerId = it.owner || '';
    const ownerEmail = (it.expand && it.expand.owner && it.expand.owner.email) || '';
    const ownerShow = ownerId ? (ownerEmail || ('(id:' + ownerId + ' 用户已删?)')) : '⚠️ 空(孤儿)';
    if (!ownerId) orphans.push(it);
    console.log('  ' + String(it.id).padEnd(16) + '  ' + String(it.cid || '').padEnd(20) + '  ' + ownerShow.padEnd(28) + '  ' + (it.deleted ? '是' : '否'));
  }
  console.log('\n小结：有 owner ' + (items.length - orphans.length) + ' 条 · 空 owner(孤儿) ' + orphans.length + ' 条');
  if (!orphans.length) { console.log('✅ 所有记录 owner 都已填充——后台显示 N/A 只是 users 未设 presentable(已由迁移修复)。'); return; }

  // 4) 清理孤儿(仅 --delete-orphans)
  if (!DELETE_ORPHANS) { console.log('\n如需删除这 ' + orphans.length + ' 条孤儿记录，重跑加 --delete-orphans。'); return; }
  console.log('\n开始删除 ' + orphans.length + ' 条孤儿记录…');
  let ok = 0;
  for (const it of orphans) {
    const r = await fetch(BASE + '/api/collections/charts/records/' + it.id, { method: 'DELETE', headers: auth });
    if (r.ok || r.status === 204) ok++; else console.log('  删除失败 ' + it.id + '：' + r.status);
  }
  console.log('✅ 已删除 ' + ok + '/' + orphans.length + ' 条孤儿记录。');
}
main().catch((e) => die(String((e && e.stack) || e)));
