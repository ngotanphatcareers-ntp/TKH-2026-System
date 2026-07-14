/*
TKH 2026 — CORE TABLES
File: 01_create_core_tables.sql
Database: TKH_2026
Version: 1.0
Purpose:
- Create the shared foundation used by all modules.
- Do not create Module Test tables in this file.
- Safe to re-run: each table/index is guarded.
*/

USE [TKH_2026];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* =========================================================
   1. seasons
   ========================================================= */
IF OBJECT_ID(N'dbo.seasons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.seasons
    (
        id              INT IDENTITY(1,1) NOT NULL,
        code            VARCHAR(30) NOT NULL,
        name            NVARCHAR(150) NOT NULL,
        start_date      DATE NULL,
        end_date        DATE NULL,
        status          VARCHAR(20) NOT NULL
                        CONSTRAINT DF_seasons_status DEFAULT ('DRAFT'),
        created_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_seasons_created_at DEFAULT (SYSDATETIME()),
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_seasons_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_seasons PRIMARY KEY (id),
        CONSTRAINT UQ_seasons_code UNIQUE (code),
        CONSTRAINT CK_seasons_status
            CHECK (status IN ('DRAFT','ACTIVE','COMPLETED','ARCHIVED')),
        CONSTRAINT CK_seasons_date_range
            CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
    );
END;
GO

/* Only one ACTIVE season at a time. */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_seasons_one_active'
      AND object_id = OBJECT_ID(N'dbo.seasons')
)
BEGIN
    CREATE UNIQUE INDEX UX_seasons_one_active
        ON dbo.seasons(status)
        WHERE status = 'ACTIVE';
END;
GO

/* =========================================================
   2. groups
   Each group belongs to one season.
   ========================================================= */
