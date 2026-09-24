import React, { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  Search,
  Moon,
  Sun,
  Database,
  Volume2,
  Clock,
  Menu,
  User,
  Bed,
  Stethoscope,
  X,
} from 'lucide-react';
import { BackupModal } from './BackupModal';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    darkMode,
    toggleDarkMode,
    globalSearch,
    setGlobalSearch,
    patients,
    staff,
    beds,
    equipment,
    currentCalling,
    setActiveModule,
  } = useHospital();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered results for global search
  const searchLower = globalSearch.trim().toLowerCase();
  const matchedPatients = searchLower
    ? patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.dni.includes(searchLower) ||
          p.medicalRecordNumber.toLowerCase().includes(searchLower)
      ).slice(0, 4)
    : [];

  const matchedDoctors = searchLower
    ? staff.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          (s.specialty && s.specialty.toLowerCase().includes(searchLower)) ||
          s.extension.includes(searchLower)
      ).slice(0, 3)
    : [];

  const matchedBeds = searchLower
    ? beds.filter(
        (b) =>
          b.bedNumber.toLowerCase().includes(searchLower) ||
          b.ward.toLowerCase().includes(searchLower) ||
          (b.patientName && b.patientName.toLowerCase().includes(searchLower))
      ).slice(0, 3)
    : [];

  const hasResults = matchedPatients.length > 0 || matchedDoctors.length > 0 || matchedBeds.length > 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md border-b border-ink-200 dark:border-ink-800 transition-colors">
        {/* Left: Mobile Toggle & Clock */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800/60 border border-ink-200/60 dark:border-ink-700/60 text-xs">
            <Clock className="w-3.5 h-3.5 text-hospital-600 dark:text-hospital-400" />
            <span className="font-semibold text-ink-800 dark:text-ink-200 font-mono">{currentTime}</span>
            <span className="text-ink-400">|</span>
            <span className="text-ink-500 dark:text-ink-400 capitalize">{currentDate}</span>
          </div>

          {currentCalling && (
            <div
              onClick={() => setActiveModule('queue')}
              className="cursor-pointer hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-hospital-50 dark:bg-hospital-950/60 border border-hospital-200 dark:border-hospital-800 text-hospital-700 dark:text-hospital-300 text-xs animate-pulse"
            >
              <Volume2 className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
              <span className="font-bold">{currentCalling.ticket}</span>
              <span className="truncate max-w-[120px]">{currentCalling.patientName}</span>
              <span className="text-ink-400">→</span>
              <span className="font-medium text-ink-600 dark:text-ink-400">{currentCalling.consultingRoom}</span>
            </div>
          )}
        </div>

        {/* Center: Global Search */}
        <div className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Buscar paciente, DNI, médico, cama o equipo..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-ink-100 dark:bg-ink-800/80 border border-transparent focus:border-hospital-500 focus:bg-white dark:focus:bg-ink-900 text-ink-900 dark:text-white placeholder-ink-400 focus:outline-none transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Global Search Dropdown */}
          {showSearchResults && searchLower && (
            <div
              className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-ink-900 rounded-2xl shadow-xl border border-ink-200 dark:border-ink-800 overflow-hidden z-50 p-2 text-xs divide-y divide-ink-100 dark:divide-ink-800"
              onMouseLeave={() => setShowSearchResults(false)}
            >
              {!hasResults ? (
                <div className="p-4 text-center text-ink-400">
                  No se encontraron resultados para "{globalSearch}".
                </div>
              ) : (
                <>
                  {matchedPatients.length > 0 && (
                    <div className="p-2">
                      <p className="font-semibold text-ink-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-hospital-600" /> Pacientes
                      </p>
                      {matchedPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActiveModule('patients');
                            setShowSearchResults(false);
                          }}
                          className="p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800/70 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-ink-900 dark:text-white">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-[11px] text-ink-500">
                              DNI: {p.dni} | {p.medicalRecordNumber} | {p.insuranceType}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 font-semibold">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedDoctors.length > 0 && (
                    <div className="p-2">
                      <p className="font-semibold text-ink-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Stethoscope className="w-3 h-3 text-emerald-600" /> Personal Médico
                      </p>
                      {matchedDoctors.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setActiveModule('directory');
                            setShowSearchResults(false);
                          }}
                          className="p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800/70 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-ink-900 dark:text-white">{s.name}</p>
                            <p className="text-[11px] text-ink-500">
                              {s.specialty} | Anexo: {s.extension}
                            </p>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {s.currentShift}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedBeds.length > 0 && (
                    <div className="p-2">
                      <p className="font-semibold text-ink-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Bed className="w-3 h-3 text-purple-600" /> Camas Hospitalarias
                      </p>
                      {matchedBeds.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setActiveModule('beds');
                            setShowSearchResults(false);
                          }}
                          className="p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800/70 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-ink-900 dark:text-white">
                              Cama {b.bedNumber} ({b.ward})
                            </p>
                            <p className="text-[11px] text-ink-500">
                              {b.patientName ? `Paciente: ${b.patientName}` : 'Sin paciente asignado'}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Backup Button */}
          <button
            onClick={() => setIsBackupOpen(true)}
            title="Copia de Seguridad y Restauración JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-200 text-xs font-semibold transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-hospital-600 dark:text-hospital-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-ink-600" />}
          </button>

          {/* User Profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-ink-200 dark:border-ink-800">
            <div className="w-8 h-8 rounded-lg bg-ink-900 dark:bg-hospital-600 text-accent-400 dark:text-white flex items-center justify-center font-display font-bold text-xs">
              GL
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-ink-900 dark:text-white leading-tight">Admin Hospital</p>
              <p className="text-[10px] text-ink-400">MEDIX CORE v1.0</p>
            </div>
          </div>
        </div>
      </header>

      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};
