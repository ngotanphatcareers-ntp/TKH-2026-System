const scoreService = require("../services/score.service");


async function getMemberScoreSummary(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService.getMemberScoreSummary(
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
            "Không thể tải bảng điểm tổng hợp của học viên.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "GET_MEMBER_SCORE_SUMMARY_ERROR",

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
        score: result.score,
      },
    });
  } catch (error) {
    return next(error);
  }
}


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


async function getIndividualRankings(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .getIndividualRankings(
          req.user.memberId
        );

    if (!result.success) {
      const errorMap = {
        MEMBER_ACCOUNT_REQUIRED: {
          status: 403,
          message:
            "Tài khoản này chưa được liên kết với học viên.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể tải bảng xếp hạng cá nhân.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,
          error: {
            code:
              result.code ||
              "GET_INDIVIDUAL_RANKINGS_ERROR",

            message:
              mappedError.message,
          },
        });
    }

    const top10 =
      result.top10.map(item => ({
        ranking: item.ranking,

        member: {
          tkhCode:
            item.member.tkhCode,

          fullName:
            item.member.fullName,
        },

        group: item.group
          ? {
              id: item.group.id,
              code: item.group.code,
              name: item.group.name,
            }
          : null,
      }));

    return res.status(200).json({
      success: true,

      data: {
        top10,

        myRanking:
          result.myRanking
            ? {
                ranking:
                  result.myRanking.ranking,

                totalPoints:
                  result.myRanking
                    .totalPoints,
              }
            : null,

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
        scoreType,
        examId,
        points,
        description,
        } = req.body;

    const result =
      await scoreService.createAdminScoreTransaction({
        username,
        scoreType,
        requestedPoints: points,
        sourceType: "MANUAL",
        sourceId: examId,
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

        MANUAL_SCORE_TYPE_NOT_ALLOWED: {
        status: 400,
        message:
            "Hiện chỉ hỗ trợ cộng thủ công điểm danh và điểm phát biểu.",
        },

        INVALID_ATTENDANCE_ADJUSTMENT_POINTS: {
        status: 400,
        message:
            "Điều chỉnh điểm danh chỉ được chọn +3, +5, -3 hoặc -5 điểm.",
        },

        ATTENDANCE_SCORE_BELOW_ZERO: {
        status: 400,
        message:
            "Không thể trừ vì tổng điểm danh của học viên sẽ nhỏ hơn 0.",
        },

        ATTENDANCE_SCORE_LIMIT_EXCEEDED: {
        status: 400,
        message:
            "Không thể cộng vì tổng điểm danh sẽ vượt quá 110 điểm.",
        },

        INVALID_PARTICIPATION_POINTS: {
        status: 400,
        message:
            "Mỗi lần phát biểu chỉ được cộng đúng 2 điểm.",
        },

        PARTICIPATION_SCORE_LIMIT_EXCEEDED: {
        status: 400,
        message:
            "Không thể cộng vì tổng điểm phát biểu sẽ vượt quá 50 điểm.",
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

        EXAM_ID_REQUIRED: {
        status: 400,
        message:
            "Vui lòng chọn bài kiểm tra.",
        },

        EXAM_NOT_FOUND: {
        status: 404,
        message:
            "Không tìm thấy bài kiểm tra.",
        },

        EXAM_TYPE_MISMATCH: {
        status: 400,
        message:
            "Loại bài kiểm tra không khớp với loại điểm đã chọn.",
        },

        INVALID_MANUAL_TEST_POINTS: {
        status: 400,
        message:
            "Điểm bài thi giấy phải là số lớn hơn hoặc bằng 0.",
        },

        EXAM_SCORE_LIMIT_EXCEEDED: {
        status: 400,
        message:
            "Điểm nhập sẽ làm tổng điểm của bài kiểm tra vượt quá giới hạn.",
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

            currentPoints:
                result.currentPoints ?? null,
            
            minimumPoints:
                result.minimumPoints ?? null,

            maximumPoints:
                result.maximumPoints ?? null,

            remainingPoints:
                result.remainingPoints ?? null,

            allowedPoints:
                result.allowedPoints ?? null,

            requiredPoints:
                result.requiredPoints ?? null,
                
            requestedPoints:
                result.requestedPoints ?? null,
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

async function getAdminScoreHistory(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .getAdminScoreHistory({
          limit:
            req.query.limit,
        });

    return res.status(200).json({
      success: true,

      data: {
        summary:
          result.summary,

        transactions:
          result.transactions,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
    getAdminScoreHistory,
  getMemberScoreSummary,
  getMyScores,
  getMyGroupScores,
  getGroupRankings,
  getIndividualRankings,
  createAdminIndividualScore,
  createAdminGroupScore,
};