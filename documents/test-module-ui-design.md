# TKH 2026 — MODULE KIỂM TRA UI DESIGN

Version: 1.0  
Status: Draft  
Dựa trên: test-module-business-design.md v1.0  

---

# 1. Tổng quan màn hình

Module Kiểm tra gồm các màn hình sau:

| STT | Màn hình | Vai trò |
|-----|----------|---------|
| 1 | Trang danh sách bài kiểm tra | Học viên |
| 2 | Phòng chờ | Học viên |
| 3 | Bài kiểm tra — Chọn đáp án | Học viên |
| 4 | Kết quả bài kiểm tra | Học viên |
| 5 | Phòng chờ Admin | Admin |
| 6 | Màn hình trình chiếu câu hỏi | Admin / TV |
| 7 | Quản lý bài kiểm tra | Admin |
| 8 | Quản lý câu hỏi | Admin |
| 9 | Trạng thái lỗi / mất kết nối | Học viên + Admin |


---

# 1.1 UI Flow Diagram

Luồng sử dụng của học viên:

```text
Đăng nhập
    │
    ▼
Dashboard
    │
    ▼
Kiểm tra
    │
    ▼
Danh sách bài kiểm tra
    │
    ▼
Phòng chờ
    │
    ▼
Làm bài
    │
    ▼
Đang thu bài
    │
    ▼
Kết quả
    │
    ▼
Quay về Dashboard
```

Luồng sử dụng của Admin:

```text
Dashboard Admin
      │
      ▼
Quản lý bài kiểm tra
      │
      ▼
Quản lý câu hỏi
      │
      ▼
Mở phòng chờ
      │
      ▼
Bắt đầu bài kiểm tra
      │
      ▼
Trình chiếu câu hỏi
      │
      ▼
Kết thúc bài
      │
      ▼
Xem kết quả
```

---

# 1.2 State Diagram

Trạng thái của một bài kiểm tra:

```text
DRAFT
   │
   ▼
SCHEDULED
   │
   ▼
WAITING_ROOM_OPEN
   │
   ▼
IN_PROGRESS
   │
   ▼
SUBMITTING
   │
   ▼
COMPLETED

        ▲
        │
   CANCELLED
```

Ý nghĩa:

| State | Mô tả |
|--------|------|
| DRAFT | Admin đang soạn bài |
| SCHEDULED | Đã lên lịch |
| WAITING_ROOM_OPEN | Học viên được phép vào phòng chờ |
| IN_PROGRESS | Đang làm bài |
| SUBMITTING | Backend đang thu bài và chấm điểm |
| COMPLETED | Đã hoàn thành |
| CANCELLED | BTC hủy bài kiểm tra |


---

# 2. Màn hình 1 — Trang danh sách bài kiểm tra (Học viên)

## 2.1 Đường dẫn

```
/kiem-tra
```

## 2.2 Mô tả

Học viên vào trang này để xem 4 bài kiểm tra của mùa TKH 2026.  
Mỗi bài hiển thị dưới dạng card.  
Trạng thái card thay đổi theo trạng thái bài kiểm tra.

## 2.3 Layout tổng thể

```
┌─────────────────────────────────┐
│  📝 Kiểm tra                    │  ← Tiêu đề trang
│  Thánh Kinh Hè 2026             │  ← Subtitle
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐     │
│  │ PRE-TEST │  │ PRE-TEST │     │
│  │    1     │  │    2     │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │ PRE-TEST │  │  FINAL   │     │
│  │    3     │  │   TEST   │     │
│  └──────────┘  └──────────┘     │
└─────────────────────────────────┘
```

Grid 2 cột trên desktop, 1 cột trên mobile.

## 2.4 Thiết kế từng Card

### Cấu trúc Card

```
┌────────────────────────────────────┐
│  [BADGE LOẠI BÀI]                  │  ← PRE-TEST / FINAL TEST
│                                    │
│  Tên bài kiểm tra                  │  ← VD: Pre-test 1
│  📅 21/07/2026 · 08:00             │  ← Ngày giờ
│  ❓ 10 câu hỏi                     │  ← Số câu
│  ⏱ 20 giây / câu                  │  ← Thời gian mỗi câu
│                                    │
│  ● Trạng thái                      │  ← Badge trạng thái
│                                    │
│  [       NÚT HÀNH ĐỘNG       ]     │  ← Nút (nếu có)
└────────────────────────────────────┘
```

## 2.5 Quy tắc hiển thị theo trạng thái

| Trạng thái | Màu Card | Badge | Nút |
|------------|----------|-------|-----|
| DRAFT | Ẩn hoàn toàn | — | — |
| SCHEDULED | Mờ (opacity 0.5) | ⏰ Sắp diễn ra | Không có |
| WAITING_ROOM_OPEN | Highlight (viền xanh lá) | 🟢 Phòng chờ đang mở | "Vào phòng chờ" |
| IN_PROGRESS (đã vào phòng chờ) | Highlight (viền vàng) | 🟡 Đang diễn ra | "Vào bài kiểm tra" |
| IN_PROGRESS (chưa vào phòng chờ) | Mờ (opacity 0.5) | 🔴 Đã bắt đầu | Không có |
| SUBMITTING | Bình thường | ⏳ Đang thu bài | Không có |
| COMPLETED | Bình thường | ✅ Đã kết thúc | "Xem kết quả" (nếu Admin cho phép) |
| CANCELLED | Mờ (opacity 0.5) | ❌ Đã hủy | Không có |

