const {
  randomUUID,
  createHash,
} = require("node:crypto");

const {
  getPool,
  sql,
} = require(
  "../config/database"
);

const scoreConfig = require(
  "../config/score.config"
);

const {
  parseManualScoresExcel,
} = require(
  "../utils/parse-manual-scores-excel"
);


const {
    findAdminScoreHistory,
    findActiveExamScoreForMembership,
  findActiveMembershipByMemberId,
  findActiveMembershipByUsername,
  findActiveGroupById,
  findGroupScoreHistory,
  createGroupScoreTransaction,
  findScoreTransactionsBySeasonMembershipId,
  createScoreTransaction,
  findAllActiveGroupScoreBases,
  findActiveGroupMemberScoreTransactions,
  findActiveMemberScoreTransactions,
findManualScoreImportBatchByKey,
createManualScoreImportBatch,
completeManualScoreImportBatch,

findGroupDisciplineScoreByGroupId,
findActiveGroupMembershipsForDiscipline,
createGroupDisciplineScore,
updateGroupDisciplineScore,
createGroupDisciplineScoreHistory,
createGroupDisciplineScoreMember,
findGroupDisciplineScoreMembers,
reverseScoreTransaction,
updateGroupDisciplineScoreMemberTransactions,
} = require("../repositories/score.repository");

const {
  calculateMemberSummary,
} = require("../utils/score-calculator");


const ADMIN_SOURCE_TYPES = new Set([
  "MANUAL",
  "MEMORY_VERSE",
  "GAME",
  "LATE",
  "OTHER",
]);

const ADMIN_SCORE_TYPE_BY_SOURCE_TYPE = {
  MANUAL: "PARTICIPATION",
  MEMORY_VERSE: "PARTICIPATION",
  GAME: "PARTICIPATION",
  LATE: "DISCIPLINE_COMPLIANCE",
  OTHER: "PARTICIPATION",
};

const SOURCE_TYPE_LABELS = {
  MANUAL: "Điểm thủ công",
  ATTENDANCE: "Điểm danh",
  DEVOTION: "Tĩnh nguyện",
  MEMORY_VERSE: "Thuộc câu gốc",
  GAME: "Trò chơi",
  LATE: "Đi trễ",
  BIBLE_CHALLENGE: "Bible Challenge",
  TEST: "Bài kiểm tra",
  OTHER: "Khác",
};

const SCORE_TYPE_CATEGORY = {
  ATTENDANCE: "ATTENDANCE",
  ATTENDANCE_ADJUSTMENT: "ATTENDANCE",

  PRE_TEST: "LEARNING",
  BIBLE_CHALLENGE: "LEARNING",
  PARTICIPATION: "LEARNING",
  FINAL_TEST: "LEARNING",

  DISCIPLINE_CLEANING: "DISCIPLINE",
  DISCIPLINE_COMPLIANCE: "DISCIPLINE",
  DISCIPLINE_SPIRIT: "DISCIPLINE",
};

const SCORE_TYPES =
  new Set(
    Object.keys(
      SCORE_TYPE_CATEGORY
    )
  );


function getSourceTypeLabel(sourceType) {
  return (
    SOURCE_TYPE_LABELS[sourceType] ||
    sourceType ||
    "Không xác định"
  );
}

function getScoreTypeLabel(
  scoreType
) {
  const labels = {
    ATTENDANCE:
      "Điểm danh",

    ATTENDANCE_ADJUSTMENT:
      "Điểm danh thủ công",

    PRE_TEST:
      "Pre-test",

    BIBLE_CHALLENGE:
      "Bible Challenge",

    PARTICIPATION:
      "Phát biểu",

    FINAL_TEST:
      "Final Test",

    DISCIPLINE_CLEANING:
      "Trực nhật",

    DISCIPLINE_COMPLIANCE:
      "Tuân thủ",

    DISCIPLINE_SPIRIT:
      "Tinh thần",
  };

  return (
    labels[scoreType] ||
    scoreType ||
    "Không xác định"
  );
}


function mapSeason(membership) {
  return {
    id: membership.season_id,
    code: membership.season_code,
    name: membership.season_name,
  };
}


function mapGroup(membership) {
  if (!membership.group_id) {
    return null;
  }

  return {
    id: membership.group_id,
    code: membership.group_code,
    name: membership.group_name,
  };
}


function mapMember(membership) {
  return {
    seasonMembershipId:
        Number(membership.season_membership_id),
    memberId: membership.member_id,
    tkhCode: membership.tkh_code,
    username: membership.username,
    fullName: membership.full_name,
    group: mapGroup(membership),
  };
}


function mapSummary(summary) {
  return {
    totalPoints:
      Number(summary.total_points) || 0,

    attendancePoints:
      Number(summary.attendance_points) || 0,

    devotionPoints:
      Number(summary.devotion_points) || 0,

    otherPoints:
      Number(summary.other_points) || 0,

    totalTransactions:
      Number(summary.total_transactions) || 0,
  };
}


function mapHistoryItem(item) {
  return {
    id: item.id,
    seasonMembershipId:
        Number(item.season_membership_id),
    points: Number(item.points) || 0,
    sourceType: item.source_type,
    sourceTypeLabel:
      getSourceTypeLabel(item.source_type),
    sourceId: item.source_id,
    description: item.description,
    status: item.status,

    createdBy: item.created_by_user_id
      ? {
          id: item.created_by_user_id,
          username:
            item.created_by_username || null,
        }
      : null,

    createdAt: item.created_at,
  };
}


function mapCreatedTransaction(
  transaction,
  membership
) {
  return {
    id: transaction.id,
    seasonMembershipId:
        Number(transaction.season_membership_id),
    points: Number(transaction.points) || 0,
    sourceType: transaction.source_type,
    sourceTypeLabel:
      getSourceTypeLabel(
        transaction.source_type
      ),
    sourceId: transaction.source_id,
    description: transaction.description,
    status: transaction.status,

    member: {
      seasonMembershipId:
        Number(membership.season_membership_id),
      memberId: membership.member_id,
      tkhCode: membership.tkh_code,
      username: membership.username,
      fullName: membership.full_name,
    },

    group: mapGroup(membership),

    createdByUserId:
      transaction.created_by_user_id,

    createdAt: transaction.created_at,
  };
}


function mapGroupScoreSummary(summary) {
  return {
    individualPoints:
      Number(summary.individual_points) || 0,

    groupPoints:
      Number(summary.group_points) || 0,

    totalPoints:
      Number(summary.total_points) || 0,
  };
}


function mapGroupScoreHistoryItem(item) {
  return {
    id: Number(item.id),
    groupId: Number(item.group_id),
    points: Number(item.points) || 0,

    sourceType: item.source_type,

    sourceTypeLabel:
      getSourceTypeLabel(item.source_type),

    sourceId:
      item.source_id !== null
        ? Number(item.source_id)
        : null,

    description: item.description,
    status: item.status,

    createdBy: item.created_by_user_id
      ? {
          id: Number(
            item.created_by_user_id
          ),

          username:
            item.created_by_username || null,
        }
      : null,

    createdAt: item.created_at,
  };
}


function mapGroupRankingItem(item) {
  return {
    ranking: Number(item.ranking),

    group: {
      id: Number(item.group_id),
      code: item.group_code,
      name: item.group_name,
    },

    individualPoints:
      Number(item.individual_points) || 0,

    groupPoints:
      Number(item.group_points) || 0,

    totalPoints:
      Number(item.total_points) || 0,
  };
}

function mapCreatedGroupScoreTransaction(
  transaction,
  group
) {
  return {
    id: Number(transaction.id),

    groupId: Number(
      transaction.group_id
    ),

    points:
      Number(transaction.points) || 0,

    sourceType:
      transaction.source_type,

    sourceTypeLabel:
      getSourceTypeLabel(
        transaction.source_type
      ),

    sourceId:
      transaction.source_id !== null
        ? Number(transaction.source_id)
        : null,

    description:
      transaction.description,

    status:
      transaction.status,

    group: {
      id: Number(group.group_id),
      code: group.group_code,
      name: group.group_name,
    },

    createdByUserId:
      transaction.created_by_user_id !== null
        ? Number(
            transaction.created_by_user_id
          )
        : null,

    createdAt:
      transaction.created_at,
  };
}


