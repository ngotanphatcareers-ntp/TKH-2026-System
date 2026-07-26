const { getPool, sql } = require("../config/database");

const {
  findActiveMembershipByMemberId,
} = require("./membership.repository");


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
      se.active_attendance_window,

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


async function findAttendanceRecord(
  sessionId,
  seasonMembershipId,
  windowType
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
    .input(
      "windowType",
      sql.VarChar(20),
      windowType
    )
    .query(`
      SELECT TOP 1
        ar.id,
        ar.session_id,
        ar.season_membership_id,
        ar.window_type,
        ar.checked_in_at,
        ar.method,
        ar.status,
        ar.latitude,
        ar.longitude,
        ar.accuracy_m,
        ar.distance_m,
        ar.device_id,
        ar.device_info,
        ar.note
      FROM dbo.attendance_records AS ar
      WHERE ar.session_id = @sessionId
        AND ar.season_membership_id =
            @seasonMembershipId
        AND ar.window_type = @windowType;
    `);

  return result.recordset[0] || null;
}


async function findMorningOrBreakAttendanceRecord(
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
        ar.window_type,
        ar.checked_in_at,
        ar.method,
        ar.status,
        ar.latitude,
        ar.longitude,
        ar.accuracy_m,
        ar.distance_m,
        ar.device_id,
        ar.device_info,
        ar.note
      FROM dbo.attendance_records AS ar
      WHERE ar.session_id = @sessionId
        AND ar.season_membership_id =
            @seasonMembershipId
        AND ar.window_type IN (
          'MORNING',
          'BREAK'
        )
      ORDER BY
        ar.checked_in_at ASC,
        ar.id ASC;
    `);

  return result.recordset[0] || null;
}


async function createAttendanceRecord({
  sessionId,
  seasonMembershipId,
  windowType,
  latitude,
  longitude,
  accuracyM,
  distanceM,
  deviceId,
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
      "windowType",
      sql.VarChar(20),
      windowType
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
      "deviceId",
      sql.NVarChar(100),
      deviceId || null
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
        window_type,
        method,
        status,
        latitude,
        longitude,
        accuracy_m,
        distance_m,
        device_id,
        device_info
      )
      OUTPUT
        INSERTED.id,
        INSERTED.session_id,
        INSERTED.season_membership_id,
        INSERTED.window_type,
        INSERTED.checked_in_at,
        INSERTED.method,
        INSERTED.status,
        INSERTED.latitude,
        INSERTED.longitude,
        INSERTED.accuracy_m,
        INSERTED.distance_m,
        INSERTED.device_id,
        INSERTED.device_info,
        INSERTED.note
      VALUES
      (
        @sessionId,
        @seasonMembershipId,
        @windowType,
        'GPS',
        'PRESENT',
        @latitude,
        @longitude,
        @accuracyM,
        @distanceM,
        @deviceId,
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
        ar.window_type,
        ar.checked_in_at,
        ar.method,
        ar.status,
        ar.latitude,
        ar.longitude,
        ar.accuracy_m,
        ar.distance_m,
        ar.device_id,
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
        g.name AS group_name,

        attendance_score.attendance_points

      FROM dbo.attendance_records AS ar

      INNER JOIN dbo.season_memberships AS sm
        ON sm.id = ar.season_membership_id

      INNER JOIN dbo.sessions AS se
        ON se.id = ar.session_id

      INNER JOIN dbo.seasons AS s
        ON s.id = se.season_id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      OUTER APPLY
      (
        SELECT
          SUM(st.applied_points) AS attendance_points
        FROM dbo.score_transactions AS st
        WHERE st.season_membership_id = sm.id
          AND st.source_type = 'ATTENDANCE'
          AND st.source_id = ar.id
          AND st.status = 'ACTIVE'
      ) AS attendance_score

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
      se.active_attendance_window

    FROM dbo.sessions AS se
    WHERE se.id = @CurrentSessionId;


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
      g.name AS group_name

    FROM dbo.season_memberships AS sm

    INNER JOIN dbo.seasons AS s
      ON s.id = sm.season_id

    INNER JOIN dbo.members AS m
      ON m.id = sm.member_id

    LEFT JOIN dbo.groups AS g
      ON g.id = sm.group_id

    WHERE s.status = 'ACTIVE'
      AND sm.status = 'ACTIVE'
      AND m.status = 'ACTIVE'

    ORDER BY
      g.name ASC,
      m.full_name ASC,
      m.id ASC;


    SELECT
      ar.id AS attendance_record_id,
      ar.session_id,
      ar.season_membership_id,
      ar.window_type,
      ar.checked_in_at,
      ar.method,
      ar.status AS attendance_status,
      ar.latitude,
      ar.longitude,
      ar.accuracy_m,
      ar.distance_m,
      ar.device_id,
      ar.device_info,
      ar.note,

      attendance_score.attendance_points

    FROM dbo.attendance_records AS ar

    OUTER APPLY
    (
      SELECT
        SUM(st.applied_points) AS attendance_points
      FROM dbo.score_transactions AS st
      WHERE st.season_membership_id =
            ar.season_membership_id
        AND st.source_type = 'ATTENDANCE'
        AND st.source_id = ar.id
        AND st.status = 'ACTIVE'
    ) AS attendance_score

    WHERE ar.session_id = @CurrentSessionId

    ORDER BY
      ar.season_membership_id ASC,
      ar.checked_in_at ASC,
      ar.id ASC;
  `);

  return {
    session:
      result.recordsets[0]?.[0] || null,

    members:
      result.recordsets[1] || [],

    attendanceRecords:
      result.recordsets[2] || [],
  };
}


async function setCurrentSessionAttendanceWindow(
  sessionId,
  windowType
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("sessionId", sql.Int, sessionId)
    .input(
      "windowType",
      sql.VarChar(20),
      windowType
    )
    .query(`
      UPDATE dbo.sessions
      SET
        active_attendance_window = @windowType,
        updated_at = SYSDATETIME()
      OUTPUT
        INSERTED.id,
        INSERTED.season_id,
        INSERTED.name,
        INSERTED.session_no,
        INSERTED.status,
        INSERTED.active_attendance_window,
        INSERTED.updated_at
      WHERE id = @sessionId
        AND status = 'OPEN';
    `);

  return result.recordset[0] || null;
}


module.exports = {
  findCurrentOpenSession,
  findActiveMembershipByMemberId,
  findAttendanceRecord,
  findMorningOrBreakAttendanceRecord,
  createAttendanceRecord,
  findAttendanceHistoryByMemberId,
  findCurrentSessionAttendanceRoster,
  setCurrentSessionAttendanceWindow,
};