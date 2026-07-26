const {
  findExamsBySeasonId,
  createExamRecord,
  findExamById,
  findWaitingRoomEntry,
  findLatestAttemptByExamAndMembership,
  createWaitingRoomEntry,
  findMaximumQuestionIndexByExamId,
  createExamQuestion,
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

  return {
    success: true,

    exams:
      visibleExams.map(mapExam),
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


module.exports = {
  deleteExam,
  getExams,
  getAdminExams,
  createExam,
  joinWaitingRoom,
  importExamQuestionsFromExcel,
};