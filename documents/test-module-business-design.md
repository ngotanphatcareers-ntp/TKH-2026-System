# TKH 2026 — MODULE KIỂM TRA BUSINESS DESIGN

Version: 1.1  
Status: Frozen Business Design  
Owner: TKH PROJECT  
Reviewed by: Architecture Review  
Last updated: 2026-07-14  
Frontend implementation: Not Started  
Backend implementation: Not Started  

Related documents:

```text
test-module-ui-design.md
test-module-database-design.md
test-module-realtime-design.md
test-module-api-design.md
```

---

# 1. Mục tiêu

Module Kiểm tra cho phép BTC tổ chức các bài kiểm tra trực tiếp trong chương trình TKH 2026.

Hệ thống hỗ trợ:

- 03 bài Pre-test.
- 01 bài Final Test.
- Phòng chờ học viên.
- Phòng điều khiển Admin.
- Màn hình trình chiếu TV.
- Màn hình trả lời riêng cho học viên.
- Countdown theo thời gian Backend.
- Tự động khóa câu khi hết giờ.
- Admin chủ động mở câu tiếp theo.
- Tự động thu bài và chấm điểm.
- Cộng điểm vào hồ sơ học viên.
- Đồng bộ điểm cá nhân và điểm nhóm.
- Ẩn hoặc hiện Ranking theo cấu hình mùa.
- Late join từ câu hiện tại.
- Reconnect, refresh và phục hồi trạng thái.
- Reset Attempt có Audit Log.
- Download dữ liệu kết quả.

Ưu tiên của phiên bản đầu:

- Ổn định.
- Dễ vận hành.
- Không cộng điểm trùng.
- Không mất dữ liệu.
- Không mở rộng ngoài nhu cầu TKH 2026.

---

# 2. Phạm vi phiên bản đầu

Phiên bản TKH 2026 thực hiện:

- 03 Pre-test.
- 01 Final Test.
- Trắc nghiệm A, B, C, D.
- Mỗi câu có đúng một đáp án đúng.
- Một thời gian chung cho mỗi câu trong cùng một bài.
- Có thể cấu hình điểm cho từng câu.
- Phòng chờ.
- Màn hình TV.
- Màn hình trả lời học viên.
- Server tự khóa câu khi hết giờ.
- Admin mở câu tiếp theo.
- Tự động Submit.
- Tự động chấm điểm.
- Cộng điểm cá nhân và nhóm.
- Ẩn hoặc hiện Ranking.
- Download kết quả.
- Reset từng học viên khi cần.
- Late join.
- Reconnect cơ bản.
- Multi-season.
- Audit Log.

Chưa ưu tiên:

- Câu hỏi tự luận.
- Nhiều đáp án đúng.
- Random câu riêng cho từng học viên.
- Trộn thứ tự đáp án.
- Thi lại hàng loạt.
- Chứng chỉ tự động.
- Phân tích nâng cao.
- Offline Test.
- Chấm điểm theo tốc độ.
- Câu hỏi có hình ảnh hoặc video trong V1 nếu chưa thật sự cần.

---

# 3. Danh sách bài kiểm tra TKH 2026

Module gồm 04 bài:

## 3.1 Pre-test 1

- Thực hiện vào đầu Tuần 1.
- Loại: `PRE_TEST`.
- Số câu dự kiến: 10.
- Hình thức: A, B, C, D.

## 3.2 Pre-test 2

- Thực hiện vào đầu Tuần 2.
- Loại: `PRE_TEST`.
- Số câu dự kiến: 10.
- Hình thức: A, B, C, D.

## 3.3 Pre-test 3

- Thực hiện vào đầu Tuần 3.
- Loại: `PRE_TEST`.
- Số câu dự kiến: 10.
- Hình thức: A, B, C, D.

## 3.4 Final Test

- Thực hiện vào cuối chương trình.
- Loại: `FINAL_TEST`.
- Số câu do BTC cấu hình.
- Hình thức: A, B, C, D.
- Ranking có thể được tạm ẩn ở cấp mùa trước hoặc trong Final Test.

---

# 4. Vai trò

## 4.1 Học viên

Học viên được phép:

