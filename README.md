# 🛡️ SecureWeb – Secure IT Asset Management & Cybersecurity Monitoring Platform

> **Đồ án Chuyên ngành An toàn Thông tin & Công nghệ Phần mềm**  
> Xây dựng và triển khai dựa trên 5 nhóm chức năng cốt lõi của **NIST Cybersecurity Framework 1.1**:  
> **1. IDENTIFY • 2. PROTECT • 3. DETECT • 4. RESPOND • 5. RECOVER**

---

## 📌 1. Giới thiệu Dự án

**SecureWeb** là nền tảng quản lý tài sản CNTT tập trung tích hợp các cơ chế bảo vệ an ninh mạng, phát hiện lỗ hổng, quản lý sự cố và sao lưu phục hồi dữ liệu. Hệ thống được thiết kế theo kiến trúc **Client – Server (Modular Monolith)**, sử dụng CSDL **SQLite** cục bộ giúp sinh viên và giảng viên dễ dàng chạy và nghiệm thu trên máy tính Windows 11 mà không cần cài đặt Docker hay hệ quản trị CSDL phức tạp.

---

## 🛠️ 2. Công nghệ Sử dụng

### Frontend
- **Framework:** React.js 18 + Vite
- **Styling:** Tailwind CSS (Dark SOC Theme)
- **Routing:** React Router v7
- **HTTP Client:** Axios (kèm Interceptor tự động đính kèm JWT Bearer Token)
- **Data Visualization:** Recharts (Biểu đồ tròn tài sản, Biểu đồ thanh độ quan trọng)

### Backend
- **Runtime:** Node.js v20+
- **Web Framework:** Express.js 5
- **ORM:** Prisma ORM 5 (SQLite Provider)
- **Validation:** Zod Schema Validation

### Bảo mật & Mật mã học
- **Hash mật khẩu:** Argon2id (`argon2`)
- **Xác thực:** JSON Web Token (JWT)
- **HTTP Security Headers:** Helmet
- **Giới hạn tần suất:** express-rate-limit
- **CORS:** Whitelist kiểm soát nguồn truy cập

---

## 📋 3. Ánh xạ 5 Trụ cột NIST Cybersecurity Framework 1.1

| Trụ cột NIST | Module trong SecureWeb | Chức năng kỹ thuật đã triển khai |
|---|---|---|
| **1. IDENTIFY** | Quản lý Tài sản (Asset)<br>Quản lý Lỗ hổng (Vuln)<br>Đánh giá Rủi ro (Risk) | • CRUD thiết bị CNTT, gán mức độ quan trọng (Criticality)<br>• Nhập báo cáo quét từ **Nmap, OWASP ZAP, Nessus, OpenVAS**<br>• Tự động tính toán ma trận rủi ro $3 \times 3$ ($\text{Likelihood} \times \text{Impact}$) |
| **2. PROTECT** | Danh tính & Truy cập (IAM)<br>Bảo mật Web & Mạng | • Hash mật khẩu bằng **Argon2id**<br>• Phân quyền RBAC 4 vai trò (`Admin`, `Security Analyst`, `IT Manager`, `User`)<br>• Chống Brute-force: Tự động khóa tài khoản sau 5 lần nhập sai liên tiếp<br>• Chống SQL Injection (Prisma Parameterized Queries), Chống XSS |
| **3. DETECT** | Giám sát & Phát hiện<br>Nhật ký Kiểm toán (Audit) | • Bảng ghi nhận `AuditLog` chi tiết IP, thời gian, hành động của người dùng<br>• Cảnh báo an ninh tự động khi phát hiện lỗ hổng mức Critical<br>• Tích hợp adapter và mô phỏng sự kiện từ **Wazuh SIEM, Suricata IDS, Prometheus, WAF** |
| **4. RESPOND** | Xử lý Sự cố (Incident)<br>Phản ứng khẩn cấp | • Quản lý vòng đời sự cố (New $\rightarrow$ Investigating $\rightarrow$ Contained $\rightarrow$ Resolved $\rightarrow$ Closed)<br>• Hành động phản ứng nhanh: **Cô lập tài sản (Quarantine Asset)**, **Chặn IP (Block IP)**<br>• Ghi nhận tiến trình xử lý sự cố (Incident Action Timeline) |
| **5. RECOVER** | Sao lưu & Khôi phục (Backup)<br>Cấu hình Hệ thống | • Snapshot cơ sở dữ liệu nguyên tử bằng SQLite `VACUUM INTO`<br>• Mã băm **SHA-256 đối soát tính toàn vẹn** chống giả mạo file backup<br>• Phục hồi dữ liệu và lưu vết lịch sử khôi phục (`RecoveryHistory`)<br>• Quản trị chính sách sao lưu tự động (`SystemSetting`) |

