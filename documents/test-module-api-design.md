# TKH 2026 — MODULE KIỂM TRA API DESIGN

Version: 1.1
Status: Frozen  
Đồng bộ với:  
- Business Design v1.1 (Frozen)  
- Database Design v1.2 (Frozen)  
- Realtime Design v1.2 (Frozen)  
- UI Design v1.1 (Frozen)  

---

## 0. Nguyên tắc chung

### 0.1 Phân chia REST / Socket.IO

| Loại thao tác | Kênh |
|---|---|
| Tạo, sửa, xóa dữ liệu | REST |
| Gửi đáp án | REST |
| Điều khiển bài (start, next, cancel...) | REST |
| Nhận trạng thái tức thời | Socket.IO |
| Broadcast count, status | Socket.IO |
| Download, báo cáo | REST |

### 0.2 Authentication

Tất cả API yêu cầu Access Token hợp lệ:

```http
Authorization: Bearer <access_token>
```

Backend xác định identity từ token. Frontend không truyền `memberId`, `seasonId`, hay `attemptId` tự ý.

### 0.3 Base URL

```text
/api            ← Student API
/api/admin      ← Admin API
```

### 0.4 Content-Type

```text
Content-Type: application/json
```

Ngoại lệ: Import Excel dùng `multipart/form-data`.

### 0.5 Quy tắc response

**Thành công:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Lỗi:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```
### 0.5.1 Idempotency

Các thao tác có nguy cơ gửi lặp phải được xử lý idempotent:

- Submit hoặc cập nhật đáp án.
- Start Exam.
- End Exam.
- Reset Attempt.
- Cộng điểm chính thức.

Quy tắc:

- Gửi lại cùng một đáp án cho cùng Attempt và Question không tạo dòng trùng.
- Gọi `start` nhiều lần không tạo nhiều Attempt.
- Gọi `end` nhiều lần không cộng điểm lần thứ hai.
- Một `source_type + source_id` chỉ tạo một giao dịch điểm chính thức.
- Reset cùng một Attempt đã ở trạng thái `RESET` phải bị từ chối hoặc trả lại kết quả cũ.

Backend ưu tiên sử dụng:

- Unique Constraints.
- SQL Server Transaction.
- Kiểm tra trạng thái hiện tại.
- Idempotency key cho các thao tác quản trị quan trọng nếu cần.


### 0.6 Mùa hiện tại

- Student API: Backend tự xác định mùa hiện tại, không cần truyền `season_id`.
- Admin API: Nếu không truyền `season_id`, Backend dùng mùa hiện tại.

---

## 1. Student API — Danh sách bài kiểm tra

### GET /api/exams

Lấy danh sách bài kiểm tra của mùa hiện tại.

**Auth:** Học viên (season membership hợp lệ).

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pre-test 1",
      "type": "PRE_TEST",
      "scheduled_start_at": "2026-07-21T08:00:00+07:00",
      "total_questions": 10,
      "time_per_question": 20,
      "status": "SCHEDULED",
      "result_visibility": "SCORE_ONLY"
    }
  ]
}
```

**Ghi chú:**

- Không trả bài `DRAFT` cho học viên.
- `result_visibility` trả về để UI biết hiển thị nút "Xem kết quả" hay không.

---

## 2. Student API — Phòng chờ

### GET /api/exams/:exam_id

Lấy thông tin một bài kiểm tra.

