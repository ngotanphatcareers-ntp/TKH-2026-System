const { getPool, sql } = require("../config/database");

async function findActiveSeason() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT TOP 1
      s.id,
      s.code,
      s.name,
      s.start_date,
      s.end_date,
      s.status,
      ss.ranking_visible,
      ss.attendance_radius_m
    FROM dbo.seasons AS s
    LEFT JOIN dbo.season_settings AS ss
      ON ss.season_id = s.id
    WHERE s.status = 'ACTIVE'
    ORDER BY s.start_date DESC, s.id DESC;
  `);

  return result.recordset[0] || null;
}

async function findSeasonById(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT TOP 1
        s.id,
        s.code,
        s.name,
        s.start_date,
        s.end_date,
        s.status,
        ss.ranking_visible,
        ss.attendance_radius_m
      FROM dbo.seasons AS s
      LEFT JOIN dbo.season_settings AS ss
        ON ss.season_id = s.id
      WHERE s.id = @seasonId;
    `);

  return result.recordset[0] || null;
}

module.exports = {
  findActiveSeason,
  findSeasonById,
};