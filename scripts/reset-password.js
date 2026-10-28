// Uso: npm run reset-password -- <usuario>
// Genera una contraseña temporal nueva (la muestra una vez) y cierra las sesiones de ese usuario.
require('../src/config');
const { db } = require('../src/db');
const { hashPassword, randomPassword } = require('../src/util');

(async () => {
  const username = (process.argv[2] || 'admin').toLowerCase();
  const u = db.prepare('SELECT Id FROM Users WHERE Username = ?').get(username);
  if (!u) { console.error(`No existe el usuario "${username}".`); process.exit(1); }
  const password = randomPassword();
  db.prepare('UPDATE Users SET PasswordHash = ?, MustChangePassword = 1, FailedAttempts = 0, LockedUntil = NULL, IsActive = 1 WHERE Id = ?').run(await hashPassword(password), u.Id);
  db.prepare('DELETE FROM Sessions WHERE UserId = ?').run(u.Id);
  db.prepare("INSERT INTO AuditLog (Username, Action, Detail) VALUES (?, 'user.reset_password', 'desde consola del servidor')").run(username);
  console.log(`\nContraseña temporal para "${username}": ${password}\n(deberá cambiarla al ingresar)\n`);
})();
