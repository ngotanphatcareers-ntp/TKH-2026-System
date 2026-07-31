const XLSX = require("xlsx");


const REQUIRED_HEADERS = [
  "tkh_code",
  "score_type",
  "exam_id",
  "points",
  "description",
];

const ALLOWED_SCORE_TYPES = new Set([
  "ATTENDANCE_ADJUSTMENT",
  "PARTICIPATION",
  "PRE_TEST",
  "FINAL_TEST",
]);


/*
 * Chuẩn hóa tiêu đề cột để tránh lỗi do:
 * - khoảng trắng đầu/cuối;
 * - viết hoa hoặc viết thường;
 * - khoảng trắng giữa chữ.
 */
function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}


/*
 * Chuyển giá trị điểm từ Excel thành Number.
 *
 * Chấp nhận:
 * 0.5
 * 0,5
 * 2
 * -3
 */
function parsePoints(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalizedValue =
    String(value)
      .trim()
      .replace(",", ".");

  const points =
    Number(normalizedValue);

  if (!Number.isFinite(points)) {
    return null;
  }

  return (
    Math.round(points * 100) / 100
  );
}


/*
 * Đọc file Excel cộng điểm thủ công.
 */
function parseManualScoresExcel(
  fileBuffer
) {
  if (
    !fileBuffer ||
    !Buffer.isBuffer(fileBuffer) ||
    fileBuffer.length === 0
  ) {
    return {
      success: false,
      code: "EXCEL_FILE_REQUIRED",
      errors: [],
    };
  }

  let workbook = null;

  try {
    workbook = XLSX.read(
      fileBuffer,
      {
        type: "buffer",
        cellDates: false,
      }
    );
  } catch (error) {
    return {
      success: false,
      code: "INVALID_EXCEL_FILE",
      errors: [],
    };
  }

  const firstSheetName =
    workbook.SheetNames?.[0];

  if (!firstSheetName) {
    return {
      success: false,
      code: "EXCEL_HAS_NO_SHEET",
      errors: [],
    };
  }

  const worksheet =
    workbook.Sheets[firstSheetName];

  const rawRows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: "",
        raw: true,
      }
    );

  if (
    !Array.isArray(rawRows) ||
    rawRows.length === 0
  ) {
    return {
      success: false,
      code: "EXCEL_HAS_NO_ROWS",
      errors: [],
    };
  }

  /*
   * Dòng đầu tiên là tiêu đề.
   */
  const headers =
    rawRows[0].map(
      normalizeHeader
    );

  const missingHeaders =
    REQUIRED_HEADERS.filter(
      requiredHeader =>
        !headers.includes(
          requiredHeader
        )
    );

  if (missingHeaders.length > 0) {
    return {
      success: false,
      code: "INVALID_EXCEL_COLUMNS",

      missingHeaders,

      errors: [
        {
          row: 1,
          message:
            "Thiếu các cột bắt buộc: " +
            missingHeaders.join(", "),
        },
      ],
    };
  }

  const columnIndexByHeader = {};

  headers.forEach(
    (header, index) => {
      if (
        header &&
        columnIndexByHeader[header] ===
          undefined
      ) {
        columnIndexByHeader[header] =
          index;
      }
    }
  );

  const rows = [];
  const errors = [];

  for (
    let rowIndex = 1;
    rowIndex < rawRows.length;
    rowIndex += 1
  ) {
    const rawRow =
      rawRows[rowIndex];

    const excelRowNumber =
      rowIndex + 1;

    const isEmptyRow =
      rawRow.every(
        value =>
          String(value ?? "")
            .trim() === ""
      );

    if (isEmptyRow) {
      continue;
    }

    const getValue =
      header =>
        rawRow[
          columnIndexByHeader[header]
        ];

    const tkhCode =
      String(
        getValue("tkh_code") || ""
      )
        .trim()
        .toUpperCase();

    const scoreType =
      String(
        getValue("score_type") || ""
      )
        .trim()
        .toUpperCase();

    const examIdText =
      String(
        getValue("exam_id") ?? ""
      ).trim();

    const points =
      parsePoints(
        getValue("points")
      );

    const description =
      String(
        getValue("description") || ""
      ).trim();

    const rowErrors = [];

    /*
     * Mã TKH.
     */
    if (!tkhCode) {
      rowErrors.push(
        "tkh_code không được để trống"
      );
    } else if (
      !/^TKH\d+$/i.test(tkhCode)
    ) {
      rowErrors.push(
        "tkh_code không đúng định dạng, ví dụ TKH158"
      );
    }

    /*
     * Loại điểm.
     */
    if (!scoreType) {
      rowErrors.push(
        "score_type không được để trống"
      );
    } else if (
      !ALLOWED_SCORE_TYPES.has(
        scoreType
      )
    ) {
      rowErrors.push(
        "score_type chỉ được là " +
        Array.from(
          ALLOWED_SCORE_TYPES
        ).join(", ")
      );
    }

    /*
     * Exam ID.
     */
    let examId = null;

    const isExamScore =
      scoreType === "PRE_TEST" ||
      scoreType === "FINAL_TEST";

    if (isExamScore) {
      examId =
        Number(examIdText);

      if (
        !Number.isInteger(examId) ||
        examId <= 0
      ) {
        rowErrors.push(
          "exam_id bắt buộc và phải là số nguyên dương đối với PRE_TEST hoặc FINAL_TEST"
        );
      }
    } else if (examIdText !== "") {
      rowErrors.push(
        "exam_id phải để trống đối với điểm danh hoặc phát biểu"
      );
    }

    /*
     * Điểm.
     */
    if (points === null) {
      rowErrors.push(
        "points phải là một số hợp lệ"
      );
    } else if (
      scoreType ===
        "ATTENDANCE_ADJUSTMENT" &&
      ![-5, -3, 3, 5].includes(
        points
      )
    ) {
      rowErrors.push(
        "Điểm danh chỉ nhận -5, -3, +3 hoặc +5"
      );
    } else if (
      scoreType === "PARTICIPATION" &&
      points !== 2
    ) {
      rowErrors.push(
        "Điểm phát biểu phải đúng bằng 2"
      );
    } else if (
      isExamScore &&
      points <= 0
    ) {
      rowErrors.push(
        "Điểm bài thi giấy phải lớn hơn 0"
      );
    }

    /*
     * Lý do.
     */
    if (!description) {
      rowErrors.push(
        "description không được để trống"
      );
    } else if (
      description.length > 500
    ) {
      rowErrors.push(
        "description không được vượt quá 500 ký tự"
      );
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: excelRowNumber,
        message:
          rowErrors.join("; "),
      });

      continue;
    }

    rows.push({
      rowNumber:
        excelRowNumber,

      tkhCode,

      /*
       * Username hiện tại của học viên
       * chính là mã TKH, nên Service có
       * thể dùng trực tiếp giá trị này.
       */
      username:
        tkhCode,

      scoreType,

      examId,

      points,

      description,
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      code: "INVALID_EXCEL_ROWS",
      errors,
      rows: [],
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      code: "EXCEL_HAS_NO_SCORE_ROWS",
      errors: [],
      rows: [],
    };
  }

  return {
    success: true,
    rows,

    summary: {
      totalRows:
        rows.length,

      attendanceRows:
        rows.filter(
          row =>
            row.scoreType ===
            "ATTENDANCE_ADJUSTMENT"
        ).length,

      participationRows:
        rows.filter(
          row =>
            row.scoreType ===
            "PARTICIPATION"
        ).length,

      preTestRows:
        rows.filter(
          row =>
            row.scoreType ===
            "PRE_TEST"
        ).length,

      finalTestRows:
        rows.filter(
          row =>
            row.scoreType ===
            "FINAL_TEST"
        ).length,
    },
  };
}


module.exports = {
  parseManualScoresExcel,
};