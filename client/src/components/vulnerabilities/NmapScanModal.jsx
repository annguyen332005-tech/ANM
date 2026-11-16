import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import { nmapScanService } from '../../services/nmapScanService';

const active = (job) => ['queued', 'running'].includes(job.status);
const labels = { queued: 'Đang chờ', running: 'Đang quét', completed: 'Hoàn tất', failed: 'Thất bại' };

export default function NmapScanModal({ isOpen, onClose, assets, onComplete }) {
  const [assetId, setAssetId] = useState('');
  const [ports, setPorts] = useState('4000,5173');
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const known = useRef(new Map());
  const callback = useRef(onComplete);
  useEffect(() => { callback.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isOpen) return;
    let disposed = false;
    let timer;
    async function poll() {
      try {
        const list = await nmapScanService.list();
        if (disposed) return;
        setJobs(list);
        setError('');
        const changed = list.some((job) => job.status === 'completed' && known.current.has(job.id) && known.current.get(job.id) !== 'completed');
        list.forEach((job) => known.current.set(job.id, job.status));
        if (changed) callback.current?.();
        const id = selectedId || list.find(active)?.id;
        if (id) {
          const result = await nmapScanService.get(id);
          if (!disposed) setDetail(result);
        }
      } catch (err) {
        if (!disposed) setError(err.friendlyMessage || err.message);
      } finally {
        if (!disposed) timer = setTimeout(poll, 5000);
      }
    }
    poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [isOpen, selectedId, refreshKey]);

  const start = async (event) => {
    event.preventDefault();
    setStarting(true);
    setError('');
    try {
      const job = await nmapScanService.start({ assetId, ports: ports.replace(/\s/g, '') });
      known.current.set(job.id, job.status);
      setSelectedId(job.id);
      setDetail({ ...job, findings: [] });
      setJobs((prev) => [job, ...prev]);
      setRefreshKey((key) => key + 1);
    } catch (err) { setError(err.friendlyMessage || err.message); }
    finally { setStarting(false); }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([detail.output], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `nmap-${detail.target}-${detail.id}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const chosen = assets.find((asset) => asset.id === assetId);

  return <Modal isOpen={isOpen} onClose={onClose} title="Quét Nmap ngay & Lịch sử kết quả" maxWidth="max-w-4xl">
    <div className="space-y-5 text-sm text-slate-300">
      <p className="text-xs text-slate-400">Quét TCP và nhận diện dịch vụ từ máy backend. Chọn tài sản bạn quản lý; cổng mở được lưu tự động ở mức Info, chưa xác nhận lỗ hổng/CVE. Mỗi lần quét lưu một bộ kết quả mới.</p>
      <form onSubmit={start} className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">Tài sản cần quét
          <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className="block w-full p-2 bg-slate-950 border border-slate-700 rounded">
            <option value="">-- Chọn tài sản --</option>
            {assets.map((asset) => <option key={asset.id} value={asset.id} disabled={!asset.ipAddress}>{asset.name} ({asset.ipAddress || 'Chưa có IP'})</option>)}
          </select>
        </label>
        <label className="space-y-1">Cổng TCP (tối đa 100)
          <input required value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="80,443,4000,5173" className="block w-full p-2 bg-slate-950 border border-slate-700 rounded" />
        </label>
        <p className="text-xs text-slate-400">Mục tiêu: {chosen?.ipAddress || 'Chưa chọn'}. Có thể đóng cửa sổ; tác vụ vẫn chạy trên backend. Giới hạn 150 giây.</p>
        <button disabled={starting || jobs.some(active)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-semibold disabled:opacity-50">{starting ? 'Đang tạo tác vụ...' : jobs.some(active) ? 'Đang có tác vụ chạy' : 'Bắt đầu quét Nmap'}</button>
      </form>
      {error && <p role="alert" className="p-3 rounded bg-red-950 text-red-300">{error}</p>}
      <div className="flex justify-between items-center"><h4 className="font-semibold text-white">30 lần quét gần nhất</h4><button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="text-cyan-400 text-xs">Làm mới</button></div>
      <div className="overflow-x-auto max-h-56 overflow-y-auto border border-slate-800 rounded">
        <table className="w-full text-xs text-left"><thead className="bg-slate-950 text-slate-400"><tr><th className="p-2">Thời gian</th><th className="p-2">Tài sản / IP</th><th className="p-2">Trạng thái</th><th className="p-2">Đã lưu</th><th className="p-2">Kết quả</th></tr></thead>
          <tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-slate-800"><td className="p-2">{new Date(job.createdAt).toLocaleString('vi-VN')}</td><td className="p-2">{job.assetName}<br />{job.target}</td><td className="p-2">{labels[job.status]}</td><td className="p-2">{job.importedCount} Info</td><td className="p-2"><button className="text-cyan-400" onClick={() => { setSelectedId(job.id); setDetail(null); setRefreshKey((key) => key + 1); }}>Xem</button></td></tr>)}</tbody>
        </table>
        {!jobs.length && <p className="p-4 text-slate-500">Chưa có lịch sử quét.</p>}
      </div>
      {detail && <section className="space-y-2 border border-slate-700 rounded p-3">
        <h4 className="font-semibold text-white">{detail.target} · Cổng {detail.ports} · {labels[detail.status]}</h4>
        <p role="status" className="text-xs text-cyan-400">{detail.phase}{active(detail) && detail.progress > 0 ? ` — ${detail.progress.toFixed(1)}% bước hiện tại` : ''}</p>
        {active(detail) && <div className="h-2 bg-slate-800 rounded overflow-hidden"><div className={`h-full bg-cyan-500 ${detail.progress ? '' : 'animate-pulse'}`} style={{ width: detail.progress ? `${detail.progress}%` : '15%' }} /></div>}
        {detail.error && <p className="text-red-300 text-xs">{detail.error}</p>}
        {detail.status === 'completed' && <p className="text-emerald-400 text-xs">Đã lưu {detail.importedCount} phát hiện. {detail.importedCount === 0 && 'Không tìm thấy cổng mở trong danh sách đã quét.'}</p>}
        {detail.findings?.map((finding, index) => <div key={index} className="text-xs p-2 bg-slate-950 rounded"><strong>{finding.title}</strong><p className="mt-1 text-slate-400">{finding.description}</p></div>)}
        <div className="flex justify-between"><span className="text-xs text-slate-400">Nhật ký Nmap (cập nhật mỗi 5 giây)</span><button disabled={!detail.output} onClick={download} className="text-xs text-cyan-400 disabled:opacity-40">Tải kết quả .txt</button></div>
        <pre className="max-h-52 overflow-auto bg-slate-950 p-3 rounded text-[11px] whitespace-pre-wrap">{detail.output || 'Đang chờ nhật ký từ Nmap...'}</pre>
      </section>}
    </div>
  </Modal>;
}
