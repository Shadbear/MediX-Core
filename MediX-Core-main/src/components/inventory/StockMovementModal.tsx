import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { StockItem, StockMovement } from '../../types/hospital';
import { Boxes, ArrowDownRight, ArrowUpRight, User, MapPin } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { addStockMovement, staff } = useHospital();

  const [type, setType] = useState<StockMovement['type']>('Salida (Despacho a Servicio)');
  const [quantity, setQuantity] = useState<number>(10);
  const [destinationOrOrigin, setDestinationOrOrigin] = useState('Tópico de Emergencias');
  const [responsible, setResponsible] = useState(staff[0]?.name || 'Lic. Claudia Paredes Vega');
  const [reason, setReason] = useState('Consumo regular de turno');

  if (!item) return null;

  const isEntry = type.startsWith('Entrada');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    if (!isEntry && quantity > item.currentStock) {
      alert(`No puedes despachar ${quantity} unidades porque el stock actual disponible es ${item.currentStock}.`);
      return;
    }

    addStockMovement(item.id, {
      itemId: item.id,
      type,
      quantity: Number(quantity),
      destinationOrOrigin: destinationOrOrigin.trim(),
      responsible: responsible.trim(),
      reason: reason.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kardex: Movimiento de ${item.name}`}
      subtitle={`Código: ${item.code} • Stock Actual: ${item.currentStock} ${item.presentation}`}
      icon={<Boxes className="w-5 h-5 text-hospital-600" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tipo de Movimiento *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as StockMovement['type'])}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="Salida (Despacho a Servicio)">🔻 Salida (Despacho a Servicio / Sala / Pabellón)</option>
            <option value="Salida (Atención Paciente)">🔻 Salida (Atención a Paciente Directo)</option>
            <option value="Entrada (Compra)">🟢 Entrada (Compra / Adquisición / Proveedor)</option>
            <option value="Entrada (Donación)">🟢 Entrada (Donación / Transferencia)</option>
            <option value="Ajuste de Inventario">🔄 Ajuste de Inventario (Auditoría)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cantidad a {isEntry ? 'Ingresar' : 'Despachar'} *
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-base font-extrabold text-hospital-600"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock Proyectado
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-base font-bold text-slate-800 dark:text-slate-200">
              {isEntry ? item.currentStock + quantity : Math.max(0, item.currentStock - quantity)} unid.
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isEntry ? 'Proveedor u Origen' : 'Área / Servicio de Destino'} *
          </label>
          <input
            type="text"
            value={destinationOrOrigin}
            onChange={(e) => setDestinationOrOrigin(e.target.value)}
            placeholder="Ej: UCI, Emergencias, Pabellón Quirúrgico o Proveedor"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Personal Responsable *
          </label>
          <input
            type="text"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Nombre del personal que recibe o despacha"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Motivo / Observación
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Requerimiento de urgencia para sala de operaciones"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
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
            Registrar Movimiento en Kardex
          </button>
        </div>
      </form>
    </Modal>
  );
};
