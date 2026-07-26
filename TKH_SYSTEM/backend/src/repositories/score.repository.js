const {
  getPool,
  sql,
} = require("../config/database");


async function findActiveMembershipByMemberId(
  memberId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "memberId",
      sql.Int,
      memberId
    )
    .query(`
      SELECT TOP 1
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,
        sm.status AS membership_status,

        s.code AS season_code,
        s.name AS season_name,

        m.tkh_code,
        m.full_name,

        u.id AS user_id,
        u.username,

        g.code AS group_code,
        g.name AS group_name

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.seasons AS s
        ON s.id = sm.season_id

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      LEFT JOIN dbo.users AS u
        ON u.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE sm.member_id = @memberId
        AND sm.status = 'ACTIVE'
        AND s.status = 'ACTIVE'

      ORDER BY sm.id DESC;
    `);

  return result.recordset[0] || null;
}


async function findActiveMembershipByUsername(
  username
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "username",
      sql.VarChar(100),
      username
    )
    .query(`
      SELECT TOP 1
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,
        sm.status AS membership_status,

        s.code AS season_code,
        s.name AS season_name,

        m.tkh_code,
        m.full_name,

        u.id AS user_id,
        u.username,

        g.code AS group_code,
        g.name AS group_name

      FROM dbo.users AS u

      INNER JOIN dbo.members AS m
        ON m.id = u.member_id

      INNER JOIN dbo.season_memberships AS sm
        ON sm.member_id = m.id

      INNER JOIN dbo.seasons AS s
        ON s.id = sm.season_id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE u.username = @username
        AND u.is_active = 1
        AND sm.status = 'ACTIVE'
        AND s.status = 'ACTIVE'

      ORDER BY sm.id DESC;
    `);

  return result.recordset[0] || null;
}

async function findGroupScoreHistory(groupId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "groupId",
      sql.Int,
      groupId
    )
    .query(`
      SELECT
        gst.id,
        gst.group_id,
        gst.points,
        gst.source_type,
        gst.source_id,
        gst.description,
        gst.status,
        gst.created_by_user_id,
        gst.created_at,

        creator.username
          AS created_by_username

      FROM dbo.group_score_transactions AS gst

      LEFT JOIN dbo.users AS creator
        ON creator.id =
           gst.created_by_user_id

      WHERE gst.group_id = @groupId
        AND gst.status = 'ACTIVE'

      ORDER BY
        gst.created_at DESC,
        gst.id DESC;
    `);

  return result.recordset;
}





async function createGroupScoreTransaction({
  groupId,
  points,
  sourceType,
  sourceId,
  description,
  createdByUserId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "groupId",
      sql.Int,
      groupId
    )
    .input(
      "points",
      sql.Int,
      points
    )
    .input(
      "sourceType",
      sql.NVarChar(50),
      sourceType
    )
    .input(
      "sourceId",
      sql.Int,
      sourceId
    )
    .input(
      "description",
      sql.NVarChar(500),
      description
    )
    .input(
      "createdByUserId",
      sql.Int,
      createdByUserId
    )
    .query(`
      INSERT INTO dbo.group_score_transactions
      (
        group_id,
        points,
        source_type,
        source_id,
        description,
        status,
        created_by_user_id,
        created_at
      )
      OUTPUT
        INSERTED.id,
        INSERTED.group_id,
        INSERTED.points,
        INSERTED.source_type,
        INSERTED.source_id,
        INSERTED.description,
        INSERTED.status,
        INSERTED.created_by_user_id,
        INSERTED.created_at
      VALUES
      (
        @groupId,
        @points,
        @sourceType,
        @sourceId,
        @description,
        'ACTIVE',
        @createdByUserId,
        SYSUTCDATETIME()
      );
    `);

  return result.recordset[0] || null;
}


async function createScoreTransaction({
  seasonMembershipId,
  scoreCategory,
  scoreType,
  requestedPoints,
  appliedPoints,
  sourceType,
  sourceId = null,
  sourceKey = null,
  description = null,
  createdByUserId = null,
  transaction = null,
}) {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getPool()).request();

  const result = await request
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .input(
      "scoreCategory",
      sql.VarChar(20),
      scoreCategory
    )
    .input(
      "scoreType",
      sql.VarChar(50),
      scoreType
    )
    .input(
      "requestedPoints",
      sql.Decimal(10, 2),
      requestedPoints
    )
    .input(
      "appliedPoints",
      sql.Decimal(10, 2),
      appliedPoints
    )
    .input(
      "sourceType",
      sql.VarChar(50),
      sourceType
    )
    .input(
      "sourceId",
      sql.Int,
      sourceId
    )
    .input(
      "sourceKey",
      sql.NVarChar(150),
      sourceKey
    )
    .input(
      "description",
      sql.NVarChar(500),
      description
    )
    .input(
      "createdByUserId",
      sql.Int,
      createdByUserId
    )
    .query(`
      INSERT INTO dbo.score_transactions
      (
        season_membership_id,
        score_category,
        score_type,
        requested_points,
        applied_points,
        source_type,
        source_id,
        source_key,
        description,
        status,
        created_by_user_id
      )

      OUTPUT
        INSERTED.id,

        INSERTED.season_membership_id
          AS seasonMembershipId,

        INSERTED.score_category
          AS scoreCategory,

        INSERTED.score_type
          AS scoreType,

        INSERTED.requested_points
          AS requestedPoints,

        INSERTED.applied_points
          AS appliedPoints,

        INSERTED.source_type
          AS sourceType,

        INSERTED.source_id
          AS sourceId,

        INSERTED.source_key
          AS sourceKey,

        INSERTED.description,
        INSERTED.status,

        INSERTED.created_by_user_id
          AS createdByUserId,

        INSERTED.created_at
          AS createdAt

      VALUES
      (
        @seasonMembershipId,
        @scoreCategory,
        @scoreType,
        @requestedPoints,
        @appliedPoints,
        @sourceType,
        @sourceId,
        @sourceKey,
        @description,
        'ACTIVE',
        @createdByUserId
      );
    `);

  return result.recordset[0] || null;
}

