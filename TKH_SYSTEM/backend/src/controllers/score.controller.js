const scoreService = require("../services/score.service");

const seasonService = require("../services/season.service");

async function getRankingVisibilityForRequest(req) {
  const currentSeason =
    await seasonService.getCurrentSeason();

  /*
   * Admin luôn được phép xem ranking,
   * kể cả khi BTC đang ẩn ranking với học viên.
   */
  const isAdmin =
    String(req.user?.role || "")
      .trim()
      .toUpperCase() === "ADMIN";

  /*
   * Nếu không tìm thấy season/settings,
   * mặc định khóa ranking với học viên
   * để tránh vô tình lộ dữ liệu.
   */
  const rankingVisible =
    Boolean(
      currentSeason?.settings
        ?.rankingVisible
    );

  return {
    rankingVisible,
    canViewRanking:
      isAdmin || rankingVisible,
  };
}


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

    const rankingAccess =
  await getRankingVisibilityForRequest(
    req
  );

return res.status(200).json({
  success: true,
  data: {
    season: result.season,
    group: result.group,
    summary: result.summary,

    ranking:
      rankingAccess.canViewRanking
        ? result.ranking
        : null,

    rankingVisible:
      rankingAccess.rankingVisible,

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
    const rankingAccess =
      await getRankingVisibilityForRequest(
        req
      );

    /*
     * Khi học viên bị khóa ranking,
     * không cần chạy cả logic tính BXH.
     *
     * Quan trọng:
     * không trả điểm hay thứ hạng nhóm nào
     * ra khỏi Backend.
     */
    if (!rankingAccess.canViewRanking) {
      return res.status(200).json({
        success: true,
        data: {
          rankingVisible: false,
          groups: [],
          total: 0,
        },
      });
    }

    const result =
      await scoreService
        .getGroupRankings();

    return res.status(200).json({
      success: true,
      data: {
        rankingVisible:
          rankingAccess.rankingVisible,

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

    const rankingAccess =
      await getRankingVisibilityForRequest(
        req
      );

    if (!rankingAccess.canViewRanking) {
      return res.status(200).json({
        success: true,

        data: {
          rankingVisible: false,
          top10: [],
          myRanking: null,
          total: 0,
        },
      });
    }

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
    rankingVisible:
      rankingAccess.rankingVisible,

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

async function validateManualScoreImport(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .validateManualScoreImport({
          fileBuffer:
            req.file?.buffer,
        });

    if (!result.success) {
      const errorMap = {
        EXCEL_FILE_REQUIRED: {
          status: 400,
          message:
            "Vui lòng chọn file Excel.",
        },

        MANUAL_SCORE_IMPORT_ALREADY_COMPLETED: {
          status: 409,
          message:
            "File này đã được import trước đó. Hệ thống đã chặn import trùng.",
        },

        INVALID_EXCEL_FILE: {
          status: 400,
          message:
            "File Excel không hợp lệ hoặc không thể đọc.",
        },

        EXCEL_HAS_NO_SHEET: {
          status: 400,
          message:
            "File Excel không có sheet dữ liệu.",
        },

        EXCEL_HAS_NO_ROWS: {
          status: 400,
          message:
            "File Excel không có dữ liệu.",
        },

        INVALID_EXCEL_COLUMNS: {
          status: 400,
          message:
            "Các cột trong file Excel không đúng template.",
        },

        INVALID_EXCEL_ROWS: {
          status: 400,
          message:
            "File Excel có dòng dữ liệu không hợp lệ.",
        },

        EXCEL_HAS_NO_SCORE_ROWS: {
          status: 400,
          message:
            "File Excel không có dòng cộng điểm.",
        },

        MANUAL_SCORE_IMPORT_VALIDATION_FAILED: {
          status: 400,
          message:
            "File chưa đạt kiểm tra nghiệp vụ. Chưa có điểm nào được ghi.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể kiểm tra file cộng điểm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,

          error: {
            code:
              result.code,

            message:
              mappedError.message,

            details: {
              missingHeaders:
                result.missingHeaders ||
                [],

              summary:
                result.summary ||
                null,

              errors:
                result.errors ||
                [],

              batch:
                result.batch ||
                null,
            },
          },
        });
    }

    return res.status(200).json({
      success: true,

      data: {
        message:
          "File hợp lệ. Chưa có điểm nào được ghi vào hệ thống.",

        summary:
          result.summary,

        preview:
          result.preview,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function importManualScoresExcel(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .importManualScoresExcel({
          fileBuffer:
            req.file?.buffer,

          originalFileName:
            req.file?.originalname ||
            null,

          fileSizeBytes:
            req.file?.size ||
            null,

          adminUserId:
            req.user.id,
        });

    if (!result.success) {
      const errorMap = {
        EXCEL_FILE_REQUIRED: {
          status: 400,
          message:
            "Vui lòng chọn file Excel.",
        },

        INVALID_EXCEL_FILE: {
          status: 400,
          message:
            "File Excel không hợp lệ hoặc không thể đọc.",
        },

        EXCEL_HAS_NO_SHEET: {
          status: 400,
          message:
            "File Excel không có sheet dữ liệu.",
        },

        EXCEL_HAS_NO_ROWS: {
          status: 400,
          message:
            "File Excel không có dữ liệu.",
        },

        INVALID_EXCEL_COLUMNS: {
          status: 400,
          message:
            "Các cột trong file Excel không đúng template.",
        },

        INVALID_EXCEL_ROWS: {
          status: 400,
          message:
            "File Excel có dòng dữ liệu không hợp lệ.",
        },

        EXCEL_HAS_NO_SCORE_ROWS: {
          status: 400,
          message:
            "File Excel không có dòng cộng điểm.",
        },

        MANUAL_SCORE_IMPORT_VALIDATION_FAILED: {
          status: 400,
          message:
            "File chưa đạt kiểm tra nghiệp vụ. Chưa có điểm nào được ghi.",
        },

        MANUAL_SCORE_IMPORT_ALREADY_COMPLETED: {
          status: 409,
          message:
            "File này đã được import trước đó. Hệ thống đã chặn import trùng.",
        },

        ADMIN_USER_REQUIRED: {
          status: 403,
          message:
            "Không xác định được tài khoản Admin.",
        },

        MANUAL_SCORE_IMPORT_FAILED: {
          status: 500,
          message:
            "Import điểm thất bại. Không có giao dịch nào được lưu.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể import file cộng điểm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,

          error: {
            code:
              result.code ||
              "MANUAL_SCORE_IMPORT_ERROR",

            message:
              result.message ||
              mappedError.message,

            details: {
              missingHeaders:
                result.missingHeaders ||
                [],

              summary:
                result.summary ||
                null,

              errors:
                result.errors ||
                [],

              batch:
                result.batch ||
                null,

              internalMessage:
                result.internalMessage ||
                null,
            },
          },
        });
    }

    return res.status(201).json({
      success: true,

      data: {
        message:
          result.message,

        batch:
          result.batch,

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

async function getGroupDisciplineScore(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .getGroupDisciplineScore({
          groupId:
            req.params.groupId,
        });

    if (!result.success) {
      const errorMap = {
        INVALID_GROUP_ID: {
          status: 400,
          message:
            "Mã nhóm không hợp lệ.",
        },

        GROUP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy nhóm trong mùa đang hoạt động.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể tải điểm Rèn luyện của nhóm.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,

          error: {
            code:
              result.code,

            message:
              mappedError.message,
          },
        });
    }

    return res.status(200).json({
      success: true,

      data: {
        group:
          result.group,

        disciplineScore:
          result.disciplineScore,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function saveGroupDisciplineScore(
  req,
  res,
  next
) {
  try {
    const result =
      await scoreService
        .saveGroupDisciplineScore({
          groupId:
            req.params.groupId,

          cleaningPoints:
            req.body?.cleaningPoints,

          compliancePoints:
            req.body?.compliancePoints,

          spiritPoints:
            req.body?.spiritPoints,

          reason:
            req.body?.reason,

          adminUserId:
            req.user.id,
        });

    if (!result.success) {
      const errorMap = {
        INVALID_GROUP_ID: {
          status: 400,
          message:
            "Mã nhóm không hợp lệ.",
        },

        ADMIN_USER_REQUIRED: {
          status: 403,
          message:
            "Không xác định được tài khoản Admin.",
        },

        INVALID_DISCIPLINE_POINTS: {
          status: 400,
          message:
            "Điểm Rèn luyện phải là số hợp lệ.",
        },

        DISCIPLINE_POINTS_OUT_OF_RANGE: {
          status: 400,
          message:
            "Mỗi hạng mục Rèn luyện phải từ 0 đến 30 điểm.",
        },

        DESCRIPTION_TOO_LONG: {
          status: 400,
          message:
            "Lý do không được vượt quá 500 ký tự.",
        },

        GROUP_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy nhóm trong mùa đang hoạt động.",
        },

        DISCIPLINE_SCORE_NO_CHANGE: {
          status: 409,
          message:
            "Điểm Rèn luyện không có thay đổi.",
        },

        SAVE_GROUP_DISCIPLINE_SCORE_FAILED: {
          status: 500,
          message:
            "Không thể lưu điểm Rèn luyện cho nhóm.",
        },
      };

      const mappedError =
        errorMap[result.code] || {
          status: 400,
          message:
            "Không thể cập nhật điểm Rèn luyện.",
        };

      return res
        .status(mappedError.status)
        .json({
          success: false,

          error: {
            code:
              result.code,

            message:
              mappedError.message,

            details: {
              minimumPoints:
                result.minimumPoints ??
                null,

              maximumPoints:
                result.maximumPoints ??
                null,

              currentScore:
                result.currentScore ||
                null,

              internalMessage:
                result.internalMessage ||
                null,
            },
          },
        });
    }

    return res.status(200).json({
      success: true,

      data: {
        message:
          result.message,

        group:
          result.group,

        disciplineScore:
          result.disciplineScore,

        affectedMembers:
          result.affectedMembers,

        changeType:
          result.changeType,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
    getGroupDisciplineScore,
    saveGroupDisciplineScore,
    validateManualScoreImport,
    importManualScoresExcel,
    getAdminScoreHistory,
  getMemberScoreSummary,
  getMyScores,
  getMyGroupScores,
  getGroupRankings,
  getIndividualRankings,
  createAdminIndividualScore,
  createAdminGroupScore,
};