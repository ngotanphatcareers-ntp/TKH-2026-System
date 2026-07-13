# TKH 2026 — MODULE QR KẾT ƯỚC

Version: 1.0  
Status: Business Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

Module QR Kết Ước cho phép mỗi học viên quét đúng một trong năm mã QR do BTC chuẩn bị.

Sau khi quét thành công:

1. Hệ thống xác định học viên đang đăng nhập.
2. Hệ thống xác định mã QR được quét.
3. Hệ thống lấy thông điệp tương ứng với mã QR.
4. Hệ thống ghép tên học viên vào vị trí đã được BTC đánh dấu.
5. Hệ thống tạo Thẻ Kết Ước.
6. Thẻ được lưu và ghim vào hồ sơ học viên.
7. Học viên bị khóa quyền quét thêm QR khác.

---

# 2. Phạm vi TKH 2026

Có tổng cộng 5 mã QR:

- QR01
- QR02
- QR03
- QR04
- QR05

Mỗi QR chứa:

- Mã QR.
- Thông điệp khích lệ.
- Câu gốc Kinh Thánh.
- Trạng thái hoạt động.

Không sử dụng chủ đề riêng cho từng QR.

---

# 3. Trạng thái Module

Module có ba trạng thái:

## 3.1 DISABLED

- Menu “QR Kết Ước” bị ẩn khỏi toàn bộ tài khoản học viên.
- Học viên không thể mở màn hình quét QR.
- Đây là trạng thái mặc định trước khi BTC bắt đầu hoạt động Kết Ước.

## 3.2 ENABLED

- Menu “QR Kết Ước” xuất hiện trên tài khoản học viên.
- Học viên chưa nhận Kết Ước được phép quét QR.
- Học viên đã nhận Kết Ước chỉ được xem lại Thẻ Kết Ước.

## 3.3 CLOSED

- Không tiếp nhận lượt quét mới.
- Menu có thể tiếp tục hiển thị đối với học viên đã nhận Kết Ước.
- Học viên đã nhận vẫn xem được Thẻ Kết Ước trong hồ sơ.
- Học viên chưa nhận thấy thông báo chương trình Kết Ước đã kết thúc.

---

# 4. Luồng Admin

Admin thực hiện theo trình tự:

1. Đăng nhập tài khoản Admin.
2. Mở trang “Quản lý QR Kết Ước”.
3. Kiểm tra năm QR và nội dung đã cấu hình.
4. Chuyển trạng thái Module từ DISABLED sang ENABLED.
5. Menu QR xuất hiện trên tài khoản học viên.
6. Theo dõi danh sách học viên đã quét và chưa quét.
7. Khi hoạt động kết thúc, chuyển trạng thái sang CLOSED.

Admin có quyền:

- Bật Module.
- Đóng Module.
- Xem thống kê.
- Tìm kiếm học viên.
- Lọc theo nhóm.
- Xem mã QR học viên đã nhận.
- Xem thời gian quét.
- Reset Kết Ước của học viên trong trường hợp đặc biệt.
- Nhập lý do reset.

---

# 5. Luồng Học viên

Học viên thực hiện theo trình tự:

1. Đăng nhập tài khoản.
2. Thấy menu “QR Kết Ước” khi Admin mở Module.
3. Mở menu QR Kết Ước.
4. Hệ thống kiểm tra học viên đã nhận Kết Ước hay chưa.
5. Nếu chưa nhận, học viên được mở camera để quét.
6. Học viên quét một trong năm mã QR.
7. Hệ thống gửi mã QR lên Backend để kiểm tra.
8. Nếu hợp lệ, hệ thống ghép tên học viên vào thông điệp.
9. Hệ thống lưu kết quả.
10. Hiển thị hiệu ứng xác nhận.
11. Hiển thị Thẻ Kết Ước.
12. Học viên không thể quét thêm QR khác.

---

# 6. Điều kiện quét hợp lệ

