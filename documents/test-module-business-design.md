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

Menu học viên có tên:

```text
📝 Kiểm tra
```

Trang Kiểm tra hiển thị 04 card.

Mỗi card gồm:

- Tên bài kiểm tra.
- Loại bài.
- Ngày kiểm tra.
- Giờ dự kiến.
- Số câu.
- Tổng thời gian hoặc thời gian mỗi câu.
- Trạng thái hiện tại.
- Nút tham gia nếu phù hợp.

Ví dụ:

```text
PRE-TEST 1
21/07/2026 · 08:00
10 câu hỏi
Trạng thái: Sắp diễn ra
```

---

# 6. Quy tắc hiển thị Card

## DRAFT

- Không hiển thị cho học viên.

## SCHEDULED

- Card bị làm mờ.
- Không bấm được.
- Hiển thị “Sắp diễn ra”.

## WAITING_ROOM_OPEN

- Card được highlight.
- Hiển thị “Phòng chờ đang mở”.
- Có nút “Vào phòng chờ”.

## IN_PROGRESS

### Học viên đã có mặt trong phòng chờ

- Chuyển vào bài kiểm tra.

### Học viên chưa vào phòng chờ

- Mặc định không được tham gia.
- Hiển thị “Bài kiểm tra đã bắt đầu”.

## SUBMITTING

- Card hiển thị “Đang thu bài”.
- Không cho vào lại để chỉnh sửa đáp án.

## COMPLETED

- Card hiển thị “Đã kết thúc”.
- Có thể có nút “Xem kết quả” nếu Admin cho phép.

## CANCELLED

- Card bị làm mờ.
- Hiển thị “Đã hủy”.

---

# 7. Phòng chờ học viên

Khi phòng chờ được mở, học viên bấm:

```text
Vào phòng chờ
```

Màn hình hiển thị:

- Tên bài kiểm tra.
- Tên học viên.
- Mã TKH.
- Nhóm.
- Trạng thái kết nối.
- Thông báo “Bạn đã sẵn sàng”.
- Hướng dẫn không thoát khỏi trang.

Thông báo đề xuất:

```text
Bạn đã vào phòng chờ.
Vui lòng giữ nguyên màn hình và chờ BTC bắt đầu bài kiểm tra.
```

Học viên chỉ được vào phòng chờ khi:

- Đã đăng nhập.
- Có Season Membership hợp lệ.
- Bài kiểm tra thuộc mùa hiện tại.
- Trạng thái bài là WAITING_ROOM_OPEN.
- Học viên chưa có Attempt chính thức đã hoàn thành.

---

# 8. Phòng chờ Admin

Admin nhìn thấy:

- Tổng số học viên hợp lệ.
- Số học viên đã vào phòng chờ.
- Số học viên chưa vào.
- Danh sách học viên đang chờ.
- Tên.
- Mã TKH.
- Nhóm.
- Thời gian vào phòng.
- Trạng thái kết nối.
- Thiết bị hoặc phiên kết nối nếu cần hỗ trợ kỹ thuật.

Bộ lọc:

- Tìm theo tên hoặc mã TKH.
- Lọc theo nhóm.
- Lọc đã vào hoặc chưa vào.
- Lọc đang online hoặc mất kết nối.

Nút:

- Mở phòng chờ.
- Đóng phòng chờ.
- Bắt đầu bài kiểm tra.
- Hủy bài kiểm tra.

---

# 9. Điều kiện bắt đầu bài kiểm tra

Admin chỉ được bắt đầu khi:

- Bài kiểm tra có ít nhất một câu hỏi.
- Mỗi câu có đủ bốn đáp án.
- Mỗi câu có đúng một đáp án đúng.
- Thời gian mỗi câu hợp lệ.
- Điểm của mỗi câu hợp lệ.
- Bài kiểm tra đang ở trạng thái WAITING_ROOM_OPEN.
- Không có bài kiểm tra khác đang IN_PROGRESS trong cùng mùa.

