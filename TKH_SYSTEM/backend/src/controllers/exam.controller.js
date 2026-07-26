const {
  getExams,
  joinWaitingRoom,
  importExamQuestionsFromExcel,
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
3. Import Exam questions from Excel
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

module.exports = {
  getExamsController,
  joinWaitingRoomController,
  importExamQuestionsFromExcelController,
};