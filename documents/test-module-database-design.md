# TKH 2026 — MODULE KIỂM TRA DATABASE DESIGN

Version: 1.1  
Status: Reviewed  
Database: SQL Server (SSMS)  
Primary key: `INT IDENTITY(1,1)`  
Liên kết học viên: ưu tiên `season_membership_id`  

---

## 0. Phạm vi & nguyên tắc

### 0.1 Phạm vi

Tài liệu này mô tả schema cho Module Kiểm tra gồm:

- 03 bài Pre-test.
- 01 bài Final Test.
- Phòng chờ.
- Attempt.
- Lưu đáp án.
- Chấm điểm và kết quả.
- Late join.
- Runtime state.
- Audit log cho các thao tác quan trọng.

### 0.2 Không tạo lại bảng nền tảng

Module Kiểm tra không tạo lại các bảng:

- `seasons`
- `members`
- `season_memberships`
- `groups`

Tất cả nghiệp vụ học viên theo mùa liên kết qua `season_membership_id` (FK → `season_memberships.id`).

### 0.3 Các quyết định đã chốt

- Countdown dùng duy nhất `exams.time_per_question`.
- Không có thời gian riêng trên từng câu hỏi.
- Late join V1 được phép.
- Học viên late join bắt đầu từ câu đang ACTIVE.
- Học viên không được làm các câu đã khóa.
- Học viên không được cộng thêm thời gian riêng.
- Final Test vẫn chấm điểm và lưu ranking đầy đủ.
- `ranking_hidden` chỉ ảnh hưởng phần hiển thị cho học viên.
- Không hard delete dữ liệu lịch sử bài làm.
- Thao tác quản trị quan trọng phải có audit log.
- Runtime state phải được lưu trong database để phục hồi khi server restart.

---

## 1. Danh sách bảng

| Nhóm | Bảng | Mục đích |
|---|---|---|
| Cốt lõi | `exams` | Bài kiểm tra |
| Cốt lõi | `exam_questions` | Câu hỏi và đáp án |
| Runtime | `exam_waiting_room` | Học viên đã vào phòng chờ |
| Runtime | `exam_live_states` | Trạng thái realtime hiện tại |
| Runtime | `exam_attempts` | Bài làm của học viên |
| Runtime | `exam_attempt_answers` | Đáp án từng câu |
| Audit | `exam_events` | Audit và log nghiệp vụ quan trọng |

---

## 2. Bảng `exams`

### 2.1 Mục đích

Lưu bài kiểm tra theo từng mùa.

### 2.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `season_id` | INT | NOT NULL | FK → `seasons.id` |
| `name` | NVARCHAR(100) | NOT NULL | Tên bài |
| `type` | VARCHAR(20) | NOT NULL | `PRE_TEST` / `FINAL_TEST` |
| `status` | VARCHAR(30) | NOT NULL | Trạng thái |
| `scheduled_start_at` | DATETIME2(0) | NULL | Ngày giờ dự kiến |
| `time_per_question` | INT | NOT NULL | Giây/câu |
| `ranking_hidden` | BIT | NOT NULL | Default 0 |
| `allow_view_result` | BIT | NOT NULL | Default 0 |
| `created_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |
| `updated_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 2.3 Constraints

- CHECK `type IN ('PRE_TEST','FINAL_TEST')`
- CHECK `status IN ('DRAFT','SCHEDULED','WAITING_ROOM_OPEN','IN_PROGRESS','SUBMITTING','COMPLETED','CANCELLED')`
- CHECK `time_per_question > 0`

Quy tắc app-layer:

- Nếu `type = 'PRE_TEST'` thì `ranking_hidden = 0`.
- Bài từ `WAITING_ROOM_OPEN` trở đi không được hard delete.
- Bài đã có attempt không được hard delete.

### 2.4 Indexes

- IX (`season_id`, `type`)
- IX (`season_id`, `status`)
- IX (`scheduled_start_at`)

---

## 3. Bảng `exam_questions`

### 3.1 Mục đích

Lưu câu hỏi và bốn đáp án.

### 3.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `exam_id` | INT | NOT NULL | FK → `exams.id` |
| `question_index` | INT | NOT NULL | Thứ tự 1..N |
| `question_text` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `answer_a` | NVARCHAR(500) | NOT NULL | |
| `answer_b` | NVARCHAR(500) | NOT NULL | |
| `answer_c` | NVARCHAR(500) | NOT NULL | |
| `answer_d` | NVARCHAR(500) | NOT NULL | |
| `correct_answer` | CHAR(1) | NOT NULL | A/B/C/D |
| `created_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |
| `updated_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 3.3 Constraints