Khi Admin bấm “Bắt đầu”:

1. Hiển thị popup xác nhận.
2. Khóa việc chỉnh sửa câu hỏi.
3. Tạo thời điểm bắt đầu chính thức.
4. Chuyển trạng thái sang IN_PROGRESS.
5. Tạo hoặc kích hoạt Attempt cho học viên hợp lệ trong phòng chờ.
6. Gửi sự kiện đến học viên.
7. Bắt đầu câu hỏi đầu tiên.
8. Khởi chạy countdown.

---

# 10. Màn hình trình chiếu Admin

Màn hình Admin hoặc TV hiển thị:

- Tên bài kiểm tra.
- Số thứ tự câu.
- Nội dung câu hỏi.
- Bốn đáp án A, B, C, D.
- Countdown.
- Thanh tiến trình.
- Số lượng học viên đã trả lời.
- Số lượng học viên đang kết nối.
- Trạng thái câu hiện tại.

Ví dụ:

```text
Câu 3 / 10

Nội dung câu hỏi...

A. ...
B. ...
C. ...
D. ...

Thời gian còn lại: 12 giây
Đã trả lời: 125 / 150
```

Không hiển thị đáp án đúng trước khi câu bị đóng.

---

# 11. Màn hình học viên

Màn hình học viên không hiển thị nội dung câu hỏi.

Màn hình gồm danh sách câu:

```text
Câu 1
A B C D

Câu 2
A B C D

Câu 3
A B C D
```

Học viên có thể:

- Cuộn lên xuống.
- Chọn A, B, C hoặc D.
- Đổi đáp án trong khi câu hiện tại còn hiệu lực.
- Nhìn thấy câu nào đã trả lời.
- Nhìn thấy câu nào chưa trả lời.
- Nhìn thấy câu hiện tại.
- Nhìn thấy câu đã bị khóa.

Học viên không được:

- Nhìn thấy nội dung câu hỏi trên điện thoại.
- Xem đáp án đúng.
- Trả lời câu tương lai.
- Thay đổi câu đã đóng.
- Gửi đáp án thay học viên khác.

---

# 12. Phương án trả lời chính thức

Giao diện hiển thị toàn bộ danh sách câu.

Tuy nhiên:

```text
Chỉ câu hiện tại được phép trả lời.
```

Trạng thái từng câu:

## LOCKED_PAST

- Câu đã hết thời gian.
- Không thể chỉnh sửa.
- Hiển thị đáp án học viên đã chọn nếu có.

## ACTIVE

- Câu đang được trình chiếu.
- Có thể chọn hoặc đổi đáp án.

## LOCKED_FUTURE

- Câu chưa đến lượt.
- Không thể chọn đáp án.

Như vậy:

- Học viên thấy tiến độ tổng thể.
- Câu hiện tại được highlight.
- Câu cũ bị khóa.
- Câu tương lai chưa mở.
- Không thể quay lại sửa đáp án cũ.

---

# 13. Countdown

Mỗi câu có thời gian riêng.

Ví dụ:

```text
15 giây
20 giây
30 giây
```

Backend là nguồn thời gian chính.

Backend lưu:

```text
question_started_at
question_ends_at
```

Frontend chỉ tính thời gian còn lại dựa trên thời điểm Backend trả về.

Không được chỉ dựa vào:

```text
setInterval
đồng hồ điện thoại
thời gian do học viên gửi
```

Khi hết thời gian:

1. Backend đóng câu hiện tại.
2. Không nhận đáp án mới.
3. Ghi nhận đáp án cuối cùng đã nhận đúng hạn.
4. Chuyển sang câu kế tiếp.
5. Gửi sự kiện realtime.
6. Học viên không thể sửa câu cũ.

---

# 14. Quy tắc chấp nhận đáp án

Backend chỉ chấp nhận đáp án khi:

