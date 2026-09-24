import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { StaffMember, StaffAttendance } from '../../types/hospital';
import {
  Clock,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Printer,
  User,
  Stethoscope,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { generateBarcodeSvgString } from '../../utils/qrBarcode';

export const AttendanceScanner: React.FC = () => {
  const { staff, attendance, recordAttendance } = useHospital();

  const [inputCode, setInputCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; record?: StaffAttendance } | null>(null);
  const [selectedStaffForBadge, setSelectedStaffForBadge] = useState<StaffMember | null>(null);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const res = recordAttendance(inputCode);
    setScanResult(res);
    setInputCode('');
  };

  const handleQuickMark = (code: string) => {
    const res = recordAttendance(code);
    setScanResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Control de Asistencia del Personal Médico
            </h2>
            <p className="text-xs text-slate-500">
              Sistema de marcación rápida mediante lector de código de barras o fotocheck institucional
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Console */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-hospital-50 dark:bg-hospital-950/50 text-hospital-600 flex items-center justify-center mx-auto shadow-inner">
            <Scan className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Terminal de Marcación Rápida
            </h3>
            <p className="text-xs text-slate-500">
              Escanea el fotocheck del médico o ingresa su DNI / Código de empleado
            </p>
          </div>

          {/* Scanner Input */}
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Escanear fotocheck o ingresar DNI (Ej: 10482910)..."
              autoFocus
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-hospital-500 font-mono text-sm text-center font-bold focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-hospital-600 hover:bg-hospital-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
            >
              Registrar Marcación
            </button>
          </form>

          {/* Feedback Message */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-center gap-2.5 animate-fadeIn ${
                scanResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{scanResult.message}</span>
            </div>
          )}
        </div>

        {/* Quick Staff Fast-Click Simulation */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
            O haz clic rápido sobre cualquier miembro del personal para simular marcación:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {staff.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleQuickMark(member.badgeCode)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-hospital-50 dark:hover:bg-hospital-950/30 border border-slate-200 dark:border-slate-700 hover:border-hospital-400 text-left transition-all text-xs group"
              >
                <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-hospital-600">
                  {member.name.split(' ')[0]} {member.name.split(' ')[1] || ''}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{member.role}</p>
                <span className="font-mono text-[9px] font-bold text-hospital-600 dark:text-hospital-400 mt-1 block">
                  {member.badgeCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
          <span>Registro de Asistencia del Día (Hoy)</span>
          <Badge variant="primary" size="sm">{attendance.length} Marcaciones</Badge>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Personal</th>
                <th className="px-4 py-3">Cargo / Servicio</th>
                <th className="px-4 py-3 font-mono">Entrada</th>
                <th className="px-4 py-3 font-mono">Inicio Refrig.</th>
                <th className="px-4 py-3 font-mono">Fin Refrig.</th>
                <th className="px-4 py-3 font-mono">Salida</th>
                <th className="px-4 py-3">Puntualidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendance.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {att.staffName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {att.staffRole} • {att.department}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                    {att.checkIn || '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {att.breakStart || '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {att.breakEnd || '-'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-rose-600">
                    {att.checkOut || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={att.status === 'Puntual' ? 'success' : 'danger'}
                      size="sm"
                      dot
                    >
                      {att.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
