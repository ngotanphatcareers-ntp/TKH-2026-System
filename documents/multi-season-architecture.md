# TKH SYSTEM — MULTI-SEASON ARCHITECTURE

Version: 1.0  
Status: Approved Design  
Current active season: TKH 2026  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

Kiến trúc Multi-season cho phép cùng một hệ thống được tiếp tục sử dụng cho:

- TKH 2026.
- TKH 2027.
- TKH 2028.
- Các mùa TKH tiếp theo.

Mục tiêu chính:

- Không phải tạo lại toàn bộ hệ thống mỗi năm.
- Không trộn dữ liệu giữa các mùa.
- Giữ được lịch sử các năm cũ.
- Cho phép Admin chuyển đổi mùa hoạt động.
- Mỗi mùa có thành viên, nhóm, buổi học, điểm số và nội dung riêng.
- Hệ thống năm 2026 vẫn được ưu tiên triển khai trước.

---

# 2. Nguyên tắc cốt lõi

Mọi dữ liệu phát sinh theo chương trình TKH phải gắn với một mùa cụ thể.

Tên trường sử dụng:

```text
season_id
```

Không sử dụng năm dạng text lặp lại trong từng bảng như:

```text
TKH 2026
TKH 2027
```

Thay vào đó, các bảng sẽ tham chiếu tới bảng:

```text
seasons
```

---

# 3. Bảng seasons

Bảng `seasons` là bảng trung tâm dùng để quản lý các mùa TKH.

Các cột đề xuất:

| Field | Type | Description |
|---|---|---|
| id | INT PK | ID mùa |
| code | VARCHAR(30) UNIQUE | Ví dụ TKH2026 |
| name | VARCHAR(100) | Thánh Kinh Hè 2026 |
| year | INT | 2026 |
| theme | VARCHAR(255) | Chủ đề tổng |
| bible_verse | TEXT | Câu gốc tổng |
| start_date | DATE | Ngày bắt đầu |
| end_date | DATE | Ngày kết thúc |
| status | ENUM | DRAFT, ACTIVE, CLOSED, ARCHIVED |
| is_current | BOOLEAN | Mùa đang được sử dụng |
| created_at | DATETIME | Ngày tạo |
| updated_at | DATETIME | Ngày cập nhật |
| created_by | INT FK | Admin tạo |

---

# 4. Trạng thái mùa

## DRAFT

Mùa đang được chuẩn bị.

- Chưa hiển thị cho học viên.
- Admin có thể cấu hình dữ liệu.
- Có thể import thành viên, nhóm, buổi học và nội dung.

## ACTIVE

Mùa đang diễn ra.

- Học viên đăng nhập và sử dụng hệ thống.
- Các module hoạt động theo cấu hình.
- Chỉ nên có một mùa ACTIVE tại một thời điểm.

## CLOSED

Mùa đã kết thúc.

- Không tiếp nhận dữ liệu hoạt động mới.
- Học viên có thể bị giới hạn quyền truy cập.
- Admin vẫn được xem và xuất báo cáo.

## ARCHIVED

Mùa đã lưu trữ.

- Chỉ dùng để tra cứu.
- Không sửa dữ liệu nghiệp vụ thông thường.
- Không hiển thị trong giao diện học viên mặc định.

---

# 5. Quy tắc mùa hiện tại

Hệ thống chỉ có:

```text
01 season có is_current = true
```

Mùa hiện tại dùng để:

- Xác định danh sách học viên đang hoạt động.
- Hiển thị nhóm hiện tại.
- Tải các buổi học hiện tại.
- Tính điểm và xếp hạng.
- Tải bài kiểm tra.
- Hiển thị QR Kết Ước.
- Hiển thị tài liệu và câu hỏi.
- Lọc dữ liệu Admin.

Nếu không có mùa hiện tại:

- Học viên không được sử dụng các module chương trình.
- Admin nhận cảnh báo cấu hình hệ thống.

