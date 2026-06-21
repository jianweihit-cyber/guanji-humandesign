#!/usr/bin/env node
/**
 * 观己·人类图 — PocketBase 数据本地备份拉取脚本（异地留痕第三道防线）。
 *
 * 用途：触发一次服务端备份 → 下载最新备份 zip 到本机 ./backups/（已 gitignore）。
 *   ⚠️ 备份含全部用户出生隐私，只存本机加密盘/私有存储，永远不要提交到公开仓库。
 *
 * 用法：
 *   PB_ADMIN_EMAIL='超管邮箱' PB_ADMIN_PW='超管密码' node backup-pb.mjs
 *   可选：PB_BASE 覆盖后端地址（默认线上 cloud-hd）。
 *
 * 主力备份请用 PocketBase 后台 Settings → Backups 的「自动备份 + S3」；本脚本是 belt-and-suspenders。
 * 首次使用请先跑一次确认能成功下载（不同 PB 版本下载鉴权方式略有差异，脚本已做两种回退）。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = (process.env.PB_BASE || 'https://cloud-hd.zaiyuxingzhe.com').replace(/\/+$/, '');
const EMAIL = process.env.PB_ADMIN_EMAIL;
const PW = process.env.PB_ADMIN_PW;
const OUTDIR = join(dirname(fileURLToPath(import.meta.url)), 'backups');

function die(msg) { console.error('✗ ' + msg); process.exit(1); }
if (!EMAIL || !PW) die('请用环境变量提供超管凭证：PB_ADMIN_EMAIL=... PB_ADMIN_PW=... node backup-pb.mjs');

// 时间戳（本地）：YYYYMMDD-HHMMSS
function stamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

async function main() {
  // 1) 超管登录（与后台同一账号）
  const ar = await fetch(BASE + '/api/collections/_superusers/auth-with-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PW }),
  });
  const aj = await ar.json().catch(() => ({}));
  if (!ar.ok || !aj.token) die('超管登录失败：' + (aj.message || ar.status));
  const TOKEN = aj.token;
  const auth = { Authorization: TOKEN };
  console.log('✓ 超管登录成功');

  // 2) 触发一次新备份
  const name = 'guanji-hd-' + stamp() + '.zip';
  const cr = await fetch(BASE + '/api/backups', {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!cr.ok && cr.status !== 204) {
    const t = await cr.text().catch(() => '');
    die('创建备份失败：' + cr.status + ' ' + t.slice(0, 200));
  }
  console.log('✓ 已请求服务端创建备份：' + name);

  // 3) 列出备份，取最新一份（按 modified 降序）
  const lr = await fetch(BASE + '/api/backups', { headers: auth });
  const list = await lr.json().catch(() => []);
  if (!Array.isArray(list) || !list.length) die('备份列表为空或读取失败');
  list.sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || '')));
  const latest = list[0];
  console.log('✓ 最新备份：' + latest.key + '（' + Math.round((latest.size || 0) / 1024) + ' KB）');

  // 4) 下载：先试 Authorization 头，失败再试一次性 file token（?token=）
  let buf = null;
  let dr = await fetch(BASE + '/api/backups/' + encodeURIComponent(latest.key), { headers: auth });
  if (!dr.ok) {
    const tr = await fetch(BASE + '/api/files/token', { method: 'POST', headers: auth });
    const tj = await tr.json().catch(() => ({}));
    if (tj && tj.token) {
      dr = await fetch(BASE + '/api/backups/' + encodeURIComponent(latest.key) + '?token=' + encodeURIComponent(tj.token));
    }
  }
  if (!dr.ok) die('下载备份失败：' + dr.status + '（该 PB 版本下载鉴权方式可能不同，请用后台手动下载或配 S3 自动备份）');
  buf = Buffer.from(await dr.arrayBuffer());
  if (buf.length < 100) die('下载内容异常（过小），请检查');

  mkdirSync(OUTDIR, { recursive: true });
  const out = join(OUTDIR, latest.key);
  writeFileSync(out, buf);
  console.log('✅ 备份已保存：' + out + '（' + Math.round(buf.length / 1024) + ' KB）');
  console.log('   提醒：此文件含用户出生隐私，请勿提交到公开仓库；建议另存到加密盘/私有云。');
}

main().catch((e) => die(String((e && e.stack) || e)));