async function findScoreTransactionsBySeasonMembershipId(
  seasonMembershipId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT
        st.id,

        st.season_membership_id
          AS seasonMembershipId,

        st.score_category
          AS scoreCategory,

        st.score_type
          AS scoreType,

        st.requested_points
          AS requestedPoints,

        st.applied_points
          AS appliedPoints,

        st.source_type
          AS sourceType,

        st.source_id
          AS sourceId,

        st.source_key
          AS sourceKey,

        st.description,
        st.status,

        st.created_by_user_id
          AS createdByUserId,

        st.created_at
          AS createdAt,

        st.reversed_by_user_id
          AS reversedByUserId,

        st.reversed_at
          AS reversedAt,

        st.reversal_reason
          AS reversalReason

      FROM dbo.score_transactions AS st

      WHERE st.season_membership_id =
            @seasonMembershipId

      ORDER BY
        st.created_at ASC,
        st.id ASC;
    `);

  return result.recordset;
}


async function findAllActiveGroupScoreBases() {
  const pool = await getPool();

  const result = await pool
    .request()
    .query(`
      SELECT
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name,

        COALESCE(
          direct_group_scores.group_points,
          0
        ) AS group_points

      FROM dbo.groups AS g

      INNER JOIN dbo.seasons AS s
        ON s.id = g.season_id
        AND s.status = 'ACTIVE'

      OUTER APPLY
      (
        SELECT
          SUM(gst.points) AS group_points

        FROM dbo.group_score_transactions AS gst

        WHERE gst.group_id = g.id
          AND gst.status = 'ACTIVE'
      ) AS direct_group_scores

      ORDER BY
        g.name ASC;
    `);

  return result.recordset;
}


async function findActiveGroupMemberScoreTransactions() {
  const pool = await getPool();

  const result = await pool
    .request()
    .query(`
      SELECT
        g.id AS groupId,

        sm.id AS seasonMembershipId,

        st.id,

        st.score_category
          AS scoreCategory,

        st.score_type
          AS scoreType,

        st.requested_points
          AS requestedPoints,

        st.applied_points
          AS appliedPoints,

        st.source_type
          AS sourceType,

        st.source_id
          AS sourceId,

        st.source_key
          AS sourceKey,

        st.description,
        st.status,

        st.created_by_user_id
          AS createdByUserId,

        st.created_at
          AS createdAt,

        st.reversed_by_user_id
          AS reversedByUserId,

        st.reversed_at
          AS reversedAt,

        st.reversal_reason
          AS reversalReason

      FROM dbo.groups AS g

      INNER JOIN dbo.seasons AS s
        ON s.id = g.season_id
        AND s.status = 'ACTIVE'

      INNER JOIN dbo.season_memberships AS sm
        ON sm.group_id = g.id
        AND sm.season_id = s.id
        AND sm.status = 'ACTIVE'

      LEFT JOIN dbo.score_transactions AS st
        ON st.season_membership_id = sm.id

      ORDER BY
        g.id ASC,
        sm.id ASC,
        st.created_at ASC,
        st.id ASC;
    `);

  return result.recordset;
}


async function findActiveGroupById(
  groupId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "groupId",
      sql.Int,
      groupId
    )
    .query(`
      SELECT TOP (1)
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name

      FROM dbo.groups AS g

      INNER JOIN dbo.seasons AS s
        ON s.id = g.season_id
        AND s.status = 'ACTIVE'

      WHERE g.id = @groupId;
    `);

  return result.recordset[0] || null;
}


module.exports = {
  findActiveMembershipByMemberId,
  findActiveMembershipByUsername,
  findActiveGroupById,
  findGroupScoreHistory,
  createGroupScoreTransaction,
  createScoreTransaction,
  findScoreTransactionsBySeasonMembershipId,
  findAllActiveGroupScoreBases,
  findActiveGroupMemberScoreTransactions,
};
