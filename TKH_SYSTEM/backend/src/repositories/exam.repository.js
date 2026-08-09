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
        ea.updated_at,

        (
          SELECT
            COALESCE(
              SUM(eq.points),
              0
            )
          FROM dbo.exam_questions AS eq
          WHERE eq.exam_id = ea.exam_id
        ) AS maximum_score

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
    sql.Decimal(10, 2),
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




/*
=====================================================
Find the currently active Exam in one season
=====================================================
*/

async function findActiveExamBySeasonId(
  seasonId
) {
  const pool = await getPool();

  const result =
    await pool.request()
      .input(
        "seasonId",
        sql.Int,
        seasonId
      )
      .query(`
        SELECT TOP (1)
          id,
          season_id,
          name,
          type,
          status,
          scheduled_start_at,
          time_per_question,
          result_visibility,
          created_at,
          updated_at
        FROM dbo.exams
        WHERE season_id = @seasonId
          AND status IN
          (
            'WAITING_ROOM_OPEN',
            'IN_PROGRESS',
            'SUBMITTING'
          )
        ORDER BY
          updated_at DESC,
          id DESC;
      `);

  return result.recordset[0] || null;
}


/*
=====================================================
Close one open waiting room
=====================================================
*/

async function closeOpenExamWaitingRoomById({
  examId,
  seasonId,
}) {
  const pool = await getPool();

  const result =
    await pool.request()
      .input(
        "examId",
        sql.Int,
        examId
      )
      .input(
        "seasonId",
        sql.Int,
        seasonId
      )
      .query(`
        UPDATE dbo.exams
        SET
          status = 'DRAFT',
          updated_at = SYSDATETIME()

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

        WHERE id = @examId
          AND season_id = @seasonId
          AND status = 'WAITING_ROOM_OPEN';
      `);

  return result.recordset[0] || null;
}


/*
=====================================================
Open waiting room for one DRAFT exam

The UPDATE is conditional so only a DRAFT exam
belonging to the active season and containing at
least one question can be opened.
=====================================================
*/

async function openDraftExamWaitingRoomById({
  examId,
  seasonId,
}) {
  const pool = await getPool();

  const result =
    await pool.request()
      .input(
        "examId",
        sql.Int,
        examId
      )
      .input(
        "seasonId",
        sql.Int,
        seasonId
      )
      .query(`
        UPDATE dbo.exams
        SET
          status = 'WAITING_ROOM_OPEN',
          updated_at = SYSDATETIME()

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

        WHERE id = @examId
          AND season_id = @seasonId
          AND status = 'DRAFT'
          AND EXISTS
          (
            SELECT 1
            FROM dbo.exam_questions AS eq
            WHERE eq.exam_id = dbo.exams.id
          )
          AND NOT EXISTS
          (
            SELECT 1
            FROM dbo.exams AS active_exam
            WHERE active_exam.season_id = @seasonId
              AND active_exam.id <> @examId
              AND active_exam.status IN
              (
                'WAITING_ROOM_OPEN',
                'IN_PROGRESS',
                'SUBMITTING'
              )
          );
      `);

  return result.recordset[0] || null;
}

/*
=====================================================
Start one Exam

- Lock the waiting Exam
- Create attempts for waiting-room students
- Activate question 1
- Change Exam status to IN_PROGRESS
=====================================================
*/

