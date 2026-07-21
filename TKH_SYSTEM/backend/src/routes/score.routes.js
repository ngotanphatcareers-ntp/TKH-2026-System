const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);

const scoreController = require(
  "../controllers/score.controller"
);

const router = express.Router();


router.get(
  "/me",
  authenticateToken,
  scoreController.getMyScores
);

router.get(
  "/my-group",
  authenticateToken,
  scoreController.getMyGroupScores
);


router.get(
  "/groups",
  authenticateToken,
  scoreController.getGroupRankings
);


router.post(
  "/admin/individual",
  authenticateToken,
  requireRole("ADMIN"),
  scoreController.createAdminIndividualScore
);

router.post(
  "/admin/group",
  authenticateToken,
  requireRole("ADMIN"),
  scoreController.createAdminGroupScore
);


module.exports = router;