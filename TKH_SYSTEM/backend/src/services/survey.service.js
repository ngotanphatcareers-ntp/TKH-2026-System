const {
  findSurveyById,
  findSurveyQuestions,

  findResponseBySurveyAndMembership,
  findAnswersByResponseId,

  findStudentSurveys,
  createSurveyResponse,

  findAdminSurveys,
  countActiveSeasonMemberships,
  findSurveyResponseRows,
  updateSurveyStatus,
} = require(
  "../repositories/survey.repository"
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
 * =========================================================
 * CẤU HÌNH VALIDATION
 * =========================================================
 */

const SURVEY_ANSWER_MAX_LENGTH = 4000;


/*
 * =========================================================
 * MAP CÂU HỎI
 * =========================================================
 */

function mapSurveyQuestion(question) {
  if (!question) {
    return null;
  }

  return {
    id: Number(question.id),
    surveyId: Number(question.survey_id),
    displayOrder:
      Number(question.display_order),

    title: question.title,
    questionText:
      question.question_text,

    yesLabel: question.yes_label,
    noLabel: question.no_label,

    isRequired:
      Boolean(question.is_required),
  };
}


/*
 * =========================================================
 * MAP KHẢO SÁT CƠ BẢN
 * =========================================================
 */

function mapSurvey(survey) {
  if (!survey) {
    return null;
  }

  return {
    id: Number(survey.id),
    seasonId: Number(survey.season_id),

    code: survey.code,
    title: survey.title,
    description:
      survey.description || "",

    status: survey.status,

    questionCount:
      Number(survey.question_count) || 0,

    responseCount:
      Number(survey.response_count) || 0,

    openedAt:
      survey.opened_at || null,

    closedAt:
      survey.closed_at || null,

    createdAt:
      survey.created_at || null,

    updatedAt:
      survey.updated_at || null,
  };
}


/*
 * =========================================================
 * MAP BÀI NỘP CỦA HỌC VIÊN
 * =========================================================
 */

function mapStudentResponse(
  response,
  answers = []
) {
  if (!response) {
    return null;
  }

  return {
    id: Number(response.id),

    surveyId:
      Number(response.survey_id),

    seasonMembershipId:
      Number(
        response.season_membership_id
      ),

    status:
      response.status,

    submittedAt:
      response.submitted_at || null,

    answers:
      answers.map(answer => ({
        id: Number(answer.id),

        questionId:
          Number(answer.question_id),

        displayOrder:
          Number(
            answer.display_order
          ),

        questionTitle:
          answer.question_title,

        questionText:
          answer.question_text,

        yesLabel:
          answer.yes_label,

        noLabel:
          answer.no_label,

        yesAnswer:
          answer.yes_answer,

        noAnswer:
          answer.no_answer,
      })),
  };
}


/*
 * =========================================================
 * LẤY ACTIVE SEASON VÀ MEMBERSHIP CỦA HỌC VIÊN
 * =========================================================
 */

async function getStudentSurveyContext(
  memberId
) {
  const normalizedMemberId =
    Number(memberId);

  if (
    !Number.isInteger(
      normalizedMemberId
    ) ||
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
      code:
        "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code:
        "ACTIVE_MEMBERSHIP_NOT_FOUND",
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
 * =========================================================
 * HỌC VIÊN: DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function getStudentSurveyList({
  memberId,
}) {
  const context =
    await getStudentSurveyContext(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const {
    activeSeason,
    membership,
  } = context;

  const surveyRows =
    await findStudentSurveys({
      seasonId: activeSeason.id,

      seasonMembershipId:
        membership.id,
    });

  const surveys =
    surveyRows.map(row => {
      const hasSubmitted =
        row.response_id !== null &&
        row.response_id !== undefined;

      return {
        ...mapSurvey(row),

        hasSubmitted,

        response: hasSubmitted
          ? {
              id:
                Number(
                  row.response_id
                ),

              status:
                row.response_status,

              submittedAt:
                row.submitted_at ||
                null,
            }
          : null,

        /*
         * Học viên chỉ có thể làm khi:
         * - Khảo sát đang OPEN.
         * - Chưa từng nộp.
         */
        canSubmit:
          row.status === "OPEN" &&
          !hasSubmitted,
      };
    });

  return {
    success: true,

    season: {
      id: Number(activeSeason.id),
      code: activeSeason.code,
      name: activeSeason.name,
    },

    surveys,
  };
}


/*
 * =========================================================
 * HỌC VIÊN: XEM CHI TIẾT KHẢO SÁT
 * =========================================================
 */

async function getStudentSurveyDetail({
  memberId,
  surveyId,
}) {
  const normalizedSurveyId =
    Number(surveyId);

  if (
    !Number.isInteger(
      normalizedSurveyId
    ) ||
    normalizedSurveyId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_SURVEY_ID",
    };
  }

  const context =
    await getStudentSurveyContext(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const {
    activeSeason,
    membership,
  } = context;

  const survey =
    await findSurveyById(
      normalizedSurveyId
    );

  if (!survey) {
    return {
      success: false,
      code: "SURVEY_NOT_FOUND",
    };
  }

  if (
    Number(survey.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "SURVEY_NOT_IN_ACTIVE_SEASON",
    };
  }

  /*
   * DRAFT không được hiển thị cho học viên.
   * OPEN và CLOSED vẫn được xem.
   */
  if (survey.status === "DRAFT") {
    return {
      success: false,
      code:
        "SURVEY_NOT_AVAILABLE",
    };
  }

  const questions =
    await findSurveyQuestions(
      normalizedSurveyId
    );

  const existingResponse =
    await findResponseBySurveyAndMembership({
      surveyId:
        normalizedSurveyId,

      seasonMembershipId:
        membership.id,
    });

  let response = null;

  if (existingResponse) {
    const existingAnswers =
      await findAnswersByResponseId(
        existingResponse.id
      );

    response =
      mapStudentResponse(
        existingResponse,
        existingAnswers
      );
  }

  return {
    success: true,

    survey: {
        ...mapSurvey(survey),

        questionCount:
            questions.length,

        questions:
            questions.map(
            mapSurveyQuestion
            ),

        hasSubmitted:
            Boolean(existingResponse),

      canSubmit:
        survey.status === "OPEN" &&
        !existingResponse,

      response,
    },
  };
}


/*
 * =========================================================
 * CHUẨN HÓA VÀ KIỂM TRA CÂU TRẢ LỜI
 * =========================================================
 */

function validateSurveyAnswers(
  answers
) {
  if (!Array.isArray(answers)) {
    return {
      success: false,
      code:
        "SURVEY_ANSWERS_REQUIRED",
    };
  }

  if (answers.length === 0) {
    return {
      success: false,
      code:
        "SURVEY_ANSWERS_REQUIRED",
    };
  }

  const normalizedAnswers = [];
  const receivedQuestionIds =
    new Set();

  for (const answer of answers) {
    const questionId =
      Number(answer?.questionId);

    if (
      !Number.isInteger(questionId) ||
      questionId <= 0
    ) {
      return {
        success: false,
        code:
          "INVALID_SURVEY_QUESTION_ID",
      };
    }

    /*
     * Không cho một questionId xuất hiện hai lần.
     */
    if (
      receivedQuestionIds.has(
        questionId
      )
    ) {
      return {
        success: false,
        code:
          "DUPLICATE_SURVEY_QUESTION",
        questionId,
      };
    }

    receivedQuestionIds.add(
      questionId
    );

    const yesAnswer =
      String(
        answer?.yesAnswer || ""
      ).trim();

    const noAnswer =
      String(
        answer?.noAnswer || ""
      ).trim();

    if (!yesAnswer) {
      return {
        success: false,
        code:
          "SURVEY_YES_ANSWER_REQUIRED",
        questionId,
      };
    }

    if (!noAnswer) {
      return {
        success: false,
        code:
          "SURVEY_NO_ANSWER_REQUIRED",
        questionId,
      };
    }

    if (
      yesAnswer.length >
      SURVEY_ANSWER_MAX_LENGTH
    ) {
      return {
        success: false,
        code:
          "SURVEY_YES_ANSWER_TOO_LONG",
        questionId,
        maximumLength:
          SURVEY_ANSWER_MAX_LENGTH,
      };
    }

    if (
      noAnswer.length >
      SURVEY_ANSWER_MAX_LENGTH
    ) {
      return {
        success: false,
        code:
          "SURVEY_NO_ANSWER_TOO_LONG",
        questionId,
        maximumLength:
          SURVEY_ANSWER_MAX_LENGTH,
      };
    }

    normalizedAnswers.push({
      questionId,
      yesAnswer,
      noAnswer,
    });
  }

  return {
    success: true,
    answers: normalizedAnswers,
  };
}


/*
 * =========================================================
 * HỌC VIÊN: NỘP KHẢO SÁT
 * =========================================================
 */

async function submitStudentSurvey({
  memberId,
  surveyId,
  answers,
}) {
  const normalizedSurveyId =
    Number(surveyId);

  if (
    !Number.isInteger(
      normalizedSurveyId
    ) ||
    normalizedSurveyId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_SURVEY_ID",
    };
  }

  const answerValidation =
    validateSurveyAnswers(
      answers
    );

  if (!answerValidation.success) {
    return answerValidation;
  }

  const context =
    await getStudentSurveyContext(
      memberId
    );

  if (!context.success) {
    return context;
  }

  const {
    activeSeason,
    membership,
  } = context;

  const survey =
    await findSurveyById(
      normalizedSurveyId
    );

  if (!survey) {
    return {
      success: false,
      code: "SURVEY_NOT_FOUND",
    };
  }

  if (
    Number(survey.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "SURVEY_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (survey.status !== "OPEN") {
    return {
      success: false,
      code: "SURVEY_NOT_OPEN",
    };
  }

  /*
   * Kiểm tra nhanh trước transaction để phản hồi đẹp.
   * Repository vẫn kiểm tra lại trong transaction.
   */
  const existingResponse =
    await findResponseBySurveyAndMembership({
      surveyId:
        normalizedSurveyId,

      seasonMembershipId:
        membership.id,
    });

  if (existingResponse) {
    return {
      success: false,
      code:
        "SURVEY_ALREADY_SUBMITTED",
    };
  }

  const surveyQuestions =
    await findSurveyQuestions(
      normalizedSurveyId
    );

  if (surveyQuestions.length === 0) {
    return {
      success: false,
      code:
        "SURVEY_HAS_NO_QUESTIONS",
    };
  }

  const surveyQuestionIds =
    new Set(
      surveyQuestions.map(
        question =>
          Number(question.id)
      )
    );

  const hasInvalidQuestion =
    answerValidation.answers.some(
      answer =>
        !surveyQuestionIds.has(
          Number(answer.questionId)
        )
    );

  if (hasInvalidQuestion) {
    return {
      success: false,
      code:
        "INVALID_SURVEY_QUESTION",
    };
  }

  /*
   * Kiểm tra đủ câu hỏi bắt buộc.
   */
  const answeredQuestionIds =
    new Set(
      answerValidation.answers.map(
        answer =>
          Number(answer.questionId)
      )
    );

  const missingRequiredQuestion =
    surveyQuestions.find(
      question =>
        Boolean(question.is_required) &&
        !answeredQuestionIds.has(
          Number(question.id)
        )
    );

  if (missingRequiredQuestion) {
    return {
      success: false,
      code:
        "REQUIRED_SURVEY_ANSWER_MISSING",

      questionId:
        Number(
          missingRequiredQuestion.id
        ),

      questionTitle:
        missingRequiredQuestion.title,
    };
  }

  /*
   * Không cho gửi thêm question không thuộc form
   * hoặc gửi thừa số câu hỏi.
   */
  if (
    answerValidation.answers.length !==
    surveyQuestions.length
  ) {
    return {
      success: false,
      code:
        "SURVEY_ANSWER_COUNT_MISMATCH",
    };
  }

  const createResult =
    await createSurveyResponse({
      surveyId:
        normalizedSurveyId,

      seasonMembershipId:
        membership.id,

      answers:
        answerValidation.answers,
    });

  if (!createResult.success) {
    return createResult;
  }

  return {
    success: true,

    message:
      "Bạn đã gửi khảo sát thành công.",

    response: {
      id:
        Number(
          createResult.response.id
        ),

      surveyId:
        Number(
          createResult.response
            .survey_id
        ),

      status:
        createResult.response.status,

      submittedAt:
        createResult.response
          .submitted_at,
    },
  };
}


/*
 * =========================================================
 * ADMIN: DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function getAdminSurveyList() {
  const activeSeason =
    await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code:
        "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const [
    surveyRows,
    totalStudents,
  ] = await Promise.all([
    findAdminSurveys(
      activeSeason.id
    ),

    countActiveSeasonMemberships(
      activeSeason.id
    ),
  ]);

  const surveys =
    surveyRows.map(row => {
      const responseCount =
        Number(
          row.response_count
        ) || 0;

      return {
        ...mapSurvey(row),

        totalStudents,

        remainingStudents:
          Math.max(
            totalStudents -
              responseCount,
            0
          ),
      };
    });

  return {
    success: true,

    season: {
      id:
        Number(activeSeason.id),

      code:
        activeSeason.code,

      name:
        activeSeason.name,
    },

    totalStudents,
    surveys,
  };
}


/*
 * =========================================================
 * ADMIN: CHI TIẾT KHẢO SÁT
 * =========================================================
 */

async function getAdminSurveyDetail({
  surveyId,
}) {
  const normalizedSurveyId =
    Number(surveyId);

  if (
    !Number.isInteger(
      normalizedSurveyId
    ) ||
    normalizedSurveyId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_SURVEY_ID",
    };
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

  const survey =
    await findSurveyById(
      normalizedSurveyId
    );

  if (!survey) {
    return {
      success: false,
      code: "SURVEY_NOT_FOUND",
    };
  }

  if (
    Number(survey.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "SURVEY_NOT_IN_ACTIVE_SEASON",
    };
  }

  const [
    questions,
    responseRows,
    totalStudents,
  ] = await Promise.all([
    findSurveyQuestions(
      normalizedSurveyId
    ),

    findSurveyResponseRows(
      normalizedSurveyId
    ),

    countActiveSeasonMemberships(
      activeSeason.id
    ),
  ]);

  const responseMap =
    new Map();

  for (const row of responseRows) {
    const responseId =
      Number(row.response_id);

    if (
      !responseMap.has(
        responseId
      )
    ) {
      responseMap.set(
        responseId,
        {
          id: responseId,

          surveyId:
            Number(row.survey_id),

          seasonMembershipId:
            Number(
              row.season_membership_id
            ),

          status:
            row.response_status,

          submittedAt:
            row.submitted_at,

          member: {
            id:
              Number(row.member_id),

            tkhCode:
              row.tkh_code,

            fullName:
              row.full_name,
          },

          group:
            row.group_id
              ? {
                  id:
                    Number(
                      row.group_id
                    ),

                  code:
                    row.group_code,

                  name:
                    row.group_name,
                }
              : null,

          answers: [],
        }
      );
    }

    if (
      row.answer_id !== null &&
      row.answer_id !== undefined
    ) {
      responseMap
        .get(responseId)
        .answers
        .push({
          id:
            Number(row.answer_id),

          questionId:
            Number(
              row.question_id
            ),

          displayOrder:
            Number(
              row.display_order
            ),

          questionTitle:
            row.question_title,

          questionText:
            row.question_text,

          yesLabel:
            row.yes_label,

          noLabel:
            row.no_label,

          yesAnswer:
            row.yes_answer,

          noAnswer:
            row.no_answer,
        });
    }
  }

  const responses =
    Array.from(
      responseMap.values()
    );

  return {
    success: true,

    survey: {
      ...mapSurvey(survey),

      questionCount:
        questions.length,

      responseCount:
        responses.length,

      totalStudents,

      remainingStudents:
        Math.max(
          totalStudents -
            responses.length,
          0
        ),

      questions:
        questions.map(
          mapSurveyQuestion
        ),

      responses,
    },
  };
}


/*
 * =========================================================
 * ADMIN: MỞ / ĐÓNG KHẢO SÁT
 * =========================================================
 */

async function changeSurveyStatus({
  surveyId,
  status,
}) {
  const normalizedSurveyId =
    Number(surveyId);

  if (
    !Number.isInteger(
      normalizedSurveyId
    ) ||
    normalizedSurveyId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_SURVEY_ID",
    };
  }

  const normalizedStatus =
    String(status || "")
      .trim()
      .toUpperCase();

  if (
    normalizedStatus !== "OPEN" &&
    normalizedStatus !== "CLOSED"
  ) {
    return {
      success: false,
      code:
        "INVALID_SURVEY_STATUS",
    };
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

  const survey =
    await findSurveyById(
      normalizedSurveyId
    );

  if (!survey) {
    return {
      success: false,
      code: "SURVEY_NOT_FOUND",
    };
  }

  if (
    Number(survey.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code:
        "SURVEY_NOT_IN_ACTIVE_SEASON",
    };
  }

  if (
    survey.status ===
    normalizedStatus
  ) {
    return {
      success: true,

      message:
        normalizedStatus === "OPEN"
          ? "Khảo sát hiện đã được mở."
          : "Khảo sát hiện đã được đóng.",

      survey:
        mapSurvey(survey),
    };
  }

  const updatedSurvey =
    await updateSurveyStatus({
      surveyId:
        normalizedSurveyId,

      status:
        normalizedStatus,
    });

  if (!updatedSurvey) {
    return {
      success: false,
      code: "SURVEY_NOT_FOUND",
    };
  }

  return {
    success: true,

    message:
      normalizedStatus === "OPEN"
        ? "Đã mở khảo sát."
        : "Đã đóng khảo sát.",

    survey:
      mapSurvey(updatedSurvey),
  };
}


module.exports = {
  getStudentSurveyList,
  getStudentSurveyDetail,
  submitStudentSurvey,

  getAdminSurveyList,
  getAdminSurveyDetail,
  changeSurveyStatus,
};