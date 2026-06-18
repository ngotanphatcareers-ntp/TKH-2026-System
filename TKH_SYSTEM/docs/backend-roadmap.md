# TKH 2026 - Backend Roadmap (V2)

## 1. Mục tiêu

Chuyển hệ thống từ Frontend Demo sang hệ thống hoạt động thực tế.

Toàn bộ dữ liệu sẽ được lưu trong SQL Server thay vì localStorage.

---

## 2. Công nghệ sử dụng

### Backend

* Node.js
* Express.js

### Database

* SQL Server Express

### Authentication

* bcrypt
* JWT

### Khác

* dotenv
* cors
* mssql

---

## 3. Cấu trúc Backend

```text
TKH_SYSTEM
│
├── frontend
│
├── backend
│   ├── server.js
│   │
│   ├── config
│   │   └── db.js
│   │
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── score.routes.js
│   │   ├── group.routes.js
│   │   ├── session.routes.js
│   │   ├── schedule.routes.js
│   │   └── settings.routes.js
│   │
│   ├── controllers
│   │
│   ├── middleware
│   │   ├── auth.middleware.js
│   │   └── admin.middleware.js
│   │
│   └── services
│
├── database
│
└── docs
```

---

## 4. API Modules

### Authentication

* POST /api/auth/login
* POST /api/auth/change-password
* POST /api/auth/logout
* GET /api/auth/me

### Attendance

* POST /api/attendance/check-in
* GET /api/attendance/my-history

### Scores

* GET /api/scores/my-score
* GET /api/scores/group-ranking

### Sessions

* GET /api/sessions/active
* POST /api/admin/sessions
* PATCH /api/admin/sessions/:id

### Schedule

* GET /api/schedules
* POST /api/admin/schedules

### Settings

* GET /api/settings
* PATCH /api/admin/settings

### Bible Challenge

* GET /api/random/eligible-members

---

## 5. Quy tắc GPS

Frontend chỉ gửi:

* latitude
* longitude
* accuracy

Backend sẽ:

* Tính khoảng cách tới nhà thờ
* Kiểm tra bán kính
* Kiểm tra độ chính xác GPS
* Quyết định điểm danh thành công hay không

---

## 6. Import Thành Viên

Nguồn dữ liệu:

Excel

Dự kiến:

160-180 thành viên

Quy trình:

Excel
→ Import
→ SQL Server
→ Tạo User

Mật khẩu mặc định:

123456

---

## 7. Thứ tự triển khai

### Phase 1

* Cài Node.js
* Tạo Backend Folder
* Kết nối SQL Server

### Phase 2

* Login thật
* JWT
* Đổi mật khẩu thật

### Phase 3

* Điểm danh GPS thật
* Attendance Records

### Phase 4

* Điểm cá nhân
* Điểm nhóm

### Phase 5

* Random Bible Challenge Integration

### Phase 6

* Import Excel thành viên

---

## 8. Bảo mật

* Không lưu password dạng text
* Hash bằng bcrypt
* JWT Authentication
* Admin API phải kiểm tra role
* Attendance phải được xác thực ở Backend

---

## 9. Trạng thái hiện tại

Frontend: Hoàn thành

Database Design: Hoàn thành

GitHub: Hoàn thành

Netlify: Hoàn thành

Backend: Chưa bắt đầu
