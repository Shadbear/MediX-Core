import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { TriageAssessment, TriagePriority, Gender } from '../../types/hospital';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Stethoscope,
  Send,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface SymptomOption {
  id: string;
  name: string;
  category: 'Criticos' | 'Respiratorios' | 'Cardiovasculares' | 'Neurologicos' | 'Digestivos' | 'Generales';
  severityWeight: number; // 1 to 5
}

const SYMPTOMS_LIST: SymptomOption[] = [
  // Críticos (Nivel 1-2)
  { id: 'sym-01', name: 'Inconsciencia o desmayo súbito', category: 'Criticos', severityWeight: 5 },
  { id: 'sym-02', name: 'Dificultad severa para respirar / Asfixia', category: 'Criticos', severityWeight: 5 },
  { id: 'sym-03', name: 'Dolor opresivo en el pecho irradiado al brazo/cuello', category: 'Cardiovasculares', severityWeight: 4 },
  { id: 'sym-04', name: 'Convulsiones recientes o activas', category: 'Neurologicos', severityWeight: 5 },
  { id: 'sym-05', name: 'Pérdida súbita de fuerza en la mitad del cuerpo o dificultad para hablar', category: 'Neurologicos', severityWeight: 4 },
  { id: 'sym-06', name: 'Hemorragia abundante o no controlable', category: 'Criticos', severityWeight: 5 },
  // Urgencias (Nivel 3)
  { id: 'sym-07', name: 'Dolor abdominal agudo e intenso', category: 'Digestivos', severityWeight: 3 },
  { id: 'sym-08', name: 'Fiebre mayor a 38.5°C persistente', category: 'Generales', severityWeight: 3 },
  { id: 'sym-09', name: 'Traumatismo o golpe fuerte con dolor severo', category: 'Generales', severityWeight: 3 },
  { id: 'sym-10', name: 'Vómitos incoercibles / Deshidratación', category: 'Digestivos', severityWeight: 3 },
  // Menor / No Urgente (Nivel 4-5)
  { id: 'sym-11', name: 'Dolor de garganta / Tos seca o resfrío común', category: 'Respiratorios', severityWeight: 1 },
  { id: 'sym-12', name: 'Dolor de cabeza leve a moderado', category: 'Neurologicos', severityWeight: 2 },
  { id: 'sym-13', name: 'Dolor muscular o de articulaciones crónico', category: 'Generales', severityWeight: 1 },
  { id: 'sym-14', name: 'Diarrea leve sin deshidratación', category: 'Digestivos', severityWeight: 2 },
  { id: 'sym-15', name: 'Erupción cutánea leve sin fiebre', category: 'Generales', severityWeight: 1 },
];

