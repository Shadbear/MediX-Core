const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../auth');
const { validate, uuidParam, HttpError, rethrowConstraint, audit } = require('../util');
const { can } = require('../permissions');
const { enc, dec } = require('../crypto');
const schemas = require('../schemas');

const router = express.Router();
router.use(authenticate());

function mapRow(r, role) {
  const bed = { id: r.Id, bedNumber: r.BedNumber, ward: r.Ward, floor: r.Floor, type: r.BedType, status: r.Status, patientId: r.PatientId, patientName: r.PatientName || null, admissionDate: r.AdmissionDate };
  if (can(role, 'clinical:read')) { bed.doctorInCharge = r.DoctorInCharge; bed.diagnosis = dec(r.Diagnosis); bed.notes = dec(r.Notes); }
  return bed;
}

router.get('/', authorize('beds:read'), (req, res) => {
  const rows = db.prepare(`SELECT b.*, p.FirstName || ' ' || p.LastName AS PatientName FROM Beds b LEFT JOIN Patients p ON p.Id = b.PatientId ORDER BY b.Ward, b.BedNumber`).all();
  res.json(rows.map((r) => mapRow(r, req.user.role)));
});

router.post('/:id/assign', uuidParam('id'), authorize('beds:manage'), validate(schemas.assignBed), (req, res) => {
  const { patientId, doctorInCharge, diagnosis, notes } = req.body;
  let changes;
  try {
    changes = db.prepare(`UPDATE Beds SET Status = 'Ocupada', PatientId = ?, AdmissionDate = ?, DoctorInCharge = ?, Diagnosis = ?, Notes = ?
      WHERE Id = ? AND Status = 'Libre' AND EXISTS (SELECT 1 FROM Patients WHERE Id = ? AND IsDeleted = 0)`)
      .run(patientId, new Date().toISOString(), doctorInCharge || null, diagnosis ? enc(diagnosis) : null, notes ? enc(notes) : null, req.params.id, patientId).changes;
  } catch (err) { rethrowConstraint(err, { 'Beds.PatientId': 'El paciente ya ocupa otra cama' }); }
  if (!changes) {
    const bed = db.prepare('SELECT Status FROM Beds WHERE Id = ?').get(req.params.id);
    if (!bed) throw new HttpError(404, 'Cama no encontrada', 'NOT_FOUND');
    if (bed.Status !== 'Libre') throw new HttpError(409, `La cama no está libre (estado: ${bed.Status})`, 'CONFLICT');
    throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
  }
  db.prepare("UPDATE Patients SET Status = 'Hospitalizado' WHERE Id = ? AND Status <> 'Hospitalizado'").run(patientId);
  audit(req, 'bed.assign', { entityType: 'Bed', entityId: req.params.id, detail: `paciente ${patientId}` });
  res.status(204).send();
});

router.post('/:id/release', uuidParam('id'), authorize('beds:manage'), (req, res) => {
  const bed = db.prepare('SELECT Status, PatientId FROM Beds WHERE Id = ?').get(req.params.id);
  if (!bed) throw new HttpError(404, 'Cama no encontrada', 'NOT_FOUND');
  if (bed.Status !== 'Ocupada') throw new HttpError(409, `La cama no está ocupada (estado: ${bed.Status})`, 'CONFLICT');
  db.prepare("UPDATE Beds SET Status = 'En Limpieza', PatientId = NULL, AdmissionDate = NULL, DoctorInCharge = NULL, Diagnosis = NULL, Notes = NULL WHERE Id = ?").run(req.params.id);
  db.prepare("UPDATE Patients SET Status = 'De Alta' WHERE Id = ? AND Status = 'Hospitalizado'").run(bed.PatientId);
  audit(req, 'bed.release', { entityType: 'Bed', entityId: req.params.id });
  res.status(204).send();
});

// Limpieza terminada: la cama vuelve a estar libre.
router.post('/:id/ready', uuidParam('id'), authorize('beds:manage'), (req, res) => {
  const r = db.prepare("UPDATE Beds SET Status = 'Libre' WHERE Id = ? AND Status IN ('En Limpieza','Mantenimiento')").run(req.params.id);
  if (!r.changes) throw new HttpError(409, 'La cama no está en limpieza ni en mantenimiento', 'CONFLICT');
  audit(req, 'bed.ready', { entityType: 'Bed', entityId: req.params.id });
  res.status(204).send();
});

module.exports = router;
