/*
=====================================================
TKH 2026
Migration 07
Bible Challenge Rounds

Purpose:
- Store group randomization rounds by session.
- Ensure each eligible group appears only once
  within the same round.
- Support Bible Challenge fairness logic.
=====================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO


PRINT '=============================================';
PRINT 'Migration 07: Bible Challenge Rounds';
PRINT '=============================================';
GO


/*
=====================================================
1. Create bible_challenge_rounds table
=====================================================
*/

IF OBJECT_ID('dbo.bible_challenge_rounds', 'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.bible_challenge_rounds...';

    CREATE TABLE dbo.bible_challenge_rounds
    (
        id INT IDENTITY(1,1) NOT NULL,

        season_id INT NOT NULL,

        session_id INT NOT NULL,

        round_no INT NOT NULL,

        group_id INT NOT NULL,

        created_by_user_id INT NULL,

        created_at DATETIME2(7) NOT NULL
            CONSTRAINT DF_bcr_created_at
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_bible_challenge_rounds
            PRIMARY KEY (id),

        CONSTRAINT CK_bcr_round_no
            CHECK (round_no > 0),

        CONSTRAINT FK_bcr_season
            FOREIGN KEY (season_id)
            REFERENCES dbo.seasons(id),

        CONSTRAINT FK_bcr_session
            FOREIGN KEY (session_id)
            REFERENCES dbo.sessions(id),

        CONSTRAINT FK_bcr_group
            FOREIGN KEY (group_id)
            REFERENCES dbo.groups(id),

        CONSTRAINT FK_bcr_created_by_user
            FOREIGN KEY (created_by_user_id)
            REFERENCES dbo.users(id),

        CONSTRAINT UQ_bcr_session_round_group
            UNIQUE
            (
                session_id,
                round_no,
                group_id
            )
    );

    PRINT 'Table dbo.bible_challenge_rounds created successfully.';
END
ELSE
BEGIN
    PRINT 'Table dbo.bible_challenge_rounds already exists. Skipping table creation.';
END;
GO


/*
=====================================================
2. Create index for session and round queries
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_bcr_session_round'
      AND object_id = OBJECT_ID('dbo.bible_challenge_rounds')
)
BEGIN
    PRINT 'Creating index IX_bcr_session_round...';

    CREATE INDEX IX_bcr_session_round
        ON dbo.bible_challenge_rounds
        (
            session_id,
            round_no
        )
        INCLUDE
        (
            season_id,
            group_id,
            created_by_user_id,
            created_at
        );

    PRINT 'Index IX_bcr_session_round created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_bcr_session_round already exists. Skipping.';
END;
GO


/*
=====================================================
3. Create index for group history queries
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_bcr_group'
      AND object_id = OBJECT_ID('dbo.bible_challenge_rounds')
)
BEGIN
    PRINT 'Creating index IX_bcr_group...';

    CREATE INDEX IX_bcr_group
        ON dbo.bible_challenge_rounds
        (
            group_id
        )
        INCLUDE
        (
            season_id,
            session_id,
            round_no,
            created_at
        );

    PRINT 'Index IX_bcr_group created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_bcr_group already exists. Skipping.';
END;
GO


/*
=====================================================
4. Create index for chronological history queries
=====================================================
*/

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_bcr_created_at'
      AND object_id = OBJECT_ID('dbo.bible_challenge_rounds')
)
BEGIN
    PRINT 'Creating index IX_bcr_created_at...';

    CREATE INDEX IX_bcr_created_at
        ON dbo.bible_challenge_rounds
        (
            created_at DESC
        );

    PRINT 'Index IX_bcr_created_at created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_bcr_created_at already exists. Skipping.';
END;
GO


/*
=====================================================
5. Verification
=====================================================
*/

PRINT 'Verifying migration result...';
GO


SELECT
    t.name AS table_name,
    s.name AS schema_name,
    t.create_date,
    t.modify_date
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = 'dbo'
  AND t.name = 'bible_challenge_rounds';
GO


SELECT
    c.column_id,
    c.name AS column_name,
    TYPE_NAME(c.user_type_id) AS data_type,
    c.max_length,
    c.is_nullable,
    c.is_identity
FROM sys.columns AS c
WHERE c.object_id =
    OBJECT_ID('dbo.bible_challenge_rounds')
ORDER BY c.column_id;
GO


SELECT
    i.name AS index_name,
    i.type_desc,
    i.is_unique,
    i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id =
    OBJECT_ID('dbo.bible_challenge_rounds')
  AND i.name IS NOT NULL
ORDER BY i.name;
GO


SELECT
    fk.name AS foreign_key_name,
    OBJECT_NAME(fk.parent_object_id) AS parent_table,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table
FROM sys.foreign_keys AS fk
WHERE fk.parent_object_id =
    OBJECT_ID('dbo.bible_challenge_rounds')
ORDER BY fk.name;
GO


SELECT
    COUNT(*) AS current_round_record_count
FROM dbo.bible_challenge_rounds;
GO


PRINT '=============================================';
PRINT 'Migration 07 completed successfully.';
PRINT '=============================================';
GO