- Attempt thuộc học viên đang đăng nhập.
- Attempt đang IN_PROGRESS.
- Test đang IN_PROGRESS.
- Question là câu ACTIVE.
- Thời gian Server chưa vượt `question_ends_at`.
- Option thuộc đúng Question.
- Học viên có quyền tham gia bài.

Nếu học viên đổi đáp án trong thời gian hợp lệ:

- Backend cập nhật đáp án hiện tại.
- Không tạo điểm ngay.
- Chỉ đáp án cuối cùng hợp lệ được dùng để chấm.

---

# 15. Mất kết nối trong lúc kiểm tra

Nếu học viên mất mạng:

- Giao diện hiển thị cảnh báo kết nối.
- Các đáp án đã gửi thành công trước đó vẫn được giữ.
- Hệ thống cố gắng kết nối lại.
- Khi kết nối lại, đồng bộ:
  - Test hiện tại.
  - Câu hiện tại.
  - Thời gian còn lại.
  - Đáp án đã lưu.
- Không mở lại câu đã hết thời gian.

Nếu mất mạng đến hết bài:

- Backend chấm dựa trên các đáp án đã nhận.
- Các câu chưa gửi được tính là chưa trả lời.

Nếu học viên chọn đáp án nhưng chưa gửi được:

- Frontend có thể hiển thị trạng thái “Đang gửi”.
- Không được hiển thị “Đã lưu” nếu Backend chưa xác nhận.

---

# 16. Reload hoặc thoát trang

Nếu học viên reload:

- Xác thực lại phiên đăng nhập.
- Kiểm tra Attempt đang hoạt động.
- Đưa học viên trở lại đúng Test.
- Đồng bộ câu hiện tại từ Backend.
- Không tạo Attempt mới.
- Không làm lại từ đầu.
- Không mở lại câu đã hết thời gian.

Nếu học viên thoát trang:

- Attempt vẫn tồn tại.
- Ghi nhận thời điểm mất kết nối nếu cần.
- Admin có thể thấy trạng thái Offline.
- Khi quay lại, xử lý giống Reload.

---

# 17. Nhiều tab hoặc nhiều thiết bị

Một học viên chỉ có một phiên thi chính thức tại một thời điểm.

Khi phát hiện nhiều tab hoặc nhiều kết nối:

Phương án chính thức:

```text
Kết nối mới nhất được giữ quyền điều khiển.
Kết nối cũ chuyển sang trạng thái chỉ xem hoặc bị ngắt.
```

Backend không tạo Attempt mới.

Admin có thể thấy cảnh báo:

```text
Học viên đang kết nối từ nhiều phiên.
```

Không nên tự động hủy bài chỉ vì mở lại trình duyệt.

---

# 18. Late Join

Mặc định:

```text
Học viên không có mặt trong phòng chờ khi Admin bắt đầu sẽ không được tham gia.
```

Nếu BTC cần cho vào muộn:

- Admin sử dụng chức năng “Cho phép vào muộn”.
- Học viên bắt đầu từ câu đang ACTIVE.
- Các câu đã đóng được tính là không trả lời.
- Không mở lại câu cũ.
- Hành động phải có Audit Log.

Phiên bản đầu có thể tắt chức năng Late Join để giảm rủi ro.

---

# 19. Tự động Submit

Bài kiểm tra tự động Submit khi:

- Hết thời gian câu cuối.
- Admin kết thúc bài kiểm tra.
- Backend xác nhận toàn bộ câu đã đóng.

Không cần học viên bấm nút Submit thủ công.

Khi Submit:

1. Khóa toàn bộ đáp án.
2. Đánh dấu Attempt là SUBMITTED.
3. Ghi thời gian Submit.
4. Chấm điểm.
5. Lưu kết quả.
6. Tạo điểm vào hệ thống Score.
7. Cập nhật ranking theo cấu hình.
8. Hiển thị màn hình hoàn thành.

Submit phải có tính idempotent:

```text
Một Attempt chỉ được chấm và cộng điểm một lần.
```

---

# 20. Chấm điểm

Mỗi câu có:

- Đáp án đúng.
- Số điểm.

Ví dụ:

```text
10 câu × 10 điểm = 100 điểm
```

Hoặc BTC có thể cấu hình điểm từng câu.

Kết quả gồm:

- Tổng số câu.
- Số câu đúng.
- Số câu sai.
- Số câu không trả lời.
- Tổng điểm tối đa.
- Điểm đạt được.
- Thời gian bắt đầu.
- Thời gian Submit.

Backend chấm điểm.

Frontend không tự quyết định điểm chính thức.

---

# 21. Ghi nhận vào hệ thống điểm

Sau khi chấm xong:

- Pre-test ghi loại điểm `PRE_TEST`.
- Final Test ghi loại điểm `FINAL_TEST`.
- Điểm gắn với Season Membership.
- Điểm cá nhân được cập nhật.
- Điểm nhóm được tính lại.
- Lịch sử điểm ghi rõ nguồn bài kiểm tra.

Ví dụ:

```text
Nguồn điểm: Pre-test 1
Điểm: 80
Ngày: 21/07/2026
```

Bảng `scores` cần lưu:

```text
source_type = TEST_ATTEMPT
source_id = attempt_id
```

Ràng buộc chống cộng trùng:

```text
Một source_type + source_id chỉ tạo một record điểm chính thức.
```

---

# 22. Kết quả học viên

Sau khi bài hoàn thành, học viên có thể thấy:

- Tên bài.
- Tổng số câu.
- Số câu đúng.
- Số câu sai.
- Số câu không trả lời.
- Tổng điểm.
- Thời gian hoàn thành.

Việc hiển thị đáp án đúng do Admin cấu hình.

Mặc định:

- Không hiển thị đáp án đúng ngay.
- Không hiển thị câu hỏi trên điện thoại sau bài nếu BTC chưa cho phép.
- Chỉ hiển thị tổng điểm theo cấu hình.

---

# 23. Trạng thái hiển thị kết quả

Mỗi bài có:

```text
result_visibility
```

Giá trị:

## HIDDEN

- Học viên chưa thấy kết quả.
- Admin vẫn xem được.

## SCORE_ONLY

- Học viên thấy tổng điểm.
- Không thấy đáp án đúng.

## FULL_RESULT

- Học viên thấy điểm.
- Thấy đúng, sai và chi tiết nếu BTC cho phép.

Đề xuất cho TKH 2026:

```text
Pre-test: SCORE_ONLY
Final Test: HIDDEN
```

cho đến khi BTC công bố.

---

# 24. Final Test và Ranking

Trước Final Test, Admin có nút:

```text
Ẩn Ranking học viên
```

Khi Ranking bị ẩn:

- Học viên không thấy xếp hạng cá nhân.
- Học viên không thấy xếp hạng nhóm.
- Các card Ranking hiển thị thông báo.
- Admin vẫn thấy đầy đủ điểm và thứ hạng.
- Điểm vẫn tiếp tục được tính.
- Dữ liệu không bị xóa.

Thông báo:

```text
Bảng xếp hạng đang được BTC tạm ẩn.
Kết quả sẽ được công bố sau.
```

Sau khi công bố kết quả, Admin bấm:

```text
Hiện lại Ranking
```

Trạng thái này thuộc `season_settings`, không chỉ thuộc riêng Final Test.

---

# 25. Chống làm bài trùng

Một học viên chỉ có một Attempt chính thức cho mỗi bài kiểm tra.

Quy tắc:

```text
Một test + một season membership = một official attempt
```

Không cho học viên:

- Mở nhiều tab để tạo nhiều bài.
- Submit nhiều lần để cộng điểm trùng.
- Làm lại sau khi đã hoàn thành.
- Gọi API bằng URL để tạo Attempt mới.

Nếu BTC muốn cho thi lại:

- Admin phải Reset Attempt.
- Attempt cũ không bị xóa.
- Mọi thao tác có Audit Log.

---

# 26. Reset Attempt