- Xem danh sách bài kiểm tra của mùa hiện tại.
- Xem trạng thái từng bài.
- Vào phòng chờ khi bài đang mở phòng.
- Tham gia bài kiểm tra khi Admin bắt đầu.
- Late join từ câu đang ACTIVE nếu đủ điều kiện.
- Chọn A, B, C hoặc D.
- Đổi đáp án trong khi câu còn ACTIVE.
- Xem kết quả của bản thân theo cấu hình.
- Reload hoặc reconnect mà không tạo Attempt mới.

Học viên không được:

- Xem trước nội dung câu hỏi trên điện thoại.
- Xem đáp án đúng khi câu đang ACTIVE.
- Trả lời câu tương lai.
- Sửa câu đã khóa.
- Bắt đầu bài kiểm tra.
- Tạm dừng bài kiểm tra.
- Mở câu tiếp theo.
- Xem kết quả học viên khác.
- Tự thay đổi điểm.
- Truy cập bài của mùa khác.
- Gọi API để tạo nhiều Attempt trái phép.

## 4.2 Admin

Admin được phép:

- Tạo bài kiểm tra.
- Chỉnh sửa thông tin bài.
- Tạo và quản lý câu hỏi.
- Nhập bốn đáp án.
- Chọn đáp án đúng.
- Cấu hình điểm cho từng câu.
- Cấu hình `time_per_question` cho toàn bài.
- Mở hoặc đóng phòng chờ.
- Xem học viên trong phòng chờ.
- Bắt đầu bài.
- Mở câu tiếp theo.
- Theo dõi tiến trình.
- Kết thúc hoặc hủy bài.
- Xem kết quả.
- Download dữ liệu.
- Reset Attempt từng học viên.
- Tạm ẩn hoặc hiện Ranking của mùa.
- Xem Audit Log.

Admin không được:

- Chỉnh câu hỏi khi bài đã mở phòng chờ.
- Sửa đáp án đúng khi bài đang diễn ra.
- Xóa lịch sử Attempt đã phát sinh.
- Cộng điểm trùng.
- Reset mà không ghi lý do.

## 4.3 Màn hình TV / Presentation

Màn hình TV:

- Chỉ dùng để trình chiếu.
- Hiển thị câu hỏi.
- Hiển thị A, B, C, D.
- Hiển thị countdown.
- Hiển thị số lượng đã trả lời.
- Hiển thị đáp án đúng sau khi câu bị khóa.
- Không có quyền điều khiển nghiệp vụ.
- Không nhận danh sách học viên chi tiết.
- Không có quyền Reset, Start, Cancel hoặc Next.

---

# 5. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| Exam | Một bài kiểm tra |
| Question | Một câu hỏi |
| Attempt | Một lần làm bài của một học viên |
| Waiting Room | Phòng chờ trước khi bắt đầu |
| ACTIVE | Câu đang mở và được phép trả lời |
| LOCKED | Câu đã bị khóa |
| WAITING_NEXT | Đã khóa câu và đang chờ Admin mở câu tiếp |
| Late Join | Học viên tham gia khi bài đã bắt đầu |
| Submit | Thu bài và khóa toàn bộ đáp án |
| Reset Attempt | Vô hiệu hóa Attempt cũ và cho phép tạo Attempt mới |
| Ranking | Bảng xếp hạng cá nhân và nhóm |
| Season Membership | Tư cách tham gia của học viên trong một mùa |

---

# 6. Trạng thái bài kiểm tra

## 6.1 DRAFT

- Admin đang soạn bài.
- Chỉ Admin nhìn thấy.
- Học viên không thấy card.
- Có thể sửa toàn bộ nội dung.
- Có thể xóa nếu chưa có dữ liệu nghiệp vụ.

## 6.2 SCHEDULED

- Bài đã được lên lịch.
- Học viên thấy card.
- Chưa được vào phòng chờ.
- Có thể chỉnh lịch và nội dung nếu chưa mở phòng.

## 6.3 WAITING_ROOM_OPEN

- Học viên được phép vào phòng chờ.
- Câu hỏi bị khóa chỉnh sửa.
- Admin thấy danh sách học viên.
- Chưa hiển thị câu hỏi.
- Có thể đóng phòng chờ nếu bài chưa bắt đầu.

## 6.4 IN_PROGRESS

