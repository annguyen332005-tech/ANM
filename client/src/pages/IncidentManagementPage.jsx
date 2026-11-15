import { useState, useEffect, useCallback } from 'react';
import { incidentService } from '../services/incidentService';
import { assetService } from '../services/assetService';
import IncidentModal from '../components/incidents/IncidentModal';
import ResponseActionsPanel from '../components/incidents/ResponseActionsPanel';

const SEVERITY_COLORS = {
  low: 'bg-green-500/20 text-green-300 border-green-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const STATUS_COLORS = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  investigating: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  contained: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/40',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export default function IncidentManagementPage() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      const [incRes, statsRes, assetRes] = await Promise.all([
        incidentService.getIncidents(params),
        incidentService.getStats(),
        assetService.getAssets(),
      ]);
      setIncidents(incRes.incidents || incRes);
      setStats(statsRes);
      setAssets(assetRes.assets || assetRes);
    } catch (err) {
      console.error('Load incidents error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadDetail = async (incident) => {
    try {
      const res = await incidentService.getIncidentById(incident.id);
      setSelectedIncident(res.incident || res);
      setShowDetail(true);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshDetail = async () => {
    if (!selectedIncident) return;
    try {
      const res = await incidentService.getIncidentById(selectedIncident.id);
      setSelectedIncident(res.incident || res);
    } catch (err) {}
    loadData();
  };

  const handleCreate = async (data) => {
    await incidentService.createIncident(data);
    loadData();
  };

  const handleUpdate = async (data) => {
    await incidentService.updateIncident(editIncident.id, data);
    loadData();
  };

  const handleDelete = async (id) => {
    await incidentService.deleteIncident(id);
    setDeleteConfirm(null);
    if (selectedIncident?.id === id) setShowDetail(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🚨 Quản lý Sự cố (Incident Management)</h1>
          <p className="text-sm text-slate-400 mt-1">NIST RS.RP – Ứng phó và xử lý sự cố an toàn thông tin</p>
        </div>
        <button onClick={() => { setEditIncident(null); setShowModal(true); }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-sm shadow-lg shadow-cyan-600/20 transition whitespace-nowrap">
          + Tạo sự cố mới
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Tổng sự cố', value: stats.total ?? 0, color: 'text-cyan-400' },
            { label: 'Mới (New)', value: stats.statusCounts?.new ?? stats.byStatus?.new ?? 0, color: 'text-blue-400' },
            { label: 'Đang xử lý', value: stats.statusCounts?.investigating ?? stats.byStatus?.investigating ?? 0, color: 'text-yellow-400' },
            { label: 'Critical', value: stats.severityCounts?.critical ?? stats.bySeverity?.critical ?? 0, color: 'text-red-400' },
            { label: 'Đã giải quyết', value: stats.statusCounts?.resolved ?? stats.byStatus?.resolved ?? 0, color: 'text-green-400' },          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
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
          <option value="new">New</option>
          <option value="investigating">Investigating</option>
          <option value="contained">Contained</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition">
          🔄 Làm mới
        </button>
      </div>

      {/* Main layout: Table + Detail panel */}
      <div className={`grid gap-4 ${showDetail ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : incidents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">Không có sự cố nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">SỰ CỐ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">LOẠI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">MỨC ĐỘ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">TRẠNG THÁI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id}
                      onClick={() => loadDetail(inc)}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition ${selectedIncident?.id === inc.id && showDetail ? 'bg-slate-800/60' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white text-sm leading-tight line-clamp-2 max-w-xs">{inc.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(inc.createdAt).toLocaleDateString('vi-VN')}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{inc.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[inc.severity] || 'text-slate-300'}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[inc.status] || 'text-slate-300'}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditIncident(inc); setShowModal(true); }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs transition">✏️</button>
                          <button onClick={() => setDeleteConfirm(inc)}
                            className="px-2 py-1 bg-red-900/30 hover:bg-red-800/50 border border-red-800/40 text-red-400 rounded text-xs transition">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {showDetail && selectedIncident && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm line-clamp-1">{selectedIncident.title}</h3>
              <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {selectedIncident.description && (
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{selectedIncident.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Phát hiện bởi', value: selectedIncident.detectedBy || '-' },
                  { label: 'Phân công', value: selectedIncident.assignedTo || '-' },
                  { label: 'Tài sản', value: selectedIncident.asset?.name || '-' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/40 rounded-lg p-2">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <ResponseActionsPanel incident={selectedIncident} onRefresh={refreshDetail} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <IncidentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={editIncident ? handleUpdate : handleCreate}
        incident={editIncident}
        assets={assets}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-400 mb-4">Bạn có chắc muốn xóa sự cố <strong className="text-white">"{deleteConfirm.title}"</strong>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
