// Sesiones en servidor + cookie HttpOnly. Sin JWT: se pueden revocar al instante.
const crypto = require('crypto');
const { db } = require('./db');
const { SESSION_HOURS, IDLE_MINUTES, isProd } = require('./config');
const { PERMISSIONS, can } = require('./permissions');
const { HttpError, audit } = require('./util');

const COOKIE = isProd ? '__Host-mx_sid' : 'mx_sid'; // __Host-: solo HTTPS, sin Domain, path=/
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const iso = (ms) => new Date(ms).toISOString();

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('INSERT INTO Sessions (Id, UserId, ExpiresAt, LastSeenAt, Ip) VALUES (?,?,?,?,?)').run(sha(token), userId, iso(now + SESSION_HOURS * 3600e3), iso(now), req.ip || null);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: isProd, path: '/', maxAge: SESSION_HOURS * 3600e3 });
}

const clearCookie = (res) => res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: isProd, path: '/' });
const revokeSessions = (userId) => db.prepare('DELETE FROM Sessions WHERE UserId = ?').run(userId);
const purgeExpiredSessions = () => db.prepare('DELETE FROM Sessions WHERE ExpiresAt < ?').run(iso(Date.now()));

/**
 * Exige sesión válida y revalida al usuario en la base en cada petición:
 * desactivar una cuenta, cambiar su rol o su contraseña surte efecto de inmediato.
 * Con MustChangePassword solo se permiten rutas con { allowPasswordChange: true }.
 */
const authenticate = ({ allowPasswordChange = false } = {}) => (req, res, next) => {
  const token = readCookie(req, COOKIE);
  if (!token) return next(new HttpError(401, 'Autenticación requerida', 'NO_SESSION'));

  const s = db.prepare(`
    SELECT s.Id AS Sid, s.ExpiresAt, s.LastSeenAt, u.Id, u.Username, u.FullName, u.Role, u.IsActive, u.MustChangePassword
    FROM Sessions s JOIN Users u ON u.Id = s.UserId WHERE s.Id = ?`).get(sha(token));
  const now = Date.now();
  if (!s || !s.IsActive || Date.parse(s.ExpiresAt) < now || Date.parse(s.LastSeenAt) + IDLE_MINUTES * 60e3 < now) {
    if (s) db.prepare('DELETE FROM Sessions WHERE Id = ?').run(s.Sid);
    clearCookie(res);
    return next(new HttpError(401, 'Tu sesión terminó. Inicia sesión de nuevo.', 'SESSION_ENDED'));
  }
  if (now - Date.parse(s.LastSeenAt) > 30e3) db.prepare('UPDATE Sessions SET LastSeenAt = ? WHERE Id = ?').run(iso(now), s.Sid);
  if (s.MustChangePassword && !allowPasswordChange) return next(new HttpError(403, 'Debes cambiar tu contraseña antes de continuar', 'PASSWORD_CHANGE_REQUIRED'));

  req.sessionId = s.Sid;
  req.user = { id: s.Id, username: s.Username, fullName: s.FullName, role: s.Role, mustChangePassword: !!s.MustChangePassword };
  next();
};

/** authorize('patients:delete') -> 403 si el rol no tiene ese permiso. Un permiso mal escrito falla al arrancar. */
function authorize(permission) {
  if (!PERMISSIONS[permission]) throw new Error(`Permiso desconocido en authorize(): ${permission}`);
  return (req, res, next) => {
    if (!req.user || !can(req.user.role, permission)) {
      audit(req, 'authz.denied', { success: false, detail: `${permission} ${req.method} ${req.originalUrl}` });
      return next(new HttpError(403, 'No tienes permiso para realizar esta acción', 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { authenticate, authorize, createSession, clearCookie, revokeSessions, purgeExpiredSessions, readCookie, COOKIE };
