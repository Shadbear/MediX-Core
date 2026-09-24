/**
 * Formatting Utilities for Patient Records, WhatsApp Links, and Clinical Data
 */

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatCurrencyPEN(amount: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
}

/**
 * Generate a WhatsApp reminder link for medication prescription
 */
export function generateWhatsAppPrescriptionUrl(
  phone: string,
  patientName: string,
  doctorName: string,
  prescriptionCode: string,
  medications: { name: string; dose: string; frequencyHours: number; durationDays: number; instructions: string; calculatedTimes?: string[] }[]
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  let message = `🏥 *HOSPITAL REGIONAL - GALENOS*\n`;
  message += `📋 *RECORDATORIO DE RECETA MÉDICA*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Paciente:* ${patientName}\n`;
  message += `👨‍⚕️ *Médico:* ${doctorName}\n`;
  message += `🔖 *N° Receta:* ${prescriptionCode}\n\n`;
  message += `💊 *INDICACIONES DE MEDICAMENTOS:*\n`;

  medications.forEach((med, idx) => {
    message += `\n*${idx + 1}. ${med.name}*\n`;
    message += `   • Dosis: ${med.dose}\n`;
    message += `   • Frecuencia: Cada ${med.frequencyHours} horas por ${med.durationDays} días\n`;
    if (med.calculatedTimes && med.calculatedTimes.length > 0) {
      message += `   • Horarios sugeridos: ${med.calculatedTimes.join(', ')}\n`;
    }
    if (med.instructions) {
      message += `   • Indicación: ${med.instructions}\n`;
    }
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚠️ _Recuerde no automedicarse y completar todo el tratamiento. Ante cualquier reacción adversa, acuda a urgencias._`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp Appointment confirmation link
 */
export function generateWhatsAppAppointmentUrl(
  phone: string,
  patientName: string,
  doctorName: string,
  specialty: string,
  date: string,
  time: string,
  consultingRoom: string,
  ticketNumber: string
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  let message = `🏥 *HOSPITAL REGIONAL - GALENOS*\n`;
  message += `📅 *CONFIRMACIÓN DE CITA MÉDICA*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Estimado(a) *${patientName}*,\n`;
  message += `Su cita ha sido registrada con éxito:\n\n`;
  message += `🔖 *Turno / Ticket:* ${ticketNumber}\n`;
  message += `🩺 *Especialidad:* ${specialty}\n`;
  message += `👨‍⚕️ *Médico:* ${doctorName}\n`;
  message += `🏢 *Consultorio:* ${consultingRoom}\n`;
  message += `📆 *Fecha:* ${formatDate(date)}\n`;
  message += `⏰ *Hora:* ${time}\n\n`;
  message += `📍 _Por favor llegar 15 minutos antes con su DNI para el triaje._`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Compute schedule intervals for a given frequency
 * e.g. every 8h from 08:00 -> ['08:00', '16:00', '00:00']
 */
export function computeDailyTimes(frequencyHours: number, startHour: number = 8): string[] {
  const times: string[] = [];
  const timesCount = Math.floor(24 / frequencyHours);
  for (let i = 0; i < timesCount; i++) {
    const h = (startHour + i * frequencyHours) % 24;
    times.push(`${String(h).padStart(2, '0')}:00`);
  }
  return times;
}
