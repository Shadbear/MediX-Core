const express = require('express');
const crypto = require('crypto');
const { db, nextSeq } = require('../db');
const { authenticate, authorize } = require('../auth');
const { validate, uuidParam, HttpError, rethrowConstraint, audit } = require('../util');
const { can } = require('../permissions');
const { enc, dec } = require('../crypto');
const schemas = require('../schemas');

const router = express.Router();
router.use(authenticate());

const parseList = (json) => { try { const v = JSON.parse(json || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

// Recepción (sin permiso clínico) NO recibe alergias, condiciones crónicas ni grupo sanguíneo.
function mapPatient(r, role) {
  const p = {
    id: r.Id, dni: r.Dni, medicalRecordNumber: r.MedicalRecordNumber, firstName: r.FirstName, lastName: r.LastName,
    birthDate: r.BirthDate, gender: r.Gender, phone: r.Phone, email: r.Email, address: r.Address, insuranceType: r.InsuranceType,
    emergencyContact: { name: r.EmergencyContactName, phone: r.EmergencyContactPhone, relationship: r.EmergencyContactRelationship },
    status: r.Status, createdAt: r.CreatedAt,
  };
  if (can(role, 'clinical:read')) {
    p.bloodType = r.BloodType;
    p.allergies = parseList(dec(r.Allergies));
    p.chronicConditions = parseList(dec(r.ChronicConditions));
  }
  return p;
}

const mapEntry = (r) => ({
  id: r.Id, date: r.EntryDate, doctorName: r.DoctorName, specialty: r.Specialty,
  symptoms: dec(r.Symptoms), diagnosis: dec(r.Diagnosis), cie10Code: r.Cie10Code, treatment: dec(r.Treatment), notes: dec(r.Notes),
  vitalSigns: { bloodPressure: r.BloodPressure, heartRate: r.HeartRate, respiratoryRate: r.RespiratoryRate, temperature: r.Temperature, oxygenSaturation: r.OxygenSaturation, weight: r.Weight, height: r.Height, painLevel: r.PainLevel },
});

router.get('/', authorize('patients:list'), (req, res) => {
  const rows = db.prepare('SELECT * FROM Patients WHERE IsDeleted = 0 ORDER BY CreatedAt DESC').all();
  audit(req, 'patient.list', { entityType: 'Patient', detail: `${rows.length} registros` });
  res.json(rows.map((r) => mapPatient(r, req.user.role)));
});

router.get('/:id', uuidParam('id'), authorize('patients:read'), (req, res) => {
  const r = db.prepare('SELECT * FROM Patients WHERE Id = ? AND IsDeleted = 0').get(req.params.id);
  if (!r) throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
  audit(req, 'patient.read', { entityType: 'Patient', entityId: req.params.id });
  res.json(mapPatient(r, req.user.role));
});

router.post('/', authorize('patients:create'), validate(schemas.createPatient), (req, res) => {
  const p = req.body;
  const dup = db.prepare('SELECT Id, IsDeleted FROM Patients WHERE Dni = ?').get(p.dni);
  if (dup) {
    throw new HttpError(409, dup.IsDeleted
      ? 'Existe un paciente con ese documento dado de baja. Pide a un administrador que lo restaure.'
      : 'Ya existe un paciente registrado con ese documento', 'DUPLICATE', dup.IsDeleted ? undefined : { existingId: dup.Id });
  }
  // Si quien registra no tiene permiso clínico, los datos clínicos se ignoran.
  const clinical = can(req.user.role, 'patients:update_clinical');
  const id = crypto.randomUUID();
  const create = db.transaction(() => {
    const mrn = `HC-${new Date().getFullYear()}-${String(nextSeq('mrn')).padStart(6, '0')}`;
    db.prepare(`INSERT INTO Patients (Id, Dni, MedicalRecordNumber, FirstName, LastName, BirthDate, Gender, Phone, Email, Address, InsuranceType,
        BloodType, Allergies, ChronicConditions, EmergencyContactName, EmergencyContactPhone, EmergencyContactRelationship)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, p.dni, mrn, p.firstName, p.lastName, p.birthDate, p.gender, p.phone, p.email || null, p.address, p.insuranceType,
      clinical ? p.bloodType || null : null, enc(JSON.stringify(clinical ? p.allergies : [])), enc(JSON.stringify(clinical ? p.chronicConditions : [])),
      p.emergencyContact?.name || null, p.emergencyContact?.phone || null, p.emergencyContact?.relationship || null
    );
  });
  try { create(); } catch (err) { rethrowConstraint(err, { 'Patients.Dni': 'Ya existe un paciente registrado con ese documento' }); }
  audit(req, 'patient.create', { entityType: 'Patient', entityId: id });
  res.status(201).json(mapPatient(db.prepare('SELECT * FROM Patients WHERE Id = ?').get(id), req.user.role));
});

// Campos editables y el permiso que exige cada uno.
const ec = (sub) => (b) => (b.emergencyContact && sub in b.emergencyContact ? b.emergencyContact[sub] || null : undefined);
const F = (col, perm, read, write = (v) => v) => ({ col, perm, read, write });
const UPDATABLE = [
  F('Phone', 'patients:update_contact', (b) => b.phone),
  F('Email', 'patients:update_contact', (b) => b.email, (v) => v || null),
  F('Address', 'patients:update_contact', (b) => b.address),
  F('InsuranceType', 'patients:update_contact', (b) => b.insuranceType),
  F('EmergencyContactName', 'patients:update_contact', ec('name')),
  F('EmergencyContactPhone', 'patients:update_contact', ec('phone')),
  F('EmergencyContactRelationship', 'patients:update_contact', ec('relationship')),
  F('Allergies', 'patients:update_clinical', (b) => b.allergies, (v) => enc(JSON.stringify(v))),
  F('ChronicConditions', 'patients:update_clinical', (b) => b.chronicConditions, (v) => enc(JSON.stringify(v))),
  F('BloodType', 'patients:update_clinical', (b) => b.bloodType, (v) => v || null),
  F('Status', 'patients:update_status', (b) => b.status),
  F('Dni', 'patients:update_identity', (b) => b.dni),
  F('FirstName', 'patients:update_identity', (b) => b.firstName),
  F('LastName', 'patients:update_identity', (b) => b.lastName),
  F('BirthDate', 'patients:update_identity', (b) => b.birthDate),
  F('Gender', 'patients:update_identity', (b) => b.gender),
];

// Solo se aplican los campos que el rol puede modificar; el resto se ignora (y queda en auditoría).
router.put('/:id', uuidParam('id'), authorize('patients:update_contact'), validate(schemas.updatePatient), (req, res) => {
  const sets = [], args = [], ignored = [];
  let provided = 0;
  for (const f of UPDATABLE) {
    const value = f.read(req.body);
    if (value === undefined) continue;
    provided++;
    if (!can(req.user.role, f.perm)) { ignored.push(f.col); continue; }
    sets.push(`${f.col} = ?`);
    args.push(f.write(value));
  }
  if (!provided) throw new HttpError(400, 'No se enviaron campos para actualizar', 'VALIDATION');
  if (!sets.length) throw new HttpError(403, 'No tienes permiso para modificar esos campos', 'FORBIDDEN');

  let changes;
  try { changes = db.prepare(`UPDATE Patients SET ${sets.join(', ')} WHERE Id = ? AND IsDeleted = 0`).run(...args, req.params.id).changes; }
  catch (err) { rethrowConstraint(err, {}, 'Ya existe otro paciente con ese documento'); }
  if (!changes) throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
  audit(req, 'patient.update', { entityType: 'Patient', entityId: req.params.id, detail: ignored.length ? `campos ignorados por permisos: ${ignored.join(',')}` : null });
  res.json(mapPatient(db.prepare('SELECT * FROM Patients WHERE Id = ?').get(req.params.id), req.user.role));
});

// Borrado LÓGICO, solo administrador.
router.delete('/:id', uuidParam('id'), authorize('patients:delete'), (req, res) => {
  const r = db.prepare(`UPDATE Patients SET IsDeleted = 1, DeletedAt = ?, DeletedBy = ?
    WHERE Id = ? AND IsDeleted = 0 AND NOT EXISTS (SELECT 1 FROM Beds WHERE PatientId = ?)`).run(new Date().toISOString(), req.user.username, req.params.id, req.params.id);
  if (!r.changes) {
    if (!db.prepare('SELECT 1 FROM Patients WHERE Id = ? AND IsDeleted = 0').get(req.params.id)) throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
    throw new HttpError(409, 'El paciente está hospitalizado: libera su cama antes de darlo de baja', 'CONFLICT');
  }
  audit(req, 'patient.delete', { entityType: 'Patient', entityId: req.params.id });
  res.status(204).send();
});

router.post('/:id/restore', uuidParam('id'), authorize('patients:restore'), (req, res) => {
  const r = db.prepare('UPDATE Patients SET IsDeleted = 0, DeletedAt = NULL, DeletedBy = NULL WHERE Id = ? AND IsDeleted = 1').run(req.params.id);
  if (!r.changes) throw new HttpError(404, 'No hay un paciente dado de baja con ese identificador', 'NOT_FOUND');
  audit(req, 'patient.restore', { entityType: 'Patient', entityId: req.params.id });
  res.status(204).send();
});

router.get('/:id/clinical-entries', uuidParam('id'), authorize('clinical:read'), (req, res) => {
  const rows = db.prepare(`SELECT e.* FROM ClinicalEntries e JOIN Patients p ON p.Id = e.PatientId AND p.IsDeleted = 0
    WHERE e.PatientId = ? ORDER BY e.EntryDate DESC`).all(req.params.id);
  audit(req, 'clinical.read', { entityType: 'Patient', entityId: req.params.id, detail: `${rows.length} entradas` });
  res.json(rows.map(mapEntry));
});

// El médico que firma sale de la sesión (no del cuerpo): nadie firma una entrada a nombre de otro.
router.post('/:id/clinical-entries', uuidParam('id'), authorize('clinical:create'), validate(schemas.clinicalEntry), (req, res) => {
  const e = req.body, v = e.vitalSigns || {};
  if (!db.prepare('SELECT 1 FROM Patients WHERE Id = ? AND IsDeleted = 0').get(req.params.id)) throw new HttpError(404, 'Paciente no encontrado', 'NOT_FOUND');
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO ClinicalEntries (Id, PatientId, DoctorId, DoctorName, Specialty, Symptoms, Diagnosis, Cie10Code, BloodPressure, HeartRate,
      RespiratoryRate, Temperature, OxygenSaturation, Weight, Height, PainLevel, Treatment, Notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, req.params.id, req.user.id, req.user.fullName, e.specialty, enc(e.symptoms), enc(e.diagnosis), e.cie10Code || null, v.bloodPressure || null,
    v.heartRate ?? null, v.respiratoryRate ?? null, v.temperature ?? null, v.oxygenSaturation ?? null, v.weight ?? null, v.height ?? null, v.painLevel ?? null,
    enc(e.treatment), e.notes ? enc(e.notes) : null
  );
  audit(req, 'clinical.create', { entityType: 'Patient', entityId: req.params.id });
  res.status(201).json(mapEntry(db.prepare('SELECT * FROM ClinicalEntries WHERE Id = ?').get(id)));
});

module.exports = router;
