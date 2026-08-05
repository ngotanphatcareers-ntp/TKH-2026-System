const {
  getStudentSurveyList:
    getStudentSurveyListService,

  getStudentSurveyDetail:
    getStudentSurveyDetailService,

  submitStudentSurvey:
    submitStudentSurveyService,

  getAdminSurveyList:
    getAdminSurveyListService,

  getAdminSurveyDetail:
    getAdminSurveyDetailService,

  changeSurveyStatus:
    changeSurveyStatusService,
} = require(
  "../services/survey.service"
);


/*
 * =========================================================
 * HÀM HỖ TRỢ TRẢ LỖI
 * =========================================================
 */

function getSurveyErrorStatus(code) {
  const statusByCode = {
    /*
     * Xác thực và membership
     */
    MEMBER_NOT_FOUND: 403,
    ACTIVE_MEMBERSHIP_NOT_FOUND: 403,
    MEMBERSHIP_NOT_IN_ACTIVE_SEASON: 403,
    MEMBERSHIP_NOT_IN_SURVEY_SEASON: 403,

    /*
     * Season
     */
    ACTIVE_SEASON_NOT_FOUND: 404,

    /*
     * Survey
     */
    INVALID_SURVEY_ID: 400,
    SURVEY_NOT_FOUND: 404,
    SURVEY_NOT_IN_ACTIVE_SEASON: 404,
    SURVEY_NOT_AVAILABLE: 404,
    SURVEY_NOT_OPEN: 409,
    SURVEY_HAS_NO_QUESTIONS: 409,
    SURVEY_ALREADY_SUBMITTED: 409,

    /*
     * Answers
     */
    SURVEY_ANSWERS_REQUIRED: 400,
    INVALID_SURVEY_QUESTION_ID: 400,
    INVALID_SURVEY_QUESTION: 400,
    DUPLICATE_SURVEY_QUESTION: 400,
    REQUIRED_SURVEY_ANSWER_MISSING: 400,
    SURVEY_ANSWER_COUNT_MISMATCH: 400,

    SURVEY_YES_ANSWER_REQUIRED: 400,
    SURVEY_NO_ANSWER_REQUIRED: 400,

    SURVEY_YES_ANSWER_TOO_LONG: 400,
    SURVEY_NO_ANSWER_TOO_LONG: 400,

    /*
     * Admin status
     */
    INVALID_SURVEY_STATUS: 400,
  };

  return statusByCode[code] || 400;
}


/*
 * =========================================================
 * HÀM HỖ TRỢ TẠO MESSAGE TIẾNG VIỆT
 * =========================================================
 */

function getSurveyErrorMessage(
  code,
  result = {}
) {
  const messageByCode = {
    MEMBER_NOT_FOUND:
      "Tài khoản chưa được liên kết với học viên.",

    ACTIVE_MEMBERSHIP_NOT_FOUND:
      "Không tìm thấy thông tin tham gia mùa hiện tại của học viên.",

    MEMBERSHIP_NOT_IN_ACTIVE_SEASON:
      "Học viên không thuộc mùa đang hoạt động.",

    MEMBERSHIP_NOT_IN_SURVEY_SEASON:
      "Học viên không thuộc mùa của khảo sát này.",

    ACTIVE_SEASON_NOT_FOUND:
      "Không tìm thấy mùa đang hoạt động.",

    INVALID_SURVEY_ID:
      "Mã khảo sát không hợp lệ.",

    SURVEY_NOT_FOUND:
      "Không tìm thấy khảo sát.",

    SURVEY_NOT_IN_ACTIVE_SEASON:
      "Khảo sát không thuộc mùa đang hoạt động.",

    SURVEY_NOT_AVAILABLE:
      "Khảo sát này hiện chưa được công bố.",

    SURVEY_NOT_OPEN:
      "Khảo sát hiện đã đóng hoặc chưa được mở.",

    SURVEY_HAS_NO_QUESTIONS:
      "Khảo sát chưa có hạng mục nào.",

    SURVEY_ALREADY_SUBMITTED:
      "Bạn đã gửi khảo sát này trước đó.",

    SURVEY_ANSWERS_REQUIRED:
      "Vui lòng nhập đầy đủ câu trả lời khảo sát.",

    INVALID_SURVEY_QUESTION_ID:
      "Mã hạng mục khảo sát không hợp lệ.",

    INVALID_SURVEY_QUESTION:
      "Có hạng mục không thuộc khảo sát này.",

    DUPLICATE_SURVEY_QUESTION:
      "Một hạng mục khảo sát đã được gửi lặp lại.",

    REQUIRED_SURVEY_ANSWER_MISSING:
      "Bạn chưa trả lời đầy đủ một hạng mục bắt buộc.",

    SURVEY_ANSWER_COUNT_MISMATCH:
      "Số lượng câu trả lời không khớp với khảo sát.",

    SURVEY_YES_ANSWER_REQUIRED:
      "Vui lòng nhập nội dung cho trường hợp ĐÚNG / YES.",

    SURVEY_NO_ANSWER_REQUIRED:
      "Vui lòng nhập nội dung cho trường hợp SAI / NO.",

    SURVEY_YES_ANSWER_TOO_LONG:
      "Nội dung ĐÚNG / YES vượt quá số ký tự cho phép.",

    SURVEY_NO_ANSWER_TOO_LONG:
      "Nội dung SAI / NO vượt quá số ký tự cho phép.",

    INVALID_SURVEY_STATUS:
      "Trạng thái khảo sát chỉ nhận OPEN hoặc CLOSED.",
  };

  let message =
    messageByCode[code] ||
    "Không thể xử lý yêu cầu khảo sát.";

  /*
   * Bổ sung tên hạng mục nếu Service trả về.
   */
  if (
    code ===
      "REQUIRED_SURVEY_ANSWER_MISSING" &&
    result.questionTitle
  ) {
    message =
      `Bạn chưa trả lời đầy đủ hạng mục ` +
      `"${result.questionTitle}".`;
  }

  /*
   * Bổ sung giới hạn ký tự.
   */
  if (
    (
      code ===
        "SURVEY_YES_ANSWER_TOO_LONG" ||
      code ===
        "SURVEY_NO_ANSWER_TOO_LONG"
    ) &&
    result.maximumLength
  ) {
    message +=
      ` Tối đa ${Number(
        result.maximumLength
      )} ký tự.`;
  }

  return message;
}


