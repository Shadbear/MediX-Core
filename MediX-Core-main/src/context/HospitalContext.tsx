import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient,
  StaffMember,
  HospitalBed,
  StockItem,
  MedicalEquipment,
  Appointment,
  QueueCall,
  Prescription,
  VisitorLog,
  StaffAttendance,
  SatisfactionSurvey,
  RoomBooking,
  TriageAssessment,
  ClinicalEntry,
  StockMovement,
  BedStatus,
  AppointmentStatus,
  EquipmentStatus,
} from '../types/hospital';
import {
  INITIAL_PATIENTS,
  INITIAL_STAFF,
  INITIAL_BEDS,
  INITIAL_STOCK,
  INITIAL_EQUIPMENT,
  INITIAL_APPOINTMENTS,
  INITIAL_QUEUE_CALLS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_VISITORS,
  INITIAL_ATTENDANCE,
  INITIAL_SURVEYS,
  INITIAL_BOOKINGS,
  INITIAL_TRIAGE,
} from '../data/initialData';
import { announcePatientCall } from '../utils/speech';
import { PatientService } from '../services/api.service';

export type AppModule =
  | 'dashboard'
  | 'patients'
  | 'triage'
  | 'appointments'
  | 'queue'
  | 'prescriptions'
  | 'stock'
  | 'equipment'
  | 'beds'
  | 'visitors'
  | 'attendance'
  | 'surveys'
  | 'rooms'
  | 'calculators'
  | 'directory';

interface HospitalDatabase {
  patients: Patient[];
  staff: StaffMember[];
  beds: HospitalBed[];
  stock: StockItem[];
  equipment: MedicalEquipment[];
  appointments: Appointment[];
  queueCalls: QueueCall[];
  prescriptions: Prescription[];
  visitors: VisitorLog[];
  attendance: StaffAttendance[];
  surveys: SatisfactionSurvey[];
  bookings: RoomBooking[];
  triage: TriageAssessment[];
}

interface HospitalContextType {
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  
  // Data
  patients: Patient[];
  staff: StaffMember[];
  beds: HospitalBed[];
  stock: StockItem[];
  equipment: MedicalEquipment[];
  appointments: Appointment[];
  queueCalls: QueueCall[];
  prescriptions: Prescription[];
  visitors: VisitorLog[];
  attendance: StaffAttendance[];
  surveys: SatisfactionSurvey[];
  bookings: RoomBooking[];
  triage: TriageAssessment[];
  currentCalling: QueueCall | null;

  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'medicalRecordNumber' | 'clinicalHistory'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addClinicalEntry: (patientId: string, entry: Omit<ClinicalEntry, 'id' | 'date'>) => void;

  addAppointment: (apt: Omit<Appointment, 'id' | 'ticketNumber' | 'status'>) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  callPatientTurn: (ticket: string, patientName: string, consultingRoom: string, doctorName: string, specialty: string) => Promise<void>;
  recallCurrentPatient: () => Promise<void>;
  finishCurrentCall: () => void;

  addPrescription: (rx: Omit<Prescription, 'id' | 'code' | 'date'>) => Prescription;
  deletePrescription: (id: string) => void;

  addStockItem: (item: Omit<StockItem, 'id' | 'status' | 'movements'>) => void;
  addStockMovement: (itemId: string, movement: Omit<StockMovement, 'id' | 'timestamp' | 'previousStock' | 'newStock'>) => void;

  addEquipment: (eq: Omit<MedicalEquipment, 'id' | 'qrCodeData'>) => void;
  updateEquipmentStatus: (id: string, status: EquipmentStatus, currentArea?: string, assignedDoctor?: string) => void;

  assignBed: (bedId: string, patientId: string, doctorInCharge: string, diagnosis: string, notes?: string) => void;
  releaseBed: (bedId: string) => void;
  updateBedStatus: (bedId: string, status: BedStatus, notes?: string) => void;