Một lượt quét chỉ hợp lệ khi đáp ứng đầy đủ:

- Người dùng đã đăng nhập.
- Tài khoản có vai trò học viên.
- Module đang ở trạng thái ENABLED.
- Mã QR tồn tại.
- Mã QR đang hoạt động.
- Học viên chưa từng nhận Kết Ước.
- Học viên chưa bị khóa tài khoản.
- Yêu cầu quét được Backend xác thực thành công.

---

# 7. Trường hợp bị từ chối

## 7.1 Module chưa mở

Thông báo:

“Hoạt động Kết Ước hiện chưa được BTC mở.”

## 7.2 Module đã đóng

Thông báo:

“Hoạt động Kết Ước đã kết thúc.”

## 7.3 QR không hợp lệ

Thông báo:

“Mã QR không hợp lệ. Vui lòng quét mã do BTC cung cấp.”

## 7.4 Học viên đã quét

Không tạo dữ liệu mới.

Thông báo:

“Bạn đã hoàn thành Kết Ước.”

Sau đó hiển thị lại Thẻ Kết Ước đã lưu.

## 7.5 Chưa đăng nhập

Chuyển người dùng về trang đăng nhập.

## 7.6 Tài khoản Admin quét QR

Thông báo:

“Chức năng này chỉ dành cho học viên.”

---

# 8. Quy tắc ghép tên học viên

BTC cung cấp thông điệp có vị trí cần chèn tên.

Trong hệ thống, vị trí này sử dụng biến:

{{studentName}}

Ví dụ nội dung mẫu:

“{{studentName}}, Chúa luôn ở cùng con trong mọi hành trình.”

Khi học viên Ngô Tấn Phát quét QR, nội dung cuối cùng là:

“Ngô Tấn Phát, Chúa luôn ở cùng con trong mọi hành trình.”

Tên được lấy từ tài khoản đang đăng nhập.

Học viên không được tự nhập hoặc chỉnh sửa tên.

---

# 9. Dữ liệu phải lưu

Mỗi lượt nhận Kết Ước lưu:

- Member ID.
- Username.
- Họ tên học viên tại thời điểm quét.
- Nhóm tại thời điểm quét.
- QR Template ID.
- QR Code.
- Nội dung mẫu.
- Nội dung hoàn chỉnh sau khi ghép tên.
- Câu gốc Kinh Thánh.
- Thời gian quét.
- Trạng thái đang hoạt động hay đã reset.
- Thời gian reset nếu có.
- Admin thực hiện reset nếu có.
- Lý do reset nếu có.

Nội dung hoàn chỉnh phải được lưu lại để bảo đảm sau này BTC chỉnh sửa mẫu QR cũng không làm thay đổi Thẻ Kết Ước mà học viên đã nhận.

---

# 10. Thẻ Kết Ước

Thẻ Kết Ước là giao diện HTML/CSS, không phải ảnh cố định.

Card gồm:

1. Tiêu đề “KẾT ƯỚC THÁNH KINH HÈ 2026”.
2. Họ tên học viên.
3. Thông điệp đã ghép tên.
4. Câu gốc Kinh Thánh.
5. Ngày và giờ nhận.
6. Mã QR đã nhận.

Không hiển thị tên chủ đề vì BTC không cung cấp chủ đề riêng cho từng QR.

Thẻ phải:

- Responsive trên điện thoại.
- Không cho học viên chỉnh sửa.
- Luôn hiển thị trong hồ sơ sau khi đã nhận.
- Có trạng thái ghim cố định.
- Có thể mở rộng tính năng xuất ảnh hoặc PDF sau chương trình.

---

# 11. Hiệu ứng sau khi quét thành công

Sau khi Backend xác nhận thành công:

