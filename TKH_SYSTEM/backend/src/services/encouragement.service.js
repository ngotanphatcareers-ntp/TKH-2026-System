const {
  findActiveRecipientByUsername,
  findActiveRecipients,
  findEncouragementById,
  findTodayEncouragement,
  createEncouragement,
  findInboxByMembershipId,
  getInboxSummary,
  markInboxAsRead,
  toggleEncouragementPin,
  getAdminEncouragementSummary,
  findTopSenders,
  findTopRecipients,
  findEncouragementsBySeasonId,
} = require(
  "../repositories/encouragement.repository"
);

const {
  findActiveMembershipByMemberId,
} = require(
  "../repositories/membership.repository"
);

const {
  findActiveSeason,
} = require(
  "../repositories/season.repository"
);


/*
=====================================================
Mapping helpers
=====================================================
*/

function mapMember({
  memberId,
  fullName,
  username,
  tkhCode,
  avatarFilename,
  groupId,
  groupCode,
  groupName,
}) {
  if (!memberId) {
    return null;
  }

  return {
    id: memberId,
    fullName,
    username,
    tkhCode,
    avatarFilename,

    group: groupId
      ? {
          id: groupId,
          code: groupCode,
          name: groupName,
        }
      : null,
  };
}


function mapRecipient(item) {
  return {
    seasonMembershipId:
      item.season_membership_id,

    id:
      item.member_id,

    username:
      item.username,

    tkhCode:
      item.tkh_code,

    fullName:
      item.full_name,

        avatarFilename:
            item.avatar_filename,

        receivedCount:
            Number(item.received_count) || 0,

        group: item.group_id
      ? {
          id:
            item.group_id,

          code:
            item.group_code,

          name:
            item.group_name,
        }
      : null,
  };
}


function mapEncouragement(
  encouragement,
  {
    revealAnonymousSender = false,
  } = {}
) {
  if (!encouragement) {
    return null;
  }

  const isAnonymous =
    Boolean(encouragement.is_anonymous);

  const shouldHideSender =
    isAnonymous && !revealAnonymousSender;

  const sender = shouldHideSender
    ? null
    : mapMember({
        memberId:
          encouragement.sender_member_id,
        fullName:
          encouragement.sender_full_name,
        username:
          encouragement.sender_username,
        tkhCode:
          encouragement.sender_tkh_code,
        avatarFilename:
          encouragement
            .sender_avatar_filename,
        groupId:
          encouragement.sender_group_id,
        groupCode:
          encouragement.sender_group_code,
        groupName:
          encouragement.sender_group_name,
      });

  const recipient = mapMember({
    memberId:
      encouragement.recipient_member_id,
    fullName:
      encouragement.recipient_full_name,
    username:
      encouragement.recipient_username,
    tkhCode:
      encouragement.recipient_tkh_code,
    avatarFilename:
      encouragement
        .recipient_avatar_filename,
    groupId:
      encouragement.recipient_group_id,
    groupCode:
      encouragement.recipient_group_code,
    groupName:
      encouragement.recipient_group_name,
  });

  return {
    id: encouragement.id,
    message: encouragement.message,
    isAnonymous,
    status: encouragement.status,
    isRead: Boolean(
      encouragement.is_read
    ),
    isPinned: Boolean(
      encouragement.is_pinned
    ),
    createdAt: encouragement.created_at,
    readAt: encouragement.read_at,
    updatedAt: encouragement.updated_at,
    sentDate: encouragement.sent_date,

    sender,
    recipient,
  };
}


function mapRankingMember(item) {
  return {
    seasonMembershipId:
      item.season_membership_id,

    member: {
      id: item.member_id,
      fullName: item.full_name,
      username: item.username,
      tkhCode: item.tkh_code,
      avatarFilename:
        item.avatar_filename,
    },

    group: item.group_id
      ? {
          id: item.group_id,
          code: item.group_code,
          name: item.group_name,
        }
      : null,

    count:
      Number(item.encouragement_count) || 0,
  };
}


function mapInboxSummary(summary) {
  return {
    totalReceived:
      Number(summary?.total_received) || 0,

    unreadCount:
      Number(summary?.unread_count) || 0,

    pinnedCount:
      Number(summary?.pinned_count) || 0,

    receivedToday:
      Number(summary?.received_today) || 0,
  };
}


/*
=====================================================
Shared active-season membership validation
=====================================================
*/

async function resolveActiveMembership(
  memberId
) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
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

  if (
    Number(membership.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "MEMBERSHIP_NOT_IN_ACTIVE_SEASON",
    };
  }

  return {
    success: true,
    activeSeason,
    membership,
  };
}


