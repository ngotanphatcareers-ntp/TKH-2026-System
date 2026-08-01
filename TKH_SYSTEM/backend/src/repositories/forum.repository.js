const {
  getPool,
  sql,
} = require("../config/database");


/*
=====================================================
Helpers
=====================================================
*/

function normalizeRoomRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: Number(record.id),

    name: record.name,

    roomType: record.room_type,

    hasPassword:
      Boolean(record.has_password),

    isActive:
      Boolean(record.is_active),

    createdAt:
      record.created_at,

    updatedAt:
      record.updated_at,

    creator:
      record.created_by_user_id
        ? {
            userId:
              Number(
                record.created_by_user_id
              ),

            username:
              record.creator_username,

            memberId:
              record.creator_member_id
                ? Number(
                    record.creator_member_id
                  )
                : null,

            tkhCode:
              record.creator_tkh_code,

            fullName:
              record.creator_full_name,

            avatarFilename:
              record.creator_avatar_filename,
          }
        : null,
  };
}


function normalizeMessageRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id:
      Number(record.id),

    roomId:
      Number(record.room_id),

    messageText:
      record.message_text,

    createdAt:
      record.created_at,

    sender: {
      userId:
        Number(record.sender_user_id),

      username:
        record.sender_username,

      role:
        record.sender_role,

      memberId:
        record.sender_member_id
          ? Number(record.sender_member_id)
          : null,

      tkhCode:
        record.sender_tkh_code,

      fullName:
        record.sender_full_name ||
        record.sender_username ||
        "Thành viên TKH",

      avatarFilename:
        record.sender_avatar_filename,
    },
  };
}


/*
=====================================================
Shared Room SELECT
=====================================================
*/

const ROOM_SELECT = `
  SELECT
    fr.id,
    fr.name,
    fr.room_type,

    CASE
      WHEN fr.password_hash IS NULL
        THEN CAST(0 AS BIT)
      ELSE CAST(1 AS BIT)
    END AS has_password,

    fr.created_by_user_id,
    fr.is_active,
    fr.created_at,
    fr.updated_at,
    fr.password_hash,

    creator_user.username
      AS creator_username,

    creator_member.id
      AS creator_member_id,

    creator_member.tkh_code
      AS creator_tkh_code,

    creator_member.full_name
      AS creator_full_name,

    creator_member.avatar_filename
      AS creator_avatar_filename

  FROM dbo.forum_rooms AS fr

  LEFT JOIN dbo.users AS creator_user
    ON creator_user.id =
       fr.created_by_user_id

  LEFT JOIN dbo.members AS creator_member
    ON creator_member.id =
       creator_user.member_id
`;


/*
=====================================================
Find all active Rooms
=====================================================
*/

async function findAllActiveRooms() {
  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .query(`
        ${ROOM_SELECT}

        WHERE fr.is_active = 1

        ORDER BY
          CASE
            WHEN fr.room_type = 'GLOBAL'
              THEN 0
            ELSE 1
          END,

          fr.created_at DESC,
          fr.id DESC;
      `);

  return result.recordset.map(
    normalizeRoomRecord
  );
}


/*
=====================================================
Find Room by ID

includePasswordHash:
- false: không trả password_hash.
- true: dùng nội bộ khi kiểm tra mật khẩu phòng.
=====================================================
*/

async function findRoomById(
  roomId,
  {
    includePasswordHash = false,
  } = {}
) {
  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .input(
        "roomId",
        sql.Int,
        roomId
      )
      .query(`
        ${ROOM_SELECT}

        WHERE fr.id = @roomId;
        `);

  const record =
    result.recordset[0];

  if (!record) {
    return null;
  }

  const room =
    normalizeRoomRecord(record);

  if (includePasswordHash) {
    room.passwordHash =
      record.password_hash;
  }

  return room;
}


/*
=====================================================
Find Global Room
=====================================================
*/

async function findGlobalRoom() {
  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .query(`
        ${ROOM_SELECT}

        WHERE
          fr.room_type = 'GLOBAL'
          AND fr.is_active = 1

        ORDER BY fr.id;

      `);

  return normalizeRoomRecord(
    result.recordset[0]
  );
}


/*
=====================================================
Create Custom Room
=====================================================
*/

async function createRoom({
  name,
  passwordHash,
  createdByUserId,
}) {
  const pool =
    await getPool();

  const insertResult =
    await pool
      .request()
      .input(
        "name",
        sql.NVarChar(100),
        name
      )
      .input(
        "passwordHash",
        sql.NVarChar(255),
        passwordHash || null
      )
      .input(
        "createdByUserId",
        sql.Int,
        createdByUserId
      )
      .query(`
        INSERT INTO dbo.forum_rooms
        (
          name,
          room_type,
          password_hash,
          created_by_user_id,
          is_active,
          created_at,
          updated_at
        )
        OUTPUT
          INSERTED.id
            AS room_id
        VALUES
        (
          @name,
          'CUSTOM',
          @passwordHash,
          @createdByUserId,
          1,
          GETDATE(),
          GETDATE()
        );
      `);

  const roomId =
    Number(
      insertResult
        .recordset[0]
        .room_id
    );

  return findRoomById(roomId);
}