1. Hiển thị thông báo “Đã ghi nhận Kết Ước của bạn”.
2. Chuyển nền nhẹ bằng hiệu ứng fade.
3. Thẻ Kết Ước xuất hiện bằng hiệu ứng slide-up.
4. Hiển thị đầy đủ thông điệp và câu gốc.
5. Ẩn khu vực quét QR.
6. Chỉ giữ lại Thẻ Kết Ước và nút trở về hồ sơ.

Hiệu ứng chỉ hỗ trợ trải nghiệm, không ảnh hưởng dữ liệu.

---

# 12. Hiển thị trong hồ sơ học viên

Nếu học viên chưa nhận Kết Ước:

- Không hiển thị Thẻ Kết Ước trong hồ sơ.

Nếu học viên đã nhận:

- Hiển thị card “Kết Ước”.
- Thẻ được đặt trước danh sách lời khích lệ.
- Thẻ được đánh dấu là nội dung ghim.
- Học viên luôn xem lại được.

Thẻ Kết Ước không được tính vào số lượng lời khích lệ thông thường.

---

# 13. Trang Admin QR Kết Ước

Trang Admin cần có:

## 13.1 Card thống kê

- Tổng học viên.
- Đã nhận Kết Ước.
- Chưa nhận Kết Ước.
- Tỷ lệ hoàn thành.

## 13.2 Trạng thái Module

- DISABLED.
- ENABLED.
- CLOSED.

## 13.3 Bảng học viên

Các cột:

- Mã TKH.
- Họ và tên.
- Nhóm.
- Trạng thái.
- Mã QR đã nhận.
- Thời gian nhận.
- Thao tác.

## 13.4 Bộ lọc

- Tìm theo tên hoặc mã TKH.
- Lọc theo nhóm.
- Lọc đã nhận hoặc chưa nhận.
- Lọc theo mã QR.

## 13.5 Thao tác

- Xem Thẻ Kết Ước.
- Reset quyền quét.
- Download danh sách kết quả.

---

# 14. Reset Kết Ước

Reset chỉ dùng khi:

- Học viên quét nhầm do lỗi vận hành.
- QR được cấu hình sai.
- Dữ liệu ghi nhận bị lỗi.
- BTC có quyết định đặc biệt.

Khi reset:

1. Admin chọn học viên.
2. Admin nhập lý do.
3. Hệ thống lưu audit log.
4. Bản ghi cũ được đánh dấu đã reset, không xóa vĩnh viễn.
5. Học viên được phép quét lại.
6. Thẻ cũ không còn hiển thị trong hồ sơ.

Không cho reset hàng loạt trong phiên bản đầu tiên.

---

# 15. Nguyên tắc bảo mật

- QR chỉ chứa mã hoặc URL, không chứa toàn bộ thông điệp.
- Backend quyết định QR có hợp lệ hay không.
- Backend kiểm tra học viên đã nhận hay chưa.
- Frontend không được tự quyết định kết quả quét.
- Không gửi toàn bộ danh sách thông điệp xuống trình duyệt trước khi quét.
- Không cho học viên gửi Member ID tùy ý.
- Member ID phải lấy từ phiên đăng nhập.
- Mỗi học viên chỉ có một Kết Ước đang hoạt động.
- Mọi reset phải có audit log.

---

# 16. Cấu trúc QR đề xuất

Mỗi QR dẫn đến URL dạng:

https://domain-tkh.com/covenant/scan/QR01

Hoặc chứa mã:

TKH2026-COVENANT-QR01

Backend đọc QR Code và tìm nội dung tương ứng trong database.

Không sử dụng QR chứa trực tiếp toàn bộ thông điệp.

---

# 17. Những nội dung chưa thực hiện ở bước này

- Chưa code camera quét QR.
- Chưa tạo menu học viên.
- Chưa tạo trang Admin.
- Chưa tạo database.
- Chưa tạo API.
- Chưa tạo Thẻ Kết Ước bằng HTML/CSS.
- Chưa tạo năm QR chính thức.

Các phần trên được thực hiện sau khi nội dung của năm QR được chốt.