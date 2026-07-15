const groupService = require("../services/group.service");

async function getGroups(req, res, next) {
  try {
    const result = await groupService.getCurrentSeasonGroups();

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
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGroups,
};