import React from 'react';
import { useHospital, AppModule } from '../../context/HospitalContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  Calendar,
  Volume2,
  FileText,
  Boxes,
  QrCode,
  Bed,
  UserCheck,
  Clock,
  HeartHandshake,
  DoorOpen,
  Calculator,
  PhoneCall,
  X,
  Hospital,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeModule, setActiveModule, beds, stock, triage, appointments, visitors } = useHospital();

  const occupiedBedsCount = beds.filter((b) => b.status === 'Ocupada').length;
  const criticalStockCount = stock.filter((s) => s.status === 'Crítico' || s.status === 'Bajo Stock').length;
  const pendingTriageCount = triage.filter((t) => t.status === 'Pendiente').length;
  const todayAppointmentsCount = appointments.filter((a) => a.status === 'En Sala de Espera' || a.status === 'Pendiente').length;
  const activeVisitorsCount = visitors.filter((v) => v.status === 'En Hospital').length;

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'General',
      items: [
        {
          id: 'dashboard',
          label: 'Panel General',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      groupTitle: 'Gestión de Pacientes y Atención',
      items: [
        {
          id: 'patients',
          label: 'Registro & Historias Clínicas',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'triage',
          label: 'Triaje Digital Preventivo',
          icon: <Activity className="w-4 h-4" />,
          badge: pendingTriageCount > 0 ? pendingTriageCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'appointments',
          label: 'Agendamiento de Citas',
          icon: <Calendar className="w-4 h-4" />,
          badge: todayAppointmentsCount > 0 ? todayAppointmentsCount : undefined,
          badgeColor: 'bg-accent-500 text-white',
        },
        {
          id: 'queue',
          label: 'Notificador de Turnos (Audio)',
          icon: <Volume2 className="w-4 h-4" />,
        },
        {
          id: 'prescriptions',
          label: 'Recetas & WhatsApp',
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },
    {
      groupTitle: 'Logística e Inventario Interno',
      items: [
        {
          id: 'stock',
          label: 'Control de Stock Médico',
          icon: <Boxes className="w-4 h-4" />,
          badge: criticalStockCount > 0 ? `${criticalStockCount} alertas` : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'equipment',
          label: 'Rastreador de Equipos QR',
          icon: <QrCode className="w-4 h-4" />,
        },
        {
          id: 'beds',
          label: 'Gestión de Camas (Bed Board)',
          icon: <Bed className="w-4 h-4" />,
          badge: `${occupiedBedsCount}/${beds.length}`,
          badgeColor: 'bg-hospital-500 text-white',
        },
      ],
    },
    {
      groupTitle: 'Administración y Operaciones',
      items: [
        {
          id: 'visitors',
          label: 'Registro de Visitas',
          icon: <UserCheck className="w-4 h-4" />,
          badge: activeVisitorsCount > 0 ? `${activeVisitorsCount} dentro` : undefined,
          badgeColor: 'bg-emerald-500 text-white',
        },
        {
          id: 'attendance',
          label: 'Control de Asistencia',
          icon: <Clock className="w-4 h-4" />,
        },
        {
          id: 'surveys',
          label: 'Encuestas de Satisfacción',
          icon: <HeartHandshake className="w-4 h-4" />,
        },
        {
          id: 'rooms',
          label: 'Reserva de Pabellones & Salas',
          icon: <DoorOpen className="w-4 h-4" />,
        },
      ],
    },
    {
      groupTitle: 'Soporte Clínico Básico',
      items: [
        {
          id: 'calculators',
          label: 'Calculadoras Médicas',
          icon: <Calculator className="w-4 h-4" />,
        },
        {
          id: 'directory',
          label: 'Directorio Médico Interno',
          icon: <PhoneCall className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Hospital Branding Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100 dark:border-ink-800 bg-gradient-to-r from-hospital-50/60 via-white to-transparent dark:from-hospital-950/30 dark:via-ink-900 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg bg-ink-900 dark:bg-hospital-600 text-white flex items-center justify-center">
              <Hospital className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-sm bg-accent-500 border-2 border-white dark:border-ink-900" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-ink-900 dark:text-white leading-tight tracking-tight">
                MEDIX <span className="text-hospital-600 dark:text-hospital-400">CORE</span>
              </h1>
              <p className="text-[11px] font-medium text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                Sistema Hospitalario
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
                {group.groupTitle}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-l-[3px] text-xs font-semibold transition-all duration-150 group ${
                        isActive
                          ? 'border-l-accent-500 bg-hospital-50 dark:bg-hospital-950/40 text-hospital-800 dark:text-hospital-200'
                          : 'border-l-transparent text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800/60 hover:text-ink-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`transition-colors ${
                            isActive
                              ? 'text-hospital-600 dark:text-hospital-300'
                              : 'text-ink-400 group-hover:text-hospital-600 dark:group-hover:text-hospital-400'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-hospital-600 text-white' : item.badgeColor || 'bg-ink-200 text-ink-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {!isActive && (
                          <ChevronRight className="w-3 h-3 text-ink-300 dark:text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-900/60">
          <div className="p-3 rounded-xl bg-white dark:bg-ink-800/60 border border-ink-200/80 dark:border-ink-700/60 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink-800 dark:text-ink-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Modo Local Activo</span>
            </div>
            <p className="text-[10px] text-ink-400 mt-0.5">
              Sin dependencia de servidores en la nube
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
