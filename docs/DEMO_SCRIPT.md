# KỊCH BẢN BÁO CÁO & DEMO ĐỒ ÁN TỐT NGHIỆP
## Dự án: SecureWeb – Secure IT Asset Management & Monitoring System
## Khung tham chiếu: NIST Cybersecurity Framework 1.1

> **Thời lượng báo cáo đề xuất:** 12 – 15 phút  
> **Người thực hiện:** Sinh viên thực hiện đồ án  
> **Tài khoản Demo:** `admin@gmail.com` / `Admin@123`

---

## PHẦN 1: MỞ ĐẦU & TỔNG QUAN KIẾN TRÚC (2 phút)

**Lời dẫn của sinh viên:**
> *"Kính thưa quý Thầy/Cô trong Hội đồng chấm đồ án, em xin phép trình bày đề tài **SecureWeb – Nền tảng quản lý tài sản CNTT và giám sát an toàn thông tin tập trung**. Đồ án được thiết kế dựa trên 5 trụ cột cốt lõi của Khung An toàn thông tin mạng **NIST CSF 1.1** bao gồm: **IDENTIFY, PROTECT, DETECT, RESPOND và RECOVER**. Hệ thống được xây dựng theo kiến trúc Client-Server với React, Node.js/Express, Prisma ORM và CSDL SQLite an toàn, đảm bảo chạy ổn định trong môi trường cục bộ mà không đòi hỏi hạ tầng phức tạp."*

---

## PHẦN 2: DEMO CÁC CHỨC NĂNG THEO NIST CSF 1.1 (10 phút)

### Chặng 1: TRỤ CỘT 1 – IDENTIFY (Nhận diện tài sản & Đánh giá rủi ro) (2.5 phút)
1. **Quản lý Tài sản CNTT (ID.AM):**
   - Đăng nhập hệ thống $\rightarrow$ Mở menu **"Quản lý tài sản (Asset)"**.
   - *Thao tác:* Giới thiệu danh sách tài sản (Máy chủ, Firewall, Máy trạm). Mở modal **"+ Thêm tài sản mới"** hoặc lọc tài sản theo mức độ quan trọng `Critical`.
   - *Điểm nhấn kỹ thuật:* Toàn bộ dữ liệu được liên kết khóa ngoại với các lỗ hổng và rủi ro.

2. **Quản lý Lỗ hổng & Nhập Báo cáo Quét (ID.RA-1):**
   - Vào menu **"Quản lý lỗ hổng (Vuln)"**.
   - *Thao tác:* Bấm **"Nhập kết quả quét"** $\rightarrow$ Chọn công cụ **OWASP ZAP** hoặc **Nmap** $\rightarrow$ Bấm **"⚡ Tải dữ liệu mẫu ZAP"** $\rightarrow$ Xác nhận nhập.
   - *Giải thích:* Báo cáo quét ngoài được chuyển hóa thành các bản ghi lỗ hổng có mã CVE và điểm CVSS 3.1. Đặc biệt, nếu lỗ hổng là **Critical (CVSS 9.0+)**, hệ thống sẽ tự động kích hoạt tạo cảnh báo tức thì.

3. **Ma trận Rủi ro 3x3 (ID.RA-5):**
   - Vào menu **"Đánh giá rủi ro (Risk)"**.
   - *Thao tác:* Chỉ vào bảng **Ma trận nhiệt $3 \times 3$**. Mở form tạo rủi ro mới: Khi chọn Khả năng xảy ra (*High*) và Mức độ ảnh hưởng (*High*), hệ thống tự động tính toán ra mức rủi ro **CRITICAL** màu đỏ.

---

### Chặng 2: TRỤ CỘT 2 – PROTECT (Bảo vệ & Kiểm soát truy cập) (2 phút)
1. **Kiểm soát Phân quyền RBAC:**
   - *Giải thích:* Hệ thống phân quyền chặt chẽ 4 vai trò: `Admin`, `Security Analyst`, `IT Manager`, `User`.
   - *Demo:* Đăng nhập bằng tài khoản `tester@gmail.com` (Role: User) $\rightarrow$ Các menu nhạy cảm như *Nhật ký kiểm toán*, *Sao lưu*, *Tích hợp* hoàn toàn bị ẩn ở giao diện và bị chặn với mã HTTP 403 ở backend API.

