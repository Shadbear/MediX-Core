const { z } = require('zod');
const { passwordSchema } = require('./util');

const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optText = (max) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
const reqText = (max, label) => z.string({ required_error: `${label} es obligatorio` }).trim().min(1, `${label} es obligatorio`).max(max);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: AAAA-MM-DD').refine((d) => !Number.isNaN(Date.parse(d)), 'Fecha inválida');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora: HH:MM');
const uuid = z.string().uuid('Identificador inválido');

const PATIENT_STATUS = ['Activo', 'Hospitalizado', 'En Observación', 'De Alta'];
const GENDER = ['M', 'F', 'Otro'];
const INSURANCE = ['SIS', 'EsSalud', 'Privado', 'Particular', 'SOAT'];
const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const APPT_STATUS = ['Pendiente', 'En Sala de Espera', 'Llamado', 'En Atención', 'Atendida', 'Cancelada', 'Reprogramada'];
const APPT_TYPE = ['Primera Vez', 'Control / Seguimiento', 'Lectura de Exámenes', 'Procedimiento'];
const MOVEMENT = ['Entrada (Compra)', 'Entrada (Donación)', 'Salida (Atención Paciente)', 'Salida (Despacho a Servicio)', 'Ajuste de Inventario'];
const ROLES = ['admin', 'medico', 'enfermeria', 'recepcion'];

const dni = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,12}$/, 'El documento debe tener entre 8 y 12 letras o números, sin espacios');
const birthDate = isoDate.refine((d) => d >= '1900-01-01' && d <= new Date().toISOString().slice(0, 10), 'Fecha de nacimiento fuera de rango');
const phone = z.string().trim().regex(/^[0-9+()\-\s]{6,30}$/, 'Teléfono inválido');
const email = z.preprocess(emptyToNull, z.string().trim().toLowerCase().email('Correo inválido').max(150).nullable().optional());
const tagList = z.array(z.string().trim().min(1).max(100)).max(50);
const bloodType = z.preprocess(emptyToNull, z.enum(BLOOD).nullable().optional());

const emergencyContact = z.object({
  name: optText(150),
  phone: z.preprocess(emptyToNull, phone.nullable().optional()),
  relationship: optText(50),
}).partial();

const createPatient = z.object({
  dni,
  firstName: reqText(100, 'El nombre'),
  lastName: reqText(100, 'El apellido'),
  birthDate,
  gender: z.enum(GENDER),
  phone,
  email,
  address: reqText(250, 'La dirección'),
  insuranceType: z.enum(INSURANCE),
  bloodType,
  allergies: tagList.default([]),
  chronicConditions: tagList.default([]),
  emergencyContact: emergencyContact.optional(),
});

// Todos opcionales; qué campos se aceptan de verdad depende del rol (ver routes/patients.js).
const updatePatient = z.object({
  dni: dni.optional(),
  firstName: reqText(100, 'El nombre').optional(),
  lastName: reqText(100, 'El apellido').optional(),
  birthDate: birthDate.optional(),
  gender: z.enum(GENDER).optional(),
  phone: phone.optional(),
  email,
  address: reqText(250, 'La dirección').optional(),
  insuranceType: z.enum(INSURANCE).optional(),
  bloodType,
  allergies: tagList.optional(),
  chronicConditions: tagList.optional(),
  status: z.enum(PATIENT_STATUS).optional(),
  emergencyContact: emergencyContact.optional(),
});

const clinicalEntry = z.object({
  specialty: reqText(100, 'La especialidad'),
  symptoms: reqText(10000, 'Los síntomas'),
  diagnosis: reqText(10000, 'El diagnóstico'),
  cie10Code: z.preprocess(emptyToNull, z.string().trim().max(10).nullable().optional()),
  treatment: reqText(10000, 'El tratamiento'),
  notes: optText(10000),
  vitalSigns: z.object({
    bloodPressure: z.preprocess(emptyToNull, z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Presión arterial: formato 120/80').nullable().optional()),
    heartRate: z.number().int().min(20).max(300).nullish(),
    respiratoryRate: z.number().int().min(4).max(80).nullish(),
    temperature: z.number().min(25).max(45).nullish(),
    oxygenSaturation: z.number().int().min(0).max(100).nullish(),
    weight: z.number().min(0.3).max(500).nullish(),
    height: z.number().min(20).max(260).nullish(),
    painLevel: z.number().int().min(0).max(10).nullish(),
  }).partial().optional(),
});

const createAppointment = z.object({
  patientId: uuid,
  doctorId: z.preprocess(emptyToNull, uuid.nullable().optional()),
  specialty: reqText(100, 'La especialidad'),
  consultingRoom: optText(30),
  date: isoDate,
  time,
  type: z.enum(APPT_TYPE),
  reason: optText(5000),
  notes: optText(5000),
});
const appointmentStatus = z.object({ status: z.enum(APPT_STATUS) });

const stockMovement = z.object({
  type: z.enum(MOVEMENT),
  quantity: z.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad debe ser mayor a 0').max(1000000),
  destinationOrOrigin: optText(150),
  reason: optText(5000),
});
const createStockItem = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9._-]{2,30}$/, 'Código: 2 a 30 caracteres (letras, números, . _ -)'),
  name: reqText(150, 'El nombre'),
  category: reqText(60, 'La categoría'),
  presentation: optText(60),
  currentStock: z.number().int().min(0).max(1000000).default(0),
  minStock: z.number().int().min(0).max(1000000).default(0),
  unitCost: z.number().min(0).max(1e7).nullish(),
  location: optText(60),
  expirationDate: z.preprocess(emptyToNull, isoDate.nullable().optional()),
  batchNumber: optText(40),
});

const assignBed = z.object({
  patientId: uuid,
  doctorInCharge: optText(150),
  diagnosis: optText(5000),
  notes: optText(5000),
});

const username = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,50}$/, 'Usuario: 3 a 50 caracteres (letras, números, . _ -)');
const login = z.object({ username: z.string().trim().toLowerCase().min(1).max(50), password: z.string().min(1).max(200) });
const changePassword = z.object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema });
const createUser = z.object({ username, fullName: reqText(150, 'El nombre completo'), role: z.enum(ROLES), password: passwordSchema });
const updateUser = z.object({ fullName: reqText(150, 'El nombre completo').optional(), role: z.enum(ROLES).optional(), isActive: z.boolean().optional() });
const resetPassword = z.object({ password: passwordSchema });

module.exports = {
  createPatient, updatePatient, clinicalEntry, createAppointment, appointmentStatus, stockMovement, createStockItem,
  assignBed, login, changePassword, createUser, updateUser, resetPassword,
};