---

# 6. Phân loại dữ liệu

Dữ liệu trong hệ thống được chia thành hai loại.

## 6.1 Dữ liệu dùng chung toàn hệ thống

Không bắt buộc gắn trực tiếp với `season_id`.

Ví dụ:

- Tài khoản đăng nhập Admin.
- Quyền hệ thống.
- Audit log hệ thống.
- Cấu hình kỹ thuật.
- Refresh token.
- Danh mục vai trò.

## 6.2 Dữ liệu thuộc từng mùa

Phải gắn với `season_id`.

Ví dụ:

- Thành viên tham gia.
- Nhóm.
- Buổi học.
- Điểm danh.
- Điểm số.
- Bible Challenge.
- Bài kiểm tra.
- QR Kết Ước.
- Tài liệu.
- Câu hỏi.
- Lời khích lệ.
- Xếp hạng.

---

# 7. Thành viên và mùa

Một người có thể tham gia nhiều mùa TKH.

Không nên tạo lại toàn bộ danh tính người dùng mỗi năm nếu hệ thống đã có tài khoản chính thức.

Thiết kế đề xuất gồm:

1. users
2. members
3. season_memberships

---

# 8. Bảng users

Lưu tài khoản đăng nhập.

Các cột đề xuất:

| Field | Type |
|---|---|
| id | INT PK |
| username | VARCHAR(50) UNIQUE |
| password_hash | VARCHAR(255) |
| role | ENUM |
| is_active | BOOLEAN |
| last_login_at | DATETIME |
| created_at | DATETIME |
| updated_at | DATETIME |

Vai trò đề xuất:

```text
ADMIN
STUDENT
```

Không lưu mật khẩu dạng rõ.

Không cho Admin xem mật khẩu hiện tại của học viên.

---

# 9. Bảng members

Lưu danh tính cơ bản của thành viên.

Các cột đề xuất:

| Field | Type |
|---|---|
| id | INT PK |
| user_id | INT FK |
| full_name | VARCHAR(150) |
| short_name | VARCHAR(50) |
| gender | VARCHAR(20) |
| birth_date | DATE |
| phone | VARCHAR(30) |
| avatar_url | VARCHAR(500) |
| created_at | DATETIME |
| updated_at | DATETIME |

Bảng này không lưu:

- Nhóm của mùa hiện tại.
- Điểm.
- Trạng thái điểm danh.
- Mã nhóm theo từng năm.

Các dữ liệu đó thuộc về mùa và được lưu tại `season_memberships`.

---

# 10. Bảng season_memberships

Bảng liên kết một thành viên với một mùa TKH.

Các cột đề xuất:

| Field | Type |
|---|---|
| id | INT PK |
| season_id | INT FK |
| member_id | INT FK |
| group_id | INT FK |
| member_code | VARCHAR(30) |
| status | ENUM |
| joined_at | DATETIME |
| created_at | DATETIME |
| updated_at | DATETIME |

Ví dụ:

| season_id | member_id | group_id | member_code |
|---|---|---|---|
| TKH 2026 | Ngô Tấn Phát | Ti-mô-thê | TKH002 |
| TKH 2027 | Ngô Tấn Phát | Ca-lép | TKH018 |

Như vậy cùng một thành viên:

- Có thể đổi nhóm qua từng mùa.
- Có thể có mã TKH khác nếu BTC yêu cầu.
- Không làm mất dữ liệu mùa cũ.

Ràng buộc đề xuất:

```text
UNIQUE (season_id, member_id)
UNIQUE (season_id, member_code)
```

---

# 11. Nhóm theo mùa

Bảng `groups` phải có `season_id`.

Các cột đề xuất:

| Field | Type |
|---|---|
| id | INT PK |
| season_id | INT FK |
| code | VARCHAR(30) |
| name | VARCHAR(100) |
| description | TEXT |
| logo_url | VARCHAR(500) |
| status | ENUM |
| created_at | DATETIME |
| updated_at | DATETIME |