  checkinVisitor: (vis: Omit<VisitorLog, 'id' | 'entryTime' | 'status' | 'passCode'>) => VisitorLog;
  checkoutVisitor: (id: string) => void;

  recordAttendance: (badgeCodeOrDni: string) => { success: boolean; message: string; record?: StaffAttendance };

  addSurvey: (survey: Omit<SatisfactionSurvey, 'id' | 'timestamp'>) => void;

  addBooking: (booking: Omit<RoomBooking, 'id' | 'status'>) => { success: boolean; message: string };
  cancelBooking: (id: string) => void;

  addTriageAssessment: (triage: Omit<TriageAssessment, 'id' | 'timestamp' | 'status'>) => TriageAssessment;
  updateTriageStatus: (id: string, status: 'Pendiente' | 'Atendido' | 'Derivado') => void;

  exportDatabaseToJson: () => void;
  importDatabaseFromJson: (jsonStr: string) => boolean;
  resetDatabaseToDefaults: () => void;
}

const DB_STORAGE_KEY = 'MEDIX_hospital_db_v1';
const THEME_STORAGE_KEY = 'MEDIX_theme_mode';

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });

  // Database states
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.patients) return parsed.patients;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PATIENTS;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.staff) return parsed.staff;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_STAFF;
  });

  const [beds, setBeds] = useState<HospitalBed[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.beds) return parsed.beds;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_BEDS;
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stock) return parsed.stock;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_STOCK;
  });

  const [equipment, setEquipment] = useState<MedicalEquipment[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.equipment) return parsed.equipment;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EQUIPMENT;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.appointments) return parsed.appointments;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [queueCalls, setQueueCalls] = useState<QueueCall[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.queueCalls) return parsed.queueCalls;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_QUEUE_CALLS;
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prescriptions) return parsed.prescriptions;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PRESCRIPTIONS;
  });

  const [visitors, setVisitors] = useState<VisitorLog[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.visitors) return parsed.visitors;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_VISITORS;
  });

  const [attendance, setAttendance] = useState<StaffAttendance[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.attendance) return parsed.attendance;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_ATTENDANCE;
  });

  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.surveys) return parsed.surveys;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SURVEYS;
  });

  const [bookings, setBookings] = useState<RoomBooking[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bookings) return parsed.bookings;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_BOOKINGS;
  });

  const [triage, setTriage] = useState<TriageAssessment[]>(() => {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.triage) return parsed.triage;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TRIAGE;
  });

  const [currentCalling, setCurrentCalling] = useState<QueueCall | null>(() => {
    return INITIAL_QUEUE_CALLS.find(c => c.status === 'Llamando') || null;
  });

  // Módulo Pacientes: ahora vive en SQL Server a través del backend (/backend).
  // Al montar, intenta traer los pacientes reales desde la API. Si el backend
  // o la base de datos todavía no están disponibles (mientras no configures
  // backend/.env), simplemente se queda con lo cargado de localStorage/datos
  // iniciales, para que la app siga siendo utilizable mientras tanto.
  const [patientsDbConnected, setPatientsDbConnected] = useState(false);
  useEffect(() => {
    let cancelled = false;
    PatientService.getAll()
      .then((remotePatients) => {
        if (!cancelled) {
          setPatients(remotePatients);
          setPatientsDbConnected(true);
        }
      })
      .catch((err) => {
        console.warn(
          '[MediX] No se pudo cargar pacientes desde SQL Server todavía (¿configuraste backend/.env y ejecutaste schema.sql?). Usando datos locales mientras tanto.',
          err
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    const db: HospitalDatabase = {
      patients,
      staff,
      beds,
      stock,
      equipment,
      appointments,
      queueCalls,
      prescriptions,
      visitors,
      attendance,
      surveys,
      bookings,
      triage,
    };
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [patients, staff, beds, stock, equipment, appointments, queueCalls, prescriptions, visitors, attendance, surveys, bookings, triage]);

  // PATIENT ACTIONS
  // Todas intentan primero contra SQL Server (vía PatientService). Si la
  // base de datos aún no está configurada, caen a una versión local
  // equivalente para no romper la app mientras tanto — pero la fuente de
  // verdad, en cuanto exista la BD, es siempre el backend.
  const addPatient = useCallback((data: Omit<Patient, 'id' | 'createdAt' | 'medicalRecordNumber' | 'clinicalHistory'>): Patient => {
    const year = new Date().getFullYear();
    const count = patients.length + 1;
    const medicalRecordNumber = `HC-${year}-${String(count).padStart(4, '0')}`;
    const localFallback: Patient = {
      ...data,
      id: `pat-${Date.now()}`,
      medicalRecordNumber,
      createdAt: new Date().toISOString().split('T')[0],
      clinicalHistory: [],
    };

    PatientService.create({ ...data, medicalRecordNumber } as any)
      .then((created) => {
        setPatients(prev => [created, ...prev.filter(p => p.id !== localFallback.id)]);
      })
      .catch((err) => {
        console.warn('[MediX] No se pudo guardar el paciente en SQL Server, quedó solo en local:', err.message);
      });

    setPatients(prev => [localFallback, ...prev]);
    return localFallback;
  }, [patients.length]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    PatientService.update(id, updates).catch((err) => {
      console.warn('[MediX] No se pudo actualizar el paciente en SQL Server (¿BD configurada?):', err.message);
    });
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    PatientService.delete(id).catch((err) => {
      console.warn('[MediX] No se pudo eliminar el paciente en SQL Server (¿BD configurada?):', err.message);
    });
  }, []);

  const addClinicalEntry = useCallback((patientId: string, entry: Omit<ClinicalEntry, 'id' | 'date'>) => {
    const newEntry: ClinicalEntry = {
      ...entry,
      id: `clin-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          clinicalHistory: [newEntry, ...(p.clinicalHistory || [])],
        };
      }
      return p;
    }));
    PatientService.addClinicalEntry(patientId, entry).catch((err) => {
      console.warn('[MediX] No se pudo guardar la entrada clínica en SQL Server (¿BD configurada?):', err.message);
    });
  }, []);

  // APPOINTMENT ACTIONS
  const addAppointment = useCallback((data: Omit<Appointment, 'id' | 'ticketNumber' | 'status'>): Appointment => {
    const nextTicketNum = appointments.length + 105;
    const ticketNumber = `T-${nextTicketNum}`;
    const newApt: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      ticketNumber,
      status: 'Pendiente',
    };
    setAppointments(prev => [newApt, ...prev]);
    return newApt;
  }, [appointments.length]);

  const updateAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  // QUEUE CALL & AUDIO NOTIFIER
  const callPatientTurn = useCallback(async (ticket: string, patientName: string, consultingRoom: string, doctorName: string, specialty: string) => {
    const existingIndex = queueCalls.findIndex(q => q.ticket === ticket);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedCall: QueueCall;

    if (existingIndex >= 0) {
      updatedCall = {
        ...queueCalls[existingIndex],
        status: 'Llamando',
        callCount: queueCalls[existingIndex].callCount + 1,
        timestamp: timeStr,
      };
      setQueueCalls(prev => prev.map((q, idx) => idx === existingIndex ? updatedCall : { ...q, status: q.status === 'Llamando' ? 'Atendido' : q.status }));
    } else {
      updatedCall = {
        id: `call-${Date.now()}`,
        ticket,
        patientName,
        consultingRoom,
        doctorName,
        specialty,
        timestamp: timeStr,
        status: 'Llamando',
        callCount: 1,
      };
      setQueueCalls(prev => [
        updatedCall,
        ...prev.map(q => q.status === 'Llamando' ? { ...q, status: 'Atendido' as const } : q)
      ]);
    }

    setCurrentCalling(updatedCall);

    // Update appointment status if matching ticket
    setAppointments(prev => prev.map(a => a.ticketNumber === ticket ? { ...a, status: 'Llamado' } : a));

    // Fire audio and voice speech
    await announcePatientCall(patientName, consultingRoom, ticket);
  }, [queueCalls]);

  const recallCurrentPatient = useCallback(async () => {
    if (!currentCalling) return;
    const updated = {
      ...currentCalling,
      callCount: currentCalling.callCount + 1,
    };
    setCurrentCalling(updated);
    setQueueCalls(prev => prev.map(q => q.id === currentCalling.id ? updated : q));
    await announcePatientCall(currentCalling.patientName, currentCalling.consultingRoom, currentCalling.ticket);
  }, [currentCalling]);

  const finishCurrentCall = useCallback(() => {
    if (!currentCalling) return;
    setQueueCalls(prev => prev.map(q => q.id === currentCalling.id ? { ...q, status: 'Atendido' } : q));
    setAppointments(prev => prev.map(a => a.ticketNumber === currentCalling.ticket ? { ...a, status: 'Atendida' } : a));
    setCurrentCalling(null);
  }, [currentCalling]);

  // PRESCRIPTION ACTIONS
  const addPrescription = useCallback((data: Omit<Prescription, 'id' | 'code' | 'date'>): Prescription => {
    const year = new Date().getFullYear();
    const count = prescriptions.length + 47;
    const code = `REC-${year}-${String(count).padStart(4, '0')}`;
    const newRx: Prescription = {
      ...data,
      id: `rx-${Date.now()}`,
      code,
      date: new Date().toISOString().split('T')[0],
    };
    setPrescriptions(prev => [newRx, ...prev]);
    return newRx;
  }, [prescriptions.length]);

  const deletePrescription = useCallback((id: string) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  }, []);

  // STOCK ACTIONS
  const addStockItem = useCallback((data: Omit<StockItem, 'id' | 'status' | 'movements'>) => {
    let status: StockItem['status'] = 'Óptimo';
    if (data.currentStock <= data.minStock * 0.5) status = 'Crítico';
    else if (data.currentStock <= data.minStock) status = 'Bajo Stock';

    const newItem: StockItem = {
      ...data,
      id: `stk-${Date.now()}`,
      status,
      movements: [
        {
          id: `mov-${Date.now()}`,
          itemId: `stk-${Date.now()}`,
          type: 'Entrada (Compra)',
          quantity: data.currentStock,
          previousStock: 0,
          newStock: data.currentStock,
          destinationOrOrigin: 'Almacén Central / Registro Inicial',
          responsible: 'Jefe de Logística',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reason: 'Inventario inicial del sistema.',
        }
      ]
    };
    setStock(prev => [newItem, ...prev]);
  }, []);

  const addStockMovement = useCallback((itemId: string, movement: Omit<StockMovement, 'id' | 'timestamp' | 'previousStock' | 'newStock'>) => {
    setStock(prev => prev.map(item => {
      if (item.id === itemId) {
        const isEntry = movement.type.startsWith('Entrada');
        const change = isEntry ? movement.quantity : -movement.quantity;
        const newStock = Math.max(0, item.currentStock + change);

        let status: StockItem['status'] = 'Óptimo';
        if (newStock <= item.minStock * 0.5) status = 'Crítico';
        else if (newStock <= item.minStock) status = 'Bajo Stock';

        const fullMovement: StockMovement = {
          ...movement,
          id: `mov-${Date.now()}`,
          itemId,
          previousStock: item.currentStock,
          newStock,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };

        return {
          ...item,
          currentStock: newStock,
          status,
          movements: [fullMovement, ...(item.movements || [])],
        };
      }
      return item;
    }));
  }, []);

  // EQUIPMENT ACTIONS
  const addEquipment = useCallback((data: Omit<MedicalEquipment, 'id' | 'qrCodeData'>) => {
    const id = `eq-${Date.now()}`;
    const qrCodeData = `HOSP-EQ:${data.code}|${data.name}|SN:${data.serialNumber}`;
    const newEq: MedicalEquipment = {
      ...data,
      id,
      qrCodeData,
    };
    setEquipment(prev => [newEq, ...prev]);
  }, []);

  const updateEquipmentStatus = useCallback((id: string, status: EquipmentStatus, currentArea?: string, assignedDoctor?: string) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === id) {
        return {
          ...eq,
          status,
          ...(currentArea ? { currentArea } : {}),
          ...(assignedDoctor !== undefined ? { assignedDoctor } : {}),
        };
      }
      return eq;
    }));
  }, []);

  // HOSPITAL BEDS ACTIONS
  const assignBed = useCallback((bedId: string, patientId: string, doctorInCharge: string, diagnosis: string, notes?: string) => {
    const patient = patients.find(p => p.id === patientId);
    setBeds(prev => prev.map(bed => {
      if (bed.id === bedId) {
        return {
          ...bed,
          status: 'Ocupada',
          patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente Desconocido',
          patientDni: patient ? patient.dni : '',
          admissionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          doctorInCharge,
          diagnosis,
          notes: notes || bed.notes,
        };
      }
      return bed;
    }));

    // Update patient status to Hospitalizado
    if (patient) {
      updatePatient(patient.id, { status: 'Hospitalizado' });
    }
  }, [patients, updatePatient]);

  const releaseBed = useCallback((bedId: string) => {
    const targetBed = beds.find(b => b.id === bedId);
    if (targetBed && targetBed.patientId) {
      updatePatient(targetBed.patientId, { status: 'De Alta' });
    }

    setBeds(prev => prev.map(bed => {
      if (bed.id === bedId) {
        return {
          ...bed,
          status: 'En Limpieza',
          patientId: undefined,
          patientName: undefined,
          patientDni: undefined,
          admissionDate: undefined,
          doctorInCharge: undefined,
          diagnosis: undefined,
          notes: 'Paciente dado de alta. Requiere desinfección y cambio de sábanas.',
        };
      }
      return bed;
    }));
  }, [beds, updatePatient]);

  const updateBedStatus = useCallback((bedId: string, status: BedStatus, notes?: string) => {
    setBeds(prev => prev.map(bed => {
      if (bed.id === bedId) {
        return {
          ...bed,
          status,
          ...(notes !== undefined ? { notes } : {}),
        };
      }
      return bed;
    }));
  }, []);

  // VISITOR LOG ACTIONS
  const checkinVisitor = useCallback((data: Omit<VisitorLog, 'id' | 'entryTime' | 'status' | 'passCode'>): VisitorLog => {
    const now = new Date();
    const passCode = `VIS-${now.getFullYear()}-${String(visitors.length + 83).padStart(3, '0')}`;
    const newVisitor: VisitorLog = {
      ...data,
      id: `vis-${Date.now()}`,
      entryTime: now.toISOString().replace('T', ' ').slice(0, 16),
      status: 'En Hospital',
      passCode,
    };
    setVisitors(prev => [newVisitor, ...prev]);
    return newVisitor;
  }, [visitors.length]);

  const checkoutVisitor = useCallback((id: string) => {
    const now = new Date();
    setVisitors(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'Salida Registrada',
          exitTime: now.toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return v;
    }));
  }, []);

  // STAFF ATTENDANCE ACTIONS
  const recordAttendance = useCallback((badgeCodeOrDni: string): { success: boolean; message: string; record?: StaffAttendance } => {
    const clean = badgeCodeOrDni.trim().toLowerCase();
    const foundStaff = staff.find(s => 
      s.badgeCode.toLowerCase() === clean || 
      s.dni.toLowerCase() === clean ||
      s.name.toLowerCase().includes(clean)
    );

    if (!foundStaff) {
      return { success: false, message: 'Código de fotocheck o DNI no encontrado en el directorio hospitalario.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existingIndex = attendance.findIndex(a => a.staffId === foundStaff.id && a.date === today);

    if (existingIndex >= 0) {
      const existing = attendance[existingIndex];
      if (!existing.breakStart) {
        // Marcación Inicio Refrigerio
        const updated = { ...existing, breakStart: timeStr };
        setAttendance(prev => prev.map((a, idx) => idx === existingIndex ? updated : a));
        return { success: true, message: `Salida a refrigerio registrada: ${foundStaff.name} a las ${timeStr}`, record: updated };
      } else if (!existing.breakEnd) {
        // Retorno de Refrigerio
        const updated = { ...existing, breakEnd: timeStr };
        setAttendance(prev => prev.map((a, idx) => idx === existingIndex ? updated : a));
        return { success: true, message: `Retorno de refrigerio registrado: ${foundStaff.name} a las ${timeStr}`, record: updated };
      } else if (!existing.checkOut) {
        // Marcación Salida
        const updated = { ...existing, checkOut: timeStr, status: 'Completado' as const };
        setAttendance(prev => prev.map((a, idx) => idx === existingIndex ? updated : a));
        return { success: true, message: `Salida de turno registrada: ${foundStaff.name} a las ${timeStr}`, record: updated };
      } else {
        return { success: false, message: `${foundStaff.name} ya completó todas las marcaciones del día.` };
      }
    } else {
      // Nueva entrada
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15);
      const newAttendance: StaffAttendance = {
        id: `att-${Date.now()}`,
        staffId: foundStaff.id,
        staffName: foundStaff.name,
        staffRole: foundStaff.role,
        department: foundStaff.department,
        badgeCode: foundStaff.badgeCode,
        date: today,
        checkIn: timeStr,
        status: isLate ? 'Tardanza' : 'Puntual',
      };
      setAttendance(prev => [newAttendance, ...prev]);
      return {
        success: true,
        message: `Entrada registrada: ${foundStaff.name} (${foundStaff.role}) a las ${timeStr} [${isLate ? 'TARDANZA' : 'PUNTUAL'}]`,
        record: newAttendance,
      };
    }
  }, [staff, attendance]);

  // SATISFACTION SURVEYS
  const addSurvey = useCallback((survey: Omit<SatisfactionSurvey, 'id' | 'timestamp'>) => {
    const newSurvey: SatisfactionSurvey = {
      ...survey,
      id: `sur-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setSurveys(prev => [newSurvey, ...prev]);
  }, []);

  // ROOM BOOKINGS
  const addBooking = useCallback((booking: Omit<RoomBooking, 'id' | 'status'>): { success: boolean; message: string } => {
    // Conflict check
    const conflict = bookings.find(b => 
      b.roomName === booking.roomName &&
      b.date === booking.date &&
      b.status !== 'Cancelada' &&
      ((booking.startTime >= b.startTime && booking.startTime < b.endTime) ||
       (booking.endTime > b.startTime && booking.endTime <= b.endTime) ||
       (booking.startTime <= b.startTime && booking.endTime >= b.endTime))
    );

    if (conflict) {
      return {
        success: false,
        message: `Conflicto de horario: ${booking.roomName} ya está reservada de ${conflict.startTime} a ${conflict.endTime} por el ${conflict.doctorName}.`
      };
    }

    const newBooking: RoomBooking = {
      ...booking,
      id: `book-${Date.now()}`,
      status: 'Confirmada',
    };
    setBookings(prev => [newBooking, ...prev]);
    return { success: true, message: `Reserva confirmada con éxito para ${booking.roomName}.` };
  }, [bookings]);

  const cancelBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelada' } : b));
  }, []);

  // TRIAGE ACTIONS
  const addTriageAssessment = useCallback((data: Omit<TriageAssessment, 'id' | 'timestamp' | 'status'>): TriageAssessment => {
    const newTriage: TriageAssessment = {
      ...data,
      id: `trg-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pendiente',
    };
    setTriage(prev => [newTriage, ...prev]);
    return newTriage;
  }, []);

  const updateTriageStatus = useCallback((id: string, status: 'Pendiente' | 'Atendido' | 'Derivado') => {
    setTriage(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  // BACKUP & RESTORE
  const exportDatabaseToJson = useCallback(() => {
    const db: HospitalDatabase = {
      patients,
      staff,
      beds,
      stock,
      equipment,
      appointments,
      queueCalls,
      prescriptions,
      visitors,
      attendance,
      surveys,
      bookings,
      triage,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MEDIX_backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [patients, staff, beds, stock, equipment, appointments, queueCalls, prescriptions, visitors, attendance, surveys, bookings, triage]);

  const importDatabaseFromJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<HospitalDatabase>;
      if (parsed.patients) setPatients(parsed.patients);
      if (parsed.staff) setStaff(parsed.staff);
      if (parsed.beds) setBeds(parsed.beds);
      if (parsed.stock) setStock(parsed.stock);
      if (parsed.equipment) setEquipment(parsed.equipment);
      if (parsed.appointments) setAppointments(parsed.appointments);
      if (parsed.queueCalls) setQueueCalls(parsed.queueCalls);
      if (parsed.prescriptions) setPrescriptions(parsed.prescriptions);
      if (parsed.visitors) setVisitors(parsed.visitors);
      if (parsed.attendance) setAttendance(parsed.attendance);
      if (parsed.surveys) setSurveys(parsed.surveys);
      if (parsed.bookings) setBookings(parsed.bookings);
      if (parsed.triage) setTriage(parsed.triage);
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  }, []);

  const resetDatabaseToDefaults = useCallback(() => {
    setPatients(INITIAL_PATIENTS);
    setStaff(INITIAL_STAFF);
    setBeds(INITIAL_BEDS);
    setStock(INITIAL_STOCK);
    setEquipment(INITIAL_EQUIPMENT);
    setAppointments(INITIAL_APPOINTMENTS);
    setQueueCalls(INITIAL_QUEUE_CALLS);
    setPrescriptions(INITIAL_PRESCRIPTIONS);
    setVisitors(INITIAL_VISITORS);
    setAttendance(INITIAL_ATTENDANCE);
    setSurveys(INITIAL_SURVEYS);
    setBookings(INITIAL_BOOKINGS);
    setTriage(INITIAL_TRIAGE);
    setCurrentCalling(INITIAL_QUEUE_CALLS[0] || null);
    localStorage.removeItem(DB_STORAGE_KEY);
  }, []);

  return (
    <HospitalContext.Provider
      value={{
        activeModule,
        setActiveModule,
        darkMode,
        toggleDarkMode,
        globalSearch,
        setGlobalSearch,
        patients,
        staff,
        beds,
        stock,
        equipment,
        appointments,
        queueCalls,
        prescriptions,
        visitors,
        attendance,
        surveys,
        bookings,
        triage,
        currentCalling,
        addPatient,
        updatePatient,
        deletePatient,
        addClinicalEntry,
        addAppointment,
        updateAppointmentStatus,
        callPatientTurn,
        recallCurrentPatient,
        finishCurrentCall,
        addPrescription,
        deletePrescription,
        addStockItem,
        addStockMovement,
        addEquipment,
        updateEquipmentStatus,
        assignBed,
        releaseBed,
        updateBedStatus,
        checkinVisitor,
        checkoutVisitor,
        recordAttendance,
        addSurvey,
        addBooking,
        cancelBooking,
        addTriageAssessment,
        updateTriageStatus,
        exportDatabaseToJson,
        importDatabaseFromJson,
        resetDatabaseToDefaults,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
