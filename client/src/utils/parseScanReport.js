import { parseNmapReport } from './parseNmapReport.js';

export const SCAN_FORMATS = {
  Nmap: { accept: '.txt,.json', label: '.txt (-oN) hoặc .json' },
  Nessus: { accept: '.nessus,.xml', label: '.nessus hoặc .xml (Nessus v2)' },
  OpenVAS: { accept: '.xml', label: '.xml (Greenbone XML)' },
  'OWASP ZAP': { accept: '.json', label: '.json (Traditional JSON)' },
};

const value = (node, tag) => node.getElementsByTagName(tag)[0]?.textContent.trim() || '';
const score = (raw) => raw !== '' && raw != null && Number.isFinite(Number(raw)) && Number(raw) >= 0 && Number(raw) <= 10 ? Number(raw) : null;
const severity = (n) => n >= 9 ? 'critical' : n >= 7 ? 'high' : n >= 4 ? 'medium' : n > 0 ? 'low' : 'info';
const levels = ['info', 'low', 'medium', 'high', 'critical'];

function finish(targets, findings) {
  const unique = [...new Set(targets.filter(Boolean))];
  if (unique.length !== 1 || targets.some((target) => !target)) throw new Error('Báo cáo phải chứa đúng một máy hoặc website để gắn với một tài sản. Vui lòng xuất riêng từng mục tiêu.');
  if (!findings.length) throw new Error('Báo cáo không có phát hiện phù hợp để nhập.');
  if (findings.some((item) => !item.title || item.title.length < 2)) throw new Error('Báo cáo có phát hiện thiếu tiêu đề.');
  return { target: unique[0], findings };
}

export function parseScanReport(tool, text) {
  if (tool === 'Nmap') return parseNmapReport(text);
  if (tool === 'OWASP ZAP') {
    const data = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (!Array.isArray(data.site)) throw new Error('Vui lòng xuất báo cáo ZAP dạng Traditional JSON (có danh sách site).');
    return finish(data.site.map((site) => site['@name']), data.site.flatMap((site) => {
      if (!Array.isArray(site.alerts)) throw new Error('Báo cáo ZAP thiếu danh sách alerts.');
      return site.alerts.map((item) => {
        const level = /^[0-3]$/.test(String(item.riskcode)) ? ['info', 'low', 'medium', 'high'][Number(item.riskcode)] : null;
        if (!level) throw new Error('Báo cáo ZAP có riskcode không hợp lệ.');
        return {
          title: item.name || item.alert,
          severity: level,
          cve: item.cweid && Number(item.cweid) > 0 ? `CWE-${item.cweid}` : null,
          description: String(item.desc || ''),
          recommendation: String(item.solution || ''),
        };
      });
    }));
  }
  if (!['Nessus', 'OpenVAS'].includes(tool)) throw new Error('Công cụ chưa được hỗ trợ.');
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Không hỗ trợ XML chứa DOCTYPE hoặc ENTITY.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('File XML không hợp lệ.');
  if (tool === 'Nessus') {
    if (doc.documentElement.tagName !== 'NessusClientData_v2') throw new Error('File phải là báo cáo Nessus v2 (.nessus).');
    const hosts = [...doc.getElementsByTagName('ReportHost')];
    return finish(hosts.map((host) => [...host.getElementsByTagName('tag')].find((tag) => tag.getAttribute('name') === 'host-ip')?.textContent.trim() || host.getAttribute('name')),
      hosts.flatMap((host) => [...host.getElementsByTagName('ReportItem')].map((item) => {
        const cvssScore = score(value(item, 'cvss3_base_score')) ?? score(value(item, 'cvss_base_score'));
        const level = item.getAttribute('severity');
        if (!/^[0-4]$/.test(level || '')) throw new Error('Báo cáo Nessus có severity không hợp lệ.');
        return {
          title: item.getAttribute('pluginName') || value(item, 'plugin_name'),
          severity: cvssScore === null ? levels[Number(level)] : severity(cvssScore),
          cvssScore,
          cve: [...item.getElementsByTagName('cve')].map((node) => node.textContent.trim()).join(', ') || null,
          description: [value(item, 'description') || value(item, 'synopsis'), `Cổng: ${item.getAttribute('port')}/${item.getAttribute('protocol')}`, value(item, 'plugin_output')].filter(Boolean).join('\n'),
          recommendation: value(item, 'solution'),
        };
      })));
  }
  const results = [...doc.querySelectorAll('results > result')];
  return finish(results.map((item) => {
    const host = item.getElementsByTagName('host')[0];
    return host ? [...host.childNodes].filter((node) => node.nodeType === 3 || node.nodeType === 4).map((node) => node.textContent).join('').trim() : '';
  }), results.map((item) => {
    const cvssScore = score(value(item, 'severity')) ?? score(value(item, 'cvss_base'));
    if (cvssScore === null) throw new Error('Kết quả OpenVAS thiếu điểm severity/CVSS hợp lệ.');
    const tags = value(item, 'tags');
    const solution = value(item, 'solution') || tags.match(/(?:^|\|)solution=([^|]*)/)?.[1] || '';
    const cves = [...item.querySelectorAll('ref[type="cve"]')].map((ref) => ref.getAttribute('id')).filter(Boolean);
    const legacyCve = value(item, 'cve');
    return {
      title: value(item, 'name'),
      severity: severity(cvssScore), cvssScore,
      cve: cves.join(', ') || (legacyCve && legacyCve !== 'NOCVE' ? legacyCve : null),
      description: [value(item, 'description'), `Cổng: ${value(item, 'port')}`].join('\n'),
      recommendation: solution,
    };
  }));
}
