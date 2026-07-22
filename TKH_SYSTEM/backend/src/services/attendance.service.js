const {
  findCurrentOpenSession,
  findActiveMembershipByMemberId,
  findAttendanceRecord,
  createAttendanceRecord,
  findAttendanceHistoryByMemberId,
  findCurrentSessionAttendanceRoster,
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


function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function calculateDistanceMeters(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadiusM = 6371000;

  const deltaLatitude = toRadians(
    latitude2 - latitude1
  );

  const deltaLongitude = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusM * c;
}



async function checkIn({
  memberId,
  latitude,
  longitude,
  accuracyM,
  deviceInfo,
}) {
  if (!memberId) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return {
      success: false,
      code: "INVALID_LATITUDE",
    };
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      code: "INVALID_LONGITUDE",
    };
  }

  if (
    !Number.isFinite(accuracyM) ||
    accuracyM < 0
  ) {
    return {
      success: false,
      code: "INVALID_GPS_ACCURACY",
    };
  }

  if (accuracyM > 100) {
    return {
      success: false,
      code: "GPS_ACCURACY_TOO_LOW",
      accuracyM,
      maximumAccuracyM: 100,
    };
  }

  const session = await findCurrentOpenSession();

  if (!session) {
    return {
      success: false,
      code: "OPEN_ATTENDANCE_SESSION_NOT_FOUND",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(memberId);

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  if (
    Number(membership.season_id) !==
    Number(session.season_id)
  ) {
    return {
      success: false,
      code: "MEMBERSHIP_NOT_IN_SESSION_SEASON",
    };
  }

  if (
    session.latitude === null ||
    session.longitude === null
  ) {
    return {
      success: false,
      code: "SESSION_LOCATION_NOT_CONFIGURED",
    };
  }

  const distanceM = calculateDistanceMeters(
    latitude,
    longitude,
    Number(session.latitude),
    Number(session.longitude)
  );

  const attendanceRadiusM =
    Number(session.attendance_radius_m) || 200;

  if (distanceM > attendanceRadiusM) {
    return {
      success: false,
      code: "OUTSIDE_ATTENDANCE_RADIUS",
      distanceM,
      attendanceRadiusM,
    };
  }

  const existingRecord = await findAttendanceRecord(
    session.id,
    membership.id
  );

  if (existingRecord) {
    return {
      success: false,
      code: "ATTENDANCE_ALREADY_RECORDED",
      record: existingRecord,
    };
  }

  try {
    const record = await createAttendanceRecord({
      sessionId: session.id,
      seasonMembershipId: membership.id,
      latitude,
      longitude,
      accuracyM,
      distanceM,
      deviceInfo,
    });

    return {
      success: true,
      record,
      session: mapCurrentSession(session),
      distanceM,
      attendanceRadiusM,
    };
  } catch (error) {
    if (
      error.number === 2627 ||
      error.number === 2601
    ) {
      return {
        success: false,
        code: "ATTENDANCE_ALREADY_RECORDED",
      };
    }

    throw error;
  }
}


function mapAttendanceHistoryRecord(record) {
  return {
    id: record.id,
    sessionId: record.session_id,
    seasonMembershipId: record.season_membership_id,
    checkedInAt: record.checked_in_at,
    method: record.method,
    status: record.status,
    latitude:
      record.latitude !== null
        ? Number(record.latitude)
        : null,
    longitude:
      record.longitude !== null
        ? Number(record.longitude)
        : null,
    accuracyM:
      record.accuracy_m !== null
        ? Number(record.accuracy_m)
        : null,
    distanceM:
      record.distance_m !== null
        ? Number(record.distance_m)
        : null,
    deviceInfo: record.device_info,
    note: record.note,

    session: {
      id: record.session_id,
      name: record.session_name,
      sessionNo: record.session_no,
      scheduledStartAt: record.scheduled_start_at,
      scheduledEndAt: record.scheduled_end_at,
    },

    season: {
      id: record.season_id,
      code: record.season_code,
      name: record.season_name,
    },

    group: record.group_id
      ? {
          id: record.group_id,
          code: record.group_code,
          name: record.group_name,
        }
      : null,
  };
}


async function getAttendanceHistory(memberId) {
  if (!memberId) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
      records: [],
    };
  }

  const records =
    await findAttendanceHistoryByMemberId(memberId);

  return {
    success: true,
    records: records.map(mapAttendanceHistoryRecord),
  };
}


function mapAttendanceRosterItem(item) {
  const hasAttendance =
    item.attendance_record_id !== null &&
    item.attendance_record_id !== undefined;

  return {
    seasonMembershipId: item.season_membership_id,
    memberId: item.member_id,
    tkhCode: item.tkh_code,
    fullName: item.full_name,
    phone: item.phone,

    group: item.group_id
      ? {
          id: item.group_id,
          code: item.group_code,
          name: item.group_name,
        }
      : null,

    session: item.session_id
      ? {
          id: item.session_id,
          name: item.session_name,
          sessionNo: item.session_no,
          scheduledStartAt: item.scheduled_start_at,
          scheduledEndAt: item.scheduled_end_at,
          status: item.session_status,
        }
      : null,

    attendance: hasAttendance
      ? {
          id: item.attendance_record_id,
          checkedInAt: item.checked_in_at,
          method: item.method,
          status: item.attendance_status,
          latitude:
            item.latitude !== null
              ? Number(item.latitude)
              : null,
          longitude:
            item.longitude !== null
              ? Number(item.longitude)
              : null,
          accuracyM:
            item.accuracy_m !== null
              ? Number(item.accuracy_m)
              : null,
          distanceM:
            item.distance_m !== null
              ? Number(item.distance_m)
              : null,
          deviceInfo: item.device_info,
          note: item.note,
        }
      : null,

    isCheckedIn: hasAttendance,
  };
}


async function getCurrentSessionAttendanceRoster() {
  const rows =
    await findCurrentSessionAttendanceRoster();

  const roster = rows.map(mapAttendanceRosterItem);

  const checkedInCount = roster.filter(
    item => item.isCheckedIn
  ).length;

  const totalStudents = roster.length;

  const absentCount =
    Math.max(totalStudents - checkedInCount, 0);

  const checkedInPercent =
    totalStudents > 0
      ? Number(
          (
            (checkedInCount / totalStudents) *
            100
          ).toFixed(1)
        )
      : 0;

  const currentSession =
    roster.find(item => item.session)?.session || null;

  return {
    roster,
    summary: {
      totalStudents,
      checkedInCount,
      absentCount,
      checkedInPercent,
    },
    currentSession,
  };
}


module.exports = {
  getCurrentOpenSession,
  checkIn,
  getAttendanceHistory,
  getCurrentSessionAttendanceRoster,
};