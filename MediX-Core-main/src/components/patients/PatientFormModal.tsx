import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Patient, Gender, InsuranceType, BloodType, PatientStatus } from '../../types/hospital';
import { User, ShieldCheck, Heart, AlertCircle, Phone, MapPin, Calendar } from 'lucide-react';
import { calculateAge } from '../../utils/formatters';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  patientToEdit,
}) => {
  const { addPatient, updatePatient } = useHospital();

  const [dni, setDni] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('M');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [insuranceType, setInsuranceType] = useState<InsuranceType>('SIS');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [status, setStatus] = useState<PatientStatus>('Activo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientToEdit) {
      setDni(patientToEdit.dni);
      setFirstName(patientToEdit.firstName);
      setLastName(patientToEdit.lastName);
      setBirthDate(patientToEdit.birthDate);
      setGender(patientToEdit.gender);
      setPhone(patientToEdit.phone);
      setEmail(patientToEdit.email || '');
      setAddress(patientToEdit.address);
      setInsuranceType(patientToEdit.insuranceType);
      setBloodType(patientToEdit.bloodType);
      setAllergiesText(patientToEdit.allergies.join(', '));
      setConditionsText(patientToEdit.chronicConditions.join(', '));
      setEmergencyName(patientToEdit.emergencyContact.name);
      setEmergencyPhone(patientToEdit.emergencyContact.phone);
      setEmergencyRel(patientToEdit.emergencyContact.relationship);
      setStatus(patientToEdit.status);
    } else {
      setDni('');
      setFirstName('');
      setLastName('');
      setBirthDate('1990-01-01');
      setGender('M');
      setPhone('');
      setEmail('');
      setAddress('');
      setInsuranceType('SIS');
      setBloodType('O+');
      setAllergiesText('');
      setConditionsText('');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRel('');
      setStatus('Activo');
    }
    setError(null);
  }, [patientToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim() || !firstName.trim() || !lastName.trim() || !birthDate) {
      setError('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    const allergies = allergiesText
      ? allergiesText.split(',').map((a) => a.trim()).filter(Boolean)
      : ['Ninguna conocida'];

    const chronicConditions = conditionsText
      ? conditionsText.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const patientData = {
      dni: dni.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      gender,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Dirección no especificada',
      insuranceType,
      bloodType,
      allergies,
      chronicConditions,
      emergencyContact: {
        name: emergencyName.trim() || 'No registrado',
        phone: emergencyPhone.trim() || 'No registrado',
        relationship: emergencyRel.trim() || 'Familiar',
      },
      status,
    };

    if (patientToEdit) {
      updatePatient(patientToEdit.id, patientData);
    } else {
      addPatient(patientData);
    }

    onClose();
  };

  const calculatedAge = birthDate ? calculateAge(birthDate) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientToEdit ? 'Editar Datos del Paciente' : 'Nuevo Registro de Paciente (Admisión)'}
      subtitle="Filiación institucional estandarizada inspirada en MEDIX"
      icon={<User className="w-5 h-5" />}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Datos Personales */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-hospital-600 dark:text-hospital-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            <User className="w-3.5 h-3.5" /> 1. Datos de Identificación y Filiación
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Documento de Identidad (DNI) *
              </label>
              <input
                type="text"
                maxLength={12}
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 45892019"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombres *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej: Juan Carlos"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej: Gómez Salazar"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Nacimiento * (Edad: {calculatedAge} años)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sexo Biológico *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 987654321"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dirección Domiciliaria
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Los Laureles 123, Distrito"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@correo.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Seguro y Antecedentes Clínicos */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5" /> 2. Seguro y Datos Médicos Iniciales
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Seguro de Salud
              </label>
              <select
                value={insuranceType}
                onChange={(e) => setInsuranceType(e.target.value as InsuranceType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              >
                <option value="SIS">SIS (Seguro Integral de Salud)</option>
                <option value="EsSalud">EsSalud</option>
                <option value="Privado">Seguro Privado (Rímac/Pacífico/Sanitas)</option>
                <option value="Particular">Particular / Pagante</option>
                <option value="SOAT">SOAT / Accidente de Tránsito</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grupo Sanguíneo y Factor Rh
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as BloodType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500 font-mono font-bold"
              >
                <option value="O+">O Positivo (O+)</option>
                <option value="O-">O Negativo (O-)</option>
                <option value="A+">A Positivo (A+)</option>
                <option value="A-">A Negativo (A-)</option>
                <option value="B+">B Positivo (B+)</option>
                <option value="B-">B Negativo (B-)</option>
                <option value="AB+">AB Positivo (AB+)</option>
                <option value="AB-">AB Negativo (AB-)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado del Paciente
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              >
                <option value="Activo">Activo (Ambulatorio)</option>
                <option value="Hospitalizado">Hospitalizado</option>
                <option value="En Observación">En Observación (Emergencia)</option>
                <option value="De Alta">De Alta</option>
              </select>
            </div>

            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias Conocidas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="Ej: Penicilina, Sulfas, Metamizol"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enfermedades Crónicas / Comorbilidades
                </label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  placeholder="Ej: Diabetes Tipo 2, HTA, Asma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Contacto de Emergencia */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Heart className="w-3.5 h-3.5" /> 3. Contacto de Emergencia
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Contacto
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Ej: María Gómez (Madre)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono de Emergencia
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Ej: 981234567"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parentesco
              </label>
              <input
                type="text"
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                placeholder="Ej: Cónyuge, Hijo, Padre"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-hospital-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold shadow-md shadow-hospital-600/20 active:scale-95 transition-all"
          >
            {patientToEdit ? 'Actualizar Paciente' : 'Guardar y Generar Historia Clínica'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
