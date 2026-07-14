const { getPool, sql } = require("../config/database");

async function findUserByUsername(username) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("username", sql.VarChar(100), username)
    .query(`
      SELECT TOP 1
        u.id,
        u.member_id,
        u.username,
        u.password_hash,
        u.role,
        u.must_change_password,
        u.is_active,
        m.full_name,
        m.tkh_code
      FROM dbo.users AS u
      LEFT JOIN dbo.members AS m
        ON m.id = u.member_id
      WHERE u.username = @username;
    `);

  return result.recordset[0] || null;
}

async function updateLastLogin(userId) {
  const pool = await getPool();

  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE dbo.users
      SET
        last_login_at = SYSDATETIME(),
        updated_at = SYSDATETIME()
      WHERE id = @userId;
    `);
}


async function findUserById(userId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.id,
        u.member_id,
        u.username,
        u.role,
        u.must_change_password,
        u.is_active,
        m.full_name,
        m.tkh_code
      FROM dbo.users AS u
      LEFT JOIN dbo.members AS m
        ON m.id = u.member_id
      WHERE u.id = @userId;
    `);

  return result.recordset[0] || null;
}


async function updatePassword(userId, passwordHash) {
  const pool = await getPool();

  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("passwordHash", sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE dbo.users
      SET
        password_hash = @passwordHash,
        must_change_password = 0,
        password_changed_at = SYSDATETIME(),
        updated_at = SYSDATETIME()
      WHERE id = @userId;
    `);
}


module.exports = {
  findUserByUsername,
  findUserById,
  updateLastLogin,
  updatePassword,
};