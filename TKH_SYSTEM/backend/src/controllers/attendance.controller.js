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

module.exports = {
  getCurrentSession,
};