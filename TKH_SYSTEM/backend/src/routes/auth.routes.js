const express = require("express");
const { body, validationResult } = require("express-validator");

const authController = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/authenticate-token");

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu đăng nhập không hợp lệ.",
        details: errors.array(),
      },
    });
  }

  return next();
}

router.post(
  "/login",
  [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required."),
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required."),
  ],
  validateRequest,
  authController.login
);

router.get("/me", authenticateToken, authController.me);


router.put(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword")
      .isString()
      .notEmpty()
      .withMessage("Current password is required."),
    body("newPassword")
      .isString()
      .isLength({ min: 8 })
      .withMessage("New password must contain at least 8 characters."),
  ],
  validateRequest,
  authController.changePassword
);

module.exports = router;