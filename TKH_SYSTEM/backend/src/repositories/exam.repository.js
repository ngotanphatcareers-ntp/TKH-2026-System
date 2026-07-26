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



async function createExamRecord(
  {
    seasonId,
    name,
    type,
    scheduledStartAt,
    timePerQuestion,
    resultVisibility,
  },
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
    .input(
      "name",
      sql.NVarChar(200),
      name
    )
    .input(
      "type",
      sql.VarChar(30),
      type
    )
    .input(
      "scheduledStartAt",
      sql.DateTime2,
      scheduledStartAt
    )
    .input(
      "timePerQuestion",
      sql.Int,
      timePerQuestion
    )
    .input(
      "resultVisibility",
      sql.VarChar(30),
      resultVisibility
    )
    .query(`
      INSERT INTO dbo.exams
      (
        season_id,
        name,
        type,
        status,
        scheduled_start_at,
        time_per_question,
        result_visibility,
        created_at,
        updated_at
      )
      OUTPUT
        inserted.id,
        inserted.season_id,
        inserted.name,
        inserted.type,
        inserted.status,
        inserted.scheduled_start_at,
        inserted.time_per_question,
        inserted.result_visibility,
        inserted.created_at,
        inserted.updated_at
      VALUES
      (
        @seasonId,
        @name,
        @type,
        'DRAFT',
        @scheduledStartAt,
        @timePerQuestion,
        @resultVisibility,
        SYSDATETIME(),
        SYSDATETIME()
      );
    `);

  return result.recordset[0] || null;
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

/*
=====================================================
Delete one DRAFT exam safely

The transaction locks the exam row, verifies that it
is still DRAFT, blocks deletion when attempts exist,
then removes waiting-room entries, questions and exam.
Answer choices are stored inside exam_questions.
=====================================================
*/

async function deleteDraftExamById(examId) {
  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    transactionStarted = true;

    const examResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          SELECT TOP (1)
            e.id,
            e.status

          FROM dbo.exams AS e
            WITH (UPDLOCK, HOLDLOCK)

          WHERE e.id = @examId;
        `);

    const exam =
      examResult.recordset[0] || null;

    if (!exam) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "NOT_FOUND",
      };
    }

    if (
      String(exam.status).toUpperCase() !==
      "DRAFT"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "NOT_DRAFT",
      };
    }

    const attemptResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          SELECT
            COUNT(*) AS total_attempts

          FROM dbo.exam_attempts AS ea
            WITH (UPDLOCK, HOLDLOCK)

          WHERE ea.exam_id = @examId;
        `);

    const totalAttempts =
      Number(
        attemptResult.recordset[0]
          ?.total_attempts
      ) || 0;

    if (totalAttempts > 0) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "HAS_ATTEMPTS",
        totalAttempts,
      };
    }

    const waitingRoomResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          DELETE FROM dbo.exam_waiting_room
          WHERE exam_id = @examId;
        `);

    const questionsResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          DELETE FROM dbo.exam_questions
          WHERE exam_id = @examId;
        `);

    const examDeleteResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          DELETE FROM dbo.exams
          WHERE id = @examId;
        `);

    await transaction.commit();
    transactionStarted = false;

    return {
      status: "DELETED",

      deletedWaitingRoomEntries:
        Number(
          waitingRoomResult.rowsAffected[0]
        ) || 0,

      deletedQuestions:
        Number(
          questionsResult.rowsAffected[0]
        ) || 0,

      deletedExams:
        Number(
          examDeleteResult.rowsAffected[0]
        ) || 0,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Delete Exam rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}


module.exports = {
  deleteDraftExamById,
  createExamRecord,
  findExamsBySeasonId,
  findExamById,
  findWaitingRoomEntry,
  findLatestAttemptByExamAndMembership,
  createWaitingRoomEntry,
  findMaximumQuestionIndexByExamId,
  createExamQuestion,
};