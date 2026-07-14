require("dotenv").config();

const bcrypt = require("bcrypt");

async function generateAdminHash() {
  try {
    const password = process.env.ADMIN_TEMP_PASSWORD;

    if (!password) {
      throw new Error("ADMIN_TEMP_PASSWORD is missing from .env");
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    console.log("\nAdmin bcrypt hash:\n");
    console.log(passwordHash);
    console.log("\nCopy this hash into SQL Server.\n");
  } catch (error) {
    console.error("Failed to generate password hash:", error.message);
    process.exit(1);
  }
}

generateAdminHash();