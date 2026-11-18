const { execFile } = require('node:child_process');
const { isIP } = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
class FirewallService {
  constructor(run = execFile, platform = process.platform) { this.run = run; this.platform = platform; }
  async apply(operation, remoteIP) {
    if (!['Block', 'Unblock'].includes(operation)) throw fail('Hành động firewall không hợp lệ.');
    if (this.platform !== 'win32') throw fail('Chức năng này cần backend chạy trên Windows.', 503);
    const localIP = process.env.FIREWALL_LOCAL_IP;
    if (isIP(localIP || '') !== 4) throw fail('Cấu hình FIREWALL_LOCAL_IP trong server/.env bằng IP MSI, rồi khởi động lại backend.', 503);
    if (typeof remoteIP !== 'string' || isIP(remoteIP) !== 4) throw fail('Nhập đúng một IPv4 nguồn, không nhập câu lệnh hoặc ghi chú.');
    const octets = remoteIP.split('.').map(Number);
    const privateIp = octets[0] === 10 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168);
    const ownAddresses = Object.values(os.networkInterfaces()).flat().filter(Boolean).map((address) => address.address);
    const protectedIps = (process.env.FIREWALL_PROTECTED_IPS || '').split(',').map((s) => s.trim());
    if (!privateIp || remoteIP === localIP || ownAddresses.includes(remoteIP) || protectedIps.includes(remoteIP)) throw fail('Chỉ thao tác IP lab nội bộ; không chặn IP backend hoặc máy quản trị được bảo vệ.');
    return new Promise((resolve, reject) => {
      this.run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File', path.resolve(__dirname, '../../scripts/incident-firewall.ps1'), '-Operation', operation, '-RemoteIP', remoteIP, '-LocalIP', localIP],
      { windowsHide: true, shell: false, timeout: 30000, maxBuffer: 65536, encoding: 'utf8' }, (err, stdout) => {
        let result;
        try { result = JSON.parse(stdout.trim().replace(/^\uFEFF/, '')); } catch { /* Unparsed output must never be reported as success. */ }
        if (err || !result?.success || result.blocked !== (operation === 'Block')) {
          const admin = result?.error?.includes('ADMIN_REQUIRED');
          reject(fail(admin ? 'Backend chưa có quyền Windows Firewall. Dừng backend, mở PowerShell bằng Run as administrator và chạy lại npm run dev:server.'
            : `Không xác nhận được thao tác Windows Firewall. ${result?.error || 'Kiểm tra quyền Administrator và script PowerShell trên MSI.'} Luật có thể đã thay đổi; kiểm tra Windows Firewall trước khi thử lại.`, admin ? 403 : 503));
        } else resolve(result);
      });
    });
  }
}
module.exports = new FirewallService();
module.exports.FirewallService = FirewallService;
