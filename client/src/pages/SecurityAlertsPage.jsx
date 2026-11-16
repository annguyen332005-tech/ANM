import { useState, useEffect, useCallback } from 'react';
import { alertService } from '../services/alertService';
import { useAuth } from '../context/AuthContext';

const SEVERITY_COLORS = {
  low: 'bg-green-500/20 text-green-300 border-green-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const STATUS_COLORS = {
  open: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  acknowledged: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/40',
  dismissed: 'bg-slate-500/20 text-slate-400 border-slate-600/40',
};

export default function SecurityAlertsPage() {
  const { hasRole } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [promoting, setPromoting] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const canManage = hasRole('Admin') || hasRole('Security Analyst');

  const loadData = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const params = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      const [alertRes, statsRes] = await Promise.all([
        alertService.getAlerts(params),
        alertService.getStats(),
      ]);
      setAlerts(alertRes.alerts || alertRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Load alerts error:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [filterSeverity, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') loadData(true); }, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await alertService.updateStatus(id, status);
      showFeedback('success', `Đã cập nhật trạng thái cảnh báo thành "${status}".`);
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'Lỗi khi cập nhật trạng thái.');
    }
  };

  const handlePromote = async (alert) => {
    setPromoting(alert.id);
    try {
      const res = await alertService.promoteToIncident(alert.id);
      showFeedback('success', `Đã tạo sự cố mới từ cảnh báo: "${res.incident?.title || alert.title}".`);
      loadData();
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'Lỗi khi tạo sự cố từ cảnh báo.');
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🔔 Cảnh báo An ninh (Security Alerts)</h1>
        <p className="text-sm text-slate-400 mt-1">NIST DE.CM – Giám sát và phát hiện sự kiện bảo mật</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tổng cảnh báo', value: stats.total ?? 0, color: 'text-cyan-400' },
            { label: 'Đang mở (Open)', value: stats.statusCounts?.open ?? stats.byStatus?.open ?? 0, color: 'text-blue-400' },
            { label: 'Đã xác nhận', value: stats.statusCounts?.acknowledged ?? stats.byStatus?.acknowledged ?? 0, color: 'text-yellow-400' },
            { label: 'Critical', value: stats.severityCounts?.critical ?? stats.bySeverity?.critical ?? 0, color: 'text-red-400' },          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {feedback.message && (
        <div className={`p-3 rounded-lg text-xs border ${feedback.type === 'success' ? 'bg-green-950/60 border-green-500/40 text-green-300' : 'bg-red-950/60 border-red-500/40 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
          <option value="">Tất cả mức độ</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
          <option value="">Tất cả trạng thái</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition">
          🔄 Làm mới
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Đang tải dữ liệu...</div>
        ) : alerts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">🔕</div>
            <p className="text-slate-400 text-sm">Không có cảnh báo nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">CẢNH BÁO</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">NGUỒN</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">MỨC ĐỘ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">TRẠNG THÁI</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THỜI GIAN</th>
                  {canManage && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THAO TÁC</th>}
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white text-sm leading-tight">{alert.title}</p>
                      {alert.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{alert.source || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[alert.severity] || 'text-slate-300 border-slate-600'}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[alert.status] || 'text-slate-300 border-slate-600'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(alert.createdAt).toLocaleString('vi-VN')}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {alert.status === 'open' && (
                            <button onClick={() => handleUpdateStatus(alert.id, 'acknowledged')}
                              className="px-2 py-1 bg-yellow-900/40 hover:bg-yellow-800/60 border border-yellow-700/40 text-yellow-300 rounded text-xs transition whitespace-nowrap">
                              ✓ Xác nhận
                            </button>
                          )}
                          {(alert.status === 'open' || alert.status === 'acknowledged') && (
                            <>
                              <button onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                                className="px-2 py-1 bg-green-900/40 hover:bg-green-800/60 border border-green-700/40 text-green-300 rounded text-xs transition whitespace-nowrap">
                                ✅ Giải quyết
                              </button>
                              <button onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded text-xs transition whitespace-nowrap">
                                Bỏ qua
                              </button>
                              <button
                                onClick={() => handlePromote(alert)}
                                disabled={promoting === alert.id}
                                className="px-2 py-1 bg-orange-900/40 hover:bg-orange-800/60 border border-orange-700/40 text-orange-300 rounded text-xs transition whitespace-nowrap disabled:opacity-50">
                                {promoting === alert.id ? '...' : '🚨 Tạo Incident'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-300 space-y-1">
        <p className="font-semibold text-blue-200">ℹ️ Luồng xử lý cảnh báo:</p>
        <p>1. Cảnh báo được tạo tự động từ hệ thống khi phát hiện lỗ hổng Critical hoặc từ công cụ tích hợp.</p>
        <p>2. Security Analyst xác nhận (Acknowledge) → phân tích → giải quyết hoặc nâng cấp thành Incident.</p>
        <p>3. Nút <strong>"🚨 Tạo Incident"</strong> sẽ tự động tạo một sự cố mới từ cảnh báo và chuyển trạng thái.</p>
      </div>
    </div>
  );
}
