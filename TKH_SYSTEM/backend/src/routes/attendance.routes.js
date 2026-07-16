const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const attendanceController = require("../controllers/attendance.controller");

const router = express.Router();

router.post(
  "/check-in",
  authenticateToken,
  attendanceController.checkIn
);

router.get(
  "/current-session",
  authenticateToken,
  attendanceController.getCurrentSession
);

router.get(
  "/history",
  authenticateToken,
  attendanceController.getHistory
);

module.exports = router;