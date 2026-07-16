const {
  findCurrentOpenSession,
} = require("../repositories/attendance.repository");

function mapCurrentSession(session) {
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    seasonId: session.season_id,
    name: session.name,
    sessionNo: session.session_no,
    scheduledStartAt: session.scheduled_start_at,
    scheduledEndAt: session.scheduled_end_at,
    checkinOpenAt: session.checkin_open_at,
    checkinCloseAt: session.checkin_close_at,
    status: session.status,
    location: {
      name: session.location_name,
      latitude:
        session.latitude !== null
          ? Number(session.latitude)
          : null,
      longitude:
        session.longitude !== null
          ? Number(session.longitude)
          : null,
    },
    attendanceRadiusM: session.attendance_radius_m,
    season: {
      code: session.season_code,
      name: session.season_name,
    },
  };
}

async function getCurrentOpenSession() {
  const session = await findCurrentOpenSession();

  return mapCurrentSession(session);
}

module.exports = {
  getCurrentOpenSession,
};