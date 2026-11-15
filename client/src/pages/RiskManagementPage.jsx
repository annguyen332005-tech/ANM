import { useState, useEffect, useMemo } from 'react';
import { riskService } from '../services/riskService';
import { assetService } from '../services/assetService';
import { useAuth } from '../context/AuthContext';
import RiskMatrixCard from '../components/risks/RiskMatrixCard';
import RiskModal from '../components/risks/RiskModal';
import Modal from '../components/common/Modal';

export default function RiskManagementPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Security Analyst', 'IT Manager');
  const canDelete = hasRole('Admin');

  const [risks, setRisks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    riskLevel: 'all',
    status: 'all',
    assetId: 'all',
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [detailRisk, setDetailRisk] = useState(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [risksData, assetsData, matrix] = await Promise.all([
        riskService.getRisks(filters),
        assetService.getAssets(),
        riskService.getMatrixStats(),
      ]);
      setRisks(risksData);
      setAssets(assetsData);
      setMatrixData(matrix);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Không thể tải danh sách rủi ro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.riskLevel, filters.status, filters.assetId]);

  const filteredRisks = useMemo(() => {
    if (!filters.search) return risks;
    const q = filters.search.toLowerCase().trim();
    return risks.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.mitigation?.toLowerCase().includes(q) ||
        r.asset?.name?.toLowerCase().includes(q) ||
        r.asset?.ipAddress?.toLowerCase().includes(q)
    );
  }, [risks, filters.search]);

  const handleOpenAdd = () => {
    setSelectedRisk(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setSelectedRisk(r);
    setIsModalOpen(true);
  };

  const handleSaveRisk = async (formData) => {
    if (selectedRisk) {
      await riskService.updateRisk(selectedRisk.id, formData);
      setMessage(`Cập nhật rủi ro "${formData.title}" thành công.`);
    } else {
      await riskService.createRisk(formData);
      setMessage(`Đánh giá rủi ro "${formData.title}" thành công.`);
    }
    fetchData();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleteLoading(true);
      await riskService.deleteRisk(deleteConfirm.id);
      setMessage(`Đã xóa rủi ro "${deleteConfirm.title}".`);
      setDeleteConfirm(null);
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Lỗi khi xóa rủi ro.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      critical: 'bg-red-950 text-red-400 border-red-800',
      high: 'bg-orange-950 text-orange-400 border-orange-800',
      medium: 'bg-amber-950 text-amber-400 border-amber-800',
      low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    };
    return badges[level?.toLowerCase()] || badges.medium;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-red-950 text-red-400 border-red-800',
      in_progress: 'bg-amber-950 text-amber-400 border-amber-800',
      mitigated: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      accepted: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return badges[status?.toLowerCase()] || badges.open;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Quản lý rủi ro an ninh (Risk Management)
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              NIST CSF: IDENTIFY (ID.RA-5)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Nhận diện nguy cơ, tính toán ma trận rủi ro (Likelihood × Impact) và lập kế hoạch giảm thiểu
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đánh giá rủi ro mới
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

      {/* Top Section: Matrix & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskMatrixCard matrix={matrixData?.matrix || {}} total={matrixData?.total || risks.length} />
        </div>

        <div className="space-y-3 flex flex-col justify-between">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Tổng số rủi ro đã xác định</span>
            <p className="text-3xl font-bold font-mono text-white mt-1">{risks.length}</p>
          </div>
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4">
            <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">Mức Critical (Cần xử lý ngay)</span>
            <p className="text-3xl font-bold font-mono text-red-400 mt-1">
              {matrixData?.levelCount?.critical ?? 0}
            </p>
          </div>
          <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-4">
            <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold">Mức High</span>
            <p className="text-3xl font-bold font-mono text-orange-400 mt-1">
              {matrixData?.levelCount?.high ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Tìm theo tiêu đề rủi ro, biện pháp giảm thiểu, tài sản..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters((prev) => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">Mọi mức rủi ro</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="open">Open (Chưa xử lý)</option>
            <option value="in_progress">In Progress (Đang giảm thiểu)</option>
            <option value="mitigated">Mitigated (Đã giảm thiểu)</option>
            <option value="accepted">Accepted (Chấp nhận)</option>
          </select>

          <select
            value={filters.assetId}
            onChange={(e) => setFilters((prev) => ({ ...prev, assetId: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">Mọi tài sản</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assetId} - {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
              <tr>
                <th className="py-3 px-4">Tài sản đối mặt</th>
                <th className="py-3 px-4">Kịch bản rủi ro (Risk Scenario)</th>
                <th className="py-3 px-4">Khả năng (Likelihood)</th>
                <th className="py-3 px-4">Mức độ ảnh hưởng (Impact)</th>
                <th className="py-3 px-4">Mức rủi ro (Risk Level)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách rủi ro...
                  </td>
                </tr>
              ) : filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    Không tìm thấy rủi ro nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRisks.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{r.asset?.name || 'Tài sản không xác định'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {r.asset?.assetId} • {r.asset?.ipAddress || 'No IP'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-medium text-slate-200">{r.title}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        Biện pháp: {r.mitigation || 'Chưa có biện pháp giảm thiểu'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-slate-400">
                      {r.likelihood}
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-slate-400">
                      {r.impact}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getLevelBadge(r.riskLevel)}`}>
                        {r.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailRisk(r)}
                          title="Xem biện pháp giảm thiểu rủi ro"
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title="Chỉnh sửa rủi ro"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirm(r)}
                            title="Xóa rủi ro"
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
      <RiskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRisk}
        risk={selectedRisk}
        assets={assets}
      />

      {/* Detail Mitigation Modal */}
      <Modal
        isOpen={!!detailRisk}
        onClose={() => setDetailRisk(null)}
        title="Biện pháp giảm thiểu rủi ro (Mitigation Plan)"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-mono">Tài sản: {detailRisk?.asset?.name}</span>
              <h4 className="text-base font-bold text-white mt-1">{detailRisk?.title}</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getLevelBadge(detailRisk?.riskLevel)}`}>
              {detailRisk?.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 uppercase font-mono block">Khả năng xảy ra</span>
              <span className="font-bold text-slate-200 uppercase">{detailRisk?.likelihood}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 uppercase font-mono block">Mức độ ảnh hưởng</span>
              <span className="font-bold text-slate-200 uppercase">{detailRisk?.impact}</span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              Kế hoạch kiểm soát & Giảm thiểu rủi ro
            </h5>
            <div className="text-xs text-slate-200 bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/60 leading-relaxed whitespace-pre-wrap">
              {detailRisk?.mitigation || 'Chưa thiết lập kế hoạch giảm thiểu cho kịch bản rủi ro này.'}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={() => setDetailRisk(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa rủi ro"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Bạn có chắc chắn muốn xóa rủi ro <strong className="text-white font-mono">"{deleteConfirm?.title}"</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
