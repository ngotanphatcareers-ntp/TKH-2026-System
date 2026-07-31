const {
  findExamsBySeasonId,
  createExamRecord,
  findExamById,
  findWaitingRoomEntry,
  findLatestAttemptByExamAndMembership,
  createWaitingRoomEntry,
  findMaximumQuestionIndexByExamId,
  createExamQuestion,
  openDraftExamWaitingRoomById,
  findActiveExamBySeasonId,
  startWaitingRoomExamById,
  advanceInProgressExamQuestionById,
  finishInProgressExamById,
  closeOpenExamWaitingRoomById,
  findExamRealtimeStateById,
  createLateJoinAttempt,
  updateWaitingRoomLastSeen,
  saveStudentExamAnswer,
} = require(
  "../repositories/exam.repository"
);

const {
  getPool,
  sql,
} = require("../config/database");

const parseExamQuestionsExcel = require(
  "../utils/parse-exam-questions-excel"
);

const {
  findActiveMembershipByMemberId,
} = require(
  "../repositories/membership.repository"
);

const {
  findActiveSeason,
} = require(
  "../repositories/season.repository"
);


/*
=====================================================
Mapping helpers
=====================================================
*/

function mapExam(exam) {
  if (!exam) {
    return null;
  }

  return {
    id: exam.id,
    seasonId: exam.season_id,
    name: exam.name,
    type: exam.type,
    status: exam.status,

    scheduledStartAt:
      exam.scheduled_start_at,

    timePerQuestion:
      Number(exam.time_per_question) || 0,

    resultVisibility:
      exam.result_visibility,

    totalQuestions:
      Number(exam.total_questions) || 0,

    createdAt: exam.created_at,
    updatedAt: exam.updated_at,
  };
}


function mapWaitingRoomEntry(entry) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id,
    examId: entry.exam_id,

    seasonMembershipId:
      entry.season_membership_id,

    joinedAt: entry.joined_at,
    lastSeenAt: entry.last_seen_at,
  };
}


function mapExamAttempt(attempt) {
  if (!attempt) {
    return null;
  }

  return {
    id: attempt.id,
    examId: attempt.exam_id,

    seasonMembershipId:
      attempt.season_membership_id,

    attemptNo:
      Number(attempt.attempt_no) || 0,

    status: attempt.status,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,

    score:
      attempt.score === null ||
      attempt.score === undefined
        ? null
        : Number(attempt.score),

    correctCount:
      Number(attempt.correct_count) || 0,

    totalQuestions:
      Number(attempt.total_questions) || 0,

    isLateJoin:
      Boolean(attempt.is_late_join),

    joinedQuestionIndex:
      attempt.joined_question_index ===
        null ||
      attempt.joined_question_index ===
        undefined
        ? null
        : Number(
            attempt.joined_question_index
          ),

    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
  };
}


function mapExamRealtimeState(state) {
  if (!state) {
    return null;
  }

  return {
    examId: state.exam_id,
    seasonId: state.season_id,
    examName: state.exam_name,
    examType: state.exam_type,
    examStatus: state.exam_status,

    timePerQuestion:
      Number(state.time_per_question) || 0,

    resultVisibility:
      state.result_visibility,

    currentQuestionId:
      state.current_question_id === null ||
      state.current_question_id === undefined
        ? null
        : Number(
            state.current_question_id
          ),

    currentQuestionIndex:
      state.current_question_index ===
        null ||
      state.current_question_index ===
        undefined
        ? null
        : Number(
            state.current_question_index
          ),

    questionStartedAt:
      state.question_started_at,

    questionEndsAt:
      state.question_ends_at,

    liveState:
      state.live_state,

    liveStateUpdatedAt:
      state.live_state_updated_at,

    totalQuestions:
      Number(state.total_questions) || 0,

    waitingRoomCount:
      Number(state.waiting_room_count) || 0,

    totalAttempts:
      Number(state.total_attempts) || 0,

    timerLocked:
      Boolean(state.timer_locked),

    serverTime:
      state.server_time,
  };
}