/*
=====================================================
1. Get active recipients
=====================================================
*/

async function getRecipients({
  memberId,
}) {
  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const recipients =
    await findActiveRecipients({
      seasonId:
        context.activeSeason.id,

      excludeSeasonMembershipId:
        context.membership.id,
    });

  return {
    success: true,

    recipients:
      recipients.map(mapRecipient),
  };
}


/*
=====================================================
1. Send encouragement
=====================================================
*/

async function sendEncouragement({
  memberId,
  recipientUsername,
  message,
  isAnonymous,
}) {
  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const normalizedRecipientUsername =
    String(recipientUsername || "").trim();

  if (!normalizedRecipientUsername) {
    return {
      success: false,
      code: "RECIPIENT_REQUIRED",
    };
  }

  if (
    normalizedRecipientUsername.length >
    100
  ) {
    return {
      success: false,
      code: "INVALID_RECIPIENT_USERNAME",
    };
  }

  const normalizedMessage =
    String(message || "").trim();

  if (!normalizedMessage) {
    return {
      success: false,
      code: "MESSAGE_REQUIRED",
    };
  }

  if (normalizedMessage.length > 1000) {
    return {
      success: false,
      code: "MESSAGE_TOO_LONG",
    };
  }

  const normalizedAnonymous =
    isAnonymous === true ||
    isAnonymous === 1 ||
    String(isAnonymous).toLowerCase() ===
      "true";

  const recipient =
    await findActiveRecipientByUsername({
      seasonId: context.activeSeason.id,
      username:
        normalizedRecipientUsername,
    });

  if (!recipient) {
    return {
      success: false,
      code: "RECIPIENT_NOT_FOUND",
    };
  }

  if (
    Number(
      recipient.season_membership_id
    ) === Number(context.membership.id)
  ) {
    return {
      success: false,
      code: "CANNOT_SEND_TO_SELF",
    };
  }

  const existingToday =
    await findTodayEncouragement({
      seasonId: context.activeSeason.id,
      senderSeasonMembershipId:
        context.membership.id,
      recipientSeasonMembershipId:
        recipient.season_membership_id,
    });

  if (existingToday) {
    return {
      success: false,
      code:
        "DAILY_ENCOURAGEMENT_LIMIT_REACHED",
    };
  }

  try {
    const encouragement =
      await createEncouragement({
        seasonId: context.activeSeason.id,
        senderSeasonMembershipId:
          context.membership.id,
        recipientSeasonMembershipId:
          recipient.season_membership_id,
        message: normalizedMessage,
        isAnonymous: normalizedAnonymous,
      });

    return {
      success: true,

      encouragement: mapEncouragement(
        encouragement,
        {
          /*
          Người gửi được phép thấy thông tin
          của chính mình sau khi gửi.
          */
          revealAnonymousSender: true,
        }
      ),
    };
  } catch (error) {
    /*
    SQL Server duplicate index errors:

    2601:
    Cannot insert duplicate key row.

    2627:
    Violation of UNIQUE constraint/index.

    Đây là lớp bảo vệ cho trường hợp hai
    request được gửi gần như đồng thời.
    */
    if (
      error?.number === 2601 ||
      error?.number === 2627
    ) {
      return {
        success: false,
        code:
          "DAILY_ENCOURAGEMENT_LIMIT_REACHED",
      };
    }

    throw error;
  }
}


/*
=====================================================
2. Get my inbox

Business rule:
- Only the recipient may load the inbox.
- Opening the inbox marks visible unread
  encouragements as read.
- Anonymous sender identity is hidden.
=====================================================
*/

async function getMyInbox({
  memberId,
  markAsRead = true,
}) {
  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const seasonId =
    context.activeSeason.id;

  const recipientSeasonMembershipId =
    context.membership.id;

  /*
  Read the inbox before marking it so each
  returned item still reflects its previous
  read status during this request.
  */
  const [messages, summaryBeforeRead] =
    await Promise.all([
      findInboxByMembershipId({
        seasonId,
        recipientSeasonMembershipId,
      }),

      getInboxSummary({
        seasonId,
        recipientSeasonMembershipId,
      }),
    ]);

  let markedReadCount = 0;

  if (markAsRead) {
    markedReadCount =
      await markInboxAsRead({
        seasonId,
        recipientSeasonMembershipId,
      });
  }

  const mappedMessages = messages.map(
    (item) =>
      mapEncouragement(item, {
        revealAnonymousSender: false,
      })
  );

  /*
  The database has now been marked read.
  Return the current summary state while also
  preserving how many were unread when opened.
  */
  const summary = mapInboxSummary(
    summaryBeforeRead
  );

  return {
    success: true,

    summary: {
      ...summary,

      unreadBeforeOpen:
        summary.unreadCount,

      unreadCount: markAsRead
        ? Math.max(
            0,
            summary.unreadCount -
              markedReadCount
          )
        : summary.unreadCount,

      markedReadCount,
    },

    messages: mappedMessages,

    todayPreview:
      mappedMessages.find(
        (item) =>
          item.sentDate &&
          String(item.sentDate)
            .slice(0, 10) ===
            new Date()
              .toISOString()
              .slice(0, 10)
      ) || null,
  };
}


