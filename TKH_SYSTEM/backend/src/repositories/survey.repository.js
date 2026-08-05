const {
  getPool,
  sql,
} = require("../config/database");


/*
 * =========================================================
 * SELECT DÙNG CHUNG
 * =========================================================
 */

const SURVEY_SELECT = `
  SELECT
    s.id,
    s.season_id,
    s.code,
    s.title,
    s.description,
    s.status,
    s.created_by_user_id,
    s.opened_at,
    s.closed_at,
    s.created_at,
    s.updated_at
  FROM dbo.surveys AS s
`;


/*
 * =========================================================
 * LẤY KHẢO SÁT THEO ID
 * =========================================================
 */

async function findSurveyById(surveyId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "surveyId",
      sql.Int,
      surveyId
    )
    .query(`
      ${SURVEY_SELECT}

      WHERE s.id = @surveyId;
    `);

  return result.recordset[0] || null;
}


/*
 * =========================================================
 * LẤY DANH SÁCH CÂU HỎI CỦA KHẢO SÁT
 * =========================================================
 */

async function findSurveyQuestions(
  surveyId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "surveyId",
      sql.Int,
      surveyId
    )
    .query(`
      SELECT
        sq.id,
        sq.survey_id,
        sq.display_order,
        sq.title,
        sq.question_text,
        sq.yes_label,
        sq.no_label,
        sq.is_required,
        sq.created_at,
        sq.updated_at
      FROM dbo.survey_questions AS sq
      WHERE sq.survey_id = @surveyId
      ORDER BY
        sq.display_order ASC,
        sq.id ASC;
    `);

  return result.recordset;
}


/*
 * =========================================================
 * LẤY BÀI NỘP CỦA MỘT HỌC VIÊN
 * =========================================================
 */

