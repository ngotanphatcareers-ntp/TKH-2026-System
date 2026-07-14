/*
TKH 2026 — SEED DATA
File: 04_insert_seed_data.sql
Database: TKH_2026
Purpose:
Initial data for development only.
Run AFTER:
  01_create_core_tables.sql
  02_create_feature_tables.sql
  03_create_test_module_tables.sql
*/

USE [TKH_2026];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ---------- Season ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.seasons WHERE code='TKH2026')
BEGIN
INSERT INTO dbo.seasons(code,name,start_date,end_date,status)
VALUES
('TKH2026',N'Thánh Kinh Hè 2026','2026-07-01','2026-07-31','ACTIVE');
END
GO

DECLARE @SeasonId INT=(SELECT id FROM dbo.seasons WHERE code='TKH2026');

/* ---------- Season Settings ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.season_settings WHERE season_id=@SeasonId)
BEGIN
INSERT INTO dbo.season_settings
(season_id,ranking_visible,attendance_radius_m)
VALUES
(@SeasonId,1,200);
END
GO

DECLARE @SeasonId2 INT=(SELECT id FROM dbo.seasons WHERE code='TKH2026');

/* ---------- Groups ---------- */
DECLARE @Groups TABLE(code varchar(20),name nvarchar(100),ord int);
INSERT INTO @Groups VALUES
('G1',N'Giô-sép',1),
('G2',N'Đa-vít',2),
('G3',N'Môi-se',3),
('G4',N'Giô-suê',4),
('G5',N'Ê-li',5),
('G6',N'Ê-sai',6),
('G7',N'Đa-ni-ên',7),
('G8',N'Phao-lô',8);

INSERT INTO dbo.groups(season_id,code,name,display_order)
SELECT @SeasonId2,g.code,g.name,g.ord
FROM @Groups g
WHERE NOT EXISTS(
SELECT 1 FROM dbo.groups x
WHERE x.season_id=@SeasonId2 AND x.code=g.code
);
GO

/* ---------- Admin user ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE username='admin')
BEGIN
INSERT INTO dbo.users
(member_id,username,password_hash,role,must_change_password,is_active)
VALUES
(
NULL,
'admin',
'$2b$10$REPLACE_WITH_BCRYPT_HASH',
'ADMIN',
1,
1
);
END
GO

PRINT '================================';
PRINT 'Seed data completed';
PRINT 'Season : TKH2026';
PRINT 'Groups : 8';
PRINT 'Admin  : admin';
PRINT 'NOTE: Replace password_hash with a real bcrypt hash before production.';
PRINT '================================';
GO
