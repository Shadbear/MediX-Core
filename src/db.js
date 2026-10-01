// SQLite: un solo archivo, sin servidor. Esquema completo + datos iniciales.
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const inMemory = process.env.DB_FILE === ':memory:';
if (!inMemory) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

const dbFile = inMemory ? ':memory:' : process.env.DB_FILE || path.join(DATA_DIR, 'medix.db');
const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
  Id TEXT PRIMARY KEY,
  Username TEXT NOT NULL UNIQUE,
  FullName TEXT NOT NULL,
  PasswordHash TEXT NOT NULL,
  Role TEXT NOT NULL CHECK (Role IN ('admin','medico','enfermeria','recepcion')),
  IsActive INTEGER NOT NULL DEFAULT 1,
  MustChangePassword INTEGER NOT NULL DEFAULT 1,
  FailedAttempts INTEGER NOT NULL DEFAULT 0,
  LockedUntil TEXT,
  LastLoginAt TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (${NOW})
);

CREATE TABLE IF NOT EXISTS Sessions (
  Id TEXT PRIMARY KEY,               -- SHA-256 del token (el token real solo vive en la cookie)
  UserId TEXT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
  CreatedAt TEXT NOT NULL DEFAULT (${NOW}),
  ExpiresAt TEXT NOT NULL,
  LastSeenAt TEXT NOT NULL,
  Ip TEXT
);

