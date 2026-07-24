BEGIN TRANSACTION;

--------------------------------------------------
-- 1. Tạo Member TKH002
--------------------------------------------------

IF NOT EXISTS (
    SELECT 1
    FROM members
    WHERE tkh_code = 'TKH002'
)
BEGIN

INSERT INTO members
(
    tkh_code,
    full_name,
    normalized_name,
    status
)
VALUES
(
    'TKH002',
    N'Học viên Demo 2',
    N'HOC VIEN DEMO 2',
    'ACTIVE'
);

END

--------------------------------------------------
-- 2. Lấy MemberID
--------------------------------------------------

DECLARE @MemberId INT;

SELECT
    @MemberId = id
FROM members
WHERE tkh_code = 'TKH002';

--------------------------------------------------
-- 3. Tạo Membership
--------------------------------------------------

IF NOT EXISTS
(
    SELECT 1
    FROM season_memberships
    WHERE member_id = @MemberId
)
BEGIN

INSERT INTO season_memberships
(
    season_id,
    member_id,
    group_id,
    status
)
VALUES
(
    1,
    @MemberId,
    1,
    'ACTIVE'
);

END

--------------------------------------------------
-- 4. Copy password hash của tkh001
--------------------------------------------------

DECLARE @PasswordHash NVARCHAR(255);

SELECT
    @PasswordHash = password_hash
FROM users
WHERE username = 'tkh001';

--------------------------------------------------
-- 5. Tạo User
--------------------------------------------------

IF NOT EXISTS
(
    SELECT 1
    FROM users
    WHERE username = 'tkh002'
)
BEGIN

INSERT INTO users
(
    member_id,
    username,
    password_hash,
    role,
    must_change_password,
    is_active
)
VALUES
(
    @MemberId,
    'tkh002',
    @PasswordHash,
    'STUDENT',
    1,
    1
);

END

COMMIT TRANSACTION;

PRINT 'Demo student TKH002 created successfully.';