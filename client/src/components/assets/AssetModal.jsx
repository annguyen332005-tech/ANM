import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const initialFormData = {
  assetId: '',
  name: '',
  type: 'Server',
  categoryId: '',
  ipAddress: '',
  macAddress: '',
  os: '',
  owner: '',
  location: '',
  status: 'active',
  criticality: 'medium',
};

export default function AssetModal({ isOpen, onClose, onSave, asset = null, categories = [] }) {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        assetId: asset.assetId || '',
        name: asset.name || '',
        type: asset.type || 'Server',
        categoryId: asset.categoryId || (categories[0]?.id || ''),
        ipAddress: asset.ipAddress || '',
        macAddress: asset.macAddress || '',
        os: asset.os || '',
        owner: asset.owner || '',
        location: asset.location || '',
        status: asset.status || 'active',
        criticality: asset.criticality || 'medium',
      });
    } else {
      setFormData({
        ...initialFormData,
        categoryId: categories[0]?.id || '',
      });
    }
    setError('');
  }, [asset, categories, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId.trim() || !formData.name.trim() || !formData.type.trim()) {
      setError('Mã tài sản, tên tài sản và loại tài sản là bắt buộc.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Không thể lưu tài sản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asset ? 'Chỉnh sửa tài sản CNTT' : 'Thêm mới tài sản CNTT'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mã tài sản (Asset ID) *
            </label>
            <input
              type="text"
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              placeholder="VD: ASSET-004"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Tên tài sản *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Main Database Server"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Loại tài sản *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="Server">Máy chủ (Server)</option>
              <option value="Workstation">Máy trạm (Workstation)</option>
              <option value="Firewall">Tường lửa (Firewall)</option>
              <option value="Router">Bộ định tuyến (Router)</option>
              <option value="Switch">Bộ chuyển mạch (Switch)</option>
              <option value="Database">Cơ sở dữ liệu (Database)</option>
              <option value="Software">Phần mềm / Dịch vụ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Nhóm danh mục
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Địa chỉ IP
            </label>
            <input
              type="text"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              placeholder="VD: 192.168.1.100"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Địa chỉ MAC
            </label>
            <input
              type="text"
              name="macAddress"
              value={formData.macAddress}
              onChange={handleChange}
              placeholder="VD: 00:1A:2B:3C:4D:5E"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Hệ điều hành
            </label>
            <input
              type="text"
              name="os"
              value={formData.os}
              onChange={handleChange}
              placeholder="VD: Ubuntu 24.04 / Windows 11"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Người quản lý / Bộ phận
            </label>
            <input
              type="text"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              placeholder="VD: IT Admin / DevOps"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vị trí đặt
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="VD: Server Room Rack 2"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Trạng thái hoạt động
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="active">Active (Hoạt động)</option>
              <option value="maintenance">Maintenance (Bảo trì)</option>
              <option value="offline">Offline (Ngoại tuyến)</option>
              <option value="retired">Retired (Đã thu hồi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mức độ quan trọng (Criticality)
            </label>
            <select
              name="criticality"
              value={formData.criticality}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="low">Low (Thấp)</option>
              <option value="medium">Medium (Trung bình)</option>
              <option value="high">High (Cao)</option>
              <option value="critical">Critical (Nghiêm trọng)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold tracking-wide transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {asset ? 'Cập nhật tài sản' : 'Tạo mới tài sản'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
