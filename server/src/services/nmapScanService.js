const { spawn } = require('node:child_process');
const { isIP } = require('node:net');
const fs = require('node:fs');
const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

function fail(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function normalizePorts(input = '4000,5173') {
  if (typeof input !== 'string' || !/^\d{1,5}(,\d{1,5}){0,99}$/.test(input.trim())) throw fail('Nhập tối đa 100 cổng, phân cách bằng dấu phẩy (ví dụ 80,443,4000,5173).');
  const ports = [...new Set(input.trim().split(',').map(Number))];
  if (ports.some((port) => port < 1 || port > 65535)) throw fail('Cổng phải từ 1 đến 65535.');
  return ports.join(',');
}

function validateTarget(target) {
  if (typeof target !== 'string' || isIP(target) !== 4) throw fail('Tài sản cần có địa chỉ IPv4 hợp lệ; không nhập URL, tên miền hoặc dải mạng.');
  const [a, b, c, d] = target.split('.').map(Number);
  const privateIp = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
  const allowed = (process.env.NMAP_ALLOWED_TARGETS || '').split(',').map((item) => item.trim());
  if ((!privateIp && !allowed.includes(target)) || a === 0 || a >= 224 || (c === 255 && d === 255)) throw fail('Chỉ quét IP nội bộ/loopback hoặc IP được quản trị viên cho phép trong NMAP_ALLOWED_TARGETS.');
  return target;
}

function executable() {
  if (process.env.NMAP_PATH) return process.env.NMAP_PATH;
  if (process.platform === 'win32') {
    for (const path of ['D:\\nmap\\nmap.exe', 'C:\\Program Files (x86)\\Nmap\\nmap.exe', 'C:\\Program Files\\Nmap\\nmap.exe']) if (fs.existsSync(path)) return path;
  }
  return 'nmap';
}

function parseOutput(output, target) {
  if (!/Nmap done:/.test(output) || /Skipping host .* due to host timeout/i.test(output)) throw fail('Quét chưa hoàn tất hoặc mục tiêu bị timeout. Không lưu kết quả chưa đầy đủ.');
  const findings = [];
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\/(tcp)\s+open\s+(\S+)(?:\s+(.*))?$/);
    if (!match) continue;
    const [, port, protocol, service, version = ''] = match;
    findings.push({
      title: `Cổng ${port}/${protocol} đang mở (${service})`, severity: 'info',
      description: `Nmap ghi nhận ${target}:${port}/${protocol} đang mở. Dịch vụ: ${service}${version ? `. Phiên bản: ${version.trim()}` : ''}. Kết quả nhận diện dịch vụ chưa xác nhận lỗ hổng bảo mật.`,
      recommendation: 'Xác minh dịch vụ cần được công khai; giới hạn truy cập bằng firewall và kiểm tra bảo mật chuyên sâu nếu cần.',
    });
  }
  return findings;
}

class NmapScanService {
  constructor({ db = prisma, launch = spawn, audit = auditLog } = {}) {
    this.db = db;
    this.launch = launch;
    this.audit = audit;
    this.busy = false;
  }

  async recoverInterrupted() {
    // Run once before HTTP starts. A single backend process owns the scanner.
    await this.db.scanJob.updateMany({ where: { status: { in: ['queued', 'running'] } }, data: {
      status: 'failed', phase: 'Bị gián đoạn', error: 'Backend khởi động lại trong khi quét. Vui lòng chạy lại.', finishedAt: new Date(),
    } });
  }

  async list() {
    return this.db.scanJob.findMany({ take: 30, orderBy: { createdAt: 'desc' }, select: {
      id: true, assetId: true, assetName: true, target: true, ports: true, status: true, phase: true,
      progress: true, error: true, importedCount: true, createdAt: true, finishedAt: true,
    } });
  }

  async get(id) {
    const job = await this.db.scanJob.findUnique({ where: { id } });
    if (!job) throw fail('Không tìm thấy lần quét.', 404);
    const { findingsJson, ...rest } = job;
    return { ...rest, findings: JSON.parse(findingsJson) };
  }

