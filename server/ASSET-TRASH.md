# Khôi phục tài sản bằng thùng rác

Từ phiên bản này, nút xóa trong Quản lý tài sản đặt `deletedAt` / `deletedBy`, không xóa bản ghi ngay. Tài sản biến mất khỏi danh sách, bộ chọn và thống kê tài sản đang quản lý. Dữ liệu lỗ hổng, rủi ro, cảnh báo và sự cố liên kết vẫn được giữ, không thay đổi trạng thái xử lý của chúng.

Trong **Sao lưu & Phục hồi → Thùng rác tài sản**, Admin có thể khôi phục về đúng ID, mã tài sản, trạng thái và quan hệ ban đầu. IT Manager chỉ xem thùng rác. Mã tài sản trong thùng rác vẫn được giữ độc quyền để tránh trùng khi phục hồi.

Xóa vĩnh viễn chỉ áp dụng cho tài sản đang trong thùng rác và phải nhập đúng mã xác nhận. Theo quan hệ Prisma: lỗ hổng/rủi ro bị xóa kèm; cảnh báo/sự cố vẫn tồn tại nhưng bỏ liên kết tài sản. AuditLog và lịch sử quét vẫn giữ. Backup cũ có thể còn chứa tài sản; xóa vĩnh viễn ở đây không phải xóa khỏi mọi bản sao đã tạo.

Không được chuyển vào thùng rác hoặc xóa vĩnh viễn khi có tác vụ quét Nmap đang queued/running. Không tạo phát hiện/rủi ro mới hoặc chạy Nmap cho tài sản trong thùng rác.

Các tài sản đã bị xóa cứng trước khi triển khai không tự xuất hiện lại. Chức năng khôi phục toàn bộ DB từ file backup vẫn là mô phỏng; thùng rác là chức năng khôi phục từng tài sản thật, không yêu cầu tạo backup trước khi xóa.

## Áp dụng cập nhật

Sau khi dừng backend cũ:

```powershell
cd D:\BTANM\server
npx prisma db push
npm run dev
```

## Test tự động (database tạm, không dùng dữ liệu thật)

```powershell
cd D:\BTANM\server
node --test tests/asset-trash.test.js
```

Kiểm tra toàn bộ vòng đời: tạo tài sản kèm quan hệ → chuyển vào thùng rác → biến mất khỏi danh sách/thống kê → phục hồi đúng bản ghi và quan hệ → xóa lần nữa → xác nhận mã → xóa vĩnh viễn → không phục hồi được. Có kiểm tra quyền API và chặn xóa trong lúc quét.

## Test trên giao diện

1. Đăng nhập Admin, tạo tài sản thử với mã riêng.
2. Xóa tài sản ở Quản lý tài sản; thông báo chuyển vào thùng rác.
3. Mở Sao lưu & Phục hồi → Thùng rác tài sản: tài sản phải có mặt.
4. Nhấn Khôi phục và xác nhận; quay lại Quản lý tài sản, tài sản phải xuất hiện.
5. Với dữ liệu thử có thể bỏ: xóa lần nữa, vào thùng rác → Xóa vĩnh viễn → nhập mã.
6. Kiểm tra tài sản không còn ở cả danh sách và thùng rác. Không thực hiện bước này trên tài sản thật cần giữ.
