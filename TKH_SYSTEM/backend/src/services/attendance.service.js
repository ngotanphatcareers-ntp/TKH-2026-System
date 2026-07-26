const {
  findCurrentOpenSession,
  findActiveMembershipByMemberId,
  findAttendanceRecord,
  findMorningOrBreakAttendanceRecord,
  createAttendanceRecord,
  findAttendanceHistoryByMemberId,

  findCurrentSessionAttendanceRoster:
    findCurrentSessionAttendanceRosterRepository,

  setCurrentSessionAttendanceWindow:
    setCurrentSessionAttendanceWindowRepository,
} = require("../repositories/attendance.repository");


const {
  createScoreTransaction,
} = require("../repositories/score.repository");


const ATTENDANCE_WINDOWS = [
  "MORNING",
  "BREAK",
  "END",
  "DEVOTION",
];

const ATTENDANCE_POINTS = {
  MORNING: 5,
  BREAK: 3,
  END: 5,
  DEVOTION: 0,
};


function normalizeAttendanceWindow(windowType) {
  if (typeof windowType !== "string") {
    return null;
  }

  const normalizedWindowType =
    windowType.trim().toUpperCase();

  return ATTENDANCE_WINDOWS.includes(
    normalizedWindowType
  )
    ? normalizedWindowType
    : null;
}


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

    activeAttendanceWindow:
      session.active_attendance_window || null,

    location: {
      name: session.location_name,
      latitude:
        session.latitude !== null &&
        session.latitude !== undefined
          ? Number(session.latitude)
          : null,
      longitude:
        session.longitude !== null &&
        session.longitude !== undefined
          ? Number(session.longitude)
          : null,
    },

    attendanceRadiusM:
      session.attendance_radius_m !== null &&
      session.attendance_radius_m !== undefined
        ? Number(session.attendance_radius_m)
        : null,

    season: {
      code: session.season_code || null,
      name: session.season_name || null,
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
  deviceId,
  deviceInfo,
}) {
  if (!memberId) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const normalizedDeviceId =
    typeof deviceId === "string"
      ? deviceId.trim()
      : "";

  if (!normalizedDeviceId) {
    return {
      success: false,
      code: "DEVICE_ID_REQUIRED",
    };
  }

  if (normalizedDeviceId.length > 100) {
    return {
      success: false,
      code: "INVALID_DEVICE_ID",
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

  if (!session.active_attendance_window) {
    return {
      success: false,
      code: "ATTENDANCE_WINDOW_CLOSED",
    };
  }

  const windowType = normalizeAttendanceWindow(
    session.active_attendance_window
  );

  if (!windowType) {
    return {
      success: false,
      code: "INVALID_ACTIVE_ATTENDANCE_WINDOW",
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
    Number(session.attendance_radius_m) || 50;

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
    membership.id,
    windowType
  );

  if (existingRecord) {
    return {
      success: false,
      code: "ATTENDANCE_WINDOW_ALREADY_RECORDED",
      windowType,
      record: existingRecord,
    };
  }

  if (
    windowType === "MORNING" ||
    windowType === "BREAK"
  ) {
    const morningOrBreakRecord =
      await findMorningOrBreakAttendanceRecord(
        session.id,
        membership.id
      );

    if (morningOrBreakRecord) {
      return {
        success: false,
        code:
          "MORNING_OR_BREAK_ATTENDANCE_ALREADY_RECORDED",
        windowType,
        existingWindowType:
          morningOrBreakRecord.window_type,
        record: morningOrBreakRecord,
      };
    }
  }

  try {
    const record = await createAttendanceRecord({
      sessionId: session.id,
      seasonMembershipId: membership.id,
      windowType,
      latitude,
      longitude,
      accuracyM,
      distanceM,
      deviceId: normalizedDeviceId,
      deviceInfo,
    });

    const pointsAwarded =
      ATTENDANCE_POINTS[windowType];

    if (pointsAwarded > 0) {
      await createScoreTransaction({
        seasonMembershipId: membership.id,

        scoreCategory: "ATTENDANCE",

        scoreType: "ATTENDANCE",

        requestedPoints: pointsAwarded,

        appliedPoints: pointsAwarded,

        sourceType: "ATTENDANCE",

        sourceId: record.id,

        sourceKey:
          `ATTENDANCE_SESSION_${session.id}` +
          `_MEMBER_${membership.id}` +
          `_WINDOW_${windowType}`,

        description:
          `Attendance ${windowType} - ${session.name}`,

        createdByUserId: null,
      });
    }

    return {
      success: true,
      record,
      session: mapCurrentSession(session),
      windowType,
      pointsAwarded,
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
        code: "ATTENDANCE_WINDOW_ALREADY_RECORDED",
        windowType,
      };
    }

    throw error;
  }
}


function mapAttendanceHistoryRecord(record) {
  return {
    id: record.id,
    sessionId: record.session_id,
    seasonMembershipId:
      record.season_membership_id,

    windowType: record.window_type,

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

    deviceId: record.device_id,
    deviceInfo: record.device_info,
    note: record.note,

    points:
      record.attendance_points !== null &&
      record.attendance_points !== undefined
        ? Number(record.attendance_points)
        : 0,

    session: {
      id: record.session_id,
      name: record.session_name,
      sessionNo: record.session_no,
      scheduledStartAt:
        record.scheduled_start_at,
      scheduledEndAt:
        record.scheduled_end_at,
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
    records: records.map(
      mapAttendanceHistoryRecord
    ),
  };
}


function mapRosterAttendanceRecord(record) {
  return {
    id: record.attendance_record_id,
    sessionId: record.session_id,
    seasonMembershipId:
      record.season_membership_id,

    windowType: record.window_type,

    checkedInAt: record.checked_in_at,
    method: record.method,
    status: record.attendance_status,

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

    deviceId: record.device_id,
    deviceInfo: record.device_info,
    note: record.note,

    points:
      record.attendance_points !== null &&
      record.attendance_points !== undefined
        ? Number(record.attendance_points)
        : 0,
  };
}


function mapRosterSession(session) {
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

    activeAttendanceWindow:
      session.active_attendance_window || null,

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

    attendanceRadiusM:
      session.attendance_radius_m !== null
        ? Number(session.attendance_radius_m)
        : null,
  };
}


function mapAttendanceRosterItem(
  member,
  attendanceRecords,
  currentSession
) {
  const mappedAttendanceRecords =
    attendanceRecords.map(
      mapRosterAttendanceRecord
    );

  const latestAttendance =
    mappedAttendanceRecords.length > 0
      ? mappedAttendanceRecords[
          mappedAttendanceRecords.length - 1
        ]
      : null;

  const activeAttendanceWindow =
    currentSession?.active_attendance_window || null;

  const currentWindowAttendance =
    activeAttendanceWindow
      ? mappedAttendanceRecords.find(
          record =>
            record.windowType ===
            activeAttendanceWindow
        ) || null
      : null;

  const totalAttendancePoints =
    mappedAttendanceRecords.reduce(
      (total, record) =>
        total + Number(record.points || 0),
      0
    );

  return {
    seasonMembershipId:
      member.season_membership_id,

    memberId: member.member_id,
    tkhCode: member.tkh_code,
    fullName: member.full_name,
    phone: member.phone,

    group: member.group_id
      ? {
          id: member.group_id,
          code: member.group_code,
          name: member.group_name,
        }
      : null,

    session: mapRosterSession(currentSession),

    attendance: latestAttendance,

    attendanceRecords:
      mappedAttendanceRecords,

    currentWindowAttendance,

    checkedInWindows:
      mappedAttendanceRecords.map(
        record => record.windowType
      ),

    totalAttendancePoints,

    isCheckedIn:
      mappedAttendanceRecords.length > 0,

    isCheckedInCurrentWindow:
      currentWindowAttendance !== null,
  };
}


function buildDeviceWarnings(roster) {
  const devices = new Map();

  roster.forEach(item => {
    item.attendanceRecords.forEach(record => {
      const deviceId = record.deviceId;

      if (!deviceId) {
        return;
      }

      if (!devices.has(deviceId)) {
        devices.set(deviceId, new Map());
      }

      const deviceMembers = devices.get(deviceId);

      if (
        !deviceMembers.has(
          item.seasonMembershipId
        )
      ) {
        deviceMembers.set(
          item.seasonMembershipId,
          {
            seasonMembershipId:
              item.seasonMembershipId,

            memberId: item.memberId,
            fullName: item.fullName,
            groupName:
              item.group?.name || null,

            checkIns: [],
          }
        );
      }

      deviceMembers
        .get(item.seasonMembershipId)
        .checkIns.push({
          windowType: record.windowType,
          checkedInAt: record.checkedInAt,
        });
    });
  });

  return Array.from(devices.entries())
    .map(([deviceId, deviceMembers]) => ({
      deviceId,
      accountCount: deviceMembers.size,
      members: Array.from(
        deviceMembers.values()
      ),
    }))
    .filter(
      warning => warning.accountCount >= 2
    );
}


function buildWindowSummary(
  roster,
  windowType
) {
  const totalStudents = roster.length;

  const checkedInCount = roster.filter(
    item =>
      item.attendanceRecords.some(
        record =>
          record.windowType === windowType
      )
  ).length;

  const absentCount = Math.max(
    totalStudents - checkedInCount,
    0
  );

  const checkedInPercent =
    totalStudents > 0
      ? Number(
          (
            (checkedInCount / totalStudents) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    checkedInCount,
    absentCount,
    checkedInPercent,
  };
}


async function getCurrentSessionAttendanceRoster() {
  const {
    session,
    members,
    attendanceRecords,
  } =
    await findCurrentSessionAttendanceRosterRepository();

  const recordsByMembership = new Map();

  attendanceRecords.forEach(record => {
    const membershipId = Number(
      record.season_membership_id
    );

    if (!recordsByMembership.has(membershipId)) {
      recordsByMembership.set(
        membershipId,
        []
      );
    }

    recordsByMembership
      .get(membershipId)
      .push(record);
  });

  const roster = members.map(member => {
    const membershipId = Number(
      member.season_membership_id
    );

    return mapAttendanceRosterItem(
      member,
      recordsByMembership.get(membershipId) ||
        [],
      session
    );
  });

  const totalStudents = roster.length;

  const checkedInCount = roster.filter(
    item => item.isCheckedIn
  ).length;

  const absentCount = Math.max(
    totalStudents - checkedInCount,
    0
  );

  const checkedInPercent =
    totalStudents > 0
      ? Number(
          (
            (checkedInCount / totalStudents) *
            100
          ).toFixed(1)
        )
      : 0;

  const byWindow = {
    MORNING: buildWindowSummary(
      roster,
      "MORNING"
    ),

    BREAK: buildWindowSummary(
      roster,
      "BREAK"
    ),

    END: buildWindowSummary(
      roster,
      "END"
    ),

    DEVOTION: buildWindowSummary(
      roster,
      "DEVOTION"
    ),
  };

  const activeAttendanceWindow =
    session?.active_attendance_window || null;

  const currentWindowSummary =
    activeAttendanceWindow
      ? byWindow[activeAttendanceWindow]
      : null;

  const deviceWarnings =
    buildDeviceWarnings(roster);

  return {
    roster,
    deviceWarnings,

    summary: {
      totalStudents,
      checkedInCount,
      absentCount,
      checkedInPercent,

      activeAttendanceWindow,

      currentWindowCheckedInCount:
        currentWindowSummary?.checkedInCount ||
        0,

      currentWindowAbsentCount:
        currentWindowSummary?.absentCount ||
        totalStudents,

      currentWindowCheckedInPercent:
        currentWindowSummary
          ?.checkedInPercent || 0,

      byWindow,
    },

    currentSession:
      mapRosterSession(session),
  };
}


async function updateCurrentSessionAttendanceWindow(
  windowType
) {
  if (windowType === undefined) {
    return {
      success: false,
      code: "ATTENDANCE_WINDOW_REQUIRED",
    };
  }

  let normalizedWindowType = null;

  if (windowType !== null) {
    normalizedWindowType =
      normalizeAttendanceWindow(windowType);

    if (!normalizedWindowType) {
      return {
        success: false,
        code: "INVALID_ATTENDANCE_WINDOW",
        allowedWindows: ATTENDANCE_WINDOWS,
      };
    }
  }

  const currentSession =
    await findCurrentOpenSession();

  if (!currentSession) {
    return {
      success: false,
      code: "OPEN_ATTENDANCE_SESSION_NOT_FOUND",
    };
  }

  const updatedSession =
    await setCurrentSessionAttendanceWindowRepository(
      currentSession.id,
      normalizedWindowType
    );

  if (!updatedSession) {
    return {
      success: false,
      code: "ATTENDANCE_SESSION_UPDATE_FAILED",
    };
  }

  const refreshedSession =
    await findCurrentOpenSession();

  return {
    success: true,

    activeAttendanceWindow:
      normalizedWindowType,

    session: mapCurrentSession(
      refreshedSession || {
        ...currentSession,
        active_attendance_window:
          normalizedWindowType,
      }
    ),
  };
}


module.exports = {
  getCurrentOpenSession,
  checkIn,
  getAttendanceHistory,
  getCurrentSessionAttendanceRoster,
  updateCurrentSessionAttendanceWindow,
};