const express = require('express');
const { sql, getPool } = require('../db/pool');

const router = express.Router();

function mapRow(row) {
  return {
    id: row.Id,
    bedNumber: row.BedNumber,
    ward: row.Ward,
    floor: row.Floor,
    type: row.BedType,
    status: row.Status,
    patientId: row.PatientId,
    admissionDate: row.AdmissionDate,
    doctorInCharge: row.DoctorInCharge,
    diagnosis: row.Diagnosis,
    notes: row.Notes,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM HospitalBeds ORDER BY Ward, BedNumber');
    res.json(result.recordset.map(mapRow));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/assign', async (req, res, next) => {
  try {
    const { patientId, doctorInCharge, diagnosis, notes } = req.body;
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('patientId', sql.UniqueIdentifier, patientId)
      .input('doctorInCharge', sql.NVarChar, doctorInCharge || null)
      .input('diagnosis', sql.NVarChar, diagnosis || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        UPDATE HospitalBeds SET
          Status = 'Ocupada', PatientId = @patientId, AdmissionDate = SYSUTCDATETIME(),
          DoctorInCharge = @doctorInCharge, Diagnosis = @diagnosis, Notes = @notes
        WHERE Id = @id
      `);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/release', async (req, res, next) => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`
        UPDATE HospitalBeds SET
          Status = 'En Limpieza', PatientId = NULL, AdmissionDate = NULL,
          DoctorInCharge = NULL, Diagnosis = NULL, Notes = NULL
        WHERE Id = @id
      `);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
