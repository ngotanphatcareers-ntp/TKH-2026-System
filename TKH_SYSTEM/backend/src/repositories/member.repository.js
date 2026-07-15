const { getPool, sql } = require("../config/database");

async function findMembersBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
          sm.id                    AS season_membership_id,
          sm.status                AS membership_status,
          sm.joined_at,

          m.id                     AS member_id,
          m.tkh_code,
          m.full_name,
          m.phone,
          m.email,
          m.avatar_filename,
          m.status                 AS member_status,

          g.id                     AS group_id,
          g.code                   AS group_code,
          g.name                   AS group_name,

          u.id                     AS user_id,
          u.username,
          u.role,
          u.is_active,
          u.must_change_password

      FROM season_memberships sm

      INNER JOIN members m
          ON sm.member_id = m.id

      LEFT JOIN groups g
          ON sm.group_id = g.id

      LEFT JOIN users u
          ON u.member_id = m.id

      WHERE sm.season_id = @seasonId

      ORDER BY
          g.display_order,
          m.full_name
    `);

  return result.recordset;
}

module.exports = {
  findMembersBySeasonId,
};