/*
=====================================================
Shared active-season membership validation
=====================================================
*/

async function resolveActiveMembership(
  memberId
) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  if (
    Number(membership.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "MEMBERSHIP_NOT_IN_ACTIVE_SEASON",
    };
  }

  return {
    success: true,
    activeSeason,
    membership,
  };
}


/*
=====================================================
Database duplicate-key detection
=====================================================
*/

function isDuplicateKeyError(error) {
  const errorNumber = Number(
    error?.number ||
    error?.originalError?.info?.number ||
    error?.precedingErrors?.[0]?.number
  );

  return (
    errorNumber === 2601 ||
    errorNumber === 2627
  );
}


/*
=====================================================
1. Get exams in active season
=====================================================
*/

async function getExams({
  memberId,
}) {
  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const exams =
    await findExamsBySeasonId(
      context.activeSeason.id
    );

  const visibleExams =
    exams.filter((exam) => {
      return ![
        "DRAFT",
        "CANCELLED",
      ].includes(exam.status);
    });

    const examsWithWaitingRoomState =
    await Promise.all(
      visibleExams.map(async (exam) => {
        const waitingRoom =
          await findWaitingRoomEntry({
            examId: exam.id,

            seasonMembershipId:
              context.membership.id,
          });

        return {
          ...mapExam(exam),

          alreadyJoined:
            Boolean(waitingRoom),

          waitingRoom:
            waitingRoom
              ? mapWaitingRoomEntry(
                  waitingRoom
                )
              : null,
        };
      })
    );

  return {
    success: true,
    exams: examsWithWaitingRoomState,
  };
}


/*
=====================================================
Admin: Get all exams in active season
=====================================================
*/

async function getAdminExams() {
  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exams =
    await findExamsBySeasonId(
      activeSeason.id
    );

  return {
    success: true,
    exams: exams.map(mapExam),
  };
}


/*
=====================================================
2. Join exam waiting room

This function only creates or returns a waiting-room
entry. It never creates an exam_attempts record.
=====================================================
*/

