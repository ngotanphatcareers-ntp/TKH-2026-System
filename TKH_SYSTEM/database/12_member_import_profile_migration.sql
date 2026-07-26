SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.members', N'gender') IS NULL
BEGIN
    ALTER TABLE dbo.members
    ADD gender NVARCHAR(20) NULL;
END;

IF COL_LENGTH(N'dbo.members', N'birth_date') IS NULL
BEGIN
    ALTER TABLE dbo.members
    ADD birth_date DATE NULL;
END;

COMMIT TRANSACTION;
GO

PRINT 'Migration 12 completed: members.gender and members.birth_date are ready.';
GO