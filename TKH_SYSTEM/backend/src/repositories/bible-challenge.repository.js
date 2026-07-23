const { getPool, sql } = require("../config/database");


async function findCurrentRoundNumber({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        COALESCE(MAX(round_no), 1) AS round_no
      FROM dbo.bible_challenge_rounds
      WHERE season_id = @seasonId
        AND session_id = @sessionId;
    `);

  return Number(result.recordset[0]?.round_no || 1);
}


async function findEligibleGroups({
  seasonId,
  sessionId,
  roundNo,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("roundNo", sql.Int, roundNo)
    .query(`
      SELECT
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order,

        COUNT(DISTINCT sm.id)
          AS eligible_member_count

      FROM dbo.groups AS g

      INNER JOIN dbo.season_memberships AS sm
        ON sm.group_id = g.id
       AND sm.season_id = g.season_id
       AND sm.status = 'ACTIVE'

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id
       AND m.status = 'ACTIVE'

      INNER JOIN dbo.attendance_records AS ar
        ON ar.session_id = @sessionId
       AND ar.season_membership_id = sm.id
       AND ar.status = 'PRESENT'

      WHERE g.season_id = @seasonId
        AND g.is_active = 1

        AND NOT EXISTS
        (
          SELECT 1
          FROM dbo.bible_challenge_history AS bch
          WHERE bch.season_id = @seasonId
            AND bch.session_id = @sessionId
            AND bch.season_membership_id = sm.id
        )

        AND NOT EXISTS
        (
          SELECT 1
          FROM dbo.bible_challenge_rounds AS bcr
          WHERE bcr.season_id = @seasonId
            AND bcr.session_id = @sessionId
            AND bcr.round_no = @roundNo
            AND bcr.group_id = g.id
        )

      GROUP BY
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order

      ORDER BY
        g.display_order ASC,
        g.id ASC;
    `);

  return result.recordset;
}


async function findAllGroupsWithEligibleMembers({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order,

        COUNT(DISTINCT sm.id)
          AS eligible_member_count

      FROM dbo.groups AS g

      INNER JOIN dbo.season_memberships AS sm
        ON sm.group_id = g.id
       AND sm.season_id = g.season_id
       AND sm.status = 'ACTIVE'

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id
       AND m.status = 'ACTIVE'

      INNER JOIN dbo.attendance_records AS ar
        ON ar.session_id = @sessionId
       AND ar.season_membership_id = sm.id
       AND ar.status = 'PRESENT'

      WHERE g.season_id = @seasonId
        AND g.is_active = 1

        AND NOT EXISTS
        (
          SELECT 1
          FROM dbo.bible_challenge_history AS bch
          WHERE bch.season_id = @seasonId
            AND bch.session_id = @sessionId
            AND bch.season_membership_id = sm.id
        )

      GROUP BY
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order

      ORDER BY
        g.display_order ASC,
        g.id ASC;
    `);

  return result.recordset;
}


