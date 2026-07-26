# TKH 2026 — PROJECT STATUS

**Ngày cập nhật:** 26/07/2026
**Mục tiêu:** Là nguồn trạng thái duy nhất để không làm lại những phần đã hoàn thành và đã kiểm thử.

## Quy ước trạng thái

- ✅ **HOÀN THÀNH/PASS:** Đã code, đã kết nối và đã kiểm thử thực tế.
- 🟡 **ĐÃ CÓ NHƯNG CHƯA CHỐT:** Đã có code hoặc một phần luồng chạy được, nhưng còn việc bắt buộc trước khi được xem là hoàn thành.
- ⬜ **CHƯA TRIỂN KHAI:** Có thể đã có tài liệu thiết kế, nhưng chưa code đầy đủ.

## 1. Các quyết định đã chốt

- Kiến trúc Backend: `Repository → Service → Controller → Routes`.
- Database: SQL Server; dữ liệu theo mùa, TKH 2026 là mùa đang hoạt động.
- Tám nhóm chính thức: Ti-mô-thê, Ca-lép, Sa-ra, Giô-na-than, Nê-hê-mi, Ma-ri, Giê-rê-mi, Ê-xơ-ra.
- Ưu tiên hoàn thành tính năng; UI/animation chỉ làm khi còn thời gian.
- Không refactor hoặc kiểm thử lại phần đã PASS nếu code liên quan không thay đổi.
- Module Test dùng một engine chung cho cả `PRE_TEST` và `FINAL_TEST`; không xây hai hệ thống riêng.
- Ưu tiên triển khai Pre-test trước. Final Test dùng lại engine chung và hoàn thiện sau vì diễn ra cuối chương trình.
- QR Kết Ước triển khai sau cùng trong nhóm tính năng.

## 2. Trạng thái hiện tại

| Hạng mục | Trạng thái | Mốc đã xác nhận / phần còn thiếu |
|---|---:|---|
| Phân tích nghiệp vụ, UI/UX, database design | ✅ | Các quyết định chính đã được freeze. |
| Frontend V1 | ✅ | Đầy đủ màn hình demo/responsive; việc chuyển từng màn hình từ `localStorage` sang API vẫn theo từng module. |
| Backend Core, Health, SQL Server, JWT | ✅ | Health Backend, health database và đăng nhập nhận access token đã PASS. |
| Authentication / Current User | ✅ | Frontend đăng nhập bằng API và lưu JWT. |
| Sessions — tạo, danh sách, mở, kết thúc | ✅ | Frontend và Backend đã kết nối. |
| Sessions — xóa | ✅ | ID sai `400`; không tồn tại `404`; đang mở `409`; có dữ liệu liên quan bị bảo vệ; buổi DRAFT chưa phát sinh dữ liệu xóa thành công và không xuất hiện lại sau refresh. Không kiểm thử lại. |
| Attendance/GPS — luồng cốt lõi | ✅ | Backend và luồng điểm danh chính đã hoạt động; các màn hình phụ còn dùng demo được xử lý trong đợt hoàn thiện integration. |
| Bible Challenge | ✅ | Backend/API và Frontend đã kết nối; random nhóm/thành viên, lịch sử và thao tác chấm điểm cốt lõi hoạt động. |
| Questions | ✅ | Các API chính và Frontend đã kết nối, kiểm thử thực tế. |
| Encouragement | ✅ | Gửi, danh sách người nhận, inbox, summary, đánh dấu đã đọc, ghim/bỏ ghim và ẩn danh đã hoạt động; refresh vẫn giữ dữ liệu. |
| Tổng giao dịch điểm cá nhân | ✅ | `/api/scores/me` và giao diện đã đọc tổng/lịch sử từ Backend. |
| Tổng điểm nhóm và xếp hạng nhóm | ✅ | Backend đã trả `individualPoints`, `groupPoints`, `totalPoints`; Frontend đã đọc điểm nhóm/lịch sử/xếp hạng. Công thức hiện tại: điểm cá nhân của thành viên trong nhóm + điểm cộng trực tiếp cho nhóm. |
| Điểm chính thức không vượt điểm trần | 🟡 | `score-calculator.js` đã có `clamp()` cho từng thành phần và điểm tổng kết. Tuy nhiên luồng tổng giao dịch hiện tại và luồng điểm có trần đang tồn tại song song; cần hợp nhất API/nguồn hiển thị và test biên trước khi chốt. |
| Công thức điểm tổng kết chính thức | 🟡 | Đã có bộ tính Chuyên cần + Học tập + Rèn luyện và giới hạn điểm tổng; chưa xác nhận đây là nguồn duy nhất được Dashboard/Ranking sử dụng. |
| Admin Score toàn bộ | 🟡 | Thêm điểm cá nhân/nhóm và các API đọc đã có; còn chốt một mô hình điểm duy nhất, thay hết phần demo còn sót và kiểm thử end-to-end. |
| Pre-test | ⬜ | Tài liệu Business/UI/Database/API/Realtime đã freeze; chưa triển khai engine đầy đủ. |
| Final Test | ⬜ | Dùng chung engine với Pre-test; chỉ khác loại bài, cấu hình hiển thị kết quả/ranking và thời điểm sử dụng. Hoàn thiện sau Pre-test. |
| QR Kết Ước | ⬜ | Tài liệu thiết kế đã hoàn thành; chưa triển khai Backend/Frontend thật. Là tính năng làm sau cùng. |
| System Testing nhiều thiết bị | ⬜ | Thực hiện sau khi hoàn tất các tính năng. |
| Production Deploy | ⬜ | Thực hiện sau system testing. |

