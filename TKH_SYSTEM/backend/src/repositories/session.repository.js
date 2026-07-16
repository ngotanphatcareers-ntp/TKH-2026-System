const { getPool, sql } = require("../config/database");

async function findSessionsBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
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
        se.attendance_radius_m,
        se.created_at,
        se.updated_at
      FROM dbo.sessions AS se
      WHERE se.season_id = @seasonId
      ORDER BY
        se.session_no ASC,
        se.scheduled_start_at ASC,
        se.id ASC;
    `);

  return result.recordset;
}

async function findSessionById(sessionId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("sessionId", sql.Int, sessionId)
    .query(`
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
        se.attendance_radius_m,
        se.created_at,
        se.updated_at
      FROM dbo.sessions AS se
      WHERE se.id = @sessionId;
    `);

  return result.recordset[0] || null;
}


async function createSession({
  seasonId,
  name,
  sessionNo,
  scheduledStartAt,
  scheduledEndAt,
  checkinOpenAt,
  checkinCloseAt,
  locationName,
  latitude,
  longitude,
  attendanceRadiusM,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input("name", sql.NVarChar(150), name)
    .input("sessionNo", sql.Int, sessionNo)
    .input(
      "scheduledStartAt",
      sql.DateTime2,
      scheduledStartAt || null
    )
    .input(
      "scheduledEndAt",
      sql.DateTime2,
      scheduledEndAt || null
    )
    .input(
      "checkinOpenAt",
      sql.DateTime2,
      checkinOpenAt || null
    )
    .input(
      "checkinCloseAt",
      sql.DateTime2,
      checkinCloseAt || null
    )
    .input(
      "locationName",
      sql.NVarChar(255),
      locationName || null
    )
    .input(
      "latitude",
      sql.Decimal(10, 7),
      latitude ?? null
    )
    .input(
      "longitude",
      sql.Decimal(10, 7),
      longitude ?? null
    )
    .input(
      "attendanceRadiusM",
      sql.Int,
      attendanceRadiusM || null
    )
    .query(`
      INSERT INTO dbo.sessions
      (
        season_id,
        name,
        session_no,
        scheduled_start_at,
        scheduled_end_at,
        checkin_open_at,
        checkin_close_at,
        status,
        location_name,
        latitude,
        longitude,
        attendance_radius_m
      )
      OUTPUT
        INSERTED.id,
        INSERTED.season_id,
        INSERTED.name,
        INSERTED.session_no,
        INSERTED.scheduled_start_at,
        INSERTED.scheduled_end_at,
        INSERTED.checkin_open_at,
        INSERTED.checkin_close_at,
        INSERTED.status,
        INSERTED.location_name,
        INSERTED.latitude,
        INSERTED.longitude,
        INSERTED.attendance_radius_m,
        INSERTED.created_at,
        INSERTED.updated_at
      VALUES
      (
        @seasonId,
        @name,
        @sessionNo,
        @scheduledStartAt,
        @scheduledEndAt,
        @checkinOpenAt,
        @checkinCloseAt,
        'DRAFT',
        @locationName,
        @latitude,
        @longitude,
        @attendanceRadiusM
      );
    `);

  return result.recordset[0];
}


async function openSession(sessionId) {
  const pool = await getPool();

  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const selectedSessionResult = await new sql.Request(transaction)
      .input("sessionId", sql.Int, sessionId)
      .query(`
        SELECT TOP 1
          id,
          season_id,
          status
        FROM dbo.sessions
        WHERE id = @sessionId;
      `);

    const selectedSession =
      selectedSessionResult.recordset[0] || null;

    if (!selectedSession) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input("seasonId", sql.Int, selectedSession.season_id)
      .input("sessionId", sql.Int, sessionId)
      .query(`
        UPDATE dbo.sessions
        SET
          status = 'CLOSED',
          checkin_close_at = COALESCE(
            checkin_close_at,
            SYSDATETIME()
          ),
          updated_at = SYSDATETIME()
        WHERE season_id = @seasonId
          AND id <> @sessionId
          AND status = 'OPEN';
      `);

    const openedSessionResult =
      await new sql.Request(transaction)
        .input("sessionId", sql.Int, sessionId)
        .query(`
          UPDATE dbo.sessions
          SET
            status = 'OPEN',
            checkin_open_at = SYSDATETIME(),
            checkin_close_at = NULL,
            updated_at = SYSDATETIME()
          OUTPUT
            INSERTED.id,
            INSERTED.season_id,
            INSERTED.name,
            INSERTED.session_no,
            INSERTED.scheduled_start_at,
            INSERTED.scheduled_end_at,
            INSERTED.checkin_open_at,
            INSERTED.checkin_close_at,
            INSERTED.status,
            INSERTED.location_name,
            INSERTED.latitude,
            INSERTED.longitude,
            INSERTED.attendance_radius_m,
            INSERTED.created_at,
            INSERTED.updated_at
          WHERE id = @sessionId;
        `);

    await transaction.commit();

    return openedSessionResult.recordset[0] || null;
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback();
    }

    throw error;
  }
}


async function closeSession(sessionId) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input("sessionId", sql.Int, sessionId)
        .query(`
            UPDATE dbo.sessions
            SET
                status = 'CLOSED',
                checkin_close_at = SYSDATETIME(),
                updated_at = SYSDATETIME()

            OUTPUT
                INSERTED.id,
                INSERTED.season_id,
                INSERTED.name,
                INSERTED.session_no,
                INSERTED.scheduled_start_at,
                INSERTED.scheduled_end_at,
                INSERTED.checkin_open_at,
                INSERTED.checkin_close_at,
                INSERTED.status,
                INSERTED.location_name,
                INSERTED.latitude,
                INSERTED.longitude,
                INSERTED.attendance_radius_m,
                INSERTED.created_at,
                INSERTED.updated_at

            WHERE id = @sessionId;
        `);

    return result.recordset[0] || null;
}


module.exports = {
    findSessionsBySeasonId,
    findSessionById,
    createSession,
    openSession,
    closeSession
};