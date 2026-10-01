const express = require('express');
const fs = require('fs');
const path = require('path');
const { db, DATA_DIR } = require('../db');
const { authenticate, authorize } = require('../auth');
const { audit } = require('../util');

const router = express.Router();
router.use(authenticate());
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Copia consistente de la base (segura aunque haya usuarios conectados). Guarda las últimas 14.
router.post('/backup', authorize('system:backup'), async (req, res) => {
  fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  const name = `medix-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  await db.backup(path.join(BACKUP_DIR, name));
  try { fs.chmodSync(path.join(BACKUP_DIR, name), 0o600); } catch { /* Windows */ }
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db')).sort();
  for (const old of files.slice(0, -14)) fs.unlinkSync(path.join(BACKUP_DIR, old));
  audit(req, 'system.backup', { detail: name });
  res.status(201).json({ file: name, folder: 'data/backups' });
});

module.exports = router;
