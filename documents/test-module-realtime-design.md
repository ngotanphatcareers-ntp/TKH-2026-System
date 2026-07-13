# TKH 2026 — MODULE KIỂM TRA REALTIME DESIGN

Version: 1.1  
Status: Reviewed  
Realtime: Socket.IO  
Late join V1: Cho phép  
Countdown: dùng `exams.time_per_question`  
Timer authority: Server  

---

## 0. Mục tiêu

Thiết kế realtime cho Module Kiểm tra nhằm:

- Admin điều khiển bài kiểm tra.
- Học viên nhận trạng thái tức thời.
- TV trình chiếu câu hỏi.
- Theo dõi kết nối.
- Phục hồi sau reconnect, refresh hoặc server restart.
- Hỗ trợ late join đúng business.
- Không làm lộ nội dung câu hỏi cho học viên.

---

## 1. Kết nối Socket.IO

### 1.1 Namespace

```text
/exams
```

### 1.2 Auth handshake

Client gửi access token:

```js
io("/exams", {
  auth: {
    token: "<access_token>"
  }
});
```

Server:

1. Verify token.
2. Resolve user.
3. Resolve member.
4. Resolve current season.
5. Resolve season membership.
6. Kiểm tra role.
7. Reject nếu không hợp lệ.

---

## 2. Rooms

### 2.1 Student room

```text
exam:{examId}
```

### 2.2 Admin room

```text
exam:{examId}:admin
```

### 2.3 Presentation room

```text
exam:{examId}:presentation
```

TV chỉ nhận dữ liệu trình chiếu.

TV không có quyền:

- Start.
- Cancel.
- Next question.
- Reset.
- Xem danh sách học viên chi tiết.

### 2.4 Join room

Student:

- Join room sau khi được xác thực và đủ điều kiện.
- Không bắt buộc phải đã vào waiting room nếu đang late join hợp lệ.

Admin:

- Join admin room sau khi xác thực role Admin.

TV:

- Join presentation room bằng token hoặc quyền trình chiếu phù hợp.

---

## 3. State machine

### 3.1 Exam states

```text
DRAFT
SCHEDULED
WAITING_ROOM_OPEN
IN_PROGRESS
SUBMITTING
COMPLETED
CANCELLED
```

### 3.2 Live question states

```text
WAITING
ACTIVE
LOCKED
WAITING_NEXT
COMPLETED
```

### 3.3 Luồng chuẩn

```text
Admin mở phòng chờ
    ↓
WAITING_ROOM_OPEN
    ↓
Admin bắt đầu bài
    ↓
IN_PROGRESS
    ↓
Admin kích hoạt câu đầu tiên
    ↓
ACTIVE
    ↓
Server countdown
    ↓
Hết giờ
    ↓
LOCKED
    ↓
TV hiển thị đáp án đúng
    ↓
WAITING_NEXT
    ↓
Admin bấm mở câu tiếp theo
```

Khi hết câu cuối:

```text
LOCKED
    ↓
SUBMITTING
    ↓
Backend chấm điểm
    ↓
COMPLETED
```

### 3.4 Quyết định chuyển câu

- Server tự khóa câu khi hết giờ.
- Admin chủ động bấm mở câu tiếp theo.
- V1 không tự động chuyển ngay sang câu tiếp theo.
- Điều này giúp BTC có thời gian giải thích đáp án và xử lý sự cố.

---

## 4. Events — Student

### 4.1 Server → Student

| Event | Payload chính | Khi nào |
|---|---|---|
| `exam:waiting_room_open` | `examId` | Mở phòng chờ |
| `exam:started` | exam info | Bắt đầu bài |
| `question:activated` | question state | Câu mới |
| `question:locked` | question identifiers | Khóa câu |
| `exam:submitting` | `examId` | Thu bài |
| `exam:completed` | `examId` | Hoàn tất |
| `exam:cancelled` | `examId`, `reason` | Hủy bài |
| `sync:state` | state phù hợp role | Reconnect/refresh |

Student không được nhận:

- `question_text`
- Nội dung đáp án A/B/C/D
- `correct_answer`

### 4.2 Payload `question:activated`

