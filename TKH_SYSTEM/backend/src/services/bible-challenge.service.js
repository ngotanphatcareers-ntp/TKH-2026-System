const {
  getPool,
  sql,
} = require("../config/database");


const {
  findCurrentOpenSessionForActivity,
} = require("../repositories/session.repository");

const {
  findCurrentRoundNumber,
  findEligibleGroups,
  findAllGroupsWithEligibleMembers,
  findUsedGroupsInRound,
  createRoundSelection,
  findLatestRoundSelection,
  findGroupById,
  findEligibleMembersByGroup,
  findRewardMemberships,
  findMembershipForChallenge,
  createHistoryRecord,
  findHistoryBySession,
  findRoundHistoryBySession,
  countCheckedInMembers,
  countCompletedMembers,
} = require(
  "../repositories/bible-challenge.repository"
);

const {
  findScoreTransactionsBySeasonMembershipId,
  createScoreTransaction,
} = require("../repositories/score.repository");


const RESULT_POINTS = Object.freeze({
  FULL: 10,
  FAILED: 0,
  SKIPPED: 0,
});

const RESULT_LABELS = Object.freeze({
  FULL: "Trả lời đúng",
  FAILED: "Trả lời sai",
  SKIPPED: "Bỏ qua",
});

const MAX_BIBLE_CHALLENGE_POINTS = 60;


function normalizePositiveInteger(value) {
  const normalizedValue = Number(value);

  if (
    !Number.isInteger(normalizedValue) ||
    normalizedValue <= 0
  ) {
    return null;
  }

  return normalizedValue;
}


function randomItem(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * items.length
  );

  return items[randomIndex];
}


function mapSession(session) {
  if (!session) {
    return null;
  }

  return {
    id: Number(session.id),
    seasonId: Number(session.season_id),
    name: session.name,
    sessionNo:
      session.session_no !== null
        ? Number(session.session_no)
        : null,
    scheduledStartAt:
      session.scheduled_start_at,
    scheduledEndAt:
      session.scheduled_end_at,
    status: session.status,

    season: {
      code: session.season_code,
      name: session.season_name,
      status: session.season_status,
    },
  };
}


function mapGroup(group) {
  if (!group) {
    return null;
  }

  return {
    id: Number(group.id),
    seasonId:
      group.season_id !== undefined
        ? Number(group.season_id)
        : undefined,
    code:
      group.code ||
      group.group_code ||
      null,
    name:
      group.name ||
      group.group_name ||
      null,
    logoPath:
      group.logo_path ||
      group.group_logo_path ||
      null,
    displayOrder:
      group.display_order !== undefined
        ? Number(group.display_order)
        : null,
    eligibleMemberCount:
      group.eligible_member_count !== undefined
        ? Number(group.eligible_member_count)
        : undefined,
  };
}


function mapMember(member) {
  if (!member) {
    return null;
  }

  return {
    seasonMembershipId:
      Number(member.season_membership_id),

    memberId:
      Number(member.member_id),

    tkhCode:
      member.tkh_code,

    fullName:
      member.full_name,

    avatarFilename:
      member.avatar_filename,

    attendanceRecordId:
      member.attendance_record_id !== null
        ? Number(member.attendance_record_id)
        : null,

    checkedInAt:
      member.checked_in_at,

    group: {
      id: Number(member.group_id),
      code: member.group_code,
      name: member.group_name,
      logoPath: member.group_logo_path,
    },
  };
}


function mapRoundSelection(selection) {
  if (!selection) {
    return null;
  }

  return {
    id: Number(selection.id),
    roundNo: Number(selection.round_no),

    group: {
      id: Number(selection.group_id),
      code: selection.group_code,
      name: selection.group_name,
      logoPath:
        selection.group_logo_path,
    },

    createdByUserId:
      selection.created_by_user_id !== null
        ? Number(
            selection.created_by_user_id
          )
        : null,

    createdAt:
      selection.created_at,
  };
}