Ràng buộc:

```text
UNIQUE (season_id, code)
UNIQUE (season_id, name)
```

Tên nhóm có thể được tái sử dụng ở mùa khác mà không xung đột.

---

# 12. Buổi học theo mùa

Bảng `sessions` phải có:

```text
season_id
```

Các dữ liệu gồm:

- Tên buổi học.
- Ngày học.
- Giờ bắt đầu.
- Giờ kết thúc.
- Trạng thái.
- Trạng thái điểm danh.
- Trạng thái Bible Challenge.

Ràng buộc:

- Chỉ mở buổi học thuộc mùa ACTIVE.
- Mỗi mùa chỉ nên có một buổi học ở trạng thái đang mở tại một thời điểm.
- Buổi học mùa cũ không được ảnh hưởng mùa hiện tại.

---

# 13. Điểm danh theo mùa

Bảng `attendance` phải lưu:

```text
season_id
session_id
season_membership_id
```

Không nên chỉ lưu:

```text
username
full_name
group_name
```

vì các thông tin đó có thể thay đổi.

Dữ liệu quan trọng:

| Field | Description |
|---|---|
| season_id | Mùa TKH |
| session_id | Buổi học |
| season_membership_id | Thành viên trong mùa |
| checkin_window | Khung điểm danh |
| points | Điểm nhận |
| distance_meters | Khoảng cách |
| gps_accuracy | Độ chính xác GPS |
| device_id | Thiết bị |
| checked_in_at | Thời gian |
| status | Trạng thái |

Tên học viên và nhóm được JOIN từ database khi hiển thị báo cáo.

---

# 14. Điểm số theo mùa

Bảng `scores` phải lưu:

```text
season_id
season_membership_id
```

Các nguồn điểm có thể gồm:

```text
ATTENDANCE
DEVOTION
BIBLE_CHALLENGE
PRE_TEST
FINAL_TEST
MEMORY_VERSE
GAME
MANUAL
```

Các cột chính:

| Field | Type |
|---|---|
| id | INT PK |
| season_id | INT FK |
| season_membership_id | INT FK |
| group_id | INT FK nullable |
| score_type | VARCHAR |
| score_value | DECIMAL |
| reason | VARCHAR |
| source_type | VARCHAR |
| source_id | INT nullable |
| created_at | DATETIME |
| created_by | INT FK nullable |

`source_type` và `source_id` giúp truy ngược điểm phát sinh từ:

- Điểm danh.
- Bible Challenge.
- Bài kiểm tra.
- Nhập thủ công.

---

# 15. Xếp hạng theo mùa

Xếp hạng cá nhân và nhóm phải tính trong phạm vi:

```text
season_id
```

Không cộng lẫn điểm của nhiều mùa.

Ví dụ:

```text
TKH 2026 Ranking
```

chỉ sử dụng điểm thuộc TKH 2026.

Khi chuyển sang TKH 2027:

- Bảng xếp hạng bắt đầu lại.
- Dữ liệu năm 2026 vẫn còn trong lịch sử.
- Admin có thể chọn mùa để xem báo cáo cũ.

---

# 16. Bible Challenge theo mùa

Các bảng liên quan cần có:

```text
season_id
session_id
```

Bao gồm:

- Trạng thái random nhóm.
- Trạng thái random thành viên.
- Lịch sử người được chọn.
- Điểm đã cộng.
- Tiến độ từng buổi.

Không sử dụng một trạng thái chung cho toàn bộ hệ thống.

Khi chuyển buổi học hoặc mùa mới:

- Trạng thái random được tách riêng.
- Không phải xóa dữ liệu cũ.
- Không làm mất lịch sử.

---

# 17. Bài kiểm tra theo mùa

Module Kiểm tra phải gắn với:

```text
season_id
```

Các bảng dự kiến:

1. tests
2. test_questions
3. test_options
4. test_attempts
5. test_answers
6. test_waiting_room
7. test_events

Mỗi bài kiểm tra thuộc một mùa.

Loại bài:

```text
PRE_TEST
FINAL_TEST
```

Mùa TKH 2026 dự kiến:

- Pre-test 1.
- Pre-test 2.
- Pre-test 3.
- Final Test.

Điểm bài kiểm tra chỉ được cộng vào mùa tương ứng.

---

# 18. Ẩn xếp hạng Final Test

Trạng thái hiển thị xếp hạng nên được quản lý theo từng mùa.

Có thể lưu tại:

```text
season_settings
```

Ví dụ:

| Key | Value |
|---|---|
| student_ranking_visible | false |

Khi Admin ẩn ranking:

- Học viên không thấy xếp hạng cá nhân.
- Học viên không thấy xếp hạng nhóm.
- Admin vẫn thấy đầy đủ dữ liệu.
- Dữ liệu điểm không bị xóa.

Khi BTC công bố kết quả:

```text
student_ranking_visible = true
```

---

# 19. QR Kết Ước theo mùa

Các bảng QR phải bổ sung:

```text
season_id
```

Áp dụng cho:

- qr_templates.
- member_covenants.
- covenant_reset_logs.

Quy tắc chính xác:

```text
Một thành viên chỉ có 01 Covenant ACTIVE trong mỗi mùa.
```

Không phải:

```text
Một thành viên chỉ được quét một lần trong toàn bộ cuộc đời tài khoản.
```

Ràng buộc nghiệp vụ:

```text
season_id + member_id + ACTIVE
```

Ví dụ:

- Có thể nhận Kết Ước TKH 2026.
- Sang TKH 2027 vẫn có thể nhận Kết Ước mới.
- Card năm 2026 vẫn được lưu trong lịch sử.

---

# 20. Lời khích lệ theo mùa

Bảng `encouragements` nên có:

```text
season_id
```

Lý do:

- Không trộn lời khích lệ giữa các năm.
- Thống kê Admin theo từng mùa.
- Giới hạn gửi mỗi ngày áp dụng trong mùa hiện tại.
- Học viên có thể xem lịch sử theo mùa nếu sau này cần.

Các cột liên quan:

- from_season_membership_id.
- to_season_membership_id.
- is_anonymous.
- is_read.
- is_pinned.
- sent_at.

---

# 21. Câu hỏi buổi học theo mùa

Bảng `questions` phải có:

```text
season_id
session_id
season_membership_id
```

Như vậy Admin có thể:

- Xem câu hỏi từng mùa.
- Xem câu hỏi từng buổi.
- Download dữ liệu đúng phạm vi.
- Không trộn câu hỏi mùa cũ với mùa mới.

---

# 22. Kho tài liệu theo mùa

Bảng tài liệu nên có:

```text
season_id
session_id nullable
```

Một số tài liệu có thể:

- Thuộc một buổi học cụ thể.
- Thuộc toàn bộ mùa.
- Được dùng chung trong nhiều buổi.

Mùa cũ có thể giữ tài liệu nhưng không hiển thị mặc định cho học viên mùa mới.

---

# 23. Lịch học theo mùa

Lịch học cố định bằng hình ảnh vẫn cần gắn với mùa.

Có thể sử dụng bảng:

```text
season_schedule_assets
```

Các cột đề xuất:

| Field | Type |
|---|---|
| id | INT PK |
| season_id | INT FK |
| week_number | INT |
| title | VARCHAR |
| subtitle | VARCHAR |
| image_url | VARCHAR |
| display_order | INT |
| is_active | BOOLEAN |

Như vậy năm sau chỉ cần thay ảnh mà không sửa code.

Trong giai đoạn TKH 2026, có thể vẫn dùng cấu hình cố định trước để ưu tiên tiến độ.

---

# 24. Cấu hình module theo mùa

Nên tạo bảng:

```text
season_settings
```

Các cột:

| Field | Type |
|---|---|
| id | INT PK |
| season_id | INT FK |
| setting_key | VARCHAR(100) |
| setting_value | TEXT |
| updated_by | INT FK |
| updated_at | DATETIME |

Ví dụ:

| setting_key | setting_value |
|---|---|
| covenant_module_status | ENABLED |
| test_module_status | ENABLED |
| student_ranking_visible | false |
| attendance_radius_meters | 200 |
| devotion_start_time | 05:30 |
| devotion_end_time | 06:00 |
| devotion_enabled_sunday | false |

Ràng buộc:

```text
UNIQUE (season_id, setting_key)
```

---

# 25. Audit Log

Audit log phải ghi thêm:

```text
season_id
```

nếu hành động liên quan đến một mùa cụ thể.

Ví dụ:

- Admin mở buổi học TKH 2026.
- Admin reset QR TKH 2026.
- Admin ẩn ranking TKH 2026.
- Admin bắt đầu Final Test TKH 2026.

Audit của mùa này không được trộn với mùa khác khi truy xuất báo cáo.

---

# 26. API và mùa hiện tại

Frontend học viên không cần tự gửi `season_id` trong mọi request.

Backend xác định mùa hiện tại từ:

```text
current season
```

và membership của người dùng.

Ví dụ:

```text
GET /api/me/scores
```

Backend tự hiểu là điểm của mùa đang ACTIVE.

Đối với Admin, các API báo cáo có thể hỗ trợ:

```text
seasonId
```

Ví dụ:

```text
GET /api/admin/attendance?seasonId=1
```

Nếu Admin không truyền `seasonId`:

- Backend mặc định dùng mùa hiện tại.

---

# 27. Không tin season_id từ học viên

Học viên không được tự chọn hoặc gửi tùy ý:

```text
season_id
member_id
season_membership_id
group_id
```

Backend phải xác định các giá trị này từ:

- Access Token.
- User.
- Current Season.
- Season Membership.

Điều này tránh học viên truy cập dữ liệu của mùa hoặc thành viên khác.

---

# 28. Chuyển sang mùa mới

Quy trình đề xuất khi bắt đầu TKH 2027:

## Bước 1

Tạo season mới:

```text
TKH2027
```

Trạng thái:

```text
DRAFT
```

## Bước 2

Tạo danh sách nhóm mới.

## Bước 3

Import danh sách học viên.

## Bước 4

Tạo `season_memberships`.

## Bước 5

Cấu hình:

- Bán kính điểm danh.
- Khung giờ.
- QR Kết Ước.
- Bài kiểm tra.
- Lịch học.
- Tài liệu.

## Bước 6

Kiểm tra dữ liệu.

## Bước 7

Đóng mùa cũ:

```text
TKH2026 = CLOSED
```

## Bước 8

Kích hoạt mùa mới:

```text
TKH2027 = ACTIVE
is_current = true
```

---

# 29. Dữ liệu mùa cũ

Không xóa dữ liệu khi kết thúc mùa.

Dữ liệu cần giữ:

- Thành viên.
- Nhóm.
- Điểm danh.
- Điểm số.
- Bài kiểm tra.
- Bible Challenge.
- QR Kết Ước.
- Lời khích lệ.
- Câu hỏi.
- Audit log.

Admin có thể:

- Xem lại.
- Lọc theo mùa.
- Download báo cáo.
- Đối chiếu khi có khiếu nại.

---

# 30. Chính sách chỉnh sửa mùa cũ

Khi mùa ở trạng thái CLOSED:

- Không cho học viên phát sinh dữ liệu mới.
- Admin chỉ nên chỉnh sửa dữ liệu trong trường hợp đặc biệt.
- Mọi chỉnh sửa phải có Audit Log.

Khi mùa ở trạng thái ARCHIVED:

