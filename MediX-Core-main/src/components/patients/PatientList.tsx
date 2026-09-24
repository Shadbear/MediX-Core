import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Patient, InsuranceType, BloodType, PatientStatus } from '../../types/hospital';
import {
  Users,
  Search,
  Plus,
  FileText,
  Edit,
  Trash2,
  Filter,
  Shield,
  Phone,
  Calendar,
  AlertCircle,
  Activity,
  Bed,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate, calculateAge } from '../../utils/formatters';
import { PatientFormModal } from './PatientFormModal';
import { PatientHistoryModal } from './PatientHistoryModal';

export const PatientList: React.FC = () => {
  const { patients, deletePatient, setActiveModule } = useHospital();

  const [search, setSearch] = useState('');
  const [filterInsurance, setFilterInsurance] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBlood, setFilterBlood] = useState<string>('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [patientForHistory, setPatientForHistory] = useState<Patient | null>(null);

  // Filter logic
  const filteredPatients = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.dni.includes(q) ||
      p.medicalRecordNumber.toLowerCase().includes(q) ||
      p.phone.includes(q);

    const matchesInsurance = filterInsurance === 'ALL' || p.insuranceType === filterInsurance;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesBlood = filterBlood === 'ALL' || p.bloodType === filterBlood;

    return matchesQuery && matchesInsurance && matchesStatus && matchesBlood;
  });

  const handleOpenEdit = (p: Patient) => {
    setPatientToEdit(p);
    setIsFormOpen(true);
  };

  const handleOpenHistory = (p: Patient) => {
    setPatientForHistory(p);
    setIsHistoryOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro de ${name}?`)) {
      deletePatient(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-hospital-600 text-white shadow-md shadow-hospital-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Registro y Admisión de Pacientes
              </h2>
              <p className="text-xs text-slate-500">
                Gestión de historias clínicas y filiación institucional (Inspirado en MEDIX)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setPatientToEdit(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por DNI, Nombres o N° HC..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>

          {/* Insurance Filter */}
          <div>
            <select
              value={filterInsurance}
              onChange={(e) => setFilterInsurance(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Seguros</option>
              <option value="SIS">SIS</option>
              <option value="EsSalud">EsSalud</option>
              <option value="Privado">Privado</option>
              <option value="Particular">Particular</option>
              <option value="SOAT">SOAT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="Activo">Activo (Ambulatorio)</option>
              <option value="Hospitalizado">Hospitalizado</option>
              <option value="En Observación">En Observación</option>
              <option value="De Alta">De Alta</option>
            </select>
          </div>

          {/* Blood Type Filter */}
          <div>
            <select
              value={filterBlood}
              onChange={(e) => setFilterBlood(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Grupos Sanguíneos</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        {/* Status Pills Counter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Mostrando <strong>{filteredPatients.length}</strong> de {patients.length} pacientes</span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-hospital-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-hospital-500" />
            {patients.filter((p) => p.status === 'Activo').length} Activos
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {patients.filter((p) => p.status === 'Hospitalizado').length} Hospitalizados
          </span>
        </div>
      </div>

      {/* Patient Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No se encontraron pacientes con los criterios de búsqueda.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba modificando los filtros o registra un nuevo paciente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">N° Historia / DNI</th>
                  <th className="px-4 py-3.5">Paciente</th>
                  <th className="px-4 py-3.5">Edad / Sexo</th>
                  <th className="px-4 py-3.5">Seguro / Sangre</th>
                  <th className="px-4 py-3.5">Teléfono / Contacto</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPatients.map((patient) => {
                  const age = calculateAge(patient.birthDate);

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-extrabold text-hospital-600 dark:text-hospital-400 block">
                          {patient.medicalRecordNumber}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          DNI: {patient.dni}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {patient.firstName} {patient.lastName}
                        </span>
                        {patient.allergies.length > 0 && patient.allergies[0] !== 'Ninguna' && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block truncate max-w-[180px]">
                            ⚠️ {patient.allergies.join(', ')}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {age} años
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {patient.gender === 'M' ? 'Masculino' : 'Femenino'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {patient.insuranceType}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {patient.bloodType}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-slate-700 dark:text-slate-300 block">
                          {patient.phone}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {patient.emergencyContact.name}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            patient.status === 'Hospitalizado'
                              ? 'danger'
                              : patient.status === 'En Observación'
                              ? 'warning'
                              : patient.status === 'De Alta'
                              ? 'neutral'
                              : 'success'
                          }
                          size="sm"
                          dot
                        >
                          {patient.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenHistory(patient)}
                            title="Ver Historia Clínica"
                            className="px-2.5 py-1.5 rounded-lg bg-hospital-50 hover:bg-hospital-100 dark:bg-hospital-950/50 dark:hover:bg-hospital-900/60 text-hospital-700 dark:text-hospital-300 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Historia ({patient.clinicalHistory?.length || 0})</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(patient)}
                            title="Editar Datos del Paciente"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-hospital-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                            title="Eliminar Paciente"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        patientToEdit={patientToEdit}
      />

      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        patient={patientForHistory}
      />
    </div>
  );
};
