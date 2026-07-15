const seasonService = require("../services/season.service");

async function getCurrentSeason(req, res, next) {
  try {
    const season = await seasonService.getCurrentSeason();

    if (!season) {
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
        season,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCurrentSeason,
};