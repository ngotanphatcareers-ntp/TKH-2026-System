/*
=====================================================
TKH 2026 - Encouragement UTC Time Migration
Migration: 09

Purpose:
- Store encouragement timestamps in UTC.
- Preserve daily sending limits by Vietnam date (UTC+7).
- Convert existing local Vietnam timestamps to UTC.

Important:
- Run after migration 08.
=====================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO


BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(
        N'dbo.encouragements',
        N'U'
    ) IS NULL
    BEGIN
        THROW 50009,
            'Table dbo.encouragements does not exist.',
            1;
    END;


    DECLARE
        @created_default_name SYSNAME,
        @created_default_definition NVARCHAR(MAX),
        @updated_default_name SYSNAME,
        @updated_default_definition NVARCHAR(MAX),
        @drop_constraint_sql NVARCHAR(MAX);


    SELECT
        @created_default_name = dc.name,
        @created_default_definition = dc.definition
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id =
            OBJECT_ID(N'dbo.encouragements')
      AND c.name = N'created_at';


    SELECT
        @updated_default_name = dc.name,
        @updated_default_definition = dc.definition
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id =
            OBJECT_ID(N'dbo.encouragements')
      AND c.name = N'updated_at';


    IF @created_default_name IS NULL
       OR @updated_default_name IS NULL
    BEGIN
        THROW 50010,
            'Expected timestamp default constraints were not found.',
            1;
    END;


    /*
    If created_at already uses SYSUTCDATETIME(),
    the migration was previously completed.
    */

    IF LOWER(@created_default_definition)
        LIKE N'%sysutcdatetime%'
    BEGIN
        PRINT 'Encouragement UTC migration already completed. Skipping.';
    END
    ELSE
    BEGIN
        IF LOWER(@created_default_definition)
            NOT LIKE N'%sysdatetime%'
        BEGIN
            THROW 50011,
                'Unexpected created_at default. Migration stopped for safety.',
                1;
        END;


        /*
        Drop the unique index before changing timestamps
        and rebuilding sent_date.
        */

        IF EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE name =
                N'UX_encouragements_sender_recipient_date'
              AND object_id =
                OBJECT_ID(N'dbo.encouragements')
        )
        BEGIN
            DROP INDEX
                UX_encouragements_sender_recipient_date
            ON dbo.encouragements;
        END;


        /*
        Existing timestamps were stored as Vietnam local
        time. Convert them to UTC exactly once.
        */

        UPDATE dbo.encouragements
        SET
            created_at =
                DATEADD(HOUR, -7, created_at),

            updated_at =
                DATEADD(HOUR, -7, updated_at),

            read_at =
                CASE
                    WHEN read_at IS NULL THEN NULL
                    ELSE DATEADD(HOUR, -7, read_at)
                END;


        /*
        Replace local-time defaults with UTC defaults.
        */

        SET @drop_constraint_sql =
            N'ALTER TABLE dbo.encouragements ' +
            N'DROP CONSTRAINT ' +
            QUOTENAME(@created_default_name) +
            N';';

        EXEC sys.sp_executesql
            @drop_constraint_sql;


        SET @drop_constraint_sql =
            N'ALTER TABLE dbo.encouragements ' +
            N'DROP CONSTRAINT ' +
            QUOTENAME(@updated_default_name) +
            N';';

        EXEC sys.sp_executesql
            @drop_constraint_sql;


        ALTER TABLE dbo.encouragements
        ADD CONSTRAINT DF_encouragements_created_at
            DEFAULT (SYSUTCDATETIME())
            FOR created_at;


        ALTER TABLE dbo.encouragements
        ADD CONSTRAINT DF_encouragements_updated_at
            DEFAULT (SYSUTCDATETIME())
            FOR updated_at;


        /*
        Rebuild sent_date from UTC created_at,
        converted back to Vietnam calendar date.
        */

        IF COL_LENGTH(
            N'dbo.encouragements',
            N'sent_date'
        ) IS NOT NULL
        BEGIN
            ALTER TABLE dbo.encouragements
            DROP COLUMN sent_date;
        END;


        ALTER TABLE dbo.encouragements
        ADD sent_date AS
            CONVERT(
                DATE,
                DATEADD(HOUR, 7, created_at)
            )
            PERSISTED;


        /*
        Safety check before recreating unique index.
        */

        IF EXISTS
        (
            SELECT
                season_id,
                sender_season_membership_id,
                recipient_season_membership_id,
                sent_date
            FROM dbo.encouragements
            WHERE sender_season_membership_id
                IS NOT NULL
            GROUP BY
                season_id,
                sender_season_membership_id,
                recipient_season_membership_id,
                sent_date
            HAVING COUNT(*) > 1
        )
        BEGIN
            THROW 50012,
                'Duplicate daily encouragements detected after UTC conversion.',
                1;
        END;


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


        PRINT 'Encouragement timestamps converted to UTC successfully.';
    END;


    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO