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
  findMensDayCampaignRecipients,
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

    campaignCode:
      encouragement.campaign_code || null,

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

    /*
     * Quy định mới của BTC:
     * mọi lời khích lệ mới đều phải công khai.
     *
     * Dù client có gửi isAnonymous = true,
     * backend vẫn luôn lưu false.
     *
     * Các thư cũ trong database không bị thay đổi.
     */
    isAnonymous: false,
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

/*
=====================================================
7. Admin Men's Day campaign preview

IMPORTANT:
- Read only
- Does not create encouragements
- Does not send anything
=====================================================
*/

async function getMensDayCampaignPreview() {
  const CAMPAIGN_CODE =
    "MENS_DAY_2026";

  const TEST_USERNAME =
    "tkh158";

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const recipients =
    await findMensDayCampaignRecipients({
      seasonId:
        activeSeason.id,

      campaignCode:
        CAMPAIGN_CODE,
    });

  const alreadySentRecipients =
    recipients.filter(
      item =>
        item.campaign_encouragement_id !==
          null &&
        item.campaign_encouragement_id !==
          undefined
    );

  const pendingRecipients =
    recipients.filter(
      item =>
        item.campaign_encouragement_id ===
          null ||
        item.campaign_encouragement_id ===
          undefined
    );

  const testRecipient =
    recipients.find(
      item =>
        String(item.username || "")
          .trim()
          .toLowerCase() ===
        TEST_USERNAME
    ) || null;

  return {
    success: true,

    campaign: {
      code:
        CAMPAIGN_CODE,

      name:
        "Ngày của Nam 2026",

      gender:
        "Nam",

      recipientCount:
        recipients.length,

      alreadySentCount:
        alreadySentRecipients.length,

      pendingCount:
        pendingRecipients.length,

      testMode:
        true,

      testUsername:
        TEST_USERNAME,

      testRecipient:
        testRecipient
          ? {
              seasonMembershipId:
                testRecipient
                  .season_membership_id,

              memberId:
                testRecipient.member_id,

              username:
                testRecipient.username,

              tkhCode:
                testRecipient.tkh_code,

              fullName:
                testRecipient.full_name,

              gender:
                testRecipient.gender,

              alreadyReceived:
                testRecipient
                  .campaign_encouragement_id !==
                    null &&
                testRecipient
                  .campaign_encouragement_id !==
                    undefined,
            }
          : null,
    },
  };
}


/*
=====================================================
8. Admin Men's Day TEST send

IMPORTANT:
- TEST MODE ONLY
- Recipient is hard-locked to TKH158
- Request cannot choose another recipient
- Creates at most one MENS_DAY_2026 letter
  for TKH158
=====================================================
*/

async function sendMensDayCampaignTest({
  message,
}) {
  const CAMPAIGN_CODE =
    "MENS_DAY_2026";

  const TEST_USERNAME =
    "tkh158";

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

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  /*
   * Lấy đúng tập người nhận Nam hợp lệ
   * trong active season.
   */
  const recipients =
    await findMensDayCampaignRecipients({
      seasonId:
        activeSeason.id,

      campaignCode:
        CAMPAIGN_CODE,
    });

  /*
   * TEST MODE:
   * Không nhận username từ request.
   * Backend tự khóa cứng TKH158.
   */
  const testRecipient =
    recipients.find(
      item =>
        String(item.username || "")
          .trim()
          .toLowerCase() ===
        TEST_USERNAME
    );

  if (!testRecipient) {
    return {
      success: false,
      code:
        "MENS_DAY_TEST_RECIPIENT_NOT_FOUND",
    };
  }

  /*
   * Chặn gửi campaign lần thứ hai.
   */
  if (
    testRecipient
      .campaign_encouragement_id !==
        null &&
    testRecipient
      .campaign_encouragement_id !==
        undefined
  ) {
    return {
      success: false,
      code:
        "MENS_DAY_CAMPAIGN_ALREADY_SENT",

      existingEncouragementId:
        testRecipient
          .campaign_encouragement_id,
    };
  }

  try {
    const encouragement =
      await createEncouragement({
        seasonId:
          activeSeason.id,

        /*
         * Campaign được gửi bởi BTC,
         * không giả lập thành học viên.
         */
        senderSeasonMembershipId:
          null,

        recipientSeasonMembershipId:
          testRecipient
            .season_membership_id,

        message:
          normalizedMessage,

        isAnonymous:
          false,

        campaignCode:
          CAMPAIGN_CODE,
      });

    return {
      success: true,

      testMode:
        true,

      campaign: {
        code:
          CAMPAIGN_CODE,

        name:
          "Ngày của Nam 2026",
      },

      recipient: {
        seasonMembershipId:
          testRecipient
            .season_membership_id,

        memberId:
          testRecipient.member_id,

        username:
          testRecipient.username,

        tkhCode:
          testRecipient.tkh_code,

        fullName:
          testRecipient.full_name,

        gender:
          testRecipient.gender,
      },

      encouragement:
        mapEncouragement(
          encouragement,
          {
            revealAnonymousSender:
              true,
          }
        ),
    };
  } catch (error) {
    /*
     * Existing unique index vẫn là
     * lớp bảo vệ phụ nếu có hai request
     * gần như đồng thời.
     */
    if (
      error?.number === 2601 ||
      error?.number === 2627
    ) {
      return {
        success: false,
        code:
          "MENS_DAY_CAMPAIGN_ALREADY_SENT",
      };
    }

    throw error;
  }
}


