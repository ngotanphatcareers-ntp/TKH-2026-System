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

const documentController = require(
  "../controllers/document.controller"
);

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu tài liệu không hợp lệ.",
        details: errors.array(),
      },
    });
  }

  return next();
}

const documentIdValidation = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage(
      "Document ID phải là số nguyên lớn hơn 0."
    )
    .toInt(),
];

const documentBodyValidation = [
  body("title")
    .isString()
    .withMessage(
      "Tiêu đề tài liệu phải là chuỗi."
    )
    .trim()
    .notEmpty()
    .withMessage(
      "Tiêu đề tài liệu không được để trống."
    )
    .isLength({ max: 400 })
    .withMessage(
      "Tiêu đề tài liệu không được vượt quá 400 ký tự."
    ),

  body("description")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isString()
    .withMessage(
      "Mô tả tài liệu phải là chuỗi."
    )
    .trim()
    .isLength({ max: 2000 })
    .withMessage(
      "Mô tả tài liệu không được vượt quá 2000 ký tự."
    ),

  body("fileUrl")
    .isString()
    .withMessage(
      "Đường dẫn tài liệu phải là chuỗi."
    )
    .trim()
    .notEmpty()
    .withMessage(
      "Đường dẫn tài liệu không được để trống."
    )
    .isLength({ max: 2000 })
    .withMessage(
      "Đường dẫn tài liệu không được vượt quá 2000 ký tự."
    ),

  body("fileType")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isString()
    .withMessage(
      "Loại tài liệu phải là chuỗi."
    )
    .trim()
    .isLength({ max: 30 })
    .withMessage(
      "Loại tài liệu không được vượt quá 30 ký tự."
    ),

  body("displayOrder")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({ min: 0 })
    .withMessage(
      "Thứ tự hiển thị phải là số nguyên từ 0 trở lên."
    )
    .toInt(),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage(
      "Trạng thái xuất bản phải là true hoặc false."
    )
    .toBoolean(),
];

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  documentController.getAdminDocuments
);

router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  documentBodyValidation,
  validateRequest,
  documentController.createDocument
);

router.put(
  "/:documentId",
  authenticateToken,
  requireRole("ADMIN"),
  documentIdValidation,
  documentBodyValidation,
  validateRequest,
  documentController.updateDocument
);

router.delete(
  "/:documentId",
  authenticateToken,
  requireRole("ADMIN"),
  documentIdValidation,
  validateRequest,
  documentController.deleteDocument
);

module.exports = router;