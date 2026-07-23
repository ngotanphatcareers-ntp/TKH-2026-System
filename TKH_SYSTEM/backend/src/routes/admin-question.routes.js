const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);

const questionController = require(
  "../controllers/question.controller"
);

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  questionController.getAdminQuestions
);


router.put(
  "/:questionId/reply",
  authenticateToken,
  requireRole("ADMIN"),
  questionController.replyQuestion
);

module.exports = router;
