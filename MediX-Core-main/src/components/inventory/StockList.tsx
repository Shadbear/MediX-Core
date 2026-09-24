import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { StockItem, StockCategory } from '../../types/hospital';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate, formatCurrencyPEN } from '../../utils/formatters';
import { StockMovementModal } from './StockMovementModal';
import { StockItemModal } from './StockItemModal';
import { Modal } from '../common/Modal';

export const StockList: React.FC = () => {
  const { stock } = useHospital();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [itemForMovement, setItemForMovement] = useState<StockItem | null>(null);
  const [itemForKardexHistory, setItemForKardexHistory] = useState<StockItem | null>(null);

  const filteredStock = stock.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q);

    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = stock.filter((s) => s.status === 'Crítico' || s.status === 'Bajo Stock').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Control de Stock Médico y Kardex
            </h2>
            <p className="text-xs text-slate-500">
              Registro de entrada y salida de insumos (gasas, jeringas, guantes, sueros) con alertas de inventario
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewItemOpen(true)}
          className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md shadow-hospital-600/20 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Insumo / Fármaco
        </button>
      </div>

      {/* Filter and Summary Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar insumo, código, lote o estante..."
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
              <option value="Medicamentos">Medicamentos</option>
              <option value="Material de Curación">Material de Curación</option>
              <option value="Descartables">Descartables</option>
              <option value="Soluciones e Intravenosos">Soluciones e Intravenosos</option>
              <option value="Equipos de Protección (EPP)">Equipos de Protección (EPP)</option>
              <option value="Quirúrgico">Quirúrgico</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="Óptimo">Óptimo</option>
              <option value="Bajo Stock">Bajo Stock (&lt; Mínimo)</option>
              <option value="Crítico">Crítico (&lt; 50% Mínimo)</option>
              <option value="Próximo a Vencer">Próximo a Vencer</option>
            </select>
          </div>
        </div>

        {/* Counter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Mostrando <strong>{filteredStock.length}</strong> de {stock.length} artículos</span>
          {lowStockCount > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-600 font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40">
              <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} artículos con alerta de stock
            </span>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredStock.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No se encontraron insumos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Código / Insumo</th>
                  <th className="px-4 py-3.5">Categoría / Ubicación</th>
                  <th className="px-4 py-3.5">Stock Actual vs Mínimo</th>
                  <th className="px-4 py-3.5">Lote / Vencimiento</th>
                  <th className="px-4 py-3.5">Costo Unit.</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones Kardex</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStock.map((item) => {
                  const stockPercent = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-hospital-600 dark:text-hospital-400 block text-[11px]">
                          {item.code}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.presentation}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {item.location}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 min-w-[150px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                            {item.currentStock} unid.
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Mín: {item.minStock} / Máx: {item.maxStock}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === 'Crítico'
                                ? 'bg-rose-500'
                                : item.status === 'Bajo Stock'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-slate-700 dark:text-slate-300 block">
                          {item.batchNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Vence: {formatDate(item.expirationDate)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrencyPEN(item.unitCost)}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            item.status === 'Crítico'
                              ? 'danger'
                              : item.status === 'Bajo Stock'
                              ? 'warning'
                              : item.status === 'Próximo a Vencer'
                              ? 'warning'
                              : 'success'
                          }
                          size="sm"
                          dot
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setItemForMovement(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-hospital-600 hover:bg-hospital-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Despacho / Ingreso</span>
                          </button>

                          <button
                            onClick={() => setItemForKardexHistory(item)}
                            title="Ver Historial de Movimientos Kardex"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kardex History Modal */}
      {itemForKardexHistory && (
        <Modal
          isOpen={true}
          onClose={() => setItemForKardexHistory(null)}
          title={`Historial de Kardex: ${itemForKardexHistory.name}`}
          subtitle={`Código SKU: ${itemForKardexHistory.code} • Stock Actual: ${itemForKardexHistory.currentStock} unidades`}
          icon={<History className="w-5 h-5 text-hospital-600" />}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {(!itemForKardexHistory.movements || itemForKardexHistory.movements.length === 0) ? (
              <p className="text-slate-400 py-6 text-center">No hay registros de movimientos para este insumo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Fecha / Hora</th>
                      <th className="px-3 py-2">Tipo de Movimiento</th>
                      <th className="px-3 py-2">Cantidad</th>
                      <th className="px-3 py-2">Stock Resultante</th>
                      <th className="px-3 py-2">Origen / Destino</th>
                      <th className="px-3 py-2">Responsable</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {itemForKardexHistory.movements.map((mov) => {
                      const isEntry = mov.type.startsWith('Entrada');

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono text-slate-500">{mov.timestamp}</td>
                          <td className="px-3 py-2 font-semibold">
                            <span className={isEntry ? 'text-emerald-600' : 'text-rose-600'}>
                              {mov.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono font-bold">
                            {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-hospital-600">
                            {mov.newStock} unid.
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{mov.destinationOrOrigin}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{mov.responsible}</td>
                          <td className="px-3 py-2 text-slate-500 text-[11px]">{mov.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

      <StockMovementModal
        isOpen={!!itemForMovement}
        onClose={() => setItemForMovement(null)}
        item={itemForMovement}
      />

      <StockItemModal
        isOpen={isNewItemOpen}
        onClose={() => setIsNewItemOpen(false)}
      />
    </div>
  );
};
