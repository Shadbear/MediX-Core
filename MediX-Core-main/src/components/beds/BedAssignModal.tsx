import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { HospitalBed } from '../../types/hospital';
import { Bed, User, Stethoscope, FileText } from 'lucide-react';

interface BedAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: HospitalBed | null;
}

export const BedAssignModal: React.FC<BedAssignModalProps> = ({
  isOpen,
  onClose,
  bed,
}) => {
  const { assignBed, patients, staff } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorInCharge, setDoctorInCharge] = useState(staff[0]?.name || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  if (!bed) return null;

  // Filter patients not currently hospitalized
  const eligiblePatients = patients.filter((p) => p.status !== 'Hospitalizado');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis.trim()) return;

    assignBed(bed.id, selectedPatientId, doctorInCharge, diagnosis.trim(), notes.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar Cama: ${bed.bedNumber}`}
      subtitle={`Pabellón: ${bed.ward} • Tipo: ${bed.type}`}
      icon={<Bed className="w-5 h-5 text-hospital-600" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Seleccionar Paciente a Hospitalizar *
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            required
          >
            <option value="">-- Seleccionar Paciente --</option>
            {eligiblePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} (DNI: {p.dni} • {p.medicalRecordNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Médico Tratante / Responsable *
          </label>
          <select
            value={doctorInCharge}
            onChange={(e) => setDoctorInCharge(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
            Diagnóstico de Ingreso Hospitalario *
          </label>
          <textarea
            rows={2}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Ej: Neumonía adquirida en la comunidad / Crisis hipertensiva"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Indicaciones o Cuidados Especiales
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Posición semifowler, oxigenoterapia por cánula nasal a 3 L/min"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            Confirmar Hospitalización
          </button>
        </div>
      </form>
    </Modal>
  );
};
