import { useState } from 'react';
import { incidentService } from '../../services/incidentService';
import { useAuth } from '../../context/AuthContext';

const ACTION_TYPES = [
  { value: 'INITIAL_DISCOVERY', label: '🔍 Phát hiện ban đầu', color: 'text-blue-400' },
  { value: 'ANALYZE_LOGS', label: '📊 Phân tích log', color: 'text-cyan-400' },
  { value: 'NOTIFY_STAKEHOLDERS', label: '📢 Thông báo bên liên quan', color: 'text-yellow-400' },
  { value: 'QUARANTINE_ASSET', label: '🔒 Cô lập (mô phỏng)', color: 'text-orange-400' },
  { value: 'BLOCK_IP', label: '🚫 Chặn ping từ IP', color: 'text-red-400' },
  { value: 'UNBLOCK_IP', label: '🔓 Gỡ chặn ping', color: 'text-cyan-400' },
  { value: 'RESOLVE_INCIDENT', label: '✅ Giải quyết sự cố', color: 'text-green-400' },
  { value: 'CUSTOM_ACTION', label: '📝 Ghi chú/Hành động khác', color: 'text-slate-400' },
];

const RESPONSE_ACTIONS = ['QUARANTINE_ASSET', 'BLOCK_IP', 'UNBLOCK_IP', 'RESOLVE_INCIDENT'];

