import { useState } from 'react';
import Modal from '../common/Modal';

const PRESETS = {
  'OWASP ZAP': [
    {
      title: 'SQL Injection in Query Parameter',
      severity: 'critical',
      cve: 'CWE-89',
      cvssScore: 9.8,
      description: 'Phát hiện tham số tìm kiếm không được tham số hóa, cho phép kẻ tấn công trích xuất dữ liệu cơ sở dữ liệu qua mệnh đề UNION SELECT.',
      recommendation: 'Sử dụng Prepared Statements / Parameterized Queries trong Prisma ORM và Zod validation cho toàn bộ đầu vào.',
    },
    {
      title: 'Cross-Site Scripting (Reflected XSS)',
      severity: 'high',
      cve: 'CWE-79',
      cvssScore: 7.5,
      description: 'Dữ liệu người dùng nhập vào được trả về trực tiếp trong tài liệu HTML mà không qua xử lý lọc ký tự đặc biệt.',
      recommendation: 'Mã hóa HTML (HTML Entity Encoding) và kích hoạt Content-Security-Policy (CSP) qua Helmet.',
    },
    {
      title: 'Missing Content-Security-Policy Header',
      severity: 'low',
      cve: 'CWE-1021',
      cvssScore: 3.8,
      description: 'Phản hồi HTTP thiếu header CSP giúp giảm thiểu rủi ro XSS và chèn mã độc.',
      recommendation: 'Cấu hình middleware Helmet trong Express backend để thiết lập CSP header chuẩn.',
    },
  ],
  Nmap: [
    {
      title: 'Insecure Telnet Service Running on Port 23',
      severity: 'high',
      cve: 'CVE-2020-10188',
      cvssScore: 8.1,
      description: 'Dịch vụ Telnet truyền thông tin dưới dạng văn bản thuần (plaintext), dễ bị nghe lén tài khoản quản trị.',
      recommendation: 'Vô hiệu hóa Telnet, chuyển toàn bộ sang SSH v2 với xác thực khóa công khai.',
    },
    {
      title: 'Anonymous FTP Login Allowed on Port 21',
      severity: 'medium',
      cve: 'CVE-1999-0497',
      cvssScore: 5.3,
      description: 'Máy chủ FTP cho phép đăng nhập nặc danh (anonymous user), có thể rò rỉ tệp tin cấu hình.',
      recommendation: 'Tắt tài khoản anonymous trong file cấu hình vsftpd/proftpd.',
    },
  ],
  Nessus: [
    {
      title: 'OpenSSL Heartbleed Vulnerability',
      severity: 'critical',
      cve: 'CVE-2014-0160',
      cvssScore: 9.4,
      description: 'Lỗ hổng rò rỉ bộ nhớ nghiêm trọng trong thư viện OpenSSL TLS cho phép đọc khóa bí mật của máy chủ.',
      recommendation: 'Cập nhật OpenSSL lên phiên bản 1.0.1g hoặc mới hơn ngay lập tức.',
    },
    {
      title: 'SMBv1 Protocol Enabled',
      severity: 'high',
      cve: 'CVE-2017-0144',
      cvssScore: 8.5,
      description: 'Giao thức chia sẻ tệp SMB phiên bản 1 lỗi thời, có nguy cơ bị tấn công phát tán mã độc tống tiền EternalBlue (WannaCry).',
      recommendation: 'Tắt SMBv1 trên toàn bộ máy chủ và máy trạm, chỉ sử dụng SMBv2 hoặc SMBv3.',
    },
  ],
  OpenVAS: [
    {
      title: 'Default Credentials on Embedded Web Service',
      severity: 'high',
      cve: 'CWE-798',
      cvssScore: 8.0,
      description: 'Dịch vụ quản trị web sử dụng cặp tài khoản mặc định (admin/admin).',
      recommendation: 'Bắt buộc đổi mật khẩu mặc định và kích hoạt xác thực hai yếu tố (2FA/MFA).',
    },
  ],
};

export default function ScanImportModal({ isOpen, onClose, onImport, assets = [] }) {
  const [toolName, setToolName] = useState('OWASP ZAP');
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [target, setTarget] = useState('http://192.168.10.21:4000');
  const [findingsJson, setFindingsJson] = useState(JSON.stringify(PRESETS['OWASP ZAP'], null, 2));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToolChange = (newTool) => {
    setToolName(newTool);
    if (PRESETS[newTool]) {
      setFindingsJson(JSON.stringify(PRESETS[newTool], null, 2));
    }
  };

  const handleAssetSelect = (e) => {
    const selectedId = e.target.value;
    setAssetId(selectedId);
    const found = assets.find((a) => a.id === selectedId);
    if (found && found.ipAddress) {
      setTarget(found.ipAddress);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId) {
      setError('Vui lòng chọn tài sản để gắn kết quả quét.');
      return;
    }

    let parsedFindings = [];
    try {
      parsedFindings = JSON.parse(findingsJson);
      if (!Array.isArray(parsedFindings) || parsedFindings.length === 0) {
        throw new Error('Dữ liệu findings phải là một mảng JSON các lỗ hổng.');
      }
    } catch (jsonErr) {
      setError(`Lỗi định dạng JSON: ${jsonErr.message}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onImport({
        toolName,
        target,
        assetId,
        findings: parsedFindings,
      });
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Lỗi khi nhập báo cáo quét.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập kết quả quét an ninh (Security Scan Import)"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Công cụ quét an ninh *
            </label>
            <select
              value={toolName}
              onChange={(e) => handleToolChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition font-mono"
            >
              <option value="OWASP ZAP">OWASP ZAP (Web Scan)</option>
              <option value="Nmap">Nmap (Port & Network)</option>
              <option value="Nessus">Nessus (System Scan)</option>
              <option value="OpenVAS">OpenVAS / Greenbone</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Gắn với tài sản *
            </label>
            <select
              value={assetId}
              onChange={handleAssetSelect}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="">-- Chọn tài sản --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetId} - {a.name} ({a.ipAddress || 'No IP'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mục tiêu quét (Target IP/URL) *
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="VD: 192.168.10.21"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dữ liệu phát hiện (JSON Findings Array)
            </label>
            <span className="text-[11px] text-cyan-400 font-mono">
              Đang tải mẫu chuẩn cho {toolName}
            </span>
          </div>
          <textarea
            rows={10}
            value={findingsJson}
            onChange={(e) => setFindingsJson(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            * Các lỗ hổng mức Critical sẽ tự động sinh Cảnh báo (Alert) trên SOC Dashboard.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Nhập báo cáo vào hệ thống
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