async function getMemberScoreSummary(memberId) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  const transactions =
    await findScoreTransactionsBySeasonMembershipId(
      membership.season_membership_id
    );

  const score =
    calculateMemberSummary(
      transactions
    );

  return {
    success: true,
    season: mapSeason(membership),
    member: mapMember(membership),
    score,
  };
}

function sumActiveScoreByTypes(
  transactions,
  scoreTypes
) {
  return transactions
    .filter(transaction =>
      transaction.status ===
        scoreConfig.transactionStatuses.active &&
      scoreTypes.includes(
        transaction.scoreType
      )
    )
    .reduce(
      (total, transaction) =>
        total +
        (
          Number(
            transaction.appliedPoints
          ) || 0
        ),
      0
    );
}

async function createAdminScoreTransaction({
  username,
  scoreType,
  requestedPoints,
  sourceType,
  sourceId = null,
  description,
  adminUserId,
}) {
  const normalizedUsername =
    String(username || "").trim();

    if (!normalizedUsername) {
    return {
        success: false,
        code: "USERNAME_REQUIRED",
    };
    }

    const normalizedScoreType =
    String(scoreType || "").trim().toUpperCase();

    if (!SCORE_TYPES.has(normalizedScoreType)) {
    return {
        success: false,
        code: "INVALID_SCORE_TYPE",
    };
    }

    const normalizedRequestedPoints =
    Number(requestedPoints);

    if (
    !Number.isFinite(normalizedRequestedPoints)
    ) {
    return {
        success: false,
        code: "INVALID_POINTS",
    };
    }

    const normalizedSourceType =
    String(sourceType || "").trim().toUpperCase();

    if (!normalizedSourceType) {
    return {
        success: false,
        code: "SOURCE_TYPE_REQUIRED",
    };
    }

    const normalizedDescription =
    String(description || "").trim();

    if (!normalizedDescription) {
    return {
        success: false,
        code: "DESCRIPTION_REQUIRED",
    };
    }

    if (normalizedDescription.length > 500) {
    return {
        success: false,
        code: "DESCRIPTION_TOO_LONG",
        maximumLength: 500,
    };
    }

    const normalizedAdminUserId =
    Number(adminUserId);

    if (
    !Number.isInteger(normalizedAdminUserId) ||
    normalizedAdminUserId <= 0
    ) {
    return {
        success: false,
        code: "ADMIN_USER_REQUIRED",
    };
    }

    const scoreCategory =
        SCORE_TYPE_CATEGORY[
            normalizedScoreType
        ];

        const membership =
        await findActiveMembershipByUsername(
            normalizedUsername
        );

        if (!membership) {
        return {
            success: false,
            code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
        };
        }

        const existingTransactions =
            await findScoreTransactionsBySeasonMembershipId(
                membership.season_membership_id
            );


            let normalizedExamId = null;

            if (
            normalizedScoreType === "PRE_TEST" ||
            normalizedScoreType === "FINAL_TEST"
            ) {
            normalizedExamId =
                Number(sourceId);

            if (
                !Number.isInteger(
                normalizedExamId
                ) ||
                normalizedExamId <= 0
            ) {
                return {
                success: false,
                code:
                    "EXAM_ID_REQUIRED",
                };
            }
            }

            /*
            * Giai đoạn 1 chỉ cho phép Admin cộng:
            * - Điểm danh bù: +3 hoặc +5
            * - Phát biểu: +2
            */
        const allowedManualScoreTypes = [
            "ATTENDANCE_ADJUSTMENT",
            "PARTICIPATION",
            "PRE_TEST",
            "FINAL_TEST",
            ];

            if (
            !allowedManualScoreTypes.includes(
                normalizedScoreType
            )
            ) {
            return {
                success: false,
                code:
                "MANUAL_SCORE_TYPE_NOT_ALLOWED",
            };
            }

            /*
            * Điểm danh thủ công.
            */
            if (
            normalizedScoreType ===
            "ATTENDANCE_ADJUSTMENT"
            ) {
            const allowedAttendanceAdjustmentPoints =
                [-5, -3, 3, 5];

                if (
                !allowedAttendanceAdjustmentPoints.includes(
                    normalizedRequestedPoints
                )
                ) {
                return {
                    success: false,
                    code:
                    "INVALID_ATTENDANCE_ADJUSTMENT_POINTS",

                    allowedPoints:
                    allowedAttendanceAdjustmentPoints,
                };
                }

            const currentAttendancePoints =
                sumActiveScoreByTypes(
                existingTransactions,
                [
                    "ATTENDANCE",
                    "ATTENDANCE_ADJUSTMENT"
                ]
                );

            const maximumAttendancePoints =
                scoreConfig.attendance.maxRawScore;

            const remainingPoints =
                Math.max(
                maximumAttendancePoints -
                    currentAttendancePoints,
                0
                );

            const attendancePointsAfterAdjustment =
                currentAttendancePoints +
                normalizedRequestedPoints;

                if (
                attendancePointsAfterAdjustment >
                maximumAttendancePoints
                ) {
                return {
                    success: false,
                    code:
                    "ATTENDANCE_SCORE_LIMIT_EXCEEDED",

                    currentPoints:
                    currentAttendancePoints,

                    maximumPoints:
                    maximumAttendancePoints,

                    remainingPoints,
                };
                }

                if (
                attendancePointsAfterAdjustment < 0
                ) {
                return {
                    success: false,
                    code:
                    "ATTENDANCE_SCORE_BELOW_ZERO",

                    currentPoints:
                    currentAttendancePoints,

                    minimumPoints: 0,
                };
                }
            /*
            * Đóng khối ATTENDANCE_ADJUSTMENT.
            */
            }    

            /*
            * Điểm phát biểu.
            */
            if (
            normalizedScoreType ===
            "PARTICIPATION"
            ) {
            if (
                normalizedRequestedPoints !==
                scoreConfig.learning
                .participation
                .pointsPerParticipation
            ) {
                return {
                success: false,
                code:
                    "INVALID_PARTICIPATION_POINTS",

                requiredPoints:
                    scoreConfig.learning
                    .participation
                    .pointsPerParticipation,
                };
            }

            const currentParticipationPoints =
                sumActiveScoreByTypes(
                existingTransactions,
                ["PARTICIPATION"]
                );

            const maximumParticipationPoints =
                scoreConfig.learning
                .participation
                .maxScore;

            const remainingPoints =
                Math.max(
                maximumParticipationPoints -
                    currentParticipationPoints,
                0
                );

            if (
                currentParticipationPoints +
                normalizedRequestedPoints >
                maximumParticipationPoints
            ) {
                return {
                success: false,
                code:
                    "PARTICIPATION_SCORE_LIMIT_EXCEEDED",

                currentPoints:
                    currentParticipationPoints,

                maximumPoints:
                    maximumParticipationPoints,

                remainingPoints,
                };
            }
            }


/*
 * Điểm thi giấy: Pre-test hoặc Final Test.
 */
if (
  normalizedScoreType === "PRE_TEST" ||
  normalizedScoreType === "FINAL_TEST"
) {
  if (
    !Number.isFinite(
      normalizedRequestedPoints
    ) ||
    normalizedRequestedPoints < 0
  ) {
    return {
      success: false,
      code:
        "INVALID_MANUAL_TEST_POINTS",
    };
  }

  const examScore =
    await findActiveExamScoreForMembership({
      seasonMembershipId:
        membership.season_membership_id,

      examId:
        normalizedExamId,
    });

  if (!examScore) {
    return {
      success: false,
      code:
        "EXAM_NOT_FOUND",
    };
  }

  const examType =
    String(
      examScore.examType || ""
    ).toUpperCase();

  if (
    examType !==
    normalizedScoreType
  ) {
    return {
      success: false,
      code:
        "EXAM_TYPE_MISMATCH",

      expectedType:
        normalizedScoreType,

      actualType:
        examType,
    };
  }

  const currentPoints =
    Number(
      examScore.currentPoints
    ) || 0;

  const maximumPoints =
    normalizedScoreType === "PRE_TEST"
      ? scoreConfig.learning
          .preTest
          .maxScorePerTest
      : scoreConfig.learning
          .finalTest
          .maxScore;

  const pointsAfterAdjustment =
    currentPoints +
    normalizedRequestedPoints;

  if (
    pointsAfterAdjustment >
    maximumPoints
  ) {
    return {
      success: false,
      code:
        "EXAM_SCORE_LIMIT_EXCEEDED",

      currentPoints,
      requestedPoints:
        normalizedRequestedPoints,
      maximumPoints,

      remainingPoints:
        Math.max(
          maximumPoints -
            currentPoints,
          0
        ),
    };
  }
}

        const appliedPoints =
        Math.round(
            normalizedRequestedPoints * 100
        ) / 100;

        const transactionSourceType =
        normalizedScoreType === "PRE_TEST" ||
        normalizedScoreType === "FINAL_TEST"
            ? "MANUAL_TEST"
            : normalizedSourceType;

        const transactionSourceId =
        normalizedScoreType === "PRE_TEST" ||
        normalizedScoreType === "FINAL_TEST"
            ? normalizedExamId
            : null;

        const sourceKey =
        normalizedScoreType === "PRE_TEST" ||
        normalizedScoreType === "FINAL_TEST"
            ? `${normalizedScoreType}:MANUAL_EXAM:${normalizedExamId}:${randomUUID()}`
            : `${normalizedScoreType}:MANUAL:${randomUUID()}`;

        const transaction =
        await createScoreTransaction({
            seasonMembershipId:
            membership.season_membership_id,

            scoreCategory,

            scoreType:
            normalizedScoreType,

            requestedPoints:
            normalizedRequestedPoints,

            appliedPoints,

            sourceType:
            transactionSourceType,

            sourceId:
            transactionSourceId,

            sourceKey,

            description:
            normalizedDescription,

            createdByUserId:
            normalizedAdminUserId,
        });

        if (!transaction) {
        return {
            success: false,
            code: "SCORE_TRANSACTION_NOT_CREATED",
        };
        }

        return {
        success: true,

        season: mapSeason(membership),

        member: mapMember(membership),

        transaction,
        };
}


