const {
  getCompletedExamReview,
  getExamRealtimeState,
  getExams,
  getAdminExams,
  createExam,
  deleteExam,
  joinWaitingRoom,
  importExamQuestionsFromExcel,
  startExam,
  advanceExamQuestion,
  finishExam,
  openExamWaitingRoom,
  closeExamWaitingRoom,
  submitExamAnswer,
} = require(
  "../services/exam.service"
);

const {
  findExamPresentationById,
} = require(
  "../repositories/exam.repository"
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
  EXAM_REVIEW_NOT_AVAILABLE: 409,
  EXAM_FULL_RESULT_NOT_AVAILABLE: 403,
  EXAM_ATTEMPT_NOT_FOUND: 404,
  EXAM_ATTEMPT_NOT_COMPLETED: 409,
  EXAM_REVIEW_NOT_FOUND: 404,

  EXAM_WAITING_ROOM_NOT_OPEN: 409,
  EXCEL_FILE_REQUIRED: 400,
  INVALID_EXCEL_FILE: 400,
  INVALID_EXCEL_COLUMNS: 400,
  INVALID_EXCEL_ROWS: 400,
  EXCEL_HAS_NO_QUESTIONS: 400,

  EXAM_NOT_EDITABLE: 409,
  EXAM_NOT_DRAFT: 409,
  EXAM_NOT_IN_PROGRESS: 409,
  LIVE_STATE_NOT_FOUND: 409,
  CURRENT_QUESTION_STILL_ACTIVE: 409,
  LAST_QUESTION_REACHED: 409,
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
Exam realtime event helpers
=====================================================
*/

function getExamRoom(examId) {
  return `exam:${examId}`;
}


function getExamAdminRoom(examId) {
  return `exam:${examId}:admin`;
}


/*
The database mutation has already succeeded when this
helper is called. A Socket broadcast failure must not
turn that successful API request into an HTTP error.
*/

async function emitExamRealtimeEvents(
  req,
  {
    examId,
    eventNames,
  }
) {
  try {
    const normalizedExamId =
      Number(examId);

    const examsNamespace =
      req.app.get(
        "examsNamespace"
      );

    if (
      !examsNamespace ||
      !Number.isInteger(
        normalizedExamId
      ) ||
      normalizedExamId <= 0
    ) {
      return;
    }

    const stateResult =
      await getExamRealtimeState({
        examId:
          normalizedExamId,

        role: "ADMIN",
      });

    if (!stateResult.success) {
      console.error(
        "Get Exam realtime state for broadcast failed:",
        stateResult
      );

      return;
    }

    const payload = {
      examId:
        normalizedExamId,

      realtimeState:
        stateResult.data
          .realtimeState,
    };

    const normalizedEventNames =
      Array.isArray(eventNames)
        ? eventNames
        : [eventNames];

    for (
      const eventName of
      normalizedEventNames
    ) {
      if (!eventName) {
        continue;
      }

      examsNamespace
        .to(
          getExamRoom(
            normalizedExamId
          )
        )
        .to(
          getExamAdminRoom(
            normalizedExamId
          )
        )
        .emit(
          eventName,
          payload
        );
    }
  } catch (error) {
    console.error(
      "Emit Exam realtime event error:",
      error
    );
  }
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

    await emitExamRealtimeEvents(
      req,
      {
        examId:
          req.params.examId,

        eventNames: [
          "exam:status",
        ],
      }
    );

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

    await emitExamRealtimeEvents(
      req,
      {
        examId:
          req.params.examId,

        eventNames: [
          "exam:status",
        ],
      }
    );

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

/*
=====================================================
Admin: Start Exam
=====================================================
*/

async function startExamController(
  req,
  res,
  next
) {
  try {
    const result =
      await startExam({
        examId: req.params.examId,
      });

    if (!result.success) {
      const errorResponses = {
        INVALID_EXAM_ID: {
          status: 400,
          message:
            "Exam ID không hợp lệ.",
        },

        ACTIVE_SEASON_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy mùa Thánh Kinh Hè đang hoạt động.",
        },

        EXAM_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy bài kiểm tra.",
        },

        EXAM_NOT_IN_ACTIVE_SEASON: {
          status: 409,
          message:
            "Bài kiểm tra không thuộc mùa đang hoạt động.",
        },

        EXAM_NOT_WAITING_ROOM_OPEN: {
          status: 409,
          message:
            "Phòng chờ của bài kiểm tra chưa mở hoặc bài đã bắt đầu.",
        },

        EXAM_HAS_NO_QUESTIONS: {
          status: 409,
          message:
            "Bài kiểm tra chưa có câu hỏi.",
        },

        EXAM_WAITING_ROOM_EMPTY: {
          status: 409,
          message:
            "Phòng chờ chưa có học viên.",
        },
      };

      const errorResponse =
        errorResponses[result.code] || {
          status: 400,
          message:
            "Không thể bắt đầu bài kiểm tra.",
        };

      return res
        .status(errorResponse.status)
        .json({
          success: false,

          error: {
            code: result.code,
            message:
              errorResponse.message,
          },
        });
    }

    await emitExamRealtimeEvents(
      req,
      {
        examId:
          req.params.examId,

        eventNames: [
          "exam:status",
          "exam:started",
        ],
      }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/*
=====================================================
Admin: Advance to the next Exam question
=====================================================
*/

async function advanceExamQuestionController(
  req,
  res,
  next
) {
  try {
    const result =
      await advanceExamQuestion({
        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    await emitExamRealtimeEvents(
      req,
      {
        examId:
          req.params.examId,

        eventNames: [
          "exam:status",
          "exam:question-started",
        ],
      }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}


/*
=====================================================
Admin: Finish Exam
=====================================================
*/

async function finishExamController(
  req,
  res,
  next
) {
  try {
    const result =
      await finishExam({
        examId:
          req.params.examId,
      });

    if (!result.success) {
      return sendErrorResponse(
        res,
        result
      );
    }

    await emitExamRealtimeEvents(
      req,
      {
        examId:
          req.params.examId,

        eventNames: [
          "exam:status",
          "exam:finished",
        ],
      }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}


/*
=====================================================
Student: Get completed Exam review
=====================================================
*/

async function getCompletedExamReviewController(
  req,
  res,
  next
) {
  try {
    const result =
      await getCompletedExamReview({
        memberId:
          req.user.memberId,

        examId:
          req.params.examId,
      });

    if (!result.success) {
      const errorResponses = {
        INVALID_EXAM_ID: {
          status: 400,
          message:
            "Exam ID không hợp lệ.",
        },

        MEMBER_NOT_FOUND: {
          status: 400,
          message:
            "Không tìm thấy thông tin học viên.",
        },

        ACTIVE_SEASON_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy mùa Thánh Kinh Hè đang hoạt động.",
        },

        ACTIVE_MEMBERSHIP_NOT_FOUND: {
          status: 403,
          message:
            "Bạn không có hồ sơ học viên trong mùa đang hoạt động.",
        },

        MEMBERSHIP_NOT_IN_ACTIVE_SEASON: {
          status: 403,
          message:
            "Hồ sơ học viên không thuộc mùa đang hoạt động.",
        },

        EXAM_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy bài kiểm tra.",
        },

        EXAM_NOT_IN_ACTIVE_SEASON: {
          status: 403,
          message:
            "Bài kiểm tra không thuộc mùa đang hoạt động.",
        },

        EXAM_REVIEW_NOT_AVAILABLE: {
          status: 409,
          message:
            "Chỉ có thể xem lại bài sau khi bài kiểm tra đã kết thúc.",
        },

        EXAM_FULL_RESULT_NOT_AVAILABLE: {
          status: 403,
          message:
            "Bài kiểm tra này không cho phép xem chi tiết đáp án.",
        },

        EXAM_ATTEMPT_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy bài làm của bạn cho bài kiểm tra này.",
        },

        EXAM_ATTEMPT_NOT_COMPLETED: {
          status: 409,
          message:
            "Bài làm của bạn chưa ở trạng thái hoàn tất.",
        },

        EXAM_REVIEW_NOT_FOUND: {
          status: 404,
          message:
            "Không tìm thấy dữ liệu xem lại bài làm.",
        },
      };

      const errorResponse =
        errorResponses[result.code] || {
          status: 400,
          message:
            "Không thể tải dữ liệu xem lại bài.",
        };

      return res
        .status(errorResponse.status)
        .json({
          success: false,

          error: {
            code:
              result.code,

            message:
              errorResponse.message,
          },
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data:
          result.data,
      });
  } catch (error) {
    next(error);
  }
}

/*
=====================================================
Student: Submit or update Exam answer
=====================================================
*/

async function submitExamAnswerController(
  req,
  res,
  next
) {
  try {
    const result =
      await submitExamAnswer({
        memberId:
          req.user.memberId,

        examId:
          req.params.examId,

        questionId:
          req.body?.question_id,

        answer:
          req.body?.answer,
      });

    if (!result.success) {
      const statusCodeByError = {
        INVALID_EXAM_ID: 400,
        INVALID_QUESTION_ID: 400,
        INVALID_ANSWER: 400,

        ACTIVE_SEASON_NOT_FOUND: 404,
        ACTIVE_MEMBERSHIP_NOT_FOUND: 403,

        EXAM_NOT_FOUND: 404,
        EXAM_NOT_IN_PROGRESS: 409,
        ATTEMPT_NOT_FOUND: 404,
        QUESTION_NOT_ACTIVE: 409,
        ANSWER_TOO_LATE: 409,
        ANSWER_NOT_ACCEPTED: 409,
      };

      const httpStatus =
        statusCodeByError[
          result.code
        ] || 400;

      return res
        .status(httpStatus)
        .json({
          success: false,
          code: result.code,
        });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/*
=====================================================
Admin: Get Exam presentation screen data
=====================================================
*/

async function getExamPresentationController(
  req,
  res,
  next
) {
  try {
    const examId =
      Number(req.params.examId);

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return res.status(400).json({
        success: false,

        error: {
          code: "INVALID_EXAM_ID",
          message:
            "Exam ID không hợp lệ.",
        },
      });
    }

    const presentation =
      await findExamPresentationById(
        examId
      );

    if (!presentation) {
      return res.status(404).json({
        success: false,

        error: {
          code: "EXAM_NOT_FOUND",
          message:
            "Không tìm thấy bài kiểm tra.",
        },
      });
    }

    const currentQuestionId =
      Number(
        presentation
          .current_question_id
      );

    const hasCurrentQuestion =
      Number.isInteger(
        currentQuestionId
      ) &&
      currentQuestionId > 0;

    return res.status(200).json({
      success: true,

      data: {
        exam: {
          id:
            Number(
              presentation.exam_id
            ),

          name:
            presentation.exam_name,

          type:
            presentation.exam_type,

          status:
            presentation.exam_status,

          timePerQuestion:
            Number(
              presentation
                .time_per_question
            ) || 0,

          resultVisibility:
            presentation
              .result_visibility,

          totalQuestions:
            Number(
              presentation
                .total_questions
            ) || 0,
        },

        liveState: {
          currentQuestionId:
            hasCurrentQuestion
              ? currentQuestionId
              : null,

          currentQuestionIndex:
            Number(
              presentation
                .current_question_index
            ) || null,

          questionStartedAt:
            presentation
              .question_started_at,

          questionEndsAt:
            presentation
              .question_ends_at,

          liveState:
            presentation.live_state,

          totalQuestions:
            Number(
              presentation
                .total_questions
            ) || 0,

          answeredCount:
            Number(
              presentation
                .answered_count
            ) || 0,

          totalAttempts:
            Number(
              presentation
                .total_attempts
            ) || 0,

          serverTime:
            presentation.server_time,
        },

        question:
          hasCurrentQuestion
            ? {
                id:
                  currentQuestionId,

                questionIndex:
                  Number(
                    presentation
                      .current_question_index
                  ) || null,

                questionText:
                  presentation
                    .question_text,

                optionA:
                  presentation.answer_a,

                optionB:
                  presentation.answer_b,

                optionC:
                  presentation.answer_c,

                optionD:
                  presentation.answer_d,
              }
            : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
getCompletedExamReviewController,
getExamPresentationController,
submitExamAnswerController,
finishExamController,
advanceExamQuestionController,
closeExamWaitingRoomController,
startExamController,
openExamWaitingRoomController,
deleteExamController,
getExamsController,
getAdminExamsController,
createExamController,
joinWaitingRoomController,
importExamQuestionsFromExcelController,
};
