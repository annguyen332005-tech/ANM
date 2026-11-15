import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'json'
  const [exportSuccess, setExportSuccess] = useState('');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getExecutiveReport();
      setReport(data);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExportingType(type);
    try {
      await reportService.exportData(type, exportFormat);
      setExportSuccess(`Đã xuất dữ liệu ${type} thành công (${exportFormat.toUpperCase()})`);
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err) {
      alert('Lỗi xuất dữ liệu: ' + (err.friendlyMessage || err.message));
    } finally {
      setExportingType(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tổng hợp báo cáo an toàn thông tin toàn diện...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm">
        Không thể tải báo cáo an ninh. Vui lòng thử lại.
      </div>
    );
  }

  const { securityScore, securityGrade, gradeColor, summary, breakdowns, nistMapping } = report;

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:border-none">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📊 Báo cáo An toàn Thông tin & Đánh giá Tuân thủ
            <span className="text-xs px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded font-mono font-semibold">
              EXECUTIVE SOC REPORT
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng hợp dữ liệu giám sát 5 trụ cột NIST CSF 1.1 • Xuất báo cáo đồ án an toàn thông tin
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={loadReport}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            🔄 Làm mới
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5"
          >
            🖨️ In / Xuất PDF
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg print:hidden">
          {exportSuccess}
        </div>
      )}

      {/* Security Posture Score Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-950 border border-slate-700 shadow-xl">
              <span className="text-3xl font-extrabold text-white font-mono">{securityScore}</span>
              <span className="text-[10px] text-slate-400 font-mono absolute bottom-2">/ 100</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">CHỈ SỐ AN TOÀN HỆ THỐNG (SECURITY POSTURE)</p>
              <h2 className={`text-2xl font-bold mt-1 ${gradeColor}`}>Xếp loại: {securityGrade}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Điểm số được tính tự động từ ma trận rủi ro, lỗ hổng chưa vá, tình trạng sao lưu dữ liệu và thời gian phản ứng sự cố.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-400 font-mono">TÀI SẢN CNTT</p>
              <p className="text-xl font-bold text-white mt-0.5">{summary.totalAssets}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-400 font-mono">LỖ HỔNG CRITICAL</p>
              <p className="text-xl font-bold text-red-400 mt-0.5">{breakdowns.vulnerabilities.critical}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-400 font-mono">SỰ CỐ MỞ</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">
                {(breakdowns.incidents.new || 0) + (breakdowns.incidents.investigating || 0)}
              </p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-400 font-mono">SAO LƯU GẦN NHẤT</p>
              <p className="text-xs font-semibold text-emerald-400 mt-1 truncate">
                {summary.lastBackupAt ? new Date(summary.lastBackupAt).toLocaleDateString('vi-VN') : 'Chưa có'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NIST CSF 1.1 Assessment Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">📋 Đánh giá Tuân thủ Khung NIST Cybersecurity Framework 1.1</h3>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            5 / 5 Functions Active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20 text-xs font-semibold text-slate-400">
                <th className="text-left px-4 py-3">NHÓM CHỨC NĂNG NIST</th>
                <th className="text-left px-4 py-3">CƠ CHẾ KỸ THUẬT TRIỂN KHAI</th>
                <th className="text-left px-4 py-3">THÔNG SỐ GIÁM SÁT</th>
                <th className="text-left px-4 py-3">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-semibold text-cyan-400">1. IDENTIFY (Nhận diện)</td>
                <td className="px-4 py-3 text-slate-300">
                  Quản lý tài sản (ID.AM), Phân loại theo độ quan trọng, Quét lỗ hổng (ID.RA-1), Ma trận rủi ro 3x3 (ID.RA-5)
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {nistMapping.identify.assetsManaged} Assets • {nistMapping.identify.vulnerabilitiesIdentified} Vulns • {nistMapping.identify.risksAssessed} Risks
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    ✓ Hoàn thành
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-semibold text-blue-400">2. PROTECT (Bảo vệ)</td>
                <td className="px-4 py-3 text-slate-300">
                  Argon2id Hash, JWT Session, RBAC phân quyền 4 vai trò, Rate Limiting, Chống brute-force (khóa sau 5 lần), Helmet HTTP Headers
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  RBAC Active • Lockout: 5 fails • Argon2id
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    ✓ Hoàn thành
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-semibold text-yellow-400">3. DETECT (Phát hiện)</td>
                <td className="px-4 py-3 text-slate-300">
                  Nhật ký kiểm toán AuditLog đầy đủ, Cảnh báo an ninh Security Alerts, Tích hợp công cụ giám sát (Wazuh SIEM, Suricata IDS, Prometheus, WAF)
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {summary.openAlerts} Open Alerts • 4 Tools Connected
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    ✓ Hoàn thành
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-semibold text-orange-400">4. RESPOND (Ứng phó)</td>
                <td className="px-4 py-3 text-slate-300">
                  Quy trình xử lý sự cố Incident Workflow (New → Closed), Cô lập tài sản (QUARANTINE_ASSET), Chặn IP (BLOCK_IP), Giải quyết sự cố
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {summary.totalIncidents} Incidents Managed
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    ✓ Hoàn thành
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-semibold text-emerald-400">5. RECOVER (Khôi phục)</td>
                <td className="px-4 py-3 text-slate-300">
                  SQLite VACUUM INTO Snapshot nguyên tử, Mã băm SHA-256 đối soát tính toàn vẹn, Phục hồi dữ liệu, Ghi nhận lịch sử khôi phục
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {summary.successfulBackups} Backups • SHA-256 Verified
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    ✓ Hoàn thành
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export & Data Center */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">💾 Trung tâm Xuất Báo cáo & Dữ liệu</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Xuất dữ liệu an ninh để phục vụ lưu trữ, đánh giá kiểm toán hoặc đính kèm báo cáo đồ án
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Định dạng:</span>
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-3 py-1 rounded text-xs font-semibold font-mono transition ${
                exportFormat === 'csv'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-3 py-1 rounded text-xs font-semibold font-mono transition ${
                exportFormat === 'json'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'assets', label: 'Tài sản CNTT', icon: '💻' },
            { id: 'vulnerabilities', label: 'Lỗ hổng bảo mật', icon: '⚠️' },
            { id: 'risks', label: 'Đánh giá rủi ro', icon: '📊' },
            { id: 'incidents', label: 'Sự cố an ninh', icon: '🚨' },
            { id: 'audit-logs', label: 'Nhật ký kiểm toán', icon: '📜' },
            { id: 'backups', label: 'Bản sao lưu', icon: '📦' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleExport(item.id)}
              disabled={exportingType === item.id}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition group"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs font-semibold text-white group-hover:text-cyan-400 transition">{item.label}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {exportingType === item.id ? 'Đang xuất...' : `Xuất ${exportFormat.toUpperCase()}`}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
