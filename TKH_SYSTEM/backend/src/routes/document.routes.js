const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const documentController = require(
  "../controllers/document.controller"
);

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  documentController.getDocuments
);

module.exports = router;