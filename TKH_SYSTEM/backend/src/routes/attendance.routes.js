const express = require("express");

const attendanceController = require(
  "../controllers/attendance.controller"
);

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);


const router = express.Router();


router.get(
  "/current-session",
  authenticateToken,
  attendanceController.getCurrentSession
);


router.post(
  "/check-in",
  authenticateToken,
  attendanceController.checkIn
);


router.get(
  "/history",
  authenticateToken,
  attendanceController.getHistory
);


router.get(
  "/admin/current-session/roster",
  authenticateToken,
  requireRole("ADMIN"),
  attendanceController.getCurrentSessionRoster
);


router.patch(
  "/admin/current-session/window",
  authenticateToken,
  requireRole("ADMIN"),
  attendanceController
    .updateCurrentSessionAttendanceWindow
);


module.exports = router;