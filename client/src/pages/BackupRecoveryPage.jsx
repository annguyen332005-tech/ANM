import { useState, useEffect, useCallback } from 'react';
import { backupService } from '../services/backupService';
import { useAuth } from '../context/AuthContext';

export default function BackupRecoveryPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  const [activeTab, setActiveTab] = useState('backups'); // 'backups' | 'history' | 'settings'
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreNotes, setRestoreNotes] = useState('');
  const [restoring, setRestoring] = useState(false);

  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [editingSetting, setEditingSetting] = useState(null);
  const [settingValue, setSettingValue] = useState('');
  const [savingSetting, setSavingSetting] = useState(false);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bkRes, statsRes, histRes, stgRes] = await Promise.all([
        backupService.getBackups().catch(() => ({ backups: [] })),
        backupService.getStats().catch(() => null),
        backupService.getRecoveryHistory().catch(() => ({ history: [] })),
        backupService.getSettings().catch(() => ({ settings: [] })),
      ]);

      setBackups(bkRes.backups || []);
      setStats(statsRes);
      setHistory(histRes.history || []);
      setSettings(stgRes.settings || []);
    } catch (err) {
      console.error('Load backup data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Backup Handler
  const handleCreateBackup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await backupService.createBackup(createForm);
      showFeedback('success', `Đã tạo bản sao lưu thành công: ${res.backup?.name || createForm.name}`);
      setShowCreateModal(false);
      setCreateForm({ name: '', notes: '' });
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || err.message || 'Lỗi khi tạo bản sao lưu.');
    } finally {
      setCreating(false);
    }
  };

  // Restore Handler
  const handleRestore = async (e) => {
    e.preventDefault();
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const res = await backupService.restoreBackup({
        backupId: restoreTarget.id,
        notes: restoreNotes || undefined,
      });
      showFeedback('success', res.message || 'Khôi phục bản sao lưu thành công (mô phỏng).');
      setRestoreTarget(null);
      setRestoreNotes('');
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || err.message || 'Lỗi khi khôi phục.');
    } finally {
      setRestoring(false);
    }
  };

  // Verify Backup Handler
  const handleVerify = async (backup) => {
    setVerifyingId(backup.id);
    try {
      const res = await backupService.verifyBackup(backup.id);
      setVerifyResult({ backup, ...res });
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'Lỗi khi kiểm tra tính toàn vẹn.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Delete Backup Handler
  const handleDelete = async (id) => {
    try {
      await backupService.deleteBackup(id);
      showFeedback('success', 'Đã xóa bản sao lưu.');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'Lỗi khi xóa bản sao lưu.');
    }
  };

  // Save System Setting Handler
  const handleSaveSetting = async (e) => {
    e.preventDefault();
    if (!editingSetting) return;
    setSavingSetting(true);
    try {
      await backupService.upsertSetting({
        key: editingSetting.key,
        value: settingValue,
        category: editingSetting.category,
      });
      showFeedback('success', `Đã cập nhật cấu hình: ${editingSetting.key}`);
      setEditingSetting(null);
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'Lỗi khi lưu cấu hình.');
    } finally {
      setSavingSetting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            💾 Sao lưu & Khôi phục (Backup & Recovery)
            <span className="text-xs px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono font-semibold">
              NIST RECOVER
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            NIST RC.RP / RC.IM – Kế hoạch sao lưu, kiểm tra tính toàn vẹn SHA-256 và phục hồi hệ thống
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-sm shadow-lg shadow-emerald-600/20 transition whitespace-nowrap flex items-center gap-2"
          >
            <span>+</span> Tạo bản sao lưu mới
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback.message && (
        <div
          className={`p-3 rounded-lg text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-mono">TỔNG BẢN SAO LƯU</p>
          <p className="text-2xl font-bold mt-1 text-cyan-400">{stats?.total ?? backups.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-mono">THÀNH CÔNG / THẤT BẠI</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            {stats?.success ?? 0} <span className="text-sm text-slate-500">/ {stats?.failed ?? 0}</span>
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-mono">TỔNG DUNG LƯỢNG</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{stats?.totalSizeFormatted || '0 B'}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-mono">LẦN KHÔI PHỤC (HIST)</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{history.length}</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'backups'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 Danh sách Bản sao lưu ({backups.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 Lịch sử khôi phục ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'settings'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚙️ Cấu hình sao lưu & Hệ thống ({settings.length})
        </button>
      </div>

      {/* Tab 1: Backups List */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Đang tải dữ liệu sao lưu...</div>
            ) : backups.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                Chưa có bản sao lưu nào. Nhấn "+ Tạo bản sao lưu mới" để thực hiện sao lưu đầu tiên.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">BẢN SAO LƯU</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">DUNG LƯỢNG</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">CHECKSUM (SHA-256)</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">TRẠNG THÁI</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THỜI GIAN TẠO</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((bk) => (
                      <tr key={bk.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white text-sm font-mono">{bk.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{bk.filePath}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 font-mono">
                          {formatSize(bk.sizeBytes)}
                        </td>
                        <td className="px-4 py-3">
                          {bk.checksum ? (
                            <span
                              title={bk.checksum}
                              className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded font-mono text-[11px]"
                            >
                              {bk.checksum.slice(0, 12)}...{bk.checksum.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              bk.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border-red-500/40'
                            }`}
                          >
                            {bk.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(bk.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleVerify(bk)}
                              disabled={verifyingId === bk.id}
                              className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 rounded text-xs transition"
                            >
                              {verifyingId === bk.id ? '...' : '🔍 Kiểm tra'}
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setRestoreTarget(bk)}
                                  className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 rounded text-xs transition"
                                >
                                  🔄 Khôi phục
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(bk)}
                                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-700/40 text-red-400 rounded text-xs transition"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Guide card */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1.5">
            <p className="font-semibold text-emerald-200">🛡️ Cơ chế Bảo vệ & Khôi phục dữ liệu (NIST RC.RP):</p>
            <p>
              • <strong>SQLite VACUUM INTO:</strong> Sao lưu snapshot dữ liệu nguyên tử (atomic snapshot) mà không làm gián đoạn các phiên ghi dữ liệu đang hoạt động.
            </p>
            <p>
              • <strong>SHA-256 Checksum:</strong> Mỗi bản sao lưu được băm SHA-256 ngay sau khi tạo và lưu trong DB để phát hiện giả mạo hoặc hư hỏng tập tin trước khi khôi phục.
            </p>
            <p>
              • <strong>Audit Logging:</strong> Mọi thao tác sao lưu, kiểm tra toàn vẹn và khôi phục đều được ghi nhận vào bảng Nhật ký kiểm toán.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Recovery History */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              Chưa có lịch sử khôi phục nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">ID LỊCH SỬ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">BACKUP ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">TRẠNG THÁI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">GHI CHÚ / KẾT QUẢ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{h.id.slice(0, 10)}...</td>
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">{h.backupId.slice(0, 12)}...</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 max-w-md">{h.notes || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(h.restoredAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: System Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">⚙️ Tham số Cấu hình Hệ thống & Sao lưu tự động</h3>
                <p className="text-xs text-slate-400">Các tham số kiểm soát chính sách bảo mật và chu kỳ sao lưu</p>
              </div>
            </div>
            <div className="divide-y divide-slate-800/60">
              {settings.map((s) => (
                <div key={s.id || s.key} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-400 font-semibold">{s.key}</span>
                      {s.category && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
                          {s.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono font-medium">{s.value}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingSetting(s);
                        setSettingValue(s.value);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-lg transition"
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Tạo bản sao lưu mới</h3>
            <p className="text-xs text-slate-400 mb-4">
              Hệ thống sẽ thực hiện SQLite VACUUM snapshot toàn bộ cơ sở dữ liệu `secureweb.db` và tính toán mã băm SHA-256.
            </p>
            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tên bản sao lưu</label>
                <input
                  type="text"
                  placeholder="manual_backup_phase4"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Xác nhận sao lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              🔍 Kết quả Kiểm tra Tính toàn vẹn
            </h3>
            <div className="space-y-3 my-4">
              <div
                className={`p-3 rounded-lg border text-xs font-semibold ${
                  verifyResult.valid
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}
              >
                {verifyResult.valid ? '✓ TÍNH TOÀN VẸN HỢP LỆ' : '✗ CẢNH BÁO: TẬP TIN BỊ SỬA ĐỔI HOẶC HƯ HỎNG'}
                <p className="font-normal mt-1 text-slate-300">{verifyResult.reason}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono">Stored SHA-256:</span>
                  <span className="text-slate-200 font-mono break-all">{verifyResult.storedChecksum || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">Current File SHA-256:</span>
                  <span className="text-emerald-400 font-mono break-all">{verifyResult.currentChecksum || '-'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setVerifyResult(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-sm transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận Khôi phục dữ liệu</h3>
            <p className="text-xs text-slate-400 mb-4">
              Bạn có chắc muốn khôi phục hệ thống từ bản sao lưu <strong className="text-emerald-400">{restoreTarget.name}</strong>?
            </p>
            <form onSubmit={handleRestore} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ghi chú khôi phục (tùy chọn)</label>
                <textarea
                  rows={3}
                  placeholder="Lý do thực hiện phục hồi sự cố..."
                  value={restoreNotes}
                  onChange={(e) => setRestoreNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreTarget(null)}
                  className="flex-1 py-2 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={restoring}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
                >
                  {restoring ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Setting Modal */}
      {editingSetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Chỉnh sửa tham số cấu hình</h3>
            <p className="text-xs text-cyan-400 font-mono mb-4">{editingSetting.key}</p>
            <form onSubmit={handleSaveSetting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Giá trị mới</label>
                <input
                  type="text"
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSetting(null)}
                  className="flex-1 py-2 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingSetting}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
                >
                  {savingSetting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-400 mb-4">
              Bạn có chắc muốn xóa bản sao lưu <strong className="text-white">"{deleteConfirm.name}"</strong>? Tập tin vật lý trên đĩa cũng sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
