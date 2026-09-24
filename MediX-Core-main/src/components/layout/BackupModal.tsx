import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportDatabaseToJson, importDatabaseFromJson, resetDatabaseToDefaults } = useHospital();
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseFromJson(content);
        if (ok) {
          setImportStatus({
            success: true,
            message: '¡Copia de seguridad restaurada con éxito! Todos los registros han sido actualizados.',
          });
          setTimeout(() => {
            onClose();
            setImportStatus(null);
          }, 1800);
        } else {
          setImportStatus({
            success: false,
            message: 'Error al procesar el archivo. Formato JSON inválido o estructura no compatible.',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetDatabaseToDefaults();
    setShowResetConfirm(false);
    setImportStatus({
      success: true,
      message: 'Base de datos restablecida a los valores iniciales de demostración.',
    });
    setTimeout(() => {
      onClose();
      setImportStatus(null);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Copia de Seguridad y Persistencia Local"
      subtitle="Exporta e importa la base de datos completa del hospital en formato JSON"
      icon={<Database className="w-5 h-5" />}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {importStatus && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{importStatus.success ? 'Operación Exitosa' : 'Aviso'}</p>
              <p className="mt-0.5 text-xs opacity-90">{importStatus.message}</p>
            </div>
          </div>
        )}

        {/* Export Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-hospital-600" />
                Descargar Copia de Seguridad (.json)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Guarda pacientes, historias clínicas, camas, recetas, inventario y registros en un archivo descargable seguro.
              </p>
            </div>
            <button
              onClick={exportDatabaseToJson}
              className="px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Restaurar desde Archivo (.json)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Carga un archivo de respaldo generado previamente para sincronizar o transferir datos a esta computadora.
              </p>
            </div>
            <label className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              Seleccionar JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Reset Defaults */}
        <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20">
          {!showResetConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-rose-600" />
                  Restablecer Datos de Demostración
                </h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1">
                  Vuelve a cargar los datos precargados de pacientes, médicos, camas e insumos de ejemplo.
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold rounded-xl transition-all shrink-0"
              >
                Restablecer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                ¿Estás seguro de restablecer toda la base de datos a los valores iniciales?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Sí, Restablecer Todo
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
