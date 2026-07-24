const {
  getPool,
  sql,
} = require("../config/database");


const ENCOURAGEMENT_SELECT = `
  SELECT
    e.id,
    e.season_id,
    e.sender_season_membership_id,
    e.recipient_season_membership_id,
    e.message,
    e.is_anonymous,
    e.status,
    e.is_read,
    e.read_at,
    e.is_pinned,
    e.created_at,
    e.updated_at,
    e.sent_date,

    sender_member.id AS sender_member_id,
    sender_member.tkh_code AS sender_tkh_code,
    sender_member.full_name AS sender_full_name,
    sender_member.avatar_filename
      AS sender_avatar_filename,

    sender_user.username AS sender_username,

    sender_group.id AS sender_group_id,
    sender_group.code AS sender_group_code,
    sender_group.name AS sender_group_name,

    recipient_member.id AS recipient_member_id,
    recipient_member.tkh_code AS recipient_tkh_code,
    recipient_member.full_name AS recipient_full_name,
    recipient_member.avatar_filename
      AS recipient_avatar_filename,

    recipient_user.username AS recipient_username,

    recipient_group.id AS recipient_group_id,
    recipient_group.code AS recipient_group_code,
    recipient_group.name AS recipient_group_name

  FROM dbo.encouragements AS e

  LEFT JOIN dbo.season_memberships AS sender_sm
    ON sender_sm.id =
      e.sender_season_membership_id

  LEFT JOIN dbo.members AS sender_member
    ON sender_member.id = sender_sm.member_id

  LEFT JOIN dbo.users AS sender_user
    ON sender_user.member_id = sender_member.id

  LEFT JOIN dbo.groups AS sender_group
    ON sender_group.id = sender_sm.group_id

  INNER JOIN dbo.season_memberships AS recipient_sm
    ON recipient_sm.id =
      e.recipient_season_membership_id

  INNER JOIN dbo.members AS recipient_member
    ON recipient_member.id =
      recipient_sm.member_id

  LEFT JOIN dbo.users AS recipient_user
    ON recipient_user.member_id =
      recipient_member.id

  LEFT JOIN dbo.groups AS recipient_group
    ON recipient_group.id =
      recipient_sm.group_id
`;


/*
=====================================================
1. Find recipient membership by username
=====================================================
*/

async function findActiveRecipientByUsername({
  seasonId,
  username,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "username",
      sql.VarChar(100),
      username
    )
    .query(`
      SELECT
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,
        sm.status AS membership_status,

        m.tkh_code,
        m.full_name,
        m.avatar_filename,
        m.status AS member_status,

        u.id AS user_id,
        u.username,
        u.role,
        u.is_active AS user_is_active,

        g.code AS group_code,
        g.name AS group_name

      FROM dbo.users AS u

      INNER JOIN dbo.members AS m
        ON m.id = u.member_id

      INNER JOIN dbo.season_memberships AS sm
        ON sm.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE sm.season_id = @seasonId
        AND sm.status = 'ACTIVE'
        AND m.status = 'ACTIVE'
        AND u.is_active = 1
        AND u.role = 'STUDENT'
        AND u.username = @username;
    `);

  return result.recordset[0] || null;
}



/*
=====================================================
2. Find active encouragement recipients
=====================================================
*/

async function findActiveRecipients({
  seasonId,
  excludeSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonId",
      sql.Int,
      seasonId
    )
    .input(
      "excludeSeasonMembershipId",
      sql.Int,
      excludeSeasonMembershipId
    )
    .query(`
      SELECT
        sm.id AS season_membership_id,
        sm.season_id,
        sm.member_id,
        sm.group_id,

        m.tkh_code,
        m.full_name,
        m.avatar_filename,

        u.id AS user_id,
        u.username,

                g.code AS group_code,
                g.name AS group_name,

                (
                SELECT COUNT(*)
                FROM dbo.encouragements AS received_e
                WHERE received_e.season_id =
                    sm.season_id
                    AND received_e.recipient_season_membership_id =
                    sm.id
                    AND received_e.status = 'VISIBLE'
                ) AS received_count

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      INNER JOIN dbo.users AS u
        ON u.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE sm.season_id = @seasonId
        AND sm.status = 'ACTIVE'
        AND m.status = 'ACTIVE'
        AND u.is_active = 1
        AND u.role = 'STUDENT'
        AND sm.id <> @excludeSeasonMembershipId

      ORDER BY
        m.full_name ASC,
        u.username ASC;
    `);

  return result.recordset;
}




/*
=====================================================
2. Find encouragement by ID
=====================================================
*/

