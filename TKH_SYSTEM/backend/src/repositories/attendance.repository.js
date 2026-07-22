const { getPool, sql } = require("../config/database");

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


async function findActiveMembershipByMemberId(memberId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("memberId", sql.Int, memberId)
    .query(`
      SELECT TOP 1
        sm.id,
        sm.season_id,
        sm.member_id,
        sm.group_id,
        sm.status
      FROM dbo.season_memberships AS sm
      INNER JOIN dbo.seasons AS s
        ON s.id = sm.season_id
      WHERE sm.member_id = @memberId
        AND sm.status = 'ACTIVE'
        AND s.status = 'ACTIVE'
      ORDER BY sm.id DESC;
    `);

  return result.recordset[0] || null;
}


async function findAttendanceRecord(
  sessionId,
  seasonMembershipId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("sessionId", sql.Int, sessionId)
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT TOP 1
        ar.id,
        ar.session_id,
        ar.season_membership_id,
        ar.checked_in_at,
        ar.method,
        ar.status,
        ar.latitude,
        ar.longitude,
        ar.accuracy_m,
        ar.distance_m,
        ar.device_info,
        ar.note
      FROM dbo.attendance_records AS ar
      WHERE ar.session_id = @sessionId
        AND ar.season_membership_id =
            @seasonMembershipId;
    `);

  return result.recordset[0] || null;
}


async function createAttendanceRecord({
  sessionId,
  seasonMembershipId,
  latitude,
  longitude,
  accuracyM,
  distanceM,
  deviceInfo,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("sessionId", sql.Int, sessionId)
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .input(
      "latitude",
      sql.Decimal(10, 7),
      latitude
    )
    .input(
      "longitude",
      sql.Decimal(10, 7),
      longitude
    )
    .input(
      "accuracyM",
      sql.Decimal(10, 2),
      accuracyM
    )
    .input(
      "distanceM",
      sql.Decimal(10, 2),
      distanceM
    )
    .input(
      "deviceInfo",
      sql.NVarChar(1000),
      deviceInfo || null
    )
    .query(`
      INSERT INTO dbo.attendance_records
      (
        session_id,
        season_membership_id,
        method,
        status,
        latitude,
        longitude,
        accuracy_m,
        distance_m,
        device_info
      )
      OUTPUT
        INSERTED.id,
        INSERTED.session_id,
        INSERTED.season_membership_id,
        INSERTED.checked_in_at,
        INSERTED.method,
        INSERTED.status,
        INSERTED.latitude,
        INSERTED.longitude,
        INSERTED.accuracy_m,
        INSERTED.distance_m,
        INSERTED.device_info,
        INSERTED.note
      VALUES
      (
        @sessionId,
        @seasonMembershipId,
        'GPS',
        'PRESENT',
        @latitude,
        @longitude,
        @accuracyM,
        @distanceM,
        @deviceInfo
      );
    `);

  return result.recordset[0];
}


async function findAttendanceHistoryByMemberId(memberId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("memberId", sql.Int, memberId)
    .query(`
      SELECT
        ar.id,
        ar.session_id,
        ar.season_membership_id,
        ar.checked_in_at,
        ar.method,
        ar.status,
        ar.latitude,
        ar.longitude,
        ar.accuracy_m,
        ar.distance_m,
        ar.device_info,
        ar.note,

        se.name AS session_name,
        se.session_no,
        se.scheduled_start_at,
        se.scheduled_end_at,

        s.id AS season_id,
        s.code AS season_code,
        s.name AS season_name,

        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name

      FROM dbo.attendance_records AS ar

      INNER JOIN dbo.season_memberships AS sm
        ON sm.id = ar.season_membership_id

      INNER JOIN dbo.sessions AS se
        ON se.id = ar.session_id

      INNER JOIN dbo.seasons AS s
        ON s.id = se.season_id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      WHERE sm.member_id = @memberId

      ORDER BY
        ar.checked_in_at DESC,
        ar.id DESC;
    `);

  return result.recordset;
}


async function findCurrentSessionAttendanceRoster() {
  const pool = await getPool();

  const result = await pool.request().query(`
    DECLARE @CurrentSessionId INT;

    SELECT TOP 1
      @CurrentSessionId = se.id
    FROM dbo.sessions AS se
    INNER JOIN dbo.seasons AS s
      ON s.id = se.season_id
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

    SELECT
      sm.id AS season_membership_id,
      sm.season_id,
      sm.member_id,
      sm.group_id,
      sm.status AS membership_status,

      m.tkh_code,
      m.full_name,
      m.phone,
      m.status AS member_status,

      g.code AS group_code,
      g.name AS group_name,

      se.id AS session_id,
      se.name AS session_name,
      se.session_no,
      se.scheduled_start_at,
      se.scheduled_end_at,
      se.status AS session_status,

      ar.id AS attendance_record_id,
      ar.checked_in_at,
      ar.method,
      ar.status AS attendance_status,
      ar.latitude,
      ar.longitude,
      ar.accuracy_m,
      ar.distance_m,
      ar.device_info,
      ar.note

    FROM dbo.season_memberships AS sm

    INNER JOIN dbo.seasons AS s
      ON s.id = sm.season_id

    INNER JOIN dbo.members AS m
      ON m.id = sm.member_id

    LEFT JOIN dbo.groups AS g
      ON g.id = sm.group_id

    LEFT JOIN dbo.sessions AS se
      ON se.id = @CurrentSessionId

    LEFT JOIN dbo.attendance_records AS ar
      ON ar.session_id = @CurrentSessionId
     AND ar.season_membership_id = sm.id

    WHERE s.status = 'ACTIVE'
      AND sm.status = 'ACTIVE'
      AND m.status = 'ACTIVE'

    ORDER BY
      g.name ASC,
      m.full_name ASC,
      m.id ASC;
  `);

  return result.recordset;
}



module.exports = {
  findCurrentOpenSession,
  findActiveMembershipByMemberId,
  findAttendanceRecord,
  createAttendanceRecord,
  findAttendanceHistoryByMemberId,
  findCurrentSessionAttendanceRoster,
};