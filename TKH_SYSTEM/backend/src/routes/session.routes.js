const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const requireRole = require("../middleware/require-role");
const sessionController = require("../controllers/session.controller");

const router = express.Router();


router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  sessionController.createSession
);

router.put(
  "/:sessionId/open",
  authenticateToken,
  requireRole("ADMIN"),
  sessionController.openSession
);

router.put(
  "/:sessionId/close",
  authenticateToken,
  requireRole("ADMIN"),
  sessionController.closeSession
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  sessionController.getSessions
);

router.get(
  "/:sessionId",
  authenticateToken,
  requireRole("ADMIN"),
  sessionController.getSessionById
);

module.exports = router;