async function joinWaitingRoom({
  memberId,
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const context =
    await resolveActiveMembership(memberId);

  if (!context.success) {
    return context;
  }

  const exam =
    await findExamById(normalizedExamId);

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(context.activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  const lookupParams = {
    examId: normalizedExamId,

    seasonMembershipId:
      context.membership.id,
  };

  const latestAttempt =
    await findLatestAttemptByExamAndMembership(
      lookupParams
    );

  if (
    latestAttempt &&
    latestAttempt.status === "COMPLETED"
  ) {
    return {
      success: false,
      code: "EXAM_ALREADY_COMPLETED",
    };
  }

  if (
    exam.status !== "WAITING_ROOM_OPEN"
  ) {
    return {
      success: false,
      code: "EXAM_WAITING_ROOM_NOT_OPEN",
    };
  }

  const existingEntry =
    await findWaitingRoomEntry(
      lookupParams
    );

  if (existingEntry) {
    return {
      success: true,
      alreadyJoined: true,

      exam: mapExam(exam),

      waitingRoom:
        mapWaitingRoomEntry(
          existingEntry
        ),
    };
  }

  try {
    const createdEntry =
      await createWaitingRoomEntry(
        lookupParams
      );

    return {
      success: true,
      alreadyJoined: false,

      exam: mapExam(exam),

      waitingRoom:
        mapWaitingRoomEntry(
          createdEntry
        ),
    };
  } catch (error) {
    /*
    If two requests arrive almost simultaneously,
    the database unique constraint prevents duplicate
    waiting-room records.
    */

    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const duplicateEntry =
      await findWaitingRoomEntry(
        lookupParams
      );

    if (!duplicateEntry) {
      throw error;
    }

    return {
      success: true,
      alreadyJoined: true,

      exam: mapExam(exam),

      waitingRoom:
        mapWaitingRoomEntry(
          duplicateEntry
        ),
    };
  }
}



/*
=====================================================
3. Admin: Create Exam
=====================================================
*/

async function createExam({
  name,
  type,
  scheduledStartAt,
  timePerQuestion,
}) {
  const normalizedName =
    typeof name === "string"
      ? name.trim()
      : "";

  if (
    !normalizedName ||
    normalizedName.length > 200
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_NAME",
    };
  }

  const normalizedType =
    typeof type === "string"
      ? type.trim().toUpperCase()
      : "";

  const allowedTypes = [
    "PRE_TEST",
    "FINAL_TEST",
  ];

  if (
    !allowedTypes.includes(
      normalizedType
    )
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_TYPE",
    };
  }

  const normalizedTimePerQuestion =
    Number(timePerQuestion);

  if (
    !Number.isInteger(
      normalizedTimePerQuestion
    ) ||
    normalizedTimePerQuestion <= 0
  ) {
    return {
      success: false,
      code:
        "INVALID_TIME_PER_QUESTION",
    };
  }

  let normalizedScheduledStartAt = null;

  if (
    scheduledStartAt !== null &&
    scheduledStartAt !== undefined &&
    String(scheduledStartAt).trim()
  ) {
    normalizedScheduledStartAt =
      new Date(scheduledStartAt);

    if (
      Number.isNaN(
        normalizedScheduledStartAt.getTime()
      )
    ) {
      return {
        success: false,
        code:
          "INVALID_SCHEDULED_START_AT",
      };
    }
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code:
        "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const createdExam =
    await createExamRecord({
      seasonId:
        activeSeason.id,

      name:
        normalizedName,

      type:
        normalizedType,

      scheduledStartAt:
        normalizedScheduledStartAt,

      timePerQuestion:
        normalizedTimePerQuestion,

      resultVisibility:
        "FULL_RESULT",
    });

  return {
    success: true,

    data: {
      exam:
        mapExam(createdExam),
    },
  };
}


/*
=====================================================
Admin: Open Exam waiting room
=====================================================
*/

async function openExamWaitingRoom({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "DRAFT"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_DRAFT",
    };
  }

  const totalQuestions =
    Number(exam.total_questions) || 0;

  if (totalQuestions <= 0) {
    return {
      success: false,
      code: "EXAM_HAS_NO_QUESTIONS",
    };
  }

  const activeExam =
    await findActiveExamBySeasonId(
      activeSeason.id
    );

  if (activeExam) {
    return {
      success: false,
      code: "ANOTHER_EXAM_ACTIVE",

      data: {
        activeExam: {
          id: activeExam.id,
          name: activeExam.name,
          status: activeExam.status,
        },
      },
    };
  }


  const updatedExam =
    await openDraftExamWaitingRoomById({
      examId:
        normalizedExamId,

      seasonId:
        activeSeason.id,
    });

  if (!updatedExam) {
    return {
      success: false,
      code: "EXAM_NOT_DRAFT",
    };
  }

  return {
    success: true,

    data: {
      exam: mapExam({
        ...updatedExam,

        total_questions:
          totalQuestions,
      }),
    },
  };
}



/*
=====================================================
Admin: Close Exam waiting room
=====================================================
*/

async function closeExamWaitingRoom({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "WAITING_ROOM_OPEN"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_WAITING_ROOM_OPEN",
    };
  }

  const updatedExam =
    await closeOpenExamWaitingRoomById({
      examId:
        normalizedExamId,

      seasonId:
        activeSeason.id,
    });

  if (!updatedExam) {
    return {
      success: false,
      code: "EXAM_NOT_WAITING_ROOM_OPEN",
    };
  }

  return {
    success: true,

    data: {
      exam: mapExam({
        ...updatedExam,

        total_questions:
          Number(
            exam.total_questions
          ) || 0,
      }),
    },
  };
}


/*
=====================================================
4. Import Exam questions from Excel
=====================================================
*/