## 2.6 Màu sắc badge trạng thái

Dùng đúng class CSS hiện có trong `style.css`:

| Trạng thái | Class CSS |
|------------|-----------|
| SCHEDULED | badge-gray |
| WAITING_ROOM_OPEN | badge-green |
| IN_PROGRESS | badge-yellow |
| SUBMITTING | badge-orange |
| COMPLETED | badge-blue |
| CANCELLED | badge-red |

## 2.7 Responsive

- Desktop (≥768px): Grid 2 cột.
- Mobile (<768px): Grid 1 cột, full width.
- Card chiều cao tự động theo nội dung.

## 2.8 Trạng thái rỗng

Nếu không có bài kiểm tra nào:

```
┌────────────────────────────────────┐
│                                    │
│            📝                      │
│   Chưa có bài kiểm tra nào.        │
│                                    │
└────────────────────────────────────┘
```

## 2.9 Dữ liệu cần từ API

```
GET /api/exams?season_id={current_season_id}

Trả về:
- id
- name
- type           (PRE_TEST | FINAL_TEST)
- exam_date
- exam_time
- total_questions
- time_per_question
- status         (DRAFT | SCHEDULED | WAITING_ROOM_OPEN | IN_PROGRESS | SUBMITTING | COMPLETED | CANCELLED)
- allow_view_result
```

---

# 3. Màn hình 2 — Phòng chờ (Học viên)

## 3.1 Đường dẫn

```
/kiem-tra/{exam_id}/phong-cho
```

## 3.2 Mô tả

Học viên vào đây sau khi bấm "Vào phòng chờ".  
Màn hình này giữ kết nối realtime (Socket.IO) với server.  
Khi Admin bấm "Bắt đầu", học viên tự động được chuyển sang màn hình bài kiểm tra.

## 3.3 Layout

```
┌──────────────────────────────────────┐
│  PRE-TEST 1                          │  ← Tên bài kiểm tra
│  Thánh Kinh Hè 2026                  │
├──────────────────────────────────────┤
│                                      │
│         ✅ Bạn đã sẵn sàng!          │  ← Icon + thông báo lớn
│                                      │
│  Họ tên:    Nguyễn Văn A             │
│  Mã TKH:   TKH2026-001              │
│  Nhóm:      Nhóm 1 — Giô-suê        │
│                                      │
│  🟢 Đã kết nối                       │  ← Trạng thái kết nối realtime
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Vui lòng giữ nguyên màn hình  │  │  ← Hộp thông báo nổi bật
│  │ và chờ BTC bắt đầu bài kiểm   │  │
│  │ tra. Không thoát khỏi trang.  │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Đang chờ BTC bắt đầu...  ⏳]      │  ← Loading indicator
│                                      │
└──────────────────────────────────────┘
```

## 3.4 Trạng thái kết nối

| Trạng thái | Hiển thị | Màu |
|------------|----------|-----|
| Đã kết nối | 🟢 Đã kết nối | Xanh lá |
| Mất kết nối | 🔴 Mất kết nối — Đang thử lại... | Đỏ |
| Đang kết nối lại | 🟡 Đang kết nối lại... | Vàng |

## 3.5 Điều kiện truy cập

Học viên chỉ vào được trang này khi:

- Đã đăng nhập.
- Có Season Membership hợp lệ.
- Bài kiểm tra thuộc mùa hiện tại.
- Trạng thái bài là `WAITING_ROOM_OPEN`.
- Học viên chưa có Attempt chính thức đã hoàn thành.

Nếu không đủ điều kiện → redirect về `/kiem-tra` kèm thông báo lỗi.

## 3.6 Sự kiện realtime (Socket.IO)

| Sự kiện lắng nghe | Hành động |
|-------------------|-----------|
| `exam:started` | Tự động redirect sang `/kiem-tra/{exam_id}/lam-bai` |
| `exam:cancelled` | Redirect về `/kiem-tra` + thông báo "Bài kiểm tra đã bị hủy" |
| `disconnect` | Hiển thị trạng thái mất kết nối, tự động thử kết nối lại |

## 3.7 Dữ liệu cần từ API

```
POST /api/exams/{exam_id}/waiting-room/join
→ Ghi nhận học viên đã vào phòng chờ

GET /api/exams/{exam_id}
→ Lấy thông tin bài kiểm tra để hiển thị tên

GET /api/auth/me
→ Lấy thông tin học viên (họ tên, mã TKH, nhóm)
```

---

# 4. Màn hình 3 — Bài kiểm tra — Chọn đáp án (Học viên)

## 4.1 Đường dẫn

```
/kiem-tra/{exam_id}/lam-bai
```

## 4.2 Mô tả