async function findEncouragementById(
  encouragementId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "encouragementId",
      sql.Int,
      encouragementId
    )
    .query(`
      ${ENCOURAGEMENT_SELECT}

      WHERE e.id = @encouragementId;
    `);

  return result.recordset[0] || null;
}


/*
=====================================================
3. Check daily sending limit
=====================================================
*/

async function findTodayEncouragement({
  seasonId,
  senderSeasonMembershipId,
  recipientSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "senderSeasonMembershipId",
      sql.Int,
      senderSeasonMembershipId
    )
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .query(`
      SELECT TOP (1)
        id,
        created_at,
        sent_date
      FROM dbo.encouragements
      WHERE season_id = @seasonId
        AND sender_season_membership_id =
          @senderSeasonMembershipId
        AND recipient_season_membership_id =
          @recipientSeasonMembershipId
        AND sent_date =
          CONVERT(
  DATE,
  DATEADD(HOUR, 7, SYSUTCDATETIME())
)
      ORDER BY id DESC;
    `);

  return result.recordset[0] || null;
}


/*
=====================================================
4. Create encouragement
=====================================================
*/

async function createEncouragement({
  seasonId,
  senderSeasonMembershipId,
  recipientSeasonMembershipId,
  message,
  isAnonymous,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "senderSeasonMembershipId",
      sql.Int,
      senderSeasonMembershipId
    )
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .input(
      "message",
      sql.NVarChar(1000),
      message
    )
    .input(
      "isAnonymous",
      sql.Bit,
      isAnonymous
    )
    .query(`
      INSERT INTO dbo.encouragements
      (
        season_id,
        sender_season_membership_id,
        recipient_season_membership_id,
        message,
        is_anonymous,
        status,
        is_read,
        is_pinned
      )
      OUTPUT INSERTED.id
      VALUES
      (
        @seasonId,
        @senderSeasonMembershipId,
        @recipientSeasonMembershipId,
        @message,
        @isAnonymous,
        'VISIBLE',
        0,
        0
      );
    `);

  const createdId =
    result.recordset[0]?.id;

  return findEncouragementById(createdId);
}


/*
=====================================================
5. Get recipient inbox
=====================================================
*/

