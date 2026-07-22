const scoreConfig = {
  attendance: {
    transactionTypes: ["ATTENDANCE", "ATTENDANCE_ADJUSTMENT"],
    maxRawScore: 110,
    maxWeightedScore: 30,
  },

  learning: {
    preTest: {
      transactionTypes: ["PRE_TEST"],
      numberOfTests: 3,
      questionsPerTest: 10,
      pointsPerCorrectAnswer: 1,
      maxScorePerTest: 10,
      maxScore: 30,
    },

    bibleChallenge: {
      transactionTypes: ["BIBLE_CHALLENGE"],
      pointsPerEvent: 10,
      maxScore: 60,
    },

    participation: {
      transactionTypes: ["PARTICIPATION"],
      pointsPerParticipation: 2,
      maxScore: 50,
    },

    finalTest: {
      transactionTypes: ["FINAL_TEST"],
      numberOfTests: 1,
      questionsPerTest: 30,
      pointsPerCorrectAnswer: 2,
      maxScore: 60,
    },

    maxRawScore: 200,
    maxWeightedScore: 40,
  },

  discipline: {
    cleaning: {
      transactionTypes: ["DISCIPLINE_CLEANING"],
      maxScore: 30,
    },

    compliance: {
      transactionTypes: ["DISCIPLINE_COMPLIANCE"],
      maxScore: 30,
    },

    spirit: {
      transactionTypes: ["DISCIPLINE_SPIRIT"],
      maxScore: 30,
    },

    maxRawScore: 90,
    maxWeightedScore: 30,
  },

  transactionStatuses: {
    active: "ACTIVE",
    reversed: "REVERSED",
    cancelled: "CANCELLED",
  },

  finalScore: {
    maxScore: 100,
    decimalPlaces: 2,
  },
};

module.exports = scoreConfig;