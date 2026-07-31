const express = require("express");

const multer = require("multer");

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

const uploadManualScores =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });


router.get(
  "/me-summary",
  authenticateToken,
  scoreController.getMemberScoreSummary
);

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

router.get(
  "/individuals",
  authenticateToken,
  scoreController.getIndividualRankings
);

router.get(
  "/admin/history",
  authenticateToken,
  requireRole("ADMIN"),
  scoreController.getAdminScoreHistory
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

router.post(
  "/admin/import/validate",

  authenticateToken,

  requireRole("ADMIN"),

  uploadManualScores.single(
    "file"
  ),

  scoreController
    .validateManualScoreImport
);

router.post(
  "/admin/import",

  authenticateToken,

  requireRole("ADMIN"),

  uploadManualScores.single(
    "file"
  ),

  scoreController
    .importManualScoresExcel
);

module.exports = router;