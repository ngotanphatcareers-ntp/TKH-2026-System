const {
  findQuestionById,
  findQuestionsByMembershipId,
  findQuestionsBySeasonId,
  createQuestion,
  respondToQuestion,
} = require("../repositories/question.repository");

const {
  findActiveMembershipByMemberId,
} = require("../repositories/membership.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

const {
  findSessionById,
} = require("../repositories/session.repository");


function mapQuestion(question) {
  if (!question) {
    return null;
  }

  return {
    id: question.id,
    visibility: question.visibility,
    status: question.status,
    questionText: question.question_text,
    adminResponse: question.admin_response,
    createdAt: question.created_at,
    respondedAt: question.responded_at,

    member: {
      id: question.member_id,
      fullName: question.member_full_name,
      username: question.username,
      tkhCode: question.tkh_code,
    },

    group: question.group_id
      ? {
          id: question.group_id,
          code: question.group_code,
          name: question.group_name,
        }
      : null,

    session: question.session_id
      ? {
          id: question.session_id,
          number: question.session_no,
          name: question.session_name,
        }
      : null,

    responder: question.responded_by_user_id
      ? {
          id: question.responded_by_user_id,
          username: question.responder_username,
        }
      : null,
  };
}


async function submitQuestion({
  memberId,
  sessionId,
  visibility,
  questionText,
}) {
  const normalizedMemberId = Number(memberId);
  const normalizedSessionId = Number(sessionId);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0
  ) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  if (
    !Number.isInteger(normalizedSessionId) ||
    normalizedSessionId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_SESSION_ID",
    };
  }

  const normalizedVisibility = String(
    visibility || ""
  )
    .trim()
    .toUpperCase();

  if (
    normalizedVisibility !== "PUBLIC" &&
    normalizedVisibility !== "PRIVATE"
  ) {
    return {
      success: false,
      code: "INVALID_VISIBILITY",
    };
  }

  const normalizedQuestionText = String(
    questionText || ""
  ).trim();

  if (!normalizedQuestionText) {
    return {
      success: false,
      code: "QUESTION_TEXT_REQUIRED",
    };
  }

  if (normalizedQuestionText.length > 2000) {
    return {
      success: false,
      code: "QUESTION_TEXT_TOO_LONG",
    };
  }

  const activeSeason = await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const membership =
    await findActiveMembershipByMemberId(
      normalizedMemberId
    );

  if (!membership) {
    return {
      success: false,
      code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
    };
  }

  if (
    Number(membership.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "MEMBERSHIP_NOT_IN_ACTIVE_SEASON",
    };
  }

  const session = await findSessionById(
    normalizedSessionId
  );

  if (!session) {
    return {
      success: false,
      code: "SESSION_NOT_FOUND",
    };
  }

  if (
    Number(session.season_id) !==
    Number(activeSeason.id)
  ) {
    return {
      success: false,
      code: "SESSION_NOT_IN_ACTIVE_SEASON",
    };
  }

  const createdQuestion = await createQuestion({
    seasonId: activeSeason.id,
    seasonMembershipId: membership.id,
    sessionId: normalizedSessionId,
    visibility: normalizedVisibility,
    questionText: normalizedQuestionText,
  });

  return {
    success: true,
    question: mapQuestion(createdQuestion),
  };
}


module.exports = {
  submitQuestion,
};