- Bài đang diễn ra.
- Câu hỏi được trình chiếu trên TV.
- Học viên trả lời câu ACTIVE.
- Late join được phép theo quy tắc.
- Không sửa câu hỏi hoặc đáp án đúng.

## 6.5 SUBMITTING

- Hệ thống đang thu bài và chấm điểm.
- Toàn bộ thao tác trả lời bị khóa.
- Không tạo Attempt mới.
- Reload vẫn quay lại màn hình thu bài.

## 6.6 COMPLETED

- Bài đã kết thúc.
- Kết quả đã chấm.
- Điểm đã được ghi nhận.
- Admin xem được báo cáo.
- Học viên xem kết quả theo `result_visibility`.

## 6.7 CANCELLED

- Bài bị hủy.
- Không nhận đáp án mới.
- Không cộng điểm.
- Attempt liên quan chuyển trạng thái phù hợp.
- Lịch sử vẫn được giữ lại.
- Có Audit Log.

---

# 7. Trạng thái câu hỏi realtime

Mỗi bài có một trạng thái câu hiện tại:

```text
WAITING
ACTIVE
LOCKED
WAITING_NEXT
COMPLETED
```

## WAITING

- Bài đã bắt đầu nhưng chưa mở câu đầu tiên.
- Học viên chờ.
- TV hiển thị trạng thái chuẩn bị.

## ACTIVE

- Câu hiện tại đang mở.
- Học viên được chọn hoặc đổi đáp án.
- Countdown hoạt động.
- Backend chấp nhận đáp án hợp lệ.

## LOCKED

- Hết thời gian hoặc Admin khóa câu.
- Backend không nhận đáp án mới.
- TV có thể hiển thị đáp án đúng.

## WAITING_NEXT

- Câu đã khóa.
- BTC có thể giải thích.
- Admin chủ động mở câu tiếp theo.

## COMPLETED

- Không còn câu tiếp theo.
- Hệ thống chuyển bài sang `SUBMITTING`.

---

# 8. Card bài kiểm tra phía học viên

Menu học viên:

```text
📝 Kiểm tra
```

Mỗi card gồm:

- Tên bài.
- Loại bài.
- Ngày giờ dự kiến.
- Số câu.
- Thời gian mỗi câu.
- Trạng thái.
- Nút hành động nếu phù hợp.

## DRAFT

- Không hiển thị.

## SCHEDULED

- Hiển thị “Sắp diễn ra”.
- Không bấm được.

## WAITING_ROOM_OPEN

- Hiển thị “Phòng chờ đang mở”.
- Có nút “Vào phòng chờ”.

## IN_PROGRESS

- Nếu đã có Attempt: có thể vào lại bài.
- Nếu chưa có Attempt: xử lý theo late join.
- Không hiển thị rằng học viên bị chặn mặc định.

## SUBMITTING

- Hiển thị “Đang thu bài”.
- Không cho sửa đáp án.

## COMPLETED

- Hiển thị “Đã kết thúc”.
- Có nút xem kết quả nếu cấu hình cho phép.

## CANCELLED

- Hiển thị “Đã hủy”.
- Không cho thao tác.

---

# 9. Phòng chờ học viên

Học viên được vào phòng chờ khi:

- Đã đăng nhập.
- Có Season Membership hợp lệ.
- Bài thuộc mùa hiện tại.
- Bài ở trạng thái `WAITING_ROOM_OPEN`.
- Chưa có Attempt đã hoàn thành mà chưa được Reset.

Màn hình hiển thị:

- Tên bài.
- Họ tên.
- Mã TKH.
- Nhóm.
- Trạng thái kết nối.
- Thông báo chờ BTC bắt đầu.

Khi Admin bắt đầu:

- Học viên tự động được chuyển sang màn hình làm bài.
- Backend tạo hoặc kích hoạt Attempt.
- Không yêu cầu học viên bấm Start.

---

# 10. Phòng chờ Admin

Admin nhìn thấy:

- Tổng học viên hợp lệ.
- Đã vào phòng.
- Chưa vào phòng.
- Online.
- Offline.
- Tên.
- Mã TKH.
- Nhóm.
- Thời gian vào.
- Trạng thái kết nối.
- Cảnh báo nhiều phiên nếu có.

Bộ lọc:

- Tên hoặc mã TKH.
- Nhóm.
- Đã vào hoặc chưa vào.
- Online hoặc Offline.

Nút:

- Mở phòng chờ.
- Đóng phòng chờ.
- Bắt đầu.
- Hủy bài.

---

# 11. Điều kiện bắt đầu bài

Admin chỉ được bắt đầu khi:

- Có ít nhất một câu hỏi.
- Mỗi câu có đúng bốn đáp án.
- Mỗi câu có đúng một đáp án đúng.
- Mỗi câu có điểm hợp lệ.
- `time_per_question > 0`.
- Bài đang ở `WAITING_ROOM_OPEN`.
- Không có bài khác đang `IN_PROGRESS` trong cùng mùa.

Khi Admin bấm “Bắt đầu”:

1. Hiển thị popup xác nhận.
2. Khóa chỉnh sửa câu hỏi.
3. Ghi thời điểm bắt đầu.
4. Chuyển Exam sang `IN_PROGRESS`.
5. Tạo Attempt cho học viên hợp lệ trong phòng chờ.
6. Tạo hoặc cập nhật live state.
7. Phát sự kiện realtime.
8. Chuyển hệ thống sang trạng thái chờ mở câu đầu tiên.
9. Admin mở câu đầu tiên.

---

# 12. Quy tắc thời gian

Module dùng một giá trị chung cho mỗi bài:

```text
exams.time_per_question
```

Ví dụ:

```text
20 giây / câu
```

Không có thời gian riêng trên từng câu trong V1.

Backend là nguồn thời gian chính.

Khi Admin mở câu:

- Backend lưu `question_started_at`.
- Backend tính và lưu `question_ends_at`.
- Frontend nhận `serverNow` và `questionEndsAt`.
- Frontend chỉ dùng để hiển thị countdown.

Không được dựa vào:

- `setInterval` làm nguồn thật.
- Đồng hồ điện thoại.
- Thời gian do học viên gửi.

---

# 13. Luồng câu hỏi

Luồng chính thức:

```text
Admin mở câu
    ↓
Câu chuyển ACTIVE
    ↓
Server countdown
    ↓
Hết thời gian
    ↓
Server khóa câu
    ↓
Câu chuyển LOCKED
    ↓
TV hiển thị đáp án đúng
    ↓
WAITING_NEXT
    ↓
Admin mở câu tiếp theo
```

Không tự động chuyển ngay sang câu tiếp theo.

Lý do:

- BTC có thể giải thích đáp án.
- Có thời gian xử lý sự cố.
- Tránh bài chạy quá nhanh.
- Admin kiểm soát tốt hơn trong chương trình trực tiếp.

---

# 14. Màn hình học viên

Học viên không thấy nội dung câu hỏi trên điện thoại.

Học viên thấy:

- Tên bài.
- Câu hiện tại.
- Tổng số câu.
- Countdown.
- Danh sách số câu.
- Nút A, B, C, D.
- Trạng thái đã gửi.
- Trạng thái khóa.
- Cảnh báo mất kết nối.

Chỉ câu `ACTIVE` được phép trả lời.

Học viên có thể:

- Chọn đáp án.
- Đổi đáp án khi còn thời gian.
- Thấy đáp án mình đã chọn ở câu cũ.
- Thấy câu nào chưa trả lời.

Học viên không thể:

- Trả lời câu tương lai.
- Sửa câu cũ.
- Xem nội dung câu trên điện thoại.
- Xem đáp án đúng khi đang thi.

---

# 15. Gửi và chấp nhận đáp án

Đáp án được gửi bằng REST API.

Socket.IO không dùng để submit đáp án trong V1.

Luồng:

```text
Học viên bấm A/B/C/D
    ↓
Frontend gửi REST request
    ↓
Backend validate
    ↓
Upsert đáp án
    ↓
Commit transaction
    ↓
Backend trả xác nhận
    ↓
Socket.IO cập nhật answered count cho Admin/TV
```

Backend chỉ chấp nhận khi:

- Identity lấy từ token hợp lệ.
- Attempt thuộc học viên.
- Attempt đang `IN_PROGRESS`.
- Exam đang `IN_PROGRESS`.
- Question đúng câu ACTIVE.
- Server time chưa vượt `question_ends_at`.
- Lựa chọn là A/B/C/D.
- Học viên đủ điều kiện tham gia.

