const memberService = require("../services/member.service");

async function getMembers(req, res, next) {
  try {
    const result = await memberService.getCurrentSeasonMembers();

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

module.exports = {
  getMembers,
};