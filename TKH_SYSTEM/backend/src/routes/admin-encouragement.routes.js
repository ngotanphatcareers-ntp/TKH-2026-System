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
} = require(
  "../controllers/encouragement.controller"
);

/*
Admin only
*/

router.get(
  "/stats",
  authenticateToken,
  requireRole("ADMIN"),
  getAdminStats
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  getAdminReview
);

module.exports = router;