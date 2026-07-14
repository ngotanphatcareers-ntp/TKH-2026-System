/*
TKH 2026 — TEST MODULE TABLES
File: 03_create_test_module_tables.sql
Database: TKH_2026
Version: 1.0
Purpose:
- Create all SQL Server tables required by Module Test.
- Depends on:
  01_create_core_tables.sql
  02_create_feature_tables.sql
- Safe to re-run: each table/index is guarded.
*/

USE [TKH_2026];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* =========================================================
   1. exams
   ========================================================= */
IF OBJECT_ID(N'dbo.exams', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exams
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        season_id           INT NOT NULL,
        name                NVARCHAR(100) NOT NULL,
        type                VARCHAR(20) NOT NULL,
        status              VARCHAR(30) NOT NULL
                            CONSTRAINT DF_exams_status DEFAULT ('DRAFT'),
        scheduled_start_at  DATETIME2(0) NULL,
        time_per_question   INT NOT NULL,
        result_visibility   VARCHAR(20) NOT NULL
                            CONSTRAINT DF_exams_result_visibility DEFAULT ('HIDDEN'),
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_exams_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_exams_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exams PRIMARY KEY (id),
        CONSTRAINT FK_exams_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT CK_exams_type
            CHECK (type IN ('PRE_TEST','FINAL_TEST')),
        CONSTRAINT CK_exams_status
            CHECK (
                status IN
                (
                    'DRAFT',
                    'SCHEDULED',
                    'WAITING_ROOM_OPEN',
                    'IN_PROGRESS',
                    'SUBMITTING',
                    'COMPLETED',
                    'CANCELLED'
                )
            ),
        CONSTRAINT CK_exams_time_per_question
            CHECK (time_per_question > 0),
        CONSTRAINT CK_exams_result_visibility
            CHECK (
                result_visibility IN
                (
                    'HIDDEN',
                    'SCORE_ONLY',
                    'FULL_RESULT'
                )
            )
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exams_season_type'
      AND object_id = OBJECT_ID(N'dbo.exams')
)
BEGIN
    CREATE INDEX IX_exams_season_type
        ON dbo.exams(season_id, type);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exams_season_status'
      AND object_id = OBJECT_ID(N'dbo.exams')
)
BEGIN
    CREATE INDEX IX_exams_season_status
        ON dbo.exams(season_id, status);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exams_scheduled_start'
      AND object_id = OBJECT_ID(N'dbo.exams')
)
BEGIN
    CREATE INDEX IX_exams_scheduled_start
        ON dbo.exams(scheduled_start_at);
END;
GO

/* Only one exam may be IN_PROGRESS per season. */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_exams_one_in_progress_per_season'
      AND object_id = OBJECT_ID(N'dbo.exams')
)
BEGIN
    CREATE UNIQUE INDEX UX_exams_one_in_progress_per_season
        ON dbo.exams(season_id)
        WHERE status = 'IN_PROGRESS';
END;
GO

