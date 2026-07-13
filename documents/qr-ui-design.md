# TKH 2026 — QR KẾT ƯỚC UI/UX DESIGN

Version: 1.0  
Status: Approved Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu giao diện

Giao diện QR Kết Ước cần:

- Dễ sử dụng trên điện thoại.
- Thao tác quét đơn giản.
- Không gây nhầm lẫn cho học viên.
- Tạo cảm giác trang trọng sau khi quét thành công.
- Hiển thị rõ thông điệp và câu gốc Kinh Thánh.
- Không cho học viên quét thêm QR sau khi đã nhận Kết Ước.

---

# 2. Menu học viên

Tên menu:

🌿 Kết Ước

Vị trí đề xuất trong sidebar:

1. Tổng quan
2. Điểm danh
3. Lịch học
4. Kiểm tra
5. Điểm cá nhân
6. Điểm nhóm
7. Kết Ước
8. Hộp thư khích lệ
9. Câu hỏi buổi học
10. Kho tài liệu
11. Đổi mật khẩu

Menu Kết Ước chỉ xuất hiện theo trạng thái do Admin quản lý.

---

# 3. Quy tắc hiển thị menu

## 3.1 Module DISABLED

- Ẩn hoàn toàn menu “Kết Ước”.
- Học viên không thấy chức năng này.
- Nếu học viên truy cập trực tiếp URL, hệ thống từ chối truy cập.

Thông báo:

“Hoạt động Kết Ước hiện chưa được BTC mở.”

---

## 3.2 Module ENABLED

### Học viên chưa nhận Kết Ước

- Hiển thị menu.
- Cho phép mở màn hình quét QR.

### Học viên đã nhận Kết Ước

- Hiển thị menu.
- Không mở camera.
- Hiển thị trực tiếp Thẻ Kết Ước đã nhận.

---

## 3.3 Module CLOSED

### Học viên đã nhận Kết Ước

- Menu vẫn xuất hiện.
- Học viên vẫn xem được Thẻ Kết Ước.

### Học viên chưa nhận Kết Ước

- Menu có thể tiếp tục xuất hiện.
- Không cho phép mở camera.
- Hiển thị thông báo:

“Hoạt động Kết Ước đã kết thúc.”

---

# 4. Màn hình giới thiệu

Tên màn hình:

QR Kết Ước

Điều kiện hiển thị:

- Module đang ENABLED.
- Học viên chưa từng nhận Kết Ước.

Nội dung đề xuất:

## Tiêu đề

🌿 Kết Ước TKH 2026

## Mô tả

“Hãy quét một trong những mã QR do BTC chuẩn bị để nhận thông điệp Kết Ước dành riêng cho bạn.”

## Ghi chú

“Mỗi học viên chỉ được nhận một Kết Ước trong suốt chương trình.”

## Nút chính

Bắt đầu quét QR

## Nút phụ

Hướng dẫn quét QR

---

# 5. Màn hình quét QR

Màn hình quét được tối ưu cho điện thoại.

Các thành phần:

- Camera chiếm phần lớn màn hình.
- Khung định vị QR ở giữa.
- Hướng dẫn ngắn phía trên hoặc phía dưới.
- Nút quay lại.
- Nút bật lại camera nếu camera bị gián đoạn.

Nội dung hướng dẫn:

“Đưa mã QR vào giữa khung và giữ thiết bị ổn định.”

Không hiển thị:

- Danh sách năm QR.
- Nội dung thông điệp của các QR.
- Nút cho phép học viên tự chọn QR bằng tay.

---

# 6. Trạng thái đang xác nhận

Sau khi camera đọc được QR:

1. Tạm dừng camera.
2. Hiển thị lớp phủ loading.
3. Gửi mã QR lên Backend.
4. Không cho học viên tiếp tục thao tác trong lúc chờ.

Nội dung:

“Đang xác nhận Kết Ước của bạn...”

Có thể sử dụng:

- Spinner.
- Hiệu ứng nhấp nhẹ.
- Nền mờ phía sau.

---

# 7. Quét thành công

Sau khi Backend xác nhận thành công:

1. Hiển thị dấu xác nhận.
2. Hiển thị thông báo:

“Đã ghi nhận Kết Ước của bạn.”

3. Chuyển cảnh nhẹ bằng hiệu ứng fade.
4. Thẻ Kết Ước xuất hiện bằng hiệu ứng slide-up.
5. Khu vực camera bị đóng.
6. Học viên không thể quét thêm mã khác.

Hiệu ứng không được quá dài.

Thời gian đề xuất:

- Xác nhận thành công: khoảng 1 giây.
- Card xuất hiện ngay sau đó.

---

# 8. Thẻ Kết Ước

Thẻ Kết Ước được tạo bằng HTML/CSS.

