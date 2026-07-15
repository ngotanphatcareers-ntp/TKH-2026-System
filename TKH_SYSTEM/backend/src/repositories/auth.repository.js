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
        m.tkh_code,

        active_membership.season_membership_id,
        active_membership.season_id,
        active_membership.season_code,
        active_membership.season_name,
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name

      FROM dbo.users AS u
      LEFT JOIN dbo.members AS m
        ON m.id = u.member_id

        OUTER APPLY
        (
        SELECT TOP 1
            sm.id AS season_membership_id,
            sm.group_id,
            s.id AS season_id,
            s.code AS season_code,
            s.name AS season_name
        FROM dbo.season_memberships AS sm
        INNER JOIN dbo.seasons AS s
            ON s.id = sm.season_id
        WHERE sm.member_id = m.id
            AND sm.status = 'ACTIVE'
            AND s.status = 'ACTIVE'
        ORDER BY sm.id DESC
        ) AS active_membership

        LEFT JOIN dbo.groups AS g
        ON g.id = active_membership.group_id

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
        m.tkh_code,

        active_membership.season_membership_id,
        active_membership.season_id,
        active_membership.season_code,
        active_membership.season_name,
        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name


      FROM dbo.users AS u
      LEFT JOIN dbo.members AS m
        ON m.id = u.member_id

        OUTER APPLY
        (
        SELECT TOP 1
            sm.id AS season_membership_id,
            sm.group_id,
            s.id AS season_id,
            s.code AS season_code,
            s.name AS season_name
        FROM dbo.season_memberships AS sm
        INNER JOIN dbo.seasons AS s
            ON s.id = sm.season_id
        WHERE sm.member_id = m.id
            AND sm.status = 'ACTIVE'
            AND s.status = 'ACTIVE'
        ORDER BY sm.id DESC
        ) AS active_membership

        LEFT JOIN dbo.groups AS g
        ON g.id = active_membership.group_id


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