async function findInboxByMembershipId({
  seasonId,
  recipientSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .query(`
      ${ENCOURAGEMENT_SELECT}

      WHERE e.season_id = @seasonId
        AND e.recipient_season_membership_id =
          @recipientSeasonMembershipId
        AND e.status = 'VISIBLE'

      ORDER BY
        e.is_pinned DESC,
        e.created_at DESC,
        e.id DESC;
    `);

  return result.recordset;
}


/*
=====================================================
6. Get inbox summary
=====================================================
*/

async function getInboxSummary({
  seasonId,
  recipientSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .query(`
      SELECT
        COUNT(*) AS total_received,

        SUM(
          CASE
            WHEN is_read = 0 THEN 1
            ELSE 0
          END
        ) AS unread_count,

        SUM(
          CASE
            WHEN is_pinned = 1 THEN 1
            ELSE 0
          END
        ) AS pinned_count,

        SUM(
          CASE
            WHEN sent_date =
              CONVERT(
  DATE,
  DATEADD(HOUR, 7, SYSUTCDATETIME())
)
            THEN 1
            ELSE 0
          END
        ) AS received_today

      FROM dbo.encouragements
      WHERE season_id = @seasonId
        AND recipient_season_membership_id =
          @recipientSeasonMembershipId
        AND status = 'VISIBLE';
    `);

  return (
    result.recordset[0] || {
      total_received: 0,
      unread_count: 0,
      pinned_count: 0,
      received_today: 0,
    }
  );
}


/*
=====================================================
7. Mark inbox as read
=====================================================
*/

async function markInboxAsRead({
  seasonId,
  recipientSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .query(`
      UPDATE dbo.encouragements
      SET
        is_read = 1,
        read_at = COALESCE(
          read_at,
          SYSUTCDATETIME()
        ),
        updated_at = SYSUTCDATETIME()
      WHERE season_id = @seasonId
        AND recipient_season_membership_id =
          @recipientSeasonMembershipId
        AND status = 'VISIBLE'
        AND is_read = 0;

      SELECT
        @@ROWCOUNT AS affected_rows;
    `);

  return (
    Number(
      result.recordset[0]?.affected_rows
    ) || 0
  );
}


/*
=====================================================
8. Toggle pin
=====================================================
*/

async function toggleEncouragementPin({
  encouragementId,
  recipientSeasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "encouragementId",
      sql.Int,
      encouragementId
    )
    .input(
      "recipientSeasonMembershipId",
      sql.Int,
      recipientSeasonMembershipId
    )
    .query(`
      UPDATE dbo.encouragements
      SET
        is_pinned =
          CASE
            WHEN is_pinned = 1 THEN 0
            ELSE 1
          END,
        updated_at = SYSUTCDATETIME()
      WHERE id = @encouragementId
        AND recipient_season_membership_id =
          @recipientSeasonMembershipId
        AND status = 'VISIBLE';

      SELECT
        @@ROWCOUNT AS affected_rows;
    `);

  const affectedRows =
    Number(
      result.recordset[0]?.affected_rows
    ) || 0;

  if (affectedRows === 0) {
    return null;
  }

  return findEncouragementById(
    encouragementId
  );
}


/*
=====================================================
9. Admin summary statistics
=====================================================
*/

async function getAdminEncouragementSummary(
  seasonId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
        COUNT(*) AS total_count,

        SUM(
          CASE
            WHEN sent_date =
              CONVERT(
  DATE,
  DATEADD(HOUR, 7, SYSUTCDATETIME())
)
            THEN 1
            ELSE 0
          END
        ) AS today_count,

        SUM(
          CASE
            WHEN is_anonymous = 1
            THEN 1
            ELSE 0
          END
        ) AS anonymous_count,

        SUM(
          CASE
            WHEN is_read = 0
              AND status = 'VISIBLE'
            THEN 1
            ELSE 0
          END
        ) AS unread_count,

        SUM(
          CASE
            WHEN status = 'VISIBLE'
            THEN 1
            ELSE 0
          END
        ) AS visible_count,

        SUM(
          CASE
            WHEN status = 'HIDDEN'
            THEN 1
            ELSE 0
          END
        ) AS hidden_count,

        SUM(
          CASE
            WHEN status = 'REPORTED'
            THEN 1
            ELSE 0
          END
        ) AS reported_count

      FROM dbo.encouragements
      WHERE season_id = @seasonId
        AND status <> 'DELETED';
    `);

  return result.recordset[0] || null;
}


/*
=====================================================
10. Admin top senders
=====================================================
*/

async function findTopSenders({
  seasonId,
  limit = 5,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("limit", sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        sm.id AS season_membership_id,
        m.id AS member_id,
        m.tkh_code,
        m.full_name,
        m.avatar_filename,
        u.username,
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name,
        COUNT(*) AS encouragement_count

      FROM dbo.encouragements AS e

      INNER JOIN dbo.season_memberships AS sm
        ON sm.id =
          e.sender_season_membership_id

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      LEFT JOIN dbo.users AS u
        ON u.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE e.season_id = @seasonId
        AND e.status <> 'DELETED'
        AND e.sender_season_membership_id
          IS NOT NULL

      GROUP BY
        sm.id,
        m.id,
        m.tkh_code,
        m.full_name,
        m.avatar_filename,
        u.username,
        g.id,
        g.code,
        g.name

      ORDER BY
        encouragement_count DESC,
        m.full_name ASC;
    `);

  return result.recordset;
}


/*
=====================================================
11. Admin top recipients
=====================================================
*/

async function findTopRecipients({
  seasonId,
  limit = 5,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("limit", sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        sm.id AS season_membership_id,
        m.id AS member_id,
        m.tkh_code,
        m.full_name,
        m.avatar_filename,
        u.username,
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name,
        COUNT(*) AS encouragement_count

      FROM dbo.encouragements AS e

      INNER JOIN dbo.season_memberships AS sm
        ON sm.id =
          e.recipient_season_membership_id

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      LEFT JOIN dbo.users AS u
        ON u.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE e.season_id = @seasonId
        AND e.status <> 'DELETED'

      GROUP BY
        sm.id,
        m.id,
        m.tkh_code,
        m.full_name,
        m.avatar_filename,
        u.username,
        g.id,
        g.code,
        g.name

      ORDER BY
        encouragement_count DESC,
        m.full_name ASC;
    `);

  return result.recordset;
}


/*
=====================================================
12. Admin review list
=====================================================
*/

async function findEncouragementsBySeasonId(
  seasonId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      ${ENCOURAGEMENT_SELECT}

      WHERE e.season_id = @seasonId
        AND e.status <> 'DELETED'

      ORDER BY
        e.created_at DESC,
        e.id DESC;
    `);

  return result.recordset;
}


module.exports = {
  findActiveRecipientByUsername,
  findActiveRecipients,
  findEncouragementById,
  findTodayEncouragement,
  createEncouragement,
  findInboxByMembershipId,
  getInboxSummary,
  markInboxAsRead,
  toggleEncouragementPin,
  getAdminEncouragementSummary,
  findTopSenders,
  findTopRecipients,
  findEncouragementsBySeasonId,
};