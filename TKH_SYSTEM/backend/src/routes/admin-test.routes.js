const express = require("express");

const authenticateToken = require("../middleware/authenticate-token");
const requireRole = require("../middleware/require-role");

const router = express.Router();

router.get(
  "/protected",
  authenticateToken,
  requireRole("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: "Admin access granted",
      },
    });
  }
);

module.exports = router;