async function startWaitingRoomExamById({
  examId,
  seasonId,
}) {
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
            (
              SELECT COUNT(*)
              FROM dbo.exam_questions AS eq
              WHERE eq.exam_id = e.id
            ) AS total_questions
          FROM dbo.exams AS e
            WITH (UPDLOCK, HOLDLOCK)
          WHERE e.id = @examId
            AND e.season_id = @seasonId
            AND e.status = 'WAITING_ROOM_OPEN';
        `);

    const exam =
      examResult.recordset[0] || null;

    if (!exam) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status:
          "NOT_WAITING_ROOM_OPEN",
      };
    }

    const totalQuestions =
      Number(exam.total_questions) || 0;

    if (totalQuestions <= 0) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "NO_QUESTIONS",
      };
    }

    const firstQuestionResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          SELECT TOP (1)
            id,
            question_index
          FROM dbo.exam_questions
          WHERE exam_id = @examId
          ORDER BY question_index ASC;
        `);

    const firstQuestion =
      firstQuestionResult.recordset[0] ||
      null;

    if (!firstQuestion) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "NO_QUESTIONS",
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
          SELECT COUNT(*) AS total
          FROM dbo.exam_waiting_room
            WITH (UPDLOCK, HOLDLOCK)
          WHERE exam_id = @examId;
        `);

    const waitingRoomCount =
      Number(
        waitingRoomResult
          .recordset[0]?.total
      ) || 0;

    if (waitingRoomCount <= 0) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "WAITING_ROOM_EMPTY",
      };
    }

    const startResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "seasonId",
          sql.Int,
          seasonId
        )
        .input(
          "firstQuestionId",
          sql.Int,
          firstQuestion.id
        )
        .input(
          "firstQuestionIndex",
          sql.Int,
          firstQuestion.question_index
        )
        .input(
          "totalQuestions",
          sql.Int,
          totalQuestions
        )
        .input(
          "timePerQuestion",
          sql.Int,
          exam.time_per_question
        )
        .query(`
          DECLARE @startedAt DATETIME2(0)
            = SYSDATETIME();

          DECLARE @questionEndsAt DATETIME2(0)
            = DATEADD(
                SECOND,
                @timePerQuestion,
                @startedAt
              );

          DECLARE @attemptsCreated INT;

          INSERT INTO dbo.exam_attempts
          (
            exam_id,
            season_membership_id,
            attempt_no,
            status,
            started_at,
            total_questions,
            is_late_join,
            joined_question_index,
            created_at,
            updated_at
          )
          SELECT
            @examId,
            wr.season_membership_id,
            1,
            'IN_PROGRESS',
            @startedAt,
            @totalQuestions,
            0,
            @firstQuestionIndex,
            @startedAt,
            @startedAt
          FROM dbo.exam_waiting_room AS wr
          WHERE wr.exam_id = @examId
            AND NOT EXISTS
            (
              SELECT 1
              FROM dbo.exam_attempts AS ea
              WHERE ea.exam_id = @examId
                AND ea.season_membership_id =
                    wr.season_membership_id
            );

          SET @attemptsCreated = @@ROWCOUNT;

          MERGE dbo.exam_live_states
            WITH (HOLDLOCK) AS target
          USING
          (
            SELECT @examId AS exam_id
          ) AS source
          ON target.exam_id = source.exam_id

          WHEN MATCHED THEN
            UPDATE SET
              current_question_id =
                @firstQuestionId,
              current_question_index =
                @firstQuestionIndex,
              question_started_at =
                @startedAt,
              question_ends_at =
                @questionEndsAt,
              state = 'ACTIVE',
              updated_at = @startedAt

          WHEN NOT MATCHED THEN
            INSERT
            (
              exam_id,
              current_question_id,
              current_question_index,
              question_started_at,
              question_ends_at,
              state,
              updated_at
            )
            VALUES
            (
              @examId,
              @firstQuestionId,
              @firstQuestionIndex,
              @startedAt,
              @questionEndsAt,
              'ACTIVE',
              @startedAt
            );

          UPDATE dbo.exams
          SET
            status = 'IN_PROGRESS',
            updated_at = @startedAt
          WHERE id = @examId
            AND season_id = @seasonId
            AND status =
                'WAITING_ROOM_OPEN';

          SELECT
            @startedAt AS started_at,
            @questionEndsAt
              AS question_ends_at,
            @firstQuestionId
              AS current_question_id,
            @firstQuestionIndex
              AS current_question_index,
            @attemptsCreated
              AS attempts_created;
        `);

    await transaction.commit();
    transactionStarted = false;

    return {
      status: "STARTED",

      exam: {
        ...exam,
        status: "IN_PROGRESS",
        updated_at:
            startResult.recordset[0]
            .started_at,
        },

      liveState:
        startResult.recordset[0],

      waitingRoomCount,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Start Exam rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}

/*
=====================================================
Advance one in-progress Exam to the next question

- Reconcile the current question timer
- Only advance after the current question is LOCKED
- Activate the next question with a fresh timer
=====================================================
*/

async function advanceInProgressExamQuestionById({
  examId,
  seasonId,
}) {
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
            e.time_per_question
          FROM dbo.exams AS e
            WITH (UPDLOCK, HOLDLOCK)
          WHERE e.id = @examId
            AND e.season_id = @seasonId;
        `);

    const exam =
      examResult.recordset[0] || null;

    if (!exam) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_FOUND",
      };
    }

    if (
      String(exam.status).toUpperCase() !==
      "IN_PROGRESS"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_IN_PROGRESS",
      };
    }

    /*
    The database is authoritative for the timer. This
    also makes the endpoint work even if no student
    browser performed a realtime sync at expiry.
    */

    await new sql.Request(transaction)
      .input(
        "examId",
        sql.Int,
        examId
      )
      .query(`
        UPDATE dbo.exam_live_states
        SET
          state = 'LOCKED',
          updated_at = SYSDATETIME()
        WHERE exam_id = @examId
          AND state = 'ACTIVE'
          AND question_ends_at IS NOT NULL
          AND question_ends_at <=
              SYSDATETIME();
      `);

    const liveStateResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .query(`
          SELECT
            els.current_question_id,
            els.current_question_index,
            els.question_started_at,
            els.question_ends_at,
            els.state,
            (
              SELECT COUNT(*)
              FROM dbo.exam_questions AS eq
              WHERE eq.exam_id = @examId
            ) AS total_questions
          FROM dbo.exam_live_states AS els
            WITH (UPDLOCK, HOLDLOCK)
          WHERE els.exam_id = @examId;
        `);

    const liveState =
      liveStateResult.recordset[0] ||
      null;

    if (
      !liveState ||
      !liveState.current_question_id ||
      !liveState.current_question_index
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "LIVE_STATE_NOT_FOUND",
      };
    }

    if (
      String(liveState.state).toUpperCase() ===
      "ACTIVE"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status:
          "CURRENT_QUESTION_STILL_ACTIVE",

        questionEndsAt:
          liveState.question_ends_at,
      };
    }

    const nextQuestionResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "currentQuestionIndex",
          sql.Int,
          liveState.current_question_index
        )
        .query(`
          SELECT TOP (1)
            eq.id,
            eq.question_index
          FROM dbo.exam_questions AS eq
          WHERE eq.exam_id = @examId
            AND eq.question_index >
                @currentQuestionIndex
          ORDER BY eq.question_index ASC;
        `);

    const nextQuestion =
      nextQuestionResult.recordset[0] ||
      null;

    if (!nextQuestion) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "LAST_QUESTION_REACHED",

        currentQuestionIndex:
          Number(
            liveState.current_question_index
          ) || 0,

        totalQuestions:
          Number(
            liveState.total_questions
          ) || 0,
      };
    }

    const advanceResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "nextQuestionId",
          sql.Int,
          nextQuestion.id
        )
        .input(
          "nextQuestionIndex",
          sql.Int,
          nextQuestion.question_index
        )
        .input(
          "timePerQuestion",
          sql.Int,
          exam.time_per_question
        )
        .input(
          "totalQuestions",
          sql.Int,
          liveState.total_questions
        )
        .query(`
          DECLARE @startedAt DATETIME2(0)
            = SYSDATETIME();

          DECLARE @questionEndsAt DATETIME2(0)
            = DATEADD(
                SECOND,
                @timePerQuestion,
                @startedAt
              );

          UPDATE dbo.exam_live_states
          SET
            current_question_id =
              @nextQuestionId,
            current_question_index =
              @nextQuestionIndex,
            question_started_at =
              @startedAt,
            question_ends_at =
              @questionEndsAt,
            state = 'ACTIVE',
            updated_at = @startedAt
          WHERE exam_id = @examId;

          SELECT
            @nextQuestionId
              AS current_question_id,
            @nextQuestionIndex
              AS current_question_index,
            @startedAt
              AS question_started_at,
            @questionEndsAt
              AS question_ends_at,
            'ACTIVE' AS state,
            @totalQuestions
              AS total_questions;
        `);

    await transaction.commit();
    transactionStarted = false;

    return {
      status: "ADVANCED",
      exam,
      liveState:
        advanceResult.recordset[0],
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Advance Exam question rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}

