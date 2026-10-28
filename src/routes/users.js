const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticate, authorize, revokeSessions } = require('../auth');
const { validate, uuidParam, HttpError, hashPassword, rethrowConstraint, audit } = require('../util');
const schemas = require('../schemas');

const router = express.Router();
router.use(authenticate());

const mapUser = (u) => ({
  id: u.Id, username: u.Username, fullName: u.FullName, role: u.Role, isActive: !!u.IsActive,
  mustChangePassword: !!u.MustChangePassword,
  lockedUntil: u.LockedUntil && Date.parse(u.LockedUntil) > Date.now() ? u.LockedUntil : null,
  lastLoginAt: u.LastLoginAt,
});
const byId = (id) => db.prepare('SELECT * FROM Users WHERE Id = ?').get(id);
const activeAdmins = () => db.prepare("SELECT COUNT(*) AS n FROM Users WHERE Role = 'admin' AND IsActive = 1").get().n;

router.get('/', authorize('users:manage'), (req, res) => {
  res.json(db.prepare('SELECT * FROM Users ORDER BY Username').all().map(mapUser));
});

router.post('/', authorize('users:manage'), validate(schemas.createUser), async (req, res) => {
  const { username, fullName, role, password } = req.body;
  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  try {
    db.prepare('INSERT INTO Users (Id, Username, FullName, PasswordHash, Role, MustChangePassword) VALUES (?,?,?,?,?,1)').run(id, username, fullName, hash, role);
  } catch (err) { rethrowConstraint(err, {}, 'Ya existe un usuario con ese nombre'); }
  audit(req, 'user.create', { entityType: 'User', entityId: id, detail: `${username} (${role})` });
  res.status(201).json(mapUser(byId(id)));
});

router.patch('/:id', uuidParam('id'), authorize('users:manage'), validate(schemas.updateUser), (req, res) => {
  const target = byId(req.params.id);
  if (!target) throw new HttpError(404, 'Usuario no encontrado', 'NOT_FOUND');
  const { fullName, role, isActive } = req.body;

  const losesAdmin = target.Role === 'admin' && target.IsActive && ((role && role !== 'admin') || isActive === false);
  if (losesAdmin && (req.params.id === req.user.id || activeAdmins() <= 1)) {
    throw new HttpError(409, 'No puedes quitarte el acceso de administrador ni dejar el sistema sin administradores', 'CONFLICT');
  }
  db.prepare('UPDATE Users SET FullName = ?, Role = ?, IsActive = ? WHERE Id = ?').run(
    fullName ?? target.FullName, role ?? target.Role, isActive === undefined ? target.IsActive : isActive ? 1 : 0, target.Id
  );
  // Cambiar rol o desactivar cierra sus sesiones al instante.
  if ((role && role !== target.Role) || isActive === false) revokeSessions(target.Id);
  audit(req, 'user.update', { entityType: 'User', entityId: target.Id, detail: JSON.stringify(req.body) });
  res.json(mapUser(byId(target.Id)));
});

router.post('/:id/reset-password', uuidParam('id'), authorize('users:manage'), validate(schemas.resetPassword), async (req, res) => {
  const target = byId(req.params.id);
  if (!target) throw new HttpError(404, 'Usuario no encontrado', 'NOT_FOUND');
  db.prepare('UPDATE Users SET PasswordHash = ?, MustChangePassword = 1, FailedAttempts = 0, LockedUntil = NULL WHERE Id = ?').run(await hashPassword(req.body.password), target.Id);
  revokeSessions(target.Id);
  audit(req, 'user.reset_password', { entityType: 'User', entityId: target.Id });
  res.status(204).send();
});

module.exports = router;
