export default function AssetFilter({ filters, onChange, onReset }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          name="search"
          value={filters.search || ''}
          onChange={handleChange}
          placeholder="Tìm kiếm tài sản theo Tên, Mã, IP, Loại..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          name="status"
          value={filters.status || 'all'}
          onChange={handleChange}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Active (Hoạt động)</option>
          <option value="maintenance">Maintenance (Bảo trì)</option>
          <option value="offline">Offline</option>
          <option value="retired">Retired (Đã thu hồi)</option>
        </select>

        <select
          name="criticality"
          value={filters.criticality || 'all'}
          onChange={handleChange}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition"
        >
          <option value="all">Mọi độ quan trọng</option>
          <option value="critical">Critical (Nghiêm trọng)</option>
          <option value="high">High (Cao)</option>
          <option value="medium">Medium (Trung bình)</option>
          <option value="low">Low (Thấp)</option>
        </select>

        {(filters.search || filters.status !== 'all' || filters.criticality !== 'all') && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}
