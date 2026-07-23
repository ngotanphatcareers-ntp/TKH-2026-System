const bibleChallengeService = require(
  "../services/bible-challenge.service"
);


const ERROR_MAP = {
  ADMIN_ACCOUNT_REQUIRED: {
    status: 403,
    message:
      "Tài khoản này không có quyền quản trị Bible Challenge.",
  },

  OPEN_ACTIVITY_SESSION_NOT_FOUND: {
    status: 404,
    message:
      "Hiện không có buổi học nào đang mở.",
  },

  ACTIVE_GROUP_NOT_FOUND: {
    status: 404,
    message:
      "Không tìm thấy nhóm đang hoạt động.",
  },

  ELIGIBLE_MEMBERSHIP_NOT_FOUND: {
    status: 404,
    message:
      "Học viên không hợp lệ hoặc chưa điểm danh trong buổi học.",
  },

  ELIGIBLE_GROUP_NOT_FOUND: {
    status: 404,
    message:
      "Không tìm thấy nhóm hợp lệ để quay.",
  },

  INVALID_GROUP_ID: {
    status: 400,
    message:
      "Mã nhóm không hợp lệ.",
  },

  INVALID_SEASON_MEMBERSHIP_ID: {
    status: 400,
    message:
      "Mã tham gia mùa học không hợp lệ.",
  },

  INVALID_CHALLENGE_RESULT: {
    status: 400,
    message:
      "Kết quả Bible Challenge không hợp lệ.",
  },

  NO_ELIGIBLE_MEMBERS_REMAINING: {
    status: 422,
    message:
      "Không còn học viên hợp lệ để tham gia Bible Challenge.",
  },

  NO_ELIGIBLE_MEMBER_IN_GROUP: {
    status: 422,
    message:
      "Nhóm này không còn học viên hợp lệ để quay.",
  },

  GROUP_IS_NOT_LATEST_SELECTION: {
    status: 409,
    message:
      "Nhóm được gửi lên không phải nhóm vừa được quay gần nhất.",
  },

  GROUP_ALREADY_SELECTED_IN_ROUND: {
    status: 409,
    message:
      "Nhóm này đã được chọn trong vòng hiện tại.",
  },

  MEMBER_ALREADY_USED_IN_SESSION: {
    status: 409,
    message:
      "Học viên này đã tham gia Bible Challenge trong buổi học.",
  },

  BIBLE_CHALLENGE_RESULT_ALREADY_RECORDED: {
    status: 409,
    message:
      "Kết quả Bible Challenge đã được ghi nhận trước đó.",
  },
};


function getAdminUserId(req) {
  const value =
    req.user?.id ??
    req.user?.userId ??
    req.user?.user_id ??
    null;

  const adminUserId = Number(value);

  if (
    !Number.isInteger(adminUserId) ||
    adminUserId <= 0
  ) {
    return null;
  }

  return adminUserId;
}


function sendError(res, result) {
  const mappedError =
    ERROR_MAP[result.code] || {
      status: 400,
      message:
        "Không thể xử lý yêu cầu Bible Challenge.",
    };

  return res
    .status(mappedError.status)
    .json({
      success: false,

      error: {
        code:
          result.code ||
          "BIBLE_CHALLENGE_ERROR",

        message:
          mappedError.message,

        details: {
          allowedResults:
            result.allowedResults ??
            null,

          maximumPoints:
            result.maximumPoints ??
            null,

          session:
            result.session ??
            null,

          group:
            result.group ??
            null,
        },
      },
    });
}


async function getCurrentChallenge(
  req,
  res,
  next
) {
  try {
    const result =
      await bibleChallengeService
        .getCurrentChallenge();

    if (!result.success) {
      return sendError(res, result);
    }

    return res.status(200).json({
      success: true,

      data: {
        session:
          result.session,

        currentRoundNo:
          result.currentRoundNo,

        latestSelection:
          result.latestSelection,

        eligibleGroups:
          result.eligibleGroups,

        usedGroups:
          result.usedGroups,

        progress:
          result.progress,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function drawGroup(
  req,
  res,
  next
) {
  try {
    const result =
      await bibleChallengeService
        .drawGroup({
          adminUserId:
            getAdminUserId(req),
        });

    if (!result.success) {
      return sendError(res, result);
    }

    return res.status(201).json({
      success: true,

      data: {
        session:
          result.session,

        roundNo:
          result.roundNo,

        startedNewRound:
          result.startedNewRound,

        group:
          result.group,

        selection:
          result.selection,

        remainingGroupCountInRound:
          result.remainingGroupCountInRound,

        message:
          "Quay nhóm Bible Challenge thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function drawMember(
  req,
  res,
  next
) {
  try {
    const groupId =
      req.params?.groupId ??
      req.body?.groupId;

    const result =
      await bibleChallengeService
        .drawMember({
          groupId,
        });

    if (!result.success) {
      return sendError(res, result);
    }

    return res.status(200).json({
      success: true,

      data: {
        session:
          result.session,

        roundNo:
          result.roundNo,

        group:
          result.group,

        member:
          result.member,

        eligibleMemberCount:
          result.eligibleMemberCount,

        message:
          "Quay học viên Bible Challenge thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function submitResult(
  req,
  res,
  next
) {
  try {
    const {
      groupId,
      seasonMembershipId,
      result: challengeResult,
    } = req.body || {};

    const result =
      await bibleChallengeService
        .submitResult({
          groupId,
          seasonMembershipId,

          result:
            challengeResult,

          adminUserId:
            getAdminUserId(req),
        });

    if (!result.success) {
      return sendError(res, result);
    }

    return res.status(201).json({
      success: true,

      data: {
        session:
          result.session,

        roundNo:
          result.roundNo,

        result:
          result.result,

        resultLabel:
          result.resultLabel,

        requestedPoints:
          result.requestedPoints,

        appliedPoints:
          result.appliedPoints,

        reachedMaximum:
          result.reachedMaximum,

        maximumPoints:
          result.maximumPoints,

        existingPointsBefore:
          result.existingPointsBefore,

        totalPointsAfter:
          result.totalPointsAfter,

        group:
          result.group,

        member:
          result.member,

        history:
          result.history,

        scoreTransaction:
          result.scoreTransaction,

        message:
          "Ghi nhận kết quả Bible Challenge thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function getCurrentSessionHistory(
  req,
  res,
  next
) {
  try {
    const result =
      await bibleChallengeService
        .getCurrentSessionHistory();

    if (!result.success) {
      return sendError(res, result);
    }

    return res.status(200).json({
      success: true,

      data: {
        session:
          result.session,

        history:
          result.history,

        rounds:
          result.rounds,

        totalHistory:
          result.totalHistory,

        totalSelections:
          result.totalSelections,
      },
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  getCurrentChallenge,
  drawGroup,
  drawMember,
  submitResult,
  getCurrentSessionHistory,
};
