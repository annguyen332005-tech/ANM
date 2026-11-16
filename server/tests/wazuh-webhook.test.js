const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('Wazuh webhook: authentication, persistence, deduplication, permissions and source metadata', { timeout: 60000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'secureweb-wazuh-'));
  const dbFile = path.join(dir, 'test.db');
  fs.closeSync(fs.openSync(dbFile, 'w'));
  const previous = { DATABASE_URL: process.env.DATABASE_URL, JWT_SECRET: process.env.JWT_SECRET, WAZUH_WEBHOOK_KEY: process.env.WAZUH_WEBHOOK_KEY };
  process.env.DATABASE_URL = `file:${dbFile.replaceAll('\\', '/')}`;
  process.env.JWT_SECRET = 'wazuh-webhook-isolated-test-jwt-secret';
  process.env.WAZUH_WEBHOOK_KEY = 'wazuh-test-key-not-a-production-secret-1234';
  try {
    execFileSync(process.execPath, [require.resolve('prisma'), 'db', 'push', '--skip-generate', '--schema', path.resolve(__dirname, '../prisma/schema.prisma')], { env: process.env, stdio: 'pipe' });
  } catch (err) { throw new Error(`${err.stdout?.toString()}\n${err.stderr?.toString()}`); }
  const db = require('../src/config/prisma');
  const app = require('../src/app');
  const jwt = require('jsonwebtoken');
  const wazuh = require('../src/services/wazuhService');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const payload = { id: 'test-alert-1', timestamp: '2026-11-16T10:00:00.000+0000', manager: { name: 'test-manager' },
    agent: { id: '001', name: 'Win11-Test', ip: '192.168.146.100' }, rule: { id: '100001', level: 10, description: 'Test source event' },
    data: { srcip: '192.168.146.101' }, full_log: 'Example log' };
  const post = (body, key = process.env.WAZUH_WEBHOOK_KEY) => fetch(`${base}/api/webhooks/wazuh`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Wazuh-Key': key }, body: JSON.stringify(body) });
  try {
    assert.equal((await post(payload, 'wrong')).status, 401);
    assert.equal(await db.alert.count(), 0);
    assert.equal((await post({})).status, 400);
    assert.equal((await post(payload)).status, 503, 'receiver must be enabled');
    const role = await db.role.create({ data: { name: 'Admin' } });
    const user = await db.user.create({ data: { username: 'wazuh-test', email: 'wazuh@test.local', passwordHash: 'unused', userRoles: { create: { roleId: role.id } } } });
    const bearer = { Authorization: `Bearer ${jwt.sign({ id: user.id }, process.env.JWT_SECRET)}` };
    assert.equal((await fetch(`${base}/api/integrations/wazuh/status`)).status, 401);
    assert.equal((await fetch(`${base}/api/integrations/wazuh/setup`, { method: 'POST', headers: bearer })).status, 200);
    const asset = await db.asset.create({ data: { assetId: 'TEST-WAZUH', name: 'Win11', type: 'Server', ipAddress: payload.agent.ip } });
    let response = await post(payload);
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.severity, 'high');
    response = await post(payload);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).duplicate, true);
    assert.equal(await db.alert.count(), 1);
    assert.equal(await db.securityEvent.count(), 1);
    // Fail after Alert insertion and verify the entire import is rolled back.
    await db.$executeRawUnsafe("CREATE TRIGGER reject_wazuh_test BEFORE INSERT ON SecurityEvent WHEN NEW.eventType = 'WAZUH_RULE_rollback' BEGIN SELECT RAISE(ABORT, 'test rollback'); END");
    assert.equal((await post({ ...payload, id: 'rollback', rule: { ...payload.rule, id: 'rollback' } })).status, 500);
    assert.equal(await db.alert.count(), 1);
    assert.equal(await db.wazuhReceipt.count(), 1);
    await db.$executeRawUnsafe('DROP TRIGGER reject_wazuh_test');
    const alert = await db.alert.findUnique({ where: { id: result.alertId } });
    assert.equal(alert.relatedAssetId, asset.id);
    assert.match(alert.description, /test-alert-1/);
    const receipt = await db.wazuhReceipt.findFirst();
    assert.equal(receipt.occurredAt.toISOString(), '2026-11-16T10:00:00.000Z');
    assert.equal(JSON.parse(receipt.payloadJson).full_log, payload.full_log);
    const state = await (await fetch(`${base}/api/integrations/wazuh/status`, { headers: bearer })).json();
    assert.equal(state.count, 1);
    assert.equal(state.recent[0].agentName, 'Win11-Test');
    assert.ok(!JSON.stringify(state).includes(process.env.WAZUH_WEBHOOK_KEY));
    const script = await fetch(`${base}/api/integrations/wazuh/connector`, { headers: bearer });
    assert.equal(script.status, 200);
    assert.match(await script.text(), /send_alert/);
    for (const level of [-1, 16, '10']) assert.equal((await post({ ...payload, id: 'invalid', rule: { ...payload.rule, level } })).status, 400);
    const ordinary = await db.user.create({ data: { username: 'ordinary', email: 'ordinary@test.local', passwordHash: 'unused' } });
    assert.equal((await fetch(`${base}/api/integrations/wazuh/status`, { headers: { Authorization: `Bearer ${jwt.sign({ id: ordinary.id }, process.env.JWT_SECRET)}` } })).status, 403);
    assert.equal((await fetch(`${base}/api/integrations/wazuh-webhook/simulate`, { method: 'POST', headers: bearer })).status, 400);
    await db.integration.update({ where: { id: 'wazuh-webhook' }, data: { status: 'inactive' } });
    assert.equal((await post({ ...payload, id: 'inactive' })).status, 503);
    assert.equal(await db.alert.count(), 1);
    process.env.WAZUH_WEBHOOK_KEY = '';
    assert.equal((await post(payload)).status, 503);
    assert.equal(wazuh.mapSeverity(5), 'medium');
    assert.equal(wazuh.mapSeverity(12), 'critical');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await db.$disconnect();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    // Delete only the explicitly created temporary test files, no recursive delete.
    for (const file of [dbFile, `${dbFile}-journal`, `${dbFile}-wal`, `${dbFile}-shm`]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(dir);
  }
});