- Dữ liệu mặc định ở chế độ chỉ đọc.
- Các thay đổi phải dùng quyền cao hơn nếu sau này hệ thống có nhiều cấp Admin.

---

# 31. Chỉ mục đề xuất

Các bảng nghiệp vụ nên có index trên:

```text
season_id
season_id + member_id
season_id + group_id
season_id + session_id
season_id + status
season_id + created_at
```

Ví dụ:

```text
INDEX idx_attendance_season_session
(season_id, session_id)

INDEX idx_scores_season_member
(season_id, season_membership_id)

INDEX idx_covenants_season_member_status
(season_id, member_id, status)
```

---

# 32. Ràng buộc dữ liệu

Các ràng buộc quan trọng:

```text
Một mùa chỉ có một bộ dữ liệu hoạt động riêng.
Một member chỉ có một season membership trong mỗi mùa.
Một member chỉ có một Covenant ACTIVE trong mỗi mùa.
Một bài kiểm tra chỉ thuộc một mùa.
Một điểm số phải thuộc đúng mùa của membership.
Một attendance record phải thuộc đúng mùa của session.
```

Backend phải kiểm tra tính nhất quán trước khi Insert.

---

# 33. Giao diện Admin theo mùa

Trong phiên bản TKH 2026:

- Chưa cần dropdown chuyển mùa ở tất cả các trang.
- Mặc định dùng mùa hiện tại.

Trong phiên bản mở rộng:

Admin có thể có dropdown:

```text
Mùa đang xem:
TKH 2026
TKH 2027
```

Khi chọn mùa cũ:

- Dữ liệu chuyển sang chế độ lịch sử.
- Các nút chỉnh sửa có thể bị khóa.
- Báo cáo và export vẫn hoạt động.

---

# 34. Giao diện học viên theo mùa

Ở phiên bản đầu:

- Học viên chỉ thấy mùa hiện tại.
- Không cần chọn mùa.
- Không hiển thị dữ liệu lịch sử năm cũ.

Trong tương lai có thể thêm:

```text
Lịch sử TKH
```

để xem:

- Điểm cũ.
- Thẻ Kết Ước cũ.
- Lịch sử tham dự.

Đây không phải phạm vi bắt buộc của TKH 2026.

---

# 35. Phạm vi triển khai hiện tại

Multi-season hiện tại chỉ là thiết kế nền tảng.

Trong giai đoạn Backend TKH 2026 sẽ thực hiện:

- Tạo bảng seasons.
- Tạo một record TKH 2026.
- Gắn season_id vào các bảng nghiệp vụ chính.
- Backend mặc định sử dụng TKH 2026.
- Chưa xây giao diện chuyển mùa phức tạp.
- Chưa xây màn hình lịch sử cho học viên.

Mục tiêu là chuẩn bị cấu trúc, không làm chậm tiến độ chương trình hiện tại.

---

# 36. Dữ liệu khởi tạo TKH 2026

Record đề xuất:

```text
code: TKH2026
name: Thánh Kinh Hè 2026
year: 2026
status: ACTIVE
is_current: true
```

Các trường:

- theme.
- bible_verse.
- start_date.
- end_date.

sẽ điền theo thông tin chính thức của BTC.

---

# 37. Quyết định kiến trúc đã chốt

Các quyết định chính thức:

1. Hệ thống sử dụng bảng `seasons`.
2. Dữ liệu nghiệp vụ quan trọng phải có `season_id`.
3. Thành viên và việc tham gia từng mùa được tách riêng.
4. Nhóm có thể thay đổi theo từng mùa.
5. Điểm và ranking không trộn giữa các mùa.
6. QR Kết Ước được giới hạn một lần trong mỗi mùa.
7. Ranking có thể ẩn theo cấu hình mùa.
8. Học viên mặc định chỉ sử dụng mùa hiện tại.
9. Admin có thể xem lịch sử mùa cũ trong tương lai.
10. TKH 2026 vẫn là phạm vi ưu tiên số một.