/*
=====================================================
3. Get inbox summary only

Used by dashboard count without marking
messages as read.
=====================================================
*/

async function getMyInboxSummary({
  memberId,
}) {
  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const summary =
    await getInboxSummary({
      seasonId: context.activeSeason.id,
      recipientSeasonMembershipId:
        context.membership.id,
    });

  return {
    success: true,
    summary: mapInboxSummary(summary),
  };
}


/*
=====================================================
4. Toggle pin
=====================================================
*/

async function toggleMyEncouragementPin({
  memberId,
  encouragementId,
}) {
  const normalizedEncouragementId =
    Number(encouragementId);

  if (
    !Number.isInteger(
      normalizedEncouragementId
    ) ||
    normalizedEncouragementId <= 0
  ) {
    return {
      success: false,
      code:
        "INVALID_ENCOURAGEMENT_ID",
    };
  }

  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const existing =
    await findEncouragementById(
      normalizedEncouragementId
    );

  if (
    !existing ||
    Number(existing.season_id) !==
      Number(context.activeSeason.id)
  ) {
    return {
      success: false,
      code: "ENCOURAGEMENT_NOT_FOUND",
    };
  }

  if (
    Number(
      existing
        .recipient_season_membership_id
    ) !== Number(context.membership.id)
  ) {
    return {
      success: false,
      code: "ENCOURAGEMENT_NOT_FOUND",
    };
  }

  const updated =
    await toggleEncouragementPin({
      encouragementId:
        normalizedEncouragementId,

      recipientSeasonMembershipId:
        context.membership.id,
    });

  if (!updated) {
    return {
      success: false,
      code: "ENCOURAGEMENT_NOT_FOUND",
    };
  }

  return {
    success: true,

    encouragement: mapEncouragement(
      updated,
      {
        revealAnonymousSender: false,
      }
    ),
  };
}


/*
=====================================================
5. Admin statistics
=====================================================
*/

async function getAdminStats({
  limit = 5,
} = {}) {
  const normalizedLimit =
    Number(limit);

  const safeLimit =
    Number.isInteger(normalizedLimit) &&
    normalizedLimit > 0 &&
    normalizedLimit <= 20
      ? normalizedLimit
      : 5;

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const [
    summary,
    topSenders,
    topRecipients,
  ] = await Promise.all([
    getAdminEncouragementSummary(
      activeSeason.id
    ),

    findTopSenders({
      seasonId: activeSeason.id,
      limit: safeLimit,
    }),

    findTopRecipients({
      seasonId: activeSeason.id,
      limit: safeLimit,
    }),
  ]);

  return {
    success: true,

    summary: {
      total:
        Number(summary?.total_count) || 0,

      today:
        Number(summary?.today_count) || 0,

      anonymous:
        Number(
          summary?.anonymous_count
        ) || 0,

      unread:
        Number(summary?.unread_count) ||
        0,

      visible:
        Number(summary?.visible_count) ||
        0,

      hidden:
        Number(summary?.hidden_count) ||
        0,

      reported:
        Number(
          summary?.reported_count
        ) || 0,
    },

    topSenders:
      topSenders.map(mapRankingMember),

    topRecipients:
      topRecipients.map(
        mapRankingMember
      ),
  };
}


/*
=====================================================
6. Admin review list

Admin always receives the real sender,
including anonymous messages.
=====================================================
*/

async function getAdminReview() {
  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const encouragements =
    await findEncouragementsBySeasonId(
      activeSeason.id
    );

  return {
    success: true,

    encouragements:
      encouragements.map((item) =>
        mapEncouragement(item, {
          revealAnonymousSender: true,
        })
      ),
  };
}


module.exports = {
    getRecipients,
  sendEncouragement,
  getMyInbox,
  getMyInboxSummary,
  toggleMyEncouragementPin,
  getAdminStats,
  getAdminReview,
};