Học viên thấy toàn bộ danh sách câu hỏi (chỉ số thứ tự, không thấy nội dung).  
Chỉ câu đang được Admin trình chiếu mới được phép chọn đáp án.  
Countdown hiển thị thời gian còn lại của câu hiện tại.  
Khi hết giờ, câu tự động bị khóa và chuyển sang câu tiếp theo.

## 4.3 Layout tổng thể

```
┌────────────────────────────────────────┐
│  PRE-TEST 1  ·  Câu 3 / 10            │  ← Header: tên bài + tiến trình
│  ⏱ Còn lại: 12 giây                   │  ← Countdown nổi bật
│  ████████░░░░░░░░░░  (progress bar)    │  ← Thanh tiến trình countdown
├────────────────────────────────────────┤
│                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Câu 1│ │ Câu 2│ │ Câu 3│ │ Câu 4│  │  ← Dòng chỉ số câu (cuộn ngang)
│  │  ✅  │ │  ✅  │ │  🔵  │ │      │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Câu 1   [A] [B] [C] [D]   🔒 Đã khóa │
│  Câu 2   [A] [B] [C] [D]   🔒 Đã khóa │
│  Câu 3   [A] [B] [C] [D]   ← ĐANG MỞ  │  ← Câu hiện tại highlight
│  Câu 4   [A] [B] [C] [D]   🔜 Chưa mở │
│  Câu 5   [A] [B] [C] [D]   🔜 Chưa mở │
│  ...                                   │
│                                        │
└────────────────────────────────────────┘
```

## 4.4 Trạng thái từng câu

| Trạng thái | Ký hiệu | Màu nền | Mô tả |
|------------|---------|---------|-------|
| LOCKED_PAST (đã trả lời) | ✅ | Xanh nhạt | Đã chọn đáp án, bị khóa |
| LOCKED_PAST (chưa trả lời) | ⬜ | Xám nhạt | Hết giờ, không trả lời |
| ACTIVE | 🔵 | Xanh dương viền nổi | Đang mở, được phép chọn |
| LOCKED_FUTURE | 🔜 | Trắng mờ | Chưa đến lượt |

## 4.5 Thiết kế từng dòng câu hỏi

### Câu đã khóa (LOCKED_PAST)

```
┌────────────────────────────────────────────────┐
│  Câu 1                                         │
│  [A ✓]  [ B ]  [ C ]  [ D ]   🔒              │
│  (đáp án A được tô đậm vì học viên đã chọn)   │
└────────────────────────────────────────────────┘
```

### Câu đang mở (ACTIVE)

```
┌────────────────────────────────────────────────┐
│  Câu 3  ← ĐANG MỞ                ⏱ 12 giây   │
│                                                │
│  [ A ]  [ B ]  [ C ]  [ D ]                   │
│  (nút lớn, dễ bấm trên mobile)                │
└────────────────────────────────────────────────┘
```

### Câu chưa mở (LOCKED_FUTURE)

```
┌────────────────────────────────────────────────┐
│  Câu 4                                         │
│  [ A ]  [ B ]  [ C ]  [ D ]   🔜 Chưa mở     │
│  (nút mờ, không bấm được)                     │
└────────────────────────────────────────────────┘
```

## 4.6 Nút chọn đáp án A / B / C / D

Kích thước tối thiểu: **44px × 44px** (đủ bấm trên mobile).

| Trạng thái nút | Màu nền | Viền |
|----------------|---------|------|
| Chưa chọn | Trắng | Xám |
| Hover | Xanh nhạt | Xanh |
| Đã chọn | Xanh đậm | Xanh đậm |
| Bị khóa — câu cũ | Xám nhạt | Xám |
| Bị khóa — câu tương lai | Trắng mờ | Xám mờ |

## 4.7 Countdown

- Hiển thị số giây còn lại dạng lớn, nổi bật ở đầu trang.
- Thanh progress bar thu dần từ phải sang trái.
- Khi còn ≤ 5 giây: chữ đổi sang màu đỏ, progress bar đổi sang đỏ.
- Khi hết giờ: câu tự động bị khóa, không nhận thêm đáp án.

## 4.8 Sự kiện realtime (Socket.IO)

### Lắng nghe từ server

| Sự kiện | Hành động |
|---------|-----------|
| `question:activated` | Mở câu mới, reset countdown |
| `question:locked` | Khóa câu hiện tại |
| `exam:completed` | Redirect sang `/kiem-tra/{exam_id}/ket-qua` |
| `exam:cancelled` | Redirect về `/kiem-tra` + thông báo hủy |
| `disconnect` | Hiển thị banner mất kết nối, tự thử kết nối lại |

### Gửi lên server

| Sự kiện | Khi nào |
|---------|---------|
| `answer:submit` | Học viên chọn hoặc đổi đáp án |

## 4.9 Quy tắc quan trọng

- Học viên **KHÔNG** thấy nội dung câu hỏi trên điện thoại.
- Học viên chỉ thấy số thứ tự câu và 4 nút A B C D.
- Chỉ câu `ACTIVE` được phép chọn.
- Đáp án được lưu ngay khi bấm — không cần nút "Gửi".
- Có thể đổi đáp án trong khi câu còn `ACTIVE`.
- Khi câu bị khóa → đáp án cuối cùng được ghi nhận chính thức.

