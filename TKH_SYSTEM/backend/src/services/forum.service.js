const bcrypt = require("bcrypt");

const forumRepository =
  require("../repositories/forum.repository");


/*
=====================================================
Constants
=====================================================
*/

const ROOM_NAME_MAX_LENGTH = 100;
const ROOM_PASSWORD_MAX_LENGTH = 50;
const MESSAGE_MAX_LENGTH = 1000;
const RECENT_MESSAGE_LIMIT = 50;


/*
=====================================================
Error Helper
=====================================================
*/

function createForumError(
  code,
  message,
  status = 400,
  details = null
) {
  const error =
    new Error(message);

  error.code = code;
  error.status = status;

  if (details) {
    error.details = details;
  }

  return error;
}


/*
=====================================================
Normalize Helpers
=====================================================
*/

function normalizeRoomName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}


function normalizeRoomPassword(value) {
  return String(value || "")
    .trim();
}


function normalizeMessageText(value) {
  return String(value || "")
    .trim();
}


function normalizePositiveInteger(
  value,
  fieldName
) {
  const normalizedValue =
    Number(value);

  if (
    !Number.isInteger(
      normalizedValue
    ) ||
    normalizedValue <= 0
  ) {
    throw createForumError(
      "INVALID_" +
        String(fieldName)
          .toUpperCase(),
      `${fieldName} không hợp lệ.`,
      400
    );
  }

  return normalizedValue;
}


/*
=====================================================
Get Active Rooms
=====================================================
*/

async function getActiveRooms() {
  const rooms =
    await forumRepository
      .findAllActiveRooms();

  return {
    rooms,
  };
}


/*
=====================================================
Create Custom Room
=====================================================
*/

async function createCustomRoom({
  name,
  password,
  createdByUserId,
}) {
  const normalizedName =
    normalizeRoomName(name);

  if (!normalizedName) {
    throw createForumError(
      "FORUM_ROOM_NAME_REQUIRED",
      "Vui lòng nhập tên phòng.",
      400
    );
  }

  if (
    normalizedName.length >
    ROOM_NAME_MAX_LENGTH
  ) {
    throw createForumError(
      "FORUM_ROOM_NAME_TOO_LONG",
      `Tên phòng không được vượt quá ${ROOM_NAME_MAX_LENGTH} ký tự.`,
      400
    );
  }

  const normalizedPassword =
    normalizeRoomPassword(
      password
    );

  if (
    normalizedPassword.length >
    ROOM_PASSWORD_MAX_LENGTH
  ) {
    throw createForumError(
      "FORUM_ROOM_PASSWORD_TOO_LONG",
      `Mật khẩu phòng không được vượt quá ${ROOM_PASSWORD_MAX_LENGTH} ký tự.`,
      400
    );
  }

  const normalizedUserId =
    normalizePositiveInteger(
      createdByUserId,
      "USER_ID"
    );

  const passwordHash =
    normalizedPassword
      ? await bcrypt.hash(
          normalizedPassword,
          10
        )
      : null;

  const room =
    await forumRepository
      .createRoom({
        name:
          normalizedName,

        passwordHash,

        createdByUserId:
          normalizedUserId,
      });

  return {
    room,
  };
}


/*
=====================================================
Get Room by ID
=====================================================
*/

async function getRoomById(roomId) {
  const normalizedRoomId =
    normalizePositiveInteger(
      roomId,
      "ROOM_ID"
    );

  const room =
    await forumRepository
      .findRoomById(
        normalizedRoomId
      );

  if (!room) {
    throw createForumError(
      "FORUM_ROOM_NOT_FOUND",
      "Không tìm thấy phòng chat.",
      404
    );
  }

  if (!room.isActive) {
    throw createForumError(
      "FORUM_ROOM_INACTIVE",
      "Phòng chat này hiện không hoạt động.",
      403
    );
  }

  return {
    room,
  };
}


/*
=====================================================
Verify Room Access

Dùng cho:
- Socket.IO join room.
- Kiểm tra mật khẩu phòng riêng.
=====================================================
*/

