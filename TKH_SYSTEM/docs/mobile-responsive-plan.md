# TKH 2026 - Mobile Responsive Plan

## 1. Mục tiêu

Tối ưu giao diện TKH cho điện thoại vì phần lớn học viên sẽ sử dụng mobile để:

- Đăng nhập
- Điểm danh GPS
- Xem điểm cá nhân
- Xem điểm nhóm
- Xem lịch học

## 2. Nguyên tắc thiết kế

- Mobile first cho học viên
- Desktop ưu tiên cho Admin
- Nút bấm đủ lớn để thao tác bằng tay
- Nội dung quan trọng hiển thị trước
- Không để bảng bị tràn ngang trên điện thoại

## 3. Các màn hình cần tối ưu mobile

### Học viên

- login.html
- dashboard.html
- attendance.html
- my-score.html
- group-score.html
- schedule.html
- change-password.html

### Admin

- admin-dashboard.html
- admin-members.html
- admin-groups.html
- admin-attendance.html
- admin-session.html
- admin-score.html
- admin-schedule.html

## 4. Các vấn đề hiện tại

### Sidebar

Hiện tại sidebar nằm bên trái và chiếm nhiều diện tích trên mobile.

Giải pháp:

- Desktop: giữ sidebar bên trái
- Mobile: chuyển thành menu dạng nút ☰

### Cards

Hiện tại cards đang hiển thị 3 cột.

Giải pháp:

- Desktop: 3 cột
- Mobile: 1 cột

### Tables

Hiện tại bảng có nhiều cột, dễ bị tràn ngang.

Giải pháp giai đoạn đầu:

- Cho phép cuộn ngang
- Sau này có thể chuyển table thành card list

### Buttons

Nút cần dễ bấm trên điện thoại.

Quy tắc:

- Chiều cao tối thiểu 44px
- Khoảng cách giữa các nút rõ ràng

## 5. CSS cần thêm

Sẽ thêm media query:

```css
@media (max-width: 768px) {
    .app-page {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
    }

    .main-content {
        padding: 16px;
    }

    .cards {
        grid-template-columns: 1fr;
    }

    .admin-actions {
        grid-template-columns: 1fr;
    }

    .score-table {
        min-width: 700px;
    }

    .attendance-box {
        overflow-x: auto;
    }
}