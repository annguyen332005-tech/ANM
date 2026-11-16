import { useCallback, useEffect, useState } from 'react';
import { integrationService } from '../services/integrationService';

export default function WazuhIntegrationPanel() {
  const [status, setStatus] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const load = useCallback(async () => {
    try { setStatus(await integrationService.getWazuhStatus()); setError(''); }
    catch (err) { setError(err.friendlyMessage || err.message); }
  }, []);
  useEffect(() => {
    const initial = setTimeout(load, 0);
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [load]);
  async function setup() {
    setWorking(true);
    try { await integrationService.setupWazuh(); await load(); }
    catch (err) { setError(err.friendlyMessage || err.message); }
    finally { setWorking(false); }
  }
  async function download() {
    try { await integrationService.downloadWazuhConnector(); }
    catch (err) { setError(err.friendlyMessage || err.message); }
  }
  const url = `${backendUrl.trim().replace(/\/+$/, '') || 'http://IP_MSI:4000'}/api/webhooks/wazuh`;
  // Escape user-entered URL for XML; secret remains a placeholder, never returned by API.
  const xmlUrl = url.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return <section className="p-5 rounded-xl border border-cyan-700/50 bg-slate-900 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-cyan-300">Wazuh — Nhận cảnh báo thật</h2>
      <button onClick={load} className="text-xs text-cyan-400">Làm mới trạng thái</button>
    </div>
    <p className="text-xs text-slate-400">Windows Agent → Ubuntu Wazuh Manager → webhook SecureWeb. Không dùng nút mô phỏng để kiểm tra kết nối thật.</p>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {status && <div className="text-sm text-slate-300 space-y-1" role="status">
      <p>Bộ nhận: {status.enabled ? 'Đã bật' : 'Chưa bật'} · Khóa webhook: {status.keyConfigured ? 'Đã cấu hình' : 'Chưa cấu hình trên backend'}</p>
      <p>Đã nhận: <strong>{status.count}</strong> cảnh báo không trùng · Lần gần nhất: {status.recent[0] ? new Date(status.recent[0].receivedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu từ Manager'}</p>
      <p className="text-xs text-slate-500">Lần nhận gần nhất chỉ chứng minh dữ liệu đã đến; không xác nhận Manager luôn trực tuyến.</p>
    </div>}
    <div className="flex flex-wrap gap-2">
      {!status?.enabled && <button disabled={working} onClick={setup} className="px-3 py-2 rounded bg-cyan-700 text-white text-xs disabled:opacity-50">{working ? 'Đang bật...' : 'Bật bộ nhận Wazuh'}</button>}
      <button onClick={download} className="px-3 py-2 rounded bg-slate-800 text-cyan-300 text-xs border border-slate-700">Tải script cho Ubuntu</button>
    </div>
    <details className="text-xs text-slate-300 space-y-3">
      <summary className="cursor-pointer text-cyan-300">Các bước cấu hình Wazuh Manager 4.x trên Ubuntu</summary>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Xác nhận Agent Win11 là Active trên Wazuh Dashboard.</li>
        <li>Khóa dùng chung nằm trong <code>server/.env</code> ở mục <code>WAZUH_WEBHOOK_KEY</code>. Không dùng mật khẩu Dashboard hoặc JWT web.</li>
        <li>Từ Ubuntu, thử <code>curl http://IP_MSI:4000/api/health</code>. Cần truy cập được cổng backend, không dùng localhost của Ubuntu.</li>
        <li>Tải script, chép thành <code>/var/ossec/integrations/custom-secureweb</code>; đặt quyền <code>root:wazuh</code> và <code>750</code>.</li>
        <li>Thêm XML bên dưới vào trong <code>&lt;ossec_config&gt;</code> của <code>/var/ossec/etc/ossec.conf</code>, thay khóa mẫu bằng khóa trong .env, rồi restart Wazuh Manager.</li>
      </ol>
      <label className="block">Địa chỉ backend MSI mà Ubuntu truy cập được
        <input value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} placeholder="http://192.168.2.19:4000" className="block w-full mt-1 rounded p-2 border border-slate-700 bg-slate-950 text-white" />
      </label>
      <pre className="p-3 bg-slate-950 rounded whitespace-pre-wrap break-all">{`<integration>
  <name>custom-secureweb</name>
  <hook_url>${xmlUrl}</hook_url>
  <api_key>THAY_BANG_WAZUH_WEBHOOK_KEY_TRONG_SERVER_ENV</api_key>
  <level>5</level>
  <alert_format>json</alert_format>
</integration>`}</pre>
      <p>Chỉ chuyển tiếp cảnh báo từ level 5 trở lên. Script thử lại tối đa 3 lần; nếu backend ngừng lâu cần phát lại từ alerts.json. Không tự kéo toàn bộ cảnh báo cũ.</p>
      <p>Dùng HTTP chỉ trong lab nội bộ; khi đi qua mạng không tin cậy, dùng HTTPS. Hướng dẫn chi tiết: <code>server/integrations/wazuh/README.md</code>.</p>
    </details>
    {!!status?.recent.length && <div className="overflow-x-auto"><table className="w-full text-left text-xs text-slate-300"><thead className="text-slate-500"><tr><th className="p-2">Nhận lúc</th><th className="p-2">Agent</th><th className="p-2">Rule / Level</th><th className="p-2">Mức trong web</th></tr></thead><tbody>
      {status.recent.map((item) => <tr key={item.id} className="border-t border-slate-800"><td className="p-2">{new Date(item.receivedAt).toLocaleString('vi-VN')}</td><td className="p-2">{item.agentName}</td><td className="p-2">{item.ruleId} / {item.level}</td><td className="p-2">{item.severity}</td></tr>)}
    </tbody></table><a href="./alerts" className="inline-block mt-2 text-cyan-400">Mở Cảnh báo an ninh →</a></div>}
  </section>;
}