```json
{
  "examId": 1,
  "questionId": 3,
  "questionIndex": 3,
  "totalQuestions": 10,
  "secondsTotal": 20,
  "serverNow": "2026-07-14T10:00:00Z",
  "questionEndsAt": "2026-07-14T10:00:20Z"
}
```

Client dùng `questionEndsAt` làm nguồn chính.

### 4.3 Student → Server

| Event | Payload | Ghi chú |
|---|---|---|
| `presence:ping` | `{ examId }` | Heartbeat |
| `sync:request` | `{ examId }` | Yêu cầu đồng bộ lại |

Submit answer không dùng Socket.IO trong V1.

Submit answer dùng REST.

---

## 5. Events — Admin

### 5.1 Server → Admin

| Event | Payload | Khi nào |
|---|---|---|
| `student:joined` | membership info | Vào phòng chờ |
| `student:late_joined` | late join info | Vào trễ |
| `student:connected` | membership id | Kết nối |
| `student:disconnected` | membership id | Mất kết nối |
| `waiting_room:stats` | stats | Thống kê thay đổi |
| `answer:count_updated` | count | DB đã commit answer |
| `question:activated` | full question | Câu mới |
| `question:locked` | correct answer | Khóa câu |
| `exam:submitting` | exam id | Thu bài |
| `exam:completed` | exam id | Hoàn tất |
| `sync:state` | admin state | Reconnect |

### 5.2 Payload `student:late_joined`

```json
{
  "examId": 1,
  "seasonMembershipId": 25,
  "joinedQuestionIndex": 3,
  "joinedAt": "2026-07-14T10:02:10Z"
}
```

### 5.3 Admin → Server

Các thao tác điều khiển dùng REST:

- Open waiting room.
- Close waiting room.
- Start exam.
- Activate next question.
- Cancel exam.
- End exam.
- Reset attempt.
- Change ranking visibility.

Socket.IO chỉ push trạng thái sau khi REST thành công.

---

## 6. Events — TV / Presentation

### 6.1 Server → Presentation

| Event | Payload |
|---|---|
| `question:activated` | Nội dung câu, 4 đáp án, countdown |
| `question:locked` | Đáp án đúng |
| `answer:count_updated` | Số đã trả lời |
| `exam:submitting` | Trạng thái thu bài |
| `exam:completed` | Màn hình kết thúc |
| `sync:state` | Presentation state |

### 6.2 Quyền

Presentation client chỉ đọc.

Không nhận:

- Danh sách học viên đầy đủ.
- Thông tin reset.
- Audit log.
- Token hoặc quyền Admin.

---

## 7. Countdown và đồng bộ thời gian

### 7.1 Nguồn sự thật

Server là nguồn thời gian duy nhất.

Client chỉ hiển thị.

### 7.2 Quy tắc

Khi activate câu, server lưu:

- `question_started_at`
- `question_ends_at`
- live state

Sau đó server emit event.

### 7.3 Validation đáp án

Backend chỉ chấp nhận đáp án khi:

- Exam status = `IN_PROGRESS`.
- Question state = `ACTIVE`.
- Question ID đúng câu hiện tại.
- Server time chưa vượt `question_ends_at`.
- Attempt hợp lệ.

Không dựa vào countdown client.

### 7.4 Lỗi nghiệp vụ

```text
QUESTION_NOT_ACTIVE
QUESTION_ALREADY_LOCKED
ANSWER_TOO_LATE
EXAM_NOT_IN_PROGRESS
ATTEMPT_NOT_FOUND
MEMBERSHIP_NOT_ELIGIBLE
```

---

## 8. Flow submit answer

```text
Student bấm A/B/C/D
    ↓
POST answer qua REST
    ↓
Backend validate exam/question/time
    ↓
Upsert exam_attempt_answers
    ↓
Transaction commit
    ↓
Đếm answer hợp lệ
    ↓
Emit answer:count_updated cho Admin + TV
    ↓
REST trả answerAccepted cho Student
```

Chỉ emit count sau khi database commit thành công.

---

## 9. Reconnect và refresh

### 9.1 sync:state cho Student

