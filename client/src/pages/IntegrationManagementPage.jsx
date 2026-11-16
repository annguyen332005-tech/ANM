import { useState, useEffect } from 'react';
import { integrationService } from '../services/integrationService';
import { useAuth } from '../context/AuthContext';
import WazuhIntegrationPanel from '../components/WazuhIntegrationPanel';

const INTEGRATION_TYPES = ['SIEM', 'IDS_IPS', 'Monitoring', 'WAF', 'EDR', 'Scanner', 'Other'];

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-300 border-green-500/40',
  configured: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-600/40',
  error: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const TYPE_ICONS = {
  SIEM: '🛡️',
  IDS_IPS: '🔍',
  Monitoring: '📊',
  WAF: '🔥',
  EDR: '💻',
  Scanner: '🔎',
  Other: '🔧',
};

const SIMULATE_EVENTS = [
  { value: 'brute_force', label: 'Brute-force Attack', severity: 'high' },
  { value: 'malware_detected', label: 'Malware Detection', severity: 'critical' },
  { value: 'port_scan', label: 'Port Scan Detected', severity: 'medium' },
  { value: 'sql_injection', label: 'SQL Injection Attempt', severity: 'high' },
  { value: 'unauthorized_access', label: 'Unauthorized Access', severity: 'high' },
  { value: 'ddos_traffic', label: 'DDoS Traffic Spike', severity: 'critical' },
];

