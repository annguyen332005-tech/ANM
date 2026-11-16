import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScanReport } from './parseScanReport.js';

const site = { '@name': 'https://example.test', alerts: [{ name: 'SQL Injection', riskcode: '3', cweid: '89', desc: 'Evidence', solution: 'Parameterized queries' }] };
test('ZAP preserves reported risk and remediation without inventing CVSS', () => {
  const result = parseScanReport('OWASP ZAP', JSON.stringify({ site: [site] }));
  assert.equal(result.target, site['@name']);
  assert.equal(result.findings[0].severity, 'high');
  assert.equal(result.findings[0].cve, 'CWE-89');
  assert.equal(result.findings[0].recommendation, 'Parameterized queries');
  assert.equal(result.findings[0].cvssScore, undefined);
});
test('rejects incompatible, empty, multi-site and invalid risk ZAP reports', () => {
  for (const report of [{}, { site: [] }, { site: [{ ...site, alerts: [] }] }, { site: [site, { ...site, '@name': 'https://other.test' }] }, { site: [{ ...site, alerts: [{ name: 'Invalid', riskcode: '' }] }] }]) {
    assert.throws(() => parseScanReport('OWASP ZAP', JSON.stringify(report)));
  }
});
test('XML entity declarations are rejected before parsing', () => {
  for (const tool of ['Nessus', 'OpenVAS']) {
    assert.throws(() => parseScanReport(tool, '<!DOCTYPE report><report/>'), /DOCTYPE/);
  }
});
