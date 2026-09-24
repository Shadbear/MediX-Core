import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Prescription } from '../../types/hospital';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Clock,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate, generateWhatsAppPrescriptionUrl } from '../../utils/formatters';
import { PrescriptionFormModal } from './PrescriptionFormModal';

export const PrescriptionList: React.FC = () => {
  const { prescriptions, deletePrescription } = useHospital();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      rx.patientName.toLowerCase().includes(q) ||
      rx.patientDni.includes(q) ||
      rx.code.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q)
    );
  });

  const handleWhatsAppSend = (rx: Prescription) => {
    const url = generateWhatsAppPrescriptionUrl(
      rx.patientPhone,
      rx.patientName,
      rx.doctorName,
      rx.code,
      rx.medications
    );
    window.open(url, '_blank');
  };

  const handlePrint = (rx: Prescription) => {
    setSelectedRxForPrint(rx);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Recetas Médicas y Recordatorio por WhatsApp
            </h2>
            <p className="text-xs text-slate-500">
              Generador de prescripciones con cronograma de tomas horarias y alertas móviles directas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Emitir Receta
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative text-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código de receta, nombre de paciente, DNI o diagnóstico..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
          />
        </div>
      </div>

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrescriptions.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No se encontraron recetas emitidas.
          </div>
        ) : (
          filteredPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono font-black text-hospital-600 text-sm block">
                      {rx.code}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {rx.patientName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      DNI: {rx.patientDni} • Tel: {rx.patientPhone}
                    </p>
                  </div>

                  <Badge variant="neutral" size="sm">
                    {formatDate(rx.date)}
                  </Badge>
                </div>

                {/* Doctor and Diagnosis */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">Médico:</span> {rx.doctorName} ({rx.specialty}) • {rx.doctorCmp}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">Dx:</span> {rx.diagnosis}
                  </p>
                </div>

                {/* Medications List */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Medicamentos ({rx.medications.length})
                  </p>

                  <div className="space-y-2">
                    {rx.medications.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-hospital-50/40 dark:bg-hospital-950/20 border border-hospital-100 dark:border-hospital-900/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {idx + 1}. {med.name} {med.concentration}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-hospital-600 shadow-xs">
                            Cada {med.frequencyHours}h x {med.durationDays}d
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {med.dose} • {med.instructions}
                        </p>

                        {med.calculatedTimes && med.calculatedTimes.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-hospital-700 dark:text-hospital-300 font-semibold pt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Horarios de toma: {med.calculatedTimes.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {rx.generalRecommendations && (
                  <p className="text-[11px] text-slate-500 italic">
                    Nota: {rx.generalRecommendations}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => deletePrescription(rx.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Eliminar receta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(rx)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Receta
                  </button>

                  <button
                    onClick={() => handleWhatsAppSend(rx)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Enviar WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printable Sheet (hidden unless printing) */}
      {selectedRxForPrint && (
        <div className="hidden printable-area font-sans p-8 max-w-2xl mx-auto border border-slate-300">
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <h1 className="text-xl font-black">HOSPITAL REGIONAL - SISTEMA MEDIX</h1>
            <p className="text-xs">RECETA MÉDICA INSTITUCIONAL • SERVICIO DE FARMACIA</p>
            <p className="font-mono text-sm font-bold mt-1">CÓDIGO: {selectedRxForPrint.code}</p>
          </div>

          <div className="my-4 grid grid-cols-2 gap-2 text-xs border-b pb-4">
            <div>
              <p><strong>Paciente:</strong> {selectedRxForPrint.patientName}</p>
              <p><strong>DNI:</strong> {selectedRxForPrint.patientDni}</p>
              <p><strong>Fecha de Emisión:</strong> {formatDate(selectedRxForPrint.date)}</p>
            </div>
            <div>
              <p><strong>Médico:</strong> {selectedRxForPrint.doctorName}</p>
              <p><strong>Especialidad:</strong> {selectedRxForPrint.specialty}</p>
              <p><strong>Colegiatura:</strong> {selectedRxForPrint.doctorCmp}</p>
            </div>
          </div>

          <div className="my-4">
            <h3 className="font-bold text-sm mb-2">Rp / INDICACIONES DE MEDICAMENTOS:</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-bold">
                  <th className="py-2">Medicamento</th>
                  <th className="py-2">Dosis</th>
                  <th className="py-2">Frecuencia</th>
                  <th className="py-2">Duración</th>
                  <th className="py-2">Horario Sugerido</th>
                </tr>
              </thead>
              <tbody>
                {selectedRxForPrint.medications.map((m, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 font-bold">{m.name} {m.concentration} ({m.form})</td>
                    <td className="py-2">{m.dose}</td>
                    <td className="py-2">Cada {m.frequencyHours}h</td>
                    <td className="py-2">{m.durationDays} días</td>
                    <td className="py-2 font-mono">{m.calculatedTimes?.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="my-4 text-xs">
            <p><strong>Diagnóstico:</strong> {selectedRxForPrint.diagnosis}</p>
            <p className="mt-1"><strong>Indicaciones Generales:</strong> {selectedRxForPrint.generalRecommendations}</p>
          </div>

          <div className="mt-16 pt-4 border-t flex justify-between text-xs text-center">
            <div>
              <p className="border-t border-slate-400 px-6 pt-1">Firma del Paciente / Familiar</p>
            </div>
            <div>
              <p className="border-t border-slate-400 px-6 pt-1">Firma y Sello del Médico Tratante</p>
            </div>
          </div>
        </div>
      )}

      <PrescriptionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};
