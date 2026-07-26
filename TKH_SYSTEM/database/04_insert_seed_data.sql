/* ---------- Groups ---------- */
DECLARE @SeasonId2 INT =
(
    SELECT id
    FROM dbo.seasons
    WHERE code = 'TKH2026'
);

IF @SeasonId2 IS NULL
BEGIN
    THROW 50001, 'Không tìm thấy season TKH2026.', 1;
END;

DECLARE @Groups TABLE
(
    code VARCHAR(20),
    name NVARCHAR(100),
    ord INT
);

INSERT INTO @Groups
(
    code,
    name,
    ord
)
VALUES
('G1', N'Ti-mô-thê', 1),
('G2', N'Ca-lép', 2),
('G3', N'Sa-ra', 3),
('G4', N'Giô-na-than', 4),
('G5', N'Nê-hê-mi', 5),
('G6', N'Ma-ri', 6),
('G7', N'Giê-rê-mi', 7),
('G8', N'E-xơ-ra', 8);

MERGE dbo.groups AS target
USING @Groups AS source
    ON target.season_id = @SeasonId2
   AND target.code = source.code

WHEN MATCHED THEN
    UPDATE SET
        target.name = source.name,
        target.display_order = source.ord,
        target.is_active = 1,
        target.updated_at = SYSDATETIME()

WHEN NOT MATCHED THEN
    INSERT
    (
        season_id,
        code,
        name,
        display_order,
        is_active
    )
    VALUES
    (
        @SeasonId2,
        source.code,
        source.name,
        source.ord,
        1
    );

GO