/* =========================================================
   2. exam_questions
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_questions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_questions
    (
        id              INT IDENTITY(1,1) NOT NULL,
        exam_id         INT NOT NULL,
        question_index  INT NOT NULL,
        question_text   NVARCHAR(MAX) NOT NULL,
        answer_a        NVARCHAR(500) NOT NULL,
        answer_b        NVARCHAR(500) NOT NULL,
        answer_c        NVARCHAR(500) NOT NULL,
        answer_d        NVARCHAR(500) NOT NULL,
        correct_answer  CHAR(1) NOT NULL,
        points          INT NOT NULL
                        CONSTRAINT DF_exam_questions_points DEFAULT (10),
        created_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_exam_questions_created_at DEFAULT (SYSDATETIME()),
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_exam_questions_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exam_questions PRIMARY KEY (id),
        CONSTRAINT FK_exam_questions_exams
            FOREIGN KEY (exam_id) REFERENCES dbo.exams(id),
        CONSTRAINT UQ_exam_questions_exam_index
            UNIQUE (exam_id, question_index),
        CONSTRAINT CK_exam_questions_index
            CHECK (question_index > 0),
        CONSTRAINT CK_exam_questions_correct_answer
            CHECK (correct_answer IN ('A','B','C','D')),
        CONSTRAINT CK_exam_questions_points
            CHECK (points >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_questions_exam_index'
      AND object_id = OBJECT_ID(N'dbo.exam_questions')
)
BEGIN
    CREATE INDEX IX_exam_questions_exam_index
        ON dbo.exam_questions(exam_id, question_index);
END;
GO

/* =========================================================
   3. exam_waiting_room
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_waiting_room', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_waiting_room
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        exam_id                 INT NOT NULL,
        season_membership_id    INT NOT NULL,
        joined_at               DATETIME2(0) NOT NULL
                                CONSTRAINT DF_exam_waiting_room_joined_at DEFAULT (SYSDATETIME()),
        last_seen_at            DATETIME2(0) NULL,

        CONSTRAINT PK_exam_waiting_room PRIMARY KEY (id),
        CONSTRAINT FK_exam_waiting_room_exams
            FOREIGN KEY (exam_id) REFERENCES dbo.exams(id),
        CONSTRAINT FK_exam_waiting_room_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT UQ_exam_waiting_room_exam_membership
            UNIQUE (exam_id, season_membership_id)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_waiting_room_exam_joined'
      AND object_id = OBJECT_ID(N'dbo.exam_waiting_room')
)
BEGIN
    CREATE INDEX IX_exam_waiting_room_exam_joined
        ON dbo.exam_waiting_room(exam_id, joined_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_waiting_room_membership_exam'
      AND object_id = OBJECT_ID(N'dbo.exam_waiting_room')
)
BEGIN
    CREATE INDEX IX_exam_waiting_room_membership_exam
        ON dbo.exam_waiting_room(season_membership_id, exam_id);
END;
GO

/* =========================================================
   4. exam_live_states
   One current runtime row per exam.
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_live_states', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_live_states
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        exam_id                 INT NOT NULL,
        current_question_id     INT NULL,
        current_question_index  INT NULL,
        question_started_at     DATETIME2(0) NULL,
        question_ends_at        DATETIME2(0) NULL,
        state                   VARCHAR(30) NOT NULL
                                CONSTRAINT DF_exam_live_states_state DEFAULT ('WAITING'),
        updated_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_exam_live_states_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exam_live_states PRIMARY KEY (id),
        CONSTRAINT FK_exam_live_states_exams
            FOREIGN KEY (exam_id) REFERENCES dbo.exams(id),
        CONSTRAINT FK_exam_live_states_questions
            FOREIGN KEY (current_question_id) REFERENCES dbo.exam_questions(id),
        CONSTRAINT UQ_exam_live_states_exam UNIQUE (exam_id),
        CONSTRAINT CK_exam_live_states_state
            CHECK (
                state IN
                (
                    'WAITING',
                    'ACTIVE',
                    'LOCKED',
                    'WAITING_NEXT',
                    'COMPLETED'
                )
            ),
        CONSTRAINT CK_exam_live_states_question_index
            CHECK (
                current_question_index IS NULL
                OR current_question_index > 0
            ),
        CONSTRAINT CK_exam_live_states_time_range
            CHECK (
                question_ends_at IS NULL
                OR question_started_at IS NULL
                OR question_ends_at >= question_started_at
            )
    );
END;
GO

/* =========================================================
   5. exam_attempts
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_attempts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_attempts
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        exam_id                 INT NOT NULL,
        season_membership_id    INT NOT NULL,
        attempt_no              INT NOT NULL
                                CONSTRAINT DF_exam_attempts_attempt_no DEFAULT (1),
        status                  VARCHAR(20) NOT NULL
                                CONSTRAINT DF_exam_attempts_status DEFAULT ('IN_PROGRESS'),
        reset_reason            NVARCHAR(500) NULL,
        started_at              DATETIME2(0) NULL,
        submitted_at            DATETIME2(0) NULL,
        score                   INT NOT NULL
                                CONSTRAINT DF_exam_attempts_score DEFAULT (0),
        correct_count           INT NOT NULL
                                CONSTRAINT DF_exam_attempts_correct_count DEFAULT (0),
        total_questions         INT NOT NULL
                                CONSTRAINT DF_exam_attempts_total_questions DEFAULT (0),
        is_late_join            BIT NOT NULL
                                CONSTRAINT DF_exam_attempts_is_late_join DEFAULT (0),
        joined_question_index   INT NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_exam_attempts_created_at DEFAULT (SYSDATETIME()),
        updated_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_exam_attempts_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exam_attempts PRIMARY KEY (id),
        CONSTRAINT FK_exam_attempts_exams
            FOREIGN KEY (exam_id) REFERENCES dbo.exams(id),
        CONSTRAINT FK_exam_attempts_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT UQ_exam_attempts_exam_membership_no
            UNIQUE (exam_id, season_membership_id, attempt_no),
        CONSTRAINT CK_exam_attempts_attempt_no
            CHECK (attempt_no > 0),
        CONSTRAINT CK_exam_attempts_status
            CHECK (
                status IN
                (
                    'IN_PROGRESS',
                    'SUBMITTING',
                    'COMPLETED',
                    'RESET',
                    'CANCELLED'
                )
            ),
        CONSTRAINT CK_exam_attempts_score
            CHECK (score >= 0),
        CONSTRAINT CK_exam_attempts_correct_count
            CHECK (correct_count >= 0),
        CONSTRAINT CK_exam_attempts_total_questions
            CHECK (total_questions >= 0),
        CONSTRAINT CK_exam_attempts_joined_question
            CHECK (
                joined_question_index IS NULL
                OR joined_question_index > 0
            ),
        CONSTRAINT CK_exam_attempts_submit_time
            CHECK (
                submitted_at IS NULL
                OR started_at IS NULL
                OR submitted_at >= started_at
            )
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_attempts_exam_status'
      AND object_id = OBJECT_ID(N'dbo.exam_attempts')
)
BEGIN
    CREATE INDEX IX_exam_attempts_exam_status
        ON dbo.exam_attempts(exam_id, status);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_attempts_membership_exam'
      AND object_id = OBJECT_ID(N'dbo.exam_attempts')
)
BEGIN
    CREATE INDEX IX_exam_attempts_membership_exam
        ON dbo.exam_attempts(season_membership_id, exam_id);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_attempts_exam_status_score'
      AND object_id = OBJECT_ID(N'dbo.exam_attempts')
)
BEGIN
    CREATE INDEX IX_exam_attempts_exam_status_score
        ON dbo.exam_attempts(exam_id, status, score DESC, submitted_at);
END;
GO

/* One active attempt per student per exam. */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_exam_attempts_one_active'
      AND object_id = OBJECT_ID(N'dbo.exam_attempts')
)
BEGIN
    CREATE UNIQUE INDEX UX_exam_attempts_one_active
        ON dbo.exam_attempts(exam_id, season_membership_id)
        WHERE status IN ('IN_PROGRESS','SUBMITTING');