function mapScoreTransactionHistoryItem(item) {
  return {
    id: Number(item.id),

    seasonMembershipId:
      Number(item.seasonMembershipId),

    // Giữ "points" để Frontend hiện tại vẫn đọc được.
    points:
      Number(item.appliedPoints) || 0,

    requestedPoints:
      Number(item.requestedPoints) || 0,

    appliedPoints:
      Number(item.appliedPoints) || 0,

    scoreCategory:
      item.scoreCategory,

    scoreType:
      item.scoreType,

    scoreTypeLabel:
      getScoreTypeLabel(
        item.scoreType
      ),

    sourceType:
      item.sourceType,

    sourceTypeLabel:
      getSourceTypeLabel(item.sourceType),

    sourceId:
      item.sourceId != null
        ? Number(item.sourceId)
        : null,

    sourceKey:
      item.sourceKey || null,

    description:
      item.description,

    status:
      item.status,

    createdBy:
      item.createdByUserId != null
        ? {
            id: Number(
              item.createdByUserId
            ),
            username: null,
          }
        : null,

    createdAt:
      item.createdAt,

    reversedByUserId:
      item.reversedByUserId != null
        ? Number(
            item.reversedByUserId
          )
        : null,

    reversedAt:
      item.reversedAt || null,

    reversalReason:
      item.reversalReason || null,
  };
}

async function getMyScores(memberId) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  const transactions =
    await findScoreTransactionsBySeasonMembershipId(
      membership.season_membership_id
    );

  const score =
    calculateMemberSummary(transactions);

  const activeTransactions =
    transactions.filter(
      item => item.status === "ACTIVE"
    );

  const otherPoints = Number(
    (
      score.learning.weightedScore +
      score.discipline.weightedScore
    ).toFixed(2)
  );

  return {
    success: true,

    season:
      mapSeason(membership),

    member:
      mapMember(membership),

    summary: {
      // Các trường cũ được giữ để chưa làm hỏng Frontend.
      totalPoints:
        score.final.score,

      attendancePoints:
        score.attendance.weightedScore,

      devotionPoints: 0,

      otherPoints,

      totalTransactions:
        activeTransactions.length,

      // Các trường chính thức của Score Foundation.
      learningPoints:
        score.learning.weightedScore,

      disciplinePoints:
        score.discipline.weightedScore,

      maxPoints:
        score.final.maxScore,

      details: score,
    },

    history:
      transactions.map(
        mapScoreTransactionHistoryItem
      ),
  };
}


function buildOfficialGroupRankings(
  groupBases,
  memberScoreRows
) {
  const membersByGroup = new Map();

  memberScoreRows.forEach(row => {
    const groupId = Number(row.groupId);

    const seasonMembershipId =
      Number(row.seasonMembershipId);

    if (!membersByGroup.has(groupId)) {
      membersByGroup.set(
        groupId,
        new Map()
      );
    }

    const groupMembers =
      membersByGroup.get(groupId);

    if (
      !groupMembers.has(
        seasonMembershipId
      )
    ) {
      groupMembers.set(
        seasonMembershipId,
        []
      );
    }

    if (
      row.id !== null &&
      row.id !== undefined
    ) {
      groupMembers
        .get(seasonMembershipId)
        .push(row);
    }
  });

  const totals = groupBases.map(group => {
    const groupId =
      Number(group.group_id);

    const groupMembers =
      membersByGroup.get(groupId) ||
      new Map();

    const memberTransactions =
  Array.from(
    groupMembers.values()
  );

const memberCount =
  memberTransactions.length;

const totalMemberPoints =
  memberTransactions.reduce(
    (total, transactions) => {
      const memberScore =
        calculateMemberSummary(
          transactions
        );

      return (
        total +
        Number(
          memberScore.final.score || 0
        )
      );
    },
    0
  );

const individualPoints = Number(
  (
    memberCount > 0
      ? totalMemberPoints /
        memberCount
      : 0
  ).toFixed(2)
);

    const groupPoints =
      Number(group.group_points) || 0;

    const totalPoints = Number(
      (
        individualPoints +
        groupPoints
      ).toFixed(2)
    );

    return {
      group: {
        id: groupId,
        code: group.group_code,
        name: group.group_name,
      },

      individualPoints,
      groupPoints,
      totalPoints,
    };
  });

  totals.sort((left, right) => {
    if (
      right.totalPoints !==
      left.totalPoints
    ) {
      return (
        right.totalPoints -
        left.totalPoints
      );
    }

    return left.group.name.localeCompare(
      right.group.name,
      "vi"
    );
  });

  let currentRanking = 0;
  let previousTotal = null;

  return totals.map((item, index) => {
    if (
      index === 0 ||
      item.totalPoints !== previousTotal
    ) {
      currentRanking += 1;
    }

    previousTotal =
      item.totalPoints;

    return {
      ranking: currentRanking,
      ...item,
    };
  });
}


function buildIndividualRankings(rows) {
  const members = new Map();

  rows.forEach(row => {
    const seasonMembershipId =
      Number(row.seasonMembershipId);

    if (!members.has(seasonMembershipId)) {
      members.set(seasonMembershipId, {
        seasonMembershipId,

        member: {
          id: Number(row.memberId),
          tkhCode: row.tkhCode || null,
          username: row.username || null,
          fullName:
            row.fullName ||
            "Không xác định",
        },

        group: row.groupId
          ? {
              id: Number(row.groupId),
              code: row.groupCode || null,
              name:
                row.groupName ||
                "Chưa phân nhóm",
            }
          : null,

        transactions: [],
      });
    }

    if (
      row.id !== null &&
      row.id !== undefined
    ) {
      members
        .get(seasonMembershipId)
        .transactions.push(row);
    }
  });

  const rankingRows =
    Array.from(members.values())
      .map(item => {
        const score =
          calculateMemberSummary(
            item.transactions
          );

        return {
          seasonMembershipId:
            item.seasonMembershipId,

          member: item.member,
          group: item.group,

          totalPoints:
            Number(score.final.score) || 0,
        };
      });

  rankingRows.sort((left, right) => {
    if (
      right.totalPoints !==
      left.totalPoints
    ) {
      return (
        right.totalPoints -
        left.totalPoints
      );
    }

    return left.member.fullName.localeCompare(
      right.member.fullName,
      "vi"
    );
  });

  let currentRanking = 0;
  let previousPoints = null;

  return rankingRows.map(
    (item, index) => {
      if (
        index === 0 ||
        item.totalPoints !== previousPoints
      ) {
        currentRanking = index + 1;
      }

      previousPoints =
        item.totalPoints;

      return {
        ranking: currentRanking,
        ...item,
      };
    }
  );
}


