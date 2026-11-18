const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FirewallService } = require('../src/services/firewallService');

test('firewall validates scope, calls only a fixed script, verifies success, and surfaces permission errors', async () => {
  const previous = { FIREWALL_LOCAL_IP: process.env.FIREWALL_LOCAL_IP, FIREWALL_PROTECTED_IPS: process.env.FIREWALL_PROTECTED_IPS };
  process.env.FIREWALL_LOCAL_IP = '192.168.146.1';
  process.env.FIREWALL_PROTECTED_IPS = '192.168.146.135';
  let calls = [];
  const service = new FirewallService((file, args, options, cb) => {
    calls.push({ file, args, options });
    cb(null, JSON.stringify({ success: true, blocked: args[args.indexOf('-Operation') + 1] === 'Block', remoteIP: '192.168.146.132', localIP: '192.168.146.1', ruleName: 'test' }));
  }, 'win32');
  try {
    for (const ip of ['192.168.146.132;whoami', '8.8.8.8', '127.0.0.1', '192.168.146.1', '192.168.146.135', '192.168.146.0/24']) await assert.rejects(service.apply('Block', ip));
    assert.equal(calls.length, 0);
    assert.equal((await service.apply('Block', '192.168.146.132')).blocked, true);
    assert.equal((await service.apply('Unblock', '192.168.146.132')).blocked, false);
    assert.equal(calls[0].file, 'powershell.exe');
    assert.equal(calls[0].options.shell, false);
    assert.ok(calls[0].args.includes('192.168.146.132'));
    const denied = new FirewallService((file, args, options, cb) => cb(new Error('denied'), JSON.stringify({ success: false, error: 'ADMIN_REQUIRED' })), 'win32');
    await assert.rejects(denied.apply('Block', '192.168.146.132'), (err) => err.statusCode === 403 && /Administrator|administrator/.test(err.message));
    const malformed = new FirewallService((file, args, options, cb) => cb(null, 'invalid output'), 'win32');
    await assert.rejects(malformed.apply('Block', '192.168.146.132'));
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('incident response never records successful containment when firewall execution fails; honors targetIp', async () => {
  const db = require('../src/config/prisma');
  const firewall = require('../src/services/firewallService');
  const incidents = require('../src/services/incidentService');
  const original = { find: db.incident.findUnique, create: db.incidentAction.create, update: db.incident.update, apply: firewall.apply };
  let writes = 0;
  db.incident.findUnique = async () => ({ id: 'incident', status: 'new', asset: { ipAddress: '192.168.146.100' } });
  db.incidentAction.create = async () => { writes++; };
  db.incident.update = async () => { writes++; };
  firewall.apply = async (operation, ip) => { assert.equal(ip, '192.168.146.132'); throw new Error('Admin required'); };
  try {
    await assert.rejects(incidents.executeResponseAction('incident', { actionType: 'BLOCK_IP', targetIp: '192.168.146.132', notes: 'human note' }, 'user'));
    assert.equal(writes, 0);
  } finally { db.incident.findUnique = original.find; db.incidentAction.create = original.create; db.incident.update = original.update; firewall.apply = original.apply; }
});
