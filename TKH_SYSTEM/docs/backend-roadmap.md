# TKH 2026 - Backend Roadmap

## 1. Công nghệ backend

- Node.js
- Express.js
- SQL Server
- bcrypt
- JWT hoặc session login
- dotenv

## 2. Cấu trúc backend dự kiến

TKH_SYSTEM
├── frontend
├── backend
│   ├── server.js
│   ├── config
│   │   └── db.js
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── score.routes.js
│   │   ├── group.routes.js
│   │   ├── session.routes.js
│   │   └── schedule.routes.js
│   ├── controllers
│   └── middleware
├── database
└── docs

## 3. API cần làm

### Auth

- POST /api/auth/login
- POST /api/auth/change-password
- POST /api/auth/logout
- GET /api/auth/me

### Attendance

- POST /api/attendance/check-in
- GET /api/attendance/my-history
- GET /api/admin/attendance/current-session

### Scores

- GET /api/scores/my-score
- GET /api/scores/group-ranking
- POST /api/admin/scores

### Sessions

- GET /api/sessions/active
- POST /api/admin/sessions
- PATCH /api/admin/sessions/:id/status

### Schedules

- GET /api/schedules
- POST /api/admin/schedules

### Random Bible Challenge

- GET /api/random/eligible-members

## 4. Thứ tự làm backend

1. Tạo backend folder
2. Cài Node.js packages
3. Kết nối SQL Server
4. Làm login thật
5. Làm đổi mật khẩu thật
6. Làm API lấy user hiện tại
7. Làm điểm danh GPS thật
8. Làm API điểm cá nhân
9. Làm API điểm nhóm
10. Làm API session hiện tại
11. Làm API random eligible members
12. Tích hợp với TKH-Bible-Challenge

## 5. Lưu ý bảo mật

- Không lưu mật khẩu text
- Dùng bcrypt để hash password
- Không cho frontend quyết định điểm danh thành công
- Backend phải tự tính khoảng cách GPS
- Admin API phải kiểm tra role = admin
- Dùng HTTPS khi chạy thật để GPS hoạt động ổn định