```json
{
  "examId": 1,
  "examStatus": "IN_PROGRESS",
  "currentQuestionId": 3,
  "currentQuestionIndex": 3,
  "totalQuestions": 10,
  "questionEndsAt": "2026-07-14T10:00:20Z",
  "serverNow": "2026-07-14T10:00:08Z",
  "selectedAnswer": "B",
  "answerAccepted": true,
  "isLateJoin": false
}
```

### 9.2 sync:state cho Admin

Có thể gồm:

- Exam status.
- Live state.
- Current question.
- Student counts.
- Answered count.
- Online/offline summary.

### 9.3 sync:state cho TV

Có thể gồm:

- Question text.
- Four answers.
- Current question index.
- Countdown.
- Correct answer nếu state đã LOCKED.
- Answered count.

### 9.4 Điều hướng UI

- `WAITING_ROOM_OPEN` → phòng chờ.
- `IN_PROGRESS + ACTIVE` → màn làm bài.
- `IN_PROGRESS + WAITING_NEXT` → chờ câu tiếp.
- `SUBMITTING` → màn thu bài.
- `COMPLETED` → kết quả.
- `CANCELLED` → quay về danh sách.

---

## 10. Late join

### 10.1 Điều kiện

Late join được phép nếu:

- Học viên đã đăng nhập.
- Có season membership hợp lệ.
- Bài đang `IN_PROGRESS`.
- Bài chưa `SUBMITTING`.
- Còn câu hỏi hiện tại hoặc câu tiếp theo.

### 10.2 Luồng

1. Server kiểm tra membership.
2. Server đọc live state.
3. Nếu chưa có attempt, tạo attempt.
4. Ghi `is_late_join = 1` và `joined_question_index = currentQuestionIndex`.
5. Join student room.
6. Emit `sync:state`.
7. Student chỉ được trả lời câu ACTIVE nếu còn thời gian.
8. Các câu cũ xem là chưa trả lời và đã khóa.
9. Không cộng thêm thời gian riêng.
10. Emit `student:late_joined` cho Admin.
11. Ghi audit event.

---

## 11. Presence

### 11.1 Heartbeat

Student gửi `presence:ping` mỗi 15–30 giây.

### 11.2 Offline threshold

Server coi client offline khi:

- Socket disconnect rõ ràng; hoặc
- Không có heartbeat trong 45–60 giây.

### 11.3 Database

- Presence realtime giữ trong memory.
- `last_seen_at` có thể cập nhật theo khoảng thời gian.
- Không ghi mỗi ping vào SQL Server.

---

## 12. Server restart recovery

Khi Node.js restart:

1. Đọc `exams.status`.
2. Đọc `exam_live_states`.
3. Xác định câu hiện tại.
4. So sánh server time với `question_ends_at`.
5. Nếu câu đã hết giờ, chuyển state sang `LOCKED` hoặc `WAITING_NEXT`.
6. Nếu câu còn thời gian, phục hồi timer còn lại.
7. Client reconnect nhận `sync:state`.

Không giữ runtime state duy nhất trong memory.

---

## 13. Audit

Các thao tác REST quan trọng phải:

1. Validate quyền.
2. Thực hiện transaction.
3. Ghi audit event.
4. Commit database.
5. Sau đó mới emit Socket.IO event.

Không emit trạng thái thành công trước khi transaction commit.

---

## 14. Checklist review

- [ ] Student không nhận nội dung câu hỏi.
- [ ] TV và Admin dùng room riêng.
- [ ] Countdown theo server time.
- [ ] Dùng `questionEndsAt`.
- [ ] Hết giờ tự khóa câu.
- [ ] Admin mở câu tiếp theo.
- [ ] Late join được hỗ trợ.
- [ ] Câu cũ bị khóa với late join.
- [ ] Không cộng thêm thời gian.
- [ ] Answer qua REST.
- [ ] Emit count sau DB commit.
- [ ] Có sync state theo role.
- [ ] Có heartbeat.
- [ ] Có phục hồi server restart.
- [ ] Có audit cho thao tác quan trọng.

---

✅ REALTIME DESIGN REVIEWED — MODULE KIỂM TRA
