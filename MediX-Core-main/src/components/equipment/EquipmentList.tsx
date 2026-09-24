import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { MedicalEquipment, EquipmentStatus } from '../../types/hospital';
import {
  QrCode,
  Plus,
  Search,
  Stethoscope,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Sliders,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { EquipmentQrModal } from './EquipmentQrModal';
import { Modal } from '../common/Modal';

export const EquipmentList: React.FC = () => {
  const { equipment, updateEquipmentStatus, addEquipment, staff } = useHospital();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [selectedEqForQr, setSelectedEqForQr] = useState<MedicalEquipment | null>(null);
  const [isNewEqModalOpen, setIsNewEqModalOpen] = useState(false);
  const [eqForReassign, setEqForReassign] = useState<MedicalEquipment | null>(null);

  // Reassignment form
  const [reassignArea, setReassignArea] = useState('');
  const [reassignDoctor, setReassignDoctor] = useState('');
  const [reassignStatus, setReassignStatus] = useState<EquipmentStatus>('En Uso');

  const filteredEquipment = equipment.filter((eq) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      eq.name.toLowerCase().includes(q) ||
      eq.code.toLowerCase().includes(q) ||
      eq.currentArea.toLowerCase().includes(q) ||
      (eq.assignedDoctor && eq.assignedDoctor.toLowerCase().includes(q));

    const matchesCategory = filterCategory === 'ALL' || eq.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || eq.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenReassign = (eq: MedicalEquipment) => {
    setEqForReassign(eq);
    setReassignArea(eq.currentArea);
    setReassignDoctor(eq.assignedDoctor || '');
    setReassignStatus(eq.status);
  };

  const handleSaveReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqForReassign) return;

    updateEquipmentStatus(
      eqForReassign.id,
      reassignStatus,
      reassignArea.trim(),
      reassignDoctor.trim() || undefined
    );

    setEqForReassign(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Rastreador de Equipos Médicos Móviles con Códigos QR
            </h2>
            <p className="text-xs text-slate-500">
              Control de ubicación, asignación a médicos y áreas, y generación de etiquetas QR
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewEqModalOpen(true)}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Registrar Equipo Móvil
        </button>
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
              placeholder="Buscar equipo, código, marca, área o médico..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            />
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Diagnóstico por Imágenes">Diagnóstico por Imágenes</option>
              <option value="Soporte Vital">Soporte Vital</option>
              <option value="Monitoreo">Monitoreo</option>
              <option value="Terapia Respiratoria">Terapia Respiratoria</option>
              <option value="Movilidad">Movilidad</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="Disponible">Disponible</option>
              <option value="En Uso">En Uso</option>
              <option value="En Mantenimiento">En Mantenimiento</option>
              <option value="En Desinfección">En Desinfección</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((eq) => (
          <div
            key={eq.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono font-black text-hospital-600 dark:text-hospital-400 text-xs block">
                    {eq.code}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {eq.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {eq.brand} • Mod: {eq.model}
                  </p>
                </div>

                <Badge
                  variant={
                    eq.status === 'Disponible'
                      ? 'success'
                      : eq.status === 'En Uso'
                      ? 'primary'
                      : eq.status === 'En Mantenimiento'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                  dot
                >
                  {eq.status}
                </Badge>
              </div>

              {/* Location and Doctor */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
                  <span className="truncate">
                    <strong>Área:</strong> {eq.currentArea}
                  </span>
                </div>

                {eq.assignedDoctor && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      <strong>Asignado a:</strong> {eq.assignedDoctor}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Último Mant: {formatDate(eq.lastMaintenance)}</span>
                <span>Próximo Mant: {formatDate(eq.nextMaintenance)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedEqForQr(eq)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-hospital-600" />
                Ver Código QR
              </button>

              <button
                onClick={() => handleOpenReassign(eq)}
                className="px-3 py-1.5 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                Reasignar / Estado
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reassign Modal */}
      {eqForReassign && (
        <Modal
          isOpen={true}
          onClose={() => setEqForReassign(null)}
          title={`Reasignar Equipo: ${eqForReassign.name}`}
          subtitle={`Código: ${eqForReassign.code}`}
          icon={<Sliders className="w-5 h-5 text-hospital-600" />}
          maxWidth="md"
        >
          <form onSubmit={handleSaveReassign} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado Operativo *
              </label>
              <select
                value={reassignStatus}
                onChange={(e) => setReassignStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Disponible">Disponible (En Almacén / Estación)</option>
                <option value="En Uso">En Uso Activo</option>
                <option value="En Mantenimiento">En Mantenimiento / Calibración</option>
                <option value="En Desinfección">En Desinfección</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Área / Servicio de Ubicación *
              </label>
              <input
                type="text"
                value={reassignArea}
                onChange={(e) => setReassignArea(e.target.value)}
                placeholder="Ej: UCI Cama 3, Tópico Emergencia, Piso 2"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Médico o Enfermero Asignado (Opcional)
              </label>
              <select
                value={reassignDoctor}
                onChange={(e) => setReassignDoctor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="">-- Sin médico específico (Uso general del área) --</option>
                {staff.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} ({doc.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEqForReassign(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-sm"
              >
                Guardar Reasignación
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Equipment Modal */}
      {isNewEqModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewEqModalOpen(false)}
          title="Registrar Nuevo Equipo Biomédico Móvil"
          subtitle="Generación automática de código QR de rastreo"
          icon={<Plus className="w-5 h-5 text-hospital-600" />}
          maxWidth="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const fd = new FormData(form);

              addEquipment({
                code: (fd.get('code') as string).trim(),
                name: (fd.get('name') as string).trim(),
                brand: (fd.get('brand') as string).trim(),
                model: (fd.get('model') as string).trim(),
                serialNumber: (fd.get('serialNumber') as string).trim(),
                category: fd.get('category') as MedicalEquipment['category'],
                currentArea: (fd.get('currentArea') as string).trim(),
                assignedDoctor: (fd.get('assignedDoctor') as string).trim() || undefined,
                status: 'Disponible',
                lastMaintenance: new Date().toISOString().split('T')[0],
                nextMaintenance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              });

              setIsNewEqModalOpen(false);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Código Patrimonial / SKU *</label>
                <input
                  name="code"
                  defaultValue={`EQ-BIO-0${equipment.length + 1}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoría *</label>
                <select
                  name="category"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Diagnóstico por Imágenes">Diagnóstico por Imágenes</option>
                  <option value="Soporte Vital">Soporte Vital</option>
                  <option value="Monitoreo">Monitoreo</option>
                  <option value="Terapia Respiratoria">Terapia Respiratoria</option>
                  <option value="Movilidad">Movilidad</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-1">Nombre del Equipo *</label>
                <input
                  name="name"
                  placeholder="Ej: Electrocardiógrafo Digital 12 Canales"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Marca</label>
                <input
                  name="brand"
                  placeholder="Ej: Schiller / Mindray / Zoll"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Modelo</label>
                <input
                  name="model"
                  placeholder="Ej: CardioSmart V3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">N° de Serie *</label>
                <input
                  name="serialNumber"
                  placeholder="SN-2026-XXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ubicación Inicial *</label>
                <input
                  name="currentArea"
                  placeholder="Ej: Almacén Biomédico / Emergencias"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsNewEqModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-hospital-600 text-white font-bold rounded-xl shadow-sm"
              >
                Guardar y Generar QR
              </button>
            </div>
          </form>
        </Modal>
      )}

      <EquipmentQrModal
        isOpen={!!selectedEqForQr}
        onClose={() => setSelectedEqForQr(null)}
        equipment={selectedEqForQr}
      />
    </div>
  );
};
