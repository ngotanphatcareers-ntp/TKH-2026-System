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

          UPDATE dbo.exam_attempts
          SET
            status = 'COMPLETED',
            updated_at = @completedAt
          WHERE exam_id = @examId
            AND status = 'IN_PROGRESS';

          SET @attemptsCompleted = @@ROWCOUNT;

          UPDATE dbo.exam_live_states
          SET
            state = 'LOCKED',
            question_ends_at =
              CASE
                WHEN question_ends_at IS NULL
                  OR question_ends_at >
                    @completedAt
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
              AS live_state_updated;
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


module.exports = {
  findExamRealtimeStateById,
  createLateJoinAttempt,
  updateWaitingRoomLastSeen,
  finishInProgressExamById,
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