const forumService =
  require("../services/forum.service");


const MESSAGE_COOLDOWN_MS = 1000;


/*
=====================================================
Helpers
=====================================================
*/

function normalizeRoomId(roomId) {
  const normalizedRoomId =
    Number(roomId);

  if (
    !Number.isInteger(
      normalizedRoomId
    ) ||
    normalizedRoomId <= 0
  ) {
    return null;
  }

  return normalizedRoomId;
}


function getForumRoomName(roomId) {
  return `forum:room:${roomId}`;
}


function sendAcknowledgement(
  acknowledgement,
  result
) {
  if (
    typeof acknowledgement ===
    "function"
  ) {
    acknowledgement(result);
  }
}


function createErrorResult(
  code,
  message,
  details = null
) {
  return {
    success: false,

    error: {
      code,
      message,
      details,
    },
  };
}


function mapForumError(error) {
  return createErrorResult(
    error?.code ||
      "FORUM_SOCKET_INTERNAL_ERROR",

    error?.message ||
      "Không thể xử lý yêu cầu Diễn đàn.",

    error?.details ||
      null
  );
}


/*
=====================================================
Register Forum Socket handlers
=====================================================
*/

function registerForumSocketHandlers({
  forumNamespace,
  socket,
}) {
  let joinedRoomId = null;
  let lastMessageAt = 0;


  /*
  ===================================================
  Leave current Room
  ===================================================
  */

  async function leaveCurrentRoom() {
    if (!joinedRoomId) {
      return;
    }

    await socket.leave(
      getForumRoomName(
        joinedRoomId
      )
    );

    joinedRoomId = null;
  }


  /*
  ===================================================
  Join Room

  Payload:
  {
    roomId,
    password
  }

  Response:
  {
    room,
    messages,
    limit
  }
  ===================================================
  */

  socket.on(
    "forum:join-room",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const roomId =
          normalizeRoomId(
            payload.roomId
          );

        if (!roomId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_ROOM_ID",
              "Mã phòng chat không hợp lệ."
            )
          );

          return;
        }

        const accessData =
          await forumService
            .verifyRoomAccess({
              roomId,

              password:
                payload.password,
            });

        const messageData =
          await forumService
            .getRecentMessages({
              roomId,
            });

        await leaveCurrentRoom();

        await socket.join(
          getForumRoomName(
            roomId
          )
        );

        joinedRoomId =
          roomId;

        sendAcknowledgement(
          acknowledgement,
          {
            success: true,

            data: {
              room:
                accessData.room,

              messages:
                messageData.messages,

              limit:
                messageData.limit,
            },
          }
        );
      } catch (error) {
        console.error(
          "Forum socket join error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          mapForumError(error)
        );
      }
    }
  );


  /*
  ===================================================
  Leave Room
  ===================================================
  */

  socket.on(
    "forum:leave-room",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const roomId =
          normalizeRoomId(
            payload.roomId
          );

        if (!roomId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_ROOM_ID",
              "Mã phòng chat không hợp lệ."
            )
          );

          return;
        }

        await socket.leave(
          getForumRoomName(
            roomId
          )
        );

        if (
          joinedRoomId === roomId
        ) {
          joinedRoomId = null;
        }

        sendAcknowledgement(
          acknowledgement,
          {
            success: true,

            data: {
              roomId,
              left: true,
            },
          }
        );
      } catch (error) {
        console.error(
          "Forum socket leave error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          mapForumError(error)
        );
      }
    }
  );


  /*
  ===================================================
  Send Message

  Payload:
  {
    roomId,
    messageText
  }
  ===================================================
  */

  socket.on(
    "forum:send-message",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const roomId =
          normalizeRoomId(
            payload.roomId
          );

        if (!roomId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_ROOM_ID",
              "Mã phòng chat không hợp lệ."
            )
          );

          return;
        }

        /*
         * Chỉ được gửi tin vào phòng
         * mà Socket đã tham gia thành công.
         */
        if (
          joinedRoomId !== roomId
        ) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "FORUM_ROOM_NOT_JOINED",
              "Bạn chưa tham gia phòng chat này."
            )
          );

          return;
        }

        const currentTime =
          Date.now();

        if (
          currentTime -
            lastMessageAt <
          MESSAGE_COOLDOWN_MS
        ) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "FORUM_MESSAGE_TOO_FAST",
              "Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút."
            )
          );

          return;
        }

        const data =
          await forumService
            .createForumMessage({
              roomId,

              senderUserId:
                socket.user.id,

              messageText:
                payload.messageText,
            });

        lastMessageAt =
          currentTime;

        /*
         * Gửi tin mới đến tất cả Socket
         * đang ở cùng phòng, bao gồm người gửi.
         */
        forumNamespace
          .to(
            getForumRoomName(
              roomId
            )
          )
          .emit(
            "forum:new-message",
            {
              roomId,

              message:
                data.message,
            }
          );

        sendAcknowledgement(
          acknowledgement,
          {
            success: true,

            data,
          }
        );
      } catch (error) {
        console.error(
          "Forum socket send message error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          mapForumError(error)
        );
      }
    }
  );


  /*
  ===================================================
  Get latest Room list through Socket

  REST vẫn là API chính.
  Event này dùng khi frontend cần làm mới
  danh sách mà không reload trang.
  ===================================================
  */

  socket.on(
    "forum:get-rooms",
    async (
      acknowledgement
    ) => {
      try {
        const data =
          await forumService
            .getActiveRooms();

        sendAcknowledgement(
          acknowledgement,
          {
            success: true,
            data,
          }
        );
      } catch (error) {
        console.error(
          "Forum socket get rooms error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          mapForumError(error)
        );
      }
    }
  );
}


module.exports =
  registerForumSocketHandlers;