## 4.10 Responsive

- Mobile (<768px): nút A B C D to, 2 nút / hàng.
- Desktop (≥768px): 4 nút / hàng.
- Danh sách câu cuộn dọc tự do.

## 4.11 Dữ liệu cần từ API

```
GET /api/exams/{exam_id}/attempt
→ Lấy attempt hiện tại của học viên (danh sách câu, đáp án đã chọn)

POST /api/exams/{exam_id}/attempt/answer
Body: { question_id, answer }
→ Gửi hoặc cập nhật đáp án
```

---

# 5. Màn hình 4 — Kết quả bài kiểm tra (Học viên)

## 5.1 Đường dẫn

```
/kiem-tra/{exam_id}/ket-qua
```

## 5.2 Mô tả

Hiển thị sau khi bài kiểm tra kết thúc.  
Nội dung hiển thị phụ thuộc vào **loại bài** và **cấu hình Admin**:

| Loại bài | Điểm bài thi | Cộng hồ sơ | Ranking cá nhân & nhóm |
|----------|-------------|------------|------------------------|
| PRE_TEST | ✅ Luôn hiện | ✅ Luôn cộng | ✅ Luôn hiện |
| FINAL_TEST | ✅ Luôn hiện | ✅ Luôn cộng | ⚙️ Admin ẩn/mở tùy ý |

## 5.3 Layout — Pre-test (hoặc Final Test khi Ranking đang mở)

```
┌──────────────────────────────────────────┐
│  🎉 Bài kiểm tra đã kết thúc!            │
│  PRE-TEST 1 — 21/07/2026                 │
├──────────────────────────────────────────┤
│                                          │
│         ┌───────────────────┐            │
│         │    8 / 10         │            │  ← Điểm lớn, nổi bật
│         │  câu đúng         │            │
│         └───────────────────┘            │
│                                          │
│  Điểm của bạn:   80 điểm                │
│  Xếp hạng cá nhân:  #12 / 150           │
│  Xếp hạng nhóm:     Nhóm Giô-suê #3    │
│                                          │
├──────────────────────────────────────────┤
│  Chi tiết từng câu:                      │
│                                          │
│  Câu 1   Bạn chọn: A   ✅ Đúng          │
│  Câu 2   Bạn chọn: C   ✅ Đúng          │
│  Câu 3   Bạn chọn: B   ❌ Sai           │
│  Câu 4   Bạn chọn: —   ❌ Không trả lời │
│  ...                                     │
│                                          │
│  [  Về trang Kiểm tra  ]                 │
└──────────────────────────────────────────┘
```

## 5.4 Layout — Final Test khi Admin đang ẩn Ranking

```
┌──────────────────────────────────────────┐
│  🎉 Bài kiểm tra đã kết thúc!            │
│  FINAL TEST — 2026                       │
├──────────────────────────────────────────┤
│                                          │
│         ┌───────────────────┐            │
│         │    9 / 10         │            │  ← Điểm vẫn hiện đầy đủ
│         │  câu đúng         │            │
│         └───────────────────┘            │
│                                          │
│  Điểm của bạn:   90 điểm                │
│                                          │
│         🔒                               │
│   Xếp hạng sẽ được BTC công bố          │
│   vào thời điểm thích hợp.              │
│                                          │
├──────────────────────────────────────────┤
│  Chi tiết từng câu:                      │
│                                          │
│  Câu 1   Bạn chọn: A   ✅ Đúng          │
│  Câu 2   Bạn chọn: C   ✅ Đúng          │
│  ...                                     │
│                                          │
│  [  Về trang Kiểm tra  ]                 │
└──────────────────────────────────────────┘
```

## 5.5 Quy tắc hiển thị chi tiết câu

| Trường hợp | Hiển thị |
|------------|----------|
| Trả lời đúng | ✅ Đúng |
| Trả lời sai | ❌ Sai |
| Không trả lời | ❌ Không trả lời |

> Không hiện đáp án đúng là gì — tránh học viên ghi nhớ để gian lận ở bài tiếp theo.

## 5.6 Đồng bộ sau khi nộp bài

Sau khi bài kết thúc, hệ thống tự động:

1. Chấm điểm toàn bộ câu trả lời.
2. Cộng điểm vào hồ sơ học viên.
3. Cập nhật ranking cá nhân.
4. Cập nhật ranking nhóm.
5. Trả kết quả về màn hình học viên.

> Với Final Test: ranking được tính và lưu đầy đủ trong database,  
> nhưng **chỉ ẩn hiển thị phía học viên** nếu Admin bật chế độ ẩn.

## 5.7 Dữ liệu cần từ API

```
GET /api/exams/{exam_id}/attempt/result
→ Trả về:
  - exam_type          (PRE_TEST | FINAL_TEST)
  - score              (điểm số)
  - total_questions    (tổng câu)
  - correct_count      (số câu đúng)
  - rank_individual    (xếp hạng cá nhân — null nếu đang ẩn)
  - rank_group         (xếp hạng nhóm — null nếu đang ẩn)
  - ranking_hidden     (true | false — do Admin cấu hình)
  - answers[]          (question_id, chosen_answer, is_correct)
```