/*
=====================================================
Find the 50 newest Messages in a Room

SQL lấy mới nhất trước để sử dụng index,
sau đó JavaScript đảo lại thành:
cũ → mới
để giao diện chat hiển thị đúng thứ tự.
=====================================================
*/

async function findRecentMessages(
  roomId,
  limit = 50
) {
  const normalizedLimit =
    Math.min(
      Math.max(
        Number(limit) || 50,
        1
      ),
      50
    );

  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .input(
        "roomId",
        sql.Int,
        roomId
      )
      .input(
        "limit",
        sql.Int,
        normalizedLimit
      )
      .query(`
        SELECT TOP (@limit)
          fm.id,
          fm.room_id,
          fm.sender_user_id,
          fm.message_text,
          fm.created_at,

          sender_user.username
            AS sender_username,

          sender_user.role
            AS sender_role,

          sender_member.id
            AS sender_member_id,

          sender_member.tkh_code
            AS sender_tkh_code,

          sender_member.full_name
            AS sender_full_name,

          sender_member.avatar_filename
            AS sender_avatar_filename

        FROM dbo.forum_messages AS fm

        INNER JOIN dbo.users AS sender_user
          ON sender_user.id =
             fm.sender_user_id

        LEFT JOIN dbo.members AS sender_member
          ON sender_member.id =
             sender_user.member_id

        WHERE fm.room_id = @roomId

        ORDER BY
          fm.created_at DESC,
          fm.id DESC;
      `);

  return result.recordset
    .map(normalizeMessageRecord)
    .reverse();
}


/*
=====================================================
Create Message

Hàm này được chuẩn bị trước để:
- REST test.
- Socket.IO forum:send-message.
=====================================================
*/

async function createMessage({
  roomId,
  senderUserId,
  messageText,
}) {
  const pool =
    await getPool();

  const insertResult =
    await pool
      .request()
      .input(
        "roomId",
        sql.Int,
        roomId
      )
      .input(
        "senderUserId",
        sql.Int,
        senderUserId
      )
      .input(
        "messageText",
        sql.NVarChar(1000),
        messageText
      )
      .query(`
        INSERT INTO dbo.forum_messages
        (
          room_id,
          sender_user_id,
          message_text,
          created_at
        )
        OUTPUT
          INSERTED.id
            AS message_id
        VALUES
        (
          @roomId,
          @senderUserId,
          @messageText,
          GETDATE()
        );
      `);

  const messageId =
    Number(
      insertResult
        .recordset[0]
        .message_id
    );

  return findMessageById(
    messageId
  );
}


/*
=====================================================
Find Message by ID
=====================================================
*/

async function findMessageById(
  messageId
) {
  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .input(
        "messageId",
        sql.BigInt,
        messageId
      )
      .query(`
        SELECT
          fm.id,
          fm.room_id,
          fm.sender_user_id,
          fm.message_text,
          fm.created_at,

          sender_user.username
            AS sender_username,

          sender_user.role
            AS sender_role,

          sender_member.id
            AS sender_member_id,

          sender_member.tkh_code
            AS sender_tkh_code,

          sender_member.full_name
            AS sender_full_name,

          sender_member.avatar_filename
            AS sender_avatar_filename

        FROM dbo.forum_messages AS fm

        INNER JOIN dbo.users AS sender_user
          ON sender_user.id =
             fm.sender_user_id

        LEFT JOIN dbo.members AS sender_member
          ON sender_member.id =
             sender_user.member_id

        WHERE fm.id = @messageId;
      `);

  return normalizeMessageRecord(
    result.recordset[0]
  );
}


/*
=====================================================
Find active Forum mention recipients
=====================================================
*/

async function findMentionRecipients() {
  const pool =
    await getPool();

  const result =
    await pool
      .request()
      .query(`
        SELECT
          m.id AS member_id,
          m.tkh_code,
          m.full_name,
          m.avatar_filename,

          u.id AS user_id,
          u.username,

          g.id AS group_id,
          g.name AS group_name

        FROM dbo.seasons AS s

        INNER JOIN dbo.season_memberships AS sm
          ON sm.season_id = s.id
          AND sm.status = 'ACTIVE'

        INNER JOIN dbo.members AS m
          ON m.id = sm.member_id
          AND m.status = 'ACTIVE'

        INNER JOIN dbo.users AS u
          ON u.member_id = m.id
          AND u.role = 'STUDENT'
          AND u.is_active = 1

        LEFT JOIN dbo.groups AS g
          ON g.id = sm.group_id

        WHERE s.status = 'ACTIVE'

        ORDER BY
          m.full_name,
          m.tkh_code;
      `);

  return result.recordset.map(
    record => ({
      memberId:
        Number(record.member_id),

      userId:
        Number(record.user_id),

      username:
        record.username,

      tkhCode:
        record.tkh_code,

      fullName:
        record.full_name,

      avatarFilename:
        record.avatar_filename,

      group:
        record.group_id
          ? {
              id:
                Number(record.group_id),

              name:
                record.group_name,
            }
          : null,
    })
  );
}

module.exports = {
  findAllActiveRooms,
  findRoomById,
  findGlobalRoom,
  createRoom,
  findRecentMessages,
  createMessage,
  findMessageById,
  findMentionRecipients,
};