/*
=====================================================
Finish one Exam

- Lock the in-progress Exam
- Complete all active attempts
- Lock the realtime state
- Change Exam status to COMPLETED
=====================================================
*/

async function finishInProgressExamById({
  examId,
  seasonId,
}) {
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
            (
              SELECT COUNT(*)
              FROM dbo.exam_questions AS eq
              WHERE eq.exam_id = e.id
            ) AS total_questions
          FROM dbo.exams AS e
            WITH (UPDLOCK, HOLDLOCK)
          WHERE e.id = @examId
            AND e.season_id = @seasonId;
        `);

    const exam =
      examResult.recordset[0] || null;

    if (!exam) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_FOUND",
      };
    }

    if (
      String(exam.status).toUpperCase() !==
      "IN_PROGRESS"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_IN_PROGRESS",
        exam,
      };
    }

    const finishResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "seasonId",
          sql.Int,
          seasonId
        )
        .query(`
          DECLARE @completedAt DATETIME2(0)
            = SYSDATETIME();

            DECLARE @attemptsCompleted INT;
            DECLARE @liveStateUpdated INT;
            DECLARE @scoreTransactionsCreated INT;

          ;WITH AttemptResults AS
(
  SELECT
    ea.id AS attempt_id,

    COALESCE(
      SUM(
        CASE
          WHEN eaa.is_correct = 1
          THEN 1
          ELSE 0
        END
      ),
      0
    ) AS correct_count,

    COALESCE(
      SUM(
        CASE
          WHEN eaa.is_correct = 1
          THEN eq.points
          ELSE 0
        END
      ),
      0
    ) AS score

  FROM dbo.exam_attempts AS ea

  LEFT JOIN dbo.exam_attempt_answers AS eaa
    ON eaa.attempt_id = ea.id

  LEFT JOIN dbo.exam_questions AS eq
    ON eq.id = eaa.question_id
    AND eq.exam_id = ea.exam_id

  WHERE ea.exam_id = @examId
    AND ea.status = 'IN_PROGRESS'

  GROUP BY ea.id
)

UPDATE ea
SET
  ea.status = 'COMPLETED',
  ea.submitted_at = @completedAt,
  ea.correct_count =
    results.correct_count,
  ea.score =
    results.score,
  ea.updated_at = @completedAt
FROM dbo.exam_attempts AS ea

INNER JOIN AttemptResults AS results
  ON results.attempt_id = ea.id;

SET @attemptsCompleted = @@ROWCOUNT;


/*
 * Đồng bộ điểm bài thi đã hoàn thành
 * sang Score Foundation.
 *
 * source_key giúp chống tạo trùng giao dịch
 * nếu tiến trình được gọi lại.
 */
INSERT INTO dbo.score_transactions
(
  season_membership_id,
  score_category,
  score_type,
  requested_points,
  applied_points,
  source_type,
  source_id,
  source_key,
  description,
  status,
  created_by_user_id
)
SELECT
  ea.season_membership_id,

  'LEARNING',

  CASE
    WHEN e.type = 'PRE_TEST'
      THEN 'PRE_TEST'
    WHEN e.type = 'FINAL_TEST'
      THEN 'FINAL_TEST'
  END,

  CAST(
    ea.score AS DECIMAL(10, 2)
  ),

  CAST(
    ea.score AS DECIMAL(10, 2)
  ),

  'TEST',

  ea.id,

  CONCAT(
    'EXAM_ATTEMPT:',
    ea.id
  ),

  CONCAT(
    N'Điểm ',
    e.name
  ),

  'ACTIVE',

  NULL

FROM dbo.exam_attempts AS ea

INNER JOIN dbo.exams AS e
  ON e.id = ea.exam_id

WHERE ea.exam_id = @examId
  AND ea.status = 'COMPLETED'
  AND e.type IN
  (
    'PRE_TEST',
    'FINAL_TEST'
  )
  AND NOT EXISTS
  (
    SELECT 1
    FROM dbo.score_transactions AS st
    WHERE st.source_key =
      CONCAT(
        'EXAM_ATTEMPT:',
        ea.id
      )
  );

SET @scoreTransactionsCreated =
  @@ROWCOUNT;


UPDATE dbo.exam_live_states
SET
  state = 'LOCKED',
  question_ends_at =
    CASE
      WHEN question_ends_at IS NULL
        OR question_ends_at > @completedAt
      THEN @completedAt
      ELSE question_ends_at
    END,
  updated_at = @completedAt
WHERE exam_id = @examId;

SET @liveStateUpdated = @@ROWCOUNT;

          UPDATE dbo.exams
          SET
            status = 'COMPLETED',
            updated_at = @completedAt
          WHERE id = @examId
            AND season_id = @seasonId
            AND status = 'IN_PROGRESS';

          SELECT
            @completedAt AS completed_at,

            @attemptsCompleted
                AS attempts_completed,

            @liveStateUpdated
                AS live_state_updated,

            @scoreTransactionsCreated
                AS score_transactions_created;
        `);

    await transaction.commit();
    transactionStarted = false;

    const completion =
      finishResult.recordset[0];

    return {
      status: "COMPLETED",

      exam: {
        ...exam,
        status: "COMPLETED",
        updated_at:
          completion.completed_at,
      },

      completedAt:
        completion.completed_at,

      attemptsCompleted:
        Number(
          completion.attempts_completed
        ) || 0,

      scoreTransactionsCreated:
        Number(
            completion
            .score_transactions_created
        ) || 0,
    
      liveStateUpdated:
        Number(
          completion.live_state_updated
        ) || 0,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Finish Exam rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}


/*
=====================================================
Find and reconcile Exam realtime state

If the current question has expired, the database
state is changed from ACTIVE to LOCKED.
=====================================================
*/

async function findExamRealtimeStateById(
  examId
) {
  const pool = await getPool();

  const result =
    await pool.request()
      .input(
        "examId",
        sql.Int,
        examId
      )
      .query(`
        DECLARE @timerLocked BIT = 0;

        UPDATE dbo.exam_live_states
        SET
          state = 'LOCKED',
          updated_at = SYSDATETIME()
        WHERE exam_id = @examId
          AND state = 'ACTIVE'
          AND question_ends_at IS NOT NULL
          AND question_ends_at <=
              SYSDATETIME();

        IF @@ROWCOUNT > 0
        BEGIN
          SET @timerLocked = 1;
        END;

        SELECT
          e.id AS exam_id,
          e.season_id,
          e.name AS exam_name,
          e.type AS exam_type,
          e.status AS exam_status,
          e.time_per_question,
          e.result_visibility,

          els.current_question_id,
          els.current_question_index,
          els.question_started_at,
          els.question_ends_at,
          els.state AS live_state,
          els.updated_at
            AS live_state_updated_at,

          eq.question_text,
          eq.answer_a,
          eq.answer_b,
          eq.answer_c,
          eq.answer_d,

          (
            SELECT COUNT(*)
            FROM dbo.exam_questions AS eq
            WHERE eq.exam_id = e.id
          ) AS total_questions,

          (
            SELECT COUNT(*)
            FROM dbo.exam_waiting_room AS ewr
            WHERE ewr.exam_id = e.id
          ) AS waiting_room_count,

          (
            SELECT COUNT(*)
            FROM dbo.exam_attempts AS ea
            WHERE ea.exam_id = e.id
          ) AS total_attempts,

          @timerLocked AS timer_locked,
          SYSDATETIME() AS server_time

        FROM dbo.exams AS e

        LEFT JOIN dbo.exam_live_states
          AS els
          ON els.exam_id = e.id

        LEFT JOIN dbo.exam_questions
          AS eq
          ON eq.id =
              els.current_question_id
          AND eq.exam_id = e.id

        WHERE e.id = @examId;
      `);

  return result.recordset[0] || null;
}


/*
=====================================================
Create an attempt for a late-join student

- Only when Exam is IN_PROGRESS
- Existing attempt is returned instead of duplicated
- joined_question_index records the first question
  visible when the student joins
=====================================================
*/

async function createLateJoinAttempt({
  examId,
  seasonId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    transactionStarted = true;

    /*
    Reconcile an expired question before reading
    the current live state.
    */

    await new sql.Request(transaction)
      .input(
        "examId",
        sql.Int,
        examId
      )
      .query(`
        UPDATE dbo.exam_live_states
        SET
          state = 'LOCKED',
          updated_at = SYSDATETIME()
        WHERE exam_id = @examId
          AND state = 'ACTIVE'
          AND question_ends_at IS NOT NULL
          AND question_ends_at <=
              SYSDATETIME();
      `);

    const contextResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "seasonId",
          sql.Int,
          seasonId
        )
        .query(`
          SELECT
            e.id AS exam_id,
            e.season_id,
            e.status AS exam_status,

            els.current_question_id,
            els.current_question_index,
            els.question_started_at,
            els.question_ends_at,
            els.state AS live_state,

            (
              SELECT COUNT(*)
              FROM dbo.exam_questions AS eq
              WHERE eq.exam_id = e.id
            ) AS total_questions

          FROM dbo.exams AS e
            WITH (UPDLOCK, HOLDLOCK)

          LEFT JOIN dbo.exam_live_states
            AS els WITH (UPDLOCK, HOLDLOCK)
            ON els.exam_id = e.id

          WHERE e.id = @examId
            AND e.season_id = @seasonId;
        `);

    const context =
      contextResult.recordset[0] ||
      null;

    if (!context) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_FOUND",
      };
    }

    if (
      context.exam_status !==
      "IN_PROGRESS"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_IN_PROGRESS",
      };
    }

    if (
      !context.current_question_id ||
      !context.current_question_index
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "LIVE_STATE_NOT_FOUND",
      };
    }

    const existingAttemptResult =
      await new sql.Request(transaction)
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
            WITH (UPDLOCK, HOLDLOCK)

          WHERE ea.exam_id = @examId
            AND ea.season_membership_id =
                @seasonMembershipId

          ORDER BY
            ea.attempt_no DESC,
            ea.id DESC;
        `);

    const existingAttempt =
      existingAttemptResult
        .recordset[0] || null;

    if (existingAttempt) {
      await transaction.commit();
      transactionStarted = false;

      return {
        status: "EXISTING_ATTEMPT",
        attempt: existingAttempt,
        liveState: context,
      };
    }

    const createdAttemptResult =
      await new sql.Request(transaction)
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
        .input(
          "totalQuestions",
          sql.Int,
          Number(
            context.total_questions
          ) || 0
        )
        .input(
          "joinedQuestionIndex",
          sql.Int,
          Number(
            context.current_question_index
          )
        )
        .query(`
          DECLARE @joinedAt DATETIME2(0)
            = SYSDATETIME();

          INSERT INTO dbo.exam_attempts
          (
            exam_id,
            season_membership_id,
            attempt_no,
            status,
            started_at,
            total_questions,
            is_late_join,
            joined_question_index,
            created_at,
            updated_at
          )
          OUTPUT
            inserted.id,
            inserted.exam_id,
            inserted.season_membership_id,
            inserted.attempt_no,
            inserted.status,
            inserted.started_at,
            inserted.submitted_at,
            inserted.score,
            inserted.correct_count,
            inserted.total_questions,
            inserted.is_late_join,
            inserted.joined_question_index,
            inserted.created_at,
            inserted.updated_at
          VALUES
          (
            @examId,
            @seasonMembershipId,
            1,
            'IN_PROGRESS',
            @joinedAt,
            @totalQuestions,
            1,
            @joinedQuestionIndex,
            @joinedAt,
            @joinedAt
          );
        `);

    const createdAttempt =
      createdAttemptResult
        .recordset[0];

    await transaction.commit();
    transactionStarted = false;

    return {
      status: "CREATED",
      attempt: createdAttempt,
      liveState: context,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Late join rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}


