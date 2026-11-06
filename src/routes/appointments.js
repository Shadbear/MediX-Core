const express = require('express');
const crypto = require('crypto');
const { db, nextSeq } = require('../db');
const { authenticate, authorize } = require('../auth');
const { validate, uuidParam, HttpError, rethrowConstraint, audit } = require('../util');
const schemas = require('../schemas');

const router = express.Router();
router.use(authenticate());

const SELECT = `SELECT a.*, p.FirstName || ' ' || p.LastName AS PatientName, u.FullName AS DoctorName
  FROM Appointments a JOIN Patients p ON p.Id = a.PatientId LEFT JOIN Users u ON u.Id = a.DoctorId`;
const mapRow = (r) => ({
  id: r.Id, ticketNumber: r.TicketNumber, patientId: r.PatientId, patientName: r.PatientName, doctorId: r.DoctorId, doctorName: r.DoctorName,
  specialty: r.Specialty, consultingRoom: r.ConsultingRoom, date: r.AppointmentDate, time: r.AppointmentTime, type: r.AppointmentType,
  status: r.Status, reason: r.Reason, notes: r.Notes,
});
const SLOTS = {
  'Appointments.DoctorId': 'El médico ya tiene una cita en ese horario',
  'Appointments.PatientId': 'El paciente ya tiene una cita en ese horario',
};

router.get('/', authorize('appointments:read'), (req, res) => {
  res.json(db.prepare(`${SELECT} WHERE p.IsDeleted = 0 ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC LIMIT 500`).all().map(mapRow));
});

// Médicos activos, para el selector del formulario de citas.
router.get('/doctors', authorize('appointments:create'), (req, res) => {
  res.json(db.prepare("SELECT Id AS id, FullName AS fullName FROM Users WHERE Role = 'medico' AND IsActive = 1 ORDER BY FullName").all());
});

router.post('/', authorize('appointments:create'), validate(schemas.createAppointment), (req, res) => {
  const a = req.body;
  if (!db.prepare('SELECT 1 FROM Patients WHERE Id = ? AND IsDeleted = 0').get(a.patientId)) throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
  if (a.doctorId && !db.prepare("SELECT 1 FROM Users WHERE Id = ? AND Role = 'medico' AND IsActive = 1").get(a.doctorId)) throw new HttpError(400, 'El médico indicado no existe', 'INVALID_REFERENCE');
  const id = crypto.randomUUID();
  try {
    db.transaction(() => {
      const ticket = `T-${String(nextSeq('ticket')).padStart(6, '0')}`;
      db.prepare(`INSERT INTO Appointments (Id, TicketNumber, PatientId, DoctorId, Specialty, ConsultingRoom, AppointmentDate, AppointmentTime, AppointmentType, Reason, Notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, ticket, a.patientId, a.doctorId || null, a.specialty, a.consultingRoom || null, a.date, a.time, a.type, a.reason || null, a.notes || null);
    })();
  } catch (err) { rethrowConstraint(err, SLOTS); }
  audit(req, 'appointment.create', { entityType: 'Appointment', entityId: id });
  res.status(201).json(mapRow(db.prepare(`${SELECT} WHERE a.Id = ?`).get(id)));
});

router.patch('/:id/status', uuidParam('id'), authorize('appointments:update_status'), validate(schemas.appointmentStatus), (req, res) => {
  let changes;
  try { changes = db.prepare('UPDATE Appointments SET Status = ? WHERE Id = ?').run(req.body.status, req.params.id).changes; }
  catch (err) { rethrowConstraint(err, SLOTS); }
  if (!changes) throw new HttpError(404, 'Cita no encontrada', 'NOT_FOUND');
  audit(req, 'appointment.status', { entityType: 'Appointment', entityId: req.params.id, detail: req.body.status });
  res.status(204).send();
});

module.exports = router;
