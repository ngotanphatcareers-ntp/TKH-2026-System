const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const requireRole = require("../middleware/require-role");
const memberController = require("../controllers/member.controller");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  memberController.getMembers
);

router.post(
  "/import",
  authenticateToken,
  requireRole("ADMIN"),
  memberController.importMembers
);

module.exports = router;