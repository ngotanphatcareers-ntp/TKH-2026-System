const {
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
} = require(
  "../services/encouragement.service"
);


/*
=====================================================
HTTP status mapping
=====================================================
*/

const STATUS_BY_CODE = {
  MEMBER_NOT_FOUND: 400,
  ACTIVE_SEASON_NOT_FOUND: 404,
  ACTIVE_MEMBERSHIP_NOT_FOUND: 404,
  MEMBERSHIP_NOT_IN_ACTIVE_SEASON: 400,

  RECIPIENT_REQUIRED: 400,
  INVALID_RECIPIENT_USERNAME: 400,
  RECIPIENT_NOT_FOUND: 404,

  MESSAGE_REQUIRED: 400,
  MESSAGE_TOO_LONG: 400,

  CANNOT_SEND_TO_SELF: 400,

  DAILY_ENCOURAGEMENT_LIMIT_REACHED: 409,

  INVALID_ENCOURAGEMENT_ID: 400,
  ENCOURAGEMENT_NOT_FOUND: 404,

  MENS_DAY_TEST_RECIPIENT_NOT_FOUND: 404,
  MENS_DAY_CAMPAIGN_ALREADY_SENT: 409,
};


function sendErrorResponse(res, result) {
  return res
    .status(
      STATUS_BY_CODE[result.code] || 400
    )
    .json(result);
}


/*
=====================================================
1. Get recipients
GET /api/encouragements/recipients
=====================================================
*/

async function getRecipientsController(
  req,
  res
) {
  try {
    const result =
      await getRecipients({
        memberId:
          req.user.memberId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Get encouragement recipients error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}



/*
=====================================================
1. Send encouragement
POST /api/encouragements
=====================================================
*/

async function createEncouragementController(
  req,
  res
) {
  try {
    const result = await sendEncouragement({
      memberId: req.user.memberId,

      recipientUsername:
        req.body.recipientUsername,

      message: req.body.message,

      isAnonymous:
        req.body.isAnonymous,
    });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "Send encouragement error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
2. Get my inbox
GET /api/encouragements/my
=====================================================
*/

async function getMyInboxController(
  req,
  res
) {
  try {
    const markAsRead =
      req.query.markAsRead === undefined
        ? true
        : String(
            req.query.markAsRead
          ).toLowerCase() !== "false";

    const result = await getMyInbox({
      memberId: req.user.memberId,
      markAsRead,
    });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get encouragement inbox error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
3. Get inbox summary only
GET /api/encouragements/my/summary
=====================================================
*/

async function getMyInboxSummaryController(
  req,
  res
) {
  try {
    const result =
      await getMyInboxSummary({
        memberId: req.user.memberId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get encouragement summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
4. Toggle pin
PUT /api/encouragements/:encouragementId/pin
=====================================================
*/

async function togglePinController(
  req,
  res
) {
  try {
    const result =
      await toggleMyEncouragementPin({
        memberId: req.user.memberId,

        encouragementId:
          req.params.encouragementId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Toggle encouragement pin error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
5. Admin statistics
GET /api/admin/encouragements/stats
=====================================================
*/

async function getAdminStatsController(
  req,
  res
) {
  try {
    const result = await getAdminStats({
      limit: req.query.limit,
    });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get admin encouragement stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
6. Admin review list
GET /api/admin/encouragements
=====================================================
*/

async function getAdminReviewController(
  req,
  res
) {
  try {
    const result =
      await getAdminReview();

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get admin encouragement review error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
7. Admin Men's Day campaign preview
GET /api/admin/encouragements/campaigns/mens-day-2026/preview
=====================================================
*/

async function getMensDayCampaignPreviewController(
  req,
  res
) {
  try {
    const result =
      await getMensDayCampaignPreview();

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Get Men's Day campaign preview error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
8. Admin Men's Day TEST send
POST /api/admin/encouragements/campaigns/mens-day-2026/test

TEST MODE:
Recipient is hard-locked to TKH158.
=====================================================
*/

async function sendMensDayCampaignTestController(
  req,
  res
) {
  try {
    const result =
      await sendMensDayCampaignTest({
        message:
          req.body.message,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(201)
      .json(result);
  } catch (error) {
    console.error(
      "Send Men's Day TEST campaign error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

/*
=====================================================
9. Admin Men's Day PRODUCTION bulk send

POST
/api/admin/encouragements/campaigns/mens-day-2026/send
=====================================================
*/

async function sendMensDayCampaignBulkController(
    req,
    res
) {
    try {
        const result =
            await sendMensDayCampaignBulk({
                message:
                    req.body.message,
            });

        if (!result.success) {
            /*
             * Nếu có business validation error
             * như MESSAGE_REQUIRED thì dùng
             * error mapper hiện tại.
             *
             * Nếu batch chạy nhưng có một vài
             * recipient lỗi, vẫn trả result
             * để Admin biết trạng thái thực tế.
             */
            if (
                result.code
            ) {
                return sendErrorResponse(
                    res,
                    result
                );
            }

            return res
                .status(207)
                .json(result);
        }

        return res
            .status(200)
            .json(result);
    } catch (error) {
        console.error(
            "Send Men's Day bulk campaign error:",
            error
        );

        return res.status(500).json({
            success: false,
            code:
                "INTERNAL_SERVER_ERROR",
        });
    }
}

module.exports = {
  getRecipients:
    getRecipientsController,

  createEncouragement:
    createEncouragementController,

  getMyInbox:
    getMyInboxController,

  getMyInboxSummary:
    getMyInboxSummaryController,

  togglePin:
    togglePinController,

  getAdminStats:
    getAdminStatsController,

  getAdminReview:
    getAdminReviewController,

  getMensDayCampaignPreview:
    getMensDayCampaignPreviewController,

  sendMensDayCampaignTest:
    sendMensDayCampaignTestController,
  sendMensDayCampaignBulk:
    sendMensDayCampaignBulkController,
};