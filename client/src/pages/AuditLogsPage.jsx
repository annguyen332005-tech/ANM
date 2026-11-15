import { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import Modal from '../components/common/Modal';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    resource: 'all',
    status: 'all',
  });

  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await auditService.getLogs({
        ...filters,
        page: currentPage,
        limit: 25,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Không thể tải nhật ký kiểm toán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadActions() {
      try {
        const actionList = await auditService.getActions();
        setActions(actionList);
      } catch (err) {
        console.warn('Could not load actions list', err);
      }
    }
    loadActions();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [filters.action, filters.resource, filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleReset = () => {
    setFilters({ search: '', action: 'all', resource: 'all', status: 'all' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Nhật ký kiểm toán an ninh (Audit Logging)
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              NIST CSF: DETECT (DE.AE-3)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Ghi vết toàn vẹn và bất biến mọi hành vi xác thực, thay đổi tài sản, lỗ hổng và rủi ro
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới log
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
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
            placeholder="Tìm theo chi tiết, IP truy cập, người dùng (Nhấn Enter để tìm)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition font-mono"
          >
            <option value="all">Mọi hành động (All Actions)</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            value={filters.resource}
            onChange={(e) => setFilters((prev) => ({ ...prev, resource: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition font-mono"
          >
            <option value="all">Mọi tài nguyên</option>
            <option value="auth">auth</option>
            <option value="user">user</option>
            <option value="asset">asset</option>
            <option value="vulnerability">vulnerability</option>
            <option value="risk">risk</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">Mọi kết quả</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {(filters.search || filters.action !== 'all' || filters.resource !== 'all' || filters.status !== 'all') && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Đặt lại
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Hành động (Action)</th>
                <th className="py-3 px-4">Tài nguyên</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Chi tiết sự kiện</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy bản ghi nhật ký nào.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-400 uppercase">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.ipAddress || 'unknown'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.user ? log.user.username : <span className="text-slate-600">Hệ thống</span>}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-200">
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          log.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-red-950 text-red-400 border-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Tổng số: <strong className="text-white">{total}</strong> sự kiện được lưu
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:bg-slate-800 transition"
            >
              Trang trước
            </button>
            <span>
              Trang <strong className="text-white">{page}</strong> / {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:bg-slate-800 transition"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Chi tiết sự kiện kiểm toán (Audit Record Detail)"
        maxWidth="max-w-xl"
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">HÀNH ĐỘNG (ACTION)</span>
              <span className="font-bold text-cyan-400">{selectedLog?.action}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TÀI NGUYÊN (RESOURCE)</span>
              <span className="text-slate-200 uppercase">{selectedLog?.resource}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">THỜI GIAN GHI NHẬN</span>
              <span className="text-slate-300">
                {selectedLog?.createdAt && new Date(selectedLog.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ĐỊA CHỈ IP TRUY CẬP</span>
              <span className="text-slate-300">{selectedLog?.ipAddress || 'unknown'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">NGƯỜI THỰC HIỆN</span>
              <span className="text-slate-300">
                {selectedLog?.user ? `${selectedLog.user.username} (${selectedLog.user.email})` : 'Hệ thống'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">KẾT QUẢ THỰC THI</span>
              <span className={selectedLog?.status === 'success' ? 'text-emerald-400 font-bold uppercase' : 'text-red-400 font-bold uppercase'}>
                {selectedLog?.status}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] mb-1">NỘI DUNG CHI TIẾT (DETAILS)</span>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedLog?.details || 'Không có chi tiết bổ sung'}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={() => setSelectedLog(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-sans"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
