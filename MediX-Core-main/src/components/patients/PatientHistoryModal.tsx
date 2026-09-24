import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Patient, ClinicalEntry } from '../../types/hospital';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  Activity,
  User,
  Shield,
  Heart,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDate, calculateAge } from '../../utils/formatters';
import { Badge } from '../common/Badge';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { addClinicalEntry, staff } = useHospital();
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // New entry form states
  const [doctorName, setDoctorName] = useState(staff[0]?.name || 'Dr. Alejandro Morales Ramos');
  const [specialty, setSpecialty] = useState(staff[0]?.specialty || 'Cardiología');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [cie10Code, setCie10Code] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  // Vital signs
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState(75);
  const [respiratoryRate, setRespiratoryRate] = useState(18);
  const [temperature, setTemperature] = useState(36.5);
  const [oxygenSaturation, setOxygenSaturation] = useState(98);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  if (!patient) return null;

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !treatment.trim()) return;

    addClinicalEntry(patient.id, {
      doctorName,
      specialty,
      symptoms: symptoms.trim() || 'No especificado',
      diagnosis: diagnosis.trim(),
      cie10Code: cie10Code.trim() || undefined,
      vitalSigns: {
        bloodPressure,
        heartRate: Number(heartRate),
        respiratoryRate: Number(respiratoryRate),
        temperature: Number(temperature),
        oxygenSaturation: Number(oxygenSaturation),
        weight: Number(weight),
        height: Number(height),
      },
      treatment: treatment.trim(),
      notes: notes.trim() || undefined,
    });

    setIsAddingEntry(false);
    setSymptoms('');
    setDiagnosis('');
    setCie10Code('');
    setTreatment('');
    setNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  const age = calculateAge(patient.birthDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historia Clínica: ${patient.medicalRecordNumber}`}
      subtitle={`${patient.firstName} ${patient.lastName} • DNI: ${patient.dni}`}
      icon={<FileText className="w-5 h-5 text-hospital-600" />}
      maxWidth="4xl"
    >
      <div className="space-y-6 printable-area">
        {/* Patient Summary Header Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-hospital-50/40 dark:from-slate-800/80 dark:to-hospital-950/20 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {patient.firstName} {patient.lastName}
                </h3>
                <Badge variant="primary" size="sm">
                  {patient.medicalRecordNumber}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                DNI: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{patient.dni}</span> • Edad: {age} años ({formatDate(patient.birthDate)}) • Sexo: {patient.gender === 'M' ? 'Masculino' : 'Femenino'} • Tel: {patient.phone}
              </p>
            </div>

            <div className="flex items-center gap-2 no-print shrink-0">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ficha
              </button>
              <button
                onClick={() => setIsAddingEntry(!isAddingEntry)}
                className="px-3.5 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-hospital-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingEntry ? 'Cerrar Formulario' : 'Nueva Evolución Médica'}
              </button>
            </div>
          </div>

          {/* Quick Clinical Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-bold font-mono text-[10px]">
                {patient.bloodType}
              </span>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Grupo Sanguíneo</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{patient.bloodType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Seguro</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{patient.insuranceType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Alergias</p>
                <p className="font-bold text-rose-600 truncate max-w-[120px]" title={patient.allergies.join(', ')}>
                  {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Ninguna'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Emergencia</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Evolution / Consultation Form */}
        {isAddingEntry && (
          <form
            onSubmit={handleSaveEntry}
            className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-hospital-500 shadow-md space-y-4 no-print animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-sm text-hospital-700 dark:text-hospital-400 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Registrar Nueva Atención / Evolución Clínica
              </h4>
              <span className="text-xs text-slate-400">Fecha: {new Date().toLocaleDateString('es-PE')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Médico Responsable *
                </label>
                <select
                  value={doctorName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDoctorName(name);
                    const doc = staff.find((s) => s.name === name);
                    if (doc?.specialty) setSpecialty(doc.specialty);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  {staff.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código CIE-10 (Opcional)
                </label>
                <input
                  type="text"
                  value={cie10Code}
                  onChange={(e) => setCie10Code(e.target.value)}
                  placeholder="Ej: I10, J00, K80"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Vital Signs Row */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-500" /> Signos Vitales
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500">P.A. (mmHg)</label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">F.C. (lpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">F.R. (rpm)</label>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">SpO2 (%)</label>
                  <input
                    type="number"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-hospital-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Talla (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anamnesis / Síntomas *
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Motivo de consulta, tiempo de enfermedad y síntomas principales..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnóstico Clínico *
                </label>
                <textarea
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Diagnóstico presuntivo o definitivo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan de Tratamiento / Indicaciones *
                </label>
                <textarea
                  rows={2}
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Fármacos prescritos, dosificación, exámenes auxiliares o derivación..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingEntry(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold shadow-md shadow-hospital-600/20"
              >
                Guardar Evolución en Historia Clínica
              </button>
            </div>
          </form>
        )}

        {/* History Entries Timeline */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>Evoluciones Clínicas Registradas ({patient.clinicalHistory?.length || 0})</span>
            <span className="text-[10px] lowercase text-slate-400 font-normal">Orden cronológico</span>
          </h4>

          {!patient.clinicalHistory || patient.clinicalHistory.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Aún no hay atenciones clínicas registradas para este paciente.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Haz clic en "Nueva Evolución Médica" para ingresar la primera consulta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patient.clinicalHistory.map((entry) => {
                const isExpanded = expandedEntryId === entry.id || patient.clinicalHistory.length === 1;

                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-hospital-50 dark:bg-hospital-950/50 text-hospital-600">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {entry.diagnosis}
                            </span>
                            {entry.cie10Code && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                                {entry.cie10Code}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatDate(entry.date)} • {entry.doctorName} ({entry.specialty})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">
                          P.A: {entry.vitalSigns.bloodPressure}
                        </Badge>
                        <span className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                        {/* Vital Signs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px]">
                          <div>
                            <span className="text-slate-400">P. Arterial: </span>
                            <span className="font-bold">{entry.vitalSigns.bloodPressure}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">F. Cardíaca: </span>
                            <span className="font-bold">{entry.vitalSigns.heartRate} lpm</span>
                          </div>
                          <div>
                            <span className="text-slate-400">F. Resp: </span>
                            <span className="font-bold">{entry.vitalSigns.respiratoryRate} rpm</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Temp: </span>
                            <span className="font-bold">{entry.vitalSigns.temperature} °C</span>
                          </div>
                          <div>
                            <span className="text-slate-400">SpO2: </span>
                            <span className="font-bold text-hospital-600">{entry.vitalSigns.oxygenSaturation}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Peso/Talla: </span>
                            <span className="font-bold">{entry.vitalSigns.weight || '-'} kg</span>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Anamnesis / Síntomas:</p>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">{entry.symptoms}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Tratamiento e Indicaciones:</p>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5 bg-hospital-50/50 dark:bg-hospital-950/30 p-2.5 rounded-xl border border-hospital-100 dark:border-hospital-900/40">
                            {entry.treatment}
                          </p>
                        </div>

                        {entry.notes && (
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Observaciones:</p>
                            <p className="text-slate-500 italic mt-0.5">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
