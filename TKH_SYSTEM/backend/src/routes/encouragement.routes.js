const express = require("express");

const router = express.Router();

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const {
  getRecipients,
  createEncouragement,
  getMyInbox,
  getMyInboxSummary,
  togglePin,
} = require(
  "../controllers/encouragement.controller"
);

/*
POST /api/encouragements
*/
/*
GET /api/encouragements/recipients
*/
router.get(
  "/recipients",
  authenticateToken,
  getRecipients
);

router.post(
  "/",
  authenticateToken,
  createEncouragement
);

/*
GET /api/encouragements/my
*/
router.get(
  "/my",
  authenticateToken,
  getMyInbox
);

/*
GET /api/encouragements/my/summary
*/
router.get(
  "/my/summary",
  authenticateToken,
  getMyInboxSummary
);

/*
PUT /api/encouragements/:id/pin
*/
router.put(
  "/:encouragementId/pin",
  authenticateToken,
  togglePin
);

module.exports = router;