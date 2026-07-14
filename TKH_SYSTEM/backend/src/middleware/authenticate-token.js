const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Bạn chưa đăng nhập.",
        },
      });
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing from environment variables");
    }

    const payload = jwt.verify(token, secret, {
      issuer: "tkh-2026-backend",
      audience: "tkh-2026-frontend",
    });

    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      memberId: payload.memberId,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_OR_EXPIRED_TOKEN",
          message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
        },
      });
    }

    return next(error);
  }
}

module.exports = authenticateToken;