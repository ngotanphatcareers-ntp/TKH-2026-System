const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const sessionController = require("../controllers/session.controller");

const router = express.Router();

router.get(
  "/options",
  authenticateToken,
  sessionController.getSessionOptions
);

module.exports = router;