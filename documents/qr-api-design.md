# TKH 2026 — QR KẾT ƯỚC API DESIGN

Version: 1.0  
Status: Approved Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

API QR Kết Ước cho phép:

- Học viên kiểm tra trạng thái Module.
- Học viên kiểm tra mình đã nhận Kết Ước hay chưa.
- Học viên gửi mã QR vừa quét để Backend xác nhận.
- Học viên xem lại Thẻ Kết Ước đã nhận.
- Admin bật, ẩn hoặc đóng Module.
- Admin xem thống kê và danh sách kết quả.
- Admin xem nội dung từng QR.
- Admin reset Kết Ước trong trường hợp đặc biệt.
- Admin tải dữ liệu phục vụ lưu trữ.

Nguyên tắc:

Frontend chỉ gửi yêu cầu.

Backend là nơi quyết định:

- Tài khoản có quyền hay không.
- Module có đang mở hay không.
- QR có hợp lệ hay không.
- Học viên đã quét trước đó hay chưa.
- Nội dung nào được lưu vào hồ sơ học viên.

# Xác định mùa hoạt động

Đối với API học viên:

- Frontend không gửi seasonId.
- Backend tự xác định mùa hiện tại.
- Backend kiểm tra học viên có Season Membership hợp lệ.
- Tất cả thao tác Scan và xem Card chỉ áp dụng trong mùa hiện tại.

Đối với API Admin:

- Nếu không truyền seasonId, Backend sử dụng mùa hiện tại.
- Trong tương lai Admin có thể truyền seasonId để xem dữ liệu lịch sử.

---

# 2. Base URL

Đề xuất:

```text
/api/covenants