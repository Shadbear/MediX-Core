import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { VisitorLog } from '../../types/hospital';
import {
  UserCheck,
  Plus,
  Search,
  LogOut,
  Printer,
  Shield,
  Clock,
  User,
  Bed,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatDate } from '../../utils/formatters';

export const VisitorLogView: React.FC = () => {
  const { visitors, checkinVisitor, checkoutVisitor, patients, beds } = useHospital();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [visitorToPrint, setVisitorToPrint] = useState<VisitorLog | null>(null);

  // Checkin form states
  const [visitorDni, setVisitorDni] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [relationship, setRelationship] = useState('Familiar');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [securityGuard, setSecurityGuard] = useState('Vigilante Juan Pérez (Garita Principal)');

  // Hospitalized patients
  const hospitalizedPatients = patients.filter((p) => p.status === 'Hospitalizado');

  const filteredVisitors = visitors.filter((v) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.visitorName.toLowerCase().includes(q) ||
      v.visitorDni.includes(q) ||
      v.patientName.toLowerCase().includes(q) ||
      v.passCode.toLowerCase().includes(q);

    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeVisitorsCount = visitors.filter((v) => v.status === 'En Hospital').length;

  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorDni.trim() || !visitorName.trim() || !selectedPatientId) return;

    const patient = patients.find((p) => p.id === selectedPatientId);
    const assignedBed = beds.find((b) => b.patientId === selectedPatientId);

    const newPass = checkinVisitor({
      visitorDni: visitorDni.trim(),
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim() || '987654321',
      relationship,
      patientId: selectedPatientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente',
      bedNumber: assignedBed ? assignedBed.bedNumber : 'Pabellón Central',
      ward: assignedBed ? assignedBed.ward : 'Hospitalización',
      securityGuard,
    });

    setIsCheckinOpen(false);
    setVisitorDni('');
    setVisitorName('');
    setVisitorPhone('');

    // Offer to print pass
    setVisitorToPrint(newPass);
  };

  const handlePrintPass = (v: VisitorLog) => {
    setVisitorToPrint(v);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Registro y Control de Visitas a Pacientes
            </h2>
            <p className="text-xs text-slate-500">
              Control de seguridad para el ingreso y salida de familiares a hospitalización
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCheckinOpen(true)}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Registrar Ingreso de Visita
        </button>
      </div>

      {/* Counter Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase text-[10px]">Visitas Dentro del Hospital</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeVisitorsCount}</p>
          </div>
          <UserCheck className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Total Registros Hoy</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{visitors.length}</p>
          </div>
          <Clock className="w-8 h-8 text-slate-400 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-hospital-50 dark:bg-hospital-950/30 border border-hospital-200 dark:border-hospital-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-hospital-700 dark:text-hospital-400 font-semibold uppercase text-[10px]">Aforo Máximo Permitido</p>
            <p className="text-2xl font-black text-hospital-600 dark:text-hospital-400 mt-1">2 por Cama</p>
          </div>
          <Shield className="w-8 h-8 text-hospital-500 opacity-60" />
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por DNI, familiar, paciente o código de pase..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="En Hospital">En Hospital (Activo)</option>
              <option value="Salida Registrada">Salida Registrada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No se encontraron registros de visitas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Pase / Familiar</th>
                  <th className="px-4 py-3.5">DNI / Teléfono</th>
                  <th className="px-4 py-3.5">Paciente a Visitar</th>
                  <th className="px-4 py-3.5">Cama / Pabellón</th>
                  <th className="px-4 py-3.5">Horario Ingreso / Salida</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVisitors.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-hospital-600 block text-xs">
                        {v.passCode}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {v.visitorName}
                      </span>
                      <span className="text-[10px] text-slate-400">{v.relationship}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                        DNI: {v.visitorDni}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{v.visitorPhone}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {v.patientName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-purple-600 dark:text-purple-400 block font-mono">
                        {v.bedNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">{v.ward}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <span className="text-slate-800 dark:text-slate-200 block">
                        Entrada: {v.entryTime}
                      </span>
                      {v.exitTime ? (
                        <span className="text-slate-500 block">Salida: {v.exitTime}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold block">En el hospital</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={v.status === 'En Hospital' ? 'success' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {v.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'En Hospital' && (
                          <button
                            onClick={() => checkoutVisitor(v.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Registrar Salida de Garita"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Salida</span>
                          </button>
                        )}

                        <button
                          onClick={() => handlePrintPass(v)}
                          title="Imprimir Pase de Visita"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
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

      {/* Checkin Modal */}
      {isCheckinOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCheckinOpen(false)}
          title="Registrar Ingreso de Visita"
          subtitle="Control de seguridad y asignación de pase de visita a cama"
          icon={<UserCheck className="w-5 h-5 text-hospital-600" />}
          maxWidth="md"
        >
          <form onSubmit={handleCheckin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                DNI del Familiar / Visitante *
              </label>
              <input
                type="text"
                value={visitorDni}
                onChange={(e) => setVisitorDni(e.target.value)}
                placeholder="Ej: 44819203"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombres y Apellidos del Visitante *
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Ej: Manuel Quispe"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="965412388"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parentesco
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Hijo(a)">Hijo(a)</option>
                  <option value="Padre / Madre">Padre / Madre</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Hermano(a)">Hermano(a)</option>
                  <option value="Familiar">Otro Familiar</option>
                  <option value="Abogado / Apoderado">Apoderado Legal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paciente Hospitalizado a Visitar *
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              >
                <option value="">-- Seleccionar Paciente Hospitalizado --</option>
                {hospitalizedPatients.map((p) => {
                  const b = beds.find((bed) => bed.patientId === p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} • Cama: {b?.bedNumber || 'Hospitalización'} ({b?.ward || 'General'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCheckinOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
              >
                Generar Pase de Visita
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Visitor Pass */}
      {visitorToPrint && (
        <div className="hidden printable-area text-center p-6 border-2 border-black max-w-xs mx-auto font-mono">
          <h3 className="font-bold text-base">HOSPITAL MEDIX</h3>
          <p className="text-xs">PASE OFICIAL DE VISITA</p>
          <div className="my-2 border-t border-b border-black py-2">
            <p className="text-2xl font-black">{visitorToPrint.passCode}</p>
          </div>
          <div className="text-left text-xs space-y-1 my-3">
            <p><strong>Visitante:</strong> {visitorToPrint.visitorName}</p>
            <p><strong>DNI:</strong> {visitorToPrint.visitorDni}</p>
            <p><strong>Parentesco:</strong> {visitorToPrint.relationship}</p>
            <p><strong>Paciente:</strong> {visitorToPrint.patientName}</p>
            <p><strong>Cama:</strong> {visitorToPrint.bedNumber}</p>
            <p><strong>Pabellón:</strong> {visitorToPrint.ward}</p>
            <p><strong>Ingreso:</strong> {visitorToPrint.entryTime}</p>
          </div>
          <p className="text-[10px] border-t border-black pt-2">
            Portar este pase de manera visible durante toda la visita.
          </p>
        </div>
      )}
    </div>
  );
};
