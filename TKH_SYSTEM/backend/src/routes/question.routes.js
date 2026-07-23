const express = require("express");
const {
  body,
  validationResult,
} = require("express-validator");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const questionController = require(
  "../controllers/question.controller"
);

const router = express.Router();


function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu câu hỏi không hợp lệ.",
        details: errors.array(),
      },
    });
  }

  return next();
}



router.get(
  "/my",
  authenticateToken,
  questionController.getMyQuestions
);

router.post(
  "/",
  authenticateToken,
  [
    body("sessionId")
      .isInt({ min: 1 })
      .withMessage(
        "Session ID phải là số nguyên lớn hơn 0."
      )
      .toInt(),

    body("visibility")
      .isString()
      .withMessage(
        "Visibility phải là chuỗi."
      )
      .trim()
      .customSanitizer((value) =>
        value.toUpperCase()
      )
      .isIn(["PUBLIC", "PRIVATE"])
      .withMessage(
        "Visibility chỉ nhận PUBLIC hoặc PRIVATE."
      ),

    body("questionText")
      .isString()
      .withMessage(
        "Nội dung câu hỏi phải là chuỗi."
      )
      .trim()
      .notEmpty()
      .withMessage(
        "Nội dung câu hỏi không được để trống."
      )
      .isLength({ max: 2000 })
      .withMessage(
        "Nội dung câu hỏi không được vượt quá 2000 ký tự."
      ),
  ],
  validateRequest,
  questionController.createQuestion
);


module.exports = router;
