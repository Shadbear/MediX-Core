const express = require('express');
const { db } = require('../db');
const { authenticate, createSession, clearCookie, revokeSessions } = require('../auth');
const { validate, HttpError, hashPassword, verifyPassword, DUMMY_HASH, audit } = require('../util');
const { permissionsFor } = require('../permissions');
const { MAX_FAILED, LOCK_MINUTES } = require('../config');
const schemas = require('../schemas');

const router = express.Router();
const GENERIC = 'Usuario o contraseña incorrectos';

const publicUser = (u) => ({ id: u.id, username: u.username, fullName: u.fullName, role: u.role, mustChangePassword: !!u.mustChangePassword, permissions: permissionsFor(u.role) });

function registerFailure(userId) {
  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60e3).toISOString();
  db.prepare(`UPDATE Users SET
      LockedUntil = CASE WHEN FailedAttempts + 1 >= ? THEN ? ELSE LockedUntil END,
      FailedAttempts = CASE WHEN FailedAttempts + 1 >= ? THEN 0 ELSE FailedAttempts + 1 END
    WHERE Id = ?`).run(MAX_FAILED, lockUntil, MAX_FAILED, userId);
}

// POST /api/auth/login (público; limitado por IP en server.js)
router.post('/login', validate(schemas.login), async (req, res) => {
  const { username, password } = req.body;
  const u = db.prepare('SELECT * FROM Users WHERE Username = ?').get(username);

  if (!u) {
    await verifyPassword(password, DUMMY_HASH); // mismo tiempo de respuesta que un usuario real
    audit(req, 'auth.login.fail', { username, success: false, detail: 'usuario inexistente' });
    throw new HttpError(401, GENERIC, 'BAD_CREDENTIALS');
  }
  if (u.LockedUntil && Date.parse(u.LockedUntil) > Date.now()) {
    audit(req, 'auth.login.locked', { username, success: false });
    throw new HttpError(423, 'Cuenta bloqueada temporalmente por intentos fallidos. Espera unos minutos o pide ayuda al administrador.', 'LOCKED');
  }
  const ok = await verifyPassword(password, u.PasswordHash);
  if (!ok || !u.IsActive) {
    if (!ok) registerFailure(u.Id);
    audit(req, 'auth.login.fail', { username, success: false, detail: !u.IsActive ? 'cuenta inactiva' : 'contraseña incorrecta' });
    throw new HttpError(401, GENERIC, 'BAD_CREDENTIALS');
  }

  db.prepare('UPDATE Users SET FailedAttempts = 0, LockedUntil = NULL, LastLoginAt = ? WHERE Id = ?').run(new Date().toISOString(), u.Id);
  const user = { id: u.Id, username: u.Username, fullName: u.FullName, role: u.Role, mustChangePassword: u.MustChangePassword };
  req.user = user;
  createSession(req, res, u.Id);
  audit(req, 'auth.login.success');
  res.json({ user: publicUser(user) });
});

router.get('/me', authenticate({ allowPasswordChange: true }), (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/logout', authenticate({ allowPasswordChange: true }), (req, res) => {
  db.prepare('DELETE FROM Sessions WHERE Id = ?').run(req.sessionId);
  clearCookie(res);
  audit(req, 'auth.logout');
  res.status(204).send();
});

// Cambia la contraseña, cierra TODAS las sesiones anteriores y abre una nueva.
router.post('/change-password', authenticate({ allowPasswordChange: true }), validate(schemas.changePassword), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const row = db.prepare('SELECT PasswordHash FROM Users WHERE Id = ?').get(req.user.id);

  if (!(await verifyPassword(currentPassword, row.PasswordHash))) {
    registerFailure(req.user.id);
    audit(req, 'auth.password.change', { success: false, detail: 'contraseña actual incorrecta' });
    throw new HttpError(400, 'La contraseña actual no es correcta', 'BAD_CURRENT_PASSWORD');
  }
  if (newPassword === currentPassword) throw new HttpError(400, 'La nueva contraseña debe ser distinta a la actual', 'VALIDATION');
  if (newPassword.toLowerCase().includes(req.user.username)) throw new HttpError(400, 'La contraseña no puede contener tu nombre de usuario', 'VALIDATION');

  db.prepare('UPDATE Users SET PasswordHash = ?, MustChangePassword = 0, FailedAttempts = 0, LockedUntil = NULL WHERE Id = ?').run(await hashPassword(newPassword), req.user.id);
  revokeSessions(req.user.id);
  createSession(req, res, req.user.id);
  audit(req, 'auth.password.change');
  res.json({ user: publicUser({ ...req.user, mustChangePassword: false }) });
});

module.exports = router;