Chỉ đáp án cuối cùng hợp lệ được dùng để chấm.

Frontend không được hiển thị “Đã lưu” nếu Backend chưa xác nhận.

---

# 16. Màn hình Admin và TV

## 16.1 Admin

Admin thấy:

- Tên bài.
- Số câu hiện tại.
- Nội dung câu.
- A, B, C, D.
- Countdown.
- Số đã trả lời.
- Số đang kết nối.
- Trạng thái câu.
- Nút mở câu tiếp theo.

## 16.2 TV

TV thấy:

- Nội dung câu.
- A, B, C, D.
- Countdown.
- Số đã trả lời.
- Đáp án đúng sau khi khóa.

TV không được:

- Bắt đầu bài.
- Hủy bài.
- Reset.
- Mở câu tiếp theo.
- Xem danh sách học viên chi tiết.

---

# 17. Late Join

Late join được phép trong V1.

Điều kiện:

- Học viên đã đăng nhập.
- Có Season Membership hợp lệ.
- Bài đang `IN_PROGRESS`.
- Bài chưa `SUBMITTING`.
- Còn câu hiện tại hoặc câu tiếp theo.
- Chưa có Attempt active khác trái phép.

Luồng:

1. Backend xác định live state.
2. Tạo Attempt nếu chưa có.
3. Ghi `is_late_join = 1`.
4. Ghi `joined_question_index`.
5. Các câu trước được xem là đã khóa và không trả lời.
6. Nếu câu hiện tại còn thời gian, học viên có thể trả lời câu hiện tại.
7. Không cộng thêm thời gian riêng.
8. Admin nhận thông báo late join.
9. Ghi Audit Log.

Late join không yêu cầu Admin bật riêng trong V1.

---

# 18. Reload, reconnect và mất mạng

## 18.1 Reload

Khi học viên reload:

- Xác thực lại.
- Tìm Attempt hiện tại.
- Không tạo Attempt mới.
- Đọc live state.
- Đưa về đúng màn hình.
- Không mở lại câu đã khóa.

## 18.2 Mất kết nối

- Đáp án đã lưu vẫn được giữ.
- Frontend hiển thị cảnh báo.
- Socket.IO tự reconnect.
- Backend đồng bộ lại Exam, Question, time và answer.
- Không cộng thêm thời gian.

## 18.3 Mất mạng đến hết bài

- Backend chấm theo đáp án đã nhận.
- Câu chưa gửi được tính là không trả lời.

## 18.4 Server restart

- Backend đọc Exam status.
- Đọc live state.
- So sánh thời gian hiện tại với `question_ends_at`.
- Phục hồi hoặc khóa câu đúng trạng thái.
- Client reconnect nhận `sync:state`.

---

# 19. Nhiều tab hoặc nhiều thiết bị

Một học viên chỉ có một phiên thi chính thức có quyền điều khiển tại một thời điểm.

Quy tắc:

```text
Kết nối mới nhất giữ quyền điều khiển.
Kết nối cũ chuyển sang chỉ xem hoặc bị ngắt.
```

Backend:

- Không tạo Attempt mới.
- Có thể ghi cảnh báo nhiều phiên.
- Không tự động hủy bài chỉ vì mở lại trình duyệt.

---

# 20. Tự động Submit

Bài chuyển sang Submit khi:

- Câu cuối đã bị khóa và Admin kết thúc.
- Admin chủ động kết thúc sớm.
- Backend xác nhận toàn bộ câu đã đóng.

Luồng:

1. Chuyển Exam sang `SUBMITTING`.
2. Khóa toàn bộ đáp án.
3. Chuyển Attempt sang `SUBMITTING`.
4. Ghi thời gian Submit.
5. Chấm điểm.
6. Ghi kết quả.
7. Tạo điểm chính thức.
8. Cập nhật ranking.
9. Chuyển Attempt sang `COMPLETED`.
10. Chuyển Exam sang `COMPLETED`.
11. Phát sự kiện realtime.

Submit phải idempotent:

```text
Một Attempt chỉ được chấm và cộng điểm chính thức một lần.
```

---

# 21. Chấm điểm

Mỗi câu có:

- Một đáp án đúng.
- Số điểm không âm.

Ví dụ:

```text
10 câu × 10 điểm = 100 điểm
```

Hoặc BTC có thể cấu hình điểm khác nhau cho từng câu.

Không chấm điểm theo tốc độ trong V1.

Kết quả gồm:

- Tổng câu.
- Đúng.
- Sai.
- Không trả lời.
- Tổng điểm tối đa.
- Điểm đạt được.
- Thời gian bắt đầu.
- Thời gian Submit.
- Late join hay không.
- Câu bắt đầu tham gia.

Backend là nơi chấm điểm chính thức.

---

# 22. Ghi điểm vào hệ thống

Sau khi hoàn tất:

- Pre-test ghi loại `PRE_TEST`.
- Final Test ghi loại `FINAL_TEST`.
- Điểm gắn với `season_membership_id`.
- Điểm cá nhân được cập nhật.
- Điểm nhóm được tính theo business chung của hệ thống.
- Lịch sử điểm ghi nguồn.

Bảng điểm cần có nguồn:

```text
source_type = TEST_ATTEMPT
source_id = attempt_id
```

Ràng buộc chống trùng:

```text
Một source_type + source_id chỉ tạo một điểm chính thức.
```

Không tự chốt công thức ranking nhóm trong Module Test nếu business điểm nhóm chung chưa khóa.

---

# 23. Kết quả học viên

Sau khi bài hoàn thành, kết quả hiển thị theo:

```text
result_visibility
```

Các giá trị:

## HIDDEN

- Học viên chưa thấy kết quả.
- Admin vẫn thấy.

## SCORE_ONLY

- Học viên thấy:
  - Tổng điểm.
  - Số câu đúng.
  - Số câu sai.
  - Số câu không trả lời.
- Không thấy đáp án đúng chi tiết.

## FULL_RESULT

- Học viên thấy:
  - Điểm.
  - Đúng/sai từng câu.
  - Chi tiết theo cấu hình.
- Không nhất thiết hiển thị đáp án đúng nếu BTC không cho phép.

Đề xuất TKH 2026:

```text
Pre-test: SCORE_ONLY
Final Test: HIDDEN
```

cho đến khi BTC công bố.

---

# 24. Ranking

Ranking visibility thuộc cấp mùa:

```text
season_settings
```

Khi Ranking bị ẩn:

- Học viên không thấy ranking cá nhân.
- Học viên không thấy ranking nhóm.
- Card ranking hiển thị thông báo.
- Admin vẫn xem đầy đủ.
- Điểm vẫn được tính.
- Dữ liệu không bị xóa.

Thông báo:

```text
Bảng xếp hạng đang được BTC tạm ẩn.
Kết quả sẽ được công bố sau.
```

Không dùng `exams.ranking_hidden` làm nguồn chính.

---

# 25. Chống làm bài trùng

Một học viên chỉ có một Attempt active cho mỗi bài tại một thời điểm.

Không cho:

- Nhiều tab tạo nhiều Attempt.
- Submit nhiều lần để cộng điểm trùng.
- Làm lại sau khi đã hoàn thành nếu chưa Reset.
- Gọi API trực tiếp để tạo Attempt mới trái phép.

Nếu Reset:

- Attempt cũ được giữ.
- Attempt cũ chuyển `RESET`.
- Attempt mới tăng `attempt_no`.

---

# 26. Reset Attempt

Reset dùng khi:

- Lỗi kỹ thuật nghiêm trọng.
- Mất kết nối nghiêm trọng.
- Dữ liệu Attempt lỗi.
- BTC xác nhận cho làm lại.

Quy trình:

1. Không xóa Attempt cũ.
2. Đánh dấu Attempt cũ là `RESET`.
3. Ghi Admin thực hiện.
4. Ghi thời gian.
5. Ghi lý do.
6. Nếu có điểm cũ, đánh dấu `VOIDED` hoặc `REVERSED`.
7. Ghi Audit Log.
8. Cho phép tạo Attempt mới với `attempt_no` tăng thêm.

Không reset hàng loạt trong V1.

---

# 27. Hủy bài

Admin có thể hủy khi:

- Chưa bắt đầu.
- Có lỗi nghiêm trọng.
- BTC quyết định tổ chức lại.

