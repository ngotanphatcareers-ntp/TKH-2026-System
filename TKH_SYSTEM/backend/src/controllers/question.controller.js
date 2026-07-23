const {
  submitQuestion,
    getMyQuestions,
    getAdminQuestions: getAdminQuestionsService,
    replyQuestion: replyQuestionService,
} = require("../services/question.service");


async function createQuestion(req, res) {
  try {
    const result = await submitQuestion({
      memberId: req.user.memberId,
      sessionId: req.body.sessionId,
      visibility: req.body.visibility,
      questionText: req.body.questionText,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}



async function getMyQuestionsController(req, res) {
  try {
    const result = await getMyQuestions({
      memberId: req.user.memberId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get my questions error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


async function getAdminQuestionsController(req, res) {
  try {
    const result =
      await getAdminQuestionsService();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get admin questions error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}



async function replyQuestionController(req, res) {
  try {
    const result = await replyQuestionService({
      questionId: req.params.questionId,
      adminResponse: req.body.adminResponse,
      respondedByUserId: req.user.id,
    });

    if (!result.success) {
      const statusByCode = {
        INVALID_QUESTION_ID: 400,
        ADMIN_RESPONSE_REQUIRED: 400,
        ADMIN_RESPONSE_TOO_LONG: 400,
        QUESTION_NOT_FOUND: 404,
      };

      return res
        .status(statusByCode[result.code] || 400)
        .json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Reply question error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

module.exports = {
  createQuestion,
  getMyQuestions: getMyQuestionsController,
  getAdminQuestions: getAdminQuestionsController,
  replyQuestion: replyQuestionController,
};
