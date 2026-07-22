const scoreConfig = require("../config/score.config");

/**
 * Giới hạn điểm trong khoảng min - max.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Làm tròn theo số chữ số thập phân cấu hình.
 */
function round(value) {
  return Number(
    value.toFixed(scoreConfig.finalScore.decimalPlaces)
  );
}

/**
 * Tính điểm Chuyên cần.
 */
function calculateAttendance(transactions = []) {
  const activeStatus =
    scoreConfig.transactionStatuses.active;

  const attendanceTransactions = transactions.filter(
    (transaction) =>
      transaction.status === activeStatus &&
      transaction.scoreType === "ATTENDANCE"
  );

  const adjustmentTransactions = transactions.filter(
    (transaction) =>
      transaction.status === activeStatus &&
      transaction.scoreType === "ATTENDANCE_ADJUSTMENT"
  );

  const attendanceScore = attendanceTransactions.reduce(
    (total, transaction) => {
      const points = Number(transaction.appliedPoints) || 0;

      return total + points;
    },
    0
  );

  const adjustmentScore = adjustmentTransactions.reduce(
    (total, transaction) => {
      const points = Number(transaction.appliedPoints) || 0;

      return total + points;
    },
    0
  );

  const rawTotal =
    attendanceScore + adjustmentScore;

  const rawScore = clamp(
    rawTotal,
    0,
    scoreConfig.attendance.maxRawScore
  );

  const weightedScore = round(
    (rawScore / scoreConfig.attendance.maxRawScore) *
      scoreConfig.attendance.maxWeightedScore
  );

  return {
    components: {
      attendance: {
        score: attendanceScore,
      },

      adjustment: {
        score: adjustmentScore,
      },
    },

    rawScore,
    maxRawScore: scoreConfig.attendance.maxRawScore,
    weightedScore,
    maxWeightedScore:
      scoreConfig.attendance.maxWeightedScore,
  };
}

/**
 * Tính điểm Học tập.
 */
function calculateLearning(transactions = []) {
  const activeStatus =
    scoreConfig.transactionStatuses.active;

  const activeTransactions = transactions.filter(
    (transaction) => transaction.status === activeStatus
  );

  function sumByTypes(transactionTypes) {
    return activeTransactions
      .filter((transaction) =>
        transactionTypes.includes(transaction.scoreType)
      )
      .reduce((total, transaction) => {
        const points = Number(transaction.appliedPoints) || 0;

        return total + points;
      }, 0);
  }

  const preTestScore = clamp(
    sumByTypes(
      scoreConfig.learning.preTest.transactionTypes
    ),
    0,
    scoreConfig.learning.preTest.maxScore
  );

  const bibleChallengeScore = clamp(
    sumByTypes(
      scoreConfig.learning.bibleChallenge.transactionTypes
    ),
    0,
    scoreConfig.learning.bibleChallenge.maxScore
  );

  const participationScore = clamp(
    sumByTypes(
      scoreConfig.learning.participation.transactionTypes
    ),
    0,
    scoreConfig.learning.participation.maxScore
  );

  const finalTestScore = clamp(
    sumByTypes(
      scoreConfig.learning.finalTest.transactionTypes
    ),
    0,
    scoreConfig.learning.finalTest.maxScore
  );

  const rawScore = clamp(
    preTestScore +
      bibleChallengeScore +
      participationScore +
      finalTestScore,
    0,
    scoreConfig.learning.maxRawScore
  );

  const weightedScore = round(
    (rawScore / scoreConfig.learning.maxRawScore) *
      scoreConfig.learning.maxWeightedScore
  );

  return {
    components: {
      preTest: {
        score: preTestScore,
        maxScore:
          scoreConfig.learning.preTest.maxScore,
      },

      bibleChallenge: {
        score: bibleChallengeScore,
        maxScore:
          scoreConfig.learning.bibleChallenge.maxScore,
      },

      participation: {
        score: participationScore,
        maxScore:
          scoreConfig.learning.participation.maxScore,
      },

      finalTest: {
        score: finalTestScore,
        maxScore:
          scoreConfig.learning.finalTest.maxScore,
      },
    },

    rawScore,
    maxRawScore: scoreConfig.learning.maxRawScore,
    weightedScore,
    maxWeightedScore:
      scoreConfig.learning.maxWeightedScore,
  };
}

/**
 * Tính điểm Rèn luyện.
 */
function calculateDiscipline(transactions = []) {
  const activeStatus =
    scoreConfig.transactionStatuses.active;

  const activeTransactions = transactions.filter(
    (transaction) => transaction.status === activeStatus
  );

  function sumByTypes(transactionTypes) {
    return activeTransactions
      .filter((transaction) =>
        transactionTypes.includes(transaction.scoreType)
      )
      .reduce((total, transaction) => {
        const points = Number(transaction.appliedPoints) || 0;

        return total + points;
      }, 0);
  }

  const cleaningScore = clamp(
    sumByTypes(
      scoreConfig.discipline.cleaning.transactionTypes
    ),
    0,
    scoreConfig.discipline.cleaning.maxScore
  );

  const complianceScore = clamp(
    sumByTypes(
      scoreConfig.discipline.compliance.transactionTypes
    ),
    0,
    scoreConfig.discipline.compliance.maxScore
  );

  const spiritScore = clamp(
    sumByTypes(
      scoreConfig.discipline.spirit.transactionTypes
    ),
    0,
    scoreConfig.discipline.spirit.maxScore
  );

  const rawScore = clamp(
    cleaningScore +
      complianceScore +
      spiritScore,
    0,
    scoreConfig.discipline.maxRawScore
  );

  const weightedScore = round(
    (rawScore / scoreConfig.discipline.maxRawScore) *
      scoreConfig.discipline.maxWeightedScore
  );

  return {
    components: {
      cleaning: {
        score: cleaningScore,
        maxScore:
          scoreConfig.discipline.cleaning.maxScore,
      },

      compliance: {
        score: complianceScore,
        maxScore:
          scoreConfig.discipline.compliance.maxScore,
      },

      spirit: {
        score: spiritScore,
        maxScore:
          scoreConfig.discipline.spirit.maxScore,
      },
    },

    rawScore,
    maxRawScore: scoreConfig.discipline.maxRawScore,
    weightedScore,
    maxWeightedScore:
      scoreConfig.discipline.maxWeightedScore,
  };
}

/**
 * Tính điểm Tổng kết.
 */
function calculateFinalScore(summary = {}) {
  const attendanceWeighted =
    Number(summary.attendance?.weightedScore) || 0;

  const learningWeighted =
    Number(summary.learning?.weightedScore) || 0;

  const disciplineWeighted =
    Number(summary.discipline?.weightedScore) || 0;

  const score = round(
    clamp(
      attendanceWeighted +
        learningWeighted +
        disciplineWeighted,
      0,
      scoreConfig.finalScore.maxScore
    )
  );

  return {
    score,
    maxScore: scoreConfig.finalScore.maxScore,
  };
}

/**
 * Tổng hợp toàn bộ điểm của một học viên.
 */
function calculateMemberSummary(transactions = []) {
  const attendance =
    calculateAttendance(transactions);

  const learning =
    calculateLearning(transactions);

  const discipline =
    calculateDiscipline(transactions);

  const final = calculateFinalScore({
    attendance,
    learning,
    discipline,
  });

  return {
    attendance,
    learning,
    discipline,
    final,
  };
}

module.exports = {
  clamp,
  round,
  calculateAttendance,
  calculateLearning,
  calculateDiscipline,
  calculateFinalScore,
  calculateMemberSummary,
};