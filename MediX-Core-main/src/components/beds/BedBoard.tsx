import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { HospitalBed, BedWard, BedStatus } from '../../types/hospital';
import {
  Bed,
  User,
  Stethoscope,
  Calendar,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { BedAssignModal } from './BedAssignModal';

export const BedBoard: React.FC = () => {
  const { beds, releaseBed, updateBedStatus } = useHospital();

  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [bedToAssign, setBedToAssign] = useState<HospitalBed | null>(null);

  const wards: BedWard[] = [
    'Emergencias',
    'UCI',
    'Medicina Mujeres',
    'Medicina Varones',
    'Cirugía',
    'Pediatría',
  ];

  const totalBeds = beds.length;
  const occupiedCount = beds.filter((b) => b.status === 'Ocupada').length;
  const freeCount = beds.filter((b) => b.status === 'Libre').length;
  const cleaningCount = beds.filter((b) => b.status === 'En Limpieza' || b.status === 'En Mantenimiento').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  const filteredBeds = beds.filter((bed) => {
    const matchesWard = selectedWard === 'ALL' || bed.ward === selectedWard;
    const matchesStatus = selectedStatus === 'ALL' || bed.status === selectedStatus;
    return matchesWard && matchesStatus;
  });

  const handleDischarge = (bedId: string, patientName?: string) => {
    if (window.confirm(`¿Confirmar Alta Hospitalaria para el paciente ${patientName || ''}? La cama pasará a estado 'En Limpieza'.`)) {
      releaseBed(bedId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Gestión de Camas Hospitalarias (Bed Board en Tiempo Real)
            </h2>
            <p className="text-xs text-slate-500">
              Monitoreo y asignación de camas por pabellones, unidades críticas y hospitalización
            </p>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Tasa de Ocupación</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{occupancyRate}%</p>
          <p className="text-[11px] text-slate-500">{occupiedCount} de {totalBeds} camas ocupadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 shadow-sm">
          <p className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase text-[10px]">Camas Disponibles</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{freeCount}</p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Listas para ingreso inmediato</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 shadow-sm">
          <p className="text-rose-700 dark:text-rose-400 font-semibold uppercase text-[10px]">Camas Ocupadas</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{occupiedCount}</p>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">Con paciente asignado</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 shadow-sm">
          <p className="text-amber-700 dark:text-amber-400 font-semibold uppercase text-[10px]">En Limpieza / Mant.</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{cleaningCount}</p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">Desinfección o reparación</p>
        </div>
      </div>

      {/* Ward Navigation Tabs & Status Filter */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Ward Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setSelectedWard('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedWard === 'ALL'
                ? 'bg-hospital-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos los Pabellones ({totalBeds})
          </button>
          {wards.map((ward) => {
            const countInWard = beds.filter((b) => b.ward === ward).length;
            const occupiedInWard = beds.filter((b) => b.ward === ward && b.status === 'Ocupada').length;

            return (
              <button
                key={ward}
                onClick={() => setSelectedWard(ward)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedWard === ward
                    ? 'bg-hospital-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{ward}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedWard === ward
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}
                >
                  {occupiedInWard}/{countInWard}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Status Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold">Filtrar Estado:</span>
          {['ALL', 'Libre', 'Ocupada', 'En Limpieza', 'En Mantenimiento', 'Reservada'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'Ocupada';
          const isCleaning = bed.status === 'En Limpieza';
          const isMaintenance = bed.status === 'En Mantenimiento';
          const isFree = bed.status === 'Libre';

          return (
            <div
              key={bed.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                isOccupied
                  ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60'
                  : isCleaning
                  ? 'bg-amber-50/50 dark:bg-slate-900 border-amber-300 dark:border-amber-900/60'
                  : isMaintenance
                  ? 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                  : 'bg-emerald-50/40 dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                      {bed.bedNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold block">
                      {bed.ward} • {bed.floor}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{bed.type}</span>
                  </div>

                  <Badge
                    variant={
                      isOccupied
                        ? 'danger'
                        : isCleaning
                        ? 'warning'
                        : isMaintenance
                        ? 'neutral'
                        : 'success'
                    }
                    size="sm"
                    dot
                  >
                    {bed.status}
                  </Badge>
                </div>

                {/* Patient / Occupancy Information */}
                {isOccupied && (
                  <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-rose-600" />
                      {bed.patientName}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>DNI:</strong> {bed.patientDni}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Dx:</strong> {bed.diagnosis}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      <strong>Médico:</strong> {bed.doctorInCharge}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Ingreso: {bed.admissionDate}
                    </p>
                  </div>
                )}

                {isCleaning && (
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1 text-amber-800 dark:text-amber-300">
                    <p className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Requiere Desinfección
                    </p>
                    <p className="text-[11px] opacity-80">{bed.notes || 'Limpieza terminal en curso.'}</p>
                  </div>
                )}

                {isFree && (
                  <div className="py-4 text-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    ✨ Cama lista y disponible para asignación.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs mt-3">
                {isFree && (
                  <button
                    onClick={() => setBedToAssign(bed)}
                    className="w-full py-2 px-3 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    Asignar Paciente
                  </button>
                )}

                {isOccupied && (
                  <button
                    onClick={() => handleDischarge(bed.id, bed.patientName)}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Dar Alta Hospitalaria
                  </button>
                )}

                {isCleaning && (
                  <button
                    onClick={() => updateBedStatus(bed.id, 'Libre', 'Cama desinfectada y lista.')}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar como Limpia / Libre
                  </button>
                )}

                {isMaintenance && (
                  <button
                    onClick={() => updateBedStatus(bed.id, 'En Limpieza')}
                    className="w-full py-2 px-3 bg-slate-800 text-white font-bold rounded-xl shadow-sm"
                  >
                    Finalizar Mantenimiento
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BedAssignModal
        isOpen={!!bedToAssign}
        onClose={() => setBedToAssign(null)}
        bed={bedToAssign}
      />
    </div>
  );
};
