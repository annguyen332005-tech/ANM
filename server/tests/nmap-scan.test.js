const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { NmapScanService, normalizePorts, validateTarget, parseOutput } = require('../src/services/nmapScanService');

const output = `Starting Nmap
Nmap scan report for 127.0.0.1
PORT STATE SERVICE VERSION
4000/tcp open http Node.js Express framework
5173/tcp open unknown
22/tcp closed ssh
Nmap done: 1 IP address (1 host up) scanned in 1 seconds`;

function harness(launch, rejectInsert = false) {
  const jobs = new Map();
  const findings = [];
  const db = {
    asset: { findUnique: async () => ({ id: 'asset', name: 'Test', ipAddress: '127.0.0.1' }) },
    scanJob: {
      create: async ({ data }) => {
        const job = { id: 'job', status: 'queued', output: '', findingsJson: '[]', importedCount: 0, ...data };
        jobs.set(job.id, job); return { ...job };
      },
      update: async ({ where, data }) => { Object.assign(jobs.get(where.id), data); return jobs.get(where.id); },
      findUnique: async ({ where }) => jobs.get(where.id),
    },
    vulnerability: { create: async ({ data }) => { if (rejectInsert) throw new Error('Insert failed'); findings.push(data); } },
    $transaction: async (callback) => {
      const count = findings.length;
      try { return await callback(db); } catch (err) { findings.splice(count); throw err; }
    },
  };
  const service = new NmapScanService({ db, launch, audit: async () => {} });
  return { service, jobs, findings, db };
}

function fakeLaunch(text, code = 0) {
  return () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = () => child.emit('close', 1);
    setImmediate(() => { child.stdout.emit('data', Buffer.from(text)); child.emit('close', code); });
    return child;
  };
}

test('validates single IP and bounded numeric ports; rejects command injection and public targets', () => {
  assert.equal(normalizePorts('04000,5173,4000'), '4000,5173');
  for (const input of ['80;whoami', '-p 80', '0', '65536', '1-65535', '']) assert.throws(() => normalizePorts(input));
  for (const target of ['127.0.0.1', '192.168.2.19', '10.0.0.1', '172.16.0.1']) assert.equal(validateTarget(target), target);
  for (const target of ['8.8.8.8', '127.0.0.1 & whoami', 'localhost', '192.168.1.0/24', '255.255.255.255']) assert.throws(() => validateTarget(target));
});

test('reads only open ports, permits empty completed scans and rejects incomplete output', () => {
  assert.equal(parseOutput(output, '127.0.0.1').length, 2);
  assert.deepEqual(parseOutput('Nmap done: 1 IP address (1 host up)', '127.0.0.1'), []);
  assert.throws(() => parseOutput('4000/tcp open http', '127.0.0.1'));
  assert.throws(() => parseOutput('Skipping host 127.0.0.1 due to host timeout\nNmap done:', '127.0.0.1'));
});

test('runs without a shell, imports findings, stores output and result history', async () => {
  let invocation;
  const { service, jobs, findings } = harness((...args) => { invocation = args; return fakeLaunch(output)(); });
  jobs.set('job', { id: 'job' });
  await service.run({ id: 'job', assetId: 'asset', target: '127.0.0.1', ports: '4000,5173' }, 'user', '127.0.0.1');
  assert.equal(invocation[2].shell, false);
  assert.equal(invocation[2].windowsHide, true);
  assert.equal(invocation[1].at(-1), '127.0.0.1');
  assert.equal(jobs.get('job').status, 'completed');
  assert.equal(jobs.get('job').progress, 100);
  assert.equal(findings.length, 2);
  assert.ok(findings.every((finding) => finding.severity === 'info' && !finding.cve));
  assert.equal((await service.get('job')).findings.length, 2);
});

test('failed execution and failed import never report completion or import partial results', async () => {
  for (const [launch, rejectInsert] of [[fakeLaunch('failed', 1), false], [fakeLaunch(output), true], [fakeLaunch('incomplete'), false]]) {
    const { service, jobs, findings } = harness(launch, rejectInsert);
    jobs.set('job', { id: 'job' });
    await service.run({ id: 'job', assetId: 'asset', target: '127.0.0.1', ports: '4000' }, 'user', '127.0.0.1');
    assert.equal(jobs.get('job').status, 'failed');
    assert.equal(findings.length, 0);
  }
});

test('missing Nmap produces installation instructions', async () => {
  const { service, jobs } = harness(() => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    setImmediate(() => child.emit('error', Object.assign(new Error('not found'), { code: 'ENOENT' })));
    return child;
  });
  jobs.set('job', { id: 'job' });
  await service.run({ id: 'job', target: '127.0.0.1', ports: '4000' }, 'user');
  assert.match(jobs.get('job').error, /NMAP_PATH/);
});

test('concurrent submissions are rejected until the running job finishes', async () => {
  const { service } = harness(fakeLaunch(output));
  let finish;
  service.run = () => new Promise((resolve) => { finish = resolve; });
  const first = await service.start({ assetId: 'asset', ports: '4000' }, 'user');
  assert.equal(first.status, 'queued');
  await assert.rejects(service.start({ assetId: 'asset' }, 'user'), (err) => err.statusCode === 409);
  finish();
  await new Promise(setImmediate);
  assert.equal(service.busy, false);
});

test('real local Nmap executable detects a temporary HTTP service', { skip: !require('node:fs').existsSync('D:/nmap/nmap.exe'), timeout: 160000 }, async () => {
  const http = require('node:http');
  const server = http.createServer((req, res) => res.end('Nmap local test'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { service, jobs, findings } = harness(require('node:child_process').spawn);
  jobs.set('job', { id: 'job' });
  try {
    await service.run({ id: 'job', assetId: 'asset', target: '127.0.0.1', ports: String(server.address().port) }, 'user', '127.0.0.1');
    assert.equal(jobs.get('job').status, 'completed', jobs.get('job').error);
    assert.equal(findings.length, 1);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
