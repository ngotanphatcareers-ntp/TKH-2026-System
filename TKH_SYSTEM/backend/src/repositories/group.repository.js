const { getPool, sql } = require("../config/database");

async function findGroupsBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
        id,
        season_id,
        code,
        name,
        logo_path,
        display_order,
        is_active
      FROM dbo.groups
      WHERE season_id = @seasonId
        AND is_active = 1
      ORDER BY display_order ASC, id ASC;
    `);

  return result.recordset;
}

module.exports = {
  findGroupsBySeasonId,
};