CREATE TABLE IF NOT EXISTS AuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  At TEXT NOT NULL DEFAULT (${NOW}),
  UserId TEXT, Username TEXT, Role TEXT,
  Action TEXT NOT NULL, EntityType TEXT, EntityId TEXT, Ip TEXT,
  Success INTEGER NOT NULL DEFAULT 1,
  Detail TEXT
);
CREATE INDEX IF NOT EXISTS IX_Audit_At ON AuditLog(At DESC);
-- La auditoría es de solo-añadir: nadie puede modificarla ni borrarla desde la aplicación.
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON AuditLog BEGIN SELECT RAISE(ABORT, 'AuditLog es de solo lectura'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON AuditLog BEGIN SELECT RAISE(ABORT, 'AuditLog es de solo lectura'); END;

CREATE TABLE IF NOT EXISTS Counters (Name TEXT PRIMARY KEY, Value INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS Patients (
  Id TEXT PRIMARY KEY,
  Dni TEXT NOT NULL UNIQUE,
  MedicalRecordNumber TEXT NOT NULL UNIQUE,
  FirstName TEXT NOT NULL, LastName TEXT NOT NULL,
  BirthDate TEXT NOT NULL, Gender TEXT NOT NULL,
  Phone TEXT NOT NULL, Email TEXT, Address TEXT NOT NULL,
  InsuranceType TEXT NOT NULL,
  BloodType TEXT,
  Allergies TEXT,            -- cifrado
  ChronicConditions TEXT,    -- cifrado
  EmergencyContactName TEXT, EmergencyContactPhone TEXT, EmergencyContactRelationship TEXT,
  Status TEXT NOT NULL DEFAULT 'Activo',
  IsDeleted INTEGER NOT NULL DEFAULT 0, DeletedAt TEXT, DeletedBy TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (${NOW})
);

CREATE TABLE IF NOT EXISTS ClinicalEntries (
  Id TEXT PRIMARY KEY,
  PatientId TEXT NOT NULL REFERENCES Patients(Id),
  EntryDate TEXT NOT NULL DEFAULT (${NOW}),
  DoctorId TEXT, DoctorName TEXT NOT NULL, Specialty TEXT NOT NULL,
  Symptoms TEXT NOT NULL, Diagnosis TEXT NOT NULL, Treatment TEXT NOT NULL, Notes TEXT, -- cifrados
  Cie10Code TEXT,
  BloodPressure TEXT, HeartRate INTEGER, RespiratoryRate INTEGER, Temperature REAL,
  OxygenSaturation INTEGER, Weight REAL, Height REAL, PainLevel INTEGER
);
CREATE INDEX IF NOT EXISTS IX_Clinical_Patient ON ClinicalEntries(PatientId, EntryDate DESC);
-- La historia clínica no se edita ni se borra: solo se agregan entradas.
CREATE TRIGGER IF NOT EXISTS clinical_no_update BEFORE UPDATE ON ClinicalEntries BEGIN SELECT RAISE(ABORT, 'La historia clínica no se puede modificar'); END;
CREATE TRIGGER IF NOT EXISTS clinical_no_delete BEFORE DELETE ON ClinicalEntries BEGIN SELECT RAISE(ABORT, 'La historia clínica no se puede borrar'); END;

CREATE TABLE IF NOT EXISTS Appointments (
  Id TEXT PRIMARY KEY,
  TicketNumber TEXT NOT NULL UNIQUE,
  PatientId TEXT NOT NULL REFERENCES Patients(Id),
  DoctorId TEXT REFERENCES Users(Id),
  Specialty TEXT NOT NULL, ConsultingRoom TEXT,
  AppointmentDate TEXT NOT NULL, AppointmentTime TEXT NOT NULL,
  AppointmentType TEXT NOT NULL,
  Status TEXT NOT NULL DEFAULT 'Pendiente',
  Reason TEXT, Notes TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (${NOW})
);
-- Un médico o un paciente no pueden tener dos citas a la misma hora (las canceladas no cuentan).
CREATE UNIQUE INDEX IF NOT EXISTS UX_Appt_Doctor_Slot ON Appointments(DoctorId, AppointmentDate, AppointmentTime)
  WHERE DoctorId IS NOT NULL AND Status <> 'Cancelada' AND Status <> 'Reprogramada';
CREATE UNIQUE INDEX IF NOT EXISTS UX_Appt_Patient_Slot ON Appointments(PatientId, AppointmentDate, AppointmentTime)
  WHERE Status <> 'Cancelada' AND Status <> 'Reprogramada';

CREATE TABLE IF NOT EXISTS StockItems (
  Id TEXT PRIMARY KEY,
  Code TEXT NOT NULL UNIQUE, Name TEXT NOT NULL, Category TEXT NOT NULL, Presentation TEXT,
  CurrentStock INTEGER NOT NULL DEFAULT 0 CHECK (CurrentStock >= 0),
  MinStock INTEGER NOT NULL DEFAULT 0,
  UnitCost REAL, Location TEXT, ExpirationDate TEXT, BatchNumber TEXT
);
CREATE TABLE IF NOT EXISTS StockMovements (
  Id TEXT PRIMARY KEY,
  ItemId TEXT NOT NULL REFERENCES StockItems(Id),
  At TEXT NOT NULL DEFAULT (${NOW}),
  MovementType TEXT NOT NULL, Quantity INTEGER NOT NULL CHECK (Quantity > 0),
  PreviousStock INTEGER NOT NULL, NewStock INTEGER NOT NULL,
  DestinationOrOrigin TEXT, Responsible TEXT NOT NULL, Reason TEXT
);

CREATE TABLE IF NOT EXISTS Beds (
  Id TEXT PRIMARY KEY,
  BedNumber TEXT NOT NULL UNIQUE, Ward TEXT NOT NULL, Floor INTEGER, BedType TEXT NOT NULL DEFAULT 'General',
  Status TEXT NOT NULL DEFAULT 'Libre' CHECK (Status IN ('Libre','Ocupada','En Limpieza','Mantenimiento')),
  PatientId TEXT REFERENCES Patients(Id),
  AdmissionDate TEXT, DoctorInCharge TEXT,
  Diagnosis TEXT, Notes TEXT   -- cifrados
);
-- Un paciente no puede ocupar dos camas a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS UX_Beds_Patient ON Beds(PatientId) WHERE PatientId IS NOT NULL;
`);

/** Correlativo sin colisiones (HC-2026-000001, T-000001...). Atómico. */
function nextSeq(name) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO Counters(Name, Value) VALUES (?, 1) ON CONFLICT(Name) DO UPDATE SET Value = Value + 1 RETURNING Value').get(name).Value

    db.exec('COMMIT');
    return result; // o el valor que retornaba la función
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Camas iniciales (solo la primera vez).
if (db.prepare('SELECT COUNT(*) AS n FROM Beds').get().n === 0) {
  const ins = db.prepare('INSERT INTO Beds (Id, BedNumber, Ward, Floor, BedType) VALUES (?, ?, ?, ?, ?)');
  const wards = [['Urgencias', 1, 'General', 4], ['Hospitalización', 2, 'General', 6], ['UCI', 3, 'UCI', 2]];
  db.transaction(() => {
    for (const [ward, floor, type, n] of wards) {
      for (let i = 1; i <= n; i++) ins.run(crypto.randomUUID(), `${ward.slice(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`, ward, floor, type);
    }
  })();
}

module.exports = { db, nextSeq, DATA_DIR, dbFile };
