/*
TKH 2026 — FEATURE TABLES
File: 02_create_feature_tables.sql
Database: TKH_2026
Version: 1.0
Purpose:
- Create shared feature tables outside Module Test.
- Depends on 01_create_core_tables.sql.
- Safe to re-run: each table/index is guarded.

Included modules:
1. Sessions
2. Weekly schedules
3. Attendance
4. Individual/group score transactions
5. Student questions
6. Encouragement mailbox
7. Document library
8. Bible Challenge history
*/

USE [TKH_2026];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* =========================================================
   1. sessions
   Learning/check-in sessions within a season.
   ========================================================= */
IF OBJECT_ID(N'dbo.sessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sessions
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        season_id           INT NOT NULL,
        name                NVARCHAR(150) NOT NULL,
        session_no          INT NULL,
        scheduled_start_at  DATETIME2(0) NULL,
        scheduled_end_at    DATETIME2(0) NULL,
        checkin_open_at     DATETIME2(0) NULL,
        checkin_close_at    DATETIME2(0) NULL,
        status              VARCHAR(20) NOT NULL
                            CONSTRAINT DF_sessions_status DEFAULT ('DRAFT'),
        location_name       NVARCHAR(255) NULL,
        latitude            DECIMAL(10,7) NULL,
        longitude           DECIMAL(10,7) NULL,
        attendance_radius_m INT NULL,
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_sessions_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_sessions_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_sessions PRIMARY KEY (id),
        CONSTRAINT FK_sessions_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT UQ_sessions_season_session_no
            UNIQUE (season_id, session_no),
        CONSTRAINT CK_sessions_status
            CHECK (status IN ('DRAFT','OPEN','CLOSED','CANCELLED')),
        CONSTRAINT CK_sessions_time_range
            CHECK (
                scheduled_end_at IS NULL
                OR scheduled_start_at IS NULL
                OR scheduled_end_at >= scheduled_start_at
            ),
        CONSTRAINT CK_sessions_checkin_range
            CHECK (
                checkin_close_at IS NULL
                OR checkin_open_at IS NULL
                OR checkin_close_at >= checkin_open_at
            ),
        CONSTRAINT CK_sessions_attendance_radius
            CHECK (attendance_radius_m IS NULL OR attendance_radius_m > 0),
        CONSTRAINT CK_sessions_latitude
            CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
        CONSTRAINT CK_sessions_longitude
            CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_sessions_season_status_start'
      AND object_id = OBJECT_ID(N'dbo.sessions')
)
BEGIN
    CREATE INDEX IX_sessions_season_status_start
        ON dbo.sessions(season_id, status, scheduled_start_at);
END;
GO

/* =========================================================
   2. schedules
   Weekly timeline cards/images shown to students.
   ========================================================= */