async function importExamQuestionsFromExcel({
  examId,
  fileBuffer,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  if (!fileBuffer) {
    return {
      success: false,
      code: "EXCEL_FILE_REQUIRED",
    };
  }

  let parsedExcel;

  try {
    parsedExcel =
      await parseExamQuestionsExcel(
        fileBuffer
      );
  } catch (error) {
    return {
      success: false,
      code: "INVALID_EXCEL_FILE",
      errors: [
        {
          row: 1,
          message:
            "Không thể đọc nội dung file Excel.",
        },
      ],
    };
  }

  if (!parsedExcel.success) {
    return parsedExcel;
  }

  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    transactionStarted = true;

    const exam = await findExamById(
      normalizedExamId,
      transaction
    );

    if (!exam) {
      await transaction.rollback();
      transactionStarted = false;

      return {
        success: false,
        code: "EXAM_NOT_FOUND",
      };
    }

    if (exam.status !== "DRAFT") {
      await transaction.rollback();
      transactionStarted = false;

      return {
        success: false,
        code:
          "EXAM_NOT_EDITABLE",
      };
    }

    const examType =
    String(exam.type || "")
        .trim()
        .toUpperCase();

    const maximumTotalPoints =
    examType === "PRE_TEST"
        ? 10
        : examType === "FINAL_TEST"
        ? 60
        : null;

    if (!maximumTotalPoints) {
    await transaction.rollback();
    transactionStarted = false;

    return {
        success: false,
        code:
        "INVALID_EXAM_TYPE",
    };
    }

    const importedTotalPoints =
    Number(
        parsedExcel.totalPoints
    ) || 0;

    if (
    importedTotalPoints >
    maximumTotalPoints
    ) {
    await transaction.rollback();
    transactionStarted = false;

    return {
        success: false,
        code:
        "EXAM_TOTAL_POINTS_EXCEEDED",

        errors: [
        {
            row: 1,
            message:
            `Tổng điểm của file là ${importedTotalPoints}, vượt quá giới hạn ${maximumTotalPoints} điểm của bài ${examType}.`,
        },
        ],
    };
    }

    const maximumQuestionIndex =
      await findMaximumQuestionIndexByExamId(
        normalizedExamId,
        transaction
      );

    const createdQuestions = [];

    for (
      let index = 0;
      index <
      parsedExcel.questions.length;
      index += 1
    ) {
      const question =
        parsedExcel.questions[index];

      const createdQuestion =
        await createExamQuestion(
          {
            examId:
              normalizedExamId,

            questionIndex:
              maximumQuestionIndex +
              index +
              1,

            ...question,
          },
          transaction
        );

      createdQuestions.push(
        createdQuestion
      );
    }

    await transaction.commit();
    transactionStarted = false;

    return {
      success: true,

      data: {
        examId:
          normalizedExamId,

        importedCount:
          createdQuestions.length,

        firstQuestionIndex:
          maximumQuestionIndex + 1,

        lastQuestionIndex:
          maximumQuestionIndex +
          createdQuestions.length,
      },
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback exam import error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}

/*
=====================================================
5. Admin: Delete a DRAFT Exam
=====================================================
*/

async function deleteExam({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "DRAFT"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_DRAFT",
    };
  }

  const {
    deleteDraftExamById,
  } = require(
    "../repositories/exam.repository"
  );

  const deletionResult =
    await deleteDraftExamById(
      normalizedExamId
    );

  if (
    deletionResult.status ===
    "NOT_FOUND"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    deletionResult.status ===
    "NOT_DRAFT"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_DRAFT",
    };
  }

  if (
    deletionResult.status ===
    "HAS_ATTEMPTS"
  ) {
    return {
      success: false,
      code: "EXAM_HAS_ATTEMPTS",

      totalAttempts:
        deletionResult.totalAttempts,
    };
  }

  return {
    success: true,

    deletedExam: {
      id: normalizedExamId,
      name: exam.name,
    },

    deletedQuestions:
      deletionResult.deletedQuestions,

    deletedWaitingRoomEntries:
      deletionResult
        .deletedWaitingRoomEntries,
  };
}

/*
=====================================================
Admin: Start Exam
=====================================================
*/

