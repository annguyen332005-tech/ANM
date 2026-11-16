# Wazuh 4.14.10 → SecureWeb (nhận cảnh báo thật)

Môi trường được cung cấp:

- Ubuntu / Wazuh Manager: `192.168.146.135`.
- MSI / SecureWeb backend: `192.168.146.1:4000`.
- Webhook: `http://192.168.146.1:4000/api/webhooks/wazuh`.
- Windows 11: cài **Agent**, không phải Manager; phải thấy Agent ở trạng thái **Active** trên Wazuh Dashboard.

## 1. Trên MSI: chuẩn bị backend

Khóa ngẫu nhiên đã được tạo trong `server/.env`: `WAZUH_WEBHOOK_KEY`. Chỉ sao chép giá trị bên trong dấu ngoặc kép; không dùng mật khẩu Wazuh Dashboard hay token đăng nhập SecureWeb. Không commit hoặc gửi khóa cho người khác.

Sau khi dừng backend cũ, chạy:

```powershell
cd D:\BTANM\server
npx prisma db push
npm run dev
```

Đăng nhập Admin/Security Analyst → **Tích hợp bảo mật** → **Wazuh — Nhận cảnh báo thật** → **Bật bộ nhận Wazuh** (nếu chưa bật). Bật bộ nhận chỉ tạo cấu hình; chưa chứng minh Ubuntu đã gửi được dữ liệu.

## 2. Trên Ubuntu: kiểm tra đường mạng

```bash
curl --connect-timeout 5 http://192.168.146.1:4000/api/health
```

Kết quả cần có `"ok": true`. Nếu timeout: kiểm tra IP, mạng máy ảo và Windows Firewall. Ping không bắt buộc; cần kết nối TCP 4000 từ Ubuntu sang MSI.

Nếu cần mở firewall, chạy PowerShell **Administrator trên MSI** (chỉ cho IP Ubuntu, profile mạng Private):

```powershell
New-NetFirewallRule -DisplayName "SecureWeb Wazuh from Ubuntu" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4000 -RemoteAddress 192.168.146.135 -Profile Private
```

Quy tắc chỉ có tác dụng trên adapter được đặt đúng profile Private. Không tắt toàn bộ firewall. HTTP chỉ dùng trong lab tin cậy; dùng HTTPS và chứng chỉ hợp lệ nếu đi qua mạng khác.

## 3. Chép connector sang Ubuntu

File `custom-secureweb` nằm cùng thư mục README này. Có thể tải bằng nút **Tải script cho Ubuntu** trên web, hoặc dùng scp từ MSI nếu Ubuntu đã bật SSH:

```powershell
cd D:\BTANM
scp server/integrations/wazuh/custom-secureweb USER_UBUNTU@192.168.146.135:/tmp/custom-secureweb
```

Thay `USER_UBUNTU` bằng tài khoản Ubuntu. Nếu chưa có SSH, dùng thư mục chia sẻ để chép file vào `/tmp/custom-secureweb`.

Trên Ubuntu:

```bash
sudo install -o root -g wazuh -m 750 /tmp/custom-secureweb /var/ossec/integrations/custom-secureweb
```

Script chỉ cần `/usr/bin/python3` và thư viện chuẩn; không cần pip. Nếu file bị Windows chuyển thành CRLF, chuẩn hóa trên Ubuntu:

```bash
sudo sed -i 's/\r$//' /var/ossec/integrations/custom-secureweb
```

## 4. Khai báo custom integration trên Manager

Sao lưu trước khi sửa, không chép đè toàn bộ cấu hình:

```bash
sudo cp -p /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.before-secureweb
sudo nano /var/ossec/etc/ossec.conf
```

Thêm block sau **bên trong `<ossec_config>`**, trước `</ossec_config>`. Không thêm trùng nếu đã có block `custom-secureweb`. Thay khóa mẫu bằng giá trị `WAZUH_WEBHOOK_KEY` từ MSI:

```xml
<integration>
  <name>custom-secureweb</name>
  <hook_url>http://192.168.146.1:4000/api/webhooks/wazuh</hook_url>
  <api_key>THAY_BANG_WAZUH_WEBHOOK_KEY_TRONG_SERVER_ENV</api_key>
  <level>5</level>
  <alert_format>json</alert_format>
</integration>
```

Sau đó:

```bash
sudo systemctl restart wazuh-manager
sudo systemctl status wazuh-manager --no-pager
sudo tail -n 50 /var/ossec/logs/ossec.log
```

