const { getPool } = require("../config/database");

async function findCurrentOpenSession() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT TOP 1
      se.id,
      se.season_id,
      se.name,
      se.session_no,
      se.scheduled_start_at,
      se.scheduled_end_at,
      se.checkin_open_at,
      se.checkin_close_at,
      se.status,
      se.location_name,
      se.latitude,
      se.longitude,

      COALESCE(
        se.attendance_radius_m,
        ss.attendance_radius_m
      ) AS attendance_radius_m,

      s.code AS season_code,
      s.name AS season_name

    FROM dbo.sessions AS se

    INNER JOIN dbo.seasons AS s
      ON s.id = se.season_id

    LEFT JOIN dbo.season_settings AS ss
      ON ss.season_id = se.season_id

    WHERE s.status = 'ACTIVE'
      AND se.status = 'OPEN'
      AND (
        se.checkin_open_at IS NULL
        OR SYSDATETIME() >= se.checkin_open_at
      )
      AND (
        se.checkin_close_at IS NULL
        OR SYSDATETIME() <= se.checkin_close_at
      )

    ORDER BY
      se.scheduled_start_at DESC,
      se.id DESC;
  `);

  return result.recordset[0] || null;
}

module.exports = {
  findCurrentOpenSession,
};