Nếu đang `IN_PROGRESS`:

1. Hiển thị popup xác nhận.
2. Khóa nhận đáp án.
3. Exam chuyển `CANCELLED`.
4. Attempt active chuyển `CANCELLED`.
5. Không cộng điểm.
6. Ghi Audit Log.
7. Giữ lịch sử.

Không sửa dữ liệu lần hủy thành một bài mới.

---

# 28. Download dữ liệu

Admin có thể tải Excel.

## Sheet 1 — Kết quả học viên

- Mã TKH.
- Họ tên.
- Nhóm.
- Bài kiểm tra.
- Attempt number.
- Late join.
- Joined question index.
- Số đúng.
- Số sai.
- Số bỏ trống.
- Tổng điểm.
- Trạng thái.
- Started at.
- Submitted at.

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
- Event.
- Thời gian.
- Chi tiết.

## Sheet 4 — Audit Reset

- Mã TKH.
- Họ tên.
- Bài.
- Attempt cũ.
- Attempt mới.
- Admin Reset.
- Thời gian.
- Lý do.

Tên file:

```text
TKH2026_Test_PreTest1_YYYYMMDD_HHmm.xlsx
```

---

# 29. Realtime

Realtime dùng Socket.IO.

Rooms:

```text
exam:{examId}
exam:{examId}:admin
exam:{examId}:presentation
```

Realtime dùng cho:

- Mở phòng chờ.
- Bắt đầu bài.
- Mở câu.
- Khóa câu.
- Answer count.
- Submitting.
- Completed.
- Cancelled.
- Late join.
- Reconnect.
- Sync state.

REST dùng cho:

- Tạo bài.
- Sửa bài.
- Câu hỏi.
- Gửi đáp án.
- Start.
- Next question.
- Cancel.
- End.
- Reset.
- Báo cáo.
- Download.
- Ranking visibility.
- Result visibility.

---

# 30. Backend là nguồn trạng thái chính

Backend quyết định:

- Exam status.
- Live state.
- Câu ACTIVE.
- Thời gian bắt đầu và kết thúc.
- Đáp án có hợp lệ không.
- Attempt có hợp lệ không.
- Điểm chính thức.
- Result visibility.
- Ranking visibility.
- Reset và Void.
- Audit Log.

Frontend chỉ:

- Hiển thị.
- Gửi thao tác.
- Chờ xác nhận.
- Đồng bộ lại khi reconnect.

---

# 31. Quy tắc chỉnh sửa

## DRAFT

- Được sửa toàn bộ.

## SCHEDULED

- Được sửa nếu chưa mở phòng chờ.
- Cảnh báo khi đổi lịch.

## WAITING_ROOM_OPEN

- Không sửa câu hỏi.
- Không sửa đáp án.
- Có thể đóng phòng chờ để quay lại cấu hình nếu chưa bắt đầu.

## IN_PROGRESS

- Không sửa nội dung.
- Không sửa đáp án đúng.
- Không sửa điểm.
- Không đổi thứ tự câu.

## COMPLETED

- Chỉ xem.
- Mọi thay đổi kết quả phải qua nghiệp vụ riêng và Audit Log.

---

# 32. Quy tắc câu hỏi

V1:

- Trắc nghiệm một đáp án đúng.
- Đúng bốn lựa chọn A, B, C, D.
- Một `correct_answer`.
- Question text bắt buộc.
- Điểm không âm.
- Thứ tự không trùng trong cùng bài.
- Không có time riêng từng câu.
- Không sửa từ lúc mở phòng chờ.

---

# 33. Bảo mật và quyền riêng tư

- Học viên chỉ xem Attempt của mình.
- Không gửi nội dung câu xuống điện thoại học viên.
- Không gửi đáp án đúng khi đang thi.
- Không tin `memberId` hoặc `attemptId` từ frontend.
- Identity lấy từ token.
- Không truy cập mùa khác.
- Không sửa câu đã khóa.
- Admin endpoint kiểm tra role.
- Presentation token chỉ có quyền đọc.
- Ghi Audit Log.
- Rate limit API trả lời.
- Không lưu password hoặc token trong log.
- Không emit thành công trước khi transaction commit.

---

# 34. Business Rules

## BR-001