Nếu Manager khởi động lỗi, đọc log và sửa cấu hình vừa thêm trước khi tiếp tục. Block `<level>5</level>` chuyển tiếp cảnh báo level ≥ 5; không chuyển tất cả log Windows hoặc tự đọc toàn bộ cảnh báo cũ.

## 5. Kiểm thử gửi một cảnh báo có thật từ Manager

Lệnh sau lấy bản ghi JSON gần nhất đã tồn tại trong `alerts.json`. Đây là phát lại một cảnh báo, chưa phải bằng chứng phát hiện sự kiện mới end-to-end:

```bash
sudo tail -n 1 /var/ossec/logs/alerts/alerts.json | sudo tee /tmp/secureweb-wazuh-alert.json >/dev/null
sudo python3 -m json.tool /tmp/secureweb-wazuh-alert.json >/dev/null
```

Nhập khóa vào biến tạm, không gõ khóa trực tiếp trong lịch sử lệnh:

```bash
read -rsp "WAZUH_WEBHOOK_KEY: " SECUREWEB_KEY; echo
sudo /var/ossec/integrations/custom-secureweb /tmp/secureweb-wazuh-alert.json "$SECUREWEB_KEY" http://192.168.146.1:4000/api/webhooks/wazuh
unset SECUREWEB_KEY
```

Nếu file log đang rỗng, chờ cảnh báo thật xuất hiện; không nhập JSON giả và coi đó là cảnh báo thật. Khóa được Wazuh Integrator truyền qua tham số theo giao diện chính thức, vì vậy quản trị viên cục bộ có thể xem tham số tiến trình; giới hạn quyền quản trị và quyền đọc ossec.conf.

Kết quả script cần là `SecureWeb: alert delivered`. Mở **Tích hợp bảo mật** để xem số bản tin nhận, Agent, Rule ID và thời gian. Sang **Cảnh báo an ninh**, tìm tiêu đề `[Wazuh] ...`; trang tự cập nhật mỗi 15 giây khi đang mở. Phát lại cùng manager.name + alert.id trả thành công nhưng không tạo thêm cảnh báo.

## 6. Kiểm chứng end-to-end từ Windows

Chọn một sự kiện lab có quy tắc Wazuh đang bật (ví dụ thay đổi file trong thư mục đã cấu hình FIM). Đối chiếu lần lượt: sự kiện mới trên Win11 → Rule/Agent xuất hiện trong Dashboard → cùng ID xuất hiện trên SecureWeb. Nếu cảnh báo có level < 5, nó không được gửi theo block mặc định. Kiểm tra rule thực tế trước khi chọn kịch bản; không giả định mọi lần đăng nhập sai đều tạo một rule nhất định.

## Dữ liệu, bảo mật và giới hạn

- Webhook dùng `X-Wazuh-Key`; không yêu cầu JWT người dùng. Thiếu/sai key bị từ chối; chưa có key backend trả 503.
- Alert, SecurityEvent, bản nhận và trạng thái tích hợp được lưu cùng transaction. Payload gốc lưu trong WazuhReceipt; không tự sửa tài sản hoặc chặn IP.
- Khóa chống trùng: `manager.name + id` của alert; yêu cầu các Manager độc lập có tên khác nhau. Không xóa receipt nếu cần giữ khả năng chống trùng lâu dài.
- Mức web là ánh xạ nội bộ: 0–4 Low, 5–7 Medium, 8–11 High, 12–15 Critical; không phải CVSS hoặc ánh xạ chính thức của Wazuh.
- Agent IP trùng Asset IP thì liên kết tài sản; thiếu/trùng IP không đảm bảo xác định đúng tài sản. Có thể xem Agent trong mô tả cảnh báo.
- Tối đa 120 request/phút/IP, body 1 MB. Script timeout 10 giây/lần, thử lại 3 lần cho lỗi mạng, 429 và 5xx; không có hàng đợi bền vững sau khi thử hết. Khi mất kết nối kéo dài cần phát lại từ alerts.json, dựa vào cơ chế chống trùng.
- Thời điểm nguồn và thời điểm nhận được lưu riêng. “Đã nhận” không đồng nghĩa Manager hiện luôn online.
- Script cố định URL, không đi theo redirect để tránh chuyển khóa tới host khác.

Nguồn chính thức cho Wazuh 4.x Integrator: https://documentation.wazuh.com/current/user-manual/manager/integration-with-external-apis.html

## Kiểm thử phần nhận trong dự án

```powershell
cd D:\BTANM\server
node --test tests/wazuh-webhook.test.js
python -m unittest discover -s tests -p "test_wazuh_connector.py"
```

Test webhook dùng database tạm; test connector dùng HTTP server localhost. Không gửi dữ liệu tới Ubuntu và không dùng khóa thật.
