const {
  findSessionsBySeasonId,
  findSessionById,
  createSession,
  openSession,
  closeSession,
} = require("../repositories/session.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

function mapSession(session) {
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
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

async function getCurrentSeasonSessions() {
  const season = await findActiveSeason();

  if (!season) {
    return {
      season: null,
      sessions: [],
    };
  }

  const sessions = await findSessionsBySeasonId(season.id);

  return {
    season: {
      id: season.id,
      code: season.code,
      name: season.name,
    },
    sessions: sessions.map(mapSession),
  };
}

async function getSessionById(sessionId) {
  const session = await findSessionById(sessionId);

  return mapSession(session);
}


async function createCurrentSeasonSession(payload) {
  const season = await findActiveSeason();

  if (!season) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const createdSession = await createSession({
    seasonId: season.id,
    name: payload.name,
    sessionNo: payload.sessionNo,
    scheduledStartAt: payload.scheduledStartAt,
    scheduledEndAt: payload.scheduledEndAt,
    checkinOpenAt: payload.checkinOpenAt,
    checkinCloseAt: payload.checkinCloseAt,
    locationName: payload.locationName,
    latitude: payload.latitude,
    longitude: payload.longitude,
    attendanceRadiusM: payload.attendanceRadiusM,
  });

  return {
    success: true,
    session: mapSession(createdSession),
  };
}


async function openCurrentSeasonSession(sessionId) {
  const season = await findActiveSeason();

  if (!season) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const session = await findSessionById(sessionId);

  if (!session) {
    return {
      success: false,
      code: "SESSION_NOT_FOUND",
    };
  }

  if (Number(session.season_id) !== Number(season.id)) {
    return {
      success: false,
      code: "SESSION_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (session.status === "CANCELLED") {
    return {
      success: false,
      code: "CANCELLED_SESSION_CANNOT_OPEN",
    };
  }

  const openedSession = await openSession(sessionId);

  if (!openedSession) {
    return {
      success: false,
      code: "SESSION_NOT_FOUND",
    };
  }

  return {
    success: true,
    session: mapSession(openedSession),
  };
}


async function closeCurrentSeasonSession(sessionId) {
  const season = await findActiveSeason();

  if (!season) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const session = await findSessionById(sessionId);

  if (!session) {
    return {
      success: false,
      code: "SESSION_NOT_FOUND",
    };
  }

  if (Number(session.season_id) !== Number(season.id)) {
    return {
      success: false,
      code: "SESSION_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (session.status === "CANCELLED") {
    return {
      success: false,
      code: "CANCELLED_SESSION_CANNOT_CLOSE",
    };
  }

  if (session.status === "CLOSED") {
    return {
      success: false,
      code: "SESSION_ALREADY_CLOSED",
    };
  }

  const closedSession = await closeSession(sessionId);

  if (!closedSession) {
    return {
      success: false,
      code: "SESSION_NOT_FOUND",
    };
  }

  return {
    success: true,
    session: mapSession(closedSession),
  };
}


module.exports = {
  getCurrentSeasonSessions,
  getSessionById,
  createCurrentSeasonSession,
  openCurrentSeasonSession,
  closeCurrentSeasonSession,
};