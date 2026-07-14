const authService = require("../services/auth.service");

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const result = await authService.login(username, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Tên đăng nhập hoặc mật khẩu không đúng.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Không tìm thấy tài khoản.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
}


async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      const statusCode =
        result.code === "USER_NOT_FOUND" ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.code,
          message:
            result.code === "CURRENT_PASSWORD_INCORRECT"
              ? "Mật khẩu hiện tại không đúng."
              : result.code === "NEW_PASSWORD_MUST_BE_DIFFERENT"
                ? "Mật khẩu mới phải khác mật khẩu hiện tại."
                : "Không tìm thấy tài khoản.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "Đổi mật khẩu thành công.",
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me,
  changePassword,
};