2. **Cơ chế Chống Brute-force & Khóa Tài khoản:**
   - *Demo:* Tại màn hình Đăng nhập, nhập sai mật khẩu 5 lần liên tiếp.
   - *Kết quả:* Tài khoản bị tự động khóa (`isActive = false`), API trả về HTTP 403 Forbidden và sự kiện được ghi ngay lập tức vào bảng `AuditLog`.

---

### Chặng 3: TRỤ CỘT 3 – DETECT (Phát hiện & Giám sát an ninh) (2 phút)
1. **Cảnh báo An ninh (DE.CM):**
   - Vào menu **"Cảnh báo an ninh (Alerts)"**.
   - *Thao tác:* Giới thiệu cảnh báo lỗ hổng Critical Log4Shell được sinh tự động. Nhấn nút **"✓ Xác nhận"** (Acknowledge).

2. **Mô phỏng Sự kiện từ Công cụ Tích hợp:**
   - Vào menu **"Tích hợp bảo mật"** $\rightarrow$ Tại thẻ **Wazuh SIEM**, nhấn **"⚡ Mô phỏng sự kiện"** $\rightarrow$ Chọn `Brute-force Attack` $\rightarrow$ Nhấn **"Thực thi mô phỏng"**.
   - *Kết quả:* Sự kiện `SecurityEvent` và cảnh báo mới lập tức xuất hiện trên hệ thống.

---

### Chặng 4: TRỤ CỘT 4 – RESPOND (Ứng phó & Xử lý sự cố) (2 phút)
1. **Quản lý Sự cố (RS.RP):**
   - Vào menu **"Quản lý sự cố (Incident)"**.
   - *Thao tác:* Nhấp chọn sự cố SSH Brute-force để mở khung chi tiết bên phải.
   - *Hành động phản ứng nhanh:* Nhấn **"🔒 Cô lập tài sản"** hoặc **"🚫 Chặn IP"** $\rightarrow$ Nhập lý do $\rightarrow$ Xác nhận.
   - *Kết quả:* Trạng thái tài sản tự động chuyển sang `offline`, lịch sử hành động ghi nhận vào dòng thời gian (Timeline) của sự cố.

---

### Chặng 5: TRỤ CỘT 5 – RECOVER (Sao lưu & Khôi phục dữ liệu) (2 phút)
1. **Snapshot SQLite Nguyên tử & Băm SHA-256 (RC.IM):**
   - Vào menu **"Sao lưu & Phục hồi"**.
   - *Thao tác:* Bấm **"+ Tạo bản sao lưu mới"** $\rightarrow$ Nhập tên $\rightarrow$ Hệ thống tạo snapshot bằng lệnh SQLite `VACUUM INTO` và tính toán mã băm SHA-256.

2. **Kiểm tra Tính toàn vẹn (Integrity Check) & Khôi phục:**
   - *Thao tác:* Bấm nút **"🔍 Kiểm tra"** tại bản sao lưu $\rightarrow$ Hiển thị popup đối chiếu SHA-256 xác nhận file nguyên vẹn không bị giả mạo.
   - Nhấn **"🔄 Khôi phục"** $\rightarrow$ Xem lịch sử khôi phục được lưu trữ tại tab *Lịch sử khôi phục*.

---

### Chặng 6: TỔNG KẾT & XUẤT BÁO CÁO (NIST CSF COMPLIANCE) (1.5 phút)
1. Mở menu **"Báo cáo & Tuân thủ"** (Executive Report).
2. Trình diễn **Chỉ số An toàn Hệ thống (Security Posture Score)**: Điểm số tổng hợp từ các rủi ro, lỗ hổng và tình trạng sao lưu.
3. Trình diễn bảng đối chiếu tuân thủ 5 trụ cột NIST CSF 1.1 với tỷ lệ đạt 100%.
4. Bấm **"Xuất CSV"** hoặc **"🖨️ In / Xuất PDF"** để xuất bản báo cáo executive summary đồ án.

---

## PHẦN 3: KẾT LUẬN & TRẢ LỜI CÂU HỎI HỘI ĐỒNG (2 phút)

**Lời kết của sinh viên:**
> *"Kính thưa quý Thầy/Cô, hệ thống **SecureWeb** đã hoàn thành trọn vẹn cả 5 giai đoạn phát triển theo đúng chuẩn NIST Cybersecurity Framework 1.1, đáp ứng toàn diện từ nhận diện tài sản, bảo vệ danh tính, phát hiện mối đe dọa, xử lý sự cố cho đến sao lưu phục hồi dữ liệu. Em xin chân thành cảm ơn quý Thầy/Cô và rất mong nhận được những nhận xét, đóng góp quý báu!"*