async function getIndividualRankings(memberId) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const rows =
    await findActiveMemberScoreTransactions();

  const rankings =
    buildIndividualRankings(rows);

  const myRanking =
    rankings.find(
      item =>
        item.member.id ===
        normalizedMemberId
    ) || null;

  return {
    success: true,

    top10:
      rankings.slice(0, 10),

    myRanking,

    total:
      rankings.length,
  };
}

async function getMyGroupScores(memberId) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  if (!membership.group_id) {
    return {
      success: false,
      code: "GROUP_NOT_ASSIGNED",
    };
  }

  const groupId =
    Number(membership.group_id);

  const [
    history,
    groupBases,
    memberScoreRows,
  ] = await Promise.all([
    findGroupScoreHistory(groupId),
    findAllActiveGroupScoreBases(),
    findActiveGroupMemberScoreTransactions(),
  ]);

  const rankings =
    buildOfficialGroupRankings(
      groupBases,
      memberScoreRows
    );

  const currentGroup =
    rankings.find(
      item => item.group.id === groupId
    ) || null;

  if (!currentGroup) {
    return {
      success: false,
      code: "GROUP_NOT_FOUND",
    };
  }

  return {
    success: true,

    season:
      mapSeason(membership),

    group:
      currentGroup.group,

    summary: {
      individualPoints:
        currentGroup.individualPoints,

      groupPoints:
        currentGroup.groupPoints,

      totalPoints:
        currentGroup.totalPoints,
    },

    ranking:
      currentGroup.ranking,

    history:
      history.map(
        mapGroupScoreHistoryItem
      ),
  };
}


async function getGroupRankings() {
  const [
    groupBases,
    memberScoreRows,
  ] = await Promise.all([
    findAllActiveGroupScoreBases(),
    findActiveGroupMemberScoreTransactions(),
  ]);

  const groups =
    buildOfficialGroupRankings(
      groupBases,
      memberScoreRows
    );

  return {
    success: true,
    groups,
    total: groups.length,
  };
}


async function createAdminGroupScore({
  groupId,
  points,
  sourceType,
  sourceId = null,
  description = null,
  createdByUserId,
}) {
  const normalizedGroupId =
    Number(groupId);

  const normalizedPoints =
    Number(points);

  const normalizedCreatedByUserId =
    Number(createdByUserId);

  const normalizedSourceType =
    typeof sourceType === "string"
      ? sourceType.trim().toUpperCase()
      : "";

  const allowedSourceTypes = [
    "MANUAL",
    "ATTENDANCE",
    "DEVOTION",
    "TEST",
    "BIBLE_CHALLENGE",
    "OTHER",
  ];

  if (
    !Number.isInteger(normalizedGroupId) ||
    normalizedGroupId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_GROUP_ID",
    };
  }

  if (
    !Number.isInteger(normalizedPoints) ||
    normalizedPoints === 0
  ) {
    return {
      success: false,
      code: "INVALID_POINTS",
    };
  }

  if (
    !allowedSourceTypes.includes(
      normalizedSourceType
    )
  ) {
    return {
      success: false,
      code: "INVALID_SOURCE_TYPE",
    };
  }

  if (
    !Number.isInteger(
      normalizedCreatedByUserId
    ) ||
    normalizedCreatedByUserId <= 0
  ) {
    return {
      success: false,
      code: "ADMIN_ACCOUNT_REQUIRED",
    };
  }

  let normalizedSourceId = null;

  if (
    sourceId !== null &&
    sourceId !== undefined &&
    sourceId !== ""
  ) {
    normalizedSourceId =
      Number(sourceId);

    if (
      !Number.isInteger(
        normalizedSourceId
      ) ||
      normalizedSourceId <= 0
    ) {
      return {
        success: false,
        code: "INVALID_SOURCE_ID",
      };
    }
  }

  const normalizedDescription =
    typeof description === "string"
      ? description.trim()
      : null;

  if (
    normalizedDescription &&
    normalizedDescription.length > 500
  ) {
    return {
      success: false,
      code: "DESCRIPTION_TOO_LONG",
    };
  }

  const group =
    await findActiveGroupById(
        normalizedGroupId
    );

  if (!group) {
    return {
      success: false,
      code: "GROUP_NOT_FOUND",
    };
  }

  const transaction =
    await createGroupScoreTransaction({
      groupId: normalizedGroupId,
      points: normalizedPoints,
      sourceType:
        normalizedSourceType,
      sourceId:
        normalizedSourceId,
      description:
        normalizedDescription || null,
      createdByUserId:
        normalizedCreatedByUserId,
    });

  if (!transaction) {
    return {
      success: false,
      code:
        "CREATE_GROUP_SCORE_FAILED",
    };
  }

  return {
    success: true,

    transaction:
      mapCreatedGroupScoreTransaction(
        transaction,
        group
      ),

    message:
      "Cập nhật điểm cho nhóm thành công.",
  };
}


async function createAdminIndividualScore({
  username,
  sourceType,
  points,
  description,
  adminUserId,
}) {
  const normalizedSourceType =
    typeof sourceType === "string"
      ? sourceType.trim().toUpperCase()
      : "";

  if (!normalizedSourceType) {
    return {
      success: false,
      code: "SOURCE_TYPE_REQUIRED",
    };
  }

  if (
    !ADMIN_SOURCE_TYPES.has(
      normalizedSourceType
    )
  ) {
    return {
      success: false,
      code: "INVALID_SCORE_SOURCE_TYPE",
    };
  }

  const normalizedPoints =
    Number(points);

  if (!Number.isInteger(normalizedPoints)) {
    return {
      success: false,
      code: "INVALID_POINTS",
    };
  }

  if (normalizedPoints === 0) {
    return {
      success: false,
      code: "ZERO_POINTS_NOT_ALLOWED",
    };
  }

  const scoreType =
    ADMIN_SCORE_TYPE_BY_SOURCE_TYPE[
      normalizedSourceType
    ];

  const result =
    await createAdminScoreTransaction({
      username,

      scoreType,

      requestedPoints:
        normalizedPoints,

      sourceType:
        normalizedSourceType,

      description,

      adminUserId,
    });

  if (!result.success) {
    return result;
  }

  const transaction =
    result.transaction;

  return {
    success: true,

    transaction: {
      id:
        Number(transaction.id),

      seasonMembershipId:
        Number(
          transaction.seasonMembershipId
        ),

      // Giữ field cũ cho Frontend.
      points:
        Number(
          transaction.appliedPoints
        ) || 0,

      requestedPoints:
        Number(
          transaction.requestedPoints
        ) || 0,

      appliedPoints:
        Number(
          transaction.appliedPoints
        ) || 0,

      scoreCategory:
        transaction.scoreCategory,

      scoreType:
        transaction.scoreType,

      sourceType:
        transaction.sourceType,

      sourceTypeLabel:
        getSourceTypeLabel(
          transaction.sourceType
        ),

      sourceId:
        transaction.sourceId != null
          ? Number(transaction.sourceId)
          : null,

      sourceKey:
        transaction.sourceKey || null,

      description:
        transaction.description,

      status:
        transaction.status,

      member:
        result.member,

      createdByUserId:
        transaction.createdByUserId != null
          ? Number(
              transaction.createdByUserId
            )
          : null,

      createdAt:
        transaction.createdAt,
    },
  };
}