/*
 * =========================================================
 * HÀM TRẢ KẾT QUẢ LỖI CHUNG
 * =========================================================
 */

function sendSurveyError(
  res,
  result
) {
  const status =
    getSurveyErrorStatus(
      result.code
    );

  return res.status(status).json({
    success: false,

    error: {
      code:
        result.code ||
        "SURVEY_REQUEST_FAILED",

      message:
        getSurveyErrorMessage(
          result.code,
          result
        ),

      details: {
        questionId:
          result.questionId ||
          null,

        questionTitle:
          result.questionTitle ||
          null,

        maximumLength:
          result.maximumLength ||
          null,
      },
    },
  });
}


/*
 * =========================================================
 * HỌC VIÊN: LẤY DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function getStudentSurveyListController(
  req,
  res
) {
  try {
    const result =
      await getStudentSurveyListService({
        memberId:
          req.user.memberId,
      });

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(200).json({
      success: true,

      data: {
        season:
          result.season,

        surveys:
          result.surveys,
      },
    });
  } catch (error) {
    console.error(
      "Get student survey list error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể tải danh sách khảo sát.",
      },
    });
  }
}


/*
 * =========================================================
 * HỌC VIÊN: XEM CHI TIẾT KHẢO SÁT
 * =========================================================
 */

async function getStudentSurveyDetailController(
  req,
  res
) {
  try {
    const result =
      await getStudentSurveyDetailService({
        memberId:
          req.user.memberId,

        surveyId:
          req.params.surveyId,
      });

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(200).json({
      success: true,

      data: {
        survey:
          result.survey,
      },
    });
  } catch (error) {
    console.error(
      "Get student survey detail error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể tải nội dung khảo sát.",
      },
    });
  }
}


/*
 * =========================================================
 * HỌC VIÊN: NỘP KHẢO SÁT
 * =========================================================
 */

async function submitStudentSurveyController(
  req,
  res
) {
  try {
    const result =
      await submitStudentSurveyService({
        memberId:
          req.user.memberId,

        surveyId:
          req.params.surveyId,

        answers:
          req.body.answers,
      });

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(201).json({
      success: true,

      message:
        result.message ||
        "Bạn đã gửi khảo sát thành công.",

      data: {
        response:
          result.response,
      },
    });
  } catch (error) {
    console.error(
      "Submit student survey error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể gửi khảo sát. Vui lòng thử lại.",
      },
    });
  }
}


/*
 * =========================================================
 * ADMIN: LẤY DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function getAdminSurveyListController(
  req,
  res
) {
  try {
    const result =
      await getAdminSurveyListService();

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(200).json({
      success: true,

      data: {
        season:
          result.season,

        totalStudents:
          result.totalStudents,

        surveys:
          result.surveys,
      },
    });
  } catch (error) {
    console.error(
      "Get admin survey list error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể tải danh sách khảo sát.",
      },
    });
  }
}


/*
 * =========================================================
 * ADMIN: XEM CHI TIẾT VÀ BÀI NỘP
 * =========================================================
 */

async function getAdminSurveyDetailController(
  req,
  res
) {
  try {
    const result =
      await getAdminSurveyDetailService({
        surveyId:
          req.params.surveyId,
      });

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(200).json({
      success: true,

      data: {
        survey:
          result.survey,
      },
    });
  } catch (error) {
    console.error(
      "Get admin survey detail error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể tải kết quả khảo sát.",
      },
    });
  }
}


/*
 * =========================================================
 * ADMIN: MỞ HOẶC ĐÓNG KHẢO SÁT
 * =========================================================
 */

async function changeSurveyStatusController(
  req,
  res
) {
  try {
    const result =
      await changeSurveyStatusService({
        surveyId:
          req.params.surveyId,

        status:
          req.body.status,
      });

    if (!result.success) {
      return sendSurveyError(
        res,
        result
      );
    }

    return res.status(200).json({
      success: true,

      message:
        result.message,

      data: {
        survey:
          result.survey,
      },
    });
  } catch (error) {
    console.error(
      "Change survey status error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Không thể cập nhật trạng thái khảo sát.",
      },
    });
  }
}


/*
 * =========================================================
 * EXPORT
 * =========================================================
 */

module.exports = {
  getStudentSurveyList:
    getStudentSurveyListController,

  getStudentSurveyDetail:
    getStudentSurveyDetailController,

  submitStudentSurvey:
    submitStudentSurveyController,

  getAdminSurveyList:
    getAdminSurveyListController,

  getAdminSurveyDetail:
    getAdminSurveyDetailController,

  changeSurveyStatus:
    changeSurveyStatusController,
};