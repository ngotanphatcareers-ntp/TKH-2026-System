const { getPool, sql } = require("../config/database");

async function findMembersBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      SELECT
        sm.id AS season_membership_id,
        sm.status AS membership_status,
        sm.joined_at,

        m.id AS member_id,
        m.tkh_code,
        m.full_name,
        m.gender,
        CONVERT(VARCHAR(10), m.birth_date, 23) AS birth_date,
        m.phone,
        m.email,
        m.avatar_filename,
        m.status AS member_status,

        g.id AS group_id,
        g.code AS group_code,
        g.name AS group_name,

        u.id AS user_id,
        u.username,
        u.role,
        u.is_active,
        u.must_change_password

      FROM dbo.season_memberships AS sm

      INNER JOIN dbo.members AS m
        ON sm.member_id = m.id

      LEFT JOIN dbo.groups AS g
        ON sm.group_id = g.id

      LEFT JOIN dbo.users AS u
        ON u.member_id = m.id

      WHERE sm.season_id = @seasonId

      ORDER BY
        g.display_order,
        m.full_name;
    `);

  return result.recordset;
}

async function importMembersInTransaction({
  seasonId,
  students,
  passwordHash,
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const numberResult = await new sql.Request(transaction).query(`
      SELECT
        ISNULL(MAX(existing_codes.code_number), 0) AS last_number
      FROM
      (
        SELECT
          TRY_CONVERT(
            INT,
            SUBSTRING(m.tkh_code, 4, 30)
          ) AS code_number
        FROM dbo.members AS m WITH (UPDLOCK, HOLDLOCK)
        WHERE m.tkh_code LIKE 'TKH%'

        UNION ALL

        SELECT
          TRY_CONVERT(
            INT,
            SUBSTRING(u.username, 4, 100)
          ) AS code_number
        FROM dbo.users AS u WITH (UPDLOCK, HOLDLOCK)
        WHERE u.username LIKE 'TKH%'
      ) AS existing_codes
      WHERE existing_codes.code_number IS NOT NULL;
    `);

    let nextNumber =
      Number(numberResult.recordset[0]?.last_number || 0) + 1;

    const importedMembers = [];

    for (const student of students) {
      const duplicateResult = await new sql.Request(transaction)
        .input("seasonId", sql.Int, seasonId)
        .input("fullName", sql.NVarChar(150), student.fullName)
        .input("phone", sql.VarChar(30), student.phone)
        .query(`
          SELECT TOP 1
            m.id,
            m.tkh_code,
            m.full_name
          FROM dbo.season_memberships AS sm
          INNER JOIN dbo.members AS m
            ON m.id = sm.member_id
          WHERE sm.season_id = @seasonId
            AND LOWER(LTRIM(RTRIM(m.full_name))) =
                LOWER(LTRIM(RTRIM(@fullName)))
            AND ISNULL(LTRIM(RTRIM(m.phone)), '') =
                LTRIM(RTRIM(@phone));
        `);

      if (duplicateResult.recordset.length > 0) {
        const duplicateError = new Error(
          `Học viên "${student.fullName}" đã tồn tại.`
        );

        duplicateError.code = "MEMBER_ALREADY_EXISTS";
        duplicateError.details = {
          rowNumber: student.rowNumber,
          fullName: student.fullName,
          existingTkhCode:
            duplicateResult.recordset[0].tkh_code,
        };

        throw duplicateError;
      }

      const numberText = String(nextNumber).padStart(3, "0");
      const tkhCode = `TKH${numberText}`;
      const username = `tkh${numberText}`;

      const memberResult = await new sql.Request(transaction)
        .input("tkhCode", sql.VarChar(30), tkhCode)
        .input("fullName", sql.NVarChar(150), student.fullName)
        .input(
          "normalizedName",
          sql.NVarChar(150),
          student.normalizedName
        )
        .input("gender", sql.NVarChar(20), student.gender)
        .input("birthDate", sql.VarChar(10), student.birthDate)
        .input("phone", sql.VarChar(30), student.phone)
        .query(`
          INSERT INTO dbo.members
          (
            tkh_code,
            full_name,
            normalized_name,
            gender,
            birth_date,
            phone,
            status
          )
          OUTPUT INSERTED.id AS member_id
          VALUES
          (
            @tkhCode,
            @fullName,
            @normalizedName,
            @gender,
            CONVERT(DATE, @birthDate, 23),
            @phone,
            'ACTIVE'
          );
        `);

      const memberId =
        memberResult.recordset[0].member_id;

      await new sql.Request(transaction)
        .input("memberId", sql.Int, memberId)
        .input("username", sql.VarChar(100), username)
        .input(
          "passwordHash",
          sql.NVarChar(255),
          passwordHash
        )
        .query(`
          INSERT INTO dbo.users
          (
            member_id,
            username,
            password_hash,
            role,
            must_change_password,
            is_active
          )
          VALUES
          (
            @memberId,
            @username,
            @passwordHash,
            'STUDENT',
            1,
            1
          );
        `);

      await new sql.Request(transaction)
        .input("seasonId", sql.Int, seasonId)
        .input("memberId", sql.Int, memberId)
        .input("groupId", sql.Int, student.groupId)
        .query(`
          INSERT INTO dbo.season_memberships
          (
            season_id,
            member_id,
            group_id,
            status
          )
          VALUES
          (
            @seasonId,
            @memberId,
            @groupId,
            'ACTIVE'
          );
        `);

      importedMembers.push({
        memberId,
        tkhCode,
        username,
        fullName: student.fullName,
        groupId: student.groupId,
        groupName: student.groupName,
      });

      nextNumber += 1;
    }

    await transaction.commit();
    transactionStarted = false;

    return importedMembers;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Member import rollback error:",
          rollbackError
        );
      }
    }

    throw error;
  }
}

module.exports = {
  findMembersBySeasonId,
  importMembersInTransaction,
};