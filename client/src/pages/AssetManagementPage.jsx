import { useEffect, useState, useMemo } from 'react';
import { assetService } from '../services/assetService';
import { useAuth } from '../context/AuthContext';
import AssetFilter from '../components/assets/AssetFilter';
import AssetModal from '../components/assets/AssetModal';
import Modal from '../components/common/Modal';

export default function AssetManagementPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'IT Manager');
  const canDelete = hasRole('Admin');

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    criticality: 'all',
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Delete confirmation modal state
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [assetsData, categoriesData] = await Promise.all([
        assetService.getAssets(filters),
        assetService.getCategories(),
      ]);
      setAssets(assetsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Không thể tải danh sách tài sản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.status, filters.criticality]);

  // Client-side search debounce / immediate filter
  const filteredAssets = useMemo(() => {
    if (!filters.search) return assets;
    const q = filters.search.toLowerCase().trim();
    return assets.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.assetId?.toLowerCase().includes(q) ||
        a.ipAddress?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q) ||
        a.owner?.toLowerCase().includes(q)
    );
  }, [assets, filters.search]);

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (formData) => {
    if (selectedAsset) {
      await assetService.updateAsset(selectedAsset.id, formData);
      setMessage(`Cập nhật tài sản ${formData.name} thành công.`);
    } else {
      await assetService.createAsset(formData);
      setMessage(`Thêm mới tài sản ${formData.name} thành công.`);
    }
    fetchData();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmAsset) return;
    try {
      setDeleteLoading(true);
      await assetService.deleteAsset(deleteConfirmAsset.id);
      setMessage(`Đã chuyển ${deleteConfirmAsset.name} vào Sao lưu & Phục hồi → Thùng rác tài sản. Có thể khôi phục tại đó.`);
      setDeleteConfirmAsset(null);
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Lỗi khi xóa tài sản.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: '', status: 'all', criticality: 'all' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      maintenance: 'bg-amber-950 text-amber-400 border-amber-800',
      offline: 'bg-slate-800 text-slate-400 border-slate-700',
      retired: 'bg-red-950 text-red-400 border-red-800',
    };
    return badges[status] || badges.active;
  };

  const getCriticalityBadge = (crit) => {
    const badges = {
      critical: 'bg-red-950 text-red-400 border-red-800',
      high: 'bg-orange-950 text-orange-400 border-orange-800',
      medium: 'bg-yellow-950 text-yellow-400 border-yellow-800',
      low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    };
    return badges[crit] || badges.medium;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Quản lý tài sản CNTT (IT Asset Management)
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              NIST CSF: IDENTIFY (ID.AM)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Kiểm kê, phân loại và theo dõi trạng thái, mức độ quan trọng của toàn bộ tài sản
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold tracking-wide transition shadow-lg shadow-cyan-600/30 flex items-center gap-2 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm tài sản mới
          </button>
        )}
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <AssetFilter
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Assets Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
              <tr>
                <th className="py-3 px-4">Mã tài sản</th>
                <th className="py-3 px-4">Tên tài sản</th>
                <th className="py-3 px-4">Loại & Danh mục</th>
                <th className="py-3 px-4">Địa chỉ IP / MAC</th>
                <th className="py-3 px-4">Người quản lý</th>
                <th className="py-3 px-4">Độ quan trọng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách tài sản...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    Không tìm thấy tài sản nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                      {asset.assetId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{asset.name}</div>
                      <div className="text-[11px] text-slate-500">{asset.os || 'N/A'} • {asset.location || 'Chưa định vị'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-300">{asset.type}</span>
                      {asset.category && (
                        <div className="text-[11px] text-slate-500">{asset.category.name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-200">{asset.ipAddress || '-'}</div>
                      <div className="text-slate-500">{asset.macAddress || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {asset.owner || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCriticalityBadge(asset.criticality)}`}>
                        {asset.criticality}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            title="Chỉnh sửa tài sản"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmAsset(asset)}
                            title="Xóa tài sản"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAsset}
        asset={selectedAsset}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmAsset}
        onClose={() => setDeleteConfirmAsset(null)}
        title="Chuyển tài sản vào thùng rác"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Chuyển tài sản sau vào Sao lưu & Phục hồi → Thùng rác tài sản (có thể khôi phục):{' '}
            <strong className="text-white font-mono">{deleteConfirmAsset?.name} ({deleteConfirmAsset?.assetId})</strong>?
          </p>
          <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded border border-red-900/50">
            Cảnh báo: Hành động này sẽ được ghi nhận vào Audit Log an ninh và không thể hoàn tác.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setDeleteConfirmAsset(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {deleteLoading ? 'Đang chuyển...' : 'Chuyển vào thùng rác'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