function IntegrationFormModal({ open, onClose, onSave, integration }) {
  const isEdit = !!integration;
  const [form, setForm] = useState({ name: '', type: 'SIEM', endpoint: '', status: 'configured', configJson: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (integration) {
      setForm({
        name: integration.name || '',
        type: integration.type || 'SIEM',
        endpoint: integration.endpoint || '',
        status: integration.status || 'configured',
        configJson: integration.configJson ? (typeof integration.configJson === 'string' ? integration.configJson : JSON.stringify(integration.configJson, null, 2)) : '',
      });
    } else {
      setForm({ name: '', type: 'SIEM', endpoint: '', status: 'configured', configJson: '' });
    }
    setError('');
  }, [integration, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Tên tích hợp là bắt buộc.');
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (payload.configJson) {
        try { JSON.parse(payload.configJson); } catch { return setError('configJson không phải JSON hợp lệ.'); }
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Lỗi khi lưu.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? '✏️ Chỉnh sửa tích hợp' : '+ Thêm tích hợp mới'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tên công cụ *</label>
            <input name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              placeholder="Wazuh SIEM, Suricata IDS..." className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Loại</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
                {INTEGRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="active">Active</option>
                <option value="configured">Configured</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Endpoint URL</label>
            <input value={form.endpoint} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
              placeholder="https://wazuh.lab.internal:55000" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Config JSON (tùy chọn)</label>
            <textarea value={form.configJson} onChange={(e) => setForm((f) => ({ ...f, configJson: e.target.value }))}
              rows={3} placeholder='{"key": "value"}' className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm transition hover:border-slate-500">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SimulateModal({ open, onClose, integration, onSimulate }) {
  const [eventType, setEventType] = useState('brute_force');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) { setResult(null); setError(''); } }, [open]);

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const ev = SIMULATE_EVENTS.find((e) => e.value === eventType);
      const res = await integrationService.simulateEvent(integration.id, {
        eventType,
        severity: ev?.severity || 'medium',
      });
      setResult(res);
      onSimulate?.();
    } catch (err) {
      setError(err.friendlyMessage || 'Lỗi khi mô phỏng sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">⚡ Mô phỏng sự kiện bảo mật</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-800/60 rounded-lg">
            <p className="text-xs text-slate-400">Nguồn tích hợp:</p>
            <p className="text-sm font-semibold text-cyan-300">{integration?.name}</p>
          </div>

          {!result ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Loại sự kiện mô phỏng</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
                  {SIMULATE_EVENTS.map((e) => <option key={e.value} value={e.value}>{e.label} [{e.severity}]</option>)}
                </select>
              </div>
              {error && <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">{error}</div>}
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
                ⚠️ Hệ thống sẽ tạo SecurityEvent và Alert trong database để demo luồng phát hiện theo NIST DE.AE.
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm transition">Hủy</button>
                <button onClick={handleSimulate} disabled={loading}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">
                  {loading ? 'Đang tạo...' : '⚡ Thực thi mô phỏng'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-950/40 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm font-semibold">✅ Mô phỏng thành công!</p>
                {result.alert && <p className="text-xs text-slate-300 mt-1">Alert tạo: <span className="text-cyan-300">{result.alert.title}</span></p>}
                {result.event && <p className="text-xs text-slate-300">SecurityEvent: <span className="text-cyan-300">{result.event.type}</span></p>}
              </div>
              <p className="text-xs text-slate-400">Kiểm tra trang <strong className="text-white">Cảnh báo An ninh</strong> để xem và xử lý alert vừa tạo.</p>
              <button onClick={onClose} className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition">Đóng</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationManagementPage() {
  const { hasRole } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editIntegration, setEditIntegration] = useState(null);
  const [simulateTarget, setSimulateTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const canManage = hasRole('Admin') || hasRole('Security Analyst');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await integrationService.getIntegrations();
      setIntegrations(res.integrations || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleSave = async (data) => {
    if (editIntegration) {
      await integrationService.updateIntegration(editIntegration.id, data);
      showFeedback('success', 'Đã cập nhật tích hợp.');
    } else {
      await integrationService.createIntegration(data);
      showFeedback('success', 'Đã thêm tích hợp mới.');
    }
    loadData();
  };

  const handleDelete = async (id) => {
    await integrationService.deleteIntegration(id);
    setDeleteConfirm(null);
    showFeedback('success', 'Đã xóa tích hợp.');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🔧 Tích hợp Công cụ Bảo mật</h1>
          <p className="text-sm text-slate-400 mt-1">NIST DE.CM – Kết nối hệ thống giám sát và phát hiện bên ngoài</p>
        </div>
        {canManage && (
          <button onClick={() => { setEditIntegration(null); setShowFormModal(true); }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-sm shadow-lg shadow-cyan-600/20 transition whitespace-nowrap">
            + Thêm tích hợp
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`p-3 rounded-lg text-xs border ${feedback.type === 'success' ? 'bg-green-950/60 border-green-500/40 text-green-300' : 'bg-red-950/60 border-red-500/40 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      {/* Cards */}
      {canManage && <WazuhIntegrationPanel />}
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-sm">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((intg) => {
            let config = {};
            try { config = JSON.parse(intg.configJson || '{}'); } catch {}
            return (
              <div key={intg.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{TYPE_ICONS[intg.type] || '🔧'}</div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{intg.name}</h3>
                      <p className="text-xs text-slate-400">{intg.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[intg.status] || 'text-slate-300 border-slate-600'}`}>
                    {intg.status}
                  </span>
                </div>

                {intg.endpoint && (
                  <p className="text-xs font-mono text-slate-500 mb-3 truncate">{intg.endpoint}</p>
                )}

                {Object.keys(config).length > 0 && (
                  <div className="mb-3 p-2 bg-slate-950/50 rounded-lg">
                    {Object.entries(config).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs py-0.5">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-slate-300 font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {canManage && intg.id !== 'wazuh-webhook' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setSimulateTarget(intg)}
                      className="flex-1 py-1.5 bg-orange-900/30 hover:bg-orange-800/50 border border-orange-700/40 text-orange-300 rounded-lg text-xs font-semibold transition">
                      ⚡ Mô phỏng sự kiện
                    </button>
                    <button onClick={() => { setEditIntegration(intg); setShowFormModal(true); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition">✏️</button>
                    <button onClick={() => setDeleteConfirm(intg)}
                      className="px-3 py-1.5 bg-red-900/20 hover:bg-red-800/40 border border-red-800/30 text-red-400 rounded-lg text-xs transition">🗑️</button>
                  </div>
                )}
              </div>
            );
          })}
          {integrations.length === 0 && (
            <div className="col-span-2 p-10 text-center text-slate-500 text-sm">
              Chưa có công cụ tích hợp nào. Nhấn "+ Thêm tích hợp" để bắt đầu.
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-300 space-y-1">
        <p className="font-semibold text-blue-200">ℹ️ Về tích hợp công cụ bảo mật:</p>
        <p>Các công cụ được liệt kê là các hệ thống thực tế trong kiến trúc NIST DE.CM. Trong môi trường demo, nút <strong>"⚡ Mô phỏng sự kiện"</strong> giả lập việc công cụ gửi cảnh báo vào SecureWeb, tạo SecurityEvent và Alert trong database để demo luồng phát hiện → ứng phó.</p>
        <p>Wazuh có bộ nhận webhook riêng ở khung phía trên. Các tích hợp còn lại vẫn dùng mô phỏng cho đến khi cài connector tương ứng.</p>
      </div>

      {/* Modals */}
      <IntegrationFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSave}
        integration={editIntegration}
      />

      {simulateTarget && (
        <SimulateModal
          open={!!simulateTarget}
          onClose={() => setSimulateTarget(null)}
          integration={simulateTarget}
          onSimulate={loadData}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-400 mb-4">Xóa tích hợp <strong className="text-white">"{deleteConfirm.name}"</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm transition">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
