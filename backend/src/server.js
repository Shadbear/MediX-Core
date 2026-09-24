require('dotenv').config();
const express = require('express');
const cors = require('cors');

const patientsRouter = require('./routes/patients');
const appointmentsRouter = require('./routes/appointments');
const stockRouter = require('./routes/stock');
const bedsRouter = require('./routes/beds');
const { getPool } = require('./db/pool');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Health check: usado por ServerConfigService.testConnection() en el frontend.
// Responde 200 aunque la base de datos no esté lista todavía, pero indica su estado.
app.get('/api/health', async (req, res) => {
  try {
    await getPool();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', database: 'disconnected', detail: err.message });
  }
});

app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/beds', bedsRouter);

// Manejador de errores centralizado: convierte errores de conexión a SQL Server
// en respuestas claras en vez de un 500 genérico.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[MediX-Core API] Escuchando en http://localhost:${PORT}`);
});
