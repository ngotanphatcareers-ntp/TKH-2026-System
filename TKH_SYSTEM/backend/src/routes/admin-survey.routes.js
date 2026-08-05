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
          "Dữ liệu quản lý khảo sát không hợp lệ.",

        details:
          errors.array(),
      },
    });
  }

  return next();
}


/*
 * =========================================================
 * ADMIN: DANH SÁCH KHẢO SÁT
 *
 * GET /api/admin/surveys
 * =========================================================
 */

router.get(
  "/",

  authenticateToken,

  requireRole("ADMIN"),

  surveyController
    .getAdminSurveyList
);


/*
 * =========================================================
 * ADMIN: CHI TIẾT KHẢO SÁT VÀ TOÀN BỘ BÀI NỘP
 *
 * GET /api/admin/surveys/:surveyId
 * =========================================================
 */

router.get(
  "/:surveyId",

  authenticateToken,

  requireRole("ADMIN"),

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
    .getAdminSurveyDetail
);


/*
 * =========================================================
 * ADMIN: MỞ HOẶC ĐÓNG KHẢO SÁT
 *
 * PATCH /api/admin/surveys/:surveyId/status
 *
 * Body:
 * {
 *   "status": "OPEN"
 * }
 *
 * hoặc:
 * {
 *   "status": "CLOSED"
 * }
 * =========================================================
 */

router.patch(
  "/:surveyId/status",

  authenticateToken,

  requireRole("ADMIN"),

  [
    param("surveyId")
      .isInt({ min: 1 })
      .withMessage(
        "Survey ID phải là số nguyên lớn hơn 0."
      )
      .toInt(),

    body("status")
      .isString()
      .withMessage(
        "Status phải là chuỗi."
      )
      .trim()
      .customSanitizer(
        value =>
          value.toUpperCase()
      )
      .isIn([
        "OPEN",
        "CLOSED",
      ])
      .withMessage(
        "Status chỉ nhận OPEN hoặc CLOSED."
      ),
  ],

  validateRequest,

  surveyController
    .changeSurveyStatus
);


module.exports = router;