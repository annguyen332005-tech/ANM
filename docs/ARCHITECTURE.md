# TÀI LIỆU KIẾN TRÚC HỆ THỐNG SECUREWEB
## Architecture & Security Design Specification – NIST CSF 1.1

---

## 1. Tổng quan Kiến trúc Hệ thống

Nền tảng **SecureWeb** được thiết kế theo mô hình **Client – Server** với phong cách **Modular Monolith** nhằm đảm bảo tính đơn giản, dễ triển khai tại máy trạm Windows 11 mà không đòi hỏi hạ tầng ảo hóa phức tạp (như Docker hoặc Kubernetes):

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                    │
│   Tailwind CSS (Dark SOC Theme) • Recharts • Axios Interceptor│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS REST API BACKEND                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security Middleware (Helmet, CORS, RateLimit, Auth)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ Validated Requests           │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Controllers & Zod Input Validation                    │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ Sanitized Data               │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Business Services (Auth, Asset, Vuln, Risk, Incident, │  │
│  │ Backup, Integration, Report)                          │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ ORM Calls                    │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Prisma ORM (Parameterized Queries, Schema Migrations) │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ File I/O
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               SQLITE DATABASE (secureweb.db)                │
│    ACID Transactions • WAL Mode • VACUUM INTO Snapshots     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Thiết kế Cơ sở Dữ liệu (Prisma Schema ERD)

CSDL bao gồm các bảng cốt lõi liên kết khóa ngoại chặt chẽ:

```
[User] ──(1:N)──< [UserRole] >──(N:1)── [Role]
  │
  ├─(1:N)──< [AuditLog]
  │
[AssetCategory] ──(1:N)──< [Asset]
                             │
                             ├─(1:N)──< [Vulnerability]
                             ├─(1:N)──< [Risk]
                             ├─(1:N)──< [Alert]
                             └─(1:N)──< [Incident] ──(1:N)──< [IncidentAction]

[Backup] <──(1:N)── [RecoveryHistory]
[Integration]
[SecurityEvent]
[SystemSetting]
```

---

## 3. Ma trận Phân quyền Truy cập (RBAC Matrix)

Hệ thống phân định 4 vai trò rõ ràng và thực thi kiểm tra 100% tại Backend Middleware (`requireRole`):

| Chức năng / Endpoint | Admin | Security Analyst | IT Manager | User |
|---|:---:|:---:|:---:|:---:|
| **Xem SOC Dashboard** | ✓ | ✓ | ✓ | ✓ |
| **Xem danh sách Tài sản** | ✓ | ✓ | ✓ | ✓ |
| **Thêm / Sửa Tài sản** | ✓ | ✗ | ✓ | ✗ |
| **Xóa Tài sản** | ✓ | ✗ | ✗ | ✗ |
| **Quản lý Lỗ hổng & Nhập Scan** | ✓ | ✓ | ✗ | ✗ |
| **Quản lý & Đánh giá Rủi ro** | ✓ | ✓ | ✓ | ✗ |
| **Xem Nhật ký Kiểm toán (Audit Logs)**| ✓ | ✓ | ✗ | ✗ |
| **Xem & Xử lý Cảnh báo (Alerts)** | ✓ | ✓ | ✗ | ✗ |
| **Quản lý Sự cố & Phản ứng nhanh** | ✓ | ✓ | ✗ | ✗ |
| **Mô phỏng Sự kiện Tích hợp** | ✓ | ✓ | ✗ | ✗ |
| **Xem & Tạo Bản sao lưu (Backup)** | ✓ | ✗ | ✓ | ✗ |
| **Khôi phục Dữ liệu (Restore)** | ✓ | ✗ | ✗ | ✗ |
| **Chỉnh sửa Cấu hình Hệ thống** | ✓ | ✗ | ✗ | ✗ |
| **Xem Báo cáo Tổng hợp & Xuất CSV**| ✓ | ✓ | ✓ | ✗ |

---

## 4. Các Biện pháp An toàn Thông tin Đã Áp dụng

1. **Mật khẩu an toàn:** Sử dụng thuật toán băm **Argon2id** (đạt giải Password Hashing Competition), chống tấn công GPU/ASIC brute-force.
2. **Chống Brute-force:** Tự động đếm số lần đăng nhập sai. Đạt ngưỡng 5 lần $\rightarrow$ Khóa tài khoản (`isActive = false`) và sinh bản ghi AuditLog cảnh báo.
3. **Chống SQL Injection:** Sử dụng Prisma ORM biên dịch câu truy vấn có tham số (Parameterized Queries); tuyệt đối không ghép chuỗi SQL thô.
4. **Chống XSS:** React tự động encode dữ liệu khi render; Zod schema kiểm tra kiểu và độ dài chuỗi đầu vào.
5. **Security Headers:** Thư viện `helmet` tự động thiết lập các tiêu đề HTTP chuẩn (X-Frame-Options, Content-Security-Policy, X-Content-Type-Options).
6. **Kiểm soát Tần suất:** `express-rate-limit` giới hạn tối đa 200 requests / 15 phút trên mỗi IP.
7. **Sao lưu an toàn:** Sử dụng `VACUUM INTO` để tạo snapshot cơ sở dữ liệu nguyên tử mà không gây khóa hoặc gián đoạn hoạt động của SQLite.
8. **Mã băm SHA-256:** Mỗi bản sao lưu được lưu trữ kèm mã băm SHA-256; trước khi khôi phục, hệ thống tự động băm lại file để phát hiện giả mạo.