  async start({ assetId, ports }, userId, ipAddress) {
    if (this.busy) throw fail('Đang có một tác vụ quét. Vui lòng đợi hoàn tất.', 409);
    this.busy = true;
    try {
      const asset = await this.db.asset.findUnique({ where: { id: assetId } });
      if (!asset || asset.deletedAt) throw fail('Không tìm thấy tài sản hoặc tài sản đang ở thùng rác.', 404);
      const target = validateTarget(asset.ipAddress);
      const selectedPorts = normalizePorts(ports);
      const job = await this.db.scanJob.create({ data: {
        assetId: asset.id, assetName: asset.name, target, ports: selectedPorts, createdBy: userId,
      } });
      await this.audit({ userId, ipAddress, action: 'START_NMAP_SCAN', resource: 'vulnerability', details: `Quét ${target}, cổng ${selectedPorts}, tác vụ ${job.id}` });
      // Catch every asynchronous failure; the HTTP request returns immediately.
      void this.run(job, userId, ipAddress).catch((err) => console.error('Nmap job persistence failed:', err.message)).finally(() => { this.busy = false; });
      return job;
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  async run(job, userId, ipAddress) {
    let output = '';
    let flush = () => Promise.resolve();
    try {
      await this.db.scanJob.update({ where: { id: job.id }, data: { status: 'running', phase: 'Đang quét cổng và nhận diện dịch vụ' } });
      await new Promise((resolve, reject) => {
        const child = this.launch(executable(), ['-sT', '-sV', '--version-light', '-Pn', '-n', '-p', job.ports,
          '--stats-every', '2s', '--host-timeout', '120s', job.target], { shell: false, windowsHide: true });
        let failure;
        const timer = setTimeout(() => { failure = fail('Quét quá thời gian tối đa 150 giây.'); child.kill(); }, 150000);
        const collect = (chunk) => {
          if (output.length + chunk.length > 512 * 1024) {
            failure = fail('Kết quả quét vượt giới hạn dung lượng.'); child.kill(); return;
          }
          output += chunk.toString();
        };
        child.stdout.on('data', collect);
        child.stderr.on('data', collect);
        child.once('error', (err) => {
          clearTimeout(timer);
          reject(fail(err.code === 'ENOENT' ? 'Chưa tìm thấy Nmap trên máy backend. Cài Nmap và cấu hình NMAP_PATH, sau đó khởi động lại backend.' : `Không chạy được Nmap: ${err.message}`));
        });
        child.once('close', (code) => {
          clearTimeout(timer);
          if (failure) reject(failure);
          else if (code !== 0) reject(fail(`Nmap kết thúc với mã lỗi ${code}. Xem nhật ký quét để biết chi tiết.`));
          else resolve();
        });
        // Persist live output sequentially; never let a late update overwrite completion.
        const persist = async () => {
          const percentages = [...output.matchAll(/([\d.]+)% done/g)];
          const percent = Number(percentages.at(-1)?.[1] || 0);
          const stages = [...output.matchAll(/([^\r\n]+?) Timing: About/g)];
          const phase = stages.at(-1)?.[1] || 'Đang quét cổng và nhận diện dịch vụ';
          await this.db.scanJob.update({ where: { id: job.id }, data: { output, phase, progress: Math.min(percent, 99) } });
        };
        let pending = Promise.resolve();
        const interval = setInterval(() => { pending = pending.then(persist).catch(() => {}); }, 2000);
        const cleanup = () => { clearInterval(interval); };
        child.once('close', cleanup);
        child.once('error', cleanup);
        flush = () => pending;
      });
      await flush();
      const findings = parseOutput(output, job.target);
      await this.db.$transaction(async (tx) => {
        // Store findings and completed job atomically so a scan is never partly imported.
        for (const finding of findings) await tx.vulnerability.create({ data: { ...finding, assetId: job.assetId, status: 'open' } });
        await tx.scanJob.update({ where: { id: job.id }, data: {
          status: 'completed', phase: 'Hoàn tất', progress: 100, output,
          findingsJson: JSON.stringify(findings), importedCount: findings.length, finishedAt: new Date(),
        } });
      });
      await this.audit({ userId, ipAddress, action: 'COMPLETE_NMAP_SCAN', resource: 'vulnerability', details: `${job.target}: đã lưu ${findings.length} phát hiện mức Info (${job.id}).` });
    } catch (err) {
      await flush();
      await this.db.scanJob.update({ where: { id: job.id }, data: { status: 'failed', phase: 'Thất bại', output, error: err.message, finishedAt: new Date() } });
      await this.audit({ userId, ipAddress, action: 'FAIL_NMAP_SCAN', resource: 'vulnerability', status: 'failed', details: `${job.target}: ${err.message}` });
    }
  }
}

module.exports = new NmapScanService();
module.exports.NmapScanService = NmapScanService;
module.exports.normalizePorts = normalizePorts;
module.exports.validateTarget = validateTarget;
module.exports.parseOutput = parseOutput;