Reset sử dụng khi:

- Lỗi kỹ thuật.
- Mất kết nối nghiêm trọng.
- BTC xác nhận cho làm lại.
- Attempt bị lỗi dữ liệu.

Khi Reset:

1. Không xóa Attempt cũ.
2. Đánh dấu Attempt cũ là RESET.
3. Ghi Admin thực hiện.
4. Ghi thời gian.
5. Ghi lý do.
6. Vô hiệu hóa điểm cũ nếu đã cộng.
7. Tạo Audit Log.
8. Cho phép tạo Attempt mới.

Nếu Attempt cũ đã tạo Score:

- Không xóa record score.
- Đánh dấu score cũ là VOIDED hoặc REVERSED.
- Ghi rõ lý do và nguồn reset.

Không nên reset hàng loạt trong phiên bản đầu.

---

# 27. Hủy bài kiểm tra

Admin có thể hủy bài khi:

- Chưa bắt đầu.
- Có lỗi nghiêm trọng.
- BTC quyết định tổ chức lại.

Nếu đang IN_PROGRESS:

- Hiển thị popup xác nhận mức độ nghiêm trọng.
- Khóa tiếp nhận đáp án.
- Chuyển Test sang CANCELLED.
- Không cộng điểm.
- Attempt ghi trạng thái CANCELLED.
- Tạo Audit Log.

Nếu muốn tổ chức lại:

- Tạo một lần chạy mới hoặc reset theo quy trình được chốt.
- Không sửa lịch sử lần đã hủy thành dữ liệu mới.

---

# 28. Download dữ liệu

Admin có thể Download kết quả bài kiểm tra.

File Excel gồm:

## Sheet 1 — Kết quả học viên

- Mã TKH.
- Họ tên.
- Nhóm.
- Bài kiểm tra.
- Số câu đúng.
- Số câu sai.
- Số câu bỏ trống.
- Tổng điểm.
- Trạng thái.
- Thời gian bắt đầu.
- Thời gian nộp.

## Sheet 2 — Chi tiết đáp án

- Mã TKH.
- Họ tên.
- Câu số.
- Đáp án đã chọn.
- Đáp án đúng.
- Đúng hoặc sai.
- Thời gian trả lời.

## Sheet 3 — Kết nối và sự kiện

- Mã TKH.
- Họ tên.
- Loại sự kiện.
- Thời gian.
- Chi tiết.

## Sheet 4 — Audit Reset

- Mã TKH.
- Họ tên.
- Bài kiểm tra.
- Admin Reset.
- Thời gian Reset.
- Lý do.

Tên file đề xuất:

```text
TKH2026_Test_PreTest1_YYYYMMDD_HHmm.xlsx
```

---

# 29. Trạng thái kết nối thời gian thực

Module cần đồng bộ realtime giữa:

- Admin.
- Màn hình trình chiếu.
- Học viên.

Các sự kiện:

```text
waiting_room_opened
waiting_room_closed
student_joined_waiting_room
student_left_waiting_room
test_started
question_started
answer_saved
question_closed
question_changed
test_submitting
test_completed
test_cancelled
ranking_visibility_changed
```

Công nghệ dự kiến:

```text
Socket.IO hoặc WebSocket
```

REST API vẫn dùng cho:

- Tạo bài.
- Lưu câu hỏi.
- Xem báo cáo.
- Download.
- Quản lý cấu hình.
- Lấy lại trạng thái sau Reload.

---

# 30. Backend là nguồn trạng thái chính

Backend quyết định:

- Test đang ở trạng thái nào.
- Câu nào đang ACTIVE.
- Câu bắt đầu và kết thúc lúc nào.
- Đáp án có được chấp nhận không.
- Attempt có hợp lệ không.
- Điểm chính thức là bao nhiêu.
- Ranking có được hiển thị không.

Frontend chỉ:

- Hiển thị trạng thái.
- Gửi lựa chọn của học viên.
- Hiển thị xác nhận từ Backend.

---

