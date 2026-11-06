const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../auth');
const { audit } = require('../util');

const router = express.Router();
router.use(authenticate());

// GET /api/audit?limit=&offset=&action=&username=&success=
router.get('/', authorize('audit:read'), (req, res) => {
  const q = req.query;
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(q.offset, 10) || 0, 0);
  const where = [];
  const args = [];
  if (typeof q.action === 'string' && q.action) { where.push('Action LIKE ?'); args.push(`${q.action.slice(0, 60)}%`); }
  if (typeof q.username === 'string' && q.username) { where.push('Username = ?'); args.push(q.username.slice(0, 50)); }
  if (q.success === 'true' || q.success === 'false') { where.push('Success = ?'); args.push(q.success === 'true' ? 1 : 0); }
  const rows = db.prepare(`SELECT * FROM AuditLog ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY Id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
  audit(req, 'audit.read');
  res.json(rows.map((r) => ({ ...r, Success: !!r.Success })));
});

module.exports = router;
