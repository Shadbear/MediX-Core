import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Appointment, AppointmentStatus } from '../../types/hospital';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Volume2,
  Phone,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Stethoscope,
  Filter,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate, generateWhatsAppAppointmentUrl } from '../../utils/formatters';
import { AppointmentFormModal } from './AppointmentFormModal';

export const AppointmentCalendar: React.FC = () => {
  const { appointments, updateAppointmentStatus, callPatientTurn, staff } = useHospital();

  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Specialties list
  const specialties = Array.from(new Set(appointments.map((a) => a.specialty))).filter(Boolean);

  const filteredAppointments = appointments.filter((apt) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.patientDni.includes(q) ||
      apt.ticketNumber.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q);

    const matchesSpecialty = filterSpecialty === 'ALL' || apt.specialty === filterSpecialty;
    const matchesStatus = filterStatus === 'ALL' || apt.status === filterStatus;
    const matchesDate = !filterDate || apt.date === filterDate;

    return matchesSearch && matchesSpecialty && matchesStatus && matchesDate;
  });

  const handleCall = async (apt: Appointment) => {
    await callPatientTurn(
      apt.ticketNumber,
      apt.patientName,
      apt.consultingRoom,
      apt.doctorName,
      apt.specialty
    );
  };

  const handleWhatsAppNotify = (apt: Appointment) => {
    const url = generateWhatsAppAppointmentUrl(
      apt.patientPhone,
      apt.patientName,
      apt.doctorName,
      apt.specialty,
      apt.date,
      apt.time,
      apt.consultingRoom,
      apt.ticketNumber
    );
    window.open(url, '_blank');
  };

  const handlePrintTicket = (apt: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Cita - ${apt.ticketNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; }
            .ticket { border: 2px dashed #000; padding: 20px; max-width: 300px; margin: 0 auto; }
            .huge { font-size: 32px; font-weight: bold; margin: 10px 0; }
            hr { border-top: 1px dashed #000; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h3>HOSPITAL REGIONAL - MEDIX</h3>
            <p>TICKET DE CITA MÉDICA</p>
            <hr/>
            <div class="huge">${apt.ticketNumber}</div>
            <p><strong>Paciente:</strong> ${apt.patientName}</p>
            <p><strong>DNI:</strong> ${apt.patientDni}</p>
            <p><strong>Especialidad:</strong> ${apt.specialty}</p>
            <p><strong>Médico:</strong> ${apt.doctorName}</p>
            <p><strong>Consultorio:</strong> ${apt.consultingRoom}</p>
            <p><strong>Fecha y Hora:</strong> ${formatDate(apt.date)} - ${apt.time}</p>
            <hr/>
            <p><small>Por favor llegar 15 minutos antes. Espere su llamado en pantalla.</small></p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Agendamiento y Gestión de Citas
            </h2>
            <p className="text-xs text-slate-500">
              Control de turnos, reserva médica y notificación por WhatsApp
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agendar Cita
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente, DNI, ticket..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todas las Especialidades</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
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
              <option value="Pendiente">Pendiente</option>
              <option value="En Sala de Espera">En Sala de Espera</option>
              <option value="Llamado">Llamado</option>
              <option value="En Atención">En Atención</option>
              <option value="Atendida">Atendida</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          {/* Date Filter */}
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

      {/* Appointments List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No se encontraron citas médicas con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Turno / Hora</th>
                  <th className="px-4 py-3.5">Paciente</th>
                  <th className="px-4 py-3.5">Especialidad / Médico</th>
                  <th className="px-4 py-3.5">Consultorio</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
                          {apt.ticketNumber}
                        </span>
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {apt.time}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(apt.date)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {apt.patientName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        DNI: {apt.patientDni} • {apt.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-hospital-600 dark:text-hospital-400 block">
                        {apt.specialty}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {apt.doctorName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {apt.consultingRoom}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={apt.reason}>
                        {apt.reason}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <select
                        value={apt.status}
                        onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Sala de Espera">En Sala de Espera</option>
                        <option value="Llamado">Llamado</option>
                        <option value="En Atención">En Atención</option>
                        <option value="Atendida">Atendida</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Call Turn button */}
                        <button
                          onClick={() => handleCall(apt)}
                          title="Llamar Turno con Audio y Voz"
                          className="px-2.5 py-1.5 rounded-lg bg-hospital-600 hover:bg-hospital-700 text-white font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Llamar</span>
                        </button>

                        {/* WhatsApp Button */}
                        <button
                          onClick={() => handleWhatsAppNotify(apt)}
                          title="Enviar Recordatorio por WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Print Ticket */}
                        <button
                          onClick={() => handlePrintTicket(apt)}
                          title="Imprimir Ticket de Cita"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};