Một học viên chỉ có một Attempt active cho mỗi Exam tại một thời điểm.

## BR-002

Attempt được liên kết qua `season_membership_id`.

## BR-003

Chỉ câu `ACTIVE` được phép trả lời.

## BR-004

Backend từ chối đáp án sau `question_ends_at`.

## BR-005

Học viên được đổi đáp án khi câu còn ACTIVE.

## BR-006

Đáp án cuối cùng hợp lệ được dùng để chấm.

## BR-007

Không có thời gian riêng từng câu trong V1.

## BR-008

Server tự khóa câu khi hết giờ.

## BR-009

Admin chủ động mở câu tiếp theo.

## BR-010

Late join bắt đầu từ câu đang ACTIVE.

## BR-011

Late join không được thêm thời gian.

## BR-012

Câu trước late join được xem là không trả lời.

## BR-013

Submit và cộng điểm phải idempotent.

## BR-014

Điểm chính thức chỉ được tạo một lần cho mỗi Attempt hợp lệ.

## BR-015

Reset không xóa Attempt cũ.

## BR-016

Reset tạo Attempt mới với `attempt_no` tăng thêm.

## BR-017

Ranking visibility thuộc `season_settings`.

## BR-018

Result visibility thuộc từng Exam.

## BR-019

Không hard delete lịch sử Attempt.

## BR-020

Thao tác quan trọng phải có Audit Log.

---

# 35. Decision Log

| ID | Quyết định |
|---|---|
| DEC-001 | Database dùng SQL Server |
| DEC-002 | Primary key dùng INT IDENTITY |
| DEC-003 | Liên kết học viên qua season_membership_id |
| DEC-004 | Countdown dùng một time_per_question cho toàn bài |
| DEC-005 | Answer gửi qua REST |
| DEC-006 | Realtime dùng Socket.IO |
| DEC-007 | Server tự khóa câu |
| DEC-008 | Admin mở câu tiếp theo |
| DEC-009 | Late join được phép |
| DEC-010 | TV và Admin tách quyền/room |
| DEC-011 | Runtime state lưu trong database |
| DEC-012 | Ranking visibility thuộc season settings |
| DEC-013 | Result visibility có HIDDEN, SCORE_ONLY, FULL_RESULT |
| DEC-014 | Reset giữ Attempt cũ |
| DEC-015 | Không chấm điểm theo tốc độ trong V1 |

---

# 36. Tiêu chí hoàn thành

Module hoàn thành khi:

- Admin tạo được Exam.
- Admin tạo đủ câu hỏi.
- Validation ngăn cấu hình sai.
- Học viên thấy card đúng trạng thái.
- Phòng chờ hoạt động.
- Admin thấy danh sách chờ.
- Bắt đầu đồng bộ nhiều thiết bị.
- Countdown dùng Backend time.
- Học viên chỉ trả lời câu ACTIVE.
- Hết giờ tự khóa.
- Admin mở câu tiếp theo.
- Late join hoạt động.
- Reload không mất Attempt.
- Reconnect hoạt động.
- Server restart có thể phục hồi.
- Submit tự động.
- Chấm điểm chính xác.
- Không cộng điểm trùng.
- Result visibility đúng.
- Ranking ẩn/hiện đúng.
- Download được.
- Reset có Audit Log.
- Test trên Android, iPhone và máy tính.

---

# 37. Freeze Checklist

- [x] Business flow đã thống nhất.
- [x] UI flow có thể triển khai.
- [x] Database có thể map nghiệp vụ.
- [x] Realtime có thể map state.
- [x] Late join đã chốt.
- [x] Countdown đã chốt.
- [x] Chuyển câu đã chốt.
- [x] Result visibility đã chốt.
- [x] Ranking visibility đã chốt.
- [x] Reset Attempt đã chốt.
- [x] Audit Log đã chốt.
- [x] Không còn mâu thuẫn chính.

---

# 38. Trạng thái tài liệu

```text
MODULE TEST BUSINESS DESIGN
STATUS: FROZEN
READY FOR UI / DATABASE / REALTIME / API IMPLEMENTATION
```

Previous document:

```text
TKH-2026-PROJECT-HANDOFF-V2.md
```

Next document:

```text
test-module-ui-design.md
```
