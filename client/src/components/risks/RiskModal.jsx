import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

function calculateLevel(l, i) {
  const lik = (l || 'medium').toLowerCase();
  const imp = (i || 'medium').toLowerCase();
  if (lik === 'high' && imp === 'high') return 'critical';
  if ((lik === 'high' && imp === 'medium') || (lik === 'medium' && imp === 'high')) return 'high';
  if ((lik === 'medium' && imp === 'medium') || (lik === 'high' && imp === 'low') || (lik === 'low' && imp === 'high')) return 'medium';
  return 'low';
}

const initialForm = {
  assetId: '',
  title: '',
  likelihood: 'medium',
  impact: 'medium',
  mitigation: '',
  status: 'open',
};

export default function RiskModal({ isOpen, onClose, onSave, risk = null, assets = [] }) {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (risk) {
      setFormData({
        assetId: risk.assetId || '',
        title: risk.title || '',
        likelihood: risk.likelihood || 'medium',
        impact: risk.impact || 'medium',
        mitigation: risk.mitigation || '',
        status: risk.status || 'open',
      });
    } else {
      setFormData({
        ...initialForm,
        assetId: assets[0]?.id || '',
      });
    }
    setError('');
  }, [risk, assets, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculatedRiskLevel = calculateLevel(formData.likelihood, formData.impact);

  const getLevelBadge = (level) => {
    const badges = {
      critical: 'bg-red-950 text-red-400 border-red-800',
      high: 'bg-orange-950 text-orange-400 border-orange-800',
      medium: 'bg-amber-950 text-amber-400 border-amber-800',
      low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    };
    return badges[level] || badges.medium;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title.trim()) {
      setError('Vui lòng chọn tài sản liên kết và nhập tiêu đề rủi ro.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        riskLevel: calculatedRiskLevel,
      });
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Lỗi khi lưu rủi ro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={risk ? 'Chỉnh sửa rủi ro an ninh' : 'Đánh giá rủi ro an ninh mới'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Tài sản đối mặt rủi ro *
            </label>
            <select
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="">-- Chọn tài sản --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetId} - {a.name} ({a.type} | {a.ipAddress || 'No IP'})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Tiêu đề kịch bản rủi ro (Risk Scenario) *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Nguy cơ chiếm quyền điều khiển qua lỗ hổng RCE"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Khả năng xảy ra (Likelihood) *
            </label>
            <select
              name="likelihood"
              value={formData.likelihood}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="high">High (Khả năng cao - thường xuyên bị quét)</option>
              <option value="medium">Medium (Trung bình - điều kiện thông thường)</option>
              <option value="low">Low (Thấp - hệ thống nội bộ được cô lập)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mức độ ảnh hưởng (Impact) *
            </label>
            <select
              name="impact"
              value={formData.impact}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="high">High (Nặng nề - lộ dữ liệu cốt lõi/sập hệ thống)</option>
              <option value="medium">Medium (Vừa phải - gián đoạn dịch vụ cục bộ)</option>
              <option value="low">Low (Nhẹ - không ảnh hưởng dữ liệu trọng yếu)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mức độ rủi ro tính toán (Risk Level)
            </label>
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Likelihood × Impact:</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getLevelBadge(calculatedRiskLevel)}`}>
                {calculatedRiskLevel}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Trạng thái rủi ro
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="open">Open (Chưa xử lý)</option>
              <option value="in_progress">In Progress (Đang thực thi biện pháp)</option>
              <option value="mitigated">Mitigated (Đã giảm thiểu)</option>
              <option value="accepted">Accepted (Chấp nhận rủi ro còn lại)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Biện pháp giảm thiểu rủi ro (Mitigation Plan)
            </label>
            <textarea
              name="mitigation"
              rows={3}
              value={formData.mitigation}
              onChange={handleChange}
              placeholder="Mô tả kế hoạch kiểm soát kỹ thuật, tường lửa, phân quyền hoặc quy trình giám sát..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {risk ? 'Cập nhật rủi ro' : 'Lưu rủi ro'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
