const express = require('express');
const { sql, getPool } = require('../db/pool');

const router = express.Router();

function mapRow(row) {
  return {
    id: row.Id,
    code: row.Code,
    name: row.Name,
    category: row.Category,
    presentation: row.Presentation,
    currentStock: row.CurrentStock,
    minStock: row.MinStock,
    maxStock: row.MaxStock,
    unitCost: row.UnitCost,
    location: row.Location,
    expirationDate: row.ExpirationDate,
    batchNumber: row.BatchNumber,
    status: row.Status,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM StockItems ORDER BY Name');
    res.json(result.recordset.map(mapRow));
  } catch (err) {
    next(err);
  }
});

// POST /api/stock/:itemId/movements
// Registra el movimiento y actualiza el stock actual dentro de una transacción.
router.post('/:itemId/movements', async (req, res, next) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    const { type, quantity, destinationOrOrigin, responsible, reason } = req.body;
    await transaction.begin();

    const request = new sql.Request(transaction);
    const itemResult = await request
      .input('itemId', sql.UniqueIdentifier, req.params.itemId)
      .query('SELECT CurrentStock FROM StockItems WHERE Id = @itemId');

    if (itemResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Ítem de inventario no encontrado' });
    }

    const previousStock = itemResult.recordset[0].CurrentStock;
    const isEntry = String(type || '').startsWith('Entrada');
    const newStock = isEntry ? previousStock + Number(quantity) : previousStock - Number(quantity);

    const request2 = new sql.Request(transaction);
    await request2
      .input('itemId', sql.UniqueIdentifier, req.params.itemId)
      .input('type', sql.NVarChar, type)
      .input('quantity', sql.Int, quantity)
      .input('previousStock', sql.Int, previousStock)
      .input('newStock', sql.Int, newStock)
      .input('destinationOrOrigin', sql.NVarChar, destinationOrOrigin || null)
      .input('responsible', sql.NVarChar, responsible || null)
      .input('reason', sql.NVarChar, reason || null)
      .query(`
        INSERT INTO StockMovements (ItemId, MovementType, Quantity, PreviousStock, NewStock, DestinationOrOrigin, Responsible, Reason)
        VALUES (@itemId, @type, @quantity, @previousStock, @newStock, @destinationOrOrigin, @responsible, @reason)
      `);

    const request3 = new sql.Request(transaction);
    await request3
      .input('itemId', sql.UniqueIdentifier, req.params.itemId)
      .input('newStock', sql.Int, newStock)
      .query('UPDATE StockItems SET CurrentStock = @newStock WHERE Id = @itemId');

    await transaction.commit();
    res.status(201).json({ previousStock, newStock });
  } catch (err) {
    await transaction.rollback().catch(() => {});
    next(err);
  }
});

module.exports = router;
