import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { SatisfactionSurvey } from '../../types/hospital';
import {
  HeartHandshake,
  Star,
  Smile,
  Meh,
  Frown,
  Send,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const KioskSurvey: React.FC = () => {
  const { surveys, addSurvey } = useHospital();

  const [serviceRated, setServiceRated] = useState<SatisfactionSurvey['serviceRated']>('Consulta Externa');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [waitDurationRating, setWaitDurationRating] = useState<number>(4);
  const [medicalCareRating, setMedicalCareRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [pharmacyCareRating, setPharmacyCareRating] = useState<number>(4);
  const [recommendHospital, setRecommendHospital] = useState<boolean>(true);
  const [patientName, setPatientName] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Compute analytics
  const totalSurveys = surveys.length;
  const avgOverall = totalSurveys > 0 ? (surveys.reduce((sum, s) => sum + s.overallRating, 0) / totalSurveys).toFixed(1) : '5.0';
  const avgMedical = totalSurveys > 0 ? (surveys.reduce((sum, s) => sum + s.medicalCareRating, 0) / totalSurveys).toFixed(1) : '5.0';
  const avgCleanliness = totalSurveys > 0 ? (surveys.reduce((sum, s) => sum + s.cleanlinessRating, 0) / totalSurveys).toFixed(1) : '5.0';
  const recommendPercent = totalSurveys > 0 ? Math.round((surveys.filter((s) => s.recommendHospital).length / totalSurveys) * 100) : 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addSurvey({
      patientName: patientName.trim() || 'Paciente Anónimo',
      serviceRated,
      overallRating,
      waitDurationRating,
      medicalCareRating,
      cleanlinessRating,
      pharmacyCareRating,
      recommendHospital,
      comments: comments.trim() || 'Atención satisfactoria.',
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComments('');
      setPatientName('');
      setOverallRating(5);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Encuestas de Satisfacción del Paciente (Quiosco CSAT)
            </h2>
            <p className="text-xs text-slate-500">
              Calificación de atención al salir del hospital y analítica de calidad institucional
            </p>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Satisfacción General</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-amber-500">{avgOverall}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-0.5 text-amber-400 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Trato y Atención Médica</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-600">{avgMedical}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Calificación sobresaliente</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Limpieza e Instalaciones</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-sky-600">{avgCleanliness}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-sky-600 font-semibold mt-1">Estándar higiénico alto</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Índice de Recomendación</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-hospital-600">{recommendPercent}%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalSurveys} pacientes evaluaron</p>
        </div>
      </div>

      {/* Main Grid: Interactive Survey Form (Kiosk) + Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiosk Form */}
        <div className="lg:col-span-2">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                Quiosco de Salida de Pacientes
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                ¿Cómo calificarías tu experiencia en el hospital hoy?
              </h3>
              <p className="text-xs text-slate-500">
                Tu opinión nos ayuda a mejorar continuamente la calidad de atención para todos
              </p>
            </div>

            {submitted ? (
              <div className="p-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  ¡Muchas gracias por tu evaluación!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Tu calificación ha sido registrada en el sistema de control de calidad hospitalario.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                {/* Service Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                    1. ¿Qué servicio médico utilizaste?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Consulta Externa', 'Emergencia', 'Triaje', 'Hospitalización', 'Farmacia', 'Laboratorio'].map(
                      (service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => setServiceRated(service as SatisfactionSurvey['serviceRated'])}
                          className={`p-3 rounded-xl border text-center font-semibold transition-all ${
                            serviceRated === service
                              ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {service}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Overall Rating (1 to 5 Stars with Emojis) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <label className="block font-extrabold text-sm text-slate-900 dark:text-white">
                    2. Calificación General de la Atención
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        className={`p-3 rounded-2xl transition-all ${
                          overallRating >= star
                            ? 'bg-amber-100 text-amber-500 scale-110 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-300 hover:text-slate-400'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {overallRating === 5
                      ? '⭐ Excelente (5/5)'
                      : overallRating === 4
                      ? 'Muy Buena (4/5)'
                      : overallRating === 3
                      ? 'Regular / Aceptable (3/5)'
                      : overallRating === 2
                      ? 'Deficiente (2/5)'
                      : 'Muy Mala (1/5)'}
                  </p>
                </div>

                {/* Multi dimension scales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Trato y amabilidad del personal médico ({medicalCareRating}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={medicalCareRating}
                      onChange={(e) => setMedicalCareRating(Number(e.target.value))}
                      className="w-full accent-hospital-600"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Tiempo de espera en sala ({waitDurationRating}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={waitDurationRating}
                      onChange={(e) => setWaitDurationRating(Number(e.target.value))}
                      className="w-full accent-hospital-600"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Limpieza y confort de instalaciones ({cleanlinessRating}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={cleanlinessRating}
                      onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                      className="w-full accent-hospital-600"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Atención en Farmacia ({pharmacyCareRating}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={pharmacyCareRating}
                      onChange={(e) => setPharmacyCareRating(Number(e.target.value))}
                      className="w-full accent-hospital-600"
                    />
                  </div>
                </div>

                {/* Recommendation */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    ¿Recomendarías este hospital a tus familiares o amigos?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommendHospital(true)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                        recommendHospital ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommendHospital(false)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                        !recommendHospital ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> No
                    </button>
                  </div>
                </div>

                {/* Comments & Patient name */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Paciente (Opcional / Anónimo)
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Ej: Carmen Salazar (o dejar en blanco)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Comentarios o sugerencias para mejorar
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Escribe aquí tu opinión o agradecimiento al equipo médico..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-hospital-600 hover:bg-hospital-700 text-white font-bold text-xs rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Encuesta de Satisfacción
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right 1 Col: Latest Reviews */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Opiniones Recientes ({surveys.length})</span>
              <MessageSquare className="w-4 h-4 text-hospital-600" />
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {surveys.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.patientName || 'Paciente Anónimo'}
                    </span>
                    <div className="flex items-center text-amber-500">
                      {[...Array(s.overallRating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Servicio: {s.serviceRated} • {s.timestamp}
                  </span>

                  <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">
                    "{s.comments}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
