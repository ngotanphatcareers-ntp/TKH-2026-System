const express =
  require("express");

const authenticateToken =
  require(
    "../middleware/authenticate-token"
  );

const forumController =
  require(
    "../controllers/forum.controller"
  );


const router =
  express.Router();


/*
=====================================================
All Forum routes require login
=====================================================
*/

router.use(
  authenticateToken
);

router.get(
  "/mention-recipients",
  forumController.getMentionRecipients
);

/*
=====================================================
Rooms
=====================================================
*/

router.get(
  "/rooms",
  forumController.getRooms
);


router.post(
  "/rooms",
  forumController.createRoom
);


router.post(
  "/rooms/:roomId/access",
  forumController.accessRoom
);


module.exports =
  router;