/*
=====================================================
9. Admin Men's Day PRODUCTION bulk send

IMPORTANT:
- Sends only to eligible MALE students
- Skips recipients who already received MENS_DAY_2026
- Anonymous
- Normal encouragement visual for everyone except TKH158
- Does NOT modify the supplied message
=====================================================
*/

async function sendMensDayCampaignBulk({
    message,
}) {
    const CAMPAIGN_CODE =
        "MENS_DAY_2026";

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

    const activeSeason =
        await findActiveSeason();

    if (!activeSeason) {
        return {
            success: false,
            code: "ACTIVE_SEASON_NOT_FOUND",
        };
    }

    /*
     * Lấy toàn bộ học viên Nam hợp lệ.
     * Repository cũng cho biết ai đã nhận campaign.
     */
    const recipients =
        await findMensDayCampaignRecipients({
            seasonId:
                activeSeason.id,

            campaignCode:
                CAMPAIGN_CODE,
        });

    /*
     * Chỉ gửi cho người CHƯA có campaign.
     *
     * TKH158 hiện đã có MENS_DAY_2026,
     * vì vậy tự động bị loại khỏi pendingRecipients.
     */
    const pendingRecipients =
        recipients.filter(
            item =>
                item
                    .campaign_encouragement_id ===
                    null ||
                item
                    .campaign_encouragement_id ===
                    undefined
        );

    const alreadySentCount =
        recipients.length -
        pendingRecipients.length;

    /*
     * Nếu tất cả đã nhận rồi,
     * không tạo thêm bất kỳ record nào.
     */
    if (
        pendingRecipients.length === 0
    ) {
        return {
            success: true,

            campaign: {
                code:
                    CAMPAIGN_CODE,

                name:
                    "Ngày của Nam 2026",
            },

            recipientCount:
                recipients.length,

            alreadySentCount,

            sentCount:
                0,

            failedCount:
                0,

            pendingCount:
                0,

            results: [],
        };
    }

    const results = [];

    let sentCount = 0;
    let failedCount = 0;

    /*
     * Gửi tuần tự.
     *
     * Với khoảng 85 người, cách này đơn giản,
     * dễ kiểm soát và tránh tạo burst query.
     */
    for (
        const recipient
        of pendingRecipients
    ) {
        try {
            const encouragement =
                await createEncouragement({
                    seasonId:
                        activeSeason.id,

                    /*
                     * Thư BTC:
                     * không giả lập sender học viên.
                     */
                    senderSeasonMembershipId:
                        null,

                    recipientSeasonMembershipId:
                        recipient
                            .season_membership_id,

                    /*
                     * Giữ nguyên message được gửi lên.
                     */
                    message:
                        normalizedMessage,

                    /*
                    * Quy định hiện tại của BTC:
                    * mọi thư khích lệ mới đều phải công khai.
                    *
                    * Có thể bật lại tính năng ẩn danh trong tương lai
                    * nếu BTC thay đổi quy định.
                    */
                    isAnonymous:
                        false,

                    campaignCode:
                        CAMPAIGN_CODE,
                });

            sentCount += 1;

            results.push({
                success: true,

                encouragementId:
                    encouragement.id,

                seasonMembershipId:
                    recipient
                        .season_membership_id,

                username:
                    recipient.username,

                tkhCode:
                    recipient.tkh_code,

                fullName:
                    recipient.full_name,
            });
        } catch (error) {
            /*
             * Nếu vì lý do concurrency mà
             * database báo duplicate,
             * không làm hỏng toàn bộ batch.
             */
            if (
                error?.number === 2601 ||
                error?.number === 2627
            ) {
                results.push({
                    success: false,

                    skipped: true,

                    reason:
                        "DUPLICATE",

                    seasonMembershipId:
                        recipient
                            .season_membership_id,

                    username:
                        recipient.username,

                    tkhCode:
                        recipient.tkh_code,
                });

                continue;
            }

            failedCount += 1;

            console.error(
                "Mens Day bulk recipient error:",
                {
                    username:
                        recipient.username,

                    tkhCode:
                        recipient.tkh_code,

                    error,
                }
            );

            results.push({
                success: false,

                skipped: false,

                reason:
                    "SEND_FAILED",

                seasonMembershipId:
                    recipient
                        .season_membership_id,

                username:
                    recipient.username,

                tkhCode:
                    recipient.tkh_code,
            });
        }
    }

    /*
     * Query lại sau khi hoàn tất để biết
     * trạng thái campaign thực tế.
     */
    const recipientsAfterSend =
        await findMensDayCampaignRecipients({
            seasonId:
                activeSeason.id,

            campaignCode:
                CAMPAIGN_CODE,
        });

    const pendingAfterSend =
        recipientsAfterSend.filter(
            item =>
                item
                    .campaign_encouragement_id ===
                    null ||
                item
                    .campaign_encouragement_id ===
                    undefined
        );

    return {
        success:
            failedCount === 0,

        campaign: {
            code:
                CAMPAIGN_CODE,

            name:
                "Ngày của Nam 2026",
        },

        recipientCount:
            recipientsAfterSend.length,

        alreadySentBefore:
            alreadySentCount,

        sentCount,

        failedCount,

        pendingCount:
            pendingAfterSend.length,

        alreadySentAfter:
            recipientsAfterSend.length -
            pendingAfterSend.length,

        results,
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
  getMensDayCampaignPreview,
  sendMensDayCampaignTest,
  sendMensDayCampaignBulk,
};