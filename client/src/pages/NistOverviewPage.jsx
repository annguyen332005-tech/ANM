export default function NistOverviewPage() {
  const nistFunctions = [
    {
      id: 'IDENTIFY',
      name: '1. IDENTIFY – Nhận diện',
      color: 'border-cyan-500 bg-cyan-950/20 text-cyan-400',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      status: 'Đã hoàn thành 100% (Giai đoạn 1 & 2)',
      categories: [
        { code: 'ID.AM', name: 'Asset Management', desc: 'Kiểm kê, phân loại và theo dõi phần cứng, phần mềm, thiết bị mạng, máy chủ (CRUD, tìm kiếm, lọc).', active: true },
        { code: 'ID.RA', name: 'Risk Assessment & Vulnerability', desc: 'Đánh giá ma trận rủi ro (Likelihood × Impact) và quản lý lỗ hổng (CVE, CVSS 10.0, Import Nmap/ZAP/Nessus).', active: true },
        { code: 'ID.SC', name: 'Supply Chain Risk', desc: 'Quản lý rủi ro nhà cung cấp và chuỗi cung ứng công nghệ thông tin.', active: true },
      ],
    },
    {
      id: 'PROTECT',
      name: '2. PROTECT – Bảo vệ',
      color: 'border-blue-500 bg-blue-950/20 text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      status: 'Đã hoàn thành 100% (Giai đoạn 1 & 2)',
      categories: [
        { code: 'PR.AC', name: 'Identity & Access Control', desc: 'Xác thực JWT, hash Argon2id, phân quyền RBAC 4 vai trò, tự động khóa sau 5 lần sai mật khẩu.', active: true },
        { code: 'PR.DS', name: 'Data Security', desc: 'Bảo vệ dữ liệu nhạy cảm, mã hóa dữ liệu truyền tải, lưu mật khẩu an toàn.', active: true },
        { code: 'PR.IP', name: 'Information Protection', desc: 'Quy trình bảo vệ thông tin và sao lưu dự phòng SQLite VACUUM INTO nguyên tử.', active: true },
        { code: 'PR.PT', name: 'Protective Technology', desc: 'Helmet Security Headers, CORS Policy, Rate Limiting chống DoS.', active: true },
      ],
    },
    {
      id: 'DETECT',
      name: '3. DETECT – Phát hiện',
      color: 'border-amber-500 bg-amber-950/20 text-amber-400',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      status: 'Đã hoàn thành 100% (Giai đoạn 2 & 3)',
      categories: [
        { code: 'DE.AE', name: 'Anomalies and Events (Audit Logging)', desc: 'Thu thập Audit Log mọi thao tác quản trị, truy cập trái phép, tự sinh Security Event khi có lỗ hổng Critical.', active: true },
        { code: 'DE.CM', name: 'Security Continuous Monitoring', desc: 'Giám sát an ninh liên tục trên SOC Dashboard, Cảnh báo an ninh và tích hợp Wazuh, Suricata, Prometheus, WAF.', active: true },
      ],
    },
    {
      id: 'RESPOND',
      name: '4. RESPOND – Ứng phó',
      color: 'border-red-500 bg-red-950/20 text-red-400',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      status: 'Đã hoàn thành 100% (Giai đoạn 3)',
      categories: [
        { code: 'RS.RP', name: 'Response Planning', desc: 'Quy trình và kế hoạch ứng phó sự cố an ninh mạng (Incident Management) theo vòng đời: New → Closed.', active: true },
        { code: 'RS.MI', name: 'Mitigation Actions', desc: 'Hành động ứng phó nhanh: Cách ly tài sản (QUARANTINE_ASSET), Chặn IP độc hại (BLOCK_IP), Giải quyết sự cố.', active: true },
      ],
    },
    {
      id: 'RECOVER',
      name: '5. RECOVER – Khôi phục',
      color: 'border-emerald-500 bg-emerald-950/20 text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      status: 'Đã hoàn thành 100% (Giai đoạn 4 & 5)',
      categories: [
        { code: 'RC.RP', name: 'Recovery Planning', desc: 'Kế hoạch phục hồi hoạt động sau sự cố, xác minh toàn vẹn SHA-256 và lưu trữ lịch sử khôi phục.', active: true },
        { code: 'RC.IM', name: 'Improvements & Backup', desc: 'Sao lưu SQLite an toàn và khôi phục dữ liệu toàn vẹn (VACUUM INTO, SHA-256 Checksum, Báo cáo Executive).', active: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          NIST Cybersecurity Framework 1.1 Mapping
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            Stage 1 - 5 Complete (Toàn diện)
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Bản đồ ánh xạ các chức năng của hệ thống SecureWeb vào 5 nhóm cốt lõi của NIST CSF 1.1
        </p>
      </div>

      {/* Grid of 5 Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nistFunctions.map((fn) => (
          <div
            key={fn.id}
            className={`rounded-xl border p-5 shadow-lg backdrop-blur bg-slate-900/60 ${fn.color} flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">{fn.name}</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${fn.badgeColor}`}>
                {fn.id}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-slate-800">
              Trạng thái: <span className="text-slate-200 font-semibold">{fn.status}</span>
            </p>

            <div className="space-y-2.5 flex-1">
              {fn.categories.map((cat) => (
                <div
                  key={cat.code}
                  className={`p-2.5 rounded-lg border text-xs ${
                    cat.active
                      ? 'bg-slate-950/80 border-slate-700 text-slate-200'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-cyan-400">{cat.code}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        cat.active ? 'bg-emerald-950 text-emerald-400 font-semibold' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {cat.active ? 'Hoạt động (Active)' : 'Giai đoạn sau'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-300">{cat.name}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
