const { getPool, sql } = require("../config/database");


async function findActiveMembershipByMemberId(memberId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("memberId", sql.Int, memberId)
    .query(`
      SELECT TOP 1
        sm.id,
        sm.season_id,
        sm.member_id,
        sm.group_id,
        sm.status
      FROM dbo.season_memberships AS sm
      INNER JOIN dbo.seasons AS s
        ON s.id = sm.season_id
      WHERE sm.member_id = @memberId
        AND sm.status = 'ACTIVE'
        AND s.status = 'ACTIVE'
      ORDER BY sm.id DESC;
    `);

  return result.recordset[0] || null;
}


module.exports = {
  findActiveMembershipByMemberId,
};
