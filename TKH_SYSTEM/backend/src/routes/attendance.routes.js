const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const requireRole = require("../middleware/require-role");
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

router.get(
  "/admin/current-session",
  authenticateToken,
  requireRole("ADMIN"),
  attendanceController.getCurrentSessionRoster
);


module.exports = router;