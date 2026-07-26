/* =========================================================
   TKH_SYSTEM/database/11_attendance_windows_migration.sql

   Migration 11: Attendance check-in windows

   - Adds attendance window type to each attendance record.
   - Allows one attendance record per window.
   - Stores the manual attendance window opened by Admin.
   - DEVOTION records participation only and does not award points.
   ========================================================= */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO


/* =========================================================
   1. Add window_type to attendance_records
   ========================================================= */

IF COL_LENGTH(
    N'dbo.attendance_records',
    N'window_type'
) IS NULL
BEGIN
    ALTER TABLE dbo.attendance_records
    ADD window_type VARCHAR(20) NULL;
END;
GO


/* Existing test records were created before window tracking.
   Preserve them as MORNING attendance records. */

UPDATE dbo.attendance_records
SET window_type = 'MORNING'
WHERE window_type IS NULL;
GO


IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id =
          OBJECT_ID(N'dbo.attendance_records')
      AND name = N'window_type'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.attendance_records
    ALTER COLUMN window_type VARCHAR(20) NOT NULL;
END;
GO


/* =========================================================
   2. Add allowed attendance-window constraint
   ========================================================= */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_attendance_window_type'
      AND parent_object_id =
          OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    ALTER TABLE dbo.attendance_records
    WITH CHECK ADD CONSTRAINT CK_attendance_window_type
    CHECK
    (
        window_type IN
        (
            'MORNING',
            'BREAK',
            'END',
            'DEVOTION'
        )
    );
END;
GO


/* =========================================================
   3. Replace the old one-record-per-session constraint
   ========================================================= */

IF EXISTS
(
    SELECT 1
    FROM sys.key_constraints
    WHERE name =
          N'UQ_attendance_session_membership'
      AND parent_object_id =
          OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    ALTER TABLE dbo.attendance_records
    DROP CONSTRAINT UQ_attendance_session_membership;
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.key_constraints
    WHERE name =
          N'UQ_attendance_session_membership_window'
      AND parent_object_id =
          OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    ALTER TABLE dbo.attendance_records
    ADD CONSTRAINT
        UQ_attendance_session_membership_window
    UNIQUE
    (
        session_id,
        season_membership_id,
        window_type
    );
END;
GO


/* =========================================================
   4. Store the manual attendance window opened by Admin

   NULL     = all manual windows are closed
   MORNING  = beginning-of-session window
   BREAK    = late-arrival/break window
   END      = end-of-session window

   DEVOTION is automatic and is therefore not stored here.
   ========================================================= */

IF COL_LENGTH(
    N'dbo.sessions',
    N'active_attendance_window'
) IS NULL
BEGIN
    ALTER TABLE dbo.sessions
    ADD active_attendance_window VARCHAR(20) NULL;
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE name =
          N'CK_sessions_active_attendance_window'
      AND parent_object_id =
          OBJECT_ID(N'dbo.sessions')
)
BEGIN
    ALTER TABLE dbo.sessions
    WITH CHECK ADD CONSTRAINT
        CK_sessions_active_attendance_window
    CHECK
    (
        active_attendance_window IS NULL
        OR active_attendance_window IN
        (
            'MORNING',
            'BREAK',
            'END'
        )
    );
END;
GO


PRINT 'Migration 11 completed successfully.';
GO