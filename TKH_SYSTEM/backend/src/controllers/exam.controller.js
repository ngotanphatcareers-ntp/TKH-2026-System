const {
  getExams,
  getAdminExams,
  createExam,
  deleteExam,
  joinWaitingRoom,
  importExamQuestionsFromExcel,
  openExamWaitingRoom,
  closeExamWaitingRoom,
} = require(
  "../services/exam.service"
);


/*
=====================================================
HTTP status mapping
=====================================================
*/

const STATUS_BY_CODE = {
  MEMBER_NOT_FOUND: 400,
  ACTIVE_SEASON_NOT_FOUND: 404,
  ACTIVE_MEMBERSHIP_NOT_FOUND: 404,
  MEMBERSHIP_NOT_IN_ACTIVE_SEASON: 400,

  INVALID_EXAM_NAME: 400,
  INVALID_EXAM_TYPE: 400,
  INVALID_SCHEDULED_START_AT: 400,
  INVALID_TIME_PER_QUESTION: 400,
  INVALID_EXAM_ID: 400,
  EXAM_NOT_FOUND: 404,
  EXAM_NOT_IN_ACTIVE_SEASON: 400,

  EXAM_ALREADY_COMPLETED: 409,
  EXAM_WAITING_ROOM_NOT_OPEN: 409,
  EXCEL_FILE_REQUIRED: 400,
  INVALID_EXCEL_FILE: 400,
  INVALID_EXCEL_COLUMNS: 400,
  INVALID_EXCEL_ROWS: 400,
  EXCEL_HAS_NO_QUESTIONS: 400,

  EXAM_NOT_EDITABLE: 409,
  EXAM_NOT_DRAFT: 409,
  EXAM_HAS_ATTEMPTS: 409,
  EXAM_HAS_NO_QUESTIONS: 409,
  ANOTHER_EXAM_ACTIVE: 409,
  EXAM_NOT_WAITING_ROOM_OPEN: 409,
};


function sendErrorResponse(res, result) {
  return res
    .status(
      STATUS_BY_CODE[result.code] || 400
    )
    .json(result);
}


/*
=====================================================
1. Get exams
=====================================================
*/

async function getExamsController(
  req,
  res
) {
  try {
    const result =
      await getExams({
        memberId:
          req.user.memberId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Get exams error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
2. Join waiting room
=====================================================
*/

async function joinWaitingRoomController(
  req,
  res
) {
  try {
    const result =
      await joinWaitingRoom({
        memberId:
          req.user.memberId,

        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(
        result.alreadyJoined
          ? 200
          : 201
      )
      .json(result);
  } catch (error) {
    console.error(
      "Join exam waiting room error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

/*
=====================================================
Admin: Get all exams
=====================================================
*/

async function getAdminExamsController(
  req,
  res
) {
  try {
    const result =
      await getAdminExams();

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Get Admin exams error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}



/*
=====================================================
Admin: Create Exam
=====================================================
*/

async function createExamController(
  req,
  res
) {
  try {
    const result =
      await createExam({
        name:
          req.body?.name,

        type:
          req.body?.type,

        scheduledStartAt:
          req.body?.scheduledStartAt,

        timePerQuestion:
          req.body?.timePerQuestion,

      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(201)
      .json(result);
  } catch (error) {
    console.error(
      "Create Exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
Admin: Open Exam waiting room
=====================================================
*/

async function openExamWaitingRoomController(
  req,
  res
) {
  try {
    const result =
      await openExamWaitingRoom({
        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Open Exam waiting room error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}



/*
=====================================================
Admin: Close Exam waiting room
=====================================================
*/

async function closeExamWaitingRoomController(
  req,
  res
) {
  try {
    const result =
      await closeExamWaitingRoom({
        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Close Exam waiting room error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


/*
=====================================================
4. Import Exam questions from Excel
Admin only
=====================================================
*/

async function importExamQuestionsFromExcelController(
  req,
  res
) {
  try {
    const result =
      await importExamQuestionsFromExcel({
        examId:
          req.params.examId,

        fileBuffer:
          req.file?.buffer,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(201)
      .json(result);
  } catch (error) {
    console.error(
      "Import Exam questions error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

/*
=====================================================
Admin: Delete Exam
=====================================================
*/

async function deleteExamController(
  req,
  res
) {
  try {
    const result =
      await deleteExam({
        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Delete Exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


module.exports = {
  closeExamWaitingRoomController,
  openExamWaitingRoomController,
  deleteExamController,
  getExamsController,
  getAdminExamsController,
  createExamController,
  joinWaitingRoomController,
  importExamQuestionsFromExcelController,
};