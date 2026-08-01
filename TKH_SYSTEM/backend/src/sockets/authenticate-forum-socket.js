const jwt = require("jsonwebtoken");


function createSocketAuthError(
  code,
  message
) {
  const error =
    new Error(message);

  error.data = {
    code,
  };

  return error;
}


function authenticateForumSocket(
  socket,
  next
) {
  try {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        createSocketAuthError(
          "UNAUTHORIZED",
          "Bạn chưa đăng nhập."
        )
      );
    }

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is missing from environment variables"
      );
    }

    const payload =
      jwt.verify(
        token,
        secret,
        {
          issuer:
            "tkh-2026-backend",

          audience:
            "tkh-2026-frontend",
        }
      );

    socket.user = {
      id:
        Number(payload.sub),

      role:
        payload.role,

      memberId:
        payload.memberId
          ? Number(payload.memberId)
          : null,
    };

    return next();
  } catch (error) {
    if (
      error.name ===
        "JsonWebTokenError" ||
      error.name ===
        "TokenExpiredError"
    ) {
      return next(
        createSocketAuthError(
          "INVALID_OR_EXPIRED_TOKEN",
          "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
        )
      );
    }

    return next(error);
  }
}


module.exports =
  authenticateForumSocket;