Không sử dụng ảnh cố định.

## Nội dung card

### Phần đầu

KẾT ƯỚC  
THÁNH KINH HÈ 2026

### Họ tên học viên

Ví dụ:

Ngô Tấn Phát

### Thông điệp

Hiển thị nội dung đã thay:

{{memberName}}

bằng họ tên học viên.

### Câu gốc Kinh Thánh

Hiển thị nguyên văn nội dung BTC cung cấp.

### Thông tin nhận

- Ngày nhận.
- Giờ nhận.
- Mã QR đã nhận.

Ví dụ:

Đã nhận lúc 08:42 · 21/07/2026  
Mã Kết Ước: QR03

---

# 9. Yêu cầu thiết kế Thẻ Kết Ước

Card phải:

- Trang trọng.
- Dễ đọc trên điện thoại.
- Không dùng font quá cách điệu gây lỗi tiếng Việt.
- Không làm vỡ dấu tiếng Việt.
- Có khoảng trắng phù hợp.
- Responsive theo chiều rộng màn hình.
- Không cho học viên chỉnh sửa.
- Không có nút xóa.
- Không hiển thị nội dung kỹ thuật như Template ID hoặc Member ID.

Thiết kế đề xuất:

- Nền sáng hoặc kem nhạt.
- Viền nhẹ.
- Bo góc vừa phải.
- Điểm nhấn màu nâu đỏ, xanh lá hoặc màu theo concept TKH.
- Câu gốc có thể đặt trong một khung riêng.
- Họ tên học viên được làm nổi bật nhưng không quá lớn.

---

# 10. Nút trên Thẻ Kết Ước

Phiên bản đầu tiên có:

- Về hồ sơ.
- Về trang tổng quan.

Chưa thực hiện trong phiên bản đầu:

- Tải thành ảnh.
- Tải PDF.
- Chia sẻ mạng xã hội.

Các chức năng tải ảnh hoặc PDF có thể bổ sung sau chương trình.

---

# 11. Hiển thị trong hồ sơ học viên

Thẻ Kết Ước không nằm trong danh sách lời khích lệ thông thường.

Trong hồ sơ học viên, thứ tự nội dung đề xuất:

1. Thông tin học viên.
2. Thẻ Kết Ước.
3. Hộp thư khích lệ.
4. Các thông tin cá nhân khác nếu có.

Nếu chưa nhận Kết Ước:

- Không hiển thị card.
- Không hiển thị khung trống.

Nếu đã nhận Kết Ước:

- Hiển thị Thẻ Kết Ước.
- Ghim cố định phía trên Hộp thư khích lệ.
- Không tính card này vào tổng số lời khích lệ.

---

# 12. Học viên mở lại menu

Nếu học viên đã nhận Kết Ước:

1. Không mở camera.
2. Không hiển thị nút “Bắt đầu quét”.
3. Hiển thị trực tiếp Thẻ Kết Ước.
4. Hiển thị ghi chú:

“Bạn đã hoàn thành hoạt động Kết Ước.”

---

# 13. Các trạng thái lỗi

## 13.1 QR không hợp lệ

Thông báo:

“Mã QR không hợp lệ. Vui lòng quét mã do BTC cung cấp.”

Nút:

Quét lại

---

## 13.2 QR không hoạt động

Thông báo:

“Mã QR này hiện không được sử dụng. Vui lòng liên hệ BTC.”

---

## 13.3 Học viên đã nhận Kết Ước

Thông báo:

“Bạn đã hoàn thành Kết Ước.”

Sau đó hiển thị Thẻ Kết Ước hiện tại.

---

## 13.4 Module chưa mở

Thông báo:

“Hoạt động Kết Ước hiện chưa được BTC mở.”

---

## 13.5 Module đã đóng

Thông báo:

“Hoạt động Kết Ước đã kết thúc.”

---

## 13.6 Không có Internet

Thông báo:

“Không thể kết nối tới hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.”

---

## 13.7 Server lỗi

Thông báo:

“Hệ thống đang bận. Vui lòng thử lại sau hoặc liên hệ BTC.”

---

## 13.8 Không truy cập được camera

Thông báo:

“Không thể truy cập camera. Vui lòng cho phép trình duyệt sử dụng camera và thử lại.”

Nút:

- Xem hướng dẫn.
- Thử lại.

---

# 14. Quy tắc thao tác

- Không xử lý kết quả chỉ bằng Frontend.
- Không lưu Kết Ước vào hồ sơ trước khi Backend xác nhận.
- Không cho quét liên tiếp nhiều lần.
- Khi đang xác nhận, khóa nút và camera.
- Nếu yêu cầu thất bại, mới cho phép quét lại.
- Nếu yêu cầu thành công, đóng camera hoàn toàn.