**Auth:** Học viên.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Pre-test 1",
    "type": "PRE_TEST",
    "status": "WAITING_ROOM_OPEN",
    "time_per_question": 20,
    "total_questions": 10,
    "result_visibility": "SCORE_ONLY"
  }
}
```

---

### POST /api/exams/:exam_id/waiting-room/join

Học viên vào phòng chờ.

**Auth:** Học viên.

**Điều kiện:**

- Bài đang `WAITING_ROOM_OPEN`.
- Học viên có season membership hợp lệ.
- Chưa có attempt đã `COMPLETED` (chưa reset).

**Request body:** _(không cần)_

**Response 200:**

```json
{
  "success": true,
  "data": {
    "joined_at": "2026-07-21T08:05:00Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `EXAM_NOT_OPEN` | 400 | Bài không ở trạng thái WAITING_ROOM_OPEN |
| `ALREADY_COMPLETED` | 400 | Học viên đã có attempt hoàn thành |
| `MEMBERSHIP_NOT_ELIGIBLE` | 403 | Không có season membership hợp lệ |

---
### POST /api/exams/:exam_id/late-join

Tạo Attempt late join cho học viên khi bài đã bắt đầu.

**Auth:** Học viên.

**Điều kiện:**

- Exam đang `IN_PROGRESS`.
- Học viên có Season Membership hợp lệ.
- Bài chưa chuyển sang `SUBMITTING`.
- Học viên chưa có Attempt active.
- Còn câu hỏi hiện tại hoặc câu tiếp theo.

**Request body:** Không cần.

**Luồng Backend:**

1. Xác định live state hiện tại.
2. Tạo Attempt mới.
3. Ghi:
   - `is_late_join = 1`
   - `joined_question_index = current_question_index`
4. Các câu trước được xem là đã khóa và không trả lời.
5. Không cộng thêm thời gian.
6. Ghi Audit Log.
7. Emit `student:late_joined` cho Admin.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "attempt_id": 42,
    "is_late_join": true,
    "joined_question_index": 3,
    "exam_status": "IN_PROGRESS",
    "live_state": "ACTIVE",
    "server_now": "2026-07-21T08:07:08Z",
    "question_ends_at": "2026-07-21T08:07:20Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---:|---|
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài chưa bắt đầu hoặc không còn diễn ra |
| `ATTEMPT_ALREADY_EXISTS` | 409 | Học viên đã có Attempt hợp lệ |
| `MEMBERSHIP_NOT_ELIGIBLE` | 403 | Không có Season Membership hợp lệ |
| `NO_ACTIVE_OR_UPCOMING_QUESTION` | 400 | Không còn câu hỏi để tham gia |

---
## 3. Student API — Làm bài

### GET /api/exams/:exam_id/attempt

Lấy trạng thái attempt hiện tại của học viên (dùng để phục hồi sau reload/reconnect).

**Auth:** Học viên.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "attempt_id": 42,
    "exam_status": "IN_PROGRESS",
    "is_late_join": false,
    "joined_question_index": null,
    "current_question_index": 3,
    "total_questions": 10,
    "server_now": "2026-07-21T08:07:08Z",
    "question_ends_at": "2026-07-21T08:07:20Z",
    "questions": [
      {
        "question_index": 1,
        "question_id": 101,
        "state": "LOCKED",
        "chosen_answer": "B"
      },
      {
        "question_index": 2,
        "question_id": 102,
        "state": "LOCKED",
        "chosen_answer": null
      },
      {
        "question_index": 3,
        "question_id": 103,
        "state": "ACTIVE",
        "chosen_answer": null
      },
      {
        "question_index": 4,
        "question_id": 104,
        "state": "LOCKED_FUTURE",
        "chosen_answer": null
      }
    ]
  }
}
```

**Ghi chú:**

- Không trả `question_text`, `correct_answer`, `answer_a/b/c/d`.
- `state` của từng câu: `ACTIVE` | `LOCKED` | `LOCKED_FUTURE`.
- `question_ends_at` chỉ có giá trị khi câu đang `ACTIVE`.

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `ATTEMPT_NOT_FOUND` | 404 | Chưa có attempt |
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài chưa bắt đầu |

---

### POST /api/exams/:exam_id/attempt/answer

Gửi hoặc cập nhật đáp án cho một câu.

**Auth:** Học viên.

**Request body:**

```json
{
  "question_id": 103,
  "answer": "B"
}
```

**Điều kiện backend validate:**

- Exam đang `IN_PROGRESS`.
- Question đúng câu đang `ACTIVE`.
- Server time chưa vượt `question_ends_at`.
- Attempt thuộc học viên và đang `IN_PROGRESS`.
- `answer` là một trong `A`, `B`, `C`, `D`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "question_id": 103,
    "answer_accepted": true,
    "answered_at": "2026-07-21T08:07:12Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `QUESTION_NOT_ACTIVE` | 400 | Câu không ở trạng thái ACTIVE |
| `ANSWER_TOO_LATE` | 400 | Đã hết thời gian |
| `INVALID_ANSWER` | 400 | Đáp án không hợp lệ (không phải A/B/C/D) |
| `ATTEMPT_NOT_FOUND` | 404 | Không tìm thấy attempt |
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài không đang diễn ra |
| `MEMBERSHIP_NOT_ELIGIBLE` | 403 | Không đủ điều kiện |

---

## 4. Student API — Kết quả

### GET /api/exams/:exam_id/attempt/result

Lấy kết quả bài kiểm tra của học viên.

**Auth:** Học viên.

**Response 200 — `result_visibility = HIDDEN`:**

```json
{
  "success": true,
  "data": {
    "result_visibility": "HIDDEN",
    "message": "Kết quả sẽ được BTC công bố sau."
  }
}
```

**Response 200 — `result_visibility = SCORE_ONLY`:**

```json
{
  "success": true,
  "data": {
    "result_visibility": "SCORE_ONLY",
    "exam_type": "PRE_TEST",
    "score": 90,
    "total_questions": 10,
    "correct_count": 9,
    "wrong_count": 1,
    "unanswered_count": 0,
    "ranking_visible": false,
    "rank_individual": null,
    "rank_group": null
  }
}
```

**Response 200 — `result_visibility = FULL_RESULT`:**

```json
{
  "success": true,
  "data": {
    "result_visibility": "FULL_RESULT",
    "exam_type": "PRE_TEST",
    "score": 80,
    "total_questions": 10,
    "correct_count": 8,
    "wrong_count": 2,
    "unanswered_count": 0,
    "ranking_visible": true,
    "rank_individual": 12,
    "rank_group": 3,
    "answers": [
      {
        "question_index": 1,
        "chosen_answer": "B",
        "is_correct": true
      },
      {
        "question_index": 2,
        "chosen_answer": "A",
        "is_correct": false
      }
    ]
  }
}
```

**Quy tắc:**

- `answers[]` chỉ có khi `result_visibility = FULL_RESULT`.
- `rank_individual` và `rank_group` là `null` khi `ranking_visible = false`.
- Backend không trả `correct_answer` trong `answers[]`.

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `EXAM_NOT_COMPLETED` | 400 | Bài chưa kết thúc |
| `ATTEMPT_NOT_FOUND` | 404 | Không có attempt |

---

## 5. Admin API — Quản lý bài kiểm tra

### GET /api/admin/exams

Lấy danh sách bài kiểm tra (Admin).

**Auth:** Admin.

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `season_id` | INT | Tuỳ chọn. Mặc định mùa hiện tại |
| `status` | string | Lọc theo trạng thái |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pre-test 1",
      "type": "PRE_TEST",
      "status": "SCHEDULED",
      "scheduled_start_at": "2026-07-21T08:00:00+07:00",
      "total_questions": 10,
      "time_per_question": 20,
      "result_visibility": "SCORE_ONLY",
      "created_at": "2026-07-10T00:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/exams

Tạo bài kiểm tra mới.

**Auth:** Admin.

**Request body:**

```json
{
  "name": "Pre-test 1",
  "type": "PRE_TEST",
  "scheduled_start_at": "2026-07-21T08:00:00+07:00",
  "time_per_question": 20,
  "result_visibility": "SCORE_ONLY"
}
```

**Validation:**

- `name`: bắt buộc, không rỗng.
- `type`: `PRE_TEST` hoặc `FINAL_TEST`.
- `time_per_question`: số nguyên > 0.
- `result_visibility`: `HIDDEN` | `SCORE_ONLY` | `FULL_RESULT`.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "DRAFT"
  }
}
```

