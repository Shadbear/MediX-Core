const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { db } = require('./db');

// ---- Errores ---------------------------------------------------------------
/** Error "esperado": su mensaje SÍ es seguro mostrarlo al cliente. */
class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true;
  }
}

/** Convierte violaciones de restricciones SQLite en errores 409/400 con mensaje claro. */
function rethrowConstraint(err, messages = {}, fallback = 'Ya existe un registro con esos datos') {
  const code = err && typeof err.code === 'string' ? err.code : '';
  if (code.startsWith('SQLITE_CONSTRAINT_UNIQUE') || code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    for (const [fragment, text] of Object.entries(messages)) if (err.message.includes(fragment)) throw new HttpError(409, text, 'DUPLICATE');
    throw new HttpError(409, fallback, 'DUPLICATE');
  }
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') throw new HttpError(400, 'Uno de los datos referenciados no existe', 'INVALID_REFERENCE');
  if (code === 'SQLITE_CONSTRAINT_CHECK') throw new HttpError(409, 'La operación viola una regla de integridad', 'CONFLICT');
  throw err;
}

// ---- Validación --------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** validate(schema) valida y REEMPLAZA req.body con los datos limpios (campos extra descartados). */
const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, 'Datos inválidos', 'VALIDATION', details));
  }
  req.body = parsed.data;
  next();
};

/** uuidParam('id') -> 400 si el parámetro de ruta no es un UUID. */
const uuidParam = (...names) => (req, res, next) => {
  for (const n of names) if (!UUID_RE.test(String(req.params[n]))) return next(new HttpError(400, `Identificador inválido: ${n}`, 'VALIDATION'));
  next();
};

// ---- Contraseñas -------------------------------------------------------------
const BCRYPT_ROUNDS = 12;
// bcrypt solo usa los primeros 72 bytes: por eso el máximo es 72.
const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
// Hash de relleno: el login tarda lo mismo exista o no el usuario (evita enumerar usuarios).
const DUMMY_HASH = bcrypt.hashSync('relleno-tiempo-constante-0', BCRYPT_ROUNDS);

/** Contraseña temporal aleatoria (siempre cumple la política). */
function randomPassword() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const pick = (set, n) => Array.from({ length: n }, () => set[crypto.randomInt(set.length)]).join('');
  return pick(abc + '23456789', 14) + pick('23456789', 1) + pick(abc, 1);
}

// ---- Auditoría ---------------------------------------------------------------
const insAudit = db.prepare(
  'INSERT INTO AuditLog (UserId, Username, Role, Action, EntityType, EntityId, Ip, Success, Detail) VALUES (?,?,?,?,?,?,?,?,?)'
);
/** audit(req, 'patient.read', { entityType, entityId, detail, success }). Nunca rompe la petición. */
function audit(req, action, o = {}) {
  try {
    const u = (req && req.user) || {};
    insAudit.run(
      u.id || null, u.username || o.username || null, u.role || null, action,
      o.entityType || null, o.entityId ? String(o.entityId) : null, (req && req.ip) || null,
      o.success === false ? 0 : 1, o.detail ? String(o.detail).slice(0, 500) : null
    );
  } catch (err) {
    console.error('[AUDIT] No se pudo registrar', action, '-', err.message);
  }
}

module.exports = { HttpError, rethrowConstraint, validate, uuidParam, UUID_RE, passwordSchema, hashPassword, verifyPassword, DUMMY_HASH, randomPassword, audit };
