/*
===============================================================================
TKH 2026 - SCORE MODULE V2 DATABASE MIGRATION
File: 06_score_module_migration.sql
Database: TKH_2026

IMPORTANT:
- Keeps the two V1 tables unchanged.
- Does not migrate the two V1 test rows.
- Creates the V2 Score tables only.
- Designed to be safe to run again: existing objects are skipped.
===============================================================================
*/

USE TKH_2026;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* =======================================================================
       1. SCORE TRANSACTIONS
       The official personal score ledger.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.score_transactions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.score_transactions
        (
            id                      INT IDENTITY(1,1) NOT NULL,
            season_membership_id    INT NOT NULL,

            score_category          VARCHAR(20) NOT NULL,
            score_type              VARCHAR(50) NOT NULL,

            requested_points        DECIMAL(10,2) NOT NULL,
            applied_points          DECIMAL(10,2) NOT NULL,

            source_type             VARCHAR(50) NOT NULL,
            source_id               INT NULL,
            source_key              NVARCHAR(150) NULL,

            description             NVARCHAR(500) NULL,

            status                  VARCHAR(20) NOT NULL
                CONSTRAINT DF_score_transactions_status DEFAULT ('ACTIVE'),

            created_by_user_id      INT NULL,
            created_at              DATETIME2(0) NOT NULL
                CONSTRAINT DF_score_transactions_created_at DEFAULT (SYSDATETIME()),

            reversed_by_user_id     INT NULL,
            reversed_at             DATETIME2(0) NULL,
            reversal_reason         NVARCHAR(500) NULL,

            CONSTRAINT PK_score_transactions
                PRIMARY KEY (id),

            CONSTRAINT FK_score_transactions_membership
                FOREIGN KEY (season_membership_id)
                REFERENCES dbo.season_memberships(id),

            CONSTRAINT FK_score_transactions_created_by
                FOREIGN KEY (created_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT FK_score_transactions_reversed_by
                FOREIGN KEY (reversed_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT CK_score_transactions_category
                CHECK (score_category IN
                (
                    'ATTENDANCE',
                    'LEARNING',
                    'DISCIPLINE'
                )),

            CONSTRAINT CK_score_transactions_type
                CHECK (score_type IN
                (
                    'ATTENDANCE',
                    'ATTENDANCE_ADJUSTMENT',
                    'PRE_TEST',
                    'BIBLE_CHALLENGE',
                    'PARTICIPATION',
                    'FINAL_TEST',
                    'DISCIPLINE_CLEANING',
                    'DISCIPLINE_COMPLIANCE',
                    'DISCIPLINE_SPIRIT'
                )),

            CONSTRAINT CK_score_transactions_status
                CHECK (status IN
                (
                    'ACTIVE',
                    'REVERSED',
                    'CANCELLED'
                )),

            CONSTRAINT CK_score_transactions_reversal
                CHECK
                (
                    (status = 'ACTIVE'
                        AND reversed_at IS NULL
                        AND reversed_by_user_id IS NULL)
                    OR
                    (status IN ('REVERSED', 'CANCELLED'))
                )
        );
    END;

    /* Prevent the same automatic source from being credited twice. */
    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_score_transactions_source_key'
          AND object_id = OBJECT_ID(N'dbo.score_transactions')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_score_transactions_source_key
            ON dbo.score_transactions(source_key)
            WHERE source_key IS NOT NULL;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_score_transactions_membership_active'
          AND object_id = OBJECT_ID(N'dbo.score_transactions')
    )
    BEGIN
        CREATE INDEX IX_score_transactions_membership_active
            ON dbo.score_transactions
            (
                season_membership_id,
                status,
                score_category,
                score_type
            )
            INCLUDE (applied_points, created_at);
    END;


    /* =======================================================================
       2. GROUP SCORE EVENTS
       Stores Bible Challenge and other controlled group events.
       This table does NOT directly define the group's final score.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.group_score_events', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_score_events
        (
            id                      INT IDENTITY(1,1) NOT NULL,
            event_type              VARCHAR(50) NOT NULL,

            selected_group_id       INT NULL,
            result                  VARCHAR(20) NULL,
            points_per_member       DECIMAL(10,2) NOT NULL,

            source_id               INT NULL,
            source_key              NVARCHAR(150) NULL,
            description             NVARCHAR(500) NULL,

            status                  VARCHAR(20) NOT NULL
                CONSTRAINT DF_group_score_events_status DEFAULT ('ACTIVE'),

            created_by_user_id      INT NULL,
            created_at              DATETIME2(0) NOT NULL
                CONSTRAINT DF_group_score_events_created_at DEFAULT (SYSDATETIME()),

            cancelled_by_user_id    INT NULL,
            cancelled_at            DATETIME2(0) NULL,
            cancellation_reason     NVARCHAR(500) NULL,

            CONSTRAINT PK_group_score_events
                PRIMARY KEY (id),

            CONSTRAINT FK_group_score_events_selected_group
                FOREIGN KEY (selected_group_id)
                REFERENCES dbo.groups(id),

            CONSTRAINT FK_group_score_events_created_by
                FOREIGN KEY (created_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT FK_group_score_events_cancelled_by
                FOREIGN KEY (cancelled_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT CK_group_score_events_type
                CHECK (event_type IN ('BIBLE_CHALLENGE')),

            CONSTRAINT CK_group_score_events_result
                CHECK (result IS NULL OR result IN ('PASS', 'FAIL')),

            CONSTRAINT CK_group_score_events_points
                CHECK (points_per_member >= 0),

            CONSTRAINT CK_group_score_events_status
                CHECK (status IN ('ACTIVE', 'CANCELLED'))
        );
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_group_score_events_source_key'
          AND object_id = OBJECT_ID(N'dbo.group_score_events')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_group_score_events_source_key
            ON dbo.group_score_events(source_key)
            WHERE source_key IS NOT NULL;
    END;


    /* =======================================================================
       3. GROUP SCORE EVENT MEMBERS
       Snapshots exactly which members received a group event.
       New members added later cannot receive old events.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.group_score_event_members', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_score_event_members
        (
            id                      INT IDENTITY(1,1) NOT NULL,
            group_score_event_id    INT NOT NULL,
            season_membership_id    INT NOT NULL,
            score_transaction_id    INT NOT NULL,

            requested_points        DECIMAL(10,2) NOT NULL,
            applied_points          DECIMAL(10,2) NOT NULL,

            created_at              DATETIME2(0) NOT NULL
                CONSTRAINT DF_group_score_event_members_created_at
                DEFAULT (SYSDATETIME()),

            CONSTRAINT PK_group_score_event_members
                PRIMARY KEY (id),

            CONSTRAINT FK_group_score_event_members_event
                FOREIGN KEY (group_score_event_id)
                REFERENCES dbo.group_score_events(id),

            CONSTRAINT FK_group_score_event_members_membership
                FOREIGN KEY (season_membership_id)
                REFERENCES dbo.season_memberships(id),

            CONSTRAINT FK_group_score_event_members_transaction
                FOREIGN KEY (score_transaction_id)
                REFERENCES dbo.score_transactions(id),

            CONSTRAINT UQ_group_score_event_members_event_membership
                UNIQUE (group_score_event_id, season_membership_id),

            CONSTRAINT UQ_group_score_event_members_transaction
                UNIQUE (score_transaction_id),

            CONSTRAINT CK_group_score_event_members_points
                CHECK
                (
                    requested_points >= 0
                    AND applied_points >= 0
                    AND applied_points <= requested_points
                )
        );
    END;


    /* =======================================================================
       4. GROUP DISCIPLINE SCORES
       Stores the current official end-of-season discipline score per group.
       Editing replaces the current official values; it is not cumulative.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.group_discipline_scores', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_discipline_scores
        (
            id                      INT IDENTITY(1,1) NOT NULL,
            group_id                INT NOT NULL,

            cleaning_points         DECIMAL(5,2) NOT NULL,
            compliance_points       DECIMAL(5,2) NOT NULL,
            spirit_points           DECIMAL(5,2) NOT NULL,

            status                  VARCHAR(20) NOT NULL
                CONSTRAINT DF_group_discipline_scores_status DEFAULT ('ACTIVE'),

            scored_by_user_id       INT NULL,
            scored_at               DATETIME2(0) NOT NULL
                CONSTRAINT DF_group_discipline_scores_scored_at
                DEFAULT (SYSDATETIME()),

            updated_by_user_id      INT NULL,
            updated_at              DATETIME2(0) NULL,

            CONSTRAINT PK_group_discipline_scores
                PRIMARY KEY (id),

            CONSTRAINT UQ_group_discipline_scores_group
                UNIQUE (group_id),

            CONSTRAINT FK_group_discipline_scores_group
                FOREIGN KEY (group_id)
                REFERENCES dbo.groups(id),

            CONSTRAINT FK_group_discipline_scores_scored_by
                FOREIGN KEY (scored_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT FK_group_discipline_scores_updated_by
                FOREIGN KEY (updated_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT CK_group_discipline_scores_cleaning
                CHECK (cleaning_points BETWEEN 0 AND 30),

            CONSTRAINT CK_group_discipline_scores_compliance
                CHECK (compliance_points BETWEEN 0 AND 30),

            CONSTRAINT CK_group_discipline_scores_spirit
                CHECK (spirit_points BETWEEN 0 AND 30),

            CONSTRAINT CK_group_discipline_scores_total
                CHECK
                (
                    cleaning_points
                    + compliance_points
                    + spirit_points <= 90
                ),

            CONSTRAINT CK_group_discipline_scores_status
                CHECK (status IN ('ACTIVE', 'CANCELLED'))
        );
    END;


    /* =======================================================================
       5. GROUP DISCIPLINE SCORE MEMBERS
       Snapshots the members included when discipline was first scored.
       Later edits affect only this original member snapshot.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.group_discipline_score_members', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_discipline_score_members
        (
            id                          INT IDENTITY(1,1) NOT NULL,
            group_discipline_score_id   INT NOT NULL,
            season_membership_id        INT NOT NULL,

            cleaning_transaction_id     INT NOT NULL,
            compliance_transaction_id   INT NOT NULL,
            spirit_transaction_id       INT NOT NULL,

            created_at                  DATETIME2(0) NOT NULL
                CONSTRAINT DF_group_discipline_members_created_at
                DEFAULT (SYSDATETIME()),

            CONSTRAINT PK_group_discipline_score_members
                PRIMARY KEY (id),

            CONSTRAINT FK_group_discipline_members_score
                FOREIGN KEY (group_discipline_score_id)
                REFERENCES dbo.group_discipline_scores(id),

            CONSTRAINT FK_group_discipline_members_membership
                FOREIGN KEY (season_membership_id)
                REFERENCES dbo.season_memberships(id),

            CONSTRAINT FK_group_discipline_members_cleaning_transaction
                FOREIGN KEY (cleaning_transaction_id)
                REFERENCES dbo.score_transactions(id),

            CONSTRAINT FK_group_discipline_members_compliance_transaction
                FOREIGN KEY (compliance_transaction_id)
                REFERENCES dbo.score_transactions(id),

            CONSTRAINT FK_group_discipline_members_spirit_transaction
                FOREIGN KEY (spirit_transaction_id)
                REFERENCES dbo.score_transactions(id),

            CONSTRAINT UQ_group_discipline_members_score_membership
                UNIQUE (group_discipline_score_id, season_membership_id),

            CONSTRAINT UQ_group_discipline_members_cleaning_transaction
                UNIQUE (cleaning_transaction_id),

            CONSTRAINT UQ_group_discipline_members_compliance_transaction
                UNIQUE (compliance_transaction_id),

            CONSTRAINT UQ_group_discipline_members_spirit_transaction
                UNIQUE (spirit_transaction_id)
        );
    END;


    /* =======================================================================
       6. GROUP DISCIPLINE SCORE HISTORY
       Audit trail for every initial save and later edit.
       ======================================================================= */
    IF OBJECT_ID(N'dbo.group_discipline_score_history', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_discipline_score_history
        (
            id                          INT IDENTITY(1,1) NOT NULL,
            group_discipline_score_id   INT NOT NULL,

            old_cleaning_points         DECIMAL(5,2) NULL,
            new_cleaning_points         DECIMAL(5,2) NOT NULL,

            old_compliance_points       DECIMAL(5,2) NULL,
            new_compliance_points       DECIMAL(5,2) NOT NULL,

            old_spirit_points           DECIMAL(5,2) NULL,
            new_spirit_points           DECIMAL(5,2) NOT NULL,

            change_type                 VARCHAR(20) NOT NULL,
            reason                      NVARCHAR(500) NULL,

            changed_by_user_id          INT NULL,
            changed_at                  DATETIME2(0) NOT NULL
                CONSTRAINT DF_group_discipline_history_changed_at
                DEFAULT (SYSDATETIME()),

            CONSTRAINT PK_group_discipline_score_history
                PRIMARY KEY (id),

            CONSTRAINT FK_group_discipline_history_score
                FOREIGN KEY (group_discipline_score_id)
                REFERENCES dbo.group_discipline_scores(id),

            CONSTRAINT FK_group_discipline_history_changed_by
                FOREIGN KEY (changed_by_user_id)
                REFERENCES dbo.users(id),

            CONSTRAINT CK_group_discipline_history_type
                CHECK (change_type IN ('CREATE', 'UPDATE', 'CANCEL')),

            CONSTRAINT CK_group_discipline_history_new_cleaning
                CHECK (new_cleaning_points BETWEEN 0 AND 30),

            CONSTRAINT CK_group_discipline_history_new_compliance
                CHECK (new_compliance_points BETWEEN 0 AND 30),

            CONSTRAINT CK_group_discipline_history_new_spirit
                CHECK (new_spirit_points BETWEEN 0 AND 30)
        );
    END;


    COMMIT TRANSACTION;

    PRINT N'06_score_module_migration.sql completed successfully.';
    PRINT N'V1 Score tables were kept unchanged.';
    PRINT N'V1 test data was not migrated.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO


/* =============================================================================
   VERIFICATION
   ============================================================================= */

SELECT
    t.name AS table_name
FROM sys.tables AS t
WHERE t.name IN
(
    'score_transactions',
    'group_score_events',
    'group_score_event_members',
    'group_discipline_scores',
    'group_discipline_score_members',
    'group_discipline_score_history'
)
ORDER BY t.name;
GO

SELECT
    'score_transactions' AS table_name,
    COUNT(*) AS total_rows
FROM dbo.score_transactions

UNION ALL
SELECT
    'group_score_events',
    COUNT(*)
FROM dbo.group_score_events

UNION ALL
SELECT
    'group_score_event_members',
    COUNT(*)
FROM dbo.group_score_event_members

UNION ALL
SELECT
    'group_discipline_scores',
    COUNT(*)
FROM dbo.group_discipline_scores

UNION ALL
SELECT
    'group_discipline_score_members',
    COUNT(*)
FROM dbo.group_discipline_score_members

UNION ALL
SELECT
    'group_discipline_score_history',
    COUNT(*)
FROM dbo.group_discipline_score_history;
GO