## 3. Kết luận riêng về logic điểm

### 3.1 Tổng điểm cá nhân

Đã hoàn thành đối với **tổng giao dịch điểm hiện tại**: Backend cộng các giao dịch hợp lệ và Frontend hiển thị tổng/lịch sử.

Chưa được xem là hoàn thành đối với **điểm tổng kết chính thức có trọng số và điểm trần**, vì cần bảo đảm Dashboard, trang Điểm cá nhân và Ranking đều đọc cùng một kết quả từ `score-calculator`.

### 3.2 Điểm nhóm

Đã có và đang tính theo:

```text
Tổng điểm nhóm
= Tổng điểm cá nhân của các thành viên thuộc nhóm
+ Điểm được cộng trực tiếp cho nhóm
```

Backend đã tách rõ:

- `individualPoints`
- `groupPoints`
- `totalPoints`

Phần cần xác nhận khi chốt Score là `individualPoints` sẽ lấy **tổng giao dịch thô** hay **điểm tổng kết chính thức sau giới hạn**. Chỉ được chọn một quy tắc làm nguồn chính.

### 3.3 Không vượt điểm trần

Code tính giới hạn đã tồn tại:

- Giới hạn từng hạng mục.
- Giới hạn tổng Học tập.
- Giới hạn tổng Rèn luyện.
- Giới hạn Chuyên cần.
- Giới hạn điểm Tổng kết.

Nhưng chưa chốt hoàn toàn vì còn hai đường đọc/tính điểm. Bước tiếp theo phải hợp nhất chúng và test các trường hợp:

1. Dưới điểm trần.
2. Đúng điểm trần.
3. Cộng vượt điểm trần.
4. Điểm âm/điều chỉnh làm tổng dưới 0.
5. Nhiều giao dịch cùng nguồn không được cộng trùng.
6. Tổng điểm nhóm và ranking cập nhật đúng sau khi điểm cá nhân thay đổi.

Sau khi sáu trường hợp này PASS, chốt:

> **Score — điểm trần, tổng điểm cá nhân và tổng điểm nhóm: HOÀN THÀNH.**

## 4. Roadmap tiếp theo

### Bước 0 — Lưu mốc Sessions

- Commit thay đổi Frontend nối nút Xóa buổi học với Backend.
- Không quay lại Sessions trừ khi có thay đổi code liên quan hoặc regression.

