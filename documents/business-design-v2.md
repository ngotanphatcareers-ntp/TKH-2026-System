# TKH 2026 SYSTEM

## BUSINESS DESIGN V2

Version: 2.0  
Frontend baseline: V1.0  
Frontend JavaScript version: app.js?v=131  
Backend status: Not Started  
Storage status: LocalStorage Demo  

---

# 1. Mục tiêu tài liệu

Tài liệu này xác định yêu cầu nghiệp vụ chính thức của hệ thống TKH 2026 trước khi thiết kế database, API và backend.

Các module mới bắt buộc phải được đưa vào thiết kế backend:

1. QR Kết Ước.
2. Hệ thống Kiểm Tra.
3. Waiting Room.
4. Đồng bộ bài kiểm tra giữa Admin và học viên.
5. Điều khiển hiển thị ranking.
6. Lưu kết quả kiểm tra vào điểm cá nhân và điểm nhóm.

---

# 2. Vai trò người dùng

## 2.1 Admin

Admin có quyền:

- Quản lý học viên.
- Quản lý nhóm.
- Quản lý buổi học.
- Quản lý điểm danh.
- Quản lý điểm số.
- Quản lý Bible Challenge.
- Quản lý lời khích lệ.
- Quản lý câu hỏi học viên.
- Quản lý tài liệu.
- Mở hoặc đóng tính năng QR Kết Ước.
- Theo dõi học viên đã quét QR.
- Tạo và quản lý bài kiểm tra.
- Mở Waiting Room.
- Theo dõi học viên đang chờ.
- Bắt đầu bài kiểm tra.
- Điều khiển câu hỏi và countdown.
- Kết thúc bài kiểm tra.
- Xem kết quả kiểm tra.
- Ẩn hoặc hiện ranking đối với học viên.
- Mở lại ranking sau khi BTC công bố kết quả.

## 2.2 Học viên

Học viên có quyền:

- Đăng nhập tài khoản cá nhân.
- Điểm danh.
- Xem điểm cá nhân.
- Xem điểm nhóm.
- Xem ranking khi Admin cho phép.
- Xem lịch học.
- Gửi và nhận lời khích lệ.
- Gửi câu hỏi.
- Xem tài liệu.
- Quét QR Kết Ước khi Admin mở tính năng.
- Chỉ được nhận một thông điệp Kết Ước.
- Tham gia bài kiểm tra đang mở.
- Vào Waiting Room.
- Chọn đáp án trên điện thoại.
- Nhận kết quả sau khi bài kiểm tra kết thúc.

---

# 3. Module QR Kết Ước

## 3.1 Mục tiêu

BTC chuẩn bị 5 mã QR.

Mỗi mã QR tương ứng với một mẫu thông điệp Kết Ước.

Khi học viên quét mã QR:

1. Hệ thống xác định tài khoản đang đăng nhập.
2. Hệ thống xác định mã QR đã quét.
3. Hệ thống lấy mẫu thông điệp tương ứng.
4. Hệ thống chèn tên học viên vào thông điệp.
5. Hệ thống lưu thông điệp vào hồ sơ học viên.
6. Thông điệp được ghim cố định trong hồ sơ.
7. Học viên bị khóa quyền quét thêm mã QR khác.

## 3.2 Trạng thái module QR

Module QR có các trạng thái:

- DISABLED: Menu QR bị ẩn khỏi tài khoản học viên.
- ENABLED: Menu QR xuất hiện trong tài khoản học viên.
- CLOSED: Chương trình QR đã kết thúc, không thể quét thêm.

Admin có quyền chuyển trạng thái.

## 3.3 Quy tắc hiển thị menu học viên

Nếu trạng thái là DISABLED:

- Không hiển thị menu QR Kết Ước.

Nếu trạng thái là ENABLED:

- Hiển thị menu QR Kết Ước.
- Học viên chưa quét được phép mở camera và quét QR.
- Học viên đã quét chỉ nhìn thấy thông điệp đã nhận.

Nếu trạng thái là CLOSED:

- Không cho quét mới.
- Học viên đã có thông điệp vẫn được xem thông điệp trong hồ sơ.

## 3.4 Nội dung QR

QR không chứa toàn bộ đoạn thông điệp.

QR chỉ chứa một URL hoặc mã định danh, ví dụ:

https://domain.com/covenant/scan?code=QR01

Hoặc:

QR01

Backend sử dụng mã QR để tìm mẫu thông điệp trong database.

Các mã dự kiến:

- QR01
- QR02
- QR03
- QR04
- QR05

## 3.5 Quy tắc chống quét nhiều lần

Mỗi học viên chỉ có thể nhận một QR Kết Ước.

Trước khi lưu, backend phải kiểm tra:

- Học viên đã từng quét QR chưa.
- Mã QR có hợp lệ không.
- Module QR có đang mở không.
- Tài khoản có đúng vai trò học viên không.

Nếu học viên đã quét:

- Không tạo thông điệp mới.
- Trả về thông báo: Bạn đã hoàn thành Kết Ước.
- Hiển thị lại thông điệp đã được lưu trước đó.

## 3.6 Dữ liệu Admin cần xem

Admin xem được:

- Tổng số học viên.
- Số học viên đã quét.
- Số học viên chưa quét.
- Tỷ lệ hoàn thành.
- Học viên đã nhận mẫu QR nào.
- Thời gian quét.
- Nhóm của học viên.

## 3.7 Reset QR

Chỉ Admin có quyền reset QR của một học viên.

Mọi thao tác reset cần lưu lịch sử:

- Admin thực hiện.
- Học viên bị reset.
- Thời gian reset.
- Lý do reset.

---

# 4. Module Kiểm Tra

## 4.1 Danh sách bài kiểm tra

Hệ thống có 4 bài kiểm tra:

1. Pre-test 1.
2. Pre-test 2.
3. Pre-test 3.
4. Final Test.

Mỗi bài kiểm tra được hiển thị dưới dạng một card trong menu Kiểm Tra.

## 4.2 Trạng thái bài kiểm tra

Mỗi bài kiểm tra có các trạng thái:

- DRAFT: Đang chuẩn bị.
- UPCOMING: Sắp diễn ra.
- WAITING: Đã mở Waiting Room.
- IN_PROGRESS: Đang kiểm tra.
- FINISHED: Đã kết thúc.
- LOCKED: Đã khóa.

## 4.3 Hiển thị card phía học viên

Card DRAFT hoặc UPCOMING:

- Làm mờ.
- Không thể bấm vào.
- Hiển thị ngày giờ dự kiến.

Card WAITING:

- Highlight.
- Học viên có thể bấm vào Waiting Room.

Card IN_PROGRESS:

- Highlight.
- Học viên đã vào Waiting Room được chuyển vào màn hình làm bài.
- Học viên đến muộn xử lý theo cấu hình của Admin.

Card FINISHED:

- Làm mờ.
- Không thể làm lại.
- Có thể hiển thị điểm nếu Admin cho phép.

## 4.4 Waiting Room

Khi Admin mở Waiting Room:

- Học viên bấm vào card.
- Hệ thống ghi nhận học viên có mặt trong phòng chờ.
- Học viên thấy màn hình: Vui lòng chờ BTC bắt đầu bài kiểm tra.

Admin thấy:

- Tổng số học viên đang chờ.
- Danh sách học viên.
- Mã TKH.
- Họ tên.
- Nhóm.
- Thời gian vào phòng chờ.
- Trạng thái kết nối.

Admin có nút:

- Mở Waiting Room.
- Đóng Waiting Room.
- Bắt đầu bài kiểm tra.

## 4.5 Bắt đầu bài kiểm tra

Khi Admin bấm Bắt đầu:

- Bài kiểm tra chuyển sang IN_PROGRESS.
- Học viên trong Waiting Room được chuyển sang giao diện trả lời.
- Màn hình trình chiếu Admin bắt đầu câu hỏi số 1.
- Countdown bắt đầu chạy.

## 4.6 Màn hình Admin trình chiếu

Màn hình Admin hiển thị:

- Tên bài kiểm tra.
- Số thứ tự câu hỏi.
- Nội dung câu hỏi.
- Các lựa chọn A, B, C, D nếu BTC muốn trình chiếu.
- Countdown của câu hỏi.
- Tiến độ bài kiểm tra.
- Số học viên đã gửi đáp án cho câu hiện tại.

Màn hình này được thiết kế để chiếu lên TV hoặc máy chiếu.

## 4.7 Màn hình học viên

Màn hình học viên không hiển thị nội dung câu hỏi.

Mỗi câu chỉ hiển thị:

- Số câu.
- A.
- B.
- C.
- D.
- Trạng thái đã chọn hoặc chưa chọn.

Học viên có thể cuộn danh sách các câu hỏi và thay đổi đáp án trước khi bài kiểm tra kết thúc.

Ví dụ:

Câu 1: A B C D  
Câu 2: A B C D  
Câu 3: A B C D  
...  
Câu 10: A B C D  

## 4.8 Countdown

Mỗi câu hỏi có thời gian riêng hoặc dùng thời gian chung theo cấu hình bài kiểm tra.

Admin có thể:

- Chuyển câu tiếp theo.
- Tạm dừng nếu cần.
- Tiếp tục.
- Kết thúc sớm.

Backend phải giữ thời gian trung tâm.

Không sử dụng đồng hồ riêng của từng điện thoại làm nguồn thời gian chính.

## 4.9 Tự động nộp bài

Khi hết câu cuối hoặc Admin bấm Kết thúc:

- Hệ thống khóa toàn bộ đáp án.
- Học viên không thể thay đổi.
- Hệ thống tự động nộp bài.
- Hệ thống tự động chấm điểm.
- Kết quả được lưu vào database.

Nếu học viên mất kết nối:

- Các đáp án đã gửi trước đó vẫn được lưu.
- Khi kết nối lại, hệ thống tải lại đáp án đã lưu.
- Khi bài kiểm tra kết thúc, hệ thống chấm các đáp án đã nhận được.

## 4.10 Chấm điểm

Mỗi câu có:

- Đáp án đúng.
- Số điểm.
- Có thể có trọng số khác nhau trong tương lai.

Kết quả bài kiểm tra gồm:

- Tổng số câu.
- Số câu đúng.
- Số câu sai.
- Điểm đạt được.
- Thời gian hoàn thành.
- Thời gian nộp bài.

## 4.11 Đồng bộ điểm

Điểm bài kiểm tra phải được ghi vào hệ thống điểm cá nhân.

Điểm học viên được cộng vào điểm nhóm theo quy tắc của BTC.

Mỗi kết quả phải liên kết với:

- Học viên.
- Nhóm.
- Bài kiểm tra.
- Buổi học hoặc tuần.
- Thời gian làm bài.

Không được cộng điểm trùng nếu hệ thống xử lý lại kết quả.

## 4.12 Ranking Pre-test

Sau Pre-test 1, Pre-test 2 và Pre-test 3:

- Ranking cá nhân có thể hiển thị.
- Ranking nhóm có thể hiển thị.
- Admin có quyền ẩn hoặc hiện.

## 4.13 Ranking Final Test

Trước Final Test:

- Admin có nút Ẩn Ranking.
- Toàn bộ ranking cá nhân và nhóm bị ẩn khỏi tài khoản học viên.
- Admin vẫn xem được toàn bộ ranking.

Sau khi BTC công bố kết quả:

- Admin bấm Hiện Ranking.
- Ranking được hiển thị lại cho học viên.

Trạng thái hiển thị ranking phải được lưu trong database, không lưu riêng trên thiết bị.

## 4.14 Quy tắc thi lại

Mặc định:

- Mỗi học viên chỉ được làm mỗi bài kiểm tra một lần.

Chỉ Admin được cấp quyền thi lại.

Việc cấp thi lại phải lưu:

- Admin thực hiện.
- Học viên.
- Bài kiểm tra.
- Lý do.
- Thời gian.

---

# 5. Quy tắc hệ thống thời gian thực

Các chức năng cần thời gian thực:

- Waiting Room.
- Danh sách học viên đang chờ.
- Admin bắt đầu bài kiểm tra.
- Chuyển câu hỏi.
- Countdown.
- Học viên gửi đáp án.
- Auto submit.
- Trạng thái kết nối.

Công nghệ dự kiến:

- Node.js.
- Express.js.
- Socket.IO.
- MySQL.

REST API dùng cho dữ liệu thông thường.

Socket.IO dùng cho sự kiện thời gian thực.

---

# 6. Phân quyền

## Admin

Được phép quản lý toàn bộ dữ liệu.

## Student

Chỉ được:

- Xem dữ liệu cá nhân.
- Gửi dữ liệu thuộc tài khoản của mình.
- Không được xem đáp án đúng.
- Không được xem kết quả người khác ngoài phạm vi ranking được phép.
- Không được sửa trạng thái bài kiểm tra.
- Không được tự mở QR.
- Không được tự reset QR.
- Không được tự cấp quyền thi lại.

---

# 7. Yêu cầu bảo mật

- Mật khẩu phải mã hóa bằng bcrypt.
- Không lưu mật khẩu dạng chữ thường.
- Dùng JWT hoặc session an toàn.
- Mọi API phải kiểm tra quyền.
- Không tin dữ liệu gửi từ frontend.
- Điểm phải được tính lại ở backend.
- Đáp án đúng không gửi xuống điện thoại học viên.
- Trạng thái QR phải được kiểm tra ở backend.
- Trạng thái đã quét QR phải được kiểm tra ở backend.
- Trạng thái bài thi phải lấy từ backend.
- Countdown chính phải lấy từ thời gian server.

---

# 8. Yêu cầu lưu lịch sử

Các hành động quan trọng cần audit log:

- Admin mở hoặc đóng QR.
- Admin reset QR học viên.
- Admin mở Waiting Room.
- Admin bắt đầu bài kiểm tra.
- Admin kết thúc bài kiểm tra.
- Admin cấp quyền thi lại.
- Admin ẩn hoặc hiện ranking.
- Admin chỉnh sửa điểm.
- Admin reset mật khẩu.

---

# 9. Thứ tự phát triển đề xuất

1. Authentication.
2. Member và Group.
3. Session.
4. Attendance.
5. Score.
6. QR Kết Ước.
7. Test Management.
8. Waiting Room.
9. Real-time Test.
10. Auto Scoring.
11. Ranking Visibility.
12. Encouragement.
13. Questions.
14. Study Materials.
15. Bible Challenge.
16. Reporting và Export.

---

# 10. Trạng thái chốt nghiệp vụ

QR Kết Ước: Pending Final Content  
Online Examination: Pending Final Rules  
Database Design: Not Started  
API Design: Not Started  
Backend: Not Started  