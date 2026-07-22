const { getPool, sql } = require("../config/database");

async function findGroupsBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order,
        g.is_active,
        COUNT(sm.id) AS member_count
      FROM dbo.groups AS g
      LEFT JOIN dbo.season_memberships AS sm
        ON sm.group_id = g.id
      WHERE g.season_id = @seasonId
        AND g.is_active = 1
      GROUP BY
        g.id,
        g.season_id,
        g.code,
        g.name,
        g.logo_path,
        g.display_order,
        g.is_active
      ORDER BY
        g.display_order ASC,
        g.id ASC;
    `);

  return result.recordset;
}

module.exports = {
  findGroupsBySeasonId,
};