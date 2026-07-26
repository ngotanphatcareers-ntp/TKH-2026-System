const {
  getPool,
  sql,
} = require("../config/database");


async function createRequest(
  transaction = null
) {
  if (transaction) {
    return new sql.Request(transaction);
  }

  const pool = await getPool();

  return pool.request();
}


async function findExamsBySeasonId(
  seasonId,
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "seasonId",
      sql.Int,
      seasonId
    )
    .query(`
      SELECT
        e.id,
        e.season_id,
        e.name,
        e.type,
        e.status,
        e.scheduled_start_at,
        e.time_per_question,
        e.result_visibility,
        e.created_at,
        e.updated_at,

        COUNT(eq.id) AS total_questions

      FROM dbo.exams AS e

      LEFT JOIN dbo.exam_questions AS eq
        ON eq.exam_id = e.id

      WHERE e.season_id = @seasonId

      GROUP BY
        e.id,
        e.season_id,
        e.name,
        e.type,
        e.status,
        e.scheduled_start_at,
        e.time_per_question,
        e.result_visibility,
        e.created_at,
        e.updated_at

      ORDER BY
        CASE
          WHEN e.scheduled_start_at IS NULL
            THEN 1
          ELSE 0
        END ASC,
        e.scheduled_start_at ASC,
        e.id ASC;
    `);

  return result.recordset;
}


async function findExamById(
  examId,
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .query(`
      SELECT
        e.id,
        e.season_id,
        e.name,
        e.type,
        e.status,
        e.scheduled_start_at,
        e.time_per_question,
        e.result_visibility,
        e.created_at,
        e.updated_at,

        COUNT(eq.id) AS total_questions

      FROM dbo.exams AS e

      LEFT JOIN dbo.exam_questions AS eq
        ON eq.exam_id = e.id

      WHERE e.id = @examId

      GROUP BY
        e.id,
        e.season_id,
        e.name,
        e.type,
        e.status,
        e.scheduled_start_at,
        e.time_per_question,
        e.result_visibility,
        e.created_at,
        e.updated_at;
    `);

  return result.recordset[0] || null;
}


async function findWaitingRoomEntry(
  {
    examId,
    seasonMembershipId,
  },
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT TOP (1)
        ewr.id,
        ewr.exam_id,
        ewr.season_membership_id,
        ewr.joined_at,
        ewr.last_seen_at

      FROM dbo.exam_waiting_room AS ewr

      WHERE ewr.exam_id = @examId
        AND ewr.season_membership_id =
            @seasonMembershipId

      ORDER BY ewr.id DESC;
    `);

  return result.recordset[0] || null;
}


async function findLatestAttemptByExamAndMembership(
  {
    examId,
    seasonMembershipId,
  },
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT TOP (1)
        ea.id,
        ea.exam_id,
        ea.season_membership_id,
        ea.attempt_no,
        ea.status,
        ea.started_at,
        ea.submitted_at,
        ea.score,
        ea.correct_count,
        ea.total_questions,
        ea.is_late_join,
        ea.joined_question_index,
        ea.created_at,
        ea.updated_at

      FROM dbo.exam_attempts AS ea

      WHERE ea.exam_id = @examId
        AND ea.season_membership_id =
            @seasonMembershipId

      ORDER BY
        ea.attempt_no DESC,
        ea.id DESC;
    `);

  return result.recordset[0] || null;
}


async function createWaitingRoomEntry(
  {
    examId,
    seasonMembershipId,
  },
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      INSERT INTO dbo.exam_waiting_room
      (
        exam_id,
        season_membership_id,
        joined_at,
        last_seen_at
      )
      OUTPUT
        inserted.id,
        inserted.exam_id,
        inserted.season_membership_id,
        inserted.joined_at,
        inserted.last_seen_at
      VALUES
      (
        @examId,
        @seasonMembershipId,
        SYSDATETIME(),
        NULL
      );
    `);

  return result.recordset[0] || null;
}


async function findMaximumQuestionIndexByExamId(
  examId,
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .query(`
      SELECT
        ISNULL(
          MAX(eq.question_index),
          0
        ) AS maximum_question_index

      FROM dbo.exam_questions AS eq
        WITH (UPDLOCK, HOLDLOCK)

      WHERE eq.exam_id = @examId;
    `);

  return Number(
    result.recordset[0]
      ?.maximum_question_index
  ) || 0;
}


async function createExamQuestion(
  {
    examId,
    questionIndex,
    questionText,
    answerA,
    answerB,
    answerC,
    answerD,
    correctAnswer,
    points,
  },
  transaction = null
) {
  const request = await createRequest(
    transaction
  );

  const result = await request
    .input(
      "examId",
      sql.Int,
      examId
    )
    .input(
      "questionIndex",
      sql.Int,
      questionIndex
    )
    .input(
      "questionText",
      sql.NVarChar(sql.MAX),
      questionText
    )
    .input(
      "answerA",
      sql.NVarChar(500),
      answerA
    )
    .input(
      "answerB",
      sql.NVarChar(500),
      answerB
    )
    .input(
      "answerC",
      sql.NVarChar(500),
      answerC
    )
    .input(
      "answerD",
      sql.NVarChar(500),
      answerD
    )
    .input(
      "correctAnswer",
      sql.NVarChar(1),
      correctAnswer
    )
    .input(
      "points",
      sql.Int,
      points
    )
    .query(`
      INSERT INTO dbo.exam_questions
      (
        exam_id,
        question_index,
        question_text,
        answer_a,
        answer_b,
        answer_c,
        answer_d,
        correct_answer,
        points,
        created_at,
        updated_at
      )
      OUTPUT
        inserted.id,
        inserted.exam_id,
        inserted.question_index,
        inserted.question_text,
        inserted.answer_a,
        inserted.answer_b,
        inserted.answer_c,
        inserted.answer_d,
        inserted.correct_answer,
        inserted.points,
        inserted.created_at,
        inserted.updated_at
      VALUES
      (
        @examId,
        @questionIndex,
        @questionText,
        @answerA,
        @answerB,
        @answerC,
        @answerD,
        @correctAnswer,
        @points,
        SYSDATETIME(),
        SYSDATETIME()
      );
    `);

  return result.recordset[0] || null;
}

module.exports = {
  findExamsBySeasonId,
  findExamById,
  findWaitingRoomEntry,
  findLatestAttemptByExamAndMembership,
  createWaitingRoomEntry,
  findMaximumQuestionIndexByExamId,
  createExamQuestion,
};