async function verifyRoomAccess({
  roomId,
  password,
}) {
  const normalizedRoomId =
    normalizePositiveInteger(
      roomId,
      "ROOM_ID"
    );

  const room =
    await forumRepository
      .findRoomById(
        normalizedRoomId,
        {
          includePasswordHash:
            true,
        }
      );

  if (!room) {
    throw createForumError(
      "FORUM_ROOM_NOT_FOUND",
      "Không tìm thấy phòng chat.",
      404
    );
  }

  if (!room.isActive) {
    throw createForumError(
      "FORUM_ROOM_INACTIVE",
      "Phòng chat này hiện không hoạt động.",
      403
    );
  }

  /*
   * Chat tổng luôn có thể vào,
   * không yêu cầu mật khẩu.
   */
  if (
    room.roomType ===
    "GLOBAL"
  ) {
    delete room.passwordHash;

    return {
      room,
      accessGranted: true,
    };
  }

  /*
   * Phòng không có mật khẩu.
   */
  if (!room.passwordHash) {
    delete room.passwordHash;

    return {
      room,
      accessGranted: true,
    };
  }

  const normalizedPassword =
    normalizeRoomPassword(
      password
    );

  if (!normalizedPassword) {
    throw createForumError(
      "FORUM_ROOM_PASSWORD_REQUIRED",
      "Phòng chat này yêu cầu mật khẩu.",
      401
    );
  }

  const passwordMatched =
    await bcrypt.compare(
      normalizedPassword,
      room.passwordHash
    );

  if (!passwordMatched) {
    throw createForumError(
      "FORUM_ROOM_PASSWORD_INVALID",
      "Mật khẩu phòng chat không đúng.",
      401
    );
  }

  delete room.passwordHash;

  return {
    room,
    accessGranted: true,
  };
}


/*
=====================================================
Get Recent Messages
=====================================================
*/

async function getRecentMessages({
  roomId,
}) {
  const normalizedRoomId =
    normalizePositiveInteger(
      roomId,
      "ROOM_ID"
    );

  const room =
    await forumRepository
      .findRoomById(
        normalizedRoomId
      );

  if (!room) {
    throw createForumError(
      "FORUM_ROOM_NOT_FOUND",
      "Không tìm thấy phòng chat.",
      404
    );
  }

  if (!room.isActive) {
    throw createForumError(
      "FORUM_ROOM_INACTIVE",
      "Phòng chat này hiện không hoạt động.",
      403
    );
  }

  const messages =
    await forumRepository
      .findRecentMessages(
        normalizedRoomId,
        RECENT_MESSAGE_LIMIT
      );

  return {
    room,
    messages,
    limit:
      RECENT_MESSAGE_LIMIT,
  };
}


/*
=====================================================
Create Forum Message

Hàm này sẽ được Socket.IO gọi sau này.
=====================================================
*/

async function createForumMessage({
  roomId,
  senderUserId,
  messageText,
}) {
  const normalizedRoomId =
    normalizePositiveInteger(
      roomId,
      "ROOM_ID"
    );

  const normalizedSenderUserId =
    normalizePositiveInteger(
      senderUserId,
      "SENDER_USER_ID"
    );

  const normalizedMessageText =
    normalizeMessageText(
      messageText
    );

  if (!normalizedMessageText) {
    throw createForumError(
      "FORUM_MESSAGE_REQUIRED",
      "Vui lòng nhập nội dung tin nhắn.",
      400
    );
  }

  if (
    normalizedMessageText.length >
    MESSAGE_MAX_LENGTH
  ) {
    throw createForumError(
      "FORUM_MESSAGE_TOO_LONG",
      `Tin nhắn không được vượt quá ${MESSAGE_MAX_LENGTH} ký tự.`,
      400
    );
  }

  const room =
    await forumRepository
      .findRoomById(
        normalizedRoomId
      );

  if (!room) {
    throw createForumError(
      "FORUM_ROOM_NOT_FOUND",
      "Không tìm thấy phòng chat.",
      404
    );
  }

  if (!room.isActive) {
    throw createForumError(
      "FORUM_ROOM_INACTIVE",
      "Phòng chat này hiện không hoạt động.",
      403
    );
  }

  const message =
    await forumRepository
      .createMessage({
        roomId:
          normalizedRoomId,

        senderUserId:
          normalizedSenderUserId,

        messageText:
          normalizedMessageText,
      });

  return {
    message,
  };
}


module.exports = {
  getActiveRooms,
  createCustomRoom,
  getRoomById,
  verifyRoomAccess,
  getRecentMessages,
  createForumMessage,
};