export const TriageWizard: React.FC = () => {
  const { addTriageAssessment, patients, triage, updateTriageStatus, addAppointment } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientDni, setPatientDni] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>('M');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(3);

  // Vital Signs
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState(75);
  const [respiratoryRate, setRespiratoryRate] = useState(18);
  const [temperature, setTemperature] = useState(36.8);
  const [oxygenSaturation, setOxygenSaturation] = useState(98);

  const [assessmentResult, setAssessmentResult] = useState<TriageAssessment | null>(null);

  const handlePatientSelect = (pId: string) => {
    setSelectedPatientId(pId);
    if (pId) {
      const p = patients.find((pat) => pat.id === pId);
      if (p) {
        setPatientName(`${p.firstName} ${p.lastName}`);
        setPatientDni(p.dni);
        setGender(p.gender);
      }
    }
  };

  const toggleSymptom = (symName: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symName) ? prev.filter((s) => s !== symName) : [...prev, symName]
    );
  };

  const evaluateTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientDni.trim()) return;

    // Manchester priority algorithm calculation
    let priority: TriagePriority = 5;
    let priorityName: TriageAssessment['priorityName'] = 'Nivel V: No Urgente';
    let targetWaitTime = 'Hasta 240 minutos (Atención General)';
    let recommendedArea: TriageAssessment['recommendedArea'] = 'Consulta Externa';
    let recommendationText = 'Cuadro clínico estable. Puede ser atendido en Consulta Externa ambulatoria.';

    // Check high severity symptoms
    const maxSeverity = selectedSymptoms.reduce((max, sName) => {
      const sym = SYMPTOMS_LIST.find((s) => s.name === sName);
      return sym ? Math.max(max, sym.severityWeight) : max;
    }, 0);

    const isO2Low = oxygenSaturation < 92;
    const isO2Critical = oxygenSaturation < 88;
    const isHighFever = temperature >= 39.0;
    const isSeverePain = painLevel >= 8;

    if (maxSeverity >= 5 || isO2Critical) {
      priority = 1;
      priorityName = 'Nivel I: Reanimación';
      targetWaitTime = 'Inmediato (0 minutos)';
      recommendedArea = 'Shock Trauma / UCI';
      recommendationText = '¡ATENCIÓN INMEDIATA! Paciente con compromiso vital crítico. Ingreso directo a Shock Trauma.';
    } else if (maxSeverity === 4 || isO2Low || isSeverePain) {
      priority = 2;
      priorityName = 'Nivel II: Emergencia';
      targetWaitTime = 'Menor a 10-15 minutos';
      recommendedArea = 'Tópico de Emergencia';
      recommendationText = 'Condición de emergencia médica. Requiere atención médica prioritaria en Tópico de Urgencias.';
    } else if (maxSeverity === 3 || isHighFever || painLevel >= 5) {
      priority = 3;
      priorityName = 'Nivel III: Urgencia';
      targetWaitTime = 'Hasta 60 minutos';
      recommendedArea = 'Observación';
      recommendationText = 'Urgencia médica moderada. Requiere exámenes auxiliares y monitoreo en área de observación.';
    } else if (maxSeverity === 2 || painLevel >= 3) {
      priority = 4;
      priorityName = 'Nivel IV: Prioridad Menor';
      targetWaitTime = 'Hasta 120 minutos';
      recommendedArea = 'Triaje Ambulatorio';
      recommendationText = 'Condición médica menor. Se recomienda atención ambulatoria en consultorios externos.';
    }

    const assessment = addTriageAssessment({
      patientId: selectedPatientId || undefined,
      patientName,
      patientDni,
      age: Number(age),
      gender,
      chiefComplaint: chiefComplaint || selectedSymptoms.join(', ') || 'Evaluación preventiva',
      symptoms: selectedSymptoms,
      vitalSigns: {
        bloodPressure,
        heartRate: Number(heartRate),
        respiratoryRate: Number(respiratoryRate),
        temperature: Number(temperature),
        oxygenSaturation: Number(oxygenSaturation),
        painLevel: Number(painLevel),
      },
      priorityLevel: priority,
      priorityName,
      targetWaitTime,
      recommendedArea,
      recommendationText,
    });

    setAssessmentResult(assessment);
  };

  const handleCreateAppointmentFromTriage = () => {
    if (!assessmentResult) return;
    addAppointment({
      patientId: assessmentResult.patientId || `pat-temp-${Date.now()}`,
      patientName: assessmentResult.patientName,
      patientDni: assessmentResult.patientDni,
      patientPhone: '987654321',
      doctorId: 'doc-04',
      doctorName: 'Dr. Roberto Carranza Díaz',
      specialty: 'Medicina General & Urgencias',
      consultingRoom: 'Consultorio 03 - Tópico',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      type: 'Primera Vez',
      reason: `Derivación de Triaje [${assessmentResult.priorityName}]: ${assessmentResult.chiefComplaint}`,
    });

    updateTriageStatus(assessmentResult.id, 'Derivado');
    alert(`Turno de atención generado con éxito para ${assessmentResult.patientName}.`);
    setAssessmentResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Triaje Digital Preventivo (Sistema Manchester)
            </h2>
            <p className="text-xs text-slate-500">
              Autoevaluación guiada y clasificación de gravedad de síntomas antes de urgencias
            </p>
          </div>
        </div>
      </div>

      {/* Triage Priority Reference Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-red-500 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-extrabold block">Nivel I: Rojo</span>
            <span className="text-[10px] opacity-90">Reanimación</span>
          </div>
          <span className="font-mono text-[11px] font-bold mt-2">0 min (Inmediato)</span>
        </div>

        <div className="p-3 rounded-xl bg-orange-500 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-extrabold block">Nivel II: Naranja</span>
            <span className="text-[10px] opacity-90">Emergencia</span>
          </div>
          <span className="font-mono text-[11px] font-bold mt-2">&lt; 10-15 min</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-500 text-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-extrabold block">Nivel III: Amarillo</span>
            <span className="text-[10px] opacity-90">Urgencia</span>
          </div>
          <span className="font-mono text-[11px] font-bold mt-2">&lt; 60 min</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-extrabold block">Nivel IV: Verde</span>
            <span className="text-[10px] opacity-90">Prioridad Menor</span>
          </div>
          <span className="font-mono text-[11px] font-bold mt-2">&lt; 120 min</span>
        </div>

        <div className="p-3 rounded-xl bg-blue-500 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-extrabold block">Nivel V: Azul</span>
            <span className="text-[10px] opacity-90">No Urgente</span>
          </div>
          <span className="font-mono text-[11px] font-bold mt-2">&lt; 240 min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={evaluateTriage}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            {/* Step 1: Paciente */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-hospital-600 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                Datos del Paciente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seleccionar de Pacientes Registrados (Opcional)
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Ingresar paciente nuevo o manual --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.medicalRecordNumber} • {p.firstName} {p.lastName} (DNI: {p.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DNI del Paciente *
                  </label>
                  <input
                    type="text"
                    value={patientDni}
                    onChange={(e) => setPatientDni(e.target.value)}
                    placeholder="45892019"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Juan Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Edad (Años) *
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Síntomas y Signos de Alarma */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-hospital-600 text-white text-[11px] flex items-center justify-center font-bold">
                  2
                </span>
                Selección Interactiva de Síntomas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SYMPTOMS_LIST.map((symptom) => {
                  const isSelected = selectedSymptoms.includes(symptom.name);
                  const isHighRisk = symptom.severityWeight >= 4;

                  return (
                    <div
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 select-none ${
                        isSelected
                          ? isHighRisk
                            ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-200'
                            : 'bg-hospital-50 border-hospital-400 text-hospital-900 dark:bg-hospital-950/40 dark:border-hospital-700 dark:text-hospital-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-xs leading-snug">{symptom.name}</p>
                        <span className="text-[10px] text-slate-400 block capitalize">{symptom.category}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center border ${
                          isSelected ? 'bg-hospital-600 border-hospital-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dolor EVA */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Escala de Dolor Visual Analógica (EVA): <span className="text-hospital-600 font-extrabold">{painLevel}/10</span>
                  </label>
                  <span className="text-xs font-semibold text-slate-500">
                    {painLevel === 0 ? 'Sin dolor' : painLevel <= 3 ? 'Dolor Leve' : painLevel <= 7 ? 'Dolor Moderado' : 'Dolor Severo / Intolerable'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-hospital-600"
                />
              </div>
            </div>

            {/* Step 3: Signos Vitales */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-hospital-600 text-white text-[11px] flex items-center justify-center font-bold">
                  3
                </span>
                Signos Vitales y Motivo
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold">P. Arterial</label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold">F.C. (lpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold">F.R. (rpm)</label>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold">SpO2 (%)</label>
                  <input
                    type="number"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center font-bold text-hospital-600"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Motivo de Consulta Principal
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Descripción detallada de las molestias y tiempo transcurrido..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-hospital-600 hover:bg-hospital-700 text-white font-bold text-xs rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Procesar y Clasificar Nivel de Urgencia (Manchester)
            </button>
          </form>

          {/* Assessment Result Card */}
          {assessmentResult && (
            <div
              className={`p-6 rounded-2xl border-2 shadow-lg animate-fadeIn ${
                assessmentResult.priorityLevel === 1
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-950 dark:text-red-100'
                  : assessmentResult.priorityLevel === 2
                  ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-950 dark:text-orange-100'
                  : assessmentResult.priorityLevel === 3
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-950 dark:text-amber-100'
                  : assessmentResult.priorityLevel === 4
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-950 dark:text-blue-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-sm">
                    Clasificación Triaje Manchester
                  </span>
                  <h3 className="text-xl font-black mt-1">
                    {assessmentResult.priorityName}
                  </h3>
                  <p className="text-xs mt-0.5 font-medium opacity-90">
                    Tiempo de espera objetivo: <strong>{assessmentResult.targetWaitTime}</strong> • Destino:{' '}
                    <strong>{assessmentResult.recommendedArea}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-2xl font-black">
                    Nivel {assessmentResult.priorityLevel}
                  </span>
                </div>
              </div>

              <div className="my-4 p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-current/20 text-xs">
                <p className="font-bold">Recomendación Clínica:</p>
                <p className="mt-0.5">{assessmentResult.recommendationText}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs opacity-75">
                  Evaluado para: <strong>{assessmentResult.patientName}</strong> (DNI: {assessmentResult.patientDni})
                </span>

                <button
                  onClick={handleCreateAppointmentFromTriage}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Asignar a Cola de Espera / Consultorio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Triage Queue */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Historial de Triajes Realizados</span>
              <Badge variant="neutral" size="sm">{triage.length}</Badge>
            </h3>

            {triage.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay evaluaciones de triaje registradas aún.
              </div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[600px] overflow-y-auto">
                {triage.map((trg) => {
                  const priorityColors = {
                    1: 'border-l-red-500 bg-red-50/40 dark:bg-red-950/20',
                    2: 'border-l-orange-500 bg-orange-50/40 dark:bg-orange-950/20',
                    3: 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20',
                    4: 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
                    5: 'border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20',
                  }[trg.priorityLevel];

                  return (
                    <div
                      key={trg.id}
                      className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${priorityColors} text-xs space-y-1.5`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{trg.patientName}</span>
                        <span className="text-[10px] font-semibold text-slate-500 font-mono">{trg.timestamp}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {trg.priorityName}
                        </span>
                        <Badge
                          variant={trg.status === 'Derivado' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {trg.status}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {trg.chiefComplaint}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                        <span>P.A: {trg.vitalSigns.bloodPressure} • SpO2: {trg.vitalSigns.oxygenSaturation}%</span>
                        <span className="font-semibold">{trg.recommendedArea}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
