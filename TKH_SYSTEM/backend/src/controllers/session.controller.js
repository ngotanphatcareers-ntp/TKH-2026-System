const sessionService = require("../services/session.service");

async function getSessions(req, res, next) {
  try {
    const result = await sessionService.getCurrentSeasonSessions();

    if (!result.season) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_SEASON_NOT_FOUND",
          message: "Không tìm thấy mùa đang hoạt động.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        season: result.season,
        sessions: result.sessions,
        total: result.sessions.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getSessionById(req, res, next) {
  try {
    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SESSION_ID",
          message: "Mã buổi học không hợp lệ.",
        },
      });
    }

    const session = await sessionService.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: "Không tìm thấy buổi học.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function createSession(req, res, next) {
  try {
    const {
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
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SESSION_NAME_REQUIRED",
          message: "Tên buổi học là bắt buộc.",
        },
      });
    }

    if (!Number.isInteger(Number(sessionNo)) || Number(sessionNo) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SESSION_NO",
          message: "Số thứ tự buổi học không hợp lệ.",
        },
      });
    }

    const result = await sessionService.createCurrentSeasonSession({
      name: String(name).trim(),
      sessionNo: Number(sessionNo),
      scheduledStartAt: scheduledStartAt || null,
      scheduledEndAt: scheduledEndAt || null,
      checkinOpenAt: checkinOpenAt || null,
      checkinCloseAt: checkinCloseAt || null,
      locationName: locationName
        ? String(locationName).trim()
        : null,
      latitude:
        latitude === null || latitude === undefined || latitude === ""
          ? null
          : Number(latitude),
      longitude:
        longitude === null || longitude === undefined || longitude === ""
          ? null
          : Number(longitude),
      attendanceRadiusM:
        attendanceRadiusM === null ||
        attendanceRadiusM === undefined ||
        attendanceRadiusM === ""
          ? null
          : Number(attendanceRadiusM),
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: result.code,
          message: "Không tìm thấy mùa đang hoạt động.",
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        session: result.session,
      },
    });
  } catch (error) {
    if (
      error.number === 2627 ||
      error.number === 2601
    ) {
      return res.status(409).json({
        success: false,
        error: {
          code: "SESSION_ALREADY_EXISTS",
          message:
            "Số thứ tự buổi học đã tồn tại trong mùa hiện tại.",
        },
      });
    }

    return next(error);
  }
}


async function openSession(req, res, next) {
  try {
    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SESSION_ID",
          message: "Mã buổi học không hợp lệ.",
        },
      });
    }

    const result =
      await sessionService.openCurrentSeasonSession(sessionId);

    if (!result.success) {
      const errorMap = {
        ACTIVE_SEASON_NOT_FOUND: {
          status: 404,
          message: "Không tìm thấy mùa đang hoạt động.",
        },
        SESSION_NOT_FOUND: {
          status: 404,
          message: "Không tìm thấy buổi học.",
        },
        SESSION_NOT_IN_ACTIVE_SEASON: {
          status: 409,
          message:
            "Buổi học không thuộc mùa đang hoạt động.",
        },
        CANCELLED_SESSION_CANNOT_OPEN: {
          status: 409,
          message:
            "Không thể mở lại buổi học đã bị hủy.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message: "Không thể mở buổi học.",
        };

      return res.status(mappedError.status).json({
        success: false,
        error: {
          code: result.code,
          message: mappedError.message,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: result.session,
        message: "Đã mở buổi học thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function closeSession(req, res, next) {
  try {
    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SESSION_ID",
          message: "Mã buổi học không hợp lệ.",
        },
      });
    }

    const result =
      await sessionService.closeCurrentSeasonSession(sessionId);

    if (!result.success) {
      const errorMap = {
        ACTIVE_SEASON_NOT_FOUND: {
          status: 404,
          message: "Không tìm thấy mùa đang hoạt động.",
        },
        SESSION_NOT_FOUND: {
          status: 404,
          message: "Không tìm thấy buổi học.",
        },
        SESSION_NOT_IN_ACTIVE_SEASON: {
          status: 409,
          message: "Buổi học không thuộc mùa đang hoạt động.",
        },
        CANCELLED_SESSION_CANNOT_CLOSE: {
          status: 409,
          message: "Không thể đóng buổi học đã bị hủy.",
        },
        SESSION_ALREADY_CLOSED: {
          status: 409,
          message: "Buổi học đã được đóng trước đó.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message: "Không thể đóng buổi học.",
        };

      return res.status(mappedError.status).json({
        success: false,
        error: {
          code: result.code,
          message: mappedError.message,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: result.session,
        message: "Đã đóng buổi học thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  getSessions,
  getSessionById,
  createSession,
  openSession,
  closeSession,
};