IF OBJECT_ID(N'dbo.groups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.groups
    (
        id              INT IDENTITY(1,1) NOT NULL,
        season_id       INT NOT NULL,
        code            VARCHAR(30) NOT NULL,
        name            NVARCHAR(100) NOT NULL,
        logo_path       NVARCHAR(500) NULL,
        display_order   INT NOT NULL
                        CONSTRAINT DF_groups_display_order DEFAULT (0),
        is_active       BIT NOT NULL
                        CONSTRAINT DF_groups_is_active DEFAULT (1),
        created_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_groups_created_at DEFAULT (SYSDATETIME()),
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_groups_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_groups PRIMARY KEY (id),
        CONSTRAINT FK_groups_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT UQ_groups_season_code UNIQUE (season_id, code),
        CONSTRAINT UQ_groups_season_name UNIQUE (season_id, name),
        CONSTRAINT CK_groups_display_order CHECK (display_order >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_groups_season_active'
      AND object_id = OBJECT_ID(N'dbo.groups')
)
BEGIN
    CREATE INDEX IX_groups_season_active
        ON dbo.groups(season_id, is_active, display_order);
END;
GO

/* =========================================================
   3. members
   Person-level profile, independent from a season.
   ========================================================= */
IF OBJECT_ID(N'dbo.members', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.members
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        tkh_code            VARCHAR(30) NOT NULL,
        full_name           NVARCHAR(150) NOT NULL,
        normalized_name     NVARCHAR(150) NULL,
        email               NVARCHAR(255) NULL,
        phone               VARCHAR(30) NULL,
        avatar_filename     NVARCHAR(255) NULL,
        status              VARCHAR(20) NOT NULL
                            CONSTRAINT DF_members_status DEFAULT ('ACTIVE'),
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_members_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_members_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_members PRIMARY KEY (id),
        CONSTRAINT UQ_members_tkh_code UNIQUE (tkh_code),
        CONSTRAINT CK_members_status
            CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED'))
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_members_full_name'
      AND object_id = OBJECT_ID(N'dbo.members')
)
BEGIN
    CREATE INDEX IX_members_full_name
        ON dbo.members(full_name);
END;
GO

/* =========================================================
   4. users
   Login identity. A student account normally links to a member.
   An admin account may have member_id = NULL.
   ========================================================= */
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        member_id           INT NULL,
        username            VARCHAR(100) NOT NULL,
        password_hash       NVARCHAR(255) NOT NULL,
        role                VARCHAR(20) NOT NULL,
        must_change_password BIT NOT NULL
                             CONSTRAINT DF_users_must_change_password DEFAULT (1),
        is_active           BIT NOT NULL
                            CONSTRAINT DF_users_is_active DEFAULT (1),
        last_login_at       DATETIME2(0) NULL,
        password_changed_at DATETIME2(0) NULL,
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_users_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_users_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_users PRIMARY KEY (id),
        CONSTRAINT FK_users_members
            FOREIGN KEY (member_id) REFERENCES dbo.members(id),
        CONSTRAINT UQ_users_username UNIQUE (username),
        CONSTRAINT UQ_users_member UNIQUE (member_id),
        CONSTRAINT CK_users_role CHECK (role IN ('ADMIN','STUDENT'))
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_users_role_active'
      AND object_id = OBJECT_ID(N'dbo.users')
)
BEGIN
    CREATE INDEX IX_users_role_active
        ON dbo.users(role, is_active);
END;
GO

/* =========================================================
   5. season_memberships
   Membership of a person in a specific season and group.
   Feature tables should prefer season_membership_id.
   ========================================================= */
IF OBJECT_ID(N'dbo.season_memberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.season_memberships
    (
        id              INT IDENTITY(1,1) NOT NULL,
        season_id       INT NOT NULL,
        member_id       INT NOT NULL,
        group_id        INT NULL,
        status          VARCHAR(20) NOT NULL
                        CONSTRAINT DF_season_memberships_status DEFAULT ('ACTIVE'),
        joined_at       DATETIME2(0) NOT NULL
                        CONSTRAINT DF_season_memberships_joined_at DEFAULT (SYSDATETIME()),
        left_at         DATETIME2(0) NULL,
        created_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_season_memberships_created_at DEFAULT (SYSDATETIME()),
        updated_at      DATETIME2(0) NOT NULL
                        CONSTRAINT DF_season_memberships_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_season_memberships PRIMARY KEY (id),
        CONSTRAINT FK_season_memberships_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT FK_season_memberships_members
            FOREIGN KEY (member_id) REFERENCES dbo.members(id),
        CONSTRAINT FK_season_memberships_groups
            FOREIGN KEY (group_id) REFERENCES dbo.groups(id),
        CONSTRAINT UQ_season_memberships_season_member
            UNIQUE (season_id, member_id),
        CONSTRAINT CK_season_memberships_status
            CHECK (status IN ('ACTIVE','INACTIVE','WITHDRAWN')),
        CONSTRAINT CK_season_memberships_dates
            CHECK (left_at IS NULL OR left_at >= joined_at)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_season_memberships_season_group_status'
      AND object_id = OBJECT_ID(N'dbo.season_memberships')
)
BEGIN
    CREATE INDEX IX_season_memberships_season_group_status
        ON dbo.season_memberships(season_id, group_id, status);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_season_memberships_member_season'
      AND object_id = OBJECT_ID(N'dbo.season_memberships')
)
BEGIN
    CREATE INDEX IX_season_memberships_member_season
        ON dbo.season_memberships(member_id, season_id);
END;
GO

/* =========================================================
   6. season_settings
   One settings row per season.
   ========================================================= */
IF OBJECT_ID(N'dbo.season_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.season_settings
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        season_id           INT NOT NULL,
        ranking_visible     BIT NOT NULL
                            CONSTRAINT DF_season_settings_ranking_visible DEFAULT (1),
        attendance_radius_m INT NOT NULL
                            CONSTRAINT DF_season_settings_attendance_radius DEFAULT (200),
        created_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_season_settings_created_at DEFAULT (SYSDATETIME()),
        updated_at          DATETIME2(0) NOT NULL
                            CONSTRAINT DF_season_settings_updated_at DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_season_settings PRIMARY KEY (id),
        CONSTRAINT FK_season_settings_seasons
            FOREIGN KEY (season_id) REFERENCES dbo.seasons(id),
        CONSTRAINT UQ_season_settings_season UNIQUE (season_id),
        CONSTRAINT CK_season_settings_attendance_radius
            CHECK (attendance_radius_m > 0)
    );
END;
GO

/* =========================================================
   7. Final verification
   ========================================================= */
SELECT
    t.name AS table_name
FROM sys.tables AS t
WHERE t.name IN
(
    'seasons',
    'groups',
    'members',
    'users',
    'season_memberships',
    'season_settings'
)
ORDER BY t.name;
GO