# 31. Quy tắc chỉnh sửa bài kiểm tra

## DRAFT

- Được sửa toàn bộ.

## SCHEDULED

- Được sửa thông tin và câu hỏi nếu chưa mở phòng chờ.
- Cần cảnh báo nếu thay đổi lịch.

## WAITING_ROOM_OPEN

- Không sửa câu hỏi hoặc đáp án.
- Có thể đóng phòng chờ để quay lại cấu hình nếu chưa bắt đầu, theo quyền Admin.

## IN_PROGRESS

- Không sửa nội dung.
- Không sửa đáp án đúng.
- Không sửa điểm.
- Không đổi thứ tự câu.

## COMPLETED

- Chỉ xem.
- Mọi điều chỉnh kết quả phải qua nghiệp vụ riêng và Audit Log.

---

# 32. Quy tắc câu hỏi

Phiên bản đầu:

- Chỉ trắc nghiệm một đáp án đúng.
- Đúng bốn Option: A, B, C, D.
- Mỗi Question có đúng một Option đúng.
- Nội dung Question bắt buộc.
- Thời gian tối thiểu và tối đa phải hợp lệ.
- Điểm không âm.
- Thứ tự câu không trùng trong cùng Test.

Không hỗ trợ trong phiên bản đầu:

- Nhiều đáp án đúng.
- Tự luận.
- Upload file trả lời.
- Câu hỏi phụ thuộc.
- Random câu riêng cho từng học viên.

---

# 33. Quyền riêng tư và bảo mật

- Học viên chỉ xem Attempt của mình.
- Không gửi đáp án đúng xuống thiết bị học viên trong lúc thi.
- Không tin `memberId`, `attemptId` tùy ý từ Frontend.
- Backend lấy identity từ Token.
- Không cho truy cập Test mùa khác.
- Không cho truy cập câu hỏi chưa mở.
- Không cho sửa đáp án đã khóa.
- Admin endpoint bắt buộc kiểm tra role.
- Ghi Audit Log cho hành động quan trọng.
- Rate limit API gửi đáp án.
- Không lưu password hoặc token trong event log.

---

# 34. Tiêu chí hoàn thành Module

Module được xem là hoàn thành khi:

- Admin tạo được Test.
- Admin tạo đủ câu hỏi và đáp án.
- Validation ngăn cấu hình sai.
- Học viên thấy card đúng trạng thái.
- Phòng chờ hoạt động.
- Admin thấy danh sách chờ.
- Bắt đầu bài đồng bộ được nhiều thiết bị.
- Countdown dùng thời gian Backend.
- Học viên chỉ trả lời câu ACTIVE.
- Reload không làm mất Attempt.
- Mất mạng và reconnect hoạt động.
- Tự Submit.
- Chấm điểm chính xác.
- Không cộng điểm trùng.
- Ranking ẩn và hiện đúng.
- Admin export được.
- Reset có Audit Log.
- Test được tối thiểu trên Android, iPhone và máy tính.

---

# 35. Phạm vi phiên bản đầu

Phiên bản TKH 2026 thực hiện:

- 03 Pre-test.
- 01 Final Test.
- Trắc nghiệm A, B, C, D.
- Một đáp án đúng cho mỗi câu.
- Countdown từng câu.
- Phòng chờ.
- Màn hình TV.
- Màn hình trả lời học viên.
- Tự động Submit.
- Tự động chấm điểm.
- Cộng điểm cá nhân và nhóm.
- Ẩn hoặc hiện Ranking.
- Download kết quả.
- Reset từng học viên khi cần.
- Reconnect cơ bản.
- Multi-season.
- Audit Log.

Chưa ưu tiên:

- Câu hỏi tự luận.
- Nhiều đáp án đúng.
- Trộn thứ tự câu riêng cho từng học viên.
- Thi lại hàng loạt.
- Chứng chỉ tự động.
- Phân tích nâng cao.
- Offline Test.
- Chấm điểm theo tốc độ.