async function getAdminScoreHistory({
  limit = 100,
} = {}) {
  const normalizedLimit =
    Number(limit);

  const safeLimit =
    Number.isInteger(normalizedLimit)
      ? Math.min(
          Math.max(normalizedLimit, 1),
          500
        )
      : 100;

  const result =
    await findAdminScoreHistory(
      safeLimit
    );

  const transactions =
    result.transactions.map(item => ({
      id:
        Number(item.id),

      seasonMembershipId:
        Number(
          item.seasonMembershipId
        ),

      scoreCategory:
        item.scoreCategory,

      scoreType:
        item.scoreType,

      scoreTypeLabel:
        getScoreTypeLabel(
          item.scoreType
        ),

      requestedPoints:
        Number(
          item.requestedPoints
        ) || 0,

      appliedPoints:
        Number(
          item.appliedPoints
        ) || 0,

      sourceType:
        item.sourceType,

      sourceTypeLabel:
        getSourceTypeLabel(
          item.sourceType
        ),

      sourceId:
        item.sourceId !== null &&
        item.sourceId !== undefined
          ? Number(item.sourceId)
          : null,

      sourceKey:
        item.sourceKey || null,

      description:
        item.description || "",

      status:
        item.status,

      createdBy:
        item.createdByUserId
          ? {
              id:
                Number(
                  item.createdByUserId
                ),

              username:
                item.createdByUsername ||
                null,
            }
          : null,

      createdAt:
        item.createdAt,

      member: {
        id:
          Number(item.memberId),

        seasonMembershipId:
          Number(
            item.seasonMembershipId
          ),

        tkhCode:
          item.tkhCode || null,

        username:
          item.username || null,

        fullName:
          item.fullName ||
          "Không xác định",
      },

      group:
        item.groupId
          ? {
              id:
                Number(item.groupId),

              code:
                item.groupCode ||
                null,

              name:
                item.groupName ||
                "Chưa phân nhóm",
            }
          : null,
    }));

  return {
    success: true,

    summary: {
      totalRecords:
        Number(
          result.summary.totalRecords
        ) || 0,

      totalAppliedPoints:
        Number(
          result.summary
            .totalAppliedPoints
        ) || 0,
    },

    transactions,
  };
}

function createManualScoreImportBatchKey(
  fileBuffer
) {
  if (
    !fileBuffer ||
    !Buffer.isBuffer(fileBuffer)
  ) {
    return "";
  }

  return createHash("sha256")
    .update(fileBuffer)
    .digest("hex");
}

async function validateManualScoreImport({
  fileBuffer,
}) {
  /*
   * Bước 1:
   * Kiểm tra cấu trúc và dữ liệu cơ bản
   * trong file Excel.
   */
  const parsed =
    parseManualScoresExcel(
      fileBuffer
    );

  if (!parsed.success) {
    return parsed;
  }

  const batchKey =
  createManualScoreImportBatchKey(
    fileBuffer
  );

const existingBatch =
  await findManualScoreImportBatchByKey({
    batchKey,
  });

if (
  existingBatch &&
  existingBatch.status === "COMPLETED"
) {
  return {
    success: false,

    code:
      "MANUAL_SCORE_IMPORT_ALREADY_COMPLETED",

    batch: existingBatch,

    errors: [],
  };
}

  const errors = [];
  const preview = [];

  /*
   * Cache giúp tránh truy vấn lại nhiều lần
   * nếu một học viên có nhiều dòng trong file.
   */
  const membershipCache =
    new Map();

  const transactionCache =
    new Map();

  const projectedAttendancePoints =
    new Map();

  const projectedParticipationPoints =
    new Map();

  const examScoreCache =
    new Map();

  const projectedExamPoints =
    new Map();


  for (const row of parsed.rows) {
    /*
     * ========================================
     * 1. Tìm học viên
     * ========================================
     */
    let membership =
      membershipCache.get(
        row.username
      );

    if (
      membership === undefined
    ) {
      membership =
        await findActiveMembershipByUsername(
          row.username
        );

      membershipCache.set(
        row.username,
        membership || null
      );
    }

    if (!membership) {
      errors.push({
        row: row.rowNumber,

        code:
          "ACTIVE_MEMBERSHIP_NOT_FOUND",

        message:
          `Không tìm thấy học viên ${row.tkhCode} trong mùa đang hoạt động.`,
      });

      continue;
    }

    const seasonMembershipId =
      Number(
        membership
          .season_membership_id
      );


    /*
     * ========================================
     * 2. Tải lịch sử điểm hiện tại
     * ========================================
     */
    let existingTransactions =
      transactionCache.get(
        seasonMembershipId
      );

    if (
      existingTransactions ===
      undefined
    ) {
      existingTransactions =
        await findScoreTransactionsBySeasonMembershipId(
          seasonMembershipId
        );

      transactionCache.set(
        seasonMembershipId,
        existingTransactions
      );
    }


    /*
     * ========================================
     * 3. Điều chỉnh điểm danh
     * ========================================
     */
    if (
      row.scoreType ===
      "ATTENDANCE_ADJUSTMENT"
    ) {
      let currentPoints =
        projectedAttendancePoints.get(
          seasonMembershipId
        );

      if (
        currentPoints === undefined
      ) {
        currentPoints =
          sumActiveScoreByTypes(
            existingTransactions,
            [
              "ATTENDANCE",
              "ATTENDANCE_ADJUSTMENT",
            ]
          );
      }

      const projectedPoints =
        Number(
          (
            currentPoints +
            row.points
          ).toFixed(2)
        );

      if (projectedPoints < 0) {
        errors.push({
          row: row.rowNumber,

          code:
            "ATTENDANCE_SCORE_BELOW_ZERO",

          message:
            `${row.tkhCode}: tổng điểm danh sẽ giảm xuống ${projectedPoints}, nhỏ hơn 0.`,

          currentPoints,
          requestedPoints:
            row.points,
          minimumPoints: 0,
        });

        continue;
      }

      if (
        projectedPoints >
        scoreConfig.attendance
          .maxRawScore
      ) {
        errors.push({
          row: row.rowNumber,

          code:
            "ATTENDANCE_SCORE_LIMIT_EXCEEDED",

          message:
            `${row.tkhCode}: tổng điểm danh sẽ thành ${projectedPoints}, vượt quá 110.`,

          currentPoints,
          requestedPoints:
            row.points,

          maximumPoints:
            scoreConfig.attendance
              .maxRawScore,
        });

        continue;
      }

      projectedAttendancePoints.set(
        seasonMembershipId,
        projectedPoints
      );

      preview.push({
        ...row,

        member: {
          seasonMembershipId,

          tkhCode:
            membership.tkh_code,

          fullName:
            membership.full_name,

          groupName:
            membership.group_name ||
            "Chưa phân nhóm",
        },

        currentPoints,
        projectedPoints,
        maximumPoints:
          scoreConfig.attendance
            .maxRawScore,
      });

      continue;
    }


    /*
     * ========================================
     * 4. Điểm phát biểu
     * ========================================
     */
    if (
      row.scoreType ===
      "PARTICIPATION"
    ) {
      let currentPoints =
        projectedParticipationPoints.get(
          seasonMembershipId
        );

      if (
        currentPoints === undefined
      ) {
        currentPoints =
          sumActiveScoreByTypes(
            existingTransactions,
            ["PARTICIPATION"]
          );
      }

      const projectedPoints =
        Number(
          (
            currentPoints +
            row.points
          ).toFixed(2)
        );

      const maximumPoints =
        scoreConfig.learning
          .participation
          .maxScore;

      if (
        projectedPoints >
        maximumPoints
      ) {
        errors.push({
          row: row.rowNumber,

          code:
            "PARTICIPATION_SCORE_LIMIT_EXCEEDED",

          message:
            `${row.tkhCode}: tổng điểm phát biểu sẽ thành ${projectedPoints}, vượt quá ${maximumPoints}.`,

          currentPoints,
          requestedPoints:
            row.points,
          maximumPoints,
        });

        continue;
      }

      projectedParticipationPoints.set(
        seasonMembershipId,
        projectedPoints
      );

      preview.push({
        ...row,

        member: {
          seasonMembershipId,

          tkhCode:
            membership.tkh_code,

          fullName:
            membership.full_name,

          groupName:
            membership.group_name ||
            "Chưa phân nhóm",
        },

        currentPoints,
        projectedPoints,
        maximumPoints,
      });

      continue;
    }


    /*
     * ========================================
     * 5. Pre-test hoặc Final Test giấy
     * ========================================
     */
    if (
      row.scoreType === "PRE_TEST" ||
      row.scoreType === "FINAL_TEST"
    ) {
      const examCacheKey =
        `${seasonMembershipId}:${row.examId}`;

      let examScore =
        examScoreCache.get(
          examCacheKey
        );

      if (
        examScore === undefined
      ) {
        examScore =
          await findActiveExamScoreForMembership({
            seasonMembershipId,
            examId:
              row.examId,
          });

        examScoreCache.set(
          examCacheKey,
          examScore || null
        );
      }

      if (!examScore) {
        errors.push({
          row: row.rowNumber,

          code:
            "EXAM_NOT_FOUND",

          message:
            `Không tìm thấy bài kiểm tra ID ${row.examId}.`,
        });

        continue;
      }

      const actualExamType =
        String(
          examScore.examType || ""
        )
          .trim()
          .toUpperCase();

      if (
        actualExamType !==
        row.scoreType
      ) {
        errors.push({
          row: row.rowNumber,

          code:
            "EXAM_TYPE_MISMATCH",

          message:
            `Bài kiểm tra ID ${row.examId} có loại ${actualExamType}, không phải ${row.scoreType}.`,

          expectedType:
            row.scoreType,

          actualType:
            actualExamType,
        });

        continue;
      }

      let currentPoints =
        projectedExamPoints.get(
          examCacheKey
        );

      if (
        currentPoints === undefined
      ) {
        currentPoints =
          Number(
            examScore.currentPoints
          ) || 0;
      }

      const projectedPoints =
        Number(
          (
            currentPoints +
            row.points
          ).toFixed(2)
        );

      const maximumPoints =
        row.scoreType === "PRE_TEST"
          ? scoreConfig.learning
              .preTest
              .maxScorePerTest
          : scoreConfig.learning
              .finalTest
              .maxScore;

      if (
        projectedPoints >
        maximumPoints
      ) {
        errors.push({
          row: row.rowNumber,

          code:
            "EXAM_SCORE_LIMIT_EXCEEDED",

          message:
            `${row.tkhCode}: điểm của bài "${examScore.examName}" sẽ thành ${projectedPoints}, vượt quá ${maximumPoints}.`,

          currentPoints,
          requestedPoints:
            row.points,
          maximumPoints,

          remainingPoints:
            Math.max(
              maximumPoints -
                currentPoints,
              0
            ),
        });

        continue;
      }

      projectedExamPoints.set(
        examCacheKey,
        projectedPoints
      );

      preview.push({
        ...row,

        member: {
          seasonMembershipId,

          tkhCode:
            membership.tkh_code,

          fullName:
            membership.full_name,

          groupName:
            membership.group_name ||
            "Chưa phân nhóm",
        },

        exam: {
          id:
            Number(examScore.examId),

          name:
            examScore.examName,

          type:
            actualExamType,

          status:
            examScore.examStatus,
        },

        currentPoints,
        projectedPoints,
        maximumPoints,
      });
    }
  }


  /*
   * Chỉ cần một dòng lỗi thì toàn bộ file
   * chưa được phép import.
   */
  if (errors.length > 0) {
    return {
      success: false,

      code:
        "MANUAL_SCORE_IMPORT_VALIDATION_FAILED",

      summary: {
        totalRows:
          parsed.rows.length,

        validRows:
          preview.length,

        invalidRows:
          errors.length,
      },

      errors,

      preview: [],
    };
  }


  return {
    success: true,

    code:
      "MANUAL_SCORE_IMPORT_VALID",
    batchKey,

    summary: {
      ...parsed.summary,

      validRows:
        preview.length,

      invalidRows: 0,
    },

    preview,
  };
}

