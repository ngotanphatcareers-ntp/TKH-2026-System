/* =========================================================
   Migration 10: Attendance device tracking
   Adds a browser-generated device identifier used only
   for duplicate-device warnings.
   ========================================================= */

IF COL_LENGTH(
    N'dbo.attendance_records',
    N'device_id'
) IS NULL
BEGIN
    ALTER TABLE dbo.attendance_records
    ADD device_id NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_attendance_session_device'
      AND object_id =
          OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    CREATE INDEX IX_attendance_session_device
        ON dbo.attendance_records
        (
            session_id,
            device_id
        )
        INCLUDE
        (
            season_membership_id,
            checked_in_at,
            status
        )
        WHERE device_id IS NOT NULL;
END;
GO