async function startExam({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "WAITING_ROOM_OPEN"
  ) {
    return {
      success: false,
      code:
        "EXAM_NOT_WAITING_ROOM_OPEN",
    };
  }

  const result =
    await startWaitingRoomExamById({
      examId: normalizedExamId,
      seasonId: activeSeason.id,
    });

  if (
    result.status ===
    "NOT_WAITING_ROOM_OPEN"
  ) {
    return {
      success: false,
      code:
        "EXAM_NOT_WAITING_ROOM_OPEN",
    };
  }

  if (
    result.status ===
    "NO_QUESTIONS"
  ) {
    return {
      success: false,
      code: "EXAM_HAS_NO_QUESTIONS",
    };
  }

  if (
    result.status ===
    "WAITING_ROOM_EMPTY"
  ) {
    return {
      success: false,
      code: "EXAM_WAITING_ROOM_EMPTY",
    };
  }

  return {
    success: true,

    data: {
      exam: mapExam(
        result.exam
      ),

      liveState: {
        currentQuestionId:
          result.liveState
            .current_question_id,

        currentQuestionIndex:
          result.liveState
            .current_question_index,

        questionStartedAt:
          result.liveState
            .started_at,

        questionEndsAt:
          result.liveState
            .question_ends_at,

        attemptsCreated:
          Number(
            result.liveState
              .attempts_created
          ) || 0,

        waitingRoomCount:
          Number(
            result.waitingRoomCount
          ) || 0,
      },
    },
  };
}

/*
=====================================================
Admin: Advance to the next Exam question
=====================================================
*/

async function advanceExamQuestion({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "IN_PROGRESS"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_PROGRESS",
    };
  }

  const result =
    await advanceInProgressExamQuestionById({
      examId: normalizedExamId,
      seasonId: activeSeason.id,
    });

  if (result.status !== "ADVANCED") {
    return {
      success: false,
      code: result.status,

      questionEndsAt:
        result.questionEndsAt,

      currentQuestionIndex:
        result.currentQuestionIndex,

      totalQuestions:
        result.totalQuestions,
    };
  }

  return {
    success: true,

    data: {
      examId:
        normalizedExamId,

      liveState: {
        currentQuestionId:
          result.liveState
            .current_question_id,

        currentQuestionIndex:
          result.liveState
            .current_question_index,

        questionStartedAt:
          result.liveState
            .question_started_at,

        questionEndsAt:
          result.liveState
            .question_ends_at,

        state:
          result.liveState.state,

        totalQuestions:
          Number(
            result.liveState
              .total_questions
          ) || 0,
      },
    },
  };
}

/*
=====================================================
Admin: Finish Exam
=====================================================
*/

async function finishExam({
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    String(exam.status).toUpperCase() !==
    "IN_PROGRESS"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_PROGRESS",
    };
  }

  const result =
    await finishInProgressExamById({
      examId: normalizedExamId,
      seasonId: activeSeason.id,
    });

  if (
    result.status ===
    "EXAM_NOT_FOUND"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    result.status ===
    "EXAM_NOT_IN_PROGRESS"
  ) {
    return {
      success: false,
      code: "EXAM_NOT_IN_PROGRESS",
    };
  }

  return {
    success: true,

    data: {
      exam:
        mapExam(result.exam),

      completedAt:
        result.completedAt,

      attemptsCompleted:
        result.attemptsCompleted,

      scoreTransactionsCreated:
        result.scoreTransactionsCreated,

      liveStateUpdated:
        result.liveStateUpdated,
    },
  };
}


/*
=====================================================
Get authoritative Exam realtime state

ADMIN can inspect the active-season Exam directly.
Students must have an active-season membership.
=====================================================
*/

