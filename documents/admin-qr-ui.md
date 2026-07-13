# TKH 2026 — ADMIN QR KẾT ƯỚC UI DESIGN

Version: 1.0  
Status: Approved Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

Trang Admin QR Kết Ước cho phép BTC:

- Bật hoặc đóng hoạt động Kết Ước.
- Theo dõi tiến độ học viên.
- Kiểm tra học viên đã nhận QR nào.
- Tìm kiếm và lọc dữ liệu.
- Xem Thẻ Kết Ước.
- Reset quyền quét trong trường hợp đặc biệt.
- Download dữ liệu để lưu trữ.

---

# 2. Menu Admin

Tên menu:

Quản lý QR Kết Ước

Vị trí đề xuất:

- Tổng quan Admin.
- Quản lý thành viên.
- Quản lý nhóm.
- Quản lý điểm danh.
- Quản lý buổi học.
- Quản lý điểm số.
- Bible Challenge.
- Quản lý bài kiểm tra.
- Quản lý QR Kết Ước.
- Kho tài liệu.
- Câu hỏi học viên.
- Thống kê khích lệ.

---

# 3. Header trang

Tiêu đề:

Quản lý QR Kết Ước

Mô tả:

“Bật hoặc đóng hoạt động Kết Ước và theo dõi kết quả của học viên.”

---

# 4. Card thống kê

Hiển thị bốn card:

## Card 1

Tổng học viên

## Card 2

Đã nhận Kết Ước

## Card 3

Chưa nhận Kết Ước

## Card 4

Tỷ lệ hoàn thành

Ví dụ:

135 / 180 học viên  
75%

---

# 5. Quản lý trạng thái Module

Hiển thị trạng thái hiện tại:

- DISABLED.
- ENABLED.
- CLOSED.

Nút thao tác:

- Bật hoạt động.
- Đóng hoạt động.
- Tạm ẩn hoạt động.

Quy tắc:

- DISABLED: menu học viên bị ẩn.
- ENABLED: cho phép học viên chưa nhận quét QR.
- CLOSED: không nhận lượt quét mới.

Khi đổi trạng thái cần popup xác nhận.

---

# 6. Popup bật hoạt động

Tiêu đề:

Bật hoạt động Kết Ước

Nội dung:

“Khi bật, menu Kết Ước sẽ xuất hiện trên tài khoản học viên và học viên chưa nhận sẽ được phép quét QR.”

Nút:

- Hủy.
- Xác nhận bật.

---

# 7. Popup đóng hoạt động

Tiêu đề:

Đóng hoạt động Kết Ước

Nội dung:

“Sau khi đóng, hệ thống sẽ không tiếp nhận lượt quét mới. Những học viên đã nhận vẫn có thể xem lại Thẻ Kết Ước.”

Nút:

- Hủy.
- Xác nhận đóng.

---

# 8. Khu vực kiểm tra năm QR

Hiển thị năm card:

- QR01.
- QR02.
- QR03.
- QR04.
- QR05.

Mỗi card hiển thị:

- Mã QR.
- Trạng thái hoạt động.
- Một phần nội dung thông điệp.
- Câu gốc Kinh Thánh.
- Số học viên đã nhận.
- Nút xem nội dung đầy đủ.

Không cho sửa nội dung tùy tiện trong khi hoạt động đang ENABLED nếu chưa có cảnh báo xác nhận.

---

# 9. Bộ lọc

Trang có các bộ lọc:

## Ô tìm kiếm

Tìm theo:

- Tên học viên.
- Mã TKH.

## Dropdown nhóm

- Tất cả nhóm.
- Danh sách các nhóm hiện có.

## Dropdown trạng thái

- Tất cả.
- Đã nhận.
- Chưa nhận.
- Đã reset.

## Dropdown mã QR

- Tất cả QR.
- QR01.
- QR02.
- QR03.
- QR04.
- QR05.

Hiển thị kết quả:

“Đang hiển thị X / Y học viên.”

---

# 10. Bảng học viên

Các cột:

1. Mã TKH.
2. Họ và tên.
3. Nhóm.
4. Trạng thái.
5. Mã QR.
6. Thời gian nhận.
7. Thao tác.

Trạng thái đề xuất:

- Chưa nhận.
- Đã nhận.
- Đã reset.

Màu sắc:

- Đã nhận: xanh lá.
- Chưa nhận: xám.
- Đã reset: vàng hoặc cam.

---

# 11. Thao tác từng học viên

## Học viên đã nhận

Có nút:

- Xem Thẻ.
- Reset.

## Học viên chưa nhận

Hiển thị:

“Chưa có dữ liệu.”

Không có nút Reset.

## Học viên đã reset

Hiển thị:

- Trạng thái đã reset.
- Có thể xem lịch sử cũ.
- Được phép quét lại khi Module ENABLED.

---

# 12. Popup xem Thẻ Kết Ước

Admin được xem:

- Họ tên học viên.
- Nhóm.
- Mã QR.
- Thông điệp hoàn chỉnh.
- Câu gốc Kinh Thánh.
- Ngày giờ nhận.

Popup chỉ dùng để xem.

Không chỉnh sửa nội dung trực tiếp.

---

# 13. Popup Reset

Tiêu đề:

Reset Kết Ước

Hiển thị:

- Họ tên học viên.
- Mã TKH.
- Mã QR đã nhận.
- Thời gian nhận.

Có ô bắt buộc:

Lý do reset

Placeholder:

“Nhập lý do reset Kết Ước của học viên...”

Nút:

- Hủy.
- Xác nhận Reset.

Không cho xác nhận nếu chưa nhập lý do.

---

# 14. Sau khi Reset

Hệ thống phải:

1. Đánh dấu bản ghi cũ là đã reset.
2. Ghi nhận Admin thực hiện.
3. Ghi thời gian reset.
4. Ghi lý do reset.
5. Ẩn card cũ khỏi hồ sơ học viên.
6. Cho phép học viên quét lại khi Module đang ENABLED.
7. Không xóa vĩnh viễn lịch sử cũ.

---

# 15. Download dữ liệu

Có nút:

Download danh sách Kết Ước

File Excel đề xuất gồm hai sheet.

## Sheet 1 — Kết quả

Các cột:

- Mã TKH.
- Họ và tên.
- Nhóm.
- Trạng thái.
- Mã QR.
- Thời gian nhận.
- Nội dung hoàn chỉnh.
- Câu gốc Kinh Thánh.

## Sheet 2 — Audit Reset

Các cột:

- Mã TKH.
- Họ và tên.
- Mã QR cũ.
- Admin thực hiện.
- Thời gian reset.
- Lý do reset.

Tên file đề xuất:

TKH2026_QR_Ket-Uoc_YYYYMMDD.xlsx

---

# 16. Quyền truy cập

Chỉ tài khoản Admin được:

- Mở trang quản lý QR.
- Đổi trạng thái Module.
- Xem toàn bộ kết quả.
- Xem nội dung hoàn chỉnh.
- Reset Kết Ước.
- Download dữ liệu.

Học viên không được truy cập trang Admin bằng URL trực tiếp.