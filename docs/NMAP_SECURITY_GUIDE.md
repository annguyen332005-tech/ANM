# HƯỚNG DẪN QUÉT MẠNG & DỊCH VỤ VỚI NMAP
## Tích hợp Dữ liệu vào SecureWeb – NIST CSF ID.AM & ID.RA

Tài liệu này hướng dẫn cách sử dụng công cụ **Nmap (Network Mapper)** để thu thập thông tin tài sản CNTT, phát hiện dịch vụ mạng và tích hợp báo cáo vào nền tảng **SecureWeb**.

> [!WARNING]
> Chỉ thực hiện quét các máy chủ, thiết bị mạng hoặc dải địa chỉ IP trong phòng thí nghiệm (Lab) hoặc các hệ thống mà bạn được cấp quyền kiểm thử an ninh.

---

## 1. Mục tiêu Kỹ thuật
- Nhận diện các máy chủ đang hoạt động trong dải mạng nội bộ (Host Discovery).
- Dò tìm các cổng dịch vụ mở (Port Scanning) và phiên bản phần mềm (Service Version Detection).
- Nhận diện hệ điều hành (OS Detection).
- Quét lỗ hổng cơ bản bằng Nmap Scripting Engine (NSE `vuln`).
- Ánh xạ kết quả quét vào **SecureWeb**:
  - Tạo mới / Cập nhật thiết bị trong **Quản lý Tài sản (ID.AM)**.
  - Ghi nhận lỗ hổng phát hiện được vào **Quản lý Lỗ hổng (ID.RA)**.

---

## 2. Các Lệnh Nmap Tiêu chuẩn trong Phòng Lab

### Lệnh 1: Dò tìm thiết bị đang hoạt động (Host Discovery)
```bash
# Quét ping sweep dải mạng lab 192.168.10.0/24
nmap -sn 192.168.10.0/24
```
*Kết quả:* Danh sách IP đang phản hồi và địa chỉ MAC của từng thiết bị.

### Lệnh 2: Quét cổng và phiên bản dịch vụ (Service & OS Detection)
```bash
# Quét các cổng phổ biến, phát hiện phiên bản dịch vụ và hệ điều hành
nmap -sV -O -T4 192.168.10.21 -oN nmap_webserver_scan.txt
```
*Thông tin thu được:*
- Cổng `80/tcp` (HTTP) – Apache/2.4.52 (Ubuntu)
- Cổng `22/tcp` (SSH) – OpenSSH 8.9p1
- Cổng `3306/tcp` (MySQL) – MySQL 8.0.35
- Hệ điều hành: Linux 5.x kernel

### Lệnh 3: Quét lỗ hổng với bộ script NSE
```bash
# Quét script dò tìm lỗ hổng đã công bố (CVE)
nmap --script vuln 192.168.10.21 -oN nmap_vuln_report.txt
```

---

## 3. Quy trình Tích hợp Kết quả vào SecureWeb

1. **Bước 1 – Nhập Tài sản CNTT (ID.AM):**
   - Đăng nhập vào SecureWeb với tài khoản **Admin** hoặc **IT Manager**.
   - Vào menu **Quản lý tài sản (Asset)** $\rightarrow$ Bấm **+ Thêm tài sản mới**.
   - Nhập thông tin dựa trên kết quả Nmap:
     - Tên tài sản: `Web Server Production`
     - Loại tài sản: `Server`
     - IP Address: `192.168.10.21`
     - Hệ điều hành: `Ubuntu 22.04 LTS (Kernel 5.x)`
     - Mức độ quan trọng: `Critical`

2. **Bước 2 – Nhập Lỗ hổng (ID.RA):**
   - Vào menu **Quản lý lỗ hổng (Vuln)** $\rightarrow$ Bấm **Nhập kết quả quét**.
   - Chọn công cụ: **Nmap Script Scan**.
   - Bấm **"⚡ Tải dữ liệu mẫu Nmap"** (hoặc dán nội dung quét thực tế).
   - Hệ thống sẽ tự động bóc tách các dịch vụ lỗi thời, gán CVE và điểm CVSS, đồng thời liên kết trực tiếp với thiết bị `ASSET-002`.
