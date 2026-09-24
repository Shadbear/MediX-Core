const express = require('express');
const { sql, getPool } = require('../db/pool');

const router = express.Router();

function mapPatientRow(row) {
  return {
    id: row.Id,
    dni: row.Dni,
    medicalRecordNumber: row.MedicalRecordNumber,
    firstName: row.FirstName,
    lastName: row.LastName,
    birthDate: row.BirthDate,
    gender: row.Gender,
    phone: row.Phone,
    email: row.Email,
    address: row.Address,
    insuranceType: row.InsuranceType,
    bloodType: row.BloodType,
    allergies: row.Allergies ? JSON.parse(row.Allergies) : [],
    chronicConditions: row.ChronicConditions ? JSON.parse(row.ChronicConditions) : [],
    emergencyContact: {
      name: row.EmergencyContactName,
      phone: row.EmergencyContactPhone,
      relationship: row.EmergencyContactRelationship,
    },
    status: row.Status,
    createdAt: row.CreatedAt,
  };
}

// GET /api/patients
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Patients ORDER BY CreatedAt DESC');
    res.json(result.recordset.map(mapPatientRow));
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM Patients WHERE Id = @id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(mapPatientRow(result.recordset[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/patients
router.post('/', async (req, res, next) => {
  try {
    const p = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('dni', sql.NVarChar, p.dni)
      .input('medicalRecordNumber', sql.NVarChar, p.medicalRecordNumber || `HC-${new Date().getFullYear()}-${Date.now()}`)
      .input('firstName', sql.NVarChar, p.firstName)
      .input('lastName', sql.NVarChar, p.lastName)
      .input('birthDate', sql.Date, p.birthDate)
      .input('gender', sql.NVarChar, p.gender)
      .input('phone', sql.NVarChar, p.phone)
      .input('email', sql.NVarChar, p.email || null)
      .input('address', sql.NVarChar, p.address)
      .input('insuranceType', sql.NVarChar, p.insuranceType)
      .input('bloodType', sql.NVarChar, p.bloodType)
      .input('allergies', sql.NVarChar, JSON.stringify(p.allergies || []))
      .input('chronicConditions', sql.NVarChar, JSON.stringify(p.chronicConditions || []))
      .input('emergencyContactName', sql.NVarChar, p.emergencyContact?.name || null)
      .input('emergencyContactPhone', sql.NVarChar, p.emergencyContact?.phone || null)
      .input('emergencyContactRelationship', sql.NVarChar, p.emergencyContact?.relationship || null)
      .query(`
        INSERT INTO Patients (
          Dni, MedicalRecordNumber, FirstName, LastName, BirthDate, Gender, Phone, Email, Address,
          InsuranceType, BloodType, Allergies, ChronicConditions,
          EmergencyContactName, EmergencyContactPhone, EmergencyContactRelationship
        )
        OUTPUT inserted.*
        VALUES (
          @dni, @medicalRecordNumber, @firstName, @lastName, @birthDate, @gender, @phone, @email, @address,
          @insuranceType, @bloodType, @allergies, @chronicConditions,
          @emergencyContactName, @emergencyContactPhone, @emergencyContactRelationship
        )
      `);
    res.status(201).json(mapPatientRow(result.recordset[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const p = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('phone', sql.NVarChar, p.phone)
      .input('email', sql.NVarChar, p.email || null)
      .input('address', sql.NVarChar, p.address)
      .input('status', sql.NVarChar, p.status)
      .input('allergies', sql.NVarChar, JSON.stringify(p.allergies || []))
      .input('chronicConditions', sql.NVarChar, JSON.stringify(p.chronicConditions || []))
      .query(`
        UPDATE Patients SET
          Phone = @phone, Email = @email, Address = @address, Status = @status,
          Allergies = @allergies, ChronicConditions = @chronicConditions
        OUTPUT inserted.*
        WHERE Id = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(mapPatientRow(result.recordset[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM Patients WHERE Id = @id');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/patients/:id/clinical-entries
router.post('/:id/clinical-entries', async (req, res, next) => {
  try {
    const e = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('patientId', sql.UniqueIdentifier, req.params.id)
      .input('doctorName', sql.NVarChar, e.doctorName)
      .input('specialty', sql.NVarChar, e.specialty)
      .input('symptoms', sql.NVarChar, e.symptoms)
      .input('diagnosis', sql.NVarChar, e.diagnosis)
      .input('cie10Code', sql.NVarChar, e.cie10Code || null)
      .input('bloodPressure', sql.NVarChar, e.vitalSigns?.bloodPressure || null)
      .input('heartRate', sql.Int, e.vitalSigns?.heartRate || null)
      .input('respiratoryRate', sql.Int, e.vitalSigns?.respiratoryRate || null)
      .input('temperature', sql.Decimal(4, 1), e.vitalSigns?.temperature || null)
      .input('oxygenSaturation', sql.Int, e.vitalSigns?.oxygenSaturation || null)
      .input('treatment', sql.NVarChar, e.treatment)
      .input('notes', sql.NVarChar, e.notes || null)
      .query(`
        INSERT INTO ClinicalEntries (
          PatientId, DoctorName, Specialty, Symptoms, Diagnosis, Cie10Code,
          BloodPressure, HeartRate, RespiratoryRate, Temperature, OxygenSaturation, Treatment, Notes
        )
        OUTPUT inserted.*
        VALUES (
          @patientId, @doctorName, @specialty, @symptoms, @diagnosis, @cie10Code,
          @bloodPressure, @heartRate, @respiratoryRate, @temperature, @oxygenSaturation, @treatment, @notes
        )
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
