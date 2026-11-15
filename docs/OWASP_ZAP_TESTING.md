# HƯỚNG DẪN KIỂM THỬ BẢO MẬT WEBSITE VỚI OWASP ZAP
## SecureWeb Platform – NIST CSF 1.1 Security Evaluation

Tài liệu này hướng dẫn sinh viên thực hiện kiểm thử bảo mật tự động và thủ công trên nền tảng **SecureWeb** bằng công cụ **OWASP ZAP (Zed Attack Proxy)** phục vụ báo cáo đồ án an toàn thông tin.

---

## 1. Mục tiêu Kiểm thử
1. Đánh giá tính an toàn của giao diện Frontend (React) và RESTful API Backend (Express.js).
2. Kiểm tra các rủi ro thuộc **OWASP Top 10**:
   - A01: Broken Access Control (Kiểm soát truy cập bị phá vỡ)
   - A02: Cryptographic Failures (Lỗi mã hóa dữ liệu)
   - A03: Injection (SQL Injection, XSS, Command Injection)
   - A05: Security Misconfiguration (Cấu hình sai bảo mật, thiếu HTTP Headers)
   - A07: Identification and Authentication Failures (Đăng nhập sai, Brute-force)
3. Xác minh các cơ chế bảo vệ đã lập trình trong SecureWeb: **Helmet headers, CORS whitelist, Rate Limit, Zod validation, Argon2id**.

---

## 2. Chuẩn bị Môi trường Kiểm thử
- **Target URL Frontend:** `http://localhost:5173`
- **Target URL Backend API:** `http://localhost:4000/api`
- **Tài khoản kiểm thử:**
  - Admin: `admin@gmail.com` / `Admin@123`
  - Regular User: `tester@gmail.com` / `Admin@123`

---

## 3. Các bước Quét với OWASP ZAP

### Bước 1: Quét Tự động Cơ bản (Automated Baseline Scan)
1. Mở **OWASP ZAP**.
2. Tại tab **Quick Start**, chọn **Automated Scan**.
3. Nhập **URL to attack**: `http://localhost:5173` (hoặc `http://localhost:4000/api/health`).
4. Bấm **Attack**.
5. ZAP sẽ kích hoạt **Spider** để dò tìm toàn bộ các liên kết, sau đó chạy **Active Scan rules**.

### Bước 2: Quét Xác thực Phân quyền (Authenticated Active Scan)
1. Trong ZAP, vào menu **Context** $\rightarrow$ Tạo Context mới tên `SecureWeb_App`.
2. Trong phần **Authentication**:
   - Chọn phương thức: **JSON-based Authentication**.
   - Login URL: `http://localhost:4000/api/auth/login`.
   - POST Data: `{"email":"{%username%}","password":"{%password%}"}`.
3. Trong phần **Users**: Thêm người dùng `admin@gmail.com` và `tester@gmail.com`.
4. Bấm chuột phải vào Context $\rightarrow$ **Active Scan** để kiểm tra kiểm soát truy cập (Broken Access Control).

---

## 4. Bảng Kết quả Phân tích Cảnh báo & Giải pháp Khắc phục

Dưới đây là bảng đối soát các cảnh báo điển hình của ZAP và cơ chế bảo vệ SecureWeb đã cài đặt:

| Mã cảnh báo ZAP | Phân loại rủi ro | Trạng thái trong SecureWeb | Cơ chế kỹ thuật xử lý |
|---|---|:---:|---|
| **Missing Anti-clickjacking Header** | Medium (Clickjacking) | ✅ **ĐÃ KHẮC PHỤC** | Thư viện `helmet` tự động thiết lập header `X-Frame-Options: SAMEORIGIN` và `Content-Security-Policy: frame-ancestors 'self'`. |
| **X-Content-Type-Options Header Missing** | Low (MIME Sniffing) | ✅ **ĐÃ KHẮC PHỤC** | `helmet` tự động thêm `X-Content-Type-Options: nosniff`. |
| **CORS Misconfiguration** | High (Data Leakage) | ✅ **ĐÃ KHẮC PHỤC** | Express `cors` được cấu hình Whitelist nghiêm ngặt (`localhost:5173`, `127.0.0.1:5173`), chặn các origin lạ từ domain ngoài. |
| **SQL Injection (SQLi)** | High / Critical | ✅ **ĐÃ KHẮC PHỤC** | Toàn bộ truy vấn cơ sở dữ liệu sử dụng **Prisma ORM** với Parameterized Queries, loại bỏ nguy cơ chèn câu lệnh SQL thô. |
| **Brute-force / Credential Stuffing** | Medium / High | ✅ **ĐÃ KHẮC PHỤC** | Hệ thống áp dụng `express-rate-limit` (200 req/15 phút) và **Khóa tài khoản tự động** sau 5 lần nhập sai liên tiếp. |
| **Cross-Site Scripting (XSS)** | High (Reflected/Stored) | ✅ **ĐÃ KHẮC PHỤC** | React tự động encode HTML khi render; Backend sử dụng **Zod schema** validate kiểu dữ liệu và độ dài chuỗi đầu vào. |

---

## 5. Xuất Báo cáo Đồ án
1. Trong ZAP, vào menu **Report** $\rightarrow$ **Generate Report**.
2. Chọn template: **Modern HTML Report** hoặc **PDF Report**.
3. Lưu file báo cáo vào thư mục `docs/zap-reports/` để đính kèm phụ lục đồ án tốt nghiệp.