---

## 🚀 4. Hướng dẫn Cài đặt & Khởi chạy

### Bước 1: Chuẩn bị Cơ sở Dữ liệu & Seed Dữ liệu Demo
Mở terminal PowerShell tại thư mục gốc của dự án:
```powershell
cd d:\BTANM\server
npm install
node scripts/seed.js
```
*Lệnh trên sẽ tự động tạo bảng trong `server/database/secureweb.db` và nạp sẵn tài khoản Admin, tài sản mẫu, lỗ hổng CVE, rủi ro, sự cố và cấu hình hệ thống.*

### Bước 2: Khởi chạy Backend Server (Port 4000)
```powershell
cd d:\BTANM\server
npm run dev
```

### Bước 3: Khởi chạy Frontend Web (Port 5173)
Mở một cửa sổ PowerShell mới:
```powershell
cd d:\BTANM\client
npm install
npm run dev
```

Truy cập ứng dụng tại: **`http://localhost:5173`**

---

## 🧪 5. Kiểm thử Hệ thống (Automated Security Tests)

Hệ thống tích hợp sẵn bộ kịch bản kiểm thử bảo mật tự động:
```powershell
cd d:\BTANM\server
npm test
```
*Bộ kiểm thử sẽ tự động xác minh:*
1. Cơ chế chống Brute-force: Khóa tài khoản sau 5 lần đăng nhập sai.
2. Cơ chế Snapshot SQLite `VACUUM INTO`, mã băm SHA-256 và phát hiện file backup bị chỉnh sửa trái phép.
3. Ma trận kiểm soát phân quyền RBAC trên toàn bộ các Endpoint nhạy cảm.

---

## 🔑 6. Tài khoản Demo có sẵn

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn chính |
|---|---|---|---|
| **Admin** | `admin@gmail.com` | `Admin@123` | Toàn quyền quản trị hệ thống, Xóa tài sản, Sao lưu & Khôi phục, Cấu hình |
| **User (Tester)** | `tester@gmail.com` | `Admin@123` | Người dùng cơ bản, chỉ xem Dashboard, không truy cập chức năng nhạy cảm |

> *Lưu ý: Luôn nhập email bằng chữ thường (`admin@gmail.com`).*

---

## 📂 7. Tài liệu Kèm theo Đồ án

- 📘 [Tài liệu Kiến trúc Hệ thống (Architecture Specification)](file:///d:/BTANM/docs/ARCHITECTURE.md)
- 🎯 [Kịch bản Báo cáo & Trình diễn Đồ án (Demo Script)](file:///d:/BTANM/docs/DEMO_SCRIPT.md)
- 🛡️ [Hướng dẫn Kiểm thử Bảo mật với OWASP ZAP](file:///d:/BTANM/docs/OWASP_ZAP_TESTING.md)
- 🔍 [Hướng dẫn Quét Mạng & Dịch vụ với Nmap](file:///d:/BTANM/docs/NMAP_SECURITY_GUIDE.md)
- 📮 [Bộ Postman Collection & Environment JSON](file:///d:/BTANM/docs/postman/)
