# TKH 2026 — MODULE KIỂM TRA BUSINESS DESIGN

Version: 1.0  
Status: Approved Business Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

Module Kiểm tra cho phép BTC tổ chức các bài kiểm tra trực tiếp trong chương trình TKH 2026.

Hệ thống cần hỗ trợ:

- 03 bài Pre-test.
- 01 bài Final Test.
- Phòng chờ trước khi bắt đầu.
- Admin theo dõi học viên đang có mặt.
- Admin điều khiển thời điểm bắt đầu.
- Màn hình trình chiếu câu hỏi cho BTC.
- Màn hình trả lời riêng cho từng học viên.
- Countdown cho từng câu hỏi.
- Tự động chuyển câu.
- Tự động nộp bài khi hết thời gian.
- Tự động chấm điểm.
- Cộng điểm vào hồ sơ học viên.
- Đồng bộ điểm cá nhân và điểm nhóm.
- Ẩn Ranking trong giai đoạn Final Test.
- Cho phép Admin mở lại Ranking sau khi công bố kết quả.

---

# 2. Danh sách bài kiểm tra TKH 2026

Module gồm 04 bài:

## 2.1 Pre-test 1

- Thực hiện vào đầu Tuần 1.
- Loại bài: PRE_TEST.
- Số câu dự kiến: 10.
- Hình thức: Trắc nghiệm A, B, C, D.

## 2.2 Pre-test 2

- Thực hiện vào đầu Tuần 2.
- Loại bài: PRE_TEST.
- Số câu dự kiến: 10.
- Hình thức: Trắc nghiệm A, B, C, D.

## 2.3 Pre-test 3

- Thực hiện vào đầu Tuần 3.
- Loại bài: PRE_TEST.
- Số câu dự kiến: 10.
- Hình thức: Trắc nghiệm A, B, C, D.

## 2.4 Final Test

- Thực hiện vào cuối chương trình.
- Loại bài: FINAL_TEST.
- Số câu do BTC cấu hình.
- Hình thức: Trắc nghiệm A, B, C, D.
- Có thể ẩn Ranking học viên trước hoặc trong thời gian Final Test.

---

# 3. Các vai trò

## 3.1 Học viên

Học viên được phép:

- Xem danh sách các bài kiểm tra.
- Xem trạng thái từng bài.
- Vào phòng chờ khi bài đang mở phòng.
- Tham gia bài kiểm tra khi Admin bắt đầu.
- Chọn đáp án A, B, C hoặc D.
- Thay đổi đáp án trong thời gian còn hiệu lực.
- Xem kết quả của bản thân sau khi bài kết thúc, nếu Admin cho phép.

Học viên không được:

- Xem trước nội dung câu hỏi.
- Xem đáp án đúng.
- Bắt đầu bài kiểm tra.
- Tạm dừng bài kiểm tra.
- Xem kết quả học viên khác.
- Tự thay đổi điểm.
- Truy cập bài chưa mở bằng URL trực tiếp.

## 3.2 Admin

Admin được phép:

- Tạo bài kiểm tra.
- Chỉnh sửa thông tin bài kiểm tra.
- Thêm câu hỏi.
- Thêm bốn đáp án.
- Đánh dấu đáp án đúng.
- Cài thời gian cho từng câu.
- Mở phòng chờ.
- Xem học viên đang có mặt trong phòng chờ.
- Bắt đầu bài kiểm tra.
- Theo dõi tiến trình bài kiểm tra.
- Kết thúc bài kiểm tra.
- Xem kết quả.
- Download dữ liệu.
- Ẩn hoặc hiện Ranking học viên.

---

# 4. Trạng thái bài kiểm tra

Mỗi bài kiểm tra có các trạng thái:

## DRAFT

Bài kiểm tra đang được soạn.

- Chỉ Admin nhìn thấy.
- Học viên không thấy card.
- Có thể chỉnh sửa toàn bộ nội dung.

## SCHEDULED

Bài kiểm tra đã được lên lịch.

- Học viên thấy card.
- Card bị làm mờ.
- Không thể vào phòng chờ.
- Hiển thị ngày và giờ dự kiến.

## WAITING_ROOM_OPEN

Phòng chờ đã được mở.

- Card được highlight.
- Học viên có thể vào phòng chờ.
- Chưa hiển thị câu hỏi.
- Admin thấy danh sách học viên đang chờ.

## IN_PROGRESS

Bài kiểm tra đang diễn ra.

- Học viên trong phòng chờ được đưa vào bài kiểm tra.
- Không cho học viên mới tham gia nếu Admin không cho phép.
- Màn hình Admin bắt đầu trình chiếu câu hỏi.
- Countdown hoạt động.
- Học viên bắt đầu chọn đáp án.

## SUBMITTING

Hệ thống đang thu bài.

- Khóa toàn bộ thao tác chọn đáp án.
- Tự động gửi đáp án lên Backend.
- Không cho reload để làm lại.

## COMPLETED

Bài kiểm tra đã kết thúc.

- Không nhận bài mới.
- Kết quả đã được chấm.
- Điểm đã được ghi nhận.
- Admin xem được báo cáo.
- Học viên xem kết quả theo cấu hình.

## CANCELLED

Bài kiểm tra bị hủy.

- Không chấm điểm.
- Không cộng điểm.
- Admin có thể tạo lại hoặc mở lại theo quy trình riêng.

---

# 5. Card bài kiểm tra phía học viên

Menu học viên có tên:

```text
📝 Kiểm tra