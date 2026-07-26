# TKH 2026 — PROJECT STATUS

Cập nhật: 26/07/2026
Branch hiện tại: `feat/frontend-backend-integration`

## 1. Mục đích

Đây là nguồn trạng thái chính thức duy nhất của dự án TKH 2026.

Trước khi tiếp tục dự án hoặc mở chat mới, phải đọc file này để tránh:

- Làm lại module đã hoàn thành.
- Kiểm tra API hoặc database lặp lại.
- Tự ý thay đổi roadmap, database hoặc business rule.
- Refactor những phần đang hoạt động khi không cần thiết.

## 2. Quy tắc FROZEN

Module có trạng thái `FROZEN` không được kiểm tra hoặc viết lại, ngoại trừ:

1. Người dùng hoặc BTC báo lỗi cụ thể.
2. Thay đổi hiện tại tác động trực tiếp đến module đó.
3. Thực hiện một lần smoke test trước khi deploy.

Không được quay lại test API, SSMS hoặc migration của module `FROZEN` chỉ để xác nhận lại tiến độ.

## 3. Trạng thái hiện tại

| Module | Backend | Frontend–Backend | Trạng thái |
|---|---|---|---|
| Health API / SQL Server | Hoàn thành | Không áp dụng | FROZEN |
| JWT Authentication | Hoàn thành | Hoàn thành luồng đăng nhập | FROZEN |
| Bible Challenge | Hoàn thành | Frontend demo vẫn còn phần localStorage cần kiểm kê | BACKEND FROZEN |
| Question | API đã hoàn thành và test | Chưa xác nhận tích hợp hoàn chỉnh | BACKEND FROZEN |
| Encouragement | Hoàn thành và đã test | Send, recipients, inbox, read, pin và anonymous đã hoạt động | FROZEN |
| Session / Attendance | Có database và phần hỗ trợ Bible Challenge | Frontend chủ yếu còn demo/localStorage | INTEGRATION PENDING |
| Score cá nhân / nhóm | Có database và score transaction | Chưa tích hợp hoàn chỉnh | INTEGRATION PENDING |
| QR Kết Ước | Thiết kế và business đã đóng băng | Chưa triển khai backend | IMPLEMENTATION PENDING |
| Module Kiểm tra | Bộ tài liệu thiết kế đã đóng băng | Chưa triển khai code | IMPLEMENTATION PENDING |
| Lịch học / Kho tài liệu / Import | Frontend V1 đã có | Chưa chuyển đầy đủ sang API/database | PENDING |

## 4. Bible Challenge — chốt hoàn thành

Bible Challenge Backend đã hoàn thành và không được test lại nếu không có lỗi mới.

Đã xác nhận:

- Quay nhóm và học viên hợp lệ.
- Chỉ sử dụng học viên đã điểm danh.
- Không trùng nhóm trong vòng và không trùng học viên trong buổi.
- Ghi lịch sử Bible Challenge.
- Ghi `score_transactions`.
- Liên kết bằng `source_type`, `source_id` và `source_key`.
- Giới hạn điểm hoạt động đúng.
- Transaction nguyên tử đã được bổ sung.

Commit hoàn thành Backend:

`0984c04 - feat: complete Bible Challenge backend module`

Commit transaction nguyên tử:

`3a0c838 - fix: make Bible Challenge result submission atomic`

Trạng thái chính thức: `FROZEN`.

## 5. Encouragement — trạng thái gần nhất

Đã hoạt động qua Backend và SQL Server:

- Danh sách người nhận.
- Gửi lời khích lệ.
- Gửi ẩn danh.
- Inbox.
- Summary.
- Đánh dấu đã đọc.
- Ghim và bỏ ghim.
- Refresh vẫn giữ dữ liệu.

Thời gian hiển thị đã được xác nhận đúng:

- API trả thời gian UTC có ký hiệu `Z`.
- Frontend dùng `new Date(item.createdAt)` để tự chuyển sang giờ Việt Nam UTC+7.
- Không cần sửa Backend, SQL Server hoặc helper thời gian dùng cho module khác.

Trạng thái chính thức: `FROZEN`.

## 6. LocalStorage

Frontend V1 đã hoàn thành về giao diện và luồng demo, nhưng nhiều phần vẫn sử dụng `localStorage`.

Dữ liệu `localStorage`:

- Chỉ tồn tại trên từng trình duyệt hoặc từng máy.
- Không đồng bộ giữa các máy BTC.
- Không được xem là dữ liệu thật khi deploy Alpha.

Cần kiểm kê một lần để phân loại:

- Đã dùng API/database.
- Chỉ dùng localStorage.
- Dùng localStorage hợp lệ cho token hoặc trạng thái giao diện.

Việc kiểm kê không đồng nghĩa với test lại module đã `FROZEN`.

## 7. Phạm vi BTC Alpha 0.1

Mục tiêu Alpha 0.1 là kiểm tra kỹ thuật nhiều máy với dữ liệu test.

Phạm vi tối thiểu:

- Đăng nhập Admin và học viên.
- Danh sách người nhận lời khích lệ.
- Gửi và nhận lời khích lệ.
- Gửi ẩn danh.
- Đọc/chưa đọc.
- Ghim/bỏ ghim.
- Dữ liệu còn sau refresh.
- Dữ liệu đồng bộ giữa nhiều máy.

Các tính năng còn dùng localStorage chỉ được xem là giao diện demo và chưa thuộc phạm vi kiểm thử dữ liệu nhiều máy.

## 8. Điều kiện deploy Alpha 0.1

Cần hoàn tất:

1. Đóng băng Encouragement Integration.
2. Xử lý hoặc ghi nhận chính thức lỗi thời gian.
3. Chuyển API URL khỏi `localhost:5000` sang cấu hình môi trường.
4. Có Backend HTTPS công khai.
5. Có database staging mà Backend công khai truy cập được.
6. Cấu hình CORS cho domain Frontend.
7. Tạo tài khoản và dữ liệu test.
8. Smoke test một lần trước khi giao BTC.

Không sử dụng dữ liệu thành viên thật trong Alpha 0.1.

## 9. Roadmap tiếp theo

1. Commit file `project-status.md`.
2. Kiểm kê API và localStorage một lần.
3. Hoàn tất và đóng băng Encouragement Integration.
4. Chuẩn bị môi trường staging.
5. Deploy BTC Alpha 0.1.
6. Thu nhận lỗi thực tế từ BTC.
7. Tiếp tục Alpha 0.2 với Session, Attendance, Score, Question và Bible Challenge Frontend Integration.

## 10. Nguyên tắc ưu tiên

- Ưu tiên hoàn thành tính năng cần thiết.
- Không mở rộng ngoài roadmap.
- Không refactor không cần thiết.
- Không lặp lại kiểm tra module đã hoàn thành.
- UI và animation chỉ làm sau nếu còn thời gian.
- Mỗi bước phải phục vụ trực tiếp cho mốc deploy BTC.
