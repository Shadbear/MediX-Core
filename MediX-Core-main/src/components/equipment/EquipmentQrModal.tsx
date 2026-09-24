import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { MedicalEquipment } from '../../types/hospital';
import { QrCode, Printer, Download, CheckCircle2, Stethoscope, MapPin } from 'lucide-react';
import { generateQrDataUrl, generateBarcodeSvgString } from '../../utils/qrBarcode';
import { formatDate } from '../../utils/formatters';

interface EquipmentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: MedicalEquipment | null;
}

export const EquipmentQrModal: React.FC<EquipmentQrModalProps> = ({
  isOpen,
  onClose,
  equipment,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (equipment) {
      generateQrDataUrl(equipment.qrCodeData).then(setQrUrl);
    }
  }, [equipment]);

  if (!equipment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Código QR: ${equipment.name}`}
      subtitle={`Código: ${equipment.code} • N° Serie: ${equipment.serialNumber}`}
      icon={<QrCode className="w-5 h-5 text-hospital-600" />}
      maxWidth="lg"
    >
      <div className="space-y-6 text-xs printable-area text-center">
        {/* Printable QR Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md max-w-sm mx-auto space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              HOSPITAL REGIONAL - MEDIX
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Control de Equipamiento Biomédico Móvil
            </p>
          </div>

          {/* QR Code Image */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 inline-block shadow-inner">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR Code ${equipment.code}`}
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                Generando QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-mono text-base font-black text-hospital-600">
              {equipment.code}
            </p>
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              {equipment.name}
            </p>
            <p className="text-[11px] text-slate-500">
              Marca: {equipment.brand} • Modelo: {equipment.model}
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              S/N: {equipment.serialNumber}
            </p>
          </div>

          <div className="pt-3 border-t text-[10px] text-slate-500 flex justify-between">
            <span>Área: <strong>{equipment.currentArea}</strong></span>
            <span>Estado: <strong>{equipment.status}</strong></span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-xl shadow-md shadow-hospital-600/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Etiqueta QR para Equipo
          </button>
        </div>
      </div>
    </Modal>
  );
};