async function importManualScoresExcel({
  fileBuffer,
  originalFileName = null,
  fileSizeBytes = null,
  adminUserId,
}) {
  /*
   * Xác định Admin thực hiện import.
   */
  const normalizedAdminUserId =
    Number(adminUserId);

  if (
    !Number.isInteger(
      normalizedAdminUserId
    ) ||
    normalizedAdminUserId <= 0
  ) {
    return {
      success: false,
      code:
        "ADMIN_USER_REQUIRED",
    };
  }

  /*
   * Validate lại toàn bộ file ngay trước khi ghi.
   *
   * Hàm này kiểm tra:
   * - cấu trúc Excel;
   * - mã TKH;
   * - điểm hiện tại;
   * - giới hạn điểm;
   * - điểm cộng dồn trong chính file.
   */
  const validation =
    await validateManualScoreImport({
      fileBuffer,
    });

  if (!validation.success) {
    return validation;
  }

  const batchKey =
  validation.batchKey ||
  createManualScoreImportBatchKey(
    fileBuffer
  );

  const pool =
    await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
  sql.ISOLATION_LEVEL.SERIALIZABLE
);

transactionStarted = true;

/*
 * Kiểm tra lại bên trong transaction
 * để chặn hai request import đồng thời.
 */
const existingBatch =
  await findManualScoreImportBatchByKey({
    batchKey,
    transaction,
  });

if (existingBatch) {
  await transaction.rollback();
  transactionStarted = false;

  return {
    success: false,

    code:
      "MANUAL_SCORE_IMPORT_ALREADY_COMPLETED",

    batch:
      existingBatch,
  };
}

const importBatch =
  await createManualScoreImportBatch({
    batchKey,

    originalFileName,

    fileSizeBytes:
      Number(fileSizeBytes) || null,

    totalRows:
      validation.preview.length,

    createdByUserId:
      normalizedAdminUserId,

    transaction,
  });

if (!importBatch) {
  throw new Error(
    "Không thể tạo batch import."
  );
}

const createdTransactions = [];

    for (
      const row of
      validation.preview
    ) {
      const scoreCategory =
        SCORE_TYPE_CATEGORY[
          row.scoreType
        ];

      const isExamScore =
        row.scoreType ===
          "PRE_TEST" ||
        row.scoreType ===
          "FINAL_TEST";

      const sourceType =
        isExamScore
          ? "MANUAL_TEST"
          : "MANUAL_IMPORT";

      const sourceId =
        isExamScore
          ? Number(row.examId)
          : null;

      const sourceKey =
        isExamScore
            ? `${row.scoreType}:IMPORT_BATCH:${importBatch.id}:EXAM:${row.examId}:ROW:${row.rowNumber}`
            : `${row.scoreType}:IMPORT_BATCH:${importBatch.id}:ROW:${row.rowNumber}`;

      const appliedPoints =
        Math.round(
          Number(row.points) * 100
        ) / 100;

      const created =
        await createScoreTransaction({
          seasonMembershipId:
            Number(
              row.member
                .seasonMembershipId
            ),

          scoreCategory,

          scoreType:
            row.scoreType,

          requestedPoints:
            appliedPoints,

          appliedPoints,

          sourceType,

          sourceId,

          sourceKey,

          description:
            row.description,

          createdByUserId:
            normalizedAdminUserId,

          transaction,
        });

      if (!created) {
        throw new Error(
          `Không thể tạo giao dịch tại dòng ${row.rowNumber}.`
        );
      }

      createdTransactions.push({
        rowNumber:
          row.rowNumber,

        tkhCode:
          row.member.tkhCode,

        fullName:
          row.member.fullName,

        groupName:
          row.member.groupName,

        scoreType:
          row.scoreType,

        examId:
          row.examId,

        points:
          appliedPoints,

        transactionId:
          Number(created.id),

        sourceType:
          created.sourceType,

        sourceKey:
          created.sourceKey,
      });
    }