---

# 6. Màn hình 5 — Phòng chờ Admin

## 6.1 Đường dẫn

```
/admin/kiem-tra/{exam_id}/phong-cho
```

## 6.2 Mô tả

Admin dùng màn hình này để theo dõi học viên đang vào phòng chờ  
và điều khiển thời điểm bắt đầu bài kiểm tra.

## 6.3 Layout tổng thể

```
┌───────────────────────────────────────────────────┐
│  PRE-TEST 1 — Phòng chờ Admin                     │
├─────────────────────────┬─────────────────────────┤
│  BẢNG ĐIỀU KHIỂN        │  DANH SÁCH HỌC VIÊN     │
│                         │                         │
│  Tổng học viên: 150     │  🔍 Tìm tên / mã TKH    │
│  Đã vào phòng:   87     │  Lọc: [Nhóm][Trạng thái]│
│  Chưa vào:       63     │                         │
│  Online:         85     │  Tên     Mã TKH   Nhóm  │
│  Mất kết nối:     2     │  Nguyễn A  001    Nhóm1 │
│                         │  Trần B    002    Nhóm2 │
│  [Mở phòng chờ]         │  ...                    │
│  [Đóng phòng chờ]       │                         │
│  [BẮT ĐẦU KIỂM TRA]     │                         │
│  [Hủy bài kiểm tra]     │                         │
└─────────────────────────┴─────────────────────────┘
```

## 6.4 Bảng thống kê realtime

| Chỉ số | Mô tả |
|--------|-------|
| Tổng học viên | Tổng số học viên hợp lệ trong mùa |
| Đã vào phòng | Số học viên đã join phòng chờ |
| Chưa vào | Tổng - Đã vào |
| Online | Đang kết nối Socket.IO |
| Mất kết nối | Đã join nhưng mất kết nối |

Cập nhật realtime qua Socket.IO.

## 6.5 Danh sách học viên

Mỗi dòng gồm:

- Họ tên
- Mã TKH
- Nhóm
- Thời gian vào phòng (HH:MM:SS)
- Trạng thái kết nối: 🟢 Online / 🔴 Mất kết nối

Bộ lọc:

- Tìm theo tên hoặc mã TKH
- Lọc theo nhóm
- Lọc: Đã vào / Chưa vào
- Lọc: Online / Mất kết nối

## 6.6 Các nút điều khiển

| Nút | Điều kiện hiển thị | Hành động |
|-----|--------------------|-----------| 
| Mở phòng chờ | Trạng thái SCHEDULED | Chuyển sang WAITING_ROOM_OPEN |
| Đóng phòng chờ | Trạng thái WAITING_ROOM_OPEN | Đóng phòng chờ |
| BẮT ĐẦU KIỂM TRA | Trạng thái WAITING_ROOM_OPEN + đủ điều kiện | Hiện popup xác nhận rồi bắt đầu |
| Hủy bài kiểm tra | Trạng thái WAITING_ROOM_OPEN | Hiện popup xác nhận rồi hủy |

## 6.7 Điều kiện nút BẮT ĐẦU được kích hoạt

- Bài có ít nhất 1 câu hỏi.
- Mỗi câu có đủ 4 đáp án.
- Mỗi câu có đúng 1 đáp án đúng.
- Thời gian mỗi câu hợp lệ.
- Không có bài khác đang IN_PROGRESS trong cùng mùa.

Nếu chưa đủ điều kiện: nút bị disable + tooltip giải thích lý do.

## 6.8 Popup xác nhận BẮT ĐẦU

```
┌──────────────────────────────────┐
│  ⚠️ Xác nhận bắt đầu?           │
│                                  │
│  PRE-TEST 1                      │
│  87 / 150 học viên đã vào phòng  │
│                                  │
│  Sau khi bắt đầu:                │
│  - Không thể chỉnh sửa câu hỏi  │
│  - Học viên chưa vào sẽ bị lỡ   │
│                                  │
│  [Hủy]       [Bắt đầu ngay]     │
└──────────────────────────────────┘
```

## 6.9 Sự kiện realtime (Socket.IO)

| Sự kiện lắng nghe | Hành động |
|-------------------|-----------| 
| `student:joined` | Cập nhật số đã vào phòng |
| `student:connected` | Cập nhật trạng thái online |
| `student:disconnected` | Cập nhật trạng thái mất kết nối |

## 6.10 Dữ liệu cần từ API

```
GET  /api/admin/exams/{exam_id}/waiting-room
→ Danh sách học viên, trạng thái kết nối, thống kê

POST /api/admin/exams/{exam_id}/open-waiting-room
POST /api/admin/exams/{exam_id}/start
POST /api/admin/exams/{exam_id}/cancel
```

---

# 7. Màn hình 6 — Trình chiếu câu hỏi (Admin / TV)

## 7.1 Đường dẫn

```
/admin/kiem-tra/{exam_id}/trinh-chieu
```

## 7.2 Mô tả

