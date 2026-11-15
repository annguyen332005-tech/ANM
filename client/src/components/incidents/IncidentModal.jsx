import { useState, useEffect } from 'react';

const INCIDENT_TYPES = [
  'Brute-force attack',
  'Vulnerability exploitation',
  'Malware detection',
  'Unauthorized access',
  'Data breach',
  'Phishing attack',
  'DDoS attack',
  'Insider threat',
  'Configuration error',
  'Other',
];

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS = ['new', 'investigating', 'contained', 'resolved', 'closed'];

export default function IncidentModal({ open, onClose, onSave, incident, assets = [] }) {
  const isEdit = !!incident;
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Other',
    severity: 'medium',
    status: 'new',
    assetId: '',
    detectedBy: '',
    assignedTo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (incident) {
      setForm({
        title: incident.title || '',
        description: incident.description || '',
        type: incident.type || 'Other',
        severity: incident.severity || 'medium',
        status: incident.status || 'new',
        assetId: incident.assetId || '',
        detectedBy: incident.detectedBy || '',
        assignedTo: incident.assignedTo || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        type: 'Other',
        severity: 'medium',
        status: 'new',
        assetId: '',
        detectedBy: '',
        assignedTo: '',
      });
    }
    setError('');
  }, [incident, open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Tiêu đề sự cố là bắt buộc.');
    try {
      setLoading(true);
      const payload = { ...form };
      if (!payload.assetId) delete payload.assetId;
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Lưu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const severityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? '✏️ Chỉnh sửa sự cố' : '🚨 Tạo sự cố mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tiêu đề sự cố *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Loại sự cố</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition">
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mức độ nghiêm trọng</label>
              <select name="severity" value={form.severity} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition">
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <p className={`text-xs mt-0.5 font-semibold ${severityColors[form.severity]}`}>
                {form.severity.toUpperCase()}
              </p>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tài sản liên quan</label>
            <select name="assetId" value={form.assetId} onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition">
              <option value="">-- Không liên kết tài sản --</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetId})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phát hiện bởi</label>
              <input name="detectedBy" value={form.detectedBy} onChange={handleChange} placeholder="Wazuh SIEM, Suricata..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phân công cho</label>
              <input name="assignedTo" value={form.assignedTo} onChange={handleChange} placeholder="Security Analyst..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded-lg text-sm transition">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo sự cố'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