const completedBatch =
  await completeManualScoreImportBatch({
    batchId:
      Number(importBatch.id),

    importedRows:
      createdTransactions.length,

    transaction,
  });

if (!completedBatch) {
  throw new Error(
    "Không thể hoàn tất batch import."
  );
}

    await transaction.commit();
    transactionStarted = false;

    return {
      success: true,

      code:
        "MANUAL_SCORE_IMPORT_COMPLETED",

      message:
        `Đã import thành công ${createdTransactions.length} giao dịch điểm.`,

        batch: {
            id:
                Number(completedBatch.id),

            batchKey:
                completedBatch.batchKey,

            status:
                completedBatch.status,

            totalRows:
                Number(
                completedBatch.totalRows
                ),

            importedRows:
                Number(
                completedBatch.importedRows
                ),

            completedAt:
                completedBatch.completedAt,
            },

      summary: {
        ...validation.summary,

        importedRows:
          createdTransactions.length,
      },

      transactions:
        createdTransactions,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Manual score import rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Manual score import error:",
      error
    );

    return {
      success: false,

      code:
        "MANUAL_SCORE_IMPORT_FAILED",

      message:
        "Không thể import điểm. Toàn bộ giao dịch đã được rollback.",

      internalMessage:
        error.message,
    };
  }
}

function buildGroupDisciplineSummary({
  cleaningPoints,
  compliancePoints,
  spiritPoints,
}) {
  const cleaning =
    Number(cleaningPoints) || 0;

  const compliance =
    Number(compliancePoints) || 0;

  const spirit =
    Number(spiritPoints) || 0;

  const rawTotal =
    Number(
      (
        cleaning +
        compliance +
        spirit
      ).toFixed(2)
    );

  const weightedScore =
    Number(
      (
        rawTotal /
        scoreConfig.discipline.maxRawScore *
        scoreConfig.discipline.maxWeightedScore
      ).toFixed(2)
    );

  return {
    cleaningPoints:
      cleaning,

    compliancePoints:
      compliance,

    spiritPoints:
      spirit,

    rawTotal,

    maximumRawPoints:
      scoreConfig.discipline.maxRawScore,

    weightedScore,

    maximumWeightedPoints:
      scoreConfig.discipline.maxWeightedScore,
  };
}

async function getGroupDisciplineScore({
  groupId,
}) {
  const normalizedGroupId =
    Number(groupId);

  if (
    !Number.isInteger(
      normalizedGroupId
    ) ||
    normalizedGroupId <= 0
  ) {
    return {
      success: false,
      code:
        "INVALID_GROUP_ID",
    };
  }

  const group =
    await findActiveGroupById(
      normalizedGroupId
    );

  if (!group) {
    return {
      success: false,
      code:
        "GROUP_NOT_FOUND",
    };
  }

  const current =
    await findGroupDisciplineScoreByGroupId({
      groupId:
        normalizedGroupId,
    });

  const summary =
    buildGroupDisciplineSummary({
      cleaningPoints:
        current?.cleaningPoints || 0,

      compliancePoints:
        current?.compliancePoints || 0,

      spiritPoints:
        current?.spiritPoints || 0,
    });

  return {
    success: true,

    group: {
      id:
        Number(group.group_id),

      code:
        group.group_code,

      name:
        group.group_name,
    },

    disciplineScore:
      current
        ? {
            id:
              Number(current.id),

            status:
              current.status,

            scoredByUserId:
              current.scoredByUserId != null
                ? Number(
                    current.scoredByUserId
                  )
                : null,

            scoredAt:
              current.scoredAt,

            updatedByUserId:
              current.updatedByUserId != null
                ? Number(
                    current.updatedByUserId
                  )
                : null,

            updatedAt:
              current.updatedAt,

            ...summary,
          }
        : {
            id: null,
            status: null,
            scoredByUserId: null,
            scoredAt: null,
            updatedByUserId: null,
            updatedAt: null,
            ...summary,
          },
  };
}