async function getExamRealtimeState({
  examId,
  memberId,
  role,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const normalizedRole =
    typeof role === "string"
      ? role.trim().toUpperCase()
      : "";

  let activeSeason;

  if (normalizedRole === "ADMIN") {
    activeSeason =
      await findActiveSeason();

    if (!activeSeason) {
      return {
        success: false,
        code:
          "ACTIVE_SEASON_NOT_FOUND",
      };
    }
  } else {
    const context =
      await resolveActiveMembership(
        memberId
      );

    if (!context.success) {
      return context;
    }

    activeSeason =
      context.activeSeason;
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    normalizedRole !== "ADMIN" &&
    [
      "DRAFT",
      "CANCELLED",
    ].includes(
      String(exam.status).toUpperCase()
    )
  ) {
    return {
      success: false,
      code: "EXAM_NOT_AVAILABLE",
    };
  }

  const realtimeState =
    await findExamRealtimeStateById(
      normalizedExamId
    );

  if (!realtimeState) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  return {
    success: true,

    data: {
      realtimeState:
        mapExamRealtimeState(
          realtimeState
        ),
    },
  };
}


/*
=====================================================
Enter Exam realtime room

WAITING_ROOM_OPEN:
- Uses the existing idempotent waiting-room service.

IN_PROGRESS:
- Returns an existing attempt on reconnect.
- Creates a late-join attempt when missing.
- A new late join can only begin while the current
  question is ACTIVE.
=====================================================
*/

async function joinExamRealtime({
  memberId,
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const context =
    await resolveActiveMembership(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(context.activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  const examStatus =
    String(exam.status).toUpperCase();

  /*
  Waiting-room entry
  */

  if (
    examStatus ===
    "WAITING_ROOM_OPEN"
  ) {
    const waitingRoomResult =
      await joinWaitingRoom({
        memberId,
        examId:
          normalizedExamId,
      });

    if (!waitingRoomResult.success) {
      return waitingRoomResult;
    }

    const realtimeState =
      await findExamRealtimeStateById(
        normalizedExamId
      );

    return {
      success: true,

      data: {
        mode: "WAITING_ROOM",

        alreadyJoined:
          waitingRoomResult
            .alreadyJoined,

        lateJoinCreated: false,

        waitingRoom:
          waitingRoomResult
            .waitingRoom,

        attempt: null,

        realtimeState:
          mapExamRealtimeState(
            realtimeState
          ),
      },
    };
  }

  /*
  Running Exam entry or reconnect
  */

  if (examStatus === "IN_PROGRESS") {
    const lookupParams = {
      examId:
        normalizedExamId,

      seasonMembershipId:
        context.membership.id,
    };

    /*
    An existing attempt means this is a reconnect.
    It remains valid even if the current question
    has already become LOCKED.
    */

    const existingAttempt =
      await findLatestAttemptByExamAndMembership(
        lookupParams
      );

    if (existingAttempt) {
      const realtimeState =
        await findExamRealtimeStateById(
          normalizedExamId
        );

      return {
        success: true,

        data: {
          mode: "IN_PROGRESS",
          alreadyJoined: true,
          lateJoinCreated: false,
          waitingRoom: null,

          attempt:
            mapExamAttempt(
              existingAttempt
            ),

          realtimeState:
            mapExamRealtimeState(
              realtimeState
            ),
        },
      };
    }

    /*
    Reconcile the timer before allowing a new
    late-join attempt.
    */

    const realtimeStateBeforeJoin =
      await findExamRealtimeStateById(
        normalizedExamId
      );

    if (
      !realtimeStateBeforeJoin ||
      !realtimeStateBeforeJoin
        .current_question_id
    ) {
      return {
        success: false,
        code:
          "LIVE_STATE_NOT_FOUND",
      };
    }

    if (
      String(
        realtimeStateBeforeJoin
          .live_state
      ).toUpperCase() !== "ACTIVE"
    ) {
      return {
        success: false,
        code:
          "CURRENT_QUESTION_NOT_ACTIVE",
      };
    }

    const lateJoinResult =
      await createLateJoinAttempt({
        examId:
          normalizedExamId,

        seasonId:
          context.activeSeason.id,

        seasonMembershipId:
          context.membership.id,
      });

    if (
      lateJoinResult.status ===
      "EXAM_NOT_FOUND"
    ) {
      return {
        success: false,
        code: "EXAM_NOT_FOUND",
      };
    }

    if (
      lateJoinResult.status ===
      "EXAM_NOT_IN_PROGRESS"
    ) {
      return {
        success: false,
        code: "EXAM_NOT_IN_PROGRESS",
      };
    }

    if (
      lateJoinResult.status ===
      "LIVE_STATE_NOT_FOUND"
    ) {
      return {
        success: false,
        code:
          "LIVE_STATE_NOT_FOUND",
      };
    }

    const realtimeStateAfterJoin =
      await findExamRealtimeStateById(
        normalizedExamId
      );

    return {
      success: true,

      data: {
        mode: "IN_PROGRESS",

        alreadyJoined:
          lateJoinResult.status ===
          "EXISTING_ATTEMPT",

        lateJoinCreated:
          lateJoinResult.status ===
          "CREATED",

        waitingRoom: null,

        attempt:
          mapExamAttempt(
            lateJoinResult.attempt
          ),

        realtimeState:
          mapExamRealtimeState(
            realtimeStateAfterJoin
          ),
      },
    };
  }

  return {
    success: false,
    code: "EXAM_NOT_JOINABLE",
  };
}


/*
=====================================================
Touch waiting-room presence

The Socket handler will throttle database writes.
This service performs only one requested update.
=====================================================
*/

async function touchWaitingRoomPresence({
  memberId,
  examId,
}) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  const context =
    await resolveActiveMembership(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const exam =
    await findExamById(
      normalizedExamId
    );

  if (!exam) {
    return {
      success: false,
      code: "EXAM_NOT_FOUND",
    };
  }

  if (
    Number(exam.season_id) !==
    Number(context.activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "EXAM_NOT_IN_ACTIVE_SEASON",
    };
  }

  const waitingRoomEntry =
    await updateWaitingRoomLastSeen({
      examId:
        normalizedExamId,

      seasonMembershipId:
        context.membership.id,
    });

  if (!waitingRoomEntry) {
    return {
      success: false,
      code:
        "WAITING_ROOM_ENTRY_NOT_FOUND",
    };
  }

  return {
    success: true,

    data: {
      waitingRoom:
        mapWaitingRoomEntry(
          waitingRoomEntry
        ),
    },
  };
}


/*
=====================================================
Submit or update Student Exam answer
=====================================================
*/

async function submitExamAnswer({
  memberId,
  examId,
  questionId,
  answer,
}) {
  const normalizedExamId =
    Number(examId);

  const normalizedQuestionId =
    Number(questionId);

  const normalizedAnswer =
    String(answer || "")
      .trim()
      .toUpperCase();

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_EXAM_ID",
    };
  }

  if (
    !Number.isInteger(
      normalizedQuestionId
    ) ||
    normalizedQuestionId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_QUESTION_ID",
    };
  }

  if (
    !["A", "B", "C", "D"].includes(
      normalizedAnswer
    )
  ) {
    return {
      success: false,
      code: "INVALID_ANSWER",
    };
  }

  const context =
    await resolveActiveMembership(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const saveResult =
    await saveStudentExamAnswer({
      examId:
        normalizedExamId,

      questionId:
        normalizedQuestionId,

      seasonMembershipId:
        context.membership.id,

      answer:
        normalizedAnswer,
    });

  if (
    saveResult.status !==
    "ANSWER_ACCEPTED"
  ) {
    return {
      success: false,
      code: saveResult.status,
    };
  }

  const savedAnswer =
    saveResult.answer;

  return {
    success: true,

    data: {
      examId:
        normalizedExamId,

      attemptId:
        savedAnswer.attempt_id,

      questionId:
        savedAnswer.question_id,

      answer:
        savedAnswer.chosen_answer,

      answeredAt:
        savedAnswer.answered_at,

      updatedAt:
        savedAnswer.updated_at,
    },
  };
}

module.exports = {
    submitExamAnswer,
  getExamRealtimeState,
  joinExamRealtime,
  touchWaitingRoomPresence,

  finishExam,
  advanceExamQuestion,
  closeExamWaitingRoom,
  startExam,
  openExamWaitingRoom,
  deleteExam,
  getExams,
  getAdminExams,
  createExam,
  joinWaitingRoom,
  importExamQuestionsFromExcel,
};
