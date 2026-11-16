# Quét Nmap từ giao diện

Backend chạy một tiến trình Node, sử dụng Nmap trên cùng máy. Trình duyệt có thể ở máy khác.

Trong `server/.env`, cấu hình đường dẫn executable (không phải thư mục):

```dotenv
NMAP_PATH="D:/nmap/nmap.exe"
# Tùy chọn: IP công khai đã được phép quét, phân cách bằng dấu phẩy.
NMAP_ALLOWED_TARGETS=""
```

Sau khi cập nhật mã:

```powershell
cd D:\BTANM\server
npx prisma db push
npm run dev
```

Mở Quản lý lỗ hổng → Quét Nmap ngay. Admin/Security Analyst chọn tài sản có IPv4 và tối đa 100 cổng TCP cụ thể. Backend chạy một tác vụ tại một thời điểm, tối đa 150 giây, lưu lịch sử trong bảng ScanJob. Các IP private và loopback được chấp nhận mặc định. Không nhận dải mạng, tên miền hoặc tham số dòng lệnh từ trình duyệt.

Giao diện cập nhật mỗi 5 giây. Phần trăm là tiến độ bước hiện tại do Nmap báo, không phải phần trăm toàn bộ tác vụ. Đóng hộp thoại không dừng quét. Backend khởi động lại đánh dấu tác vụ đang chạy là bị gián đoạn; không tự chạy lại.

Quét dùng TCP connect và nhận diện dịch vụ ở chế độ nhẹ. Mỗi cổng mở được lưu thành một phát hiện Info, không gán CVE/CVSS. Lần quét thành công lưu phát hiện và lịch sử trong cùng transaction. Quét lại tạo bộ phát hiện mới; không tự hợp nhất/xóa phát hiện cũ. Kết quả không có cổng mở vẫn được lưu vào lịch sử với 0 phát hiện.

Lịch sử hiển thị 30 lần gần nhất, có thể mở chi tiết và tải nhật ký TXT. Các lần cũ hơn vẫn được giữ trong cơ sở dữ liệu.

Kiểm thử (gồm quét localhost với một HTTP server tạm thời nếu tìm thấy D:/nmap/nmap.exe):

```powershell
node --test tests/nmap-scan.test.js
```
