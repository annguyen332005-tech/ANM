import { useEffect, useState } from 'react';
import { assetService } from '../services/assetService';
import Modal from './common/Modal';

export default function AssetTrash({ isAdmin }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { setAssets(await assetService.getTrash()); setError(''); }
    catch (err) { setError(err.friendlyMessage || err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let alive = true;
    assetService.getTrash().then((data) => { if (alive) setAssets(data); })
      .catch((err) => { if (alive) setError(err.friendlyMessage || err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setFeedback('');
    try {
      const result = confirm.kind === 'restore'
        ? await assetService.restoreAsset(confirm.asset.id)
        : await assetService.permanentlyDeleteAsset(confirm.asset.id, code);
      setConfirm(null); setCode(''); setFeedback(result.message);
      await load();
    } catch (err) { setError(err.friendlyMessage || err.message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <div className="flex justify-between items-center gap-3"><h2 className="font-semibold text-white">Thùng rác tài sản ({assets.length})</h2><button disabled={loading || busy} onClick={load} className="text-sm text-cyan-400 disabled:opacity-50">Làm mới</button></div>
    <p className="text-sm text-slate-400">Tài sản xóa ở Quản lý tài sản được giữ tại đây. Khôi phục đưa tài sản trở lại danh sách cùng mã và dữ liệu liên kết. Chỉ Admin được khôi phục hoặc xóa vĩnh viễn.</p>
    {feedback && <p role="status" className="p-3 bg-emerald-950 text-emerald-300 rounded">{feedback}</p>}
    {error && <p role="alert" className="p-3 bg-red-950 text-red-300 rounded">{error}</p>}
    <div className="overflow-x-auto border border-slate-800 rounded-xl"><table className="w-full text-sm text-left text-slate-300">
      <thead className="bg-slate-950 text-slate-400 text-xs"><tr><th className="p-3">Mã / Tên tài sản</th><th className="p-3">IP</th><th className="p-3">Xóa lúc</th><th className="p-3">Dữ liệu liên kết</th><th className="p-3">Thao tác</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={5} className="p-6 text-center">Đang tải thùng rác...</td></tr> : assets.map((asset) => <tr key={asset.id} className="border-t border-slate-800">
        <td className="p-3"><div className="font-mono text-cyan-300">{asset.assetId}</div>{asset.name}</td><td className="p-3">{asset.ipAddress || '—'}</td><td className="p-3">{new Date(asset.deletedAt).toLocaleString('vi-VN')}</td>
        <td className="p-3 text-xs">{asset._count.vulnerabilities} lỗ hổng · {asset._count.risks} rủi ro<br />{asset._count.alerts} cảnh báo · {asset._count.incidents} sự cố</td>
        <td className="p-3">{isAdmin ? <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => { setConfirm({ kind: 'restore', asset }); setError(''); }} className="px-3 py-2 bg-emerald-800 text-emerald-200 rounded">Khôi phục</button><button disabled={busy} onClick={() => { setConfirm({ kind: 'delete', asset }); setCode(''); setError(''); }} className="px-3 py-2 bg-red-950 text-red-300 rounded">Xóa vĩnh viễn</button></div> : 'Chỉ xem'}</td>
      </tr>)}{!loading && !assets.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có tài sản trong thùng rác.</td></tr>}</tbody>
    </table></div>
    <p className="text-xs text-slate-500">Xóa vĩnh viễn xóa kèm lỗ hổng/rủi ro của tài sản; cảnh báo và sự cố được giữ nhưng bỏ liên kết. Các bản sao lưu đã tạo và nhật ký kiểm toán vẫn được giữ.</p>
    <Modal isOpen={!!confirm} onClose={() => { if (!busy) setConfirm(null); }} title={confirm?.kind === 'restore' ? 'Khôi phục tài sản' : 'Xác nhận xóa vĩnh viễn'}>
      {confirm && <form onSubmit={submit} className="space-y-4 text-sm text-slate-300">
        <p>{confirm.kind === 'restore' ? 'Đưa tài sản về Quản lý tài sản:' : 'Xóa tài sản khỏi dữ liệu hiện tại:'} <strong className="text-white">{confirm.asset.name} ({confirm.asset.assetId})</strong></p>
        {confirm.kind === 'delete' && <><p className="text-red-300">Không thể khôi phục từ thùng rác sau thao tác này. Lỗ hổng và rủi ro liên kết cũng bị xóa.</p><label className="block">Nhập mã <strong>{confirm.asset.assetId}</strong> để xác nhận<input autoComplete="off" required value={code} onChange={(e) => setCode(e.target.value)} className="mt-2 block w-full p-2 rounded bg-slate-950 border border-slate-700 text-white" /></label></>}
        {error && <p role="alert" className="text-red-300">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setConfirm(null)} className="px-4 py-2 bg-slate-800 rounded">Hủy</button><button type="submit" disabled={busy || (confirm.kind === 'delete' && code !== confirm.asset.assetId)} className="px-4 py-2 bg-cyan-700 text-white rounded disabled:opacity-50">{busy ? 'Đang xử lý...' : confirm.kind === 'restore' ? 'Khôi phục tài sản' : 'Xóa vĩnh viễn'}</button></div>
      </form>}
    </Modal>
  </div>;
}
