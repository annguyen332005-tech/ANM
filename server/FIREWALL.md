# Chặn / gỡ ping Win11 → MSI bằng Windows Firewall

`BLOCK_IP` hiện tạo luật inbound ICMPv4 Echo Request (type 8), giới hạn đúng remote IP và `FIREWALL_LOCAL_IP`. TCP/web và luồng Wazuh không bị chặn. Đây không phải cô lập máy khỏi toàn bộ mạng. `QUARANTINE_ASSET` vẫn mô phỏng và được ghi rõ trên giao diện.

Chỉ Admin web được chặn/gỡ. Trong lab, backend phải được mở từ PowerShell **Run as administrator** trên máy MSI. Chạy backend thường sẽ trả lỗi quyền, không chuyển sự cố sang contained. Không tự bật UAC hoặc thay đổi firewall khi khởi động backend. Với vận hành thực tế cần tách helper có quyền quản trị ra khỏi tiến trình web.

```dotenv
FIREWALL_LOCAL_IP=192.168.146.1
FIREWALL_PROTECTED_IPS=192.168.146.135
```

MSI phải thực sự có IP cấu hình; IP Ubuntu Manager được bảo vệ để tránh chọn nhầm. Chỉ nhận một IP private; không nhận dải mạng/câu lệnh. Không sử dụng ghi chú làm tham số PowerShell. Script cố định chạy không qua shell, có timeout và kiểm tra lại luật trong ActiveStore. Nếu báo xác minh thất bại, kiểm tra trực tiếp firewall vì luật có thể đã được tạo.

## Chạy / kiểm thử thủ công

1. Dừng backend đang dùng port 4000 bằng Ctrl+C ở terminal cũ.
2. Mở Windows PowerShell bằng **Run as administrator**, chạy `cd D:\BTANM` rồi `npm run dev:server`.
3. Mở frontend bình thường, đăng nhập Admin.
4. Trên Win11 xác nhận IP bằng `ipconfig`, rồi `ping 192.168.146.1` trước khi chặn.
5. Mở sự cố → Chặn ping từ IP → nhập IP Win11 (ảnh hiện tại là 192.168.146.132) → xác nhận.
6. Chỉ khi nhật ký ghi đã tạo và xác minh luật mới thử ping lại. Ping phải không có Echo Reply từ MSI; việc này không chứng minh các giao thức khác bị chặn.
7. Bấm Gỡ chặn ping, nhập cùng IP; thử lại. Ping thành công lại nếu không có luật firewall khác chặn sẵn.

Luật gắn với cặp IP trên MSI, dùng chung cho mọi sự cố. Gỡ chặn từ một sự cố sẽ gỡ luật của cặp IP đó kể cả sự cố khác đã dùng. Không tự gỡ luật khi đóng/giải quyết sự cố. Có thể gỡ từ cả sự cố đã đóng.

Rule name ví dụ: `SecureWeb-Ping-192_168_146_1-From-192_168_146_132`. Script chỉ xóa đúng luật mang tên này thuộc nhóm SecureWeb, không xóa các luật khác. Gỡ tay trong PowerShell Administrator nếu cần:

```powershell
Remove-NetFirewallRule -Name 'SecureWeb-Ping-192_168_146_1-From-192_168_146_132'
```

Test tự động không thay đổi Windows Firewall thật: `node --test tests/firewall.test.js`. Test dùng executor giả cho nhánh thành công, lỗi quyền, đầu vào nguy hiểm và trường hợp không được ghi nhận thành công khi executor thất bại. Hiệu quả mạng thật cần kiểm chứng từ Win11 theo các bước trên.