async function findUsedGroupsInRound({
  seasonId,
  sessionId,
  roundNo,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("roundNo", sql.Int, roundNo)
    .query(`
      SELECT
        bcr.id,
        bcr.season_id,
        bcr.session_id,
        bcr.round_no,
        bcr.group_id,
        bcr.created_by_user_id,
        bcr.created_at,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path

      FROM dbo.bible_challenge_rounds AS bcr

      INNER JOIN dbo.groups AS g
        ON g.id = bcr.group_id

      WHERE bcr.season_id = @seasonId
        AND bcr.session_id = @sessionId
        AND bcr.round_no = @roundNo

      ORDER BY
        bcr.created_at ASC,
        bcr.id ASC;
    `);

  return result.recordset;
}


async function createRoundSelection({
  seasonId,
  sessionId,
  roundNo,
  groupId,
  createdByUserId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("roundNo", sql.Int, roundNo)
    .input("groupId", sql.Int, groupId)
    .input(
      "createdByUserId",
      sql.Int,
      createdByUserId || null
    )
    .query(`
      INSERT INTO dbo.bible_challenge_rounds
      (
        season_id,
        session_id,
        round_no,
        group_id,
        created_by_user_id
      )
      OUTPUT
        INSERTED.id,
        INSERTED.season_id,
        INSERTED.session_id,
        INSERTED.round_no,
        INSERTED.group_id,
        INSERTED.created_by_user_id,
        INSERTED.created_at
      VALUES
      (
        @seasonId,
        @sessionId,
        @roundNo,
        @groupId,
        @createdByUserId
      );
    `);

  return result.recordset[0];
}


async function findLatestRoundSelection({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT TOP 1
        bcr.id,
        bcr.season_id,
        bcr.session_id,
        bcr.round_no,
        bcr.group_id,
        bcr.created_by_user_id,
        bcr.created_at,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path

      FROM dbo.bible_challenge_rounds AS bcr

      INNER JOIN dbo.groups AS g
        ON g.id = bcr.group_id

      WHERE bcr.season_id = @seasonId
        AND bcr.session_id = @sessionId

      ORDER BY
        bcr.created_at DESC,
        bcr.id DESC;
    `);

  return result.recordset[0] || null;
}


async function findGroupById({
  seasonId,
  groupId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("groupId", sql.Int, groupId)
    .query(`
      SELECT TOP 1
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order,
        g.is_active
      FROM dbo.groups AS g
      WHERE g.id = @groupId
        AND g.season_id = @seasonId;
    `);

  return result.recordset[0] || null;
}


async function findEligibleMembersByGroup({
  seasonId,
  sessionId,
  groupId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("groupId", sql.Int, groupId)
    .query(`
      SELECT
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,

        m.tkh_code,
        m.full_name,
        m.avatar_filename,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path,

        ar.id AS attendance_record_id,
        ar.checked_in_at

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id
       AND m.status = 'ACTIVE'

      INNER JOIN dbo.groups AS g
        ON g.id = sm.group_id
       AND g.season_id = sm.season_id
       AND g.is_active = 1

      INNER JOIN dbo.attendance_records AS ar
        ON ar.session_id = @sessionId
       AND ar.season_membership_id = sm.id
       AND ar.status = 'PRESENT'

      WHERE sm.season_id = @seasonId
        AND sm.group_id = @groupId
        AND sm.status = 'ACTIVE'

        AND NOT EXISTS
        (
          SELECT 1
          FROM dbo.bible_challenge_history AS bch
          WHERE bch.season_id = @seasonId
            AND bch.session_id = @sessionId
            AND bch.season_membership_id = sm.id
        )

      ORDER BY
        m.full_name ASC,
        sm.id ASC;
    `);

  return result.recordset;
}


async function findMembershipForChallenge({
  seasonId,
  sessionId,
  groupId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("groupId", sql.Int, groupId)
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT TOP 1
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,

        m.tkh_code,
        m.full_name,
        m.avatar_filename,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path,

        ar.id AS attendance_record_id,
        ar.checked_in_at,

        CASE
          WHEN EXISTS
          (
            SELECT 1
            FROM dbo.bible_challenge_history AS bch
            WHERE bch.season_id = @SeasonId
              AND bch.session_id = @SessionId
              AND bch.season_membership_id = sm.id
          )
          THEN 1
          ELSE 0
        END AS already_used

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      INNER JOIN dbo.groups AS g
        ON g.id = sm.group_id
       AND g.season_id = sm.season_id

      INNER JOIN dbo.attendance_records AS ar
        ON ar.session_id = @sessionId
       AND ar.season_membership_id = sm.id
       AND ar.status = 'PRESENT'

      WHERE sm.id = @seasonMembershipId
        AND sm.season_id = @seasonId
        AND sm.group_id = @groupId
        AND sm.status = 'ACTIVE'
        AND m.status = 'ACTIVE'
        AND g.is_active = 1;
    `);

  return result.recordset[0] || null;
}


async function createHistoryRecord({
  seasonId,
  sessionId,
  groupId,
  seasonMembershipId,
  result,
  awardedPoints,
  source,
  createdByUserId,
}) {
  const pool = await getPool();

  const queryResult = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .input("groupId", sql.Int, groupId)
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .input("result", sql.VarChar(20), result)
    .input("awardedPoints", sql.Int, awardedPoints)
    .input(
      "source",
      sql.VarChar(30),
      source || "RANDOMIZER"
    )
    .input(
      "createdByUserId",
      sql.Int,
      createdByUserId || null
    )
    .query(`
      INSERT INTO dbo.bible_challenge_history
      (
        season_id,
        session_id,
        group_id,
        season_membership_id,
        result,
        awarded_points,
        source,
        created_by_user_id
      )
      OUTPUT
        INSERTED.id,
        INSERTED.season_id,
        INSERTED.session_id,
        INSERTED.group_id,
        INSERTED.season_membership_id,
        INSERTED.result,
        INSERTED.awarded_points,
        INSERTED.source,
        INSERTED.created_by_user_id,
        INSERTED.created_at
      VALUES
      (
        @seasonId,
        @sessionId,
        @groupId,
        @seasonMembershipId,
        @result,
        @awardedPoints,
        @source,
        @createdByUserId
      );
    `);

  return queryResult.recordset[0];
}


async function findHistoryBySession({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        bch.id,
        bch.season_id,
        bch.session_id,
        bch.group_id,
        bch.season_membership_id,
        bch.result,
        bch.awarded_points,
        bch.source,
        bch.created_by_user_id,
        bch.created_at,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path,

        sm.member_id,

        m.tkh_code,
        m.full_name,
        m.avatar_filename,

        u.username AS created_by_username

      FROM dbo.bible_challenge_history AS bch

      INNER JOIN dbo.groups AS g
        ON g.id = bch.group_id

      LEFT JOIN dbo.season_memberships AS sm
        ON sm.id = bch.season_membership_id

      LEFT JOIN dbo.members AS m
        ON m.id = sm.member_id

      LEFT JOIN dbo.users AS u
        ON u.id = bch.created_by_user_id

      WHERE bch.season_id = @seasonId
        AND bch.session_id = @sessionId

      ORDER BY
        bch.created_at DESC,
        bch.id DESC;
    `);

  return result.recordset;
}


async function findRoundHistoryBySession({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        bcr.id,
        bcr.season_id,
        bcr.session_id,
        bcr.round_no,
        bcr.group_id,
        bcr.created_by_user_id,
        bcr.created_at,

        g.code AS group_code,
        g.name AS group_name,
        g.logo_path AS group_logo_path,

        u.username AS created_by_username

      FROM dbo.bible_challenge_rounds AS bcr

      INNER JOIN dbo.groups AS g
        ON g.id = bcr.group_id

      LEFT JOIN dbo.users AS u
        ON u.id = bcr.created_by_user_id

      WHERE bcr.season_id = @seasonId
        AND bcr.session_id = @sessionId

      ORDER BY
        bcr.round_no DESC,
        bcr.created_at DESC,
        bcr.id DESC;
    `);

  return result.recordset;
}


async function countCheckedInMembers({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        COUNT(DISTINCT sm.id) AS checked_in_count

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id
       AND m.status = 'ACTIVE'

      INNER JOIN dbo.groups AS g
        ON g.id = sm.group_id
       AND g.is_active = 1

      INNER JOIN dbo.attendance_records AS ar
        ON ar.session_id = @sessionId
       AND ar.season_membership_id = sm.id
       AND ar.status = 'PRESENT'

      WHERE sm.season_id = @seasonId
        AND sm.status = 'ACTIVE';
    `);

  return Number(
    result.recordset[0]?.checked_in_count || 0
  );
}


async function countCompletedMembers({
  seasonId,
  sessionId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("sessionId", sql.Int, sessionId)
    .query(`
      SELECT
        COUNT(DISTINCT season_membership_id)
          AS completed_member_count

      FROM dbo.bible_challenge_history

      WHERE season_id = @seasonId
        AND session_id = @sessionId
        AND season_membership_id IS NOT NULL;
    `);

  return Number(
    result.recordset[0]?.completed_member_count || 0
  );
}


module.exports = {
  findCurrentRoundNumber,
  findEligibleGroups,
  findAllGroupsWithEligibleMembers,
  findUsedGroupsInRound,
  createRoundSelection,
  findLatestRoundSelection,
  findGroupById,
  findEligibleMembersByGroup,
  findMembershipForChallenge,
  createHistoryRecord,
  findHistoryBySession,
  findRoundHistoryBySession,
  countCheckedInMembers,
  countCompletedMembers,
};
