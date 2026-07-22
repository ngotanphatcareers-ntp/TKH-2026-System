const attendanceService = require("../services/attendance.service");

async function getCurrentSession(req, res, next) {
  try {
    const session = await attendanceService.getCurrentOpenSession();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: "OPEN_ATTENDANCE_SESSION_NOT_FOUND",
          message: "Hiện chưa có buổi học nào đang mở điểm danh.",
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


async function checkIn(req, res, next) {
  try {
    const {
      latitude,
      longitude,
      accuracyM,
      deviceInfo,
    } = req.body;

    const result = await attendanceService.checkIn({
      memberId: req.user.memberId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracyM: Number(accuracyM),
      deviceInfo: deviceInfo
        ? String(deviceInfo).slice(0, 1000)
        : null,
    });

    if (!result.success) {
      const errorMap = {
        MEMBER_ACCOUNT_REQUIRED: {
          status: 403,
          message:
            "Tài khoản này chưa được liên kết với học viên.",
        },
        INVALID_LATITUDE: {
          status: 400,
          message: "Vĩ độ GPS không hợp lệ.",
        },
        INVALID_LONGITUDE: {
          status: 400,
          message: "Kinh độ GPS không hợp lệ.",
        },
        INVALID_GPS_ACCURACY: {
          status: 400,
          message: "Độ chính xác GPS không hợp lệ.",
        },
        GPS_ACCURACY_TOO_LOW: {
          status: 422,
          message:
            "GPS chưa đủ chính xác. Vui lòng thử lại bằng điện thoại.",
        },
        OPEN_ATTENDANCE_SESSION_NOT_FOUND: {
          status: 404,
          message:
            "Hiện chưa có buổi học nào đang mở điểm danh.",
        },
        ACTIVE_MEMBERSHIP_NOT_FOUND: {
          status: 403,
          message:
            "Không tìm thấy thông tin tham gia mùa hiện tại.",
        },
        MEMBERSHIP_NOT_IN_SESSION_SEASON: {
          status: 409,
          message:
            "Thông tin học viên không thuộc mùa của buổi học này.",
        },
        SESSION_LOCATION_NOT_CONFIGURED: {
          status: 409,
          message:
            "Buổi học chưa được cấu hình vị trí điểm danh.",
        },
        OUTSIDE_ATTENDANCE_RADIUS: {
          status: 422,
          message:
            "Bạn đang ở ngoài khu vực điểm danh.",
        },
        ATTENDANCE_ALREADY_RECORDED: {
          status: 409,
          message:
            "Bạn đã điểm danh buổi học này rồi.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message: "Không thể điểm danh.",
        };

      return res.status(mappedError.status).json({
        success: false,
        error: {
          code: result.code,
          message: mappedError.message,
          details: {
            accuracyM:
              result.accuracyM ?? null,
            maximumAccuracyM:
              result.maximumAccuracyM ?? null,
            distanceM:
              result.distanceM ?? null,
            attendanceRadiusM:
              result.attendanceRadiusM ?? null,
          },
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        record: result.record,
        session: result.session,
        distanceM: result.distanceM,
        attendanceRadiusM:
          result.attendanceRadiusM,
        message: "Điểm danh thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function getHistory(req, res, next) {
  try {
    const result =
      await attendanceService.getAttendanceHistory(
        req.user.memberId
      );

    if (!result.success) {
      if (result.code === "MEMBER_ACCOUNT_REQUIRED") {
        return res.status(403).json({
          success: false,
          error: {
            code: result.code,
            message:
              "Tài khoản này chưa được liên kết với học viên.",
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: result.code || "ATTENDANCE_HISTORY_ERROR",
          message:
            "Không thể tải lịch sử điểm danh.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        records: result.records,
        total: result.records.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function getCurrentSessionRoster(req, res, next) {
  try {
    const result =
      await attendanceService.getCurrentSessionAttendanceRoster();

    return res.status(200).json({
      success: true,
      data: {
        currentSession: result.currentSession,
        summary: result.summary,
        roster: result.roster,
      },
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  getCurrentSession,
  checkIn,
  getHistory,
  getCurrentSessionRoster,
};