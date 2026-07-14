USE TKH_SYSTEM;
GO

--------------------------------------------------
-- 1. DANH SÁCH NHÓM
--------------------------------------------------

SELECT *
FROM groups
ORDER BY group_name;

--------------------------------------------------
-- 2. DANH SÁCH THÀNH VIÊN + NHÓM
--------------------------------------------------

SELECT
    u.id,
    u.username,
    u.full_name,
    u.nickname,
    u.gender,
    g.group_name,
    u.role,
    u.is_active
FROM users u
LEFT JOIN groups g
    ON u.group_id = g.id
ORDER BY u.full_name;

--------------------------------------------------
-- 3. DANH SÁCH BUỔI HỌC
--------------------------------------------------

SELECT *
FROM sessions
ORDER BY session_date;

--------------------------------------------------
-- 4. DANH SÁCH NỘI DUNG HỌC
--------------------------------------------------

SELECT
    s.session_name,
    s.session_date,
    sc.title,
    sc.bible_verse,
    sc.activity,
    sc.speaker
FROM schedules sc
JOIN sessions s
    ON sc.session_id = s.id
ORDER BY s.session_date;

--------------------------------------------------
-- 5. CẤU HÌNH HỆ THỐNG
--------------------------------------------------

SELECT *
FROM settings;

--------------------------------------------------
-- 6. LỊCH SỬ ĐIỂM DANH
--------------------------------------------------

SELECT
    u.full_name,
    g.group_name,
    s.session_name,
    ar.checkin_time,
    ar.distance_meters,
    ar.gps_accuracy_meters,
    ar.status
FROM attendance_records ar
JOIN users u
    ON ar.user_id = u.id
LEFT JOIN groups g
    ON u.group_id = g.id
JOIN sessions s
    ON ar.session_id = s.id
ORDER BY ar.checkin_time DESC;

--------------------------------------------------
-- 7. ĐIỂM CÁ NHÂN
--------------------------------------------------

SELECT
    u.id,
    u.full_name,
    g.group_name,
    ISNULL(SUM(sc.score_value),0) AS total_score
FROM users u
LEFT JOIN groups g
    ON u.group_id = g.id
LEFT JOIN scores sc
    ON u.id = sc.user_id
WHERE u.role = 'student'
GROUP BY
    u.id,
    u.full_name,
    g.group_name
ORDER BY total_score DESC;

--------------------------------------------------
-- 8. LỊCH SỬ ĐIỂM CỦA 1 HỌC VIÊN
--------------------------------------------------

SELECT
    u.full_name,
    s.session_name,
    sc.score_type,
    sc.score_value,
    sc.reason,
    sc.created_at
FROM scores sc
JOIN users u
    ON sc.user_id = u.id
LEFT JOIN sessions s
    ON sc.session_id = s.id
WHERE u.username = 'user001'
ORDER BY sc.created_at DESC;

--------------------------------------------------
-- 9. ĐIỂM NHÓM
--------------------------------------------------

SELECT
    g.group_name,
    ISNULL(SUM(sc.score_value),0) AS group_score
FROM groups g
LEFT JOIN users u
    ON g.id = u.group_id
LEFT JOIN scores sc
    ON u.id = sc.user_id
GROUP BY g.group_name
ORDER BY group_score DESC;

--------------------------------------------------
-- 10. BẢNG XẾP HẠNG NHÓM
--------------------------------------------------

SELECT
    RANK() OVER (
        ORDER BY ISNULL(SUM(sc.score_value),0) DESC
    ) AS ranking,

    g.group_name,

    ISNULL(SUM(sc.score_value),0) AS total_score

FROM groups g
LEFT JOIN users u
    ON g.id = u.group_id
LEFT JOIN scores sc
    ON u.id = sc.user_id

GROUP BY g.group_name

ORDER BY total_score DESC;

--------------------------------------------------
-- 11. DANH SÁCH ĐƯỢC RANDOM
--------------------------------------------------

SELECT
    u.id,
    u.full_name,
    g.group_name,
    s.session_name
FROM attendance_records ar
JOIN users u
    ON ar.user_id = u.id
LEFT JOIN groups g
    ON u.group_id = g.id
JOIN sessions s
    ON ar.session_id = s.id

WHERE ar.status = 'Present'
AND s.session_status = 'Active';

--------------------------------------------------
-- 12. AI CHƯA ĐIỂM DANH BUỔI ĐANG HOẠT ĐỘNG
--------------------------------------------------

SELECT
    u.id,
    u.full_name,
    g.group_name

FROM users u
LEFT JOIN groups g
    ON u.group_id = g.id

WHERE u.role = 'student'
AND u.is_active = 1

AND u.id NOT IN (

    SELECT ar.user_id

    FROM attendance_records ar

    JOIN sessions s
        ON ar.session_id = s.id

    WHERE
        s.session_status = 'Active'
        AND ar.status = 'Present'

);

--------------------------------------------------
-- 13. THỐNG KÊ ĐIỂM DANH THEO NHÓM
--------------------------------------------------

SELECT
    g.group_name,

    COUNT(
        CASE
            WHEN ar.status = 'Present'
            THEN 1
        END
    ) AS total_present

FROM groups g

LEFT JOIN users u
    ON g.id = u.group_id

LEFT JOIN attendance_records ar
    ON u.id = ar.user_id

GROUP BY g.group_name

ORDER BY total_present DESC;

--------------------------------------------------
-- 14. SESSION ĐANG HOẠT ĐỘNG
--------------------------------------------------

SELECT *
FROM sessions
WHERE session_status = 'Active';

--------------------------------------------------
-- 15. RANDOM ELIGIBLE LIST
--------------------------------------------------

SELECT
    u.id,
    u.full_name,
    u.nickname,
    g.group_name

FROM attendance_records ar

JOIN users u
    ON ar.user_id = u.id

LEFT JOIN groups g
    ON u.group_id = g.id

JOIN sessions s
    ON ar.session_id = s.id

WHERE
    s.session_status = 'Active'
    AND ar.status = 'Present'

ORDER BY u.full_name;