IF OBJECT_ID(N'dbo.schedules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.schedules
    (
        id              INT IDENTITY(1,1) NOT NULL,
        season_id       INT NOT NULL,
        week_no         INT NOT NULL,
        title           NVARCHAR(150) NOT NULL,
        description     NVARCHAR(MAX) NULL,
        timeline_image  NVARCHAR(500) NULL,
        display_order   INT NOT NULL
                        CONSTRAINT DF_schedules_display_order DEFAULT (0),
        is_published    BIT NOT NULL
                        CONSTRAINT DF_schedules_is_published DEFAULT (0),
        created_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_schedules_created_at DEFAULT (SYSDATETIME()),
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_schedules_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_schedules PRIMARY KEY (id),
        CONSTRAINT FK_schedules_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT UQ_schedules_season_week UNIQUE (season_id, week_no),
        CONSTRAINT CK_schedules_week_no CHECK (week_no > 0),
        CONSTRAINT CK_schedules_display_order CHECK (display_order >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_schedules_season_publish_order'
      AND object_id = OBJECT_ID(N'dbo.schedules')
)
BEGIN
    CREATE INDEX IX_schedules_season_publish_order
        ON dbo.schedules(season_id, is_published, display_order);
END;
GO

/* =========================================================
   3. attendance_records
   One attendance result per student membership per session.
   ========================================================= */
IF OBJECT_ID(N'dbo.attendance_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.attendance_records
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        session_id              INT NOT NULL,
        season_membership_id    INT NOT NULL,
        checked_in_at           DATETIME2(0) NOT NULL
                                CONSTRAINT DF_attendance_checked_in_at DEFAULT (SYSDATETIME()),
        method                  VARCHAR(20) NOT NULL
                                CONSTRAINT DF_attendance_method DEFAULT ('GPS'),
        status                  VARCHAR(20) NOT NULL
                                CONSTRAINT DF_attendance_status DEFAULT ('PRESENT'),
        latitude                DECIMAL(10,7) NULL,
        longitude               DECIMAL(10,7) NULL,
        accuracy_m              DECIMAL(10,2) NULL,
        distance_m              DECIMAL(10,2) NULL,
        device_info             NVARCHAR(500) NULL,
        note                    NVARCHAR(500) NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_attendance_created_at DEFAULT (SYSDATETIME()),
        updated_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_attendance_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_attendance_records PRIMARY KEY (id),
        CONSTRAINT FK_attendance_records_sessions
            FOREIGN KEY (session_id) REFERENCES dbo.sessions(id),
        CONSTRAINT FK_attendance_records_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT UQ_attendance_session_membership
            UNIQUE (session_id, season_membership_id),
        CONSTRAINT CK_attendance_method
            CHECK (method IN ('GPS','ADMIN','IMPORT')),
        CONSTRAINT CK_attendance_status
            CHECK (status IN ('PRESENT','LATE','EXCUSED','VOIDED')),
        CONSTRAINT CK_attendance_accuracy
            CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
        CONSTRAINT CK_attendance_distance
            CHECK (distance_m IS NULL OR distance_m >= 0),
        CONSTRAINT CK_attendance_latitude
            CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
        CONSTRAINT CK_attendance_longitude
            CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_attendance_membership_checked_in'
      AND object_id = OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    CREATE INDEX IX_attendance_membership_checked_in
        ON dbo.attendance_records(season_membership_id, checked_in_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_attendance_session_status'
      AND object_id = OBJECT_ID(N'dbo.attendance_records')
)
BEGIN
    CREATE INDEX IX_attendance_session_status
        ON dbo.attendance_records(session_id, status);
END;
GO

/* =========================================================
   4. individual_score_transactions
   Append-only score history for a season membership.
   ========================================================= */
IF OBJECT_ID(N'dbo.individual_score_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.individual_score_transactions
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        season_membership_id    INT NOT NULL,
        points                  INT NOT NULL,
        source_type             VARCHAR(50) NOT NULL,
        source_id               INT NULL,
        description             NVARCHAR(500) NULL,
        status                  VARCHAR(20) NOT NULL
                                CONSTRAINT DF_individual_scores_status DEFAULT ('ACTIVE'),
        created_by_user_id      INT NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_individual_scores_created_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_individual_score_transactions PRIMARY KEY (id),
        CONSTRAINT FK_individual_scores_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT FK_individual_scores_users
            FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_individual_scores_status
            CHECK (status IN ('ACTIVE','VOIDED','REVERSED'))
    );
END;
GO

/* Prevent duplicate official source posting when source_id is present. */
IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_individual_scores_source'
      AND object_id = OBJECT_ID(N'dbo.individual_score_transactions')
)
BEGIN
    CREATE UNIQUE INDEX UX_individual_scores_source
        ON dbo.individual_score_transactions
        (
            season_membership_id,
            source_type,
            source_id
        )
        WHERE source_id IS NOT NULL;
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_individual_scores_membership_status'
      AND object_id = OBJECT_ID(N'dbo.individual_score_transactions')
)
BEGIN
    CREATE INDEX IX_individual_scores_membership_status
        ON dbo.individual_score_transactions
        (season_membership_id, status, created_at);
END;
GO

/* =========================================================
   5. group_score_transactions
   Append-only group score history.
   ========================================================= */
IF OBJECT_ID(N'dbo.group_score_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.group_score_transactions
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        group_id            INT NOT NULL,
        points              INT NOT NULL,
        source_type         VARCHAR(50) NOT NULL,
        source_id           INT NULL,
        description         NVARCHAR(500) NULL,
        status              VARCHAR(20) NOT NULL
                            CONSTRAINT DF_group_scores_status DEFAULT ('ACTIVE'),
        created_by_user_id  INT NULL,
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_group_scores_created_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_group_score_transactions PRIMARY KEY (id),
        CONSTRAINT FK_group_scores_groups
            FOREIGN KEY (group_id) REFERENCES dbo.groups(id),
        CONSTRAINT FK_group_scores_users
            FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_group_scores_status
            CHECK (status IN ('ACTIVE','VOIDED','REVERSED'))
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_group_scores_source'
      AND object_id = OBJECT_ID(N'dbo.group_score_transactions')
)
BEGIN
    CREATE UNIQUE INDEX UX_group_scores_source
        ON dbo.group_score_transactions(group_id, source_type, source_id)
        WHERE source_id IS NOT NULL;
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_group_scores_group_status'
      AND object_id = OBJECT_ID(N'dbo.group_score_transactions')
)
BEGIN
    CREATE INDEX IX_group_scores_group_status
        ON dbo.group_score_transactions(group_id, status, created_at);
