# TKH PROJECT
## Project Status

---

# Thông tin dự án

Tên dự án:
TKH 2026 Management System

Mục đích:
Website quản lý chương trình Thánh Kinh Hè dành cho khoảng 160–200 học viên.

Người phát triển:
Ngô Tấn Phát

Framework hiện tại:
- HTML
- CSS
- JavaScript (Vanilla)

Deploy:
- Netlify

Version:
Frontend Demo

Ngày bắt đầu:
06/2026

---

# Kiến trúc dự án

Frontend
↓
Backend (Node.js + Express)   ← Chưa bắt đầu
↓
MySQL Database                ← Chưa bắt đầu

---

# MODULE STATUS

## 1. Đăng nhập

Status:
✅ Hoàn thành Demo

Đã có:

- Login
- Phân quyền Admin / Student
- Đổi mật khẩu Demo
- LocalStorage

Backend:
⬜ Chưa

---

## 2. Dashboard

Status:
✅ Hoàn thành

Đã có:

- Xin chào theo tên
- Hiển thị nhóm
- Card điểm
- Card điểm danh
- Card hộp thư khích lệ

Backend:
⬜ Chưa

---

## 3. Điểm danh GPS

Status:
✅ Hoàn thành Demo

Đã có:

- GPS
- Kiểm tra bán kính Nhà thờ
- Hiển thị khoảng cách
- Chống điểm danh nhiều lần trong ngày
- Lưu lịch sử điểm danh Demo

Dự kiến Backend:

- Lưu Database
- Session Attendance
- Thiết bị
- IP
- Browser
- GPS History
- Phát hiện 1 thiết bị điểm danh nhiều tài khoản

---

## 4. Điểm cá nhân

Status:
✅ Demo

---

## 5. Điểm nhóm

Status:
✅ Demo

---

## 6. Lịch học

Status:
✅ Demo

---

## 7. Quản trị

Status:
✅ Demo

Đã có:

- Dashboard
- Thành viên
- Nhóm
- Điểm
- Buổi học
- Lịch học

---

## 8. Câu hỏi buổi học

Status:
✅ Hoàn thành

Đã có:

Học viên

- Câu hỏi riêng tư
- Câu hỏi công khai

Admin

- Nhận câu hỏi
- Phản hồi
- Học viên xem phản hồi
- Thời gian phản hồi

Dự kiến Backend:

- Thông báo realtime
- Bộ lọc
- Đánh dấu đã xử lý

---

## 9. Hộp thư khích lệ

Status:
✅ Gần hoàn thiện

Đã có:

- Gửi lời khích lệ
- Gửi ẩn danh
- Chỉ gửi 1 lần/người/ngày
- Dashboard báo có lời khích lệ mới
- Đánh dấu đã đọc
- Xem hộp thư
- Avatar
- Đếm số lời khích lệ
- Danh sách thành viên hiển thị số lời khích lệ
- Admin thống kê:
    - Tổng lời khích lệ
    - Hôm nay
    - Ẩn danh
    - Top người gửi
    - Top người nhận

Sẽ làm tiếp:

⬜ Ghim lời khích lệ yêu thích

⬜ Admin xem toàn bộ lời khích lệ

⬜ Admin tìm kiếm

⬜ Lọc theo nhóm

---

## 10. Bible Challenge

Status:
✅ Hoàn thành

Bao gồm:

- Random nhóm
- Random thành viên
- Animation
- Âm thanh
- Confetti

---

## 11. Kho tài liệu

Status:
⬜ Chưa làm

Ý tưởng:

Admin upload

↓

Học viên xem

↓

Download

---

## 12. Notification

Status:
⬜ Chưa làm

Ý tưởng:

Thông báo

- Có tài liệu mới

- Có câu trả lời

- Có lời khích lệ

- Có lịch học mới

---

# BACKEND

Status

⬜ Chưa bắt đầu

Dự kiến

Node.js

Express

REST API

JWT

bcrypt

Multer

MySQL

---

# DATABASE

Status

⬜ Chưa bắt đầu

Dự kiến bảng

users

groups

attendance

attendance_sessions

scores

group_scores

questions

question_replies

encouragements

learning_materials

notifications

devices

login_logs

---

# CÁC QUYẾT ĐỊNH QUAN TRỌNG

Đã thống nhất:

✔ Không làm chuỗi khích lệ liên tiếp

✔ Khích lệ dạng Hộp thư

✔ Có gửi ẩn danh

✔ Chỉ gửi 1 lần/ngày/người

✔ Dashboard hiển thị lời khích lệ mới

✔ Có phản hồi câu hỏi riêng tư

✔ Có câu hỏi công khai

✔ Backend làm sau khi Frontend hoàn thiện

---

# LỘ TRÌNH

Frontend

███████████░░░░░░░ 70%

Backend

░░░░░░░░░░░░░░░░░░ 0%

Database

░░░░░░░░░░░░░░░░░░ 0%

Testing

████░░░░░░░░░░░░░░ 20%

Deploy Production

░░░░░░░░░░░░░░░░░░ 0%

---

# Ghi chú

Mỗi khi hoàn thành một module lớn,
hãy cập nhật file này trước khi commit Git.

File này là tài liệu chính để ChatGPT và người phát triển biết chính xác dự án đang ở giai đoạn nào.