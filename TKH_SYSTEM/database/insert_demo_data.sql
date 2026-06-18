USE TKH_SYSTEM;
GO

INSERT INTO groups (group_name, logo_url)
VALUES
(N'Giô-sép', NULL),
(N'Đa-vít', NULL),
(N'Ê-xơ-tê', NULL),
(N'Đa-ni-ên', NULL),
(N'Giô-suê', NULL),
(N'Ru-tơ', NULL),
(N'Phi-e-rơ', NULL),
(N'Phao-lô', NULL);

INSERT INTO users (
    username,
    password_hash,
    full_name,
    nickname,
    gender,
    group_id,
    role,
    is_first_login,
    is_active
)
VALUES
(N'admin', N'demo_hash_123456', N'Quản trị viên TKH', N'Admin', NULL, NULL, N'admin', 0, 1),
(N'user001', N'demo_hash_123456', N'Nguyễn Văn A', N'An', N'Male', 1, N'student', 1, 1),
(N'user002', N'demo_hash_123456', N'Trần Thị B', N'Bình', N'Female', 1, N'student', 1, 1),
(N'user003', N'demo_hash_123456', N'Lê Văn C', N'Cường', N'Male', 2, N'student', 1, 1),
(N'user004', N'demo_hash_123456', N'Phạm Thị D', N'Dung', N'Female', 3, N'student', 1, 1);

INSERT INTO sessions (
    session_name,
    session_date,
    start_time,
    end_time,
    attendance_status,
    random_status,
    session_status
)
VALUES
(N'Buổi 1', '2026-06-01', '07:30', '10:30', N'Closed', N'Closed', N'Completed'),
(N'Buổi 2', '2026-06-03', '07:30', '10:30', N'Closed', N'Closed', N'Completed'),
(N'Buổi 3', '2026-06-08', '07:30', '10:30', N'Open', N'Open', N'Active');

INSERT INTO schedules (
    session_id,
    title,
    bible_verse,
    activity,
    speaker,
    note
)
VALUES
(1, N'Khởi động Thánh Kinh Hè', N'Thi Thiên 119:105', N'Giới thiệu nhóm, sinh hoạt chung', N'Ban Tổ Chức', NULL),
(2, N'Đức tin và sự vâng lời', N'Hê-bơ-rơ 11:1', N'Học Kinh Thánh, trả bài cũ', N'Mục sư / Giáo viên', NULL),
(3, N'Yêu thương và phục vụ', N'Giăng 13:34', N'Thảo luận nhóm, Bible Challenge', N'Ban Thanh Niên', NULL);

INSERT INTO attendance_records (
    user_id,
    session_id,
    latitude,
    longitude,
    distance_meters,
    gps_accuracy_meters,
    status,
    note
)
VALUES
(2, 1, 10.765926509333024, 106.6643590819157, 25.50, 12.00, N'Present', N'Điểm danh hợp lệ'),
(3, 1, 10.765926509333024, 106.6643590819157, 36.20, 18.00, N'Present', N'Điểm danh hợp lệ'),
(4, 1, 10.765926509333024, 106.6643590819157, 220.10, 25.00, N'Rejected', N'Ngoài khu vực điểm danh'),
(2, 2, 10.765926509333024, 106.6643590819157, 18.70, 10.00, N'Present', N'Điểm danh hợp lệ'),
(2, 3, 10.765926509333024, 106.6643590819157, 30.00, 11.00, N'Present', N'Điểm danh hợp lệ'),
(3, 3, 10.765926509333024, 106.6643590819157, 42.00, 15.00, N'Present', N'Điểm danh hợp lệ');

INSERT INTO scores (
    user_id,
    session_id,
    score_value,
    score_type,
    reason,
    created_by
)
VALUES
(2, 1, 10, N'bible_challenge', N'Trả bài cũ tốt', 1),
(2, 1, 5, N'attendance', N'Điểm danh buổi 1', 1),
(3, 1, 5, N'attendance', N'Điểm danh buổi 1', 1),
(4, 1, 15, N'game', N'Trò chơi nhóm', 1),
(2, 2, 5, N'attendance', N'Điểm danh buổi 2', 1),
(2, 3, 10, N'bible_challenge', N'Trả bài cũ buổi 3', 1),
(3, 3, 5, N'attendance', N'Điểm danh buổi 3', 1);

INSERT INTO settings (
    setting_key,
    setting_value,
    description
)
VALUES
(N'church_latitude', N'10.765926509333024', N'Tọa độ vĩ độ nhà thờ'),
(N'church_longitude', N'106.6643590819157', N'Tọa độ kinh độ nhà thờ'),
(N'checkin_radius_meters', N'200', N'Bán kính điểm danh hợp lệ'),
(N'max_gps_accuracy_meters', N'100', N'Độ chính xác GPS tối đa cho phép');