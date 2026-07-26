const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const {
  getExamsController,
  joinWaitingRoomController,
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


module.exports = router;