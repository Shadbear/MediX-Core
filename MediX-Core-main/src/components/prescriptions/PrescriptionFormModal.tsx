import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Prescription, MedicationPrescription } from '../../types/hospital';
import { FileText, Plus, Trash2, Pill, Clock, User, Stethoscope } from 'lucide-react';
import { computeDailyTimes } from '../../utils/formatters';

interface PrescriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionFormModal: React.FC<PrescriptionFormModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addPrescription, patients, staff } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [patientName, setPatientName] = useState(
    patients[0] ? `${patients[0].firstName} ${patients[0].lastName}` : ''
  );
  const [patientDni, setPatientDni] = useState(patients[0]?.dni || '');
  const [patientPhone, setPatientPhone] = useState(patients[0]?.phone || '');

  const [selectedDoctorId, setSelectedDoctorId] = useState(staff[0]?.id || '');
  const [doctorName, setDoctorName] = useState(staff[0]?.name || '');
  const [doctorCmp, setDoctorCmp] = useState(staff[0]?.cmp || 'CMP 45192');
  const [specialty, setSpecialty] = useState(staff[0]?.specialty || 'Medicina General');

  const [diagnosis, setDiagnosis] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [generalRecommendations, setGeneralRecommendations] = useState(
    'Completar el tratamiento completo. Tomar los medicamentos con abundante agua después de los alimentos.'
  );

  // Medications list
  const [medications, setMedications] = useState<MedicationPrescription[]>([
    {
      id: `med-${Date.now()}`,
      name: 'Paracetamol',
      concentration: '500 mg',
      form: 'Tableta',
      dose: '1 tableta vía oral',
      frequencyHours: 8,
      durationDays: 3,
      instructions: 'Tomar cada 8 horas condicional a dolor o fiebre.',
      calculatedTimes: computeDailyTimes(8),
    },
  ]);

  const handlePatientChange = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find((pat) => pat.id === pId);
    if (p) {
      setPatientName(`${p.firstName} ${p.lastName}`);
      setPatientDni(p.dni);
      setPatientPhone(p.phone);
    }
  };

  const handleDoctorChange = (dId: string) => {
    setSelectedDoctorId(dId);
    const doc = staff.find((d) => d.id === dId);
    if (doc) {
      setDoctorName(doc.name);
      setDoctorCmp(doc.cmp || 'CMP Registrado');
      setSpecialty(doc.specialty || 'Medicina General');
    }
  };

  const addMedicationRow = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: '',
        concentration: '',
        form: 'Tableta',
        dose: '1 tableta',
        frequencyHours: 8,
        durationDays: 5,
        instructions: '',
        calculatedTimes: computeDailyTimes(8),
      },
    ]);
  };

  const removeMedicationRow = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof MedicationPrescription, value: unknown) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };
          if (field === 'frequencyHours') {
            updated.calculatedTimes = computeDailyTimes(Number(value));
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !diagnosis.trim() || medications.length === 0) return;

    addPrescription({
      patientId: selectedPatientId,
      patientName,
      patientDni,
      patientPhone,
      doctorId: selectedDoctorId,
      doctorName,
      doctorCmp,
      specialty,
      diagnosis,
      medications,
      generalRecommendations,
      validUntil,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emitir Nueva Receta Médica Digital"
      subtitle="Genera horarios de toma automáticos y enlace de recordatorio de WhatsApp"
      icon={<FileText className="w-5 h-5 text-hospital-600" />}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Patient & Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paciente *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} (DNI: {p.dni})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Médico Emisor *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {staff.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Diagnóstico / Indicación Médica *
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ej: Faringoamigdalitis aguda bacteriana (J03)"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Válido Hasta
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Medications List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-hospital-600" /> Prescripción de Medicamentos ({medications.length})
            </h4>
            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1.5 rounded-lg bg-hospital-50 dark:bg-hospital-950/50 text-hospital-700 dark:text-hospital-300 hover:bg-hospital-100 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Medicamento
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-hospital-600">
                    Medicamento #{index + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(med.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre del Medicamento *
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                      placeholder="Ej: Amoxicilina + Ácido Clavulánico"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Concentración
                    </label>
                    <input
                      type="text"
                      value={med.concentration}
                      onChange={(e) => updateMedication(med.id, 'concentration', e.target.value)}
                      placeholder="Ej: 500 mg / 125 mg"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Presentación
                    </label>
                    <select
                      value={med.form}
                      onChange={(e) => updateMedication(med.id, 'form', e.target.value as MedicationPrescription['form'])}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Tableta">Tableta</option>
                      <option value="Cápsula">Cápsula</option>
                      <option value="Jarabe">Jarabe</option>
                      <option value="Ampolla">Ampolla</option>
                      <option value="Gotas">Gotas</option>
                      <option value="Pomada">Pomada</option>
                      <option value="Inhalador">Inhalador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Dosis por toma
                    </label>
                    <input
                      type="text"
                      value={med.dose}
                      onChange={(e) => updateMedication(med.id, 'dose', e.target.value)}
                      placeholder="Ej: 1 tableta"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Frecuencia (Horas)
                    </label>
                    <select
                      value={med.frequencyHours}
                      onChange={(e) => updateMedication(med.id, 'frequencyHours', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    >
                      <option value={4}>Cada 4 horas (6 v/día)</option>
                      <option value={6}>Cada 6 horas (4 v/día)</option>
                      <option value={8}>Cada 8 horas (3 v/día)</option>
                      <option value={12}>Cada 12 horas (2 v/día)</option>
                      <option value={24}>Cada 24 horas (1 v/día)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Duración (Días)
                    </label>
                    <input
                      type="number"
                      value={med.durationDays}
                      onChange={(e) => updateMedication(med.id, 'durationDays', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Horarios Calculados
                    </label>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-[11px] font-bold text-hospital-600">
                      {med.calculatedTimes.join(', ')}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Instrucciones específicas
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                      placeholder="Ej: Tomar con alimentos para evitar irritación gástrica."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General recommendations */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Recomendaciones Generales e Higiénico-Dietéticas
          </label>
          <textarea
            rows={2}
            value={generalRecommendations}
            onChange={(e) => setGeneralRecommendations(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
          >
            Generar Receta y Recordatorio
          </button>
        </div>
      </form>
    </Modal>
  );
};