function mapHistoryItem(item) {
  return {
    id: Number(item.id),

    seasonId:
      Number(item.season_id),

    sessionId:
      Number(item.session_id),

    result:
      item.result,

    resultLabel:
      RESULT_LABELS[item.result] ||
      item.result,

    awardedPoints:
      Number(item.awarded_points) || 0,

    source:
      item.source,

    group: {
      id: Number(item.group_id),
      code: item.group_code,
      name: item.group_name,
      logoPath:
        item.group_logo_path,
    },

    member:
      item.season_membership_id
        ? {
            seasonMembershipId:
              Number(
                item.season_membership_id
              ),

            memberId:
              item.member_id !== null
                ? Number(item.member_id)
                : null,

            tkhCode:
              item.tkh_code,

            fullName:
              item.full_name,

            avatarFilename:
              item.avatar_filename,
          }
        : null,

    createdBy:
      item.created_by_user_id
        ? {
            id: Number(
              item.created_by_user_id
            ),

            username:
              item.created_by_username ||
              null,
          }
        : null,

    createdAt:
      item.created_at,
  };
}


async function getCurrentSessionOrError() {
  const session =
    await findCurrentOpenSessionForActivity();

  if (!session) {
    return {
      success: false,
      code:
        "OPEN_ACTIVITY_SESSION_NOT_FOUND",
    };
  }

  return {
    success: true,
    session,
  };
}


async function calculateExistingBibleChallengePoints(
  seasonMembershipId
) {
  const transactions =
    await findScoreTransactionsBySeasonMembershipId(
      seasonMembershipId
    );

  return transactions
    .filter(transaction => {
      const status =
        transaction.status ||
        transaction.transactionStatus;

      const scoreType =
        transaction.scoreType ||
        transaction.score_type;

      return (
        status === "ACTIVE" &&
        scoreType === "BIBLE_CHALLENGE"
      );
    })
    .reduce((total, transaction) => {
      const appliedPoints =
        transaction.appliedPoints ??
        transaction.applied_points ??
        0;

      return total +
        (Number(appliedPoints) || 0);
    }, 0);
}


