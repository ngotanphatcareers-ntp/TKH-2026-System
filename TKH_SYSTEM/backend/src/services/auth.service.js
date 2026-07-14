const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  findUserByUsername,
  findUserById,
  updateLastLogin,
  updatePassword,
} = require("../repositories/auth.repository");

async function changePassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);

  if (!user || !user.is_active) {
    return {
      success: false,
      code: "USER_NOT_FOUND",
    };
  }

  const userWithHash = await findUserByUsername(user.username);

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    userWithHash.password_hash
  );

  if (!currentPasswordMatches) {
    return {
      success: false,
      code: "CURRENT_PASSWORD_INCORRECT",
    };
  }

  const sameAsOldPassword = await bcrypt.compare(
    newPassword,
    userWithHash.password_hash
  );

  if (sameAsOldPassword) {
    return {
      success: false,
      code: "NEW_PASSWORD_MUST_BE_DIFFERENT",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await updatePassword(userId, passwordHash);

  return {
    success: true,
  };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user || !user.is_active) {
    return null;
  }

  return {
    id: user.id,
    memberId: user.member_id,
    username: user.username,
    role: user.role,
    fullName: user.full_name,
    tkhCode: user.tkh_code,
    mustChangePassword: Boolean(user.must_change_password),
  };
}

function createAccessToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  return jwt.sign(
    {
      role: user.role,
      memberId: user.member_id,
    },
    secret,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "tkh-2026-backend",
      audience: "tkh-2026-frontend",
    }
  );
}

async function login(username, password) {
  const user = await findUserByUsername(username);

  if (!user || !user.is_active) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  const accessToken = createAccessToken(user);

  await updateLastLogin(user.id);

  return {
    accessToken,
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    user: {
      id: user.id,
      memberId: user.member_id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      tkhCode: user.tkh_code,
      mustChangePassword: Boolean(user.must_change_password),
    },
  };
}

module.exports = {
  login,
  getCurrentUser,
  changePassword,
};