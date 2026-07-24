/*
=====================================================
TKH 2026
Migration 08
Encouragement Module Enhancement

Purpose:
- Extend the existing encouragements table.
- Support read/unread status.
- Support pin/unpin status.
- Enforce one encouragement per sender-recipient pair
  per calendar day.
- Add indexes for student inbox and admin statistics.
=====================================================
*/

USE [TKH_2026];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO


PRINT '=============================================';
PRINT 'Migration 08: Encouragement Module';
PRINT '=============================================';
GO


/*
=====================================================
1. Verify encouragements table
=====================================================
*/

IF OBJECT_ID(N'dbo.encouragements', N'U') IS NULL
BEGIN
    THROW 50001,
        'Table dbo.encouragements does not exist. Run migration 02 first.',
        1;
END;
GO


/*
=====================================================
2. Add is_read column
=====================================================
*/

IF COL_LENGTH(
    N'dbo.encouragements',
    N'is_read'
) IS NULL
BEGIN
    PRINT 'Adding column is_read...';

    ALTER TABLE dbo.encouragements
    ADD is_read BIT NOT NULL
        CONSTRAINT DF_encouragements_is_read
        DEFAULT (0);

    PRINT 'Column is_read added successfully.';
END
ELSE
BEGIN
    PRINT 'Column is_read already exists. Skipping.';
END;
GO


/*
=====================================================
3. Add read_at column
=====================================================
*/

IF COL_LENGTH(
    N'dbo.encouragements',
    N'read_at'
) IS NULL
BEGIN
    PRINT 'Adding column read_at...';

    ALTER TABLE dbo.encouragements
    ADD read_at DATETIME2(0) NULL;

    PRINT 'Column read_at added successfully.';
END
ELSE
BEGIN
    PRINT 'Column read_at already exists. Skipping.';
END;
GO


/*
=====================================================
4. Add is_pinned column
=====================================================
*/

IF COL_LENGTH(
    N'dbo.encouragements',
    N'is_pinned'
) IS NULL
BEGIN
    PRINT 'Adding column is_pinned...';

    ALTER TABLE dbo.encouragements
    ADD is_pinned BIT NOT NULL
        CONSTRAINT DF_encouragements_is_pinned
        DEFAULT (0);

    PRINT 'Column is_pinned added successfully.';
END
ELSE
BEGIN
    PRINT 'Column is_pinned already exists. Skipping.';
END;
GO


/*
=====================================================
5. Add updated_at column
=====================================================
*/

IF COL_LENGTH(
    N'dbo.encouragements',
    N'updated_at'
) IS NULL
BEGIN
    PRINT 'Adding column updated_at...';

    ALTER TABLE dbo.encouragements
    ADD updated_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_encouragements_updated_at
        DEFAULT (SYSDATETIME());

    PRINT 'Column updated_at added successfully.';
END
ELSE
BEGIN
    PRINT 'Column updated_at already exists. Skipping.';
END;
GO


/*
=====================================================
6. Add persisted sent_date computed column

Used to enforce:
- One sender may send only one encouragement
  to the same recipient per calendar day.
=====================================================
*/

IF COL_LENGTH(
    N'dbo.encouragements',
    N'sent_date'
) IS NULL
BEGIN
    PRINT 'Adding computed column sent_date...';

    ALTER TABLE dbo.encouragements
    ADD sent_date AS
        CONVERT(DATE, created_at)
        PERSISTED;

    PRINT 'Column sent_date added successfully.';
END
ELSE
BEGIN
    PRINT 'Column sent_date already exists. Skipping.';
END;
GO


/*
=====================================================
7. Check duplicate daily messages before unique index
=====================================================
*/

IF EXISTS
(
    SELECT
        season_id,
        sender_season_membership_id,
        recipient_season_membership_id,
        CONVERT(DATE, created_at) AS sent_date
    FROM dbo.encouragements
    WHERE sender_season_membership_id IS NOT NULL
    GROUP BY
        season_id,
        sender_season_membership_id,
        recipient_season_membership_id,
        CONVERT(DATE, created_at)
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 50002,
        'Duplicate encouragements exist for the same sender, recipient and date. Resolve duplicates before creating the unique index.',
        1;
END;
GO


/*
=====================================================
8. Unique index for one encouragement per day
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name =
        N'UX_encouragements_sender_recipient_date'
      AND object_id =
        OBJECT_ID(N'dbo.encouragements')
)
BEGIN
    PRINT 'Creating unique daily encouragement index...';

    CREATE UNIQUE INDEX
        UX_encouragements_sender_recipient_date
    ON dbo.encouragements
    (
        season_id,
        sender_season_membership_id,
        recipient_season_membership_id,
        sent_date
    )
    WHERE sender_season_membership_id IS NOT NULL;

    PRINT 'Unique daily encouragement index created successfully.';
END
ELSE
BEGIN
    PRINT 'Unique daily encouragement index already exists. Skipping.';
END;
GO


/*
=====================================================
9. Index for recipient inbox
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name =
        N'IX_encouragements_recipient_inbox'
      AND object_id =
        OBJECT_ID(N'dbo.encouragements')
)
BEGIN
    PRINT 'Creating recipient inbox index...';

    CREATE INDEX
        IX_encouragements_recipient_inbox
    ON dbo.encouragements
    (
        recipient_season_membership_id,
        status,
        is_pinned,
        created_at DESC
    )
    INCLUDE
    (
        season_id,
        sender_season_membership_id,
        message,
        is_anonymous,
        is_read,
        read_at,
        updated_at
    );

    PRINT 'Recipient inbox index created successfully.';
END
ELSE
BEGIN
    PRINT 'Recipient inbox index already exists. Skipping.';
END;
GO


/*
=====================================================
10. Index for season/admin statistics
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name =
        N'IX_encouragements_season_created'
      AND object_id =
        OBJECT_ID(N'dbo.encouragements')
)
BEGIN
    PRINT 'Creating admin statistics index...';

    CREATE INDEX
        IX_encouragements_season_created
    ON dbo.encouragements
    (
        season_id,
        created_at DESC
    )
    INCLUDE
    (
        sender_season_membership_id,
        recipient_season_membership_id,
        is_anonymous,
        status,
        is_read
    );

    PRINT 'Admin statistics index created successfully.';
END
ELSE
BEGIN
    PRINT 'Admin statistics index already exists. Skipping.';
END;
GO


/*
=====================================================
11. Verification
=====================================================
*/

PRINT 'Verifying Migration 08 result...';
GO


SELECT
    c.column_id,
    c.name AS column_name,
    TYPE_NAME(c.user_type_id) AS data_type,
    c.max_length,
    c.is_nullable,
    c.is_identity,
    c.is_computed
FROM sys.columns AS c
WHERE c.object_id =
    OBJECT_ID(N'dbo.encouragements')
ORDER BY c.column_id;
GO


SELECT
    i.name AS index_name,
    i.type_desc,
    i.is_unique,
    i.has_filter,
    i.filter_definition
FROM sys.indexes AS i
WHERE i.object_id =
    OBJECT_ID(N'dbo.encouragements')
  AND i.name IS NOT NULL
ORDER BY i.name;
GO


PRINT '=============================================';
PRINT 'Migration 08 completed successfully.';
PRINT '=============================================';
GO