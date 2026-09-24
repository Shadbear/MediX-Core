export type Gender = 'M' | 'F' | 'Otro';

export type InsuranceType = 'SIS' | 'EsSalud' | 'Privado' | 'Particular' | 'SOAT';

export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export type PatientStatus = 'Activo' | 'Hospitalizado' | 'En Observación' | 'De Alta';

export interface VitalSigns {
  bloodPressure: string; // e.g. "120/80"
  heartRate: number; // lpm
  respiratoryRate: number; // rpm
  temperature: number; // °C
  oxygenSaturation: number; // %
  weight?: number; // kg
  height?: number; // cm
  painLevel?: number; // 0-10
}

export interface ClinicalEntry {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  symptoms: string;
  diagnosis: string;
  cie10Code?: string;
  vitalSigns: VitalSigns;
  treatment: string;
  notes?: string;
}

export interface Patient {
  id: string;
  dni: string;
  medicalRecordNumber: string; // e.g. HC-2026-0012
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  phone: string;
  email?: string;
  address: string;
  insuranceType: InsuranceType;
  bloodType: BloodType;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  status: PatientStatus;
  clinicalHistory: ClinicalEntry[];
}

export type TriagePriority = 1 | 2 | 3 | 4 | 5;

export interface TriageAssessment {
  id: string;
  patientId?: string;
  patientName: string;
  patientDni: string;
  age: number;
  gender: Gender;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns: VitalSigns;
  priorityLevel: TriagePriority;
  priorityName: 'Nivel I: Reanimación' | 'Nivel II: Emergencia' | 'Nivel III: Urgencia' | 'Nivel IV: Prioridad Menor' | 'Nivel V: No Urgente';
  targetWaitTime: string;
  recommendedArea: 'Shock Trauma / UCI' | 'Tópico de Emergencia' | 'Observación' | 'Consulta Externa' | 'Triaje Ambulatorio';
  recommendationText: string;
  status: 'Pendiente' | 'Atendido' | 'Derivado';
  timestamp: string;
}

export type AppointmentStatus = 'Pendiente' | 'En Sala de Espera' | 'Llamado' | 'En Atención' | 'Atendida' | 'Cancelada' | 'Reprogramada';

export interface Appointment {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  patientDni: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  consultingRoom: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'Primera Vez' | 'Control / Seguimiento' | 'Lectura de Exámenes' | 'Procedimiento';
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

export interface QueueCall {
  id: string;
  ticket: string;
  patientName: string;
  consultingRoom: string;
  doctorName: string;
  specialty: string;
  timestamp: string;
  status: 'Llamando' | 'Atendido' | 'Ausente' | 'En Espera';
  callCount: number;
}

export interface MedicationPrescription {
  id: string;
  name: string;
  concentration: string;
  form: 'Tableta' | 'Cápsula' | 'Jarabe' | 'Ampolla' | 'Gotas' | 'Pomada' | 'Inhalador';
  dose: string;
  frequencyHours: number;
  durationDays: number;
  instructions: string;
  calculatedTimes: string[];
}

export interface Prescription {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  patientDni: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorCmp: string;
  specialty: string;
  date: string;
  diagnosis: string;
  medications: MedicationPrescription[];
  generalRecommendations: string;
  validUntil: string;
}

export type StockCategory = 'Medicamentos' | 'Material de Curación' | 'Descartables' | 'Soluciones e Intravenosos' | 'Equipos de Protección (EPP)' | 'Quirúrgico';

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'Entrada (Compra)' | 'Entrada (Donación)' | 'Salida (Atención Paciente)' | 'Salida (Despacho a Servicio)' | 'Ajuste de Inventario';
  quantity: number;
  previousStock: number;
  newStock: number;
  destinationOrOrigin: string;
  responsible: string;
  timestamp: string;
  reason: string;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  category: StockCategory;
  presentation: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  location: string;
  expirationDate: string;
  batchNumber: string;
  status: 'Óptimo' | 'Bajo Stock' | 'Crítico' | 'Próximo a Vencer';
  movements: StockMovement[];
}

