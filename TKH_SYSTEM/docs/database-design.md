# TKH 2026 - Database Design (Version 2)

## 1. Mục tiêu

Database dùng để quản lý:

* Tài khoản thành viên
* Nhóm
* Buổi học
* Nội dung học
* Điểm danh GPS
* Điểm cá nhân
* Điểm nhóm
* Điều kiện Random Bible Challenge
* Cấu hình hệ thống

---

## 2. Danh sách bảng chính

Hệ thống sẽ gồm các bảng:

* groups
* users
* sessions
* schedules
* attendance_records
* scores
* settings

---

# 3. Bảng groups

Lưu thông tin nhóm.

| Field      | Type          | Note        |
| ---------- | ------------- | ----------- |
| id         | INT           | Primary Key |
| group_name | NVARCHAR(100) | Tên nhóm    |
| logo_url   | NVARCHAR(255) | Logo nhóm   |
| created_at | DATETIME      | Ngày tạo    |

Ví dụ:

* Giô-sép
* Đa-vít
* Ê-xơ-tê
* Đa-ni-ên
* Giô-suê
* Ru-tơ
* Phi-e-rơ
* Phao-lô

---

# 4. Bảng users

Lưu tài khoản thành viên.

| Field          | Type          | Note                      |
| -------------- | ------------- | ------------------------- |
| id             | INT           | Primary Key               |
| username       | NVARCHAR(50)  | Tên đăng nhập             |
| password_hash  | NVARCHAR(255) | Mật khẩu đã mã hóa        |
| full_name      | NVARCHAR(150) | Họ tên                    |
| nickname       | NVARCHAR(100) | Tên gọi ngắn              |
| gender         | NVARCHAR(20)  | Male / Female             |
| group_id       | INT           | Nhóm                      |
| role           | NVARCHAR(30)  | admin / student / teacher |
| is_first_login | BIT           | Bắt buộc đổi mật khẩu     |
| is_active      | BIT           | Tài khoản hoạt động       |
| created_at     | DATETIME      | Ngày tạo                  |

---

# 5. Bảng sessions

Lưu các buổi học.

Đây là bảng trung tâm của hệ thống.

| Field             | Type          | Note               |
| ----------------- | ------------- | ------------------ |
| id                | INT           | Primary Key        |
| session_name      | NVARCHAR(100) | Ví dụ: Buổi 1      |
| session_date      | DATE          | Ngày học           |
| start_time        | TIME          | Giờ bắt đầu        |
| end_time          | TIME          | Giờ kết thúc       |
| attendance_status | NVARCHAR(30)  | Open / Closed      |
| random_status     | NVARCHAR(30)  | Open / Closed      |
| session_status    | NVARCHAR(30)  | Active / Completed |
| created_at        | DATETIME      | Ngày tạo           |

Ví dụ:

* Buổi 1
* Buổi 2
* Buổi 3

---

# 6. Bảng schedules

Lưu nội dung học tập.

Mỗi session sẽ có một schedule tương ứng.

| Field       | Type          | Note              |
| ----------- | ------------- | ----------------- |
| id          | INT           | Primary Key       |
| session_id  | INT           | Liên kết sessions |
| title       | NVARCHAR(150) | Chủ đề            |
| bible_verse | NVARCHAR(150) | Câu gốc           |
| activity    | NVARCHAR(255) | Hoạt động         |
| speaker     | NVARCHAR(150) | Người phụ trách   |
| note        | NVARCHAR(500) | Ghi chú           |
| created_at  | DATETIME      | Ngày tạo          |

Ví dụ:

Buổi 3

* Chủ đề: Yêu thương và phục vụ
* Câu gốc: Giăng 13:34
* Hoạt động: Bible Challenge

---

# 7. Bảng attendance_records

Lưu lịch sử điểm danh.

| Field               | Type           | Note                        |
| ------------------- | -------------- | --------------------------- |
| id                  | INT            | Primary Key                 |
| user_id             | INT            | Thành viên                  |
| session_id          | INT            | Buổi học                    |
| checkin_time        | DATETIME       | Thời gian điểm danh         |
| latitude            | DECIMAL(18,15) | Vĩ độ                       |
| longitude           | DECIMAL(18,15) | Kinh độ                     |
| distance_meters     | DECIMAL(10,2)  | Khoảng cách                 |
| gps_accuracy_meters | DECIMAL(10,2)  | Độ chính xác GPS            |
| status              | NVARCHAR(30)   | Present / Rejected / Manual |
| note                | NVARCHAR(255)  | Ghi chú                     |
| created_at          | DATETIME       | Ngày tạo                    |

---

# 8. Bảng scores

Lưu lịch sử cộng/trừ điểm.

| Field       | Type          | Note                                         |
| ----------- | ------------- | -------------------------------------------- |
| id          | INT           | Primary Key                                  |
| user_id     | INT           | Thành viên                                   |
| session_id  | INT           | Buổi học                                     |
| score_value | INT           | Điểm cộng hoặc trừ                           |
| score_type  | NVARCHAR(50)  | attendance / bible_challenge / game / manual |
| reason      | NVARCHAR(255) | Lý do                                        |
| created_by  | INT           | Admin tạo điểm                               |
| created_at  | DATETIME      | Ngày tạo                                     |

Ví dụ:

+5 Điểm danh

+10 Trả bài cũ

+20 Trò chơi

-5 Vi phạm nội quy

---

# 9. Bảng settings

Lưu cấu hình hệ thống.

| Field         | Type          | Note         |
| ------------- | ------------- | ------------ |
| id            | INT           | Primary Key  |
| setting_key   | NVARCHAR(100) | Tên cấu hình |
| setting_value | NVARCHAR(255) | Giá trị      |
| description   | NVARCHAR(255) | Ghi chú      |
| created_at    | DATETIME      | Ngày tạo     |

Ví dụ:

| setting_key             | setting_value      |
| ----------------------- | ------------------ |
| church_latitude         | 10.765926509333024 |
| church_longitude        | 106.6643590819157  |
| checkin_radius_meters   | 200                |
| max_gps_accuracy_meters | 100                |

---

# 10. Cách tính điểm cá nhân

Công thức:

Tổng điểm cá nhân = SUM(score_value)

theo user_id.

---

# 11. Cách tính điểm nhóm

Công thức:

Điểm nhóm = Tổng điểm của tất cả thành viên trong nhóm.

Tính từ:

groups
→ users
→ scores

---

# 12. Điều kiện được Random Bible Challenge

Một thành viên được đưa vào vòng random khi:

* Có attendance_records
* session_id là buổi học hiện tại
* status = Present

Logic:

Nếu đã điểm danh hợp lệ
→ Được tham gia Random Bible Challenge

---

# 13. Quy tắc bảo mật

Không lưu mật khẩu dạng text.

Phải sử dụng:

* bcrypt
* password_hash

Không sử dụng:

* password

---

# 14. Kiến trúc hệ thống

users
↓
attendance_records
↓
scores
↓
groups

sessions
↓
schedules

settings
↓
GPS Attendance Configuration

Bible Challenge
↓
Random từ attendance_records(status = Present)
