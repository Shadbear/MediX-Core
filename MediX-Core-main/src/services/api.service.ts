import axios from 'axios';
import {
  Patient,
  ClinicalEntry,
  Appointment,
  StockItem,
  HospitalBed,
  Prescription,
  TriageAssessment,
} from '../types/hospital';

// Configuración base de la API hacia el backend de MediX-Core (ver carpeta /backend).
// Ese servidor es quien habla con SQL Server; el navegador nunca se conecta
// directamente a la base de datos. Cambia esta URL si despliegas el backend
// en otra máquina o puerto.
const API_BASE_URL = localStorage.getItem('medix_api_url') || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ServerConfigService = {
  getApiUrl: () => API_BASE_URL,
  setApiUrl: (url: string) => {
    localStorage.setItem('medix_api_url', url);
  },
  testConnection: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/health');
      return res.status === 200;
    } catch {
      return false;
    }
  },
};

// Servicios REST listos para conectar cuando tengas los endpoints de tus prácticas
export const PatientService = {
  getAll: async (): Promise<Patient[]> => {
    const res = await apiClient.get<Patient[]>('/patients');
    return res.data;
  },
  getById: async (id: string): Promise<Patient> => {
    const res = await apiClient.get<Patient>(`/patients/${id}`);
    return res.data;
  },
  create: async (patient: Omit<Patient, 'id' | 'createdAt' | 'medicalRecordNumber' | 'clinicalHistory'>): Promise<Patient> => {
    const res = await apiClient.post<Patient>('/patients', patient);
    return res.data;
  },
  update: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.put<Patient>(`/patients/${id}`, updates);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },
  addClinicalEntry: async (patientId: string, entry: Omit<ClinicalEntry, 'id' | 'date'>): Promise<ClinicalEntry> => {
    const res = await apiClient.post<ClinicalEntry>(`/patients/${patientId}/clinical-entries`, entry);
    return res.data;
  },
};

export const AppointmentService = {
  getAll: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<Appointment[]>('/appointments');
    return res.data;
  },
  create: async (apt: Omit<Appointment, 'id' | 'ticketNumber' | 'status'>): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>('/appointments', apt);
    return res.data;
  },
  updateStatus: async (id: string, status: string): Promise<void> => {
    await apiClient.patch(`/appointments/${id}/status`, { status });
  },
};

export const StockService = {
  getAll: async (): Promise<StockItem[]> => {
    const res = await apiClient.get<StockItem[]>('/stock');
    return res.data;
  },
  addMovement: async (itemId: string, movement: any): Promise<void> => {
    await apiClient.post(`/stock/${itemId}/movements`, movement);
  },
};

export const BedService = {
  getAll: async (): Promise<HospitalBed[]> => {
    const res = await apiClient.get<HospitalBed[]>('/beds');
    return res.data;
  },
  assign: async (bedId: string, data: any): Promise<void> => {
    await apiClient.post(`/beds/${bedId}/assign`, data);
  },
  release: async (bedId: string): Promise<void> => {
    await apiClient.post(`/beds/${bedId}/release`);
  },
};