- UNIQUE (`exam_id`, `question_index`)
- CHECK `correct_answer IN ('A','B','C','D')`

Không có cột thời gian riêng theo câu.

### 3.4 Indexes

- IX (`exam_id`, `question_index`)

---

## 4. Bảng `exam_waiting_room`

### 4.1 Mục đích

Ghi nhận học viên đã vào phòng chờ.

### 4.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `exam_id` | INT | NOT NULL | FK → `exams.id` |
| `season_membership_id` | INT | NOT NULL | FK → `season_memberships.id` |
| `joined_at` | DATETIME2(0) | NOT NULL | Thời điểm vào |
| `last_seen_at` | DATETIME2(0) | NULL | Hoạt động gần nhất |

### 4.3 Constraints

- UNIQUE (`exam_id`, `season_membership_id`)

### 4.4 Indexes

- IX (`exam_id`, `joined_at`)
- IX (`season_membership_id`, `exam_id`)

### 4.5 Quy tắc presence

- Online/offline realtime do Socket.IO server quản lý trong memory.
- `last_seen_at` chỉ dùng hỗ trợ kiểm tra trạng thái gần nhất.
- Không ghi mỗi lần ping vào SQL Server.
- Không coi database là nguồn sự thật tức thời cho trạng thái socket.

---

## 5. Bảng `exam_live_states`

### 5.1 Mục đích

Lưu trạng thái hiện tại của bài để có thể phục hồi khi server restart.

### 5.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `exam_id` | INT | NOT NULL | FK → `exams.id` |
| `current_question_id` | INT | NULL | FK → `exam_questions.id` |
| `current_question_index` | INT | NULL | Snapshot |
| `question_started_at` | DATETIME2(0) | NULL | |
| `question_ends_at` | DATETIME2(0) | NULL | |
| `state` | VARCHAR(30) | NOT NULL | `WAITING`, `ACTIVE`, `LOCKED`, `WAITING_NEXT`, `COMPLETED` |
| `updated_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 5.3 Constraints

- UNIQUE (`exam_id`)
- CHECK `state IN ('WAITING','ACTIVE','LOCKED','WAITING_NEXT','COMPLETED')`

---

## 6. Bảng `exam_attempts`

### 6.1 Mục đích

Mỗi học viên có một attempt cho mỗi bài.

### 6.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `exam_id` | INT | NOT NULL | FK → `exams.id` |
| `season_membership_id` | INT | NOT NULL | FK → `season_memberships.id` |
| `status` | VARCHAR(20) | NOT NULL | Trạng thái attempt |
| `started_at` | DATETIME2(0) | NULL | |
| `submitted_at` | DATETIME2(0) | NULL | |
| `score` | INT | NOT NULL | Default 0 |
| `correct_count` | INT | NOT NULL | Default 0 |
| `total_questions` | INT | NOT NULL | Snapshot |
| `is_late_join` | BIT | NOT NULL | Default 0 |
| `joined_question_index` | INT | NULL | Câu hiện tại khi bắt đầu |
| `created_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |
| `updated_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 6.3 Constraints

- UNIQUE (`exam_id`, `season_membership_id`)
- CHECK `status IN ('IN_PROGRESS','SUBMITTING','COMPLETED')`
- CHECK `score >= 0`
- CHECK `correct_count >= 0`
- CHECK `total_questions >= 0`

### 6.4 Indexes

- IX (`exam_id`, `status`)
- IX (`season_membership_id`, `exam_id`)
- IX (`exam_id`, `status`, `score`)

### 6.5 Quy tắc điểm

- `correct_count` là số câu đúng.
- `score` là tổng điểm sau khi áp dụng business chấm điểm.
- Không tự ý cộng điểm theo tốc độ nếu business chưa chốt.
- Chống cộng điểm hồ sơ trùng phải xử lý ở backend bằng transaction và idempotency.

---

## 7. Bảng `exam_attempt_answers`

### 7.1 Mục đích

Lưu đáp án từng câu.

### 7.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `attempt_id` | INT | NOT NULL | FK → `exam_attempts.id` |
| `question_id` | INT | NOT NULL | FK → `exam_questions.id` |
| `chosen_answer` | CHAR(1) | NULL | A/B/C/D |
| `is_correct` | BIT | NULL | Set khi chấm |
| `answered_at` | DATETIME2(0) | NULL | |
| `updated_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 7.3 Constraints

- UNIQUE (`attempt_id`, `question_id`)
- CHECK (`chosen_answer IN ('A','B','C','D') OR chosen_answer IS NULL`)

### 7.4 Indexes

- IX (`attempt_id`)
- IX (`question_id`)

---

## 8. Bảng `exam_events`

### 8.1 Mục đích

Lưu audit log và các sự kiện nghiệp vụ quan trọng.

Bắt buộc lưu:

- Mở/đóng phòng chờ.
- Bắt đầu bài.
- Kích hoạt câu.
- Khóa câu.
- Chuyển câu.
- Hủy bài.
- Kết thúc sớm.
- Bắt đầu thu bài.
- Hoàn tất chấm điểm.
- Reset attempt.
- Reset kết quả.
- Thay đổi ranking visibility.
- Late join.
- Lỗi chấm điểm quan trọng.

Không bắt buộc lưu:

- Mọi heartbeat/ping.
- Reconnect rất ngắn.
- Mọi thay đổi online/offline tức thời.

### 8.2 Columns

| Column | Type | Null | Note |
|---|---|---|---|
| `id` | INT IDENTITY(1,1) | NOT NULL | PK |
| `exam_id` | INT | NOT NULL | FK → `exams.id` |
| `season_membership_id` | INT | NULL | Học viên liên quan |
| `actor_user_id` | INT | NULL | Người thực hiện |
| `event_type` | VARCHAR(50) | NOT NULL | |
| `reason` | NVARCHAR(500) | NULL | Lý do |
| `payload_json` | NVARCHAR(MAX) | NULL | JSON |
| `created_at` | DATETIME2(0) | NOT NULL | Default GETDATE() |

### 8.3 Indexes

- IX (`exam_id`, `created_at`)
- IX (`actor_user_id`, `created_at`)
- IX (`event_type`, `created_at`)

Nếu sau này có bảng audit log tổng thể, Module Test có thể dùng bảng chung thay cho `exam_events`.

---

## 9. Foreign key và delete behavior

- Không cascade delete dữ liệu lịch sử attempt.
- Không xóa season membership chỉ vì học viên ngưng tham gia.
- Bài từ `WAITING_ROOM_OPEN` trở đi không được hard delete.
- Bài DRAFT chưa có attempt có thể xóa.
- Khi xóa bài DRAFT, có thể cascade questions và live state.
- Khi hủy bài đang vận hành, dùng `status = 'CANCELLED'`.
- Dữ liệu lịch sử phải được giữ lại để audit.

---

## 10. Ranking

### 10.1 Quyết định

Ranking tính động, không tạo bảng ranking riêng.

### 10.2 Ranking cá nhân

Trong phạm vi một bài:

1. `score` DESC
2. `submitted_at` ASC
3. `season_membership_id` ASC

Chỉ lấy attempt `COMPLETED`.

### 10.3 Ranking nhóm

Công thức ranking nhóm phải bám theo business điểm nhóm chung.

Không tự chốt trong tài liệu database nếu BTC chưa xác nhận một trong các cách:

- SUM(score)
- AVG(score)
- Tổng điểm đã chuẩn hóa

### 10.4 Ẩn ranking

Nếu `ranking_hidden = 1`:

- Backend vẫn tính ranking cho Admin.
- API học viên trả rank bằng `null`.

---

## 11. Checklist review

- [ ] Tất cả PK dùng `INT IDENTITY(1,1)`.
- [ ] Liên kết học viên qua `season_membership_id`.
- [ ] Có late join.
- [ ] Có `is_late_join`.
- [ ] Có `joined_question_index`.
- [ ] Có bảng live state.
- [ ] Không có thời gian riêng từng câu.
- [ ] Có unique constraint chống trùng.
- [ ] Có audit log bắt buộc cho thao tác quan trọng.
- [ ] Không hard delete lịch sử.
- [ ] Không lưu socket status như nguồn realtime chính.
- [ ] Ranking nhóm chưa bị tự ý chốt sai business.

---

✅ DATABASE DESIGN REVIEWED — MODULE KIỂM TRA
