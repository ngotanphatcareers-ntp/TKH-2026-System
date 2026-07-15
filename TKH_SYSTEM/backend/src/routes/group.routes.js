const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const groupController = require("../controllers/group.controller");

const router = express.Router();

router.get("/", authenticateToken, groupController.getGroups);

module.exports = router;