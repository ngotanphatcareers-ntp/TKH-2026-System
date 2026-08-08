const express = require("express");

const router = express.Router();

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);

const {
  getAdminStats,
  getAdminReview,
  getMensDayCampaignPreview,
  sendMensDayCampaignTest,
  sendMensDayCampaignBulk,
} = require(
  "../controllers/encouragement.controller"
);


/*
=====================================================
Admin only
=====================================================
*/


/*
GET
/api/admin/encouragements/stats
*/
router.get(
  "/stats",
  authenticateToken,
  requireRole("ADMIN"),
  getAdminStats
);


/*
GET
/api/admin/encouragements/campaigns/mens-day-2026/preview

READ ONLY
Does not send any encouragement.
*/
router.get(
  "/campaigns/mens-day-2026/preview",
  authenticateToken,
  requireRole("ADMIN"),
  getMensDayCampaignPreview
);


/*
POST
/api/admin/encouragements/campaigns/mens-day-2026/test

TEST MODE ONLY
Recipient is hard-locked to TKH158.
*/
router.post(
  "/campaigns/mens-day-2026/test",
  authenticateToken,
  requireRole("ADMIN"),
  sendMensDayCampaignTest
);


/*
POST
/api/admin/encouragements/campaigns/mens-day-2026/send

PRODUCTION BULK SEND

IMPORTANT:
Calling this endpoint creates real encouragements
for all pending eligible male students.
*/
router.post(
    "/campaigns/mens-day-2026/send",
    authenticateToken,
    requireRole("ADMIN"),
    sendMensDayCampaignBulk
);

/*
GET
/api/admin/encouragements
*/
router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  getAdminReview
);


module.exports = router;