END;
GO

/* =========================================================
   6. exam_attempt_answers
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_attempt_answers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_attempt_answers
    (
        id              INT IDENTITY(1,1) NOT NULL,
        attempt_id      INT NOT NULL,
        question_id     INT NOT NULL,
        chosen_answer   CHAR(1) NULL,
        is_correct      BIT NULL,
        answered_at     DATETIME2(0) NULL,
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_exam_attempt_answers_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exam_attempt_answers PRIMARY KEY (id),
        CONSTRAINT FK_exam_attempt_answers_attempts
            FOREIGN KEY (attempt_id) REFERENCES dbo.exam_attempts(id),
        CONSTRAINT FK_exam_attempt_answers_questions
            FOREIGN KEY (question_id) REFERENCES dbo.exam_questions(id),
        CONSTRAINT UQ_exam_attempt_answers_attempt_question
            UNIQUE (attempt_id, question_id),
        CONSTRAINT CK_exam_attempt_answers_choice
            CHECK (
                chosen_answer IS NULL
                OR chosen_answer IN ('A','B','C','D')
            )
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_attempt_answers_attempt'
      AND object_id = OBJECT_ID(N'dbo.exam_attempt_answers')
)
BEGIN
    CREATE INDEX IX_exam_attempt_answers_attempt
        ON dbo.exam_attempt_answers(attempt_id);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_attempt_answers_question'
      AND object_id = OBJECT_ID(N'dbo.exam_attempt_answers')
)
BEGIN
    CREATE INDEX IX_exam_attempt_answers_question
        ON dbo.exam_attempt_answers(question_id);
END;
GO

/* =========================================================
   7. exam_events
   Audit and important business events.
   ========================================================= */
IF OBJECT_ID(N'dbo.exam_events', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exam_events
    (
        id                      INT IDENTITY(1,1) NOT NULL,
        exam_id                 INT NOT NULL,
        season_membership_id    INT NULL,
        actor_user_id           INT NULL,
        event_type              VARCHAR(50) NOT NULL,
        entity_type             VARCHAR(30) NULL,
        entity_id               INT NULL,
        reason                  NVARCHAR(500) NULL,
        payload_json            NVARCHAR(MAX) NULL,
        created_at              DATETIME2(0) NOT NULL
                                CONSTRAINT DF_exam_events_created_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_exam_events PRIMARY KEY (id),
        CONSTRAINT FK_exam_events_exams
            FOREIGN KEY (exam_id) REFERENCES dbo.exams(id),
        CONSTRAINT FK_exam_events_memberships
            FOREIGN KEY (season_membership_id)
            REFERENCES dbo.season_memberships(id),
        CONSTRAINT FK_exam_events_users
            FOREIGN KEY (actor_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_exam_events_payload_json
            CHECK (payload_json IS NULL OR ISJSON(payload_json) = 1)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_events_exam_created'
      AND object_id = OBJECT_ID(N'dbo.exam_events')
)
BEGIN
    CREATE INDEX IX_exam_events_exam_created
        ON dbo.exam_events(exam_id, created_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_events_actor_created'
      AND object_id = OBJECT_ID(N'dbo.exam_events')
)
BEGIN
    CREATE INDEX IX_exam_events_actor_created
        ON dbo.exam_events(actor_user_id, created_at);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_exam_events_type_created'
      AND object_id = OBJECT_ID(N'dbo.exam_events')
)
BEGIN
    CREATE INDEX IX_exam_events_type_created
        ON dbo.exam_events(event_type, created_at);
END;
GO

/* =========================================================
   8. Final verification
   ========================================================= */
SELECT
    t.name AS table_name
FROM sys.tables AS t
WHERE t.name IN
(
    'exams',
    'exam_questions',
    'exam_waiting_room',
    'exam_live_states',
    'exam_attempts',
    'exam_attempt_answers',
    'exam_events'
)
ORDER BY t.name;
GO
