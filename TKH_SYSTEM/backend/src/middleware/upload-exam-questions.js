const path = require("path");
const multer = require("multer");


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (extension !== ".xlsx") {
      const error = new Error(
        "Chỉ chấp nhận file Excel định dạng .xlsx."
      );

      error.code =
        "INVALID_EXCEL_FILE_TYPE";

      return callback(error);
    }

    return callback(null, true);
  },
});


function uploadExamQuestionsFile(
  req,
  res,
  next
) {
  upload.single("file")(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code:
              "EXCEL_FILE_TOO_LARGE",
            message:
              "File Excel không được vượt quá 5 MB.",
          },
        });
      }

      if (
        error.code ===
        "INVALID_EXCEL_FILE_TYPE"
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code:
              "INVALID_EXCEL_FILE_TYPE",
            message: error.message,
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code:
            "EXCEL_UPLOAD_FAILED",
          message:
            "Không thể nhận file Excel.",
        },
      });
    }
  );
}


module.exports =
  uploadExamQuestionsFile;