Màn hình này dành để chiếu lên TV hoặc màn hình lớn trong phòng thi.  
Admin mở trên máy tính, kết nối với TV qua HDMI hoặc Chromecast.  
**Tỉ lệ ưu tiên: 16:9 (landscape)** — phân bổ không gian để học viên nhìn rõ nhất phần **nội dung câu hỏi**.  
Hiển thị câu hỏi hiện tại, countdown và tiến trình bài kiểm tra.  
Không hiển thị đáp án đúng khi câu đang mở.

## 7.3 Layout tổng thể (16:9)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  PRE-TEST 1   ·   Câu 3 / 10                     Thánh Kinh Hè 2026        │
├────────────────────────────────────────────────────────────────────────────┤
│  Đã trả lời: 87 / 150                 🟢 Đang kết nối: 142                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   Nội dung câu hỏi hiển thị ở đây (chiếm phần lớn chiều rộng)              │
│   (font chữ lớn, dễ đọc từ xa, tối ưu 16:9)                                │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  A.  Đáp án A                                                              │
│  B.  Đáp án B                                                              │
│  C.  Đáp án C                                                              │
│  D.  Đáp án D                                                              │
├────────────────────────────────────────────────────────────────────────────┤
│   ⏱  12 giây            ████████████████░░░░░░░░░░░░░░  (progress bar)     │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.4 Thiết kế chữ

Màn hình trình chiếu dùng font lớn hơn màn hình thường:

| Thành phần | Kích thước font |
|------------|----------------|
| Nội dung câu hỏi | 32–44px |
| Đáp án A B C D | 24–30px |
| Countdown | 56–80px |
| Header (tên bài, câu số) | 18–22px |

## 7.5 Trạng thái countdown

| Thời gian còn lại | Màu countdown | Màu progress bar |
|-------------------|---------------|-----------------|
| > 5 giây | Đen / trắng (tùy nền) | Xanh lá |
| ≤ 5 giây | Đỏ | Đỏ |
| Hết giờ | Hiện "Hết giờ!" | Rỗng |

## 7.6 Sau khi câu bị khóa

Hiển thị đáp án đúng với màu highlight xanh lá:

```
┌─────────────────────────────────────────────────────────┐
│  A.  Đáp án A                                           │
│  B.  Đáp án B   ✅  ← ĐÁP ÁN ĐÚNG (highlight xanh lá) │
│  C.  Đáp án C                                           │
│  D.  Đáp án D                                           │
│                                                         │
│  [Câu tiếp theo →]   ← Nút Admin bấm để chuyển câu     │
└─────────────────────────────────────────────────────────┘
```

Thời gian hiển thị đáp án đúng: **3–5 giây** hoặc đến khi Admin bấm "Câu tiếp theo".

## 7.7 Màn hình kết thúc bài

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              🎉 Bài kiểm tra đã kết thúc!               │
│                  PRE-TEST 1 — 21/07/2026                │
│                                                         │
│              Tổng học viên nộp bài: 143 / 150           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 7.8 Sự kiện realtime (Socket.IO)

| Sự kiện lắng nghe | Hành động |
|-------------------|-----------|
| `question:activated` | Hiển thị câu mới, reset countdown |
| `question:locked` | Khóa câu, hiện đáp án đúng |
| `answer:count_updated` | Cập nhật số học viên đã trả lời |
| `exam:completed` | Hiển thị màn hình kết thúc |

## 7.9 Dữ liệu cần từ API

```
GET /api/admin/exams/{exam_id}/live
→ Trả về câu hỏi hiện tại, countdown, số học viên đã trả lời
```

---

# 8. Màn hình 7 — Admin: Quản lý bài kiểm tra

## 8.1 Đường dẫn

```
/admin/kiem-tra
```

## 8.2 Mục tiêu

Admin quản lý danh sách bài kiểm tra của mùa hiện tại:

- Tạo bài mới
- Chỉnh sửa thông tin bài
- Mở phòng chờ / Bắt đầu / Kết thúc / Hủy
- Xem nhanh số câu, thời gian, trạng thái
- Vào các màn hình: Phòng chờ Admin, Trình chiếu, Kết quả tổng

## 8.3 Layout tổng thể

```
┌───────────────────────────────────────────────────────────┐
│  🛠 Quản lý Kiểm tra                                      │
│  Season: [TKH 2026 ▼]    [ + Tạo bài kiểm tra ]           │
├───────────────────────────────────────────────────────────┤
│  🔍 Tìm bài...     Lọc trạng thái: [Tất cả ▼]            │
├───────────────────────────────────────────────────────────┤
│  Bài kiểm tra   Loại     Ngày/giờ     Số câu   Trạng thái │
│  Pre-test 1     PRE      21/07 08:00  10      SCHEDULED   │
│  Pre-test 2     PRE      28/07 08:00  10      DRAFT       │
│  Pre-test 3     PRE      04/08 08:00  10      WAITING...  │
│  Final Test     FINAL    10/08 14:00  20      COMPLETED   │
│                                                           │
│  [Xem] [Sửa] [Câu hỏi] [Phòng chờ] [Trình chiếu] [KQ]     │
└───────────────────────────────────────────────────────────┘
```

## 8.4 Cột dữ liệu bắt buộc

