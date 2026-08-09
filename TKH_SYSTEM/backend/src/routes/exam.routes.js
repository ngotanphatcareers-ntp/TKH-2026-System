const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const {
  getExamsController,
  joinWaitingRoomController,
  getCompletedExamReviewController,
  submitExamAnswerController,
} = require(
  "../controllers/exam.controller"
);

const router = express.Router();


/*
=====================================================
All Exam routes require authentication
=====================================================
*/

router.use(authenticateToken);


/*
=====================================================
GET /api/exams
Get visible exams in the active season
=====================================================
*/

router.get(
  "/",
  getExamsController
);


/*
=====================================================
POST /api/exams/:examId/waiting-room
Join an exam waiting room
=====================================================
*/

router.post(
  "/:examId/waiting-room",
  joinWaitingRoomController
);


/*
=====================================================
GET /api/exams/:examId/attempt/review
Get the authenticated Student completed Exam review
=====================================================
*/

router.get(
  "/:examId/attempt/review",
  getCompletedExamReviewController
);

/*
=====================================================
POST /api/exams/:examId/attempt/answer
Submit or update the current Student answer
=====================================================
*/

router.post(
  "/:examId/attempt/answer",
  submitExamAnswerController
);

module.exports = router;