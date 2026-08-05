const express = require("express");
const {
  body,
  param,
  validationResult,
} = require("express-validator");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);

const surveyController = require(
  "../controllers/survey.controller"
);

const router = express.Router();


/*
 * =========================================================
 * VALIDATION ERROR HANDLER
 * =========================================================
 */

function validateRequest(
  req,
  res,
  next
) {
  const errors =
    validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,

      error: {
        code:
          "VALIDATION_ERROR",

        message:
          "Dữ liệu khảo sát không hợp lệ.",

        details:
          errors.array(),
      },
    });
  }

  return next();
}


/*
 * =========================================================
 * HỌC VIÊN: DANH SÁCH KHẢO SÁT
 *
 * GET /api/surveys
 * =========================================================
 */

router.get(
  "/",

  authenticateToken,

  requireRole("STUDENT"),

  surveyController
    .getStudentSurveyList
);


/*
 * =========================================================
 * HỌC VIÊN: XEM CHI TIẾT KHẢO SÁT
 *
 * GET /api/surveys/:surveyId
 * =========================================================
 */

router.get(
  "/:surveyId",

  authenticateToken,

  requireRole("STUDENT"),

  [
    param("surveyId")
      .isInt({ min: 1 })
      .withMessage(
        "Survey ID phải là số nguyên lớn hơn 0."
      )
      .toInt(),
  ],

  validateRequest,

  surveyController
    .getStudentSurveyDetail
);


/*
 * =========================================================
 * HỌC VIÊN: NỘP KHẢO SÁT
 *
 * POST /api/surveys/:surveyId/submit
 * =========================================================
 */

router.post(
  "/:surveyId/submit",

  authenticateToken,

  requireRole("STUDENT"),

  [
    param("surveyId")
      .isInt({ min: 1 })
      .withMessage(
        "Survey ID phải là số nguyên lớn hơn 0."
      )
      .toInt(),

    body("answers")
      .isArray({ min: 1 })
      .withMessage(
        "Answers phải là một mảng có ít nhất một phần tử."
      ),

    body("answers.*.questionId")
      .isInt({ min: 1 })
      .withMessage(
        "Question ID phải là số nguyên lớn hơn 0."
      )
      .toInt(),

    body("answers.*.yesAnswer")
      .isString()
      .withMessage(
        "Nội dung YES phải là chuỗi."
      )
      .trim()
      .notEmpty()
      .withMessage(
        "Nội dung YES không được để trống."
      )
      .isLength({ max: 4000 })
      .withMessage(
        "Nội dung YES không được vượt quá 4000 ký tự."
      ),

    body("answers.*.noAnswer")
      .isString()
      .withMessage(
        "Nội dung NO phải là chuỗi."
      )
      .trim()
      .notEmpty()
      .withMessage(
        "Nội dung NO không được để trống."
      )
      .isLength({ max: 4000 })
      .withMessage(
        "Nội dung NO không được vượt quá 4000 ký tự."
      ),
  ],

  validateRequest,

  surveyController
    .submitStudentSurvey
);


module.exports = router;