import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Users,
  Bed,
  Activity,
  Calendar,
  AlertTriangle,
  Volume2,
  PlusCircle,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  PhoneCall,
  Clock,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { PatientFormModal } from '../patients/PatientFormModal';

export const HospitalDashboard: React.FC = () => {
  const {
    patients,
    beds,
    triage,
    appointments,
    stock,
    visitors,
    staff,
    currentCalling,
    setActiveModule,
    callPatientTurn,
  } = useHospital();

  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Computed metrics
  const totalPatients = patients.length;
  const hospitalizedCount = patients.filter((p) => p.status === 'Hospitalizado').length;
  const occupiedBeds = beds.filter((b) => b.status === 'Ocupada').length;
  const totalBeds = beds.length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const lowStockItems = stock.filter((s) => s.status === 'Crítico' || s.status === 'Bajo Stock');
  const pendingAppointments = appointments.filter((a) => a.status === 'Pendiente' || a.status === 'En Sala de Espera');
  const activeVisitors = visitors.filter((v) => v.status === 'En Hospital');
  const onDutyStaff = staff.filter((s) => s.currentShift !== 'Fuera de Servicio');

  // Next patient in line to call
  const nextWaitingAppointment = appointments.find((a) => a.status === 'En Sala de Espera') || appointments.find((a) => a.status === 'Pendiente');

  const handleCallNext = async () => {
    if (nextWaitingAppointment) {
      await callPatientTurn(
        nextWaitingAppointment.ticketNumber,
        nextWaitingAppointment.patientName,
        nextWaitingAppointment.consultingRoom,
        nextWaitingAppointment.doctorName,
        nextWaitingAppointment.specialty
      );
    } else {
      setActiveModule('queue');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-hospital-700 via-hospital-600 to-sky-600 text-white overflow-hidden shadow-lg shadow-hospital-600/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sede Central Hospitalaria • Edición Local
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Panel de Control Hospitalario
            </h2>
            <p className="text-hospital-100 text-xs sm:text-sm max-w-xl">
              Sistema integral de triaje, admisión, gestión de camas, turnos de espera, inventario clínico y soporte médico automatizado.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="px-4 py-2.5 bg-white text-hospital-700 hover:bg-hospital-50 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-hospital-600" />
              Nuevo Paciente
            </button>
            <button
              onClick={() => setActiveModule('triage')}
              className="px-4 py-2.5 bg-hospital-800/60 hover:bg-hospital-800 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Activity className="w-4 h-4 text-rose-300" />
              Triaje Preventivo
            </button>
            <button
              onClick={handleCallNext}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Volume2 className="w-4 h-4 text-slate-900" />
              {nextWaitingAppointment ? `Llamar ${nextWaitingAppointment.ticketNumber}` : 'Llamador de Turnos'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Pacientes Registrados"
          value={totalPatients}
          subtitle={`${hospitalizedCount} en hospitalización activa`}
          icon={<Users className="w-6 h-6" />}
          color="hospital"
          onClick={() => setActiveModule('patients')}
        />

        <StatCard
          title="Ocupación de Camas"
          value={`${bedOccupancyRate}%`}
          subtitle={`${occupiedBeds} ocupadas de ${totalBeds} camas`}
          icon={<Bed className="w-6 h-6" />}
          color={bedOccupancyRate > 80 ? 'rose' : 'emerald'}
          onClick={() => setActiveModule('beds')}
        />

        <StatCard
          title="Citas de Hoy"
          value={pendingAppointments.length}
          subtitle="En espera o programadas"
          icon={<Calendar className="w-6 h-6" />}
          color="amber"
          onClick={() => setActiveModule('appointments')}
        />

        <StatCard
          title="Alertas de Insumos"
          value={lowStockItems.length}
          subtitle={lowStockItems.length > 0 ? 'Stock mínimo o crítico' : 'Inventario óptimo'}
          icon={<Boxes className="w-6 h-6" />}
          color={lowStockItems.length > 0 ? 'rose' : 'purple'}
          onClick={() => setActiveModule('stock')}
        />
      </div>

      {/* Main Grid: Waiting Room + Bed Status + Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Waiting Room & Turn Control */}
        <div className="lg:col-span-2 space-y-6">
          {/* Turn Monitor Widget */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-hospital-50 dark:bg-hospital-950/50 text-hospital-600">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Llamador de Turnos en Sala de Espera
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notificación visual y sonora en tiempo real para consultorios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('queue')}
                className="text-xs font-semibold text-hospital-600 dark:text-hospital-400 hover:underline flex items-center gap-1"
              >
                Ver Pantalla Completa <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Calling Highlight */}
            <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-hospital-50 to-sky-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-hospital-200 dark:border-hospital-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              {currentCalling ? (
                <>
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="px-4 py-3 rounded-2xl bg-hospital-600 text-white font-black text-2xl tracking-wider shadow-md shadow-hospital-600/30">
                      {currentCalling.ticket}
                    </div>
                    <div>
                      <Badge variant="primary" size="sm" dot>
                        Llamando Ahora ({currentCalling.callCount}° llamado)
                      </Badge>
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                        {currentCalling.patientName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {currentCalling.consultingRoom} • {currentCalling.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCallNext()}
                      className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm transition-all"
                    >
                      Re-llamar
                    </button>
                    <button
                      onClick={() => setActiveModule('queue')}
                      className="px-3.5 py-2 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Control de Turnos
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center sm:text-left text-xs text-slate-500">
                  No hay llamadas activas en este momento. Haz clic en "Llamador de Turnos" para iniciar.
                </div>
              )}
            </div>

            {/* Upcoming Appointments Queue */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Pacientes en Espera ({pendingAppointments.length})
              </p>
              {pendingAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay pacientes esperando citas para hoy.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {pendingAppointments.slice(0, 4).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {apt.ticketNumber}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{apt.patientName}</p>
                          <p className="text-slate-500">{apt.specialty} • {apt.consultingRoom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono">{apt.time}</span>
                        <button
                          onClick={() =>
                            callPatientTurn(
                              apt.ticketNumber,
                              apt.patientName,
                              apt.consultingRoom,
                              apt.doctorName,
                              apt.specialty
                            )
                          }
                          className="px-2.5 py-1 bg-hospital-600 hover:bg-hospital-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <Volume2 className="w-3 h-3" /> Llamar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hospital Beds Live Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Tablero de Camas Hospitalarias
                  </h3>
                  <p className="text-xs text-slate-500">
                    Disponibilidad por pabellones y áreas críticas en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('beds')}
                className="text-xs font-semibold text-hospital-600 dark:text-hospital-400 hover:underline flex items-center gap-1"
              >
                Gestionar Camas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {['Emergencias', 'UCI', 'Medicina Mujeres', 'Medicina Varones'].map((wardName) => {
                const wardBeds = beds.filter((b) => b.ward === wardName);
                const wardOccupied = wardBeds.filter((b) => b.status === 'Ocupada').length;
                const wardFree = wardBeds.filter((b) => b.status === 'Libre').length;

                return (
                  <div
                    key={wardName}
                    onClick={() => setActiveModule('beds')}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 cursor-pointer hover:border-hospital-400 transition-colors"
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{wardName}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-semibold">{wardFree} Libres</span>
                      <span className="text-rose-600 font-semibold">{wardOccupied} Ocupadas</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${wardBeds.length > 0 ? (wardOccupied / wardBeds.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Stock Alerts + Duty Staff + Active Visitors */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas de Stock ({lowStockItems.length})
              </h3>
              <button
                onClick={() => setActiveModule('stock')}
                className="text-[11px] font-semibold text-hospital-600 hover:underline"
              >
                Ver Kardex
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Todos los insumos y medicamentos se encuentran con stock adecuado.
              </div>
            ) : (
              <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.category} • {item.location}</p>
                      </div>
                      <Badge variant={item.status === 'Crítico' ? 'danger' : 'warning'} size="sm">
                        {item.currentStock} / min {item.minStock}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff on Duty */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Médicos en Guardia / Turno
              </h3>
              <button
                onClick={() => setActiveModule('directory')}
                className="text-[11px] font-semibold text-hospital-600 hover:underline"
              >
                Directorio
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto">
              {onDutyStaff.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">{doc.specialty} • Anexo {doc.extension}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold">
                    {doc.currentShift}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hospital Visitors Quick Count */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-hospital-600" />
                Visitas en Sala / Pabellón
              </h3>
              <button
                onClick={() => setActiveModule('visitors')}
                className="text-[11px] font-semibold text-hospital-600 hover:underline"
              >
                Registro
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeVisitors.length}</p>
                <p className="text-xs text-slate-500">Familiares con pase activo</p>
              </div>
              <button
                onClick={() => setActiveModule('visitors')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Registrar Salida
              </button>
            </div>
          </div>
        </div>
      </div>

      <PatientFormModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
      />
    </div>
  );
};