async function getCurrentChallenge() {
  const sessionResult =
    await getCurrentSessionOrError();

  if (!sessionResult.success) {
    return {
      ...sessionResult,
      session: null,
      currentRoundNo: null,
      latestSelection: null,
      eligibleGroups: [],
      usedGroups: [],
      progress: {
        checkedInCount: 0,
        completedCount: 0,
        remainingCount: 0,
        completedPercent: 0,
      },
    };
  }

  const session = sessionResult.session;

  const seasonId =
    Number(session.season_id);

  const sessionId =
    Number(session.id);

  const currentRoundNo =
    await findCurrentRoundNumber({
      seasonId,
      sessionId,
    });

  const [
    eligibleGroups,
    usedGroups,
    latestSelection,
    checkedInCount,
    completedCount,
  ] = await Promise.all([
    findEligibleGroups({
      seasonId,
      sessionId,
      roundNo: currentRoundNo,
    }),

    findUsedGroupsInRound({
      seasonId,
      sessionId,
      roundNo: currentRoundNo,
    }),

    findLatestRoundSelection({
      seasonId,
      sessionId,
    }),

    countCheckedInMembers({
      seasonId,
      sessionId,
    }),

    countCompletedMembers({
      seasonId,
      sessionId,
    }),
  ]);

  const remainingCount = Math.max(
    checkedInCount - completedCount,
    0
  );

  const completedPercent =
    checkedInCount > 0
      ? Number(
          (
            (completedCount /
              checkedInCount) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    success: true,

    session:
      mapSession(session),

    currentRoundNo,

    latestSelection:
      mapRoundSelection(
        latestSelection
      ),

    eligibleGroups:
      eligibleGroups.map(mapGroup),

    usedGroups:
      usedGroups.map(
        mapRoundSelection
      ),

    progress: {
      checkedInCount,
      completedCount,
      remainingCount,
      completedPercent,
    },
  };
}


async function drawGroup({
  adminUserId,
}) {
  const normalizedAdminUserId =
    normalizePositiveInteger(
      adminUserId
    );

  if (!normalizedAdminUserId) {
    return {
      success: false,
      code: "ADMIN_ACCOUNT_REQUIRED",
    };
  }

  const sessionResult =
    await getCurrentSessionOrError();

  if (!sessionResult.success) {
    return sessionResult;
  }

  const session =
    sessionResult.session;

  const seasonId =
    Number(session.season_id);

  const sessionId =
    Number(session.id);

  const allGroups =
    await findAllGroupsWithEligibleMembers({
      seasonId,
      sessionId,
    });

  if (allGroups.length === 0) {
    return {
      success: false,
      code:
        "NO_ELIGIBLE_MEMBERS_REMAINING",
      session: mapSession(session),
    };
  }

  let roundNo =
    await findCurrentRoundNumber({
      seasonId,
      sessionId,
    });

  let eligibleGroups =
    await findEligibleGroups({
      seasonId,
      sessionId,
      roundNo,
    });

  let startedNewRound = false;

  if (eligibleGroups.length === 0) {
    roundNo += 1;
    eligibleGroups = allGroups;
    startedNewRound = true;
  }

  const selectedGroup =
    randomItem(eligibleGroups);

  if (!selectedGroup) {
    return {
      success: false,
      code:
        "ELIGIBLE_GROUP_NOT_FOUND",
    };
  }


  const selectedGroupMembers =
    await findEligibleMembersByGroup({
      seasonId,
      sessionId,
      groupId:
        Number(selectedGroup.id),
    });

  try {
    const selection =
      await createRoundSelection({
        seasonId,
        sessionId,
        roundNo,
        groupId:
          Number(selectedGroup.id),
        createdByUserId:
          normalizedAdminUserId,
      });

    return {
      success: true,

      session:
        mapSession(session),

      roundNo,

      startedNewRound,

      group:
        mapGroup(selectedGroup),

      eligibleMembers:
        selectedGroupMembers.map(
          mapMember
        ),

      eligibleMemberCount:
        selectedGroupMembers.length,

      selection: {
        id: Number(selection.id),
        roundNo:
          Number(selection.round_no),
        groupId:
          Number(selection.group_id),
        createdByUserId:
          selection.created_by_user_id !== null
            ? Number(
                selection.created_by_user_id
              )
            : null,
        createdAt:
          selection.created_at,
      },

      remainingGroupCountInRound:
        Math.max(
          eligibleGroups.length - 1,
          0
        ),
    };
  } catch (error) {
    if (
      error.number === 2601 ||
      error.number === 2627
    ) {
      return {
        success: false,
        code:
          "GROUP_ALREADY_SELECTED_IN_ROUND",
      };
    }

    throw error;
  }
}


async function drawMember({
  groupId,
}) {
  const normalizedGroupId =
    normalizePositiveInteger(groupId);

  if (!normalizedGroupId) {
    return {
      success: false,
      code: "INVALID_GROUP_ID",
    };
  }

  const sessionResult =
    await getCurrentSessionOrError();

  if (!sessionResult.success) {
    return sessionResult;
  }

  const session =
    sessionResult.session;

  const seasonId =
    Number(session.season_id);

  const sessionId =
    Number(session.id);

  const group =
    await findGroupById({
      seasonId,
      groupId:
        normalizedGroupId,
    });

  if (
    !group ||
    Number(group.is_active) !== 1
  ) {
    return {
      success: false,
      code:
        "ACTIVE_GROUP_NOT_FOUND",
    };
  }

  const latestSelection =
    await findLatestRoundSelection({
      seasonId,
      sessionId,
    });

  if (
    !latestSelection ||
    Number(
      latestSelection.group_id
    ) !== normalizedGroupId
  ) {
    return {
      success: false,
      code:
        "GROUP_IS_NOT_LATEST_SELECTION",
    };
  }

  const eligibleMembers =
    await findEligibleMembersByGroup({
      seasonId,
      sessionId,
      groupId:
        normalizedGroupId,
    });

  if (eligibleMembers.length === 0) {
    return {
      success: false,
      code:
        "NO_ELIGIBLE_MEMBER_IN_GROUP",
      group: mapGroup(group),
    };
  }

  const selectedMember =
    randomItem(eligibleMembers);

  return {
    success: true,

    session:
      mapSession(session),

    roundNo:
      Number(
        latestSelection.round_no
      ),

    group:
      mapGroup(group),

    member:
      mapMember(selectedMember),

    eligibleMemberCount:
      eligibleMembers.length,
  };
}


async function submitResult({
  groupId,
  seasonMembershipId,
  result,
  adminUserId,
}) {
  const normalizedGroupId =
    normalizePositiveInteger(groupId);

  const normalizedMembershipId =
    normalizePositiveInteger(
      seasonMembershipId
    );

  const normalizedAdminUserId =
    normalizePositiveInteger(
      adminUserId
    );

  const normalizedResult =
    String(result || "")
      .trim()
      .toUpperCase();

  if (!normalizedGroupId) {
    return {
      success: false,
      code: "INVALID_GROUP_ID",
    };
  }

  if (!normalizedMembershipId) {
    return {
      success: false,
      code:
        "INVALID_SEASON_MEMBERSHIP_ID",
    };
  }

  if (!normalizedAdminUserId) {
    return {
      success: false,
      code: "ADMIN_ACCOUNT_REQUIRED",
    };
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      RESULT_POINTS,
      normalizedResult
    )
  ) {
    return {
      success: false,
      code:
        "INVALID_CHALLENGE_RESULT",
      allowedResults:
        Object.keys(RESULT_POINTS),
    };
  }

  const sessionResult =
    await getCurrentSessionOrError();

  if (!sessionResult.success) {
    return sessionResult;
  }

  const session =
    sessionResult.session;

  const seasonId =
    Number(session.season_id);

  const sessionId =
    Number(session.id);

  const latestSelection =
    await findLatestRoundSelection({
      seasonId,
      sessionId,
    });

  if (
    !latestSelection ||
    Number(
      latestSelection.group_id
    ) !== normalizedGroupId
  ) {
    return {
      success: false,
      code:
        "GROUP_IS_NOT_LATEST_SELECTION",
    };
  }

  const membership =
    await findMembershipForChallenge({
      seasonId,
      sessionId,
      groupId:
        normalizedGroupId,
      seasonMembershipId:
        normalizedMembershipId,
    });

  if (!membership) {
    return {
      success: false,
      code:
        "ELIGIBLE_MEMBERSHIP_NOT_FOUND",
    };
  }

  if (
    Number(membership.already_used) === 1
  ) {
    return {
      success: false,
      code:
        "MEMBER_ALREADY_USED_IN_SESSION",
    };
  }

  /*
   * FULL:
   * Cộng 10 cho toàn bộ thành viên
   * thuộc nhóm vừa được random.
   *
   * FAILED:
   * Nhóm vừa được random không bị trừ.
   * Cộng 10 cho toàn bộ thành viên
   * thuộc các nhóm còn lại.
   *
   * SKIPPED:
   * Không cộng điểm cho nhóm nào.
   */
  let rewardMode = null;

  if (normalizedResult === "FULL") {
    rewardMode = "SELECTED_GROUP";
  }

  if (normalizedResult === "FAILED") {
    rewardMode = "OTHER_GROUPS";
  }

  const requestedPoints =
    normalizedResult === "SKIPPED"
      ? 0
      : 10;


  const selectedGroupAwardedPoints =
    normalizedResult === "FULL"
      ? 10
      : 0;

  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  await transaction.begin();

  try {
    const rewardMemberships =
      rewardMode
        ? await findRewardMemberships({
            seasonId,
            selectedGroupId:
              normalizedGroupId,
            rewardMode,
            transaction,
          })
        : [];

    /*
     * History chỉ ghi nhận học viên đại diện
     * được random và kết quả đúng/sai/bỏ qua.
     */
    const history =
      await createHistoryRecord({
        seasonId,
        sessionId,
        groupId:
          normalizedGroupId,
        seasonMembershipId:
          normalizedMembershipId,
        result:
          normalizedResult,
        awardedPoints:
          selectedGroupAwardedPoints,
        source:
          "RANDOMIZER",
        createdByUserId:
          normalizedAdminUserId,
        transaction,
      });

    const scoreTransactions = [];

    let rewardedMemberCount = 0;
    let cappedMemberCount = 0;
    let totalAppliedPoints = 0;

    const rewardedGroupMap =
      new Map();

    for (
      const rewardMembership
      of rewardMemberships
    ) {
      const rewardMembershipId =
        Number(
          rewardMembership
            .season_membership_id
        );

      const existingPoints =
        Number(
          rewardMembership
            .existing_bible_challenge_points
        ) || 0;

      const remainingPoints =
        Math.max(
          MAX_BIBLE_CHALLENGE_POINTS -
            existingPoints,
          0
        );

      const appliedPoints =
        Math.min(
          requestedPoints,
          remainingPoints
        );

      const rewardGroupId =
        Number(
          rewardMembership.group_id
        );

      if (
        !rewardedGroupMap.has(
          rewardGroupId
        )
      ) {
        rewardedGroupMap.set(
          rewardGroupId,
          {
            id: rewardGroupId,
            code:
              rewardMembership
                .group_code,
            name:
              rewardMembership
                .group_name,
            rewardedMemberCount: 0,
            cappedMemberCount: 0,
            totalAppliedPoints: 0,
          }
        );
      }

      const groupSummary =
        rewardedGroupMap.get(
          rewardGroupId
        );

      /*
       * Người đã đủ 60 điểm không tạo thêm
       * giao dịch 0 điểm.
       */
      if (appliedPoints <= 0) {
        cappedMemberCount += 1;
        groupSummary.cappedMemberCount += 1;
        continue;
      }

      const scoreTransaction =
        await createScoreTransaction({
          seasonMembershipId:
            rewardMembershipId,

          scoreCategory:
            "LEARNING",

          scoreType:
            "BIBLE_CHALLENGE",

          requestedPoints,

          appliedPoints,

          sourceType:
            "BIBLE_CHALLENGE",

          sourceId:
            Number(history.id),

          sourceKey:
            `BIBLE_CHALLENGE_HISTORY_${history.id}_MEMBERSHIP_${rewardMembershipId}`,

          description:
            normalizedResult === "FULL"
              ? (
                  `Bible Challenge - ${session.name} - ` +
                  `Nhóm ${membership.group_name} trả lời đúng`
                )
              : (
                  `Bible Challenge - ${session.name} - ` +
                  `Nhóm ${membership.group_name} trả lời sai, ` +
                  `nhóm khác được cộng điểm`
                ),

          createdByUserId:
            normalizedAdminUserId,

          transaction,
        });

      scoreTransactions.push(
        scoreTransaction
      );

      rewardedMemberCount += 1;
      totalAppliedPoints +=
        appliedPoints;

      groupSummary
        .rewardedMemberCount += 1;

      groupSummary
        .totalAppliedPoints +=
          appliedPoints;

      if (
        existingPoints +
          appliedPoints >=
        MAX_BIBLE_CHALLENGE_POINTS
      ) {
        cappedMemberCount += 1;
        groupSummary
          .cappedMemberCount += 1;
      }
    }

    await transaction.commit();

    const rewardedGroups =
      Array.from(
        rewardedGroupMap.values()
      );

    return {
      success: true,

      session:
        mapSession(session),

      roundNo:
        Number(
          latestSelection.round_no
        ),

      result:
        normalizedResult,

      resultLabel:
        RESULT_LABELS[
          normalizedResult
        ],

      /*
       * Giữ các trường này để frontend cũ
       * chưa bị lỗi trước khi sửa ở bước sau.
       */
      requestedPoints,

      appliedPoints:
        selectedGroupAwardedPoints,

      reachedMaximum:
        cappedMemberCount > 0,

      maximumPoints:
        MAX_BIBLE_CHALLENGE_POINTS,

      existingPointsBefore:
        null,

      totalPointsAfter:
        null,

      group: {
        id:
          Number(
            membership.group_id
          ),
        code:
          membership.group_code,
        name:
          membership.group_name,
        logoPath:
          membership
            .group_logo_path,
      },

      member:
        mapMember(membership),

      history: {
        id:
          Number(history.id),
        createdAt:
          history.created_at,
      },

      /*
       * Trường cũ: giữ giao dịch đầu tiên
       * để controller/frontend không lỗi.
       */
      scoreTransaction:
        scoreTransactions[0] ||
        null,

      rewardSummary: {
        rewardMode,
        rewardedGroupCount:
          rewardedGroups.length,
        rewardedMemberCount,
        cappedMemberCount,
        totalAppliedPoints,
        rewardedGroups,
      },
    };
  } catch (error) {
    if (
      transaction._aborted !== true
    ) {
      await transaction.rollback();
    }

    if (
      error.number === 2601 ||
      error.number === 2627
    ) {
      return {
        success: false,
        code:
          "BIBLE_CHALLENGE_RESULT_ALREADY_RECORDED",
      };
    }

    throw error;
  }
}


async function getCurrentSessionHistory() {
  const sessionResult =
    await getCurrentSessionOrError();

  if (!sessionResult.success) {
    return {
      ...sessionResult,
      session: null,
      history: [],
      rounds: [],
    };
  }

  const session =
    sessionResult.session;

  const seasonId =
    Number(session.season_id);

  const sessionId =
    Number(session.id);

  const [
    history,
    rounds,
  ] = await Promise.all([
    findHistoryBySession({
      seasonId,
      sessionId,
    }),

    findRoundHistoryBySession({
      seasonId,
      sessionId,
    }),
  ]);

  return {
    success: true,

    session:
      mapSession(session),

    history:
      history.map(mapHistoryItem),

    rounds:
      rounds.map(
        mapRoundSelection
      ),

    totalHistory:
      history.length,

    totalSelections:
      rounds.length,
  };
}


module.exports = {
  getCurrentChallenge,
  drawGroup,
  drawMember,
  submitResult,
  getCurrentSessionHistory,
};