### Bước 1 — Chốt Score Foundation

- Chọn một nguồn điểm chính thức duy nhất.
- Nối `score-calculator` vào đúng API mà Dashboard, Điểm cá nhân và Ranking đang dùng.
- Xác định rõ điểm nhóm dùng tổng thô hay điểm tổng kết sau trần.
- Test sáu trường hợp ở mục 3.3.
- Cập nhật Project Status thành ✅ sau khi PASS.

Lý do làm trước Test: Pre-test và Final Test đều sinh giao dịch điểm. Nếu nền điểm chưa chốt, Test Module sẽ phải sửa lại sau.

### Bước 2 — Pre-test ưu tiên

Xây engine chung, nhưng nghiệm thu trước cho ba Pre-test:

1. Exam CRUD và quản lý câu hỏi.
2. Waiting room.
3. Admin start/next/end.
4. Realtime Socket.IO.
5. Countdown lấy thời gian từ Backend.
6. Điện thoại chỉ chọn A/B/C/D; TV/Admin hiển thị câu hỏi.
7. Late join từ câu đang ACTIVE.
8. Auto-submit, auto-score.
9. Chống nộp/cộng điểm trùng.
10. Ghi một official score transaction duy nhất.
11. Result visibility mặc định của Pre-test: `SCORE_ONLY`.

### Bước 3 — Hoàn tất các integration vận hành còn sót

- Admin Score và Dashboard dùng API hoàn toàn.
- Members/Groups/Import Excel.
- Profile/đổi mật khẩu.
- Study Materials.
- Schedule ảnh.
- Các màn hình phụ Attendance/Export còn dùng dữ liệu demo.

Chỉ xử lý phần còn `localStorage`; không viết lại module đã chạy bằng API.

### Bước 4 — Final Test

- Dùng lại toàn bộ engine của Pre-test.
- Không tạo schema/API/realtime engine thứ hai.
- Bổ sung hoặc nghiệm thu cấu hình dành cho `FINAL_TEST`.
- Kết quả mặc định `HIDDEN` cho đến khi BTC công bố.
- Ranking theo `season_settings`, không dùng `exams.ranking_hidden` làm nguồn chính.

### Bước 5 — QR Kết Ước

- Triển khai theo các tài liệu đã freeze.
- Năm QR; render `{{memberName}}`; mỗi học viên chỉ một Covenant ACTIVE trong một mùa.
- Quét thành công thì lưu nội dung đã render và khóa quét mã khác.
- Admin có thống kê/reset có lý do/audit.

### Bước 6 — System Testing và Deploy

- Test nhiều tài khoản, nhiều thiết bị và đồng thời.
- Test Attendance → Score → Bible Challenge → Pre-test/Final Test → Ranking → Dashboard.
- Kiểm tra timezone Việt Nam, GPS 200 m, dữ liệu mùa, phân quyền và idempotency.
- Backup database, cấu hình production, deploy Backend/Frontend, SSL và smoke test.

## 5. Quy tắc chống làm lại

- Mỗi phần chỉ được đánh dấu ✅ khi đã code + kết nối + test thực tế.
- Không yêu cầu test lại một case đã PASS nếu code phụ thuộc không thay đổi.
- Nếu thay đổi code có ảnh hưởng, chỉ regression-test phạm vi bị ảnh hưởng.
- Mỗi lần hoàn thành một module phải cập nhật file này ngay: kết quả PASS, phạm vi đã chốt và bước kế tiếp duy nhất.
- Tài liệu thiết kế hoàn thành không đồng nghĩa module đã được triển khai.

## 6. Bước kế tiếp duy nhất

> **Commit phần Sessions — Xóa, sau đó chốt Score Foundation: điểm trần, tổng điểm cá nhân và tổng điểm nhóm.**

Chưa bắt đầu Pre-test trước khi Score Foundation được chốt, vì Pre-test sẽ ghi điểm vào cùng hệ thống.
