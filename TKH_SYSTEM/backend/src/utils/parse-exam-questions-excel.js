const ExcelJS = require("exceljs");


const REQUIRED_HEADERS = [
  "question_text",
  "a",
  "b",
  "c",
  "d",
  "correct",
  "points",
];


function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function getCellText(row, columnIndex) {
  if (!columnIndex) {
    return "";
  }

  return row
    .getCell(columnIndex)
    .text
    .trim();
}


async function parseExamQuestionsExcel(
  fileBuffer
) {
  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.load(fileBuffer);

  const worksheet =
    workbook.worksheets[0];

  if (!worksheet) {
    return {
      success: false,
      code: "EXCEL_WORKSHEET_NOT_FOUND",
      errors: [
        {
          row: 1,
          message:
            "File Excel không có worksheet.",
        },
      ],
    };
  }

  const headerRow =
    worksheet.getRow(1);

  const headerIndexes = {};
  const duplicateHeaders = [];

  for (
    let columnIndex = 1;
    columnIndex <= worksheet.columnCount;
    columnIndex += 1
  ) {
    const header = normalizeHeader(
      headerRow.getCell(columnIndex).text
    );

    if (!header) {
      continue;
    }

    if (headerIndexes[header]) {
      duplicateHeaders.push(header);
      continue;
    }

    headerIndexes[header] =
      columnIndex;
  }

  const missingHeaders =
    REQUIRED_HEADERS.filter(
      (header) =>
        !headerIndexes[header]
    );

  if (
    missingHeaders.length > 0 ||
    duplicateHeaders.length > 0
  ) {
    const errors = [];

    if (missingHeaders.length > 0) {
      errors.push({
        row: 1,
        message:
          `Thiếu cột bắt buộc: ${missingHeaders.join(", ")}.`,
      });
    }

    if (duplicateHeaders.length > 0) {
      errors.push({
        row: 1,
        message:
          `Cột bị trùng: ${[
            ...new Set(
              duplicateHeaders
            ),
          ].join(", ")}.`,
      });
    }

    return {
      success: false,
      code: "INVALID_EXCEL_COLUMNS",
      errors,
    };
  }

  const questions = [];
  const errors = [];

  for (
    let rowNumber = 2;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row =
      worksheet.getRow(rowNumber);

    const questionText =
      getCellText(
        row,
        headerIndexes.question_text
      );

    const answerA =
      getCellText(
        row,
        headerIndexes.a
      );

    const answerB =
      getCellText(
        row,
        headerIndexes.b
      );

    const answerC =
      getCellText(
        row,
        headerIndexes.c
      );

    const answerD =
      getCellText(
        row,
        headerIndexes.d
      );

    const correctAnswer =
      getCellText(
        row,
        headerIndexes.correct
      ).toUpperCase();

    const pointsText =
      getCellText(
        row,
        headerIndexes.points
      );

    const rowIsEmpty = [
      questionText,
      answerA,
      answerB,
      answerC,
      answerD,
      correctAnswer,
      pointsText,
    ].every((value) => !value);

    if (rowIsEmpty) {
      continue;
    }

    const rowErrors = [];

    if (!questionText) {
      rowErrors.push(
        "question_text không được để trống"
      );
    }

    if (!answerA) {
      rowErrors.push(
        "đáp án A không được để trống"
      );
    }

    if (!answerB) {
      rowErrors.push(
        "đáp án B không được để trống"
      );
    }

    if (!answerC) {
      rowErrors.push(
        "đáp án C không được để trống"
      );
    }

    if (!answerD) {
      rowErrors.push(
        "đáp án D không được để trống"
      );
    }

    if (
      !["A", "B", "C", "D"].includes(
        correctAnswer
      )
    ) {
      rowErrors.push(
        "correct chỉ được nhận A, B, C hoặc D"
      );
    }

    const answers = [
      ["A", answerA],
      ["B", answerB],
      ["C", answerC],
      ["D", answerD],
    ];

    answers.forEach(
      ([answerName, answerValue]) => {
        if (answerValue.length > 500) {
          rowErrors.push(
            `đáp án ${answerName} không được vượt quá 500 ký tự`
          );
        }
      }
    );

    let points = null;

    if (pointsText === "") {
    rowErrors.push(
        "points không được để trống"
    );
    } else {
    points = Number(
        String(pointsText)
        .trim()
        .replace(",", ".")
    );

    if (
        !Number.isFinite(points) ||
        points <= 0
    ) {
        rowErrors.push(
        "points phải là số lớn hơn 0"
        );
    } else {
        points =
        Math.round(points * 100) / 100;
    }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        message:
          rowErrors.join("; "),
      });

      continue;
    }

    questions.push({
      questionText,
      answerA,
      answerB,
      answerC,
      answerD,
      correctAnswer,
      points,
    });
  }

const totalPoints =
  questions.reduce(
    (total, question) =>
      total +
      (
        Number(question.points) || 0
      ),
    0
  );

const roundedTotalPoints =
  Math.round(totalPoints * 100) / 100;

if (roundedTotalPoints <= 0) {
  errors.push({
    row: 1,
    message:
      "Tổng điểm của bài phải lớn hơn 0.",
  });
}
  
  if (errors.length > 0) {
    return {
      success: false,
      code: "INVALID_EXCEL_ROWS",
      errors,
    };
  }

  if (questions.length === 0) {
    return {
      success: false,
      code: "EXCEL_HAS_NO_QUESTIONS",
      errors: [
        {
          row: 2,
          message:
            "File Excel không có câu hỏi để import.",
        },
      ],
    };
  }

  return {
  success: true,
  questions,
  totalPoints:
    roundedTotalPoints,
};
}


module.exports =
  parseExamQuestionsExcel;