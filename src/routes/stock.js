const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticate, authorize } = require('../auth');
const { validate, uuidParam, HttpError, rethrowConstraint, audit } = require('../util');
const schemas = require('../schemas');

const router = express.Router();
router.use(authenticate());

const status = (r) => (r.CurrentStock === 0 ? 'Agotado' : r.CurrentStock <= r.MinStock ? 'Stock Bajo' : 'Disponible');
const mapRow = (r) => ({
  id: r.Id, code: r.Code, name: r.Name, category: r.Category, presentation: r.Presentation, currentStock: r.CurrentStock, minStock: r.MinStock,
  unitCost: r.UnitCost, location: r.Location, expirationDate: r.ExpirationDate, batchNumber: r.BatchNumber, status: status(r),
});

router.get('/', authorize('stock:read'), (req, res) => res.json(db.prepare('SELECT * FROM StockItems ORDER BY Name').all().map(mapRow)));

router.post('/', authorize('stock:manage'), validate(schemas.createStockItem), (req, res) => {
  const i = req.body;
  const id = crypto.randomUUID();
  try {
    db.prepare('INSERT INTO StockItems (Id, Code, Name, Category, Presentation, CurrentStock, MinStock, UnitCost, Location, ExpirationDate, BatchNumber) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, i.code, i.name, i.category, i.presentation || null, i.currentStock, i.minStock, i.unitCost ?? null, i.location || null, i.expirationDate || null, i.batchNumber || null);
  } catch (err) { rethrowConstraint(err, {}, 'Ya existe un ítem con ese código'); }
  audit(req, 'stock.create', { entityType: 'StockItem', entityId: id, detail: i.code });
  res.status(201).json(mapRow(db.prepare('SELECT * FROM StockItems WHERE Id = ?').get(id)));
});

// Movimiento atómico: nunca deja el stock en negativo (las escrituras de SQLite se serializan).
router.post('/:itemId/movements', uuidParam('itemId'), authorize('stock:move'), validate(schemas.stockMovement), (req, res) => {
  const { type, quantity, destinationOrOrigin, reason } = req.body;
  const move = db.transaction(() => {
    const item = db.prepare('SELECT CurrentStock FROM StockItems WHERE Id = ?').get(req.params.itemId);
    if (!item) throw new HttpError(404, 'Ítem de inventario no encontrado', 'NOT_FOUND');
    const prev = item.CurrentStock;
    const next = type.startsWith('Entrada') ? prev + quantity : prev - quantity; // "Ajuste" resta
    if (next < 0) throw new HttpError(409, `Stock insuficiente: hay ${prev} disponibles`, 'INSUFFICIENT_STOCK');
    db.prepare('INSERT INTO StockMovements (Id, ItemId, MovementType, Quantity, PreviousStock, NewStock, DestinationOrOrigin, Responsible, Reason) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), req.params.itemId, type, quantity, prev, next, destinationOrOrigin || null, req.user.fullName, reason || null);
    db.prepare('UPDATE StockItems SET CurrentStock = ? WHERE Id = ?').run(next, req.params.itemId);
    return { previousStock: prev, newStock: next };
  });
  const result = move.immediate();
  audit(req, 'stock.move', { entityType: 'StockItem', entityId: req.params.itemId, detail: `${type} x${quantity} (${result.previousStock}->${result.newStock})` });
  res.status(201).json(result);
});

module.exports = router;
