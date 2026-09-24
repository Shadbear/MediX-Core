const sql = require('mssql');

/**
 * Pool de conexión único hacia SQL Server.
 *
 * Importante: como todavía no existe la base de datos, este módulo NO revienta
 * el proceso si la conexión falla al arrancar. En cambio, expone
 * getPool() que cualquier ruta puede usar; si la conexión no está lista,
 * lanza un error controlado que las rutas convierten en un 503 legible.
 */

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'MediXCore',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

function connect() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log(`[DB] Conectado a SQL Server (${config.server}:${config.port}/${config.database})`);
        return pool;
      })
      .catch((err) => {
        console.error('[DB] No se pudo conectar a SQL Server todavía:', err.message);
        // Reseteamos para que el próximo intento vuelva a intentar conectar
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

async function getPool() {
  try {
    return await connect();
  } catch (err) {
    const dbError = new Error(
      'La base de datos SQL Server no está disponible todavía. Configura backend/.env con tus credenciales reales.'
    );
    dbError.status = 503;
    dbError.cause = err;
    throw dbError;
  }
}

module.exports = { sql, getPool };