- Tên bài kiểm tra
- Loại: `PRE_TEST` / `FINAL_TEST`
- Ngày giờ dự kiến
- Số câu
- Thời gian mỗi câu (giây)
- Trạng thái

## 8.5 Action theo trạng thái

| Trạng thái | Cho phép |
|-----------|----------|
| DRAFT | Sửa, Quản lý câu hỏi, Lên lịch |
| SCHEDULED | Mở phòng chờ, Sửa lịch |
| WAITING_ROOM_OPEN | Vào phòng chờ Admin, Bắt đầu, Đóng phòng chờ, Hủy |
| IN_PROGRESS | Vào trình chiếu, Kết thúc (nếu cần) |
| SUBMITTING | Chỉ xem trạng thái |
| COMPLETED | Xem kết quả, Download |
| CANCELLED | Chỉ xem |

## 8.6 Form tạo/sửa bài kiểm tra

Fields:

- Name (Pre-test 1...)
- Type (`PRE_TEST` / `FINAL_TEST`)
- Exam date
- Exam time
- Time per question (giây)
- (Optional) Tổng số câu dự kiến (read-only hoặc auto từ câu hỏi)

Validate:

- Ngày/giờ hợp lệ
- Time per question > 0

## 8.7 Setting đặc biệt cho Final Test: Ẩn/Hiện Ranking

Chỉ với bài `FINAL_TEST` hiển thị thêm toggle:

- [ ] Ẩn Ranking cá nhân và nhóm (Final Test)

Giải thích nhỏ:

- Ẩn chỉ ảnh hưởng việc **hiển thị** cho học viên
- Điểm vẫn chấm và cộng hồ sơ bình thường
- Ranking vẫn được tính và lưu (để mở lại sau)

## 8.8 Dữ liệu cần từ API

```
GET  /api/admin/exams?season_id={current}
POST /api/admin/exams
PUT  /api/admin/exams/{exam_id}

POST /api/admin/exams/{exam_id}/open-waiting-room
POST /api/admin/exams/{exam_id}/close-waiting-room
POST /api/admin/exams/{exam_id}/start
POST /api/admin/exams/{exam_id}/end
POST /api/admin/exams/{exam_id}/cancel

PUT  /api/admin/exams/{exam_id}/ranking-visibility
Body: { ranking_hidden: true|false }
```

---

# 9. Màn hình 8 — Admin: Quản lý câu hỏi

## 9.1 Đường dẫn

```
/admin/kiem-tra/{exam_id}/cau-hoi
```

## 9.2 Mục tiêu

Admin tạo và quản lý danh sách câu hỏi cho một bài kiểm tra:

- Thêm / sửa / xóa câu hỏi
- Nhập nội dung câu hỏi + 4 đáp án A/B/C/D
- Chọn đúng 1 đáp án đúng
- Countdown dùng **duy nhất** `time_per_question` của bài (không override theo từng câu)
- Sắp xếp thứ tự câu
- Validate trước khi bắt đầu bài

## 9.3 Layout tổng thể

```
┌──────────────────────────────────────────────────────────────┐
│  PRE-TEST 1 — Quản lý câu hỏi                                │
│  Trạng thái bài: DRAFT                                       │
│  [ + Thêm câu hỏi ]   [ Import Excel ]   [Lưu]               │
├──────────────────────────────────────────────────────────────┤
│  Danh sách câu (drag để sắp xếp):                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ #1  Nội dung câu hỏi... (rút gọn 1 dòng)               │  │
│  │     A. ...   B. ...   C. ...   D. ...                  │  │
│  │     Đúng: B     Thời gian: 20s (từ bài thi)            │  │
│  │     [Sửa] [Xóa]                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ #2  ...                                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 9.4 Form thêm/sửa câu hỏi

Fields:

- Question text (nội dung câu hỏi)
- Answer A
- Answer B
- Answer C
- Answer D
- Correct answer: (A | B | C | D) — bắt buộc đúng 1

Validate:

- Không rỗng question text
- Đủ 4 đáp án
- Correct answer phải được chọn

## 9.5 Quy tắc khóa chỉnh sửa

Khi bài đã chuyển trạng thái:

- `WAITING_ROOM_OPEN` trở đi: **khóa chỉnh sửa câu hỏi**
- Chỉ cho xem danh sách câu

UI thể hiện:

- Hiện banner: "Bài đã mở phòng chờ, không thể chỉnh sửa câu hỏi"
- Ẩn hoặc disable nút [Thêm], [Sửa], [Xóa], [Import Excel]

## 9.6 Validate trước khi bắt đầu

Nút "BẮT ĐẦU KIỂM TRA" (ở màn phòng chờ Admin) chỉ bật khi:

- Có ít nhất 1 câu hỏi
- Mỗi câu có đủ 4 đáp án
- Mỗi câu có đúng 1 đáp án đúng
- `time_per_question` của bài > 0

Ở trang này hiển thị “Checklist hợp lệ”:

- [ ] Có câu hỏi
- [ ] Mỗi câu đủ 4 đáp án
- [ ] Mỗi câu có 1 đáp án đúng
- [ ] Thời gian bài thi hợp lệ

## 9.7 Import câu hỏi từ Excel (roadmap: làm nếu đơn giản)

Mục tiêu: Admin import nhanh danh sách câu hỏi từ file Excel.

Định dạng file đề xuất:

| question_text | A | B | C | D | correct |
|--------------|---|---|---|---|---------|
| ... | ... | ... | ... | ... | A/B/C/D |

Quy tắc:

- `correct` chỉ nhận A/B/C/D.
- Nếu thiếu cột hoặc giá trị sai → báo lỗi và không import.
- Import xong hiển thị preview và yêu cầu Admin xác nhận lưu.

## 9.8 Dữ liệu cần từ API

```
GET    /api/admin/exams/{exam_id}/questions
POST   /api/admin/exams/{exam_id}/questions
PUT    /api/admin/exams/{exam_id}/questions/{question_id}
DELETE /api/admin/exams/{exam_id}/questions/{question_id}

