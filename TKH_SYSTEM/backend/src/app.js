const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const groupRoutes = require("./routes/group.routes");
const seasonRoutes = require("./routes/season.routes");
const { testDatabaseConnection } = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const adminTestRoutes = require("./routes/admin-test.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin/test", adminTestRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TKH 2026 Backend is running",
  });
});

app.get("/api/health/database", async (req, res, next) => {
  try {
    const database = await testDatabaseConnection();

    res.status(200).json({
      success: true,
      message: "SQL Server connection successful",
      data: database,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected server error",
    },
  });
});

module.exports = app;