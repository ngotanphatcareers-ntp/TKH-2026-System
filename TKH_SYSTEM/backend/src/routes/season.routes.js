const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const seasonController = require("../controllers/season.controller");

const router = express.Router();

router.get(
  "/current",
  authenticateToken,
  seasonController.getCurrentSeason
);

module.exports = router;