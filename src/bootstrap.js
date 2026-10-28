const crypto = require('crypto');
const { db } = require('./db');
const { hashPassword, randomPassword } = require('./util');

/** Primer arranque: crea el administrador con una contraseña aleatoria (se muestra una sola vez). */
async function bootstrapAdmin() {
  if (db.prepare('SELECT COUNT(*) AS n FROM Users').get().n > 0) return null;
  const password = randomPassword();
  db.prepare("INSERT INTO Users (Id, Username, FullName, PasswordHash, Role, MustChangePassword) VALUES (?, 'admin', 'Administrador', ?, 'admin', 1)")
    .run(crypto.randomUUID(), await hashPassword(password));
  return password;
}

module.exports = { bootstrapAdmin };