/*
=====================================================
Update student heartbeat in waiting room
=====================================================
*/

async function updateWaitingRoomLastSeen({
  examId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const result =
    await pool.request()
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
        UPDATE dbo.exam_waiting_room
        SET last_seen_at = SYSDATETIME()
        OUTPUT
          inserted.id,
          inserted.exam_id,
          inserted.season_membership_id,
          inserted.joined_at,
          inserted.last_seen_at
        WHERE exam_id = @examId
          AND season_membership_id =
              @seasonMembershipId;
      `);

  return result.recordset[0] || null;
}


/*
=====================================================
Submit or update one Student Exam answer

- Resolve the active attempt from membership
- Only accept the current ACTIVE question
- Reject answers after server deadline
- Insert first answer or update changed answer
=====================================================
*/

async function saveStudentExamAnswer({
  examId,
  questionId,
  seasonMembershipId,
  answer,
}) {
  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );

    transactionStarted = true;

    /*
    Read the shared Exam state without update locks.
    Different students must not serialize on the same
    exams or exam_live_states row. The answer row is
    still protected below by its own unique key and
    row/range lock.
    */

    const contextResult =
      await new sql.Request(transaction)
        .input(
          "examId",
          sql.Int,
          examId
        )
        .input(
          "questionId",
          sql.Int,
          questionId
        )
        .input(
          "seasonMembershipId",
          sql.Int,
          seasonMembershipId
        )
        .query(`
          SELECT TOP (1)
            e.id AS exam_id,
            e.status AS exam_status,

            ea.id AS attempt_id,
            ea.status AS attempt_status,

            eq.id AS question_id,
            eq.correct_answer,

            els.current_question_id,
            els.state AS live_state,
            els.question_ends_at,

            SYSDATETIME() AS server_now

          FROM dbo.exams AS e

          LEFT JOIN dbo.exam_attempts AS ea
            ON ea.exam_id = e.id
            AND ea.season_membership_id =
                @seasonMembershipId
            AND ea.status = 'IN_PROGRESS'

          LEFT JOIN dbo.exam_questions AS eq
            ON eq.exam_id = e.id
            AND eq.id = @questionId

          LEFT JOIN dbo.exam_live_states AS els
            ON els.exam_id = e.id

          WHERE e.id = @examId;
        `);

    const context =
      contextResult.recordset[0] || null;

    if (!context) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_FOUND",
      };
    }

    if (
      String(
        context.exam_status || ""
      ).toUpperCase() !== "IN_PROGRESS"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "EXAM_NOT_IN_PROGRESS",
      };
    }

    if (
      !context.attempt_id ||
      String(
        context.attempt_status || ""
      ).toUpperCase() !== "IN_PROGRESS"
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "ATTEMPT_NOT_FOUND",
      };
    }

    const liveState =
      String(
        context.live_state || ""
      ).toUpperCase();

    if (
      !context.question_id ||
      liveState !== "ACTIVE" ||
      Number(
        context.current_question_id
      ) !== Number(questionId)
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "QUESTION_NOT_ACTIVE",
      };
    }

    const serverNow =
      context.server_now
        ? new Date(context.server_now)
        : null;

    const questionEndsAt =
      context.question_ends_at
        ? new Date(
            context.question_ends_at
          )
        : null;

    if (
      !serverNow ||
      !questionEndsAt ||
      serverNow >= questionEndsAt
    ) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "ANSWER_TOO_LATE",
      };
    }

    /*
    Do not use MERGE here.

    The unique constraint on
    attempt_id + question_id prevents duplicate rows.
    An existing answer is updated while the question
    remains ACTIVE.
    */

    const answerResult =
        await new sql.Request(transaction)
            .input(
            "examId",
            sql.Int,
            examId
            )
            .input(
            "attemptId",
            sql.Int,
            context.attempt_id
            )
        .input(
          "questionId",
          sql.Int,
          questionId
        )
        .input(
          "answer",
          sql.Char(1),
          answer
        )
        .input(
          "correctAnswer",
          sql.Char(1),
          context.correct_answer
        )
        .query(`
          DECLARE @acceptedAt DATETIME2(3)
            = SYSDATETIME();

          DECLARE @isCorrect BIT =
            CASE
              WHEN @answer = @correctAnswer
                THEN 1
              ELSE 0
            END;

          IF NOT EXISTS
          (
            SELECT 1
            FROM dbo.exams AS e
            INNER JOIN dbo.exam_attempts AS ea
              ON ea.exam_id = e.id
             AND ea.id = @attemptId
             AND ea.status = 'IN_PROGRESS'
            INNER JOIN dbo.exam_live_states AS els
              ON els.exam_id = e.id
            INNER JOIN dbo.exam_questions AS eq
              ON eq.exam_id = e.id
             AND eq.id = @questionId
            WHERE e.id = @examId
              AND e.status = 'IN_PROGRESS'
              AND els.state = 'ACTIVE'
              AND els.current_question_id = @questionId
              AND els.question_ends_at > @acceptedAt
          )
          BEGIN
            SELECT CAST(NULL AS INT) AS id
            WHERE 1 = 0;
            RETURN;
          END;

          IF EXISTS
          (
            SELECT 1
            FROM dbo.exam_attempt_answers
              WITH (UPDLOCK, HOLDLOCK)
            WHERE attempt_id = @attemptId
              AND question_id = @questionId
          )
          BEGIN
            UPDATE dbo.exam_attempt_answers
            SET
              chosen_answer = @answer,
              is_correct = @isCorrect,
              answered_at = @acceptedAt,
              updated_at = @acceptedAt
            WHERE attempt_id = @attemptId
              AND question_id = @questionId;
          END
          ELSE
          BEGIN
            INSERT INTO dbo.exam_attempt_answers
            (
              attempt_id,
              question_id,
              chosen_answer,
              is_correct,
              answered_at,
              updated_at
            )
            VALUES
            (
              @attemptId,
              @questionId,
              @answer,
              @isCorrect,
              @acceptedAt,
              @acceptedAt
            );
          END;

          SELECT
            eaa.id,
            eaa.attempt_id,
            eaa.question_id,
            eaa.chosen_answer,
            eaa.is_correct,
            eaa.answered_at,
            eaa.updated_at
          FROM dbo.exam_attempt_answers AS eaa
          WHERE eaa.attempt_id = @attemptId
            AND eaa.question_id = @questionId;
        `);

    const savedAnswer =
      answerResult.recordset[0] || null;

    if (!savedAnswer) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        status: "ANSWER_NOT_ACCEPTED",
      };
    }

    await transaction.commit();
    transactionStarted = false;

    return {
      status: "ANSWER_ACCEPTED",
      answer: savedAnswer,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Save Student Exam answer rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}


/*
=====================================================
Get Admin Exam presentation state

Read-only data for the TV / projector screen:
- Exam information
- Current live state
- Current question and four answers
- Answered count for the current question
=====================================================
*/

async function findExamPresentationById(
  examId
) {
  const pool = await getPool();

  const result =
    await pool.request()
      .input(
        "examId",
        sql.Int,
        examId
      )
      .query(`
        /*
        Reconcile timer before reading.
        Database remains the source of truth.
        */

        UPDATE dbo.exam_live_states
        SET
          state = 'LOCKED',
          updated_at = SYSDATETIME()
        WHERE exam_id = @examId
          AND state = 'ACTIVE'
          AND question_ends_at IS NOT NULL
          AND question_ends_at <=
              SYSDATETIME();

        SELECT
          e.id AS exam_id,
          e.name AS exam_name,
          e.type AS exam_type,
          e.status AS exam_status,
          e.time_per_question,
          e.result_visibility,

          (
            SELECT COUNT(*)
            FROM dbo.exam_questions AS total_eq
            WHERE total_eq.exam_id = e.id
          ) AS total_questions,

          els.current_question_id,
          els.current_question_index,
          els.question_started_at,
          els.question_ends_at,
          els.state AS live_state,

          eq.question_text,
          eq.answer_a,
          eq.answer_b,
          eq.answer_c,
          eq.answer_d,

          (
            SELECT COUNT(*)
            FROM dbo.exam_attempt_answers
              AS eaa
            INNER JOIN dbo.exam_attempts
              AS ea
              ON ea.id = eaa.attempt_id
            WHERE ea.exam_id = e.id
              AND eaa.question_id =
                  els.current_question_id
          ) AS answered_count,

          (
            SELECT COUNT(*)
            FROM dbo.exam_attempts AS ea
            WHERE ea.exam_id = e.id
          ) AS total_attempts,

          SYSDATETIME() AS server_time

        FROM dbo.exams AS e

        LEFT JOIN dbo.exam_live_states
          AS els
          ON els.exam_id = e.id

        LEFT JOIN dbo.exam_questions
          AS eq
          ON eq.id =
              els.current_question_id
          AND eq.exam_id = e.id

        WHERE e.id = @examId;
      `);

  return result.recordset[0] || null;
}


/*
=====================================================
Find Student completed Exam review

Security:
- The attempt must belong to the supplied membership.
- Only COMPLETED Exam + COMPLETED attempt are returned.
- FULL_RESULT is required before correct answers can
  be exposed to the Student.
- Start from exam_questions so unanswered questions
  are still included in the review.
=====================================================
*/

async function findCompletedExamReview({
  examId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const summaryResult =
    await pool.request()
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
          e.id AS exam_id,
          e.season_id,
          e.name AS exam_name,
          e.type AS exam_type,
          e.status AS exam_status,
          e.result_visibility,

          ea.id AS attempt_id,
          ea.status AS attempt_status,
          ea.started_at,
          ea.submitted_at,
          ea.score,
          ea.correct_count,
          ea.total_questions,
          ea.is_late_join,
          ea.joined_question_index,

          (
            SELECT
              COALESCE(
                SUM(eq.points),
                0
              )
            FROM dbo.exam_questions AS eq
            WHERE eq.exam_id = e.id
          ) AS maximum_score

        FROM dbo.exams AS e

        INNER JOIN dbo.exam_attempts AS ea
          ON ea.exam_id = e.id
          AND ea.season_membership_id =
              @seasonMembershipId

        WHERE e.id = @examId
          AND e.status = 'COMPLETED'
          AND ea.status = 'COMPLETED'
          AND e.result_visibility =
              'FULL_RESULT'

        ORDER BY
          ea.attempt_no DESC,
          ea.id DESC;
      `);

  const summary =
    summaryResult.recordset[0] ||
    null;

  if (!summary) {
    return null;
  }

  const questionsResult =
    await pool.request()
      .input(
        "examId",
        sql.Int,
        examId
      )
      .input(
        "attemptId",
        sql.Int,
        summary.attempt_id
      )
      .query(`
        SELECT
          eq.id AS question_id,
          eq.question_index,
          eq.question_text,

          eq.answer_a,
          eq.answer_b,
          eq.answer_c,
          eq.answer_d,

          eq.correct_answer,
          eq.points,

          eaa.chosen_answer,
          eaa.is_correct,
          eaa.answered_at,
          eaa.updated_at
            AS answer_updated_at

        FROM dbo.exam_questions AS eq

        LEFT JOIN dbo.exam_attempt_answers
          AS eaa
          ON eaa.question_id = eq.id
          AND eaa.attempt_id =
              @attemptId

        WHERE eq.exam_id = @examId

        ORDER BY
          eq.question_index ASC,
          eq.id ASC;
      `);

  return {
    summary,
    questions:
      questionsResult.recordset,
  };
}

module.exports = {
findCompletedExamReview,
findExamPresentationById,
saveStudentExamAnswer,  
findExamRealtimeStateById,
createLateJoinAttempt,
updateWaitingRoomLastSeen,
finishInProgressExamById,
advanceInProgressExamQuestionById,
startWaitingRoomExamById,
closeOpenExamWaitingRoomById,
findActiveExamBySeasonId,
openDraftExamWaitingRoomById,
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
