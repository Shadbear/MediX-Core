import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { StaffMember } from '../../types/hospital';
import {
  PhoneCall,
  Search,
  Mail,
  Phone,
  Stethoscope,
  Building2,
  Clock,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const MedicalDirectory: React.FC = () => {
  const { staff } = useHospital();

  const [search, setSearch] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredStaff = staff.filter((member) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      member.name.toLowerCase().includes(q) ||
      (member.specialty && member.specialty.toLowerCase().includes(q)) ||
      member.department.toLowerCase().includes(q) ||
      member.extension.includes(q) ||
      member.phone.includes(q) ||
      member.email.toLowerCase().includes(q);

    const matchesShift = filterShift === 'ALL' || member.currentShift === filterShift;
    const matchesRole = filterRole === 'ALL' || member.role === filterRole;

    return matchesSearch && matchesShift && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-hospital-600 text-white shadow-md shadow-hospital-600/20">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Directorio Médico y Anexos Telefónicos Internos
            </h2>
            <p className="text-xs text-slate-500">
              Buscador rápido de anexos, correos, turnos y especialidades del personal hospitalario
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por médico, especialidad, servicio o anexo (ej: 204)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>

          <div>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Turnos / Guardias</option>
              <option value="Turno Mañana">Turno Mañana</option>
              <option value="Turno Tarde">Turno Tarde</option>
              <option value="Guardia 24h">Guardia 24h</option>
              <option value="Fuera de Servicio">Fuera de Servicio</option>
            </select>
          </div>

          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Cargos</option>
              <option value="Médico Especialista">Médico Especialista</option>
              <option value="Médico General">Médico General</option>
              <option value="Lic. Enfermería">Lic. Enfermería</option>
              <option value="Técnico de Enfermería">Técnico de Enfermería</option>
              <option value="Personal Administrativo">Personal Administrativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header card with extension pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-hospital-50 dark:bg-hospital-950/50 text-hospital-600 dark:text-hospital-400 font-extrabold text-base flex items-center justify-center border border-hospital-200 dark:border-hospital-800 shrink-0">
                    {member.name.split(' ')[0][0]}{member.name.split(' ')[1] ? member.name.split(' ')[1][0] : ''}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {member.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-hospital-600 dark:text-hospital-400">
                      {member.specialty || member.role}
                    </p>
                    {member.cmp && (
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">
                        {member.cmp}
                      </p>
                    )}
                  </div>
                </div>

                {/* Big Extension Pill */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center min-w-[50px] shadow-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Anexo</span>
                  <span className="font-mono text-base font-black text-hospital-600 dark:text-hospital-400">
                    {member.extension}
                  </span>
                </div>
              </div>

              {/* Department & Consulting Room */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
                  <span className="truncate">{member.department}</span>
                </div>

                {member.consultingRoom && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{member.consultingRoom}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.schedule}</span>
                </div>
              </div>

              {/* Contact Direct Links */}
              <div className="text-xs space-y-1 pt-1">
                <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{member.phone}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </p>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Badge
                variant={
                  member.currentShift === 'Guardia 24h'
                    ? 'danger'
                    : member.currentShift === 'Turno Mañana' || member.currentShift === 'Turno Tarde'
                    ? 'success'
                    : 'neutral'
                }
                size="sm"
                dot
              >
                {member.currentShift}
              </Badge>

              <a
                href={`tel:${member.phone}`}
                className="px-3 py-1.5 rounded-lg bg-hospital-50 hover:bg-hospital-100 text-hospital-700 dark:bg-hospital-950/40 dark:text-hospital-300 text-xs font-semibold flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Llamar
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
