const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const attendanceController = require("../controllers/attendance.controller");

const router = express.Router();

router.get(
  "/current-session",
  authenticateToken,
  attendanceController.getCurrentSession
);

module.exports = router;