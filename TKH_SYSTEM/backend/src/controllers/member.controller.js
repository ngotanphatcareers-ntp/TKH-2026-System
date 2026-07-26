const memberService = require("../services/member.service");

async function getMembers(req, res, next) {
  try {
    const result =
      await memberService.getCurrentSeasonMembers();

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
        members: result.members,
        total: result.members.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function importMembers(req, res, next) {
  try {
    const result =
      await memberService.importCurrentSeasonMembers(
        req.body?.students
      );

    return res.status(201).json({
      success: true,
      data: result,
      message:
        `Đã import thành công ${result.total} học viên.`,
    });
  } catch (error) {
    const statusByCode = {
      INVALID_IMPORT_DATA: 400,
      IMPORT_LIMIT_EXCEEDED: 400,
      GROUP_NOT_FOUND: 400,
      DUPLICATE_IN_FILE: 409,
      MEMBER_ALREADY_EXISTS: 409,
      ACTIVE_SEASON_NOT_FOUND: 404,
    };

    const status = statusByCode[error.code];

    if (!status) {
      return next(error);
    }

    return res.status(status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details || null,
      },
    });
  }
}

module.exports = {
  getMembers,
  importMembers,
};