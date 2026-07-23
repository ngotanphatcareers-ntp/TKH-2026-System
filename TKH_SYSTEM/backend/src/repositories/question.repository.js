const { getPool, sql } = require("../config/database");


const QUESTION_SELECT = `
  SELECT
    q.id,
    q.season_id,
    q.season_membership_id,
    q.session_id,
    q.visibility,
    q.question_text,
    q.status,
    q.admin_response,
    q.responded_by_user_id,
    q.responded_at,
    q.created_at,
    q.updated_at,

    m.id AS member_id,
    m.full_name AS member_full_name,
    m.tkh_code,

    u.username,

    g.id AS group_id,
    g.code AS group_code,
    g.name AS group_name,

    se.name AS session_name,
    se.session_no,

    responder.username AS responder_username

  FROM dbo.student_questions AS q

  INNER JOIN dbo.season_memberships AS sm
    ON sm.id = q.season_membership_id

  INNER JOIN dbo.members AS m
    ON m.id = sm.member_id

  LEFT JOIN dbo.users AS u
    ON u.member_id = m.id

  LEFT JOIN dbo.groups AS g
    ON g.id = sm.group_id

  LEFT JOIN dbo.sessions AS se
    ON se.id = q.session_id

  LEFT JOIN dbo.users AS responder
    ON responder.id = q.responded_by_user_id
`;


async function findQuestionById(questionId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("questionId", sql.Int, questionId)
    .query(`
      ${QUESTION_SELECT}

      WHERE q.id = @questionId;
    `);

  return result.recordset[0] || null;
}


async function findQuestionsByMembershipId(
  seasonMembershipId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      ${QUESTION_SELECT}

      WHERE q.season_membership_id =
        @seasonMembershipId

      ORDER BY
        q.created_at DESC,
        q.id DESC;
    `);

  return result.recordset;
}


async function findQuestionsBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      ${QUESTION_SELECT}

      WHERE q.season_id = @seasonId

      ORDER BY
        CASE
          WHEN q.status = 'PENDING' THEN 0
          WHEN q.status = 'ANSWERED' THEN 1
          WHEN q.status = 'CLOSED' THEN 2
          WHEN q.status = 'HIDDEN' THEN 3
          ELSE 4
        END,
        q.created_at DESC,
        q.id DESC;
    `);

  return result.recordset;
}


async function createQuestion({
  seasonId,
  seasonMembershipId,
  sessionId,
  visibility,
  questionText,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .input("sessionId", sql.Int, sessionId)
    .input(
      "visibility",
      sql.VarChar(20),
      visibility
    )
    .input(
      "questionText",
      sql.NVarChar(sql.MAX),
      questionText
    )
    .query(`
      INSERT INTO dbo.student_questions
      (
        season_id,
        season_membership_id,
        session_id,
        visibility,
        question_text,
        status
      )
      OUTPUT
        INSERTED.id
      VALUES
      (
        @seasonId,
        @seasonMembershipId,
        @sessionId,
        @visibility,
        @questionText,
        'PENDING'
      );
    `);

  const createdQuestionId =
    result.recordset[0].id;

  return findQuestionById(createdQuestionId);
}


async function respondToQuestion({
  questionId,
  adminResponse,
  respondedByUserId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("questionId", sql.Int, questionId)
    .input(
      "adminResponse",
      sql.NVarChar(sql.MAX),
      adminResponse
    )
    .input(
      "respondedByUserId",
      sql.Int,
      respondedByUserId
    )
    .query(`
      UPDATE dbo.student_questions
      SET
        admin_response = @adminResponse,
        responded_by_user_id =
          @respondedByUserId,
        responded_at = SYSDATETIME(),
        status = 'ANSWERED',
        updated_at = SYSDATETIME()
      WHERE id = @questionId;

      SELECT @@ROWCOUNT AS affected_rows;
    `);

  const affectedRows =
    Number(result.recordset[0]?.affected_rows) || 0;

  if (affectedRows === 0) {
    return null;
  }

  return findQuestionById(questionId);
}


module.exports = {
  findQuestionById,
  findQuestionsByMembershipId,
  findQuestionsBySeasonId,
  createQuestion,
  respondToQuestion,
};
