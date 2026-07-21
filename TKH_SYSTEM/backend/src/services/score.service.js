const {
  findActiveMembershipByMemberId,
  findActiveMembershipByUsername,
  findIndividualScoreSummary,
  findIndividualScoreHistory,
  createIndividualScoreTransaction,
  findGroupScoreSummary,
  findGroupScoreHistory,
  findAllGroupScoreRankings,
  createGroupScoreTransaction,
} = require("../repositories/score.repository");


const ADMIN_SOURCE_TYPES = new Set([
  "MANUAL",
  "MEMORY_VERSE",
  "GAME",
  "LATE",
  "OTHER",
]);


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


function getSourceTypeLabel(sourceType) {
  return (
    SOURCE_TYPE_LABELS[sourceType] ||
    sourceType ||
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


async function getMyScores(memberId) {
  if (
    !Number.isInteger(Number(memberId)) ||
    Number(memberId) <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      Number(memberId)
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  const [
    summary,
    history,
  ] = await Promise.all([
    findIndividualScoreSummary(
      membership.season_membership_id
    ),

    findIndividualScoreHistory(
      membership.season_membership_id
    ),
  ]);

  return {
    success: true,
    season: mapSeason(membership),
    member: mapMember(membership),
    summary: mapSummary(summary),
    history: history.map(mapHistoryItem),
  };
}


async function getMyGroupScores(memberId) {
  if (
    !Number.isInteger(Number(memberId)) ||
    Number(memberId) <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_ACCOUNT_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      Number(memberId)
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

  const groupId = Number(
    membership.group_id
  );

  const [
    summary,
    history,
    rankings,
  ] = await Promise.all([
    findGroupScoreSummary(groupId),
    findGroupScoreHistory(groupId),
    findAllGroupScoreRankings(),
  ]);

  if (!summary) {
    return {
      success: false,
      code: "GROUP_NOT_FOUND",
    };
  }

  const mappedRankings =
    rankings.map(mapGroupRankingItem);

  const currentRanking =
    mappedRankings.find(
      item => item.group.id === groupId
    ) || null;

  return {
    success: true,

    season: mapSeason(membership),

    group: {
      id: Number(summary.group_id),
      code: summary.group_code,
      name: summary.group_name,
    },

    summary:
      mapGroupScoreSummary(summary),

    ranking:
      currentRanking
        ? currentRanking.ranking
        : null,

    history:
      history.map(
        mapGroupScoreHistoryItem
      ),
  };
}


async function getGroupRankings() {
  const rankings =
    await findAllGroupScoreRankings();

  const groups =
    rankings.map(mapGroupRankingItem);

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
    await findGroupScoreSummary(
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
  const normalizedUsername =
    typeof username === "string"
      ? username.trim()
      : "";

  if (!normalizedUsername) {
    return {
      success: false,
      code: "USERNAME_REQUIRED",
    };
  }

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

  const normalizedPoints = Number(points);

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

  const normalizedDescription =
    typeof description === "string"
      ? description.trim()
      : "";

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
    !Number.isInteger(
      normalizedAdminUserId
    ) ||
    normalizedAdminUserId <= 0
  ) {
    return {
      success: false,
      code: "ADMIN_USER_REQUIRED",
    };
  }

  const membership =
    await findActiveMembershipByUsername(
      normalizedUsername
    );

  if (!membership) {
    return {
      success: false,
      code:
        "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  const transaction =
    await createIndividualScoreTransaction({
      seasonMembershipId:
        membership.season_membership_id,

      points: normalizedPoints,

      sourceType:
        normalizedSourceType,

      sourceId: null,

      description:
        normalizedDescription,

      createdByUserId:
        normalizedAdminUserId,
    });

  return {
    success: true,
    transaction:
      mapCreatedTransaction(
        transaction,
        membership
      ),
  };
}


module.exports = {
  getMyScores,
  getMyGroupScores,
  getGroupRankings,
  createAdminIndividualScore,
  createAdminGroupScore,
};