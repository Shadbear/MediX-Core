const express = require('express');
const { sql, getPool } = require('../db/pool');

const router = express.Router();

function mapRow(row) {
  return {
    id: row.Id,
    ticketNumber: row.TicketNumber,
    patientId: row.PatientId,
    doctorId: row.DoctorId,
    specialty: row.Specialty,
    consultingRoom: row.ConsultingRoom,
    date: row.AppointmentDate,
    time: row.AppointmentTime,
    type: row.AppointmentType,
    status: row.Status,
    reason: row.Reason,
    notes: row.Notes,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT * FROM Appointments ORDER BY AppointmentDate DESC, AppointmentTime DESC
    `);
    res.json(result.recordset.map(mapRow));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const a = req.body;
    const pool = await getPool();
    const ticketNumber = `T-${Date.now().toString().slice(-6)}`;
    const result = await pool
      .request()
      .input('ticketNumber', sql.NVarChar, ticketNumber)
      .input('patientId', sql.UniqueIdentifier, a.patientId)
      .input('doctorId', sql.UniqueIdentifier, a.doctorId || null)
      .input('specialty', sql.NVarChar, a.specialty)
      .input('consultingRoom', sql.NVarChar, a.consultingRoom || null)
      .input('date', sql.Date, a.date)
      .input('time', sql.VarChar, a.time)
      .input('type', sql.NVarChar, a.type)
      .input('reason', sql.NVarChar, a.reason || null)
      .input('notes', sql.NVarChar, a.notes || null)
      .query(`
        INSERT INTO Appointments (
          TicketNumber, PatientId, DoctorId, Specialty, ConsultingRoom,
          AppointmentDate, AppointmentTime, AppointmentType, Reason, Notes
        )
        OUTPUT inserted.*
        VALUES (
          @ticketNumber, @patientId, @doctorId, @specialty, @consultingRoom,
          @date, @time, @type, @reason, @notes
        )
      `);
    res.status(201).json(mapRow(result.recordset[0]));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('status', sql.NVarChar, req.body.status)
      .query('UPDATE Appointments SET Status = @status WHERE Id = @id');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
