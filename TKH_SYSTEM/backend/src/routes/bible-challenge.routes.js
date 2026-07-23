const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const requireRole = require("../middleware/require-role");

const bibleChallengeController = require(
  "../controllers/bible-challenge.controller"
);

const router = express.Router();

router.use(
  authenticateToken,
  requireRole("ADMIN")
);

router.get(
  "/current",
  bibleChallengeController.getCurrentChallenge
);

router.post(
  "/draw-group",
  bibleChallengeController.drawGroup
);

router.post(
  "/draw-member/:groupId",
  bibleChallengeController.drawMember
);

router.post(
  "/submit-result",
  bibleChallengeController.submitResult
);

router.get(
  "/history",
  bibleChallengeController.getCurrentSessionHistory
);

module.exports = router;