END;
GO

/* =========================================================
   6. student_questions
   Public/private questions submitted by students.
   ========================================================= */
IF OBJECT_ID(N'dbo.student_questions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.student_questions
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        season_id               INT NOT NULL,
        season_membership_id    INT NOT NULL,
        session_id              INT NULL,
        visibility              VARCHAR(20) NOT NULL
                                CONSTRAINT DF_student_questions_visibility DEFAULT ('PUBLIC'),
        question_text           NVARCHAR(MAX) NOT NULL,
        status                  VARCHAR(20) NOT NULL
                                CONSTRAINT DF_student_questions_status DEFAULT ('PENDING'),
        admin_response          NVARCHAR(MAX) NULL,
        responded_by_user_id    INT NULL,
        responded_at            DATETIME2(0) NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_student_questions_created_at DEFAULT (SYSDATETIME()),
        updated_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_student_questions_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_student_questions PRIMARY KEY (id),
        CONSTRAINT FK_student_questions_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT FK_student_questions_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT FK_student_questions_sessions
            FOREIGN KEY (session_id) REFERENCES dbo.sessions(id),
        CONSTRAINT FK_student_questions_users
            FOREIGN KEY (responded_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_student_questions_visibility
            CHECK (visibility IN ('PUBLIC','PRIVATE')),
        CONSTRAINT CK_student_questions_status
            CHECK (status IN ('PENDING','ANSWERED','HIDDEN','CLOSED'))
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_student_questions_season_status'
      AND object_id = OBJECT_ID(N'dbo.student_questions')
)
BEGIN
    CREATE INDEX IX_student_questions_season_status
        ON dbo.student_questions(season_id, status, created_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_student_questions_membership'
      AND object_id = OBJECT_ID(N'dbo.student_questions')
)
BEGIN
    CREATE INDEX IX_student_questions_membership
        ON dbo.student_questions(season_membership_id, created_at);
END;
GO

/* =========================================================
   7. encouragements
   Student-to-student encouragement mailbox.
   ========================================================= */
IF OBJECT_ID(N'dbo.encouragements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.encouragements
    (
        id                              INT IDENTITY(1,1) NOT NULL,
        season_id                       INT NOT NULL,
        sender_season_membership_id     INT NULL,
        recipient_season_membership_id  INT NOT NULL,
        message                         NVARCHAR(1000) NOT NULL,
        is_anonymous                    BIT NOT NULL
                                        CONSTRAINT DF_encouragements_anonymous DEFAULT (0),
        status                          VARCHAR(20) NOT NULL
                                        CONSTRAINT DF_encouragements_status DEFAULT ('VISIBLE'),
        created_at                      DATETIME2(0) NOT NULL
                                        CONSTRAINT DF_encouragements_created_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_encouragements PRIMARY KEY (id),
        CONSTRAINT FK_encouragements_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT FK_encouragements_sender
            FOREIGN KEY (sender_season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT FK_encouragements_recipient
            FOREIGN KEY (recipient_season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT CK_encouragements_status
            CHECK (status IN ('VISIBLE','HIDDEN','REPORTED','DELETED')),
        CONSTRAINT CK_encouragements_not_self
            CHECK (
                sender_season_membership_id IS NULL
                OR sender_season_membership_id <> recipient_season_membership_id
            )
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_encouragements_recipient_status'
      AND object_id = OBJECT_ID(N'dbo.encouragements')
)
BEGIN
    CREATE INDEX IX_encouragements_recipient_status
        ON dbo.encouragements
        (recipient_season_membership_id, status, created_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_encouragements_sender_created'
      AND object_id = OBJECT_ID(N'dbo.encouragements')
)
BEGIN
    CREATE INDEX IX_encouragements_sender_created
        ON dbo.encouragements(sender_season_membership_id, created_at);
END;
GO

/* =========================================================
   8. documents
   Shared document library.
   ========================================================= */
IF OBJECT_ID(N'dbo.documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.documents
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        season_id           INT NOT NULL,
        title               NVARCHAR(200) NOT NULL,
        description         NVARCHAR(1000) NULL,
        file_url            NVARCHAR(1000) NOT NULL,
        file_type           VARCHAR(30) NULL,
        display_order       INT NOT NULL
                            CONSTRAINT DF_documents_display_order DEFAULT (0),
        is_published        BIT NOT NULL
                            CONSTRAINT DF_documents_is_published DEFAULT (0),
        created_by_user_id  INT NULL,
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_documents_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_documents_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_documents PRIMARY KEY (id),
        CONSTRAINT FK_documents_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT FK_documents_users
            FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_documents_display_order CHECK (display_order >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_documents_season_publish_order'
      AND object_id = OBJECT_ID(N'dbo.documents')
)
BEGIN
    CREATE INDEX IX_documents_season_publish_order
        ON dbo.documents(season_id, is_published, display_order);
END;
GO

/* =========================================================
   9. bible_challenge_history
   Stores every group/member random result and awarded points.
   ========================================================= */
IF OBJECT_ID(N'dbo.bible_challenge_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bible_challenge_history
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        season_id               INT NOT NULL,
        session_id              INT NULL,
        group_id                INT NOT NULL,
        season_membership_id    INT NULL,
        result                  VARCHAR(20) NOT NULL,
        awarded_points          INT NOT NULL
                                CONSTRAINT DF_bible_challenge_points DEFAULT (0),
        source                  VARCHAR(30) NOT NULL
                                CONSTRAINT DF_bible_challenge_source DEFAULT ('RANDOMIZER'),
        created_by_user_id      INT NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_bible_challenge_created_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_bible_challenge_history PRIMARY KEY (id),
        CONSTRAINT FK_bible_challenge_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT FK_bible_challenge_sessions
            FOREIGN KEY (session_id) REFERENCES dbo.sessions(id),
        CONSTRAINT FK_bible_challenge_groups
            FOREIGN KEY (group_id) REFERENCES dbo.groups(id),
        CONSTRAINT FK_bible_challenge_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT FK_bible_challenge_users
            FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_bible_challenge_result
            CHECK (result IN ('FULL','PARTIAL','FAILED','SKIPPED')),
        CONSTRAINT CK_bible_challenge_points
            CHECK (awarded_points >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_bible_challenge_season_session'
      AND object_id = OBJECT_ID(N'dbo.bible_challenge_history')
)
BEGIN
    CREATE INDEX IX_bible_challenge_season_session
        ON dbo.bible_challenge_history(season_id, session_id, created_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_bible_challenge_membership'
      AND object_id = OBJECT_ID(N'dbo.bible_challenge_history')
)
BEGIN
    CREATE INDEX IX_bible_challenge_membership
        ON dbo.bible_challenge_history(season_membership_id, created_at);
END;
GO

/* =========================================================
   10. Final verification
   ========================================================= */
SELECT
    t.name AS table_name
FROM sys.tables AS t
WHERE t.name IN
(
    'sessions',
    'schedules',
    'attendance_records',
    'individual_score_transactions',
    'group_score_transactions',
    'student_questions',
    'encouragements',
    'documents',
    'bible_challenge_history'
)
ORDER BY t.name;
GO