export default function ResponseActionsPanel({ incident, onRefresh }) {
  const { hasRole } = useAuth();
  const availableActions = RESPONSE_ACTIONS.filter((action) => {
    if (['BLOCK_IP', 'UNBLOCK_IP'].includes(action) && !hasRole('Admin')) return false;
    if (['resolved', 'closed'].includes(incident.status)) return action === 'UNBLOCK_IP';
    return hasRole('Admin', 'Security Analyst');
  });
  const [addingNote, setAddingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ action: 'CUSTOM_ACTION', notes: '' });
  const [responding, setResponding] = useState(false);
  const [responseForm, setResponseForm] = useState({ actionType: 'QUARANTINE_ASSET', reason: '', targetIp: '' });
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.notes.trim()) return;
    setLoading(true);
    setError('');
    try {
      await incidentService.addAction(incident.id, noteForm);
      setNoteForm({ action: 'CUSTOM_ACTION', notes: '' });
      setAddingNote(false);
      setSuccess('Đã thêm ghi chú thành công.');
      setTimeout(() => setSuccess(''), 3000);
      onRefresh?.();
    } catch (err) {
      setError(err.friendlyMessage || 'Lỗi khi thêm ghi chú.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    setResponding(true);
    setError('');
    try {
      await incidentService.executeResponse(incident.id, {
        actionType: responseForm.actionType,
        reason: responseForm.reason,
        targetIp: responseForm.targetIp || undefined,
      });
      setShowResponseForm(false);
      setResponseForm({ actionType: 'QUARANTINE_ASSET', reason: '', targetIp: '' });
      setSuccess(`Hành động "${responseForm.actionType}" đã được thực thi.`);
      setTimeout(() => setSuccess(''), 4000);
      onRefresh?.();
    } catch (err) {
      setError(err.friendlyMessage || 'Lỗi khi thực thi hành động ứng phó.');
    } finally {
      setResponding(false);
    }
  };

  const getActionMeta = (action) =>
    ACTION_TYPES.find((a) => a.value === action) || { label: action, color: 'text-slate-400' };

  const statusColors = {
    new: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    investigating: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    contained: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    resolved: 'bg-green-500/20 text-green-300 border-green-500/40',
    closed: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };

  return (
    <div className="space-y-5">
      {/* Status + Feedback */}
      {error && <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">{error}</div>}
      {success && <div className="p-3 bg-green-950/60 border border-green-500/40 rounded-lg text-green-300 text-xs">{success}</div>}

      {/* Status Stepper */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2">TRẠNG THÁI SỰ CỐ</p>
        <div className="flex gap-1 flex-wrap">
          {['new', 'investigating', 'contained', 'resolved', 'closed'].map((s, i) => {
            const statuses = ['new', 'investigating', 'contained', 'resolved', 'closed'];
            const currentIdx = statuses.indexOf(incident.status);
            const isActive = incident.status === s;
            const isPassed = i < currentIdx;
            return (
              <div key={s} className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                isActive ? statusColors[s] : isPassed ? 'bg-green-900/20 text-green-600 border-green-900/40' : 'bg-slate-800 text-slate-600 border-slate-700'
              }`}>
                {i + 1}. {s}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Response Buttons */}
      {availableActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2">HÀNH ĐỘNG ỨNG PHÓ NHANH</p>
          <div className="flex gap-2 flex-wrap">
            {availableActions.map((action) => {
              const meta = getActionMeta(action);
              return (
                <button key={action} onClick={() => { setResponseForm({ actionType: action, reason: '', targetIp: incident.asset?.ipAddress || '' }); setError(''); setShowResponseForm(true); }}
                  className={`px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold transition ${meta.color}`}>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Response Form */}
      {showResponseForm && (
        <form onSubmit={handleRespond} className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3">
          <p className="text-xs font-bold text-orange-300">⚡ Thực thi hành động ứng phó</p>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Loại hành động</label>
            <select value={responseForm.actionType} onChange={(e) => setResponseForm((f) => ({ ...f, actionType: e.target.value }))}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500">
              {availableActions.map((a) => <option key={a} value={a}>{getActionMeta(a).label}</option>)}
            </select>
          </div>
          {['BLOCK_IP', 'UNBLOCK_IP'].includes(responseForm.actionType) && (
            <div>
              <p className="text-xs text-amber-300 mb-2">Thao tác thật trên Windows Firewall của máy backend: chỉ chặn/gỡ ping IPv4 từ IP nguồn vào MSI. Không chặn TCP/web. Cần quyền Admin trên web và quyền Administrator của backend.</p>
              <label className="block text-xs text-slate-400 mb-1">IP nguồn Win11 cần chặn/gỡ</label>
              <input value={responseForm.targetIp} onChange={(e) => setResponseForm((f) => ({ ...f, targetIp: e.target.value }))}
                required placeholder="192.168.146.132" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Lý do / Ghi chú</label>
            <textarea value={responseForm.reason} onChange={(e) => setResponseForm((f) => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="Nhập lý do thực hiện hành động..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowResponseForm(false)} className="flex-1 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-xs transition hover:border-slate-500">Hủy</button>
            <button type="submit" disabled={responding} className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50">
              {responding ? 'Đang thực thi...' : 'Xác nhận thực thi'}
            </button>
          </div>
        </form>
      )}

      {/* Timeline of Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400">NHẬT KÝ HÀNH ĐỘNG ({incident.actions?.length || 0})</p>
          <button onClick={() => setAddingNote(!addingNote)}
            className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 rounded-lg transition">
            + Thêm ghi chú
          </button>
        </div>

        {addingNote && (
          <form onSubmit={handleAddNote} className="mb-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
            <select value={noteForm.action} onChange={(e) => setNoteForm((f) => ({ ...f, action: e.target.value }))}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500">
              {ACTION_TYPES.filter((a) => !RESPONSE_ACTIONS.includes(a.value)).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <textarea value={noteForm.notes} onChange={(e) => setNoteForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} required placeholder="Mô tả hành động, quan sát hoặc ghi chú..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 resize-none" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setAddingNote(false)} className="flex-1 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-xs hover:border-slate-500 transition">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50">
                {loading ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>
          </form>
        )}

        {!incident.actions?.length ? (
          <p className="text-xs text-slate-500 italic py-3">Chưa có hành động nào được ghi nhận.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {[...incident.actions].reverse().map((act) => {
              const meta = getActionMeta(act.action);
              return (
                <div key={act.id} className="flex gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-500">{new Date(act.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    {act.notes && <p className="text-xs text-slate-300 mt-1 break-words">{act.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