export type EquipmentStatus = 'Disponible' | 'En Uso' | 'En Mantenimiento' | 'En Desinfección' | 'Calibración';

export interface MedicalEquipment {
  id: string;
  code: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  category: 'Diagnóstico por Imágenes' | 'Soporte Vital' | 'Monitoreo' | 'Terapia Respiratoria' | 'Movilidad';
  currentArea: string;
  assignedDoctor?: string;
  status: EquipmentStatus;
  lastMaintenance: string;
  nextMaintenance: string;
  qrCodeData: string;
}

export type BedWard = 'Emergencias' | 'UCI' | 'Medicina Mujeres' | 'Medicina Varones' | 'Cirugía' | 'Pediatría' | 'Maternidad';

export type BedStatus = 'Libre' | 'Ocupada' | 'En Limpieza' | 'En Mantenimiento' | 'Reservada';

export interface HospitalBed {
  id: string;
  bedNumber: string;
  ward: BedWard;
  floor: string;
  type: 'Cama Estándar' | 'Cama Eléctrica UCI' | 'Cuna Pediátrica' | 'Camilla de Observación' | 'Aislamiento';
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  patientDni?: string;
  admissionDate?: string;
  doctorInCharge?: string;
  diagnosis?: string;
  notes?: string;
}

export interface VisitorLog {
  id: string;
  visitorDni: string;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  ward: string;
  entryTime: string;
  exitTime?: string;
  securityGuard: string;
  status: 'En Hospital' | 'Salida Registrada';
  passCode: string;
}

export interface StaffMember {
  id: string;
  name: string;
  dni: string;
  cmp?: string;
  role: 'Médico Especialista' | 'Médico General' | 'Lic. Enfermería' | 'Técnico de Enfermería' | 'Tecnólogo Médico' | 'Personal Administrativo';
  specialty?: string;
  department: string;
  extension: string;
  phone: string;
  email: string;
  badgeCode: string;
  consultingRoom?: string;
  schedule: string;
  currentShift: 'Turno Mañana' | 'Turno Tarde' | 'Guardia 24h' | 'Fuera de Servicio';
  available: boolean;
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  department: string;
  badgeCode: string;
  date: string;
  checkIn: string;
  breakStart?: string;
  breakEnd?: string;
  checkOut?: string;
  status: 'Puntual' | 'Tardanza' | 'En Turno' | 'Completado' | 'Guardia';
}

export interface SatisfactionSurvey {
  id: string;
  patientName?: string;
  serviceRated: 'Emergencia' | 'Consulta Externa' | 'Hospitalización' | 'Farmacia' | 'Laboratorio' | 'Triaje';
  overallRating: number; // 1-5
  waitDurationRating: number; // 1-5
  medicalCareRating: number; // 1-5
  cleanlinessRating: number; // 1-5
  pharmacyCareRating: number; // 1-5
  recommendHospital: boolean;
  comments: string;
  timestamp: string;
}

export interface RoomBooking {
  id: string;
  roomName: 'Quirófano 1 (Cirugía Mayor)' | 'Quirófano 2 (Laparoscopía)' | 'Quirófano 3 (Traumatología)' | 'Sala de Partos' | 'Auditorio Médico' | 'Sala de Juntas';
  roomType: 'Quirófano' | 'Sala de Procedimientos' | 'Reuniones / Docencia';
  doctorId: string;
  doctorName: string;
  specialty: string;
  procedureName: string;
  patientName?: string;
  patientDni?: string;
  date: string;
  startTime: string;
  endTime: string;
  anesthesiologist?: string;
  nursingStaff?: string;
  status: 'Confirmada' | 'En Curso' | 'Finalizada' | 'Cancelada';
  equipmentRequired?: string[];
}
