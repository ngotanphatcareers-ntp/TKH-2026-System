const sql = require("mssql/msnodesqlv8");

const server = process.env.DB_SERVER;
const database = process.env.DB_DATABASE;

if (!server || !database) {
  throw new Error(
    "Missing required database environment variables: DB_SERVER or DB_DATABASE"
  );
}

const connectionString = [
  "Driver={ODBC Driver 17 for SQL Server}",
  `Server=${server}`,
  `Database=${database}`,
  "Trusted_Connection=yes",
  "TrustServerCertificate=yes",
].join(";");

const databaseConfig = {
  connectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(databaseConfig);

    poolPromise = pool.connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

async function testDatabaseConnection() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      DB_NAME() AS database_name,
      @@SERVERNAME AS server_name,
      GETDATE() AS server_time;
  `);

  return result.recordset[0];
}

module.exports = {
  sql,
  getPool,
  testDatabaseConnection,
};