async function findResponseBySurveyAndMembership({
  surveyId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "surveyId",
      sql.Int,
      surveyId
    )
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT TOP 1
        sr.id,
        sr.survey_id,
        sr.season_membership_id,
        sr.status,
        sr.submitted_at,
        sr.created_at,
        sr.updated_at
      FROM dbo.survey_responses AS sr
      WHERE sr.survey_id = @surveyId
        AND sr.season_membership_id =
          @seasonMembershipId
      ORDER BY sr.id DESC;
    `);

  return result.recordset[0] || null;
}


/*
 * =========================================================
 * LẤY CÂU TRẢ LỜI CỦA MỘT BÀI NỘP
 * =========================================================
 */

async function findAnswersByResponseId(
  responseId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "responseId",
      sql.Int,
      responseId
    )
    .query(`
      SELECT
        sa.id,
        sa.response_id,
        sa.question_id,
        sa.yes_answer,
        sa.no_answer,
        sa.created_at,
        sa.updated_at,

        sq.display_order,
        sq.title AS question_title,
        sq.question_text,
        sq.yes_label,
        sq.no_label

      FROM dbo.survey_answers AS sa

      INNER JOIN dbo.survey_questions AS sq
        ON sq.id = sa.question_id

      WHERE sa.response_id = @responseId

      ORDER BY
        sq.display_order ASC,
        sq.id ASC;
    `);

  return result.recordset;
}


/*
 * =========================================================
 * DANH SÁCH KHẢO SÁT DÀNH CHO HỌC VIÊN
 *
 * Trả về cả trạng thái học viên đã nộp hay chưa.
 * =========================================================
 */

async function findStudentSurveys({
  seasonId,
  seasonMembershipId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonId",
      sql.Int,
      seasonId
    )
    .input(
      "seasonMembershipId",
      sql.Int,
      seasonMembershipId
    )
    .query(`
      SELECT
        s.id,
        s.season_id,
        s.code,
        s.title,
        s.description,
        s.status,
        s.opened_at,
        s.closed_at,
        s.created_at,
        s.updated_at,

        COUNT(
          DISTINCT sq.id
        ) AS question_count,

        sr.id AS response_id,
        sr.status AS response_status,
        sr.submitted_at

      FROM dbo.surveys AS s

      LEFT JOIN dbo.survey_questions AS sq
        ON sq.survey_id = s.id

      LEFT JOIN dbo.survey_responses AS sr
        ON sr.survey_id = s.id
       AND sr.season_membership_id =
         @seasonMembershipId

      WHERE s.season_id = @seasonId

      GROUP BY
        s.id,
        s.season_id,
        s.code,
        s.title,
        s.description,
        s.status,
        s.opened_at,
        s.closed_at,
        s.created_at,
        s.updated_at,

        sr.id,
        sr.status,
        sr.submitted_at

      ORDER BY
        CASE
          WHEN s.status = 'OPEN' THEN 0
          WHEN s.status = 'DRAFT' THEN 1
          WHEN s.status = 'CLOSED' THEN 2
          ELSE 3
        END,
        s.created_at DESC,
        s.id DESC;
    `);

  return result.recordset;
}


/*
 * =========================================================
 * TẠO BÀI NỘP VÀ TOÀN BỘ CÂU TRẢ LỜI
 *
 * Dùng SQL Transaction để tránh trường hợp:
 * - Tạo response nhưng chưa lưu đủ answer.
 * - Hai request cùng gửi một lúc.
 * - Admin vừa đóng khảo sát lúc học viên submit.
 * =========================================================
 */

async function createSurveyResponse({
  surveyId,
  seasonMembershipId,
  answers,
}) {
  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  await transaction.begin(
    sql.ISOLATION_LEVEL.SERIALIZABLE
  );

  try {
    /*
     * Khóa dòng khảo sát trong lúc kiểm tra và lưu.
     * Điều này giúp hạn chế trường hợp Admin đóng khảo sát
     * đúng lúc học viên đang submit.
     */
    const surveyResult =
      await new sql.Request(transaction)
        .input(
          "surveyId",
          sql.Int,
          surveyId
        )
        .query(`
          SELECT TOP 1
            s.id,
            s.season_id,
            s.status
          FROM dbo.surveys AS s
          WITH (UPDLOCK, HOLDLOCK)
          WHERE s.id = @surveyId;
        `);

    const survey =
      surveyResult.recordset[0] || null;

    if (!survey) {
      await transaction.rollback();

      return {
        success: false,
        code: "SURVEY_NOT_FOUND",
      };
    }

    if (survey.status !== "OPEN") {
      await transaction.rollback();

      return {
        success: false,
        code: "SURVEY_NOT_OPEN",
      };
    }

    /*
     * Kiểm tra membership có thật sự thuộc đúng mùa
     * của khảo sát hay không.
     */
    const membershipResult =
      await new sql.Request(transaction)
        .input(
          "seasonMembershipId",
          sql.Int,
          seasonMembershipId
        )
        .input(
          "surveySeasonId",
          sql.Int,
          survey.season_id
        )
        .query(`
          SELECT TOP 1
            sm.id,
            sm.season_id,
            sm.member_id,
            sm.group_id,
            sm.status
          FROM dbo.season_memberships AS sm
          WHERE sm.id = @seasonMembershipId
            AND sm.season_id = @surveySeasonId
            AND sm.status = 'ACTIVE';
        `);

    const membership =
      membershipResult.recordset[0] ||
      null;

    if (!membership) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "MEMBERSHIP_NOT_IN_SURVEY_SEASON",
      };
    }

    /*
     * Chặn học viên nộp lần thứ hai.
     */
    const existingResponseResult =
      await new sql.Request(transaction)
        .input(
          "surveyId",
          sql.Int,
          surveyId
        )
        .input(
          "seasonMembershipId",
          sql.Int,
          seasonMembershipId
        )
        .query(`
          SELECT TOP 1
            sr.id
          FROM dbo.survey_responses AS sr
          WITH (UPDLOCK, HOLDLOCK)
          WHERE sr.survey_id = @surveyId
            AND sr.season_membership_id =
              @seasonMembershipId;
        `);

    if (
      existingResponseResult
        .recordset
        .length > 0
    ) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "SURVEY_ALREADY_SUBMITTED",
      };
    }

    /*
     * Lấy danh sách câu hỏi thật sự thuộc khảo sát.
     */
    const questionsResult =
      await new sql.Request(transaction)
        .input(
          "surveyId",
          sql.Int,
          surveyId
        )
        .query(`
          SELECT
            sq.id,
            sq.is_required
          FROM dbo.survey_questions AS sq
          WHERE sq.survey_id = @surveyId
          ORDER BY
            sq.display_order ASC,
            sq.id ASC;
        `);

    const questions =
      questionsResult.recordset;

    if (questions.length === 0) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "SURVEY_HAS_NO_QUESTIONS",
      };
    }

    const questionIds =
      new Set(
        questions.map(
          question =>
            Number(question.id)
        )
      );

    /*
     * Đảm bảo không gửi câu trả lời cho câu hỏi
     * thuộc khảo sát khác.
     */
    const hasInvalidQuestion =
      answers.some(
        answer =>
          !questionIds.has(
            Number(answer.questionId)
          )
      );

    if (hasInvalidQuestion) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "INVALID_SURVEY_QUESTION",
      };
    }

    /*
     * Kiểm tra đủ tất cả câu hỏi bắt buộc.
     */
    const submittedQuestionIds =
      new Set(
        answers.map(
          answer =>
            Number(answer.questionId)
        )
      );

    const missingRequiredQuestion =
      questions.find(
        question =>
          Boolean(question.is_required) &&
          !submittedQuestionIds.has(
            Number(question.id)
          )
      );

    if (missingRequiredQuestion) {
      await transaction.rollback();

      return {
        success: false,
        code:
          "REQUIRED_SURVEY_ANSWER_MISSING",
        questionId:
          Number(
            missingRequiredQuestion.id
          ),
      };
    }

    /*
     * Tạo response.
     */
    const responseResult =
      await new sql.Request(transaction)
        .input(
          "surveyId",
          sql.Int,
          surveyId
        )
        .input(
          "seasonMembershipId",
          sql.Int,
          seasonMembershipId
        )
        .query(`
          INSERT INTO dbo.survey_responses
          (
            survey_id,
            season_membership_id,
            status,
            submitted_at,
            created_at,
            updated_at
          )
          OUTPUT
            INSERTED.id,
            INSERTED.survey_id,
            INSERTED.season_membership_id,
            INSERTED.status,
            INSERTED.submitted_at,
            INSERTED.created_at,
            INSERTED.updated_at
          VALUES
          (
            @surveyId,
            @seasonMembershipId,
            'SUBMITTED',
            SYSDATETIME(),
            SYSDATETIME(),
            SYSDATETIME()
          );
        `);

    const createdResponse =
      responseResult.recordset[0];

    /*
     * Tạo từng answer trong cùng transaction.
     * Khảo sát chỉ có 5 câu nên cách này nhẹ và rõ ràng.
     */
    for (const answer of answers) {
      await new sql.Request(transaction)
        .input(
          "responseId",
          sql.Int,
          createdResponse.id
        )
        .input(
          "questionId",
          sql.Int,
          answer.questionId
        )
        .input(
          "yesAnswer",
          sql.NVarChar(sql.MAX),
          answer.yesAnswer
        )
        .input(
          "noAnswer",
          sql.NVarChar(sql.MAX),
          answer.noAnswer
        )
        .query(`
          INSERT INTO dbo.survey_answers
          (
            response_id,
            question_id,
            yes_answer,
            no_answer,
            created_at,
            updated_at
          )
          VALUES
          (
            @responseId,
            @questionId,
            @yesAnswer,
            @noAnswer,
            SYSDATETIME(),
            SYSDATETIME()
          );
        `);
    }

    await transaction.commit();

    return {
      success: true,
      response: createdResponse,
    };
  } catch (error) {
    if (
      transaction._aborted !== true
    ) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback survey response error:",
          rollbackError
        );
      }
    }

    /*
     * Unique constraint cũng bảo vệ chống nộp trùng
     * trong trường hợp có hai request đồng thời.
     */
    if (
      Number(error.number) === 2627 ||
      Number(error.number) === 2601
    ) {
      return {
        success: false,
        code:
          "SURVEY_ALREADY_SUBMITTED",
      };
    }

    throw error;
  }
}


/*
 * =========================================================
 * ADMIN: DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function findAdminSurveys(
  seasonId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonId",
      sql.Int,
      seasonId
    )
    .query(`
      SELECT
        s.id,
        s.season_id,
        s.code,
        s.title,
        s.description,
        s.status,
        s.opened_at,
        s.closed_at,
        s.created_at,
        s.updated_at,

        COUNT(
          DISTINCT sq.id
        ) AS question_count,

        COUNT(
          DISTINCT sr.id
        ) AS response_count

      FROM dbo.surveys AS s

      LEFT JOIN dbo.survey_questions AS sq
        ON sq.survey_id = s.id

      LEFT JOIN dbo.survey_responses AS sr
        ON sr.survey_id = s.id

      WHERE s.season_id = @seasonId

      GROUP BY
        s.id,
        s.season_id,
        s.code,
        s.title,
        s.description,
        s.status,
        s.opened_at,
        s.closed_at,
        s.created_at,
        s.updated_at

      ORDER BY
        s.created_at DESC,
        s.id DESC;
    `);

  return result.recordset;
}


/*
 * =========================================================
 * ADMIN: ĐẾM TỔNG HỌC VIÊN CỦA MÙA
 * =========================================================
 */

async function countActiveSeasonMemberships(
  seasonId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "seasonId",
      sql.Int,
      seasonId
    )
    .query(`
      SELECT
        COUNT(*) AS total_students
      FROM dbo.season_memberships AS sm
      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id
      WHERE sm.season_id = @seasonId
        AND sm.status = 'ACTIVE'
        AND m.status = 'ACTIVE';
    `);

  return (
    Number(
      result.recordset[0]
        ?.total_students
    ) || 0
  );
}


/*
 * =========================================================
 * ADMIN: LẤY TOÀN BỘ BÀI NỘP
 *
 * Kết quả trả về mỗi answer là một dòng.
 * Service sẽ nhóm lại thành từng học viên.
 * =========================================================
 */

async function findSurveyResponseRows(
  surveyId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "surveyId",
      sql.Int,
      surveyId
    )
    .query(`
      SELECT
        sr.id AS response_id,
        sr.survey_id,
        sr.status AS response_status,
        sr.submitted_at,

        sm.id AS season_membership_id,

        m.id AS member_id,
        m.tkh_code,
        m.full_name,

        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name,

        sa.id AS answer_id,
        sa.question_id,
        sa.yes_answer,
        sa.no_answer,

        sq.display_order,
        sq.title AS question_title,
        sq.question_text,
        sq.yes_label,
        sq.no_label

      FROM dbo.survey_responses AS sr

      INNER JOIN dbo.season_memberships AS sm
        ON sm.id =
          sr.season_membership_id

      INNER JOIN dbo.members AS m
        ON m.id = sm.member_id

      LEFT JOIN dbo.groups AS g
        ON g.id = sm.group_id

      LEFT JOIN dbo.survey_answers AS sa
        ON sa.response_id = sr.id

      LEFT JOIN dbo.survey_questions AS sq
        ON sq.id = sa.question_id

      WHERE sr.survey_id = @surveyId

      ORDER BY
        sr.submitted_at DESC,
        sr.id DESC,
        sq.display_order ASC,
        sq.id ASC;
    `);

  return result.recordset;
}


/*
 * =========================================================
 * ADMIN: MỞ HOẶC ĐÓNG KHẢO SÁT
 * =========================================================
 */

async function updateSurveyStatus({
  surveyId,
  status,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "surveyId",
      sql.Int,
      surveyId
    )
    .input(
      "status",
      sql.VarChar(20),
      status
    )
    .query(`
      UPDATE dbo.surveys
      SET
        status = @status,

        opened_at =
          CASE
            WHEN @status = 'OPEN'
              THEN SYSDATETIME()
            ELSE opened_at
          END,

        closed_at =
          CASE
            WHEN @status = 'CLOSED'
              THEN SYSDATETIME()
            WHEN @status = 'OPEN'
              THEN NULL
            ELSE closed_at
          END,

        updated_at = SYSDATETIME()

      WHERE id = @surveyId;

      SELECT
        @@ROWCOUNT AS affected_rows;
    `);

  const affectedRows =
    Number(
      result.recordset[0]
        ?.affected_rows
    ) || 0;

  if (affectedRows === 0) {
    return null;
  }

  return findSurveyById(surveyId);
}


module.exports = {
  findSurveyById,
  findSurveyQuestions,

  findResponseBySurveyAndMembership,
  findAnswersByResponseId,

  findStudentSurveys,
  createSurveyResponse,

  findAdminSurveys,
  countActiveSeasonMemberships,
  findSurveyResponseRows,
  updateSurveyStatus,
};