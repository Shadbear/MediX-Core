import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Appointment } from '../../types/hospital';
import { Calendar, User, Stethoscope, Clock, FileText } from 'lucide-react';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: Appointment | null;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  appointmentToEdit,
}) => {
  const { addAppointment, patients, staff } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientDni, setPatientDni] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState(staff[0]?.id || 'doc-04');
  const [doctorName, setDoctorName] = useState(staff[0]?.name || '');
  const [specialty, setSpecialty] = useState(staff[0]?.specialty || 'Medicina General');
  const [consultingRoom, setConsultingRoom] = useState(staff[0]?.consultingRoom || 'Consultorio 03');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<Appointment['type']>('Primera Vez');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (staff.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(staff[0].id);
      setDoctorName(staff[0].name);
      setSpecialty(staff[0].specialty || 'Medicina General');
      setConsultingRoom(staff[0].consultingRoom || 'Consultorio 01');
    }
  }, [staff, selectedDoctorId]);

  const handlePatientSelect = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find((pat) => pat.id === pId);
    if (p) {
      setPatientName(`${p.firstName} ${p.lastName}`);
      setPatientDni(p.dni);
      setPatientPhone(p.phone);
    }
  };

  const handleDoctorSelect = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = staff.find((d) => d.id === docId);
    if (doc) {
      setDoctorName(doc.name);
      setSpecialty(doc.specialty || 'Medicina General');
      setConsultingRoom(doc.consultingRoom || 'Consultorio 01');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientDni.trim() || !doctorName.trim()) return;

    addAppointment({
      patientId: selectedPatientId || `pat-temp-${Date.now()}`,
      patientName: patientName.trim(),
      patientDni: patientDni.trim(),
      patientPhone: patientPhone.trim() || '987654321',
      doctorId: selectedDoctorId,
      doctorName,
      specialty,
      consultingRoom,
      date,
      time,
      type,
      reason: reason.trim() || 'Consulta médica general',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Nueva Cita Médica"
      subtitle="Reserva de turnos con médicos generales y especialistas"
      icon={<Calendar className="w-5 h-5 text-hospital-600" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Patient Selection */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-hospital-600" /> Datos del Paciente
          </h4>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Buscar en Pacientes Registrados
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <option value="">-- Seleccionar o escribir manualmente abajo --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.medicalRecordNumber} • {p.firstName} {p.lastName} (DNI: {p.dni})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                DNI *
              </label>
              <input
                type="text"
                value={patientDni}
                onChange={(e) => setPatientDni(e.target.value)}
                placeholder="45892019"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombres Completos *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Juan Carlos Gómez"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="987654321"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Doctor and Specialty */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Médico y Consultorio
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Médico Tratante *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                {staff.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty || doc.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Consultorio Asignado
              </label>
              <input
                type="text"
                value={consultingRoom}
                onChange={(e) => setConsultingRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Date, Time and Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de la Cita *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hora de la Cita *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Cita
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Appointment['type'])}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="Primera Vez">Primera Vez</option>
              <option value="Control / Seguimiento">Control / Seguimiento</option>
              <option value="Lectura de Exámenes">Lectura de Exámenes</option>
              <option value="Procedimiento">Procedimiento</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo de Consulta *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Evaluación por dolor torácico, chequeo general o control de presión"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
          >
            Confirmar y Emitir Ticket
          </button>
        </div>
      </form>
    </Modal>
  );
};
