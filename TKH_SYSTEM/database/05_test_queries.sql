/*
TKH 2026 — DATABASE VERIFICATION QUERIES
File: 05_test_queries.sql
Database: TKH_2026
Purpose:
- Verify core tables, feature tables, test module tables and seed data.
- Read-only: this file does not insert, update or delete data.
*/

USE [TKH_2026];
GO

SET NOCOUNT ON;
GO

/* 1. Verify all expected tables */
SELECT
    COUNT(*) AS total_tables
FROM sys.tables
WHERE name IN
(
    'seasons',
    'groups',
    'members',
    'users',
    'season_memberships',
    'season_settings',
    'sessions',
    'schedules',
    'attendance_records',
    'individual_score_transactions',
    'group_score_transactions',
    'student_questions',
    'encouragements',
    'documents',
    'bible_challenge_history',
    'exams',
    'exam_questions',
    'exam_waiting_room',
    'exam_live_states',
    'exam_attempts',
    'exam_attempt_answers',
    'exam_events'
);
GO

/* Expected: 22 */

/* 2. Verify active season */
SELECT
    id,
    code,
    name,
    start_date,
    end_date,
    status
FROM dbo.seasons
WHERE code = 'TKH2026';
GO

/* Expected: one row, status = ACTIVE */

/* 3. Verify official TKH 2026 groups */
SELECT
    g.code,
    g.name,
    g.display_order,
    g.is_active
FROM dbo.groups AS g
INNER JOIN dbo.seasons AS s
    ON s.id = g.season_id
WHERE s.code = 'TKH2026'
ORDER BY g.display_order;
GO

/* Expected: 8 rows */

/* 4. Verify season settings */
SELECT
    s.code AS season_code,
    ss.ranking_visible,
    ss.attendance_radius_m
FROM dbo.season_settings AS ss
INNER JOIN dbo.seasons AS s
    ON s.id = ss.season_id
WHERE s.code = 'TKH2026';
GO

/* Expected:
ranking_visible = 1
attendance_radius_m = 200
*/

/* 5. Verify admin seed account */
SELECT
    id,
    username,
    role,
    must_change_password,
    is_active
FROM dbo.users
WHERE username = 'admin';
GO

/* Expected:
role = ADMIN
must_change_password = 1
is_active = 1
*/

/* 6. Verify Module Test schema columns */
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN
(
    'exams',
    'exam_questions',
    'exam_attempts',
    'exam_live_states'
)
AND COLUMN_NAME IN
(
    'result_visibility',
    'points',
    'attempt_no',
    'is_late_join',
    'joined_question_index',
    'question_ends_at'
)
ORDER BY TABLE_NAME, COLUMN_NAME;
GO

/* 7. Verify important constraints */
SELECT
    OBJECT_NAME(parent_object_id) AS table_name,
    name AS constraint_name,
    type_desc
FROM sys.objects
WHERE name IN
(
    'CK_exams_result_visibility',
    'CK_exam_questions_points',
    'CK_exam_attempts_status',
    'UQ_exam_attempts_exam_membership_no'
)
ORDER BY table_name, constraint_name;
GO

/* 8. Verify database connection context */
SELECT
    DB_NAME() AS database_name,
    @@SERVERNAME AS server_name,
    SYSDATETIME() AS server_time;
GO
