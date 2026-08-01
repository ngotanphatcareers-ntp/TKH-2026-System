const forumService =
  require("../services/forum.service");


/*
=====================================================
Helpers
=====================================================
*/

function sendForumError(
  error,
  req,
  res,
  next
) {
  /*
   * Lỗi nghiệp vụ Forum đã được Service
   * gắn status và code.
   */
  if (error?.status) {
    return res
      .status(error.status)
      .json({
        success: false,

        error: {
          code:
            error.code ||
            "FORUM_ERROR",

          message:
            error.message ||
            "Không thể xử lý yêu cầu Diễn đàn.",

          details:
            error.details ||
            null,
        },
      });
  }

  /*
   * Lỗi không xác định được chuyển tới
   * error middleware chung trong app.js.
   */
  return next(error);
}


/*
=====================================================
GET /api/forum/rooms
=====================================================
*/

async function getRooms(
  req,
  res,
  next
) {
  try {
    const data =
      await forumService
        .getActiveRooms();

    return res
      .status(200)
      .json({
        success: true,
        data,
      });
  } catch (error) {
    return sendForumError(
      error,
      req,
      res,
      next
    );
  }
}

/*
=====================================================
GET /api/forum/mention-recipients
=====================================================
*/

async function getMentionRecipients(
  req,
  res,
  next
) {
  try {
    const data =
      await forumService
        .getMentionRecipients();

    return res
      .status(200)
      .json({
        success: true,
        data,
      });
  } catch (error) {
    return sendForumError(
      error,
      req,
      res,
      next
    );
  }
}

/*
=====================================================
POST /api/forum/rooms
=====================================================
*/

async function createRoom(
  req,
  res,
  next
) {
  try {
    const data =
      await forumService
        .createCustomRoom({
          name:
            req.body?.name,

          password:
            req.body?.password,

          createdByUserId:
            req.user?.id,
        });

    const forumNamespace =
        req.app.get(
            "forumNamespace"
        );

        if (forumNamespace) {
        forumNamespace.emit(
            "forum:room-created",
            {
            room:
                data.room,
            }
        );
        }

    /*
     * Không trả password hoặc passwordHash
     * xuống frontend.
     */
    return res
      .status(201)
      .json({
        success: true,

        message:
          "Đã tạo phòng chat thành công.",

        data,
      });
  } catch (error) {
    return sendForumError(
      error,
      req,
      res,
      next
    );
  }
}


/*
=====================================================
POST /api/forum/rooms/:roomId/access

Dùng để:
- Kiểm tra mật khẩu phòng.
- Trả 50 tin nhắn gần nhất sau khi được phép vào.

Sau này Socket.IO sẽ dùng cùng Service này.
=====================================================
*/

async function accessRoom(
  req,
  res,
  next
) {
  try {
    const accessData =
      await forumService
        .verifyRoomAccess({
          roomId:
            req.params.roomId,

          password:
            req.body?.password,
        });

    const messageData =
      await forumService
        .getRecentMessages({
          roomId:
            req.params.roomId,
        });

    return res
      .status(200)
      .json({
        success: true,

        data: {
          room:
            accessData.room,

          accessGranted:
            accessData.accessGranted,

          messages:
            messageData.messages,

          limit:
            messageData.limit,
        },
      });
  } catch (error) {
    return sendForumError(
      error,
      req,
      res,
      next
    );
  }
}


module.exports = {
  getRooms,
  createRoom,
  accessRoom,
  getMentionRecipients,
};