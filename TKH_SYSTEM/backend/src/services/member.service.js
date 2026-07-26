const bcrypt = require("bcrypt");

const {
  findMembersBySeasonId,
  importMembersInTransaction,
} = require("../repositories/member.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

const {
  findGroupsBySeasonId,
} = require("../repositories/group.repository");

const DEFAULT_PASSWORD = "123456";
const MAX_IMPORT_ROWS = 500;

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFC");
}

function normalizeKey(value) {
  return normalizeText(value).toLocaleLowerCase("vi-VN");
}

function createImportError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function validateBirthDate(value, rowNumber) {
  const birthDate = normalizeText(value);
  const match = birthDate.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    throw createImportError(
      "INVALID_IMPORT_DATA",
      `Ngày sinh tại dòng ${rowNumber} không hợp lệ.`,
      { rowNumber, field: "birthDate" }
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    throw createImportError(
      "INVALID_IMPORT_DATA",
      `Ngày sinh tại dòng ${rowNumber} không tồn tại.`,
      { rowNumber, field: "birthDate" }
    );
  }

  return birthDate;
}

function mapMember(row) {
  return {
    seasonMembershipId: row.season_membership_id,
    membershipStatus: row.membership_status,
    joinedAt: row.joined_at,

    member: {
      id: row.member_id,
      tkhCode: row.tkh_code,
      fullName: row.full_name,
      gender: row.gender,
      birthDate: row.birth_date,
      phone: row.phone,
      email: row.email,
      avatarFilename: row.avatar_filename,
      status: row.member_status,
    },

    group: row.group_id
      ? {
          id: row.group_id,
          code: row.group_code,
          name: row.group_name,
        }
      : null,

    account: row.user_id
      ? {
          id: row.user_id,
          username: row.username,
          role: row.role,
          isActive: Boolean(row.is_active),
          mustChangePassword: Boolean(
            row.must_change_password
          ),
        }
      : null,
  };
}

async function getCurrentSeasonMembers() {
  const season = await findActiveSeason();

  if (!season) {
    return {
      season: null,
      members: [],
    };
  }

  const rows = await findMembersBySeasonId(season.id);

  return {
    season: {
      id: season.id,
      code: season.code,
      name: season.name,
    },
    members: rows.map(mapMember),
  };
}

async function importCurrentSeasonMembers(rawStudents) {
  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    throw createImportError(
      "INVALID_IMPORT_DATA",
      "Danh sách import không có học viên."
    );
  }

  if (rawStudents.length > MAX_IMPORT_ROWS) {
    throw createImportError(
      "IMPORT_LIMIT_EXCEEDED",
      `Mỗi lần chỉ được import tối đa ${MAX_IMPORT_ROWS} học viên.`
    );
  }

  const season = await findActiveSeason();

  if (!season) {
    throw createImportError(
      "ACTIVE_SEASON_NOT_FOUND",
      "Không tìm thấy mùa đang hoạt động."
    );
  }

  const groups = await findGroupsBySeasonId(season.id);
  const groupLookup = new Map();

  groups.forEach((group) => {
    groupLookup.set(normalizeKey(group.code), group);
    groupLookup.set(normalizeKey(group.name), group);
  });

  const duplicateKeys = new Set();

  const students = rawStudents.map((rawStudent, index) => {
    const rowNumber =
      Number(rawStudent.rowNumber) || index + 2;

    const fullName = normalizeText(rawStudent.fullName);
    const gender = normalizeText(rawStudent.gender);
    const phone = normalizeText(rawStudent.phone);
    const groupInput = normalizeText(rawStudent.groupName);

    if (!fullName) {
      throw createImportError(
        "INVALID_IMPORT_DATA",
        `Thiếu họ tên tại dòng ${rowNumber}.`,
        { rowNumber, field: "fullName" }
      );
    }

    if (fullName.length > 150) {
      throw createImportError(
        "INVALID_IMPORT_DATA",
        `Họ tên tại dòng ${rowNumber} vượt quá 150 ký tự.`,
        { rowNumber, field: "fullName" }
      );
    }

    if (!gender || gender.length > 20) {
      throw createImportError(
        "INVALID_IMPORT_DATA",
        `Giới tính tại dòng ${rowNumber} không hợp lệ.`,
        { rowNumber, field: "gender" }
      );
    }

    if (!phone || phone.length > 30) {
      throw createImportError(
        "INVALID_IMPORT_DATA",
        `Điện thoại tại dòng ${rowNumber} không hợp lệ.`,
        { rowNumber, field: "phone" }
      );
    }

    const birthDate = validateBirthDate(
      rawStudent.birthDate,
      rowNumber
    );

    const group = groupLookup.get(normalizeKey(groupInput));

    if (!group) {
      throw createImportError(
        "GROUP_NOT_FOUND",
        `Không tìm thấy nhóm "${groupInput}" tại dòng ${rowNumber}.`,
        {
          rowNumber,
          groupName: groupInput,
          availableGroups: groups.map(
            (availableGroup) => availableGroup.name
          ),
        }
      );
    }

    const duplicateKey =
      `${normalizeKey(fullName)}|${phone.replace(/\s+/g, "")}`;

    if (duplicateKeys.has(duplicateKey)) {
      throw createImportError(
        "DUPLICATE_IN_FILE",
        `Học viên "${fullName}" bị lặp trong file Excel.`,
        { rowNumber, fullName }
      );
    }

    duplicateKeys.add(duplicateKey);

    return {
      rowNumber,
      fullName,
      normalizedName: normalizeKey(fullName),
      gender,
      birthDate,
      phone,
      groupId: group.id,
      groupName: group.name,
    };
  });

  const passwordHash = await bcrypt.hash(
    DEFAULT_PASSWORD,
    12
  );

  const importedMembers =
    await importMembersInTransaction({
      seasonId: season.id,
      students,
      passwordHash,
    });

  return {
    season: {
      id: season.id,
      code: season.code,
      name: season.name,
    },
    total: importedMembers.length,
    defaultPassword: DEFAULT_PASSWORD,
    members: importedMembers,
  };
}

module.exports = {
  getCurrentSeasonMembers,
  importCurrentSeasonMembers,
};