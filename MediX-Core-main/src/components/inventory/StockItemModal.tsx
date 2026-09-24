import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { StockCategory } from '../../types/hospital';
import { Boxes, Plus } from 'lucide-react';

interface StockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockItemModal: React.FC<StockItemModalProps> = ({ isOpen, onClose }) => {
  const { addStockItem, stock } = useHospital();

  const [code, setCode] = useState(`INS-0${stock.length + 10}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategory>('Medicamentos');
  const [presentation, setPresentation] = useState('Caja x 100');
  const [currentStock, setCurrentStock] = useState(50);
  const [minStock, setMinStock] = useState(20);
  const [maxStock, setMaxStock] = useState(200);
  const [unitCost, setUnitCost] = useState(15.0);
  const [location, setLocation] = useState('Farmacia Central - Estante A1');
  const [expirationDate, setExpirationDate] = useState('2028-06-30');
  const [batchNumber, setBatchNumber] = useState(`LOTE-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addStockItem({
      code: code.trim(),
      name: name.trim(),
      category,
      presentation: presentation.trim(),
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      unitCost: Number(unitCost),
      location: location.trim(),
      expirationDate,
      batchNumber: batchNumber.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Insumo o Medicamento"
      subtitle="Registro en el catálogo maestro del almacén y farmacia hospitalaria"
      icon={<Boxes className="w-5 h-5 text-hospital-600" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Código / SKU *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Insumo / Fármaco *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ceftriaxona 1g Polvo para Inyectable"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as StockCategory)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="Medicamentos">Medicamentos</option>
              <option value="Material de Curación">Material de Curación</option>
              <option value="Descartables">Descartables (Jeringas/Catéteres)</option>
              <option value="Soluciones e Intravenosos">Soluciones e Intravenosos</option>
              <option value="Equipos de Protección (EPP)">Equipos de Protección (EPP)</option>
              <option value="Quirúrgico">Quirúrgico</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Presentación
            </label>
            <input
              type="text"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              placeholder="Ej: Frasco Vial x 1, Caja x 100"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Costo Unitario (S/.)
            </label>
            <input
              type="number"
              step="0.1"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock Inicial *
            </label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-hospital-600"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock Mínimo (Alerta)
            </label>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock Máximo
            </label>
            <input
              type="number"
              value={maxStock}
              onChange={(e) => setMaxStock(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ubicación en Almacén
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Estante B3, Farmacia Urgencias"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              N° de Lote
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
          >
            Guardar Insumo en Inventario
          </button>
        </div>
      </form>
    </Modal>
  );
};
