import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  CheckCircle2,
  User,
  Stethoscope,
  Clock,
  Tv,
  ListOrdered,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { playHospitalChime, speakTurnAnnouncement } from '../../utils/speech';

export const WaitingRoomDisplay: React.FC = () => {
  const {
    currentCalling,
    queueCalls,
    appointments,
    callPatientTurn,
    recallCurrentPatient,
    finishCurrentCall,
    staff,
  } = useHospital();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testName, setTestName] = useState('Juan Carlos Gómez');
  const [testRoom, setTestRoom] = useState('Consultorio 01 - Cardiología');
  const [testTicket, setTestTicket] = useState('T-101');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleManualCall = async () => {
    await callPatientTurn(
      testTicket,
      testName,
      testRoom,
      'Dr. Alejandro Morales',
      'Cardiología'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Notificador de Turnos (Pantalla de Sala de Espera)
            </h2>
            <p className="text-xs text-slate-500">
              Visualización en tiempo real para pantallas de sala con Chime de audio y síntesis de voz en español
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playHospitalChime()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1.5 shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-hospital-600" />
            Probar Campana
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Pantalla de Espera (TV)'}
          </button>
        </div>
      </div>

      {/* Main Kiosk Screen Container */}
      <div className="rounded-3xl bg-slate-950 text-white border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-hospital-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Screen Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hospital-600 text-white flex items-center justify-center font-black text-lg">
              GL
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-slate-100">
                HOSPITAL REGIONAL - MEDIX
              </h3>
              <p className="text-xs text-slate-400">Atención Ambulatoria y Consultorios Externos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-emerald-400">SISTEMA EN VIVO</span>
          </div>
        </div>

        {/* Center Display: Big Turn Box */}
        <div className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Main Giant Call Card */}
          <div className="lg:col-span-2 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-hospital-950 via-slate-900 to-slate-950 border-2 border-hospital-500 shadow-2xl shadow-hospital-600/30 text-center relative overflow-hidden calling-pulse">
            <div className="inline-block px-4 py-1.5 rounded-full bg-hospital-500/20 text-hospital-300 font-bold text-xs tracking-widest uppercase mb-4">
              TURNO ACTUAL EN LLAMADO
            </div>

            {currentCalling ? (
              <div className="space-y-4">
                <div className="font-mono text-6xl sm:text-8xl font-black text-hospital-400 tracking-wider drop-shadow-md">
                  {currentCalling.ticket}
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Paciente</p>
                  <h4 className="text-2xl sm:text-4xl font-extrabold text-white">
                    {currentCalling.patientName}
                  </h4>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4">
                  <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Consultorio</p>
                    <p className="text-lg sm:text-xl font-bold text-hospital-200">
                      {currentCalling.consultingRoom}
                    </p>
                  </div>
                  <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Especialidad</p>
                    <p className="text-lg sm:text-xl font-bold text-hospital-200">
                      {currentCalling.specialty}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-2">
                <p className="text-slate-500 text-sm">Esperando próximo llamado médico...</p>
                <p className="text-xs text-slate-600">Por favor tome asiento y permanezca atento a la pantalla.</p>
              </div>
            )}
          </div>

          {/* Right Side: Previous Calls List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-hospital-400" /> Últimos Llamados
            </h4>

            <div className="space-y-2">
              {queueCalls.slice(0, 5).map((qCall, idx) => (
                <div
                  key={qCall.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    idx === 0
                      ? 'bg-slate-900 border-hospital-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-hospital-400">
                      {qCall.ticket}
                    </span>
                    <div>
                      <p className="font-bold text-xs truncate max-w-[140px] text-white">
                        {qCall.patientName}
                      </p>
                      <p className="text-[10px] text-slate-400">{qCall.consultingRoom}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {qCall.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Marquee Notification */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <p>
            📢 Recuerde tener su DNI físico a la mano al momento de ingresar al consultorio.
          </p>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-hospital-400" />
            <span className="font-mono">{new Date().toLocaleTimeString('es-PE')}</span>
          </div>
        </div>
      </div>

      {/* Operator / Doctor Control Deck */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-hospital-600" />
          Consola de Control del Médico / Operador de Turnos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              N° Ticket a Llamar
            </label>
            <input
              type="text"
              value={testTicket}
              onChange={(e) => setTestTicket(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Paciente
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Consultorio / Destino
            </label>
            <input
              type="text"
              value={testRoom}
              onChange={(e) => setTestRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleManualCall}
              className="flex-1 py-2 px-3 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Llamar Turno
            </button>
          </div>
        </div>

        {/* Fast Action Buttons for active calling */}
        {currentCalling && (
          <div className="p-3 rounded-xl bg-hospital-50 dark:bg-hospital-950/40 border border-hospital-200 dark:border-hospital-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-hospital-800 dark:text-hospital-300">
                Turno en Atención: {currentCalling.ticket} - {currentCalling.patientName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={recallCurrentPatient}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-llamar
              </button>
              <button
                onClick={finishCurrentCall}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Consulta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
