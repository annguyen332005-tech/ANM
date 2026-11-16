import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNmapReport } from './parseNmapReport.js';

const report = `# Nmap 7.993 scan initiated
Nmap scan report for 192.168.2.19
Host is up (0.0019s latency).
PORT     STATE SERVICE VERSION
4000/tcp open  http    Node.js Express framework
5173/tcp open  unknown
22/tcp closed ssh
53/udp open|filtered domain
SF-Port5173-TCP:V=7.993
SF:4000/tcp open fake
# Nmap done`;

test('imports only confirmed open ports without inventing CVEs or CVSS', () => {
  const result = parseNmapReport(report.replaceAll('\n', '\r\n'));
  assert.equal(result.target, '192.168.2.19');
  assert.equal(result.findings.length, 2);
  assert.match(result.findings[0].description, /Node.js Express framework/);
  assert.match(result.findings[1].title, /5173\/tcp/);
  for (const finding of result.findings) {
    assert.equal(finding.severity, 'info');
    assert.equal(finding.cve, undefined);
    assert.equal(finding.cvssScore, undefined);
  }
});

test('extracts address from a hostname report', () => {
  assert.equal(parseNmapReport(report.replace('for 192.168.2.19', 'for server.local (192.168.2.19)')).target, '192.168.2.19');
});

test('rejects unrelated text, no open ports, and multiple hosts', () => {
  assert.throws(() => parseNmapReport('not a scan'));
  assert.throws(() => parseNmapReport('Nmap scan report for 127.0.0.1\n22/tcp closed ssh'));
  assert.throws(() => parseNmapReport(`${report}\nNmap scan report for 192.168.2.20\n80/tcp open http`));
});

test('imports JSON ports with the same result as text', () => {
  const json = { target: '192.168.2.19', ports: [
    { port: 4000, protocol: 'tcp', state: 'open', service: 'http', version: 'Node.js Express framework' },
    { port: 5173, protocol: 'tcp', state: 'open', service: 'unknown' },
    { port: 22, protocol: 'tcp', state: 'closed', service: 'ssh' },
  ] };
  assert.deepEqual(parseNmapReport(JSON.stringify(json)), parseNmapReport(report));
});

test('supports host arrays and structured service/state fields', () => {
  const result = parseNmapReport(JSON.stringify({ hosts: [{ ip: '192.168.2.19', ports: [
    { portid: '4000', protocol: 'tcp', state: { state: 'open' }, service: { name: 'http', product: 'Express', version: '5' } },
  ] }] }));
  assert.equal(result.findings.length, 1);
  assert.match(result.findings[0].description, /Express 5/);
});

test('rejects invalid JSON, malformed ports, empty and multi-host reports', () => {
  for (const input of ['{broken', 'null', '[]', '{"hosts":[{},{}]}', '{"target":"host","ports":[{}]}', '{"target":"host","ports":[]}', '{"target":"host","ports":[{"port":70000,"state":"open"}]}']) {
    assert.throws(() => parseNmapReport(input));
  }
});
