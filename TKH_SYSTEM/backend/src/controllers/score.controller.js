const scoreService = require("../services/score.service");


async function getMyScores(req, res, next) {
  try {
    const result = await scoreService.getMyScores(
      req.user.memberId
    );

    if (!result.success) {
      const errorMap = {
        MEMBER_ACCOUNT_REQUIRED: {
          status: 403,
          message:
            "Tài khoản này chưa được liên kết với học viên.",
        },

        ACTIVE_MEMBERSHIP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy thông tin tham gia mùa hiện tại.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể tải thông tin điểm cá nhân.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "GET_MY_SCORES_ERROR",

            message:
              mappedError.message,
          },
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        season: result.season,
        member: result.member,
        summary: result.summary,
        history: result.history,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function getMyGroupScores(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService.getMyGroupScores(
        req.user.memberId
      );

    if (!result.success) {
      const errorMap = {
        MEMBER_ACCOUNT_REQUIRED: {
          status: 403,
          message:
            "Tài khoản này chưa được liên kết với học viên.",
        },

        ACTIVE_MEMBERSHIP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy thông tin tham gia mùa hiện tại.",
        },

        GROUP_NOT_ASSIGNED: {
          status: 404,
          message:
            "Học viên chưa được phân vào nhóm.",
        },

        GROUP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy thông tin nhóm.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể tải thông tin điểm nhóm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "GET_MY_GROUP_SCORES_ERROR",

            message:
              mappedError.message,
          },
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        season: result.season,
        group: result.group,
        summary: result.summary,
        ranking: result.ranking,
        history: result.history,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function getGroupRankings(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService.getGroupRankings();

    return res.status(200).json({
      success: true,
      data: {
        groups: result.groups,
        total: result.total,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function createAdminGroupScore(
  req,
  res,
  next
) {
  try {
    
    
    const result =
      await scoreService.createAdminGroupScore({
        groupId: req.body.groupId,
        points: req.body.points,
        sourceType: req.body.sourceType,
        sourceId: req.body.sourceId,
        description: req.body.description,
        createdByUserId: req.user.id,
      });

    if (!result.success) {
      const errorMap = {
        INVALID_GROUP_ID: {
          status: 400,
          message:
            "Mã nhóm không hợp lệ.",
        },

        INVALID_POINTS: {
          status: 400,
          message:
            "Điểm phải là số nguyên và khác 0.",
        },

        INVALID_SOURCE_TYPE: {
          status: 400,
          message:
            "Loại nguồn điểm không hợp lệ.",
        },

        INVALID_SOURCE_ID: {
          status: 400,
          message:
            "Mã nguồn điểm không hợp lệ.",
        },

        DESCRIPTION_TOO_LONG: {
          status: 400,
          message:
            "Mô tả không được vượt quá 500 ký tự.",
        },

        ADMIN_ACCOUNT_REQUIRED: {
          status: 403,
          message:
            "Không xác định được tài khoản Admin.",
        },

        GROUP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy nhóm.",
        },

        CREATE_GROUP_SCORE_FAILED: {
          status: 500,
          message:
            "Không thể tạo giao dịch điểm nhóm.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể cập nhật điểm cho nhóm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "CREATE_GROUP_SCORE_ERROR",

            message:
              mappedError.message,
          },
        });
    }

    return res.status(201).json({
      success: true,
      data: {
        transaction:
          result.transaction,
        message:
          result.message,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function createAdminIndividualScore(
  req,
  res,
  next
) {
  try {
    const {
      username,
      sourceType,
      points,
      description,
    } = req.body;

    const result =
      await scoreService.createAdminIndividualScore({
        username,
        sourceType,
        points,
        description,
        adminUserId: req.user.id,
      });

    if (!result.success) {
      const errorMap = {
        USERNAME_REQUIRED: {
          status: 400,
          message:
            "Vui lòng chọn học viên.",
        },

        SOURCE_TYPE_REQUIRED: {
          status: 400,
          message:
            "Vui lòng chọn loại điểm.",
        },

        INVALID_SCORE_SOURCE_TYPE: {
          status: 400,
          message:
            "Loại điểm không hợp lệ hoặc không được phép nhập thủ công.",
        },

        INVALID_POINTS: {
          status: 400,
          message:
            "Điểm phải là một số nguyên hợp lệ.",
        },

        ZERO_POINTS_NOT_ALLOWED: {
          status: 400,
          message:
            "Điểm cộng hoặc trừ không được bằng 0.",
        },

        DESCRIPTION_REQUIRED: {
          status: 400,
          message:
            "Vui lòng nhập nội dung hoặc lý do cộng trừ điểm.",
        },

        DESCRIPTION_TOO_LONG: {
          status: 400,
          message:
            "Nội dung cộng trừ điểm không được vượt quá 500 ký tự.",
        },

        ADMIN_USER_REQUIRED: {
          status: 403,
          message:
            "Không xác định được tài khoản quản trị viên.",
        },

        ACTIVE_MEMBERSHIP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy học viên đang tham gia mùa hiện tại.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể tạo giao dịch điểm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "CREATE_INDIVIDUAL_SCORE_ERROR",

            message:
              mappedError.message,

            details: {
              maximumLength:
                result.maximumLength ?? null,
            },
          },
        });
    }

    return res.status(201).json({
      success: true,
      data: {
        transaction:
          result.transaction,

        message:
          "Cập nhật điểm cho học viên thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  getMyScores,
  getMyGroupScores,
  getGroupRankings,
  createAdminIndividualScore,
  createAdminGroupScore,
};