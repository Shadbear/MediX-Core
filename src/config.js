// Carga .env y garantiza que exista DATA_KEY (clave de cifrado de datos clínicos).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

if (!/^[0-9a-f]{64}$/i.test(process.env.DATA_KEY || '')) {
  const key = crypto.randomBytes(32).toString('hex');
  process.env.DATA_KEY = key;
  if (process.env.NODE_ENV !== 'test') {
    fs.appendFileSync(envPath, `DATA_KEY=${key}\n`, { mode: 0o600 });
    try { fs.chmodSync(envPath, 0o600); } catch { /* Windows */ }
    console.log('[CONFIG] Se generó DATA_KEY en .env. GUARDA UNA COPIA: sin ella los datos clínicos no se pueden leer.');
  }
}

module.exports = {
  isProd: process.env.NODE_ENV === 'production',
  MAX_FAILED: Number(process.env.MAX_FAILED_ATTEMPTS) || 5,
  LOCK_MINUTES: Number(process.env.LOCK_MINUTES) || 15,
  SESSION_HOURS: 8,
  IDLE_MINUTES: 15,
};
