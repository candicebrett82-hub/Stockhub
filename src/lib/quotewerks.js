import sql from "mssql";

let pool = null;

export async function getQWConnection() {
  if (pool) return pool;
  const config = {
    server: process.env.QW_SQL_SERVER,
    database: process.env.QW_SQL_DATABASE,
    user: process.env.QW_SQL_USER,
    password: process.env.QW_SQL_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  };
  pool = await sql.connect(config);
  return pool;
}