---

### PUT /api/admin/exams/:exam_id

Sửa thông tin bài kiểm tra.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Request body:** _(các field muốn cập nhật)_

```json
{
  "name": "Pre-test 1 (Updated)",
  "time_per_question": 25,
  "result_visibility": "FULL_RESULT"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "updated_at": "2026-07-14T10:00:00Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `EXAM_LOCKED` | 400 | Bài đã mở phòng chờ, không thể sửa |


### PUT /api/admin/exams/:exam_id/result-visibility

Cập nhật chế độ hiển thị kết quả của một bài kiểm tra.

**Auth:** Admin.

**Request body:**

```json
{
  "result_visibility": "SCORE_ONLY"
}
```

**Giá trị hợp lệ:**

```text
HIDDEN
SCORE_ONLY
FULL_RESULT
```

**Điều kiện:**

- Exam tồn tại.
- Có thể cập nhật trước hoặc sau khi bài hoàn thành.
- Không thay đổi điểm, câu hỏi hoặc kết quả đã chấm.
- Phải ghi Audit Log.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "exam_id": 1,
    "result_visibility": "SCORE_ONLY",
    "updated_at": "2026-07-21T10:00:00Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---:|---|
| `EXAM_NOT_FOUND` | 404 | Không tìm thấy bài kiểm tra |
| `INVALID_RESULT_VISIBILITY` | 400 | Giá trị hiển thị kết quả không hợp lệ |

---

### POST /api/admin/exams/:exam_id/open-waiting-room

Mở phòng chờ.

**Auth:** Admin.

**Điều kiện:** Bài đang `SCHEDULED`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "WAITING_ROOM_OPEN"
  }
}
```

---

### POST /api/admin/exams/:exam_id/close-waiting-room

Đóng phòng chờ (quay về `SCHEDULED`).

**Auth:** Admin.

**Điều kiện:** Bài đang `WAITING_ROOM_OPEN`, chưa bắt đầu.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "SCHEDULED"
  }
}
```

---

### POST /api/admin/exams/:exam_id/start

Bắt đầu bài kiểm tra.

**Auth:** Admin.

**Điều kiện:**

- Bài đang `WAITING_ROOM_OPEN`.
- Có ít nhất 1 câu hỏi.
- Mỗi câu có đủ 4 đáp án và 1 đáp án đúng.
- Mỗi câu có `points >= 0`.
- `time_per_question > 0`.
- Không có bài khác đang `IN_PROGRESS` trong cùng mùa.

**Luồng backend:**

1. Validate điều kiện.
2. Tạo Attempt cho học viên hợp lệ trong phòng chờ.
3. Tạo `exam_live_states` với `state = WAITING`.
4. Chuyển Exam sang `IN_PROGRESS`.
5. Ghi Audit Log.
6. Emit Socket.IO `exam:started` cho các room liên quan.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "IN_PROGRESS",
    "started_at": "2026-07-21T08:10:00Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `NO_QUESTIONS` | 400 | Chưa có câu hỏi |
| `INVALID_QUESTIONS` | 400 | Câu hỏi thiếu đáp án hoặc đáp án đúng |
| `ANOTHER_EXAM_IN_PROGRESS` | 400 | Có bài khác đang diễn ra trong mùa |

---

### POST /api/admin/exams/:exam_id/next-question

Admin mở câu tiếp theo (hoặc câu đầu tiên).

**Auth:** Admin.

**Điều kiện:**

- Bài đang `IN_PROGRESS`.
- Live state đang `WAITING` hoặc `WAITING_NEXT`.
- Còn câu chưa được kích hoạt.

**Luồng backend:**

1. Xác định câu tiếp theo.
2. Lưu `question_started_at` và `question_ends_at` vào `exam_live_states`.
3. Chuyển live state sang `ACTIVE`.
4. Ghi Audit Log.
5. Emit `question:activated` cho tất cả room.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "question_index": 1,
    "question_id": 101,
    "server_now": "2026-07-21T08:10:05Z",
    "question_ends_at": "2026-07-21T08:10:25Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài không đang diễn ra |
| `QUESTION_STILL_ACTIVE` | 400 | Câu hiện tại chưa bị khóa |
| `NO_MORE_QUESTIONS` | 400 | Đã hết câu |

---

### POST /api/admin/exams/:exam_id/end

Kết thúc bài (sau câu cuối hoặc kết thúc sớm).

**Auth:** Admin.

**Request body:**

Kết thúc bình thường sau câu cuối:

```json
{
  "end_mode": "NORMAL"
}
```

Kết thúc sớm:

```json
{
  "end_mode": "EARLY",
  "reason": "Sự cố kỹ thuật cần kết thúc bài"
}
```

**Validation:**

- `end_mode` chỉ nhận `NORMAL` hoặc `EARLY`.
- Nếu `end_mode = NORMAL`:
  - Live state phải là `WAITING_NEXT`.
  - Câu cuối cùng phải đã bị khóa.
- Nếu `end_mode = EARLY`:
  - Exam phải đang `IN_PROGRESS`.
  - Bắt buộc có `reason`.
  - Phải ghi Audit Log.

**Điều kiện:**

- Exam đang `IN_PROGRESS`.
- Kết thúc bình thường chỉ được thực hiện sau khi câu cuối đã khóa.
- Kết thúc sớm được phép ở các live state đang vận hành, nhưng bắt buộc có lý do.

**Luồng backend:**

1. Khóa nhận đáp án.
2. Chuyển Exam sang `SUBMITTING`.
3. Chuyển các Attempt `IN_PROGRESS` sang `SUBMITTING`.
4. Chấm điểm tất cả Attempt.
5. Ghi điểm vào hồ sơ học viên (idempotent).
6. Cập nhật ranking.
7. Chuyển Attempt sang `COMPLETED`.
8. Chuyển Exam sang `COMPLETED`.
9. Ghi Audit Log.
10. Emit `exam:submitting` → `exam:completed`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "completed_at": "2026-07-21T08:20:00Z"
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---:|---|
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài không đang diễn ra |
| `INVALID_END_MODE` | 400 | End mode không hợp lệ |
| `FINAL_QUESTION_NOT_FINISHED` | 400 | Câu cuối chưa hoàn tất |
| `REASON_REQUIRED` | 400 | Kết thúc sớm phải có lý do |


---

### POST /api/admin/exams/:exam_id/cancel

Hủy bài kiểm tra.

**Auth:** Admin.

**Request body:**

```json
{
  "reason": "Lỗi kỹ thuật nghiêm trọng"
}
```

**Điều kiện:** Bài đang `WAITING_ROOM_OPEN` hoặc `IN_PROGRESS`.

**Luồng backend:**

1. Khóa nhận đáp án.
2. Chuyển Exam sang `CANCELLED`.
3. Chuyển Attempt active sang `CANCELLED`.
4. Không cộng điểm.
5. Ghi Audit Log.
6. Emit `exam:cancelled`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "CANCELLED"
  }
}
```

---

## 6. Admin API — Phòng chờ

### GET /api/admin/exams/:exam_id/waiting-room

Lấy danh sách học viên trong phòng chờ và thống kê.

**Auth:** Admin.

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo tên hoặc mã TKH |
| `group_id` | INT | Lọc theo nhóm |
| `joined` | boolean | Lọc đã vào / chưa vào |
| `online` | boolean | Lọc online / offline |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_eligible": 150,
      "joined": 87,
      "not_joined": 63,
      "online": 85,
      "disconnected": 2
    },
    "students": [
      {
        "season_membership_id": 25,
        "name": "Nguyễn Văn A",
        "tkh_code": "TKH2026-001",
        "group_name": "Nhóm 1 — Giô-suê",
        "joined_at": "2026-07-21T08:05:30Z",
        "is_online": true
      }
    ]
  }
}
```

---

## 7. Admin API — Trình chiếu (Live)

### GET /api/admin/exams/:exam_id/live

Lấy trạng thái live hiện tại (dùng cho TV và Admin khi reconnect).

**Auth:** Admin hoặc Presentation token.

**Response 200 — câu đang ACTIVE:**

```json
{
  "success": true,
  "data": {
    "exam_status": "IN_PROGRESS",
    "live_state": "ACTIVE",
    "current_question": {
      "question_id": 103,
      "question_index": 3,
      "total_questions": 10,
      "question_text": "Câu hỏi số 3...",
      "answer_a": "Đáp án A",
      "answer_b": "Đáp án B",
      "answer_c": "Đáp án C",
      "answer_d": "Đáp án D",
      "correct_answer": null,
      "server_now": "2026-07-21T08:07:08Z",
      "question_ends_at": "2026-07-21T08:07:25Z"
    },
    "answered_count": 72,
    "total_attempts": 143
  }
}
```

**Ghi chú:**

- `correct_answer` chỉ có giá trị khi `live_state = LOCKED` hoặc `WAITING_NEXT`.
- `question_text` và `answer_a/b/c/d` chỉ trả cho Admin và TV, không trả cho Student.

---

## 8. Admin API — Câu hỏi

### GET /api/admin/exams/:exam_id/questions

Lấy danh sách câu hỏi.

**Auth:** Admin.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "question_index": 1,
      "question_text": "Câu hỏi số 1...",
      "answer_a": "Đáp án A",
      "answer_b": "Đáp án B",
      "answer_c": "Đáp án C",
      "answer_d": "Đáp án D",
      "correct_answer": "B",
      "points": 10
    }
  ]
}
```

---

### POST /api/admin/exams/:exam_id/questions

Thêm câu hỏi mới.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Request body:**

```json
{
  "question_text": "Câu hỏi số 1...",
  "answer_a": "Đáp án A",
  "answer_b": "Đáp án B",
  "answer_c": "Đáp án C",
  "answer_d": "Đáp án D",
  "correct_answer": "B",
  "points": 10
}
```

**Validation:**

- `question_text`: bắt buộc, không rỗng.
- `answer_a/b/c/d`: bắt buộc, không rỗng.
- `correct_answer`: bắt buộc, phải là `A`, `B`, `C` hoặc `D`.
- `points`: số nguyên >= 0, mặc định 10.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 101,
    "question_index": 1
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `EXAM_LOCKED` | 400 | Bài đã mở phòng chờ, không thể thêm câu |
| `INVALID_CORRECT_ANSWER` | 400 | Đáp án đúng không hợp lệ |

---

---
### PUT /api/admin/exams/:exam_id/questions/:question_id

Sửa câu hỏi.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Request body:** _(các field muốn cập nhật)_

```json
{
  "question_text": "Nội dung mới...",
  "correct_answer": "C",
  "points": 15
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 101,
    "updated_at": "2026-07-14T10:00:00Z"
  }
}
```

---

### DELETE /api/admin/exams/:exam_id/questions/:question_id

Xóa câu hỏi.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### PUT /api/admin/exams/:exam_id/questions/reorder

Sắp xếp lại thứ tự câu hỏi.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Request body:**

```json
{
  "ordered_question_ids": [103, 101, 102, 104]
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "reordered": true
  }
}
```

---

### POST /api/admin/exams/:exam_id/questions/import-excel

Import câu hỏi từ file Excel.

**Auth:** Admin.

**Điều kiện:** Bài đang `DRAFT` hoặc `SCHEDULED`.

**Request:** `multipart/form-data`, field `file`.

**Định dạng Excel:**

| question_text | A | B | C | D | correct | points |
|---|---|---|---|---|---|---|
| Câu hỏi 1 | ... | ... | ... | ... | B | 10 |

**Quy tắc:**

- `correct` chỉ nhận `A`, `B`, `C`, `D`.
- `points` nếu để trống → mặc định 10.
- Nếu thiếu cột bắt buộc → báo lỗi, không import.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "imported": 10,
    "skipped": 0,
    "warnings": []
  }
}
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `INVALID_FILE_FORMAT` | 400 | File không đúng định dạng |
| `MISSING_COLUMNS` | 400 | Thiếu cột bắt buộc |
| `INVALID_CORRECT_ANSWER` | 400 | Giá trị correct không hợp lệ |

---

## 9. Admin API — Kết quả và báo cáo

### GET /api/admin/exams/:exam_id/results

Lấy kết quả toàn bộ học viên (Admin).

**Auth:** Admin.

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `group_id` | INT | Lọc theo nhóm |
| `sort` | string | `score_desc` (default), `name_asc` |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "exam_name": "Pre-test 1",
    "total_attempts": 143,
    "results": [
      {
        "season_membership_id": 25,
        "name": "Nguyễn Văn A",
        "tkh_code": "TKH2026-001",
        "group_name": "Nhóm 1 — Giô-suê",
        "attempt_no": 1,
        "score": 90,
        "correct_count": 9,
        "wrong_count": 1,
        "unanswered_count": 0,
        "is_late_join": false,
        "joined_question_index": null,
        "status": "COMPLETED",
        "started_at": "2026-07-21T08:10:00Z",
        "submitted_at": "2026-07-21T08:15:00Z",
        "rank_individual": 1
      }
    ]
  }
}
```

---

### GET /api/admin/exams/:exam_id/results/download

Tải file Excel kết quả.

**Auth:** Admin.

**Response:** File `.xlsx` với các sheets:

- Sheet 1: Kết quả học viên.
- Sheet 2: Chi tiết đáp án.
- Sheet 3: Kết nối và sự kiện.
- Sheet 4: Audit Reset.

**Tên file:**

```text
TKH2026_Test_PreTest1_YYYYMMDD_HHmm.xlsx
```

---

## 10. Admin API — Reset Attempt

### POST /api/admin/exams/:exam_id/attempts/:attempt_id/reset

Reset attempt của một học viên.

**Auth:** Admin.

**Request body:**

```json
{
  "reason": "Lỗi kỹ thuật nghiêm trọng, mất kết nối dài"
}
```

**Luồng backend:**

1. Không xóa attempt cũ.
2. Đánh dấu attempt cũ là `RESET`.
3. Nếu có điểm cũ → đánh dấu `VOIDED`.
4. Ghi Admin thực hiện, thời gian, lý do.
5. Ghi Audit Log.
6. Cho phép tạo attempt mới với `attempt_no` tăng thêm.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "old_attempt_id": 42,
    "old_attempt_status": "RESET",
    "new_attempt_no": 2
  }
}
```

Database requirement:

`exam_attempts.status` phải hỗ trợ:

```text
IN_PROGRESS
SUBMITTING
COMPLETED
RESET
CANCELLED
```

**Errors:**

| Code | HTTP | Mô tả |
|---|---|---|
| `ATTEMPT_NOT_FOUND` | 404 | Không tìm thấy attempt |
| `REASON_REQUIRED` | 400 | Phải có lý do reset |

---

## 11. Admin API — Cấu hình Ranking Visibility

### PUT /api/admin/season-settings/ranking-visibility

Bật/tắt hiển thị ranking toàn mùa.

**Auth:** Admin.

**Request body:**

```json
{
  "ranking_visible": false
}
```

**Ghi chú:**

- Đây là cấu hình **toàn mùa**, không theo từng exam.
- Backend vẫn tính ranking đầy đủ, chỉ ẩn phần hiển thị phía học viên.
- Admin vẫn xem được ranking.
- Phải ghi Audit Log khi thay đổi.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "ranking_visible": false,
    "updated_at": "2026-07-14T10:00:00Z"
  }
}
```

---

## 12. Admin API — Audit Log

### GET /api/admin/exams/:exam_id/events

Xem audit log của một bài kiểm tra.

**Auth:** Admin.

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `event_type` | string | Lọc theo loại sự kiện |
| `limit` | INT | Số bản ghi (default 50) |
| `offset` | INT | Phân trang |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type": "EXAM_STARTED",
      "actor_user_id": 5,
      "season_membership_id": null,
      "reason": null,
      "created_at": "2026-07-21T08:10:00Z"
    }
  ]
}
```

---

## 13. Error Codes tổng hợp

| Code | HTTP | Mô tả |
|---|---|---|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập hoặc token hết hạn |
| `FORBIDDEN` | 403 | Không có quyền |
| `EXAM_NOT_FOUND` | 404 | Bài kiểm tra không tồn tại |
| `EXAM_NOT_IN_PROGRESS` | 400 | Bài không đang diễn ra |
| `EXAM_LOCKED` | 400 | Bài đã khóa chỉnh sửa |
| `EXAM_NOT_OPEN` | 400 | Phòng chờ chưa mở |
| `EXAM_NOT_COMPLETED` | 400 | Bài chưa kết thúc |
| `QUESTION_NOT_ACTIVE` | 400 | Câu không đang mở |
| `QUESTION_STILL_ACTIVE` | 400 | Câu hiện tại chưa khóa |
| `ANSWER_TOO_LATE` | 400 | Hết giờ |
| `INVALID_ANSWER` | 400 | Đáp án không hợp lệ |
| `ATTEMPT_NOT_FOUND` | 404 | Không tìm thấy attempt |
| `ALREADY_COMPLETED` | 400 | Đã hoàn thành bài |
| `MEMBERSHIP_NOT_ELIGIBLE` | 403 | Không có season membership hợp lệ |
| `ANOTHER_EXAM_IN_PROGRESS` | 400 | Bài khác đang diễn ra trong mùa |
| `NO_QUESTIONS` | 400 | Chưa có câu hỏi |
| `INVALID_QUESTIONS` | 400 | Câu hỏi không hợp lệ |
| `NO_MORE_QUESTIONS` | 400 | Đã hết câu |
| `REASON_REQUIRED` | 400 | Cần có lý do |
| `INVALID_FILE_FORMAT` | 400 | File không đúng định dạng |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi hệ thống |
| `ATTEMPT_ALREADY_EXISTS` | 409 | Học viên đã có Attempt hợp lệ |
| `NO_ACTIVE_OR_UPCOMING_QUESTION` | 400 | Không còn câu hỏi để late join |
| `INVALID_RESULT_VISIBILITY` | 400 | Result visibility không hợp lệ |
| `INVALID_END_MODE` | 400 | End mode không hợp lệ |
| `FINAL_QUESTION_NOT_FINISHED` | 400 | Câu cuối chưa hoàn tất |


---

## 14. Tóm tắt endpoints

### Student

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/exams` | Danh sách bài kiểm tra |
| GET | `/api/exams/:id` | Chi tiết bài kiểm tra |
| POST | `/api/exams/:id/waiting-room/join` | Vào phòng chờ |
| GET | `/api/exams/:id/attempt` | Phục hồi trạng thái làm bài |
| POST | `/api/exams/:id/attempt/answer` | Gửi đáp án |
| GET | `/api/exams/:id/attempt/result` | Xem kết quả |
| POST | `/api/exams/:id/late-join` | Tạo Attempt late join |

### Admin

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/exams` | Danh sách bài (Admin) |
| POST | `/api/admin/exams` | Tạo bài mới |
| PUT | `/api/admin/exams/:id` | Sửa bài |
| POST | `/api/admin/exams/:id/open-waiting-room` | Mở phòng chờ |
| POST | `/api/admin/exams/:id/close-waiting-room` | Đóng phòng chờ |
| POST | `/api/admin/exams/:id/start` | Bắt đầu bài |
| POST | `/api/admin/exams/:id/next-question` | Mở câu tiếp theo |
| POST | `/api/admin/exams/:id/end` | Kết thúc bài |
| POST | `/api/admin/exams/:id/cancel` | Hủy bài |
| GET | `/api/admin/exams/:id/waiting-room` | Danh sách phòng chờ |
| GET | `/api/admin/exams/:id/live` | Trạng thái live |
| GET | `/api/admin/exams/:id/questions` | Danh sách câu hỏi |
| POST | `/api/admin/exams/:id/questions` | Thêm câu hỏi |
| PUT | `/api/admin/exams/:id/questions/:qid` | Sửa câu hỏi |
| DELETE | `/api/admin/exams/:id/questions/:qid` | Xóa câu hỏi |
| PUT | `/api/admin/exams/:id/questions/reorder` | Sắp xếp câu hỏi |
| POST | `/api/admin/exams/:id/questions/import-excel` | Import Excel |
| GET | `/api/admin/exams/:id/results` | Kết quả toàn bài |
| GET | `/api/admin/exams/:id/results/download` | Download Excel |
| POST | `/api/admin/exams/:id/attempts/:aid/reset` | Reset attempt |
| PUT | `/api/admin/season-settings/ranking-visibility` | Cấu hình ranking |
| GET | `/api/admin/exams/:id/events` | Audit log |
| PUT | `/api/admin/exams/:id/result-visibility` | Cấu hình hiển thị kết quả |


---

## 15. Checklist đồng bộ

- [x] Submit answer dùng REST, không dùng Socket.IO.
- [x] Student không nhận `question_text`, `correct_answer`.
- [x] Countdown dùng `serverNow` + `questionEndsAt`.
- [x] Late join được phép, tạo attempt với `is_late_join = 1`.
- [x] Admin mở câu tiếp theo (không tự động).
- [x] `result_visibility` thuộc Exam: `HIDDEN` / `SCORE_ONLY` / `FULL_RESULT`.
- [x] `ranking_visible` thuộc Season (`season_settings`).
- [x] TV dùng endpoint `/live` và room `exam:{examId}:presentation`.
- [x] Reset Attempt có Audit Log và lý do bắt buộc.
- [x] Submit và cộng điểm idempotent.
- [x] Không hard delete lịch sử Attempt.
- [x] Câu hỏi có field `points`.

---

## 16. Related Documents

- test-module-business-design.md (v1.1 Frozen)
- test-module-database-design.md (v1.2 Frozen)
- test-module-realtime-design.md (v1.2 Frozen)
- test-module-ui-design.md (v1.1 Frozen)

---

✅ API DESIGN FROZEN — MODULE KIỂM TRA — READY FOR IMPLEMENTATION