PUT /api/admin/exams/{exam_id}/questions/reorder
Body: { ordered_question_ids: [ ... ] }

POST /api/admin/exams/{exam_id}/questions/import-excel
(FormData: file)
```

---

# 10. Màn hình 9 — Lỗi, mất kết nối, late join (Học viên + Admin)

## 10.1 Mục tiêu

Trong môi trường thi thật, lỗi mạng là chuyện **chắc chắn sẽ xảy ra**.  
UI cần hướng dẫn rõ ràng, không gây hoảng, và giúp BTC xử lý nhanh.

Phạm vi:

- Mất kết nối Socket.IO
- Refresh trang giữa chừng
- Rớt mạng 3G/4G
- Học viên vào trễ (late join)
- Admin đóng/mở phòng chờ
- Server đang SUBMITTING

## 10.2 Nguyên tắc UX

- Thông báo ngắn, rõ, hướng dẫn hành động tiếp theo.
- Không dùng thông báo mơ hồ kiểu "Có lỗi xảy ra".
- Luôn hiển thị trạng thái: "Đang thử kết nối lại..." và số lần thử.
- Khi mất kết nối: vẫn giữ UI đọc được, nhưng khóa thao tác nếu cần.

## 10.3 Banner mất kết nối (Học viên)

Hiển thị sticky ở đầu trang trong lúc Socket disconnected:

```
┌────────────────────────────────────────────────────────────┐
│ 🔴 Mất kết nối. Đang thử kết nối lại... (3)               │
│ Vui lòng giữ nguyên màn hình.                             │
└────────────────────────────────────────────────────────────┘
```

Trạng thái:

| Case | Hiển thị |
|------|----------|
| Mất kết nối < 10s | Banner đỏ + auto reconnect |
| Mất kết nối ≥ 10s | Banner đỏ + nút "Tải lại trang" |
| Kết nối lại thành công | Banner xanh 2s: "Đã kết nối lại" |

## 10.4 Refresh trang khi đang làm bài

Khi học viên refresh / mở lại tab:

- App gọi `GET /api/exams/{exam_id}/attempt` để phục hồi trạng thái.
- Server trả về:
  - Câu hiện tại đang ACTIVE (index)
  - Đáp án đã chọn trước đó
  - Thời gian còn lại của câu hiện tại (nếu cần)

UI hiển thị:

- Tự động đưa về đúng màn hình (`/lam-bai` nếu bài đang IN_PROGRESS)
- Hiện toast: "Đã khôi phục bài làm".

## 10.5 Late join (học viên vào trễ)

Theo business design:

- Nếu bài đã `IN_PROGRESS` và học viên **chưa vào phòng chờ**:
  - Mặc định **không cho tham gia**.
  - Card hiển thị: "Bài kiểm tra đã bắt đầu".

Nếu BTC sau này muốn cho phép ngoại lệ:

- Admin có thể có nút "Cho phép late join" (không bắt buộc trong V1).
- Khi bật ngoại lệ, học viên vào sẽ bắt đầu từ câu hiện tại.

V1 UI (đúng business):

```
Bạn không thể tham gia vì bài kiểm tra đã bắt đầu.
Vui lòng liên hệ BTC nếu bạn gặp sự cố kỹ thuật.
[Quay lại]
```

## 10.6 Trạng thái SUBMITTING

Khi bài chuyển sang `SUBMITTING`:

- Học viên thấy màn hình khóa thao tác:

```
⏳ Đang thu bài...
Vui lòng không tắt trình duyệt.
```

- Nếu reload: vẫn trả về màn hình SUBMITTING.

## 10.7 Case Admin mất kết nối

Ở các màn Admin (phòng chờ/trình chiếu):

- Banner đỏ: "Mất kết nối server — đang thử lại..."
- Nút điều khiển bị disable trong lúc mất kết nối.
- Khi reconnect: tự đồng bộ trạng thái bài.

## 10.8 Dữ liệu cần từ API

```
GET /api/exams/{exam_id}/attempt
→ phục hồi trạng thái

GET /api/admin/exams/{exam_id}/live
→ đồng bộ trạng thái trình chiếu
```

---

✅ HOÀN TẤT UI DESIGN — Module Kiểm tra