async function saveGroupDisciplineScore({
  groupId,
  cleaningPoints,
  compliancePoints,
  spiritPoints,
  reason,
  adminUserId,
}) {
  const normalizedGroupId =
    Number(groupId);

  const normalizedAdminUserId =
    Number(adminUserId);

  const normalizedCleaningPoints =
    Number(cleaningPoints);

  const normalizedCompliancePoints =
    Number(compliancePoints);

  const normalizedSpiritPoints =
    Number(spiritPoints);

  const normalizedReason =
    String(reason || "")
      .trim();

  if (
    !Number.isInteger(
      normalizedGroupId
    ) ||
    normalizedGroupId <= 0
  ) {
    return {
      success: false,
      code:
        "INVALID_GROUP_ID",
    };
  }

  if (
    !Number.isInteger(
      normalizedAdminUserId
    ) ||
    normalizedAdminUserId <= 0
  ) {
    return {
      success: false,
      code:
        "ADMIN_USER_REQUIRED",
    };
  }

  const pointValues = [
    normalizedCleaningPoints,
    normalizedCompliancePoints,
    normalizedSpiritPoints,
  ];

  if (
    pointValues.some(
      value =>
        !Number.isFinite(value)
    )
  ) {
    return {
      success: false,
      code:
        "INVALID_DISCIPLINE_POINTS",
    };
  }

  if (
    pointValues.some(
      value =>
        value < 0 ||
        value > 30
    )
  ) {
    return {
      success: false,
      code:
        "DISCIPLINE_POINTS_OUT_OF_RANGE",

      minimumPoints: 0,
      maximumPoints: 30,
    };
  }

  if (
    normalizedReason.length > 500
  ) {
    return {
      success: false,
      code:
        "DESCRIPTION_TOO_LONG",

      maximumLength: 500,
    };
  }

  const group =
    await findActiveGroupById(
      normalizedGroupId
    );

  if (!group) {
    return {
      success: false,
      code:
        "GROUP_NOT_FOUND",
    };
  }

  const pool =
    await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    transactionStarted = true;

    const current =
      await findGroupDisciplineScoreByGroupId({
        groupId:
          normalizedGroupId,

        transaction,
      });

    const oldSummary =
      buildGroupDisciplineSummary({
        cleaningPoints:
          current?.cleaningPoints || 0,

        compliancePoints:
          current?.compliancePoints || 0,

        spiritPoints:
          current?.spiritPoints || 0,
      });

    const newSummary =
      buildGroupDisciplineSummary({
        cleaningPoints:
          normalizedCleaningPoints,

        compliancePoints:
          normalizedCompliancePoints,

        spiritPoints:
          normalizedSpiritPoints,
      });

    const hasNoChange =
      oldSummary.cleaningPoints ===
        newSummary.cleaningPoints &&
      oldSummary.compliancePoints ===
        newSummary.compliancePoints &&
      oldSummary.spiritPoints ===
        newSummary.spiritPoints;

    if (
      current &&
      hasNoChange
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        success: false,
        code:
          "DISCIPLINE_SCORE_NO_CHANGE",

        currentScore:
          oldSummary,
      };
    }

    let savedScore = null;

    if (!current) {
      savedScore =
        await createGroupDisciplineScore({
          groupId:
            normalizedGroupId,

          cleaningPoints:
            newSummary.cleaningPoints,

          compliancePoints:
            newSummary.compliancePoints,

          spiritPoints:
            newSummary.spiritPoints,

          adminUserId:
            normalizedAdminUserId,

          transaction,
        });
    } else {
      savedScore =
        await updateGroupDisciplineScore({
          groupDisciplineScoreId:
            Number(current.id),

          cleaningPoints:
            newSummary.cleaningPoints,

          compliancePoints:
            newSummary.compliancePoints,

          spiritPoints:
            newSummary.spiritPoints,

          adminUserId:
            normalizedAdminUserId,

          transaction,
        });
    }

    if (!savedScore) {
      throw new Error(
        "Không thể lưu điểm Rèn luyện của nhóm."
      );
    }

    const groupDisciplineScoreId =
      Number(savedScore.id);

    const existingMemberLinks =
      current
        ? await findGroupDisciplineScoreMembers({
            groupDisciplineScoreId,
            transaction,
          })
        : [];

    const members =
      current
        ? existingMemberLinks.map(
            item => ({
              id:
                Number(item.id),

              seasonMembershipId:
                Number(
                  item.seasonMembershipId
                ),

              tkhCode:
                item.tkhCode,

              fullName:
                item.fullName,

              cleaningTransactionId:
                Number(
                  item.cleaningTransactionId
                ),

              complianceTransactionId:
                Number(
                  item.complianceTransactionId
                ),

              spiritTransactionId:
                Number(
                  item.spiritTransactionId
                ),
            })
          )
        : await findActiveGroupMembershipsForDiscipline({
            groupId:
              normalizedGroupId,

            transaction,
          });

    if (members.length === 0) {
      throw new Error(
        "Nhóm không có thành viên đang hoạt động."
      );
    }

    const transactionResults = [];

    for (const member of members) {
      if (current) {
        const oldTransactionIds = [
          member.cleaningTransactionId,
          member.complianceTransactionId,
          member.spiritTransactionId,
        ];

        for (
          const transactionId of
          oldTransactionIds
        ) {
          const reversed =
            await reverseScoreTransaction({
              scoreTransactionId:
                transactionId,

              adminUserId:
                normalizedAdminUserId,

              reversalReason:
                normalizedReason ||
                "Cập nhật điểm Rèn luyện của nhóm.",

              transaction,
            });

          if (!reversed) {
            throw new Error(
              `Không thể thu hồi giao dịch cũ ${transactionId}.`
            );
          }
        }
      }

      const cleaningTransaction =
        await createScoreTransaction({
          seasonMembershipId:
            Number(
              member.seasonMembershipId
            ),

          scoreCategory:
            "DISCIPLINE",

          scoreType:
            "DISCIPLINE_CLEANING",

          requestedPoints:
            newSummary.cleaningPoints,

          appliedPoints:
            newSummary.cleaningPoints,

          sourceType:
            "GROUP_DISCIPLINE",

          sourceId:
            groupDisciplineScoreId,

          sourceKey:
            `GROUP_DISCIPLINE:${groupDisciplineScoreId}:MEMBERSHIP:${member.seasonMembershipId}:CLEANING:${randomUUID()}`,

          description:
            normalizedReason ||
            `Điểm Trực nhật của nhóm ${group.group_name}`,

          createdByUserId:
            normalizedAdminUserId,

          transaction,
        });

      const complianceTransaction =
        await createScoreTransaction({
          seasonMembershipId:
            Number(
              member.seasonMembershipId
            ),

          scoreCategory:
            "DISCIPLINE",

          scoreType:
            "DISCIPLINE_COMPLIANCE",

          requestedPoints:
            newSummary.compliancePoints,

          appliedPoints:
            newSummary.compliancePoints,

          sourceType:
            "GROUP_DISCIPLINE",

          sourceId:
            groupDisciplineScoreId,

          sourceKey:
            `GROUP_DISCIPLINE:${groupDisciplineScoreId}:MEMBERSHIP:${member.seasonMembershipId}:COMPLIANCE:${randomUUID()}`,

          description:
            normalizedReason ||
            `Điểm Tuân thủ của nhóm ${group.group_name}`,

          createdByUserId:
            normalizedAdminUserId,

          transaction,
        });

      const spiritTransaction =
        await createScoreTransaction({
          seasonMembershipId:
            Number(
              member.seasonMembershipId
            ),

          scoreCategory:
            "DISCIPLINE",

          scoreType:
            "DISCIPLINE_SPIRIT",

          requestedPoints:
            newSummary.spiritPoints,

          appliedPoints:
            newSummary.spiritPoints,

          sourceType:
            "GROUP_DISCIPLINE",

          sourceId:
            groupDisciplineScoreId,

          sourceKey:
            `GROUP_DISCIPLINE:${groupDisciplineScoreId}:MEMBERSHIP:${member.seasonMembershipId}:SPIRIT:${randomUUID()}`,

          description:
            normalizedReason ||
            `Điểm Tinh thần của nhóm ${group.group_name}`,

          createdByUserId:
            normalizedAdminUserId,

          transaction,
        });

      if (
        !cleaningTransaction ||
        !complianceTransaction ||
        !spiritTransaction
      ) {
        throw new Error(
          `Không thể tạo đủ giao dịch cho ${member.tkhCode || member.seasonMembershipId}.`
        );
      }

      if (!current) {
        const memberLink =
          await createGroupDisciplineScoreMember({
            groupDisciplineScoreId,

            seasonMembershipId:
              Number(
                member.seasonMembershipId
              ),

            cleaningTransactionId:
              Number(
                cleaningTransaction.id
              ),

            complianceTransactionId:
              Number(
                complianceTransaction.id
              ),

            spiritTransactionId:
              Number(
                spiritTransaction.id
              ),

            transaction,
          });

        if (!memberLink) {
          throw new Error(
            `Không thể liên kết giao dịch cho ${member.tkhCode || member.seasonMembershipId}.`
          );
        }
      } else {
        const updatedMemberLink =
          await updateGroupDisciplineScoreMemberTransactions({
            groupDisciplineScoreMemberId:
              Number(member.id),

            cleaningTransactionId:
              Number(
                cleaningTransaction.id
              ),

            complianceTransactionId:
              Number(
                complianceTransaction.id
              ),

            spiritTransactionId:
              Number(
                spiritTransaction.id
              ),

            transaction,
          });

        if (!updatedMemberLink) {
          throw new Error(
            `Không thể cập nhật liên kết giao dịch cho ${member.tkhCode || member.seasonMembershipId}.`
          );
        }
      }

      transactionResults.push({
        seasonMembershipId:
          Number(
            member.seasonMembershipId
          ),

        tkhCode:
          member.tkhCode || null,

        fullName:
          member.fullName || null,

        cleaningTransactionId:
          Number(
            cleaningTransaction.id
          ),

        complianceTransactionId:
          Number(
            complianceTransaction.id
          ),

        spiritTransactionId:
          Number(
            spiritTransaction.id
          ),
      });
    }

    const history =
      await createGroupDisciplineScoreHistory({
        groupDisciplineScoreId,

        oldCleaningPoints:
          current
            ? oldSummary.cleaningPoints
            : null,

        newCleaningPoints:
          newSummary.cleaningPoints,

        oldCompliancePoints:
          current
            ? oldSummary.compliancePoints
            : null,

        newCompliancePoints:
          newSummary.compliancePoints,

        oldSpiritPoints:
          current
            ? oldSummary.spiritPoints
            : null,

        newSpiritPoints:
          newSummary.spiritPoints,

        changeType:
          current
            ? "UPDATE"
            : "CREATE",

        reason:
          normalizedReason || null,

        adminUserId:
          normalizedAdminUserId,

        transaction,
      });

    if (!history) {
      throw new Error(
        "Không thể ghi lịch sử điểm Rèn luyện."
      );
    }

    await transaction.commit();
    transactionStarted = false;

    return {
      success: true,

      group: {
        id:
          Number(group.group_id),

        code:
          group.group_code,

        name:
          group.group_name,
      },

      disciplineScore: {
        id:
          groupDisciplineScoreId,

        ...newSummary,
      },

      affectedMembers:
        transactionResults.length,

      transactions:
        transactionResults,

      changeType:
        current
          ? "UPDATE"
          : "CREATE",

      message:
        current
          ? "Đã cập nhật điểm Rèn luyện cho nhóm."
          : "Đã tạo điểm Rèn luyện cho nhóm.",
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Group discipline rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Save group discipline score error:",
      error
    );

    return {
      success: false,
      code:
        "SAVE_GROUP_DISCIPLINE_SCORE_FAILED",

      internalMessage:
        error.message,
    };
  }
}

module.exports = {
    getGroupDisciplineScore,
    saveGroupDisciplineScore,
    validateManualScoreImport,
    importManualScoresExcel,
  getAdminScoreHistory,
  getMemberScoreSummary,
  createAdminScoreTransaction,

  getMyScores,
  getMyGroupScores,
  getGroupRankings,
  getIndividualRankings,

  createAdminIndividualScore,
  createAdminGroupScore,
};