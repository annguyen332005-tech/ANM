// Parse Nmap's normal text output (-oN), excluding fingerprints and NSE text.
export function parseNmapReport(text) {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseNmapJson(trimmed);
  const hosts = [];
  const findings = [];
  let host = '';
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const hostMatch = line.match(/^Nmap scan report for\s+(.+?)\s*$/);
    if (hostMatch) {
      host = hostMatch[1].match(/\(([^)]+)\)$/)?.[1] || hostMatch[1];
      hosts.push(host);
      continue;
    }
    const portMatch = line.match(/^\s*(\d+)\/(tcp|udp|sctp)\s+open\s+(\S+)(?:\s+(.*))?\s*$/);
    if (!host || !portMatch) continue;
    const [, port, protocol, service, version = ''] = portMatch;
    findings.push({
      title: `Cổng ${port}/${protocol} đang mở (${service})`,
      severity: 'info',
      description: `Nmap ghi nhận ${host}:${port}/${protocol} đang mở. Dịch vụ: ${service}${version ? `. Phiên bản: ${version.trim()}` : ''}. Kết quả nhận diện dịch vụ chưa xác nhận lỗ hổng bảo mật.`,
      recommendation: 'Xác minh dịch vụ cần được công khai; giới hạn truy cập bằng firewall và kiểm tra bảo mật chuyên sâu nếu cần.',
    });
  }
  if (hosts.length !== 1) {
    throw new Error('Vui lòng chọn báo cáo Nmap dạng text (-oN) của đúng một máy để gắn với một tài sản.');
  }
  if (!findings.length) {
    throw new Error('Báo cáo không có cổng ở trạng thái open để nhập.');
  }
  return { target: hosts[0], findings };
}

// Accepted JSON: { target, ports: [{ port, protocol, state, service, version }] }
// or { hosts: [{ ip, ports: [...] }] }. JSON converters may use portid/state objects.
function parseNmapJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File JSON Nmap không hợp lệ.');
  }
  const hosts = data?.hosts ?? (data && !Array.isArray(data) ? [data] : data);
  if (!Array.isArray(hosts) || hosts.length !== 1 || !hosts[0] || typeof hosts[0] !== 'object') {
    throw new Error('JSON Nmap phải chứa đúng một máy trong target/ports hoặc hosts.');
  }
  const host = hosts[0];
  const target = host.target ?? host.ip ?? host.address;
  if (typeof target !== 'string' || !target.trim() || /[\r\n]/.test(target) || !Array.isArray(host.ports)) {
    throw new Error('JSON Nmap cần target (hoặc ip/address) và mảng ports.');
  }
  const rows = host.ports.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Mục ports trong JSON không hợp lệ.');
    const port = item.port ?? item.portid;
    const protocol = item.protocol ?? 'tcp';
    const state = typeof item.state === 'object' ? item.state?.state : item.state;
    if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535 || !['tcp', 'udp', 'sctp'].includes(protocol) || typeof state !== 'string' || !/^[a-z|]+$/.test(state)) {
      throw new Error('JSON Nmap có cổng, giao thức hoặc trạng thái không hợp lệ.');
    }
    const service = typeof item.service === 'object' ? item.service?.name : item.service;
    const version = typeof item.service === 'object'
      ? [item.service?.product, item.service?.version, item.service?.extrainfo].filter(Boolean).join(' ')
      : item.version;
    if ((service != null && (typeof service !== 'string' || /\s/.test(service))) || (version != null && (typeof version !== 'string' || /[\r\n]/.test(version)))) {
      throw new Error('JSON Nmap có thông tin dịch vụ không hợp lệ.');
    }
    return `${port}/${protocol} ${state} ${service || 'unknown'} ${version || ''}`;
  });
  return parseNmapReport(`Nmap scan report for ${target.trim()}\n${rows.join('\n')}`);
}
