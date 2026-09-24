import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { RoomBooking } from '../../types/hospital';
import {
  DoorOpen,
  Plus,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const RoomScheduler: React.FC = () => {
  const { bookings, addBooking, cancelBooking, staff, patients } = useHospital();

  const [filterRoom, setFilterRoom] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // New Booking Form
  const [roomName, setRoomName] = useState<RoomBooking['roomName']>('Quirófano 1 (Cirugía Mayor)');
  const [selectedDoctorId, setSelectedDoctorId] = useState(staff[2]?.id || staff[0]?.id || '');
  const [procedureName, setProcedureName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientDni, setPatientDni] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [anesthesiologist, setAnesthesiologist] = useState('Dr. Luis Beltrán (Anestesiología)');
  const [nursingStaff, setNursingStaff] = useState('Lic. Miriam Gálvez');
  const [equipmentReq, setEquipmentReq] = useState('Torre de Laparoscopía');

  const filteredBookings = bookings.filter((b) => {
    const matchesRoom = filterRoom === 'ALL' || b.roomName === filterRoom;
    const matchesDate = !filterDate || b.date === filterDate;
    return matchesRoom && matchesDate;
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    const doc = staff.find((s) => s.id === selectedDoctorId);

    const res = addBooking({
      roomName,
      roomType: roomName.includes('Quirófano')
        ? 'Quirófano'
        : roomName.includes('Partos')
        ? 'Sala de Procedimientos'
        : 'Reuniones / Docencia',
      doctorId: selectedDoctorId,
      doctorName: doc ? doc.name : 'Dr. Médico Tratante',
      specialty: doc?.specialty || 'Cirugía General',
      procedureName: procedureName.trim(),
      patientName: patientName.trim() || undefined,
      patientDni: patientDni.trim() || undefined,
      date,
      startTime,
      endTime,
      anesthesiologist: anesthesiologist.trim() || undefined,
      nursingStaff: nursingStaff.trim() || undefined,
      equipmentRequired: equipmentReq ? equipmentReq.split(',').map((s) => s.trim()) : [],
    });

    if (!res.success) {
      setBookingError(res.message);
    } else {
      setIsBookingOpen(false);
      setProcedureName('');
      setPatientName('');
      setPatientDni('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Reserva de Pabellones Quirúrgicos y Salas Médicas
            </h2>
            <p className="text-xs text-slate-500">
              Gestión de horarios, asignación de quirófanos y prevención automática de conflictos
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setBookingError(null);
            setIsBookingOpen(true);
          }}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Reservar Quirófano / Sala
        </button>
      </div>

      {/* Filter and Navigation */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todas las Salas y Quirófanos</option>
              <option value="Quirófano 1 (Cirugía Mayor)">Quirófano 1 (Cirugía Mayor)</option>
              <option value="Quirófano 2 (Laparoscopía)">Quirófano 2 (Laparoscopía)</option>
              <option value="Quirófano 3 (Traumatología)">Quirófano 3 (Traumatología)</option>
              <option value="Sala de Partos">Sala de Partos</option>
              <option value="Auditorio Médico">Auditorio Médico</option>
              <option value="Sala de Juntas">Sala de Juntas</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.map((book) => {
          const isSurgical = book.roomType === 'Quirófano';

          return (
            <div
              key={book.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-hospital-600 dark:text-hospital-400 block">
                      {book.roomType}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {book.roomName}
                    </h3>
                  </div>

                  <Badge
                    variant={book.status === 'Confirmada' ? 'success' : book.status === 'En Curso' ? 'primary' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {book.status}
                  </Badge>
                </div>

                {/* Procedure and Time */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Scissors className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
                    <span>{book.procedureName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(book.date)}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3 h-3 text-slate-400" /> {book.startTime} - {book.endTime}
                    </span>
                  </div>

                  {book.patientName && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <strong>Paciente:</strong> {book.patientName} (DNI: {book.patientDni})
                    </p>
                  )}
                </div>

                {/* Surgical Team */}
                <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <p>
                    <strong>Cirujano:</strong> {book.doctorName}
                  </p>
                  {book.anesthesiologist && (
                    <p>
                      <strong>Anestesia:</strong> {book.anesthesiologist}
                    </p>
                  )}
                  {book.nursingStaff && (
                    <p>
                      <strong>Instrumentista:</strong> {book.nursingStaff}
                    </p>
                  )}
                  {book.equipmentRequired && book.equipmentRequired.length > 0 && (
                    <p className="text-[10px] text-slate-500 truncate">
                      <strong>Equipos:</strong> {book.equipmentRequired.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              {book.status === 'Confirmada' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => cancelBooking(book.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancelar Reserva
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBookingOpen(false)}
          title="Reservar Quirófano o Sala de Reuniones"
          subtitle="Validación automática para evitar solapamientos"
          icon={<DoorOpen className="w-5 h-5 text-hospital-600" />}
          maxWidth="2xl"
        >
          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">Pabellón / Sala a Reservar *</label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value as RoomBooking['roomName'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Quirófano 1 (Cirugía Mayor)">Quirófano 1 (Cirugía Mayor)</option>
                <option value="Quirófano 2 (Laparoscopía)">Quirófano 2 (Laparoscopía)</option>
                <option value="Quirófano 3 (Traumatología)">Quirófano 3 (Traumatología)</option>
                <option value="Sala de Partos">Sala de Partos</option>
                <option value="Auditorio Médico">Auditorio Médico</option>
                <option value="Sala de Juntas">Sala de Juntas</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Médico Responsable / Cirujano *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {staff.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Procedimiento o Motivo *</label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="Ej: Apendicectomía Laparoscópica"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fecha *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Hora Fin *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Paciente (Opcional)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre del paciente a intervenir"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">DNI del Paciente</label>
                <input
                  type="text"
                  value={patientDni}
                  onChange={(e) => setPatientDni(e.target.value)}
                  placeholder="45892019"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Médico Anestesiólogo</label>
                <input
                  type="text"
                  value={anesthesiologist}
                  onChange={(e) => setAnesthesiologist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Equipos Especiales Requeridos</label>
                <input
                  type="text"
                  value={equipmentReq}
                  onChange={(e) => setEquipmentReq(e.target.value)}
                  placeholder="Ej: Arco en C, Laparoscopio"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-sm"
              >
                Validar y Reservar Horario
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
