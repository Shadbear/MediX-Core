'use strict';
/* Programación de médicos, cupos y franjas horarias.
   Sin base de datos: opera sobre el objeto `db` en memoria de server.js
   (db.programacion = turnos de los médicos, db.citas = citas asignadas). */

const pad = (n) => String(n).padStart(2, '0');
const toMin = (h) => { const [a, b] = h.split(':'); return Number(a) * 60 + Number(b); };
const toHM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIAS_RE = /^[0-6](,[0-6])*$/; // 0 = domingo ... 6 = sábado
const SEGUROS = ['SIS', 'EsSalud', 'Particular', 'Otro'];

function validDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
const validMonth = (s) => typeof s === 'string' && MONTH_RE.test(s);
const weekday = (s) => new Date(`${s}T00:00:00Z`).getUTCDay();
const addDays = (s, n) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Fecha y hora locales del servidor: { fecha: 'AAAA-MM-DD', hora: 'HH:MM' }. */
function localNow(t = Date.now()) {
  const iso = new Date(t - new Date(t).getTimezoneOffset() * 6e4).toISOString();
  return { fecha: iso.slice(0, 10), hora: iso.slice(11, 16) };
}

const diasDe = (p) => String(p.dias ?? '').split(',').filter(Boolean).map(Number);
const atiende = (p, fecha) => validDate(fecha) && diasDe(p).includes(weekday(fecha));

/** Franjas del turno: [{hi, hf}] cada `dur` minutos. */
function slotsDe(p) {
  const out = [];
  const dur = Number(p.dur);
  if (!TIME_RE.test(p.hi) || !TIME_RE.test(p.hf) || !(dur > 0)) return out;
  for (let m = toMin(p.hi); m + dur <= toMin(p.hf); m += dur) out.push({ hi: toHM(m), hf: toHM(m + dur) });
  return out;
}

const activas = (db, p, fecha) => db.citas.filter((c) => c.fecha === fecha && c.medico === p.medico && c.estado !== 'Cancelada');
const vencida = (fecha, slot, now) => fecha < now.fecha || (fecha === now.fecha && slot.hf <= now.hora);

/** Franjas de un médico en una fecha, con su estado: Disponible / Ocupado / Vencido. */
function franjas(db, p, fecha, now = localNow()) {
  if (!atiende(p, fecha)) return { laborable: false, franjas: [], total: 0, libres: 0 };
  const citas = activas(db, p, fecha);
  const lista = slotsDe(p).map((s, i) => {
    const c = citas.find((x) => x.hora === s.hi);
    const venc = vencida(fecha, s, now);
    return {
      n: i + 1, hi: s.hi, hf: s.hf, vencido: venc,
      estado: c ? 'Ocupado' : venc ? 'Vencido' : 'Disponible',
      cita: c ? { id: c.id, paciente: c.paciente, dni: c.dni || '', cuenta: c.cuenta ?? null, estado: c.estado } : null,
    };
  });
  return { laborable: true, franjas: lista, total: lista.length, libres: lista.filter((f) => f.estado === 'Disponible').length };
}

/** Calendario mensual: { 'AAAA-MM-DD': { total, libres, ocupados } } solo para días programados. */
function calendario(db, p, mes, now = localNow()) {
  const [y, m] = mes.split('-').map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dias = {};
  for (let d = 1; d <= n; d++) {
    const f = `${mes}-${pad(d)}`;
    if (!atiende(p, f)) continue;
    const r = franjas(db, p, f, now);
    dias[f] = { total: r.total, libres: r.libres, ocupados: r.franjas.filter((x) => x.estado === 'Ocupado').length };
  }
  return dias;
}

/** Primer cupo libre (fecha y hora más próximas) entre las programaciones dadas. */
function proximo(db, progs, now = localNow(), horizonte = 120) {
  let best = null;
  for (const p of progs) {
    for (let i = 0; i <= horizonte; i++) {
      const f = addDays(now.fecha, i);
      if (best && f > best.fecha) break;
      if (!atiende(p, f)) continue;
      const s = franjas(db, p, f, now).franjas.find((x) => x.estado === 'Disponible');
      if (!s) continue;
      if (!best || f < best.fecha || (f === best.fecha && s.hi < best.hi)) best = { prog: p.id, fecha: f, hi: s.hi, hf: s.hf };
      break;
    }
  }
  return best;
}

/** Valida una cita ligada a una programación. Devuelve un mensaje de error o null. */
function validarCita(db, o, id, now = localNow(), { past = true } = {}) {
  if (!o.prog) return null; // cita antigua, sin programación
  const p = db.programacion.find((x) => x.id === o.prog);
  if (!p) return 'La programación indicada no existe';
  if (o.medico !== p.medico) return 'El médico no corresponde a la programación';
  if (!atiende(p, o.fecha)) return 'El médico no atiende ese día';
  const s = slotsDe(p).find((x) => x.hi === o.hora);
  if (!s) return 'La hora no corresponde a una franja programada';
  if (past && vencida(o.fecha, s, now)) return 'La franja horaria ya venció';
  if (o.dni && db.citas.some((c) => c.id !== id && c.estado !== 'Cancelada' && c.dni === o.dni && c.fecha === o.fecha && c.hora === o.hora)) {
    return 'El paciente ya tiene una cita en ese horario';
  }
  return null;
}

/** Valida una programación de médico. Devuelve un mensaje de error o null. */
function validarProgramacion(o) {
  if (typeof o.medico !== 'string' || o.medico.trim().length < 3) return 'Indica el nombre del médico';
  if (typeof o.especialidad !== 'string' || !o.especialidad.trim()) return 'Indica la especialidad';
  if (typeof o.consultorio !== 'string' || !o.consultorio.trim()) return 'Indica el consultorio';
  if (!TIME_RE.test(o.hi) || !TIME_RE.test(o.hf)) return 'Horas con formato HH:MM';
  if (toMin(o.hf) <= toMin(o.hi)) return 'La hora de fin debe ser posterior al inicio';
  if (!Number.isInteger(o.dur) || o.dur < 5 || o.dur > 120) return 'La duración por cita debe ser de 5 a 120 minutos';
  if (toMin(o.hf) - toMin(o.hi) < o.dur) return 'El turno es más corto que la duración de una cita';
  if (typeof o.dias !== 'string' || !DIAS_RE.test(o.dias)) return 'Selecciona al menos un día de atención';
  return null;
}

/** Asigna un cupo a un paciente. Devuelve { cita } o { error, status }. */
function asignar(db, b, { id, now = localNow() }) {
  const p = db.programacion.find((x) => x.id === b.prog);
  if (!p) return { error: 'Selecciona un médico programado', status: 404 };
  // Si viene `pid`, el paciente sale del registro de pacientes (con su historia clínica).
  const pac = b.pid ? (db.pacientes || []).find((x) => x.id === b.pid) : null;
  if (b.pid && !pac) return { error: 'Paciente no encontrado', status: 404 };
  const paciente = pac ? `${pac.apellidos}, ${pac.nombres}`.slice(0, 100) : String(b.paciente ?? '').trim().slice(0, 100);
  const dni = pac ? pac.dni : String(b.dni ?? '').trim().toUpperCase();
  if (paciente.length < 3) return { error: 'Ingresa el nombre del paciente', status: 400 };
  if (!/^[A-Z0-9]{8,12}$/.test(dni)) return { error: 'El documento debe tener entre 8 y 12 letras o números', status: 400 };
  if (!SEGUROS.includes(b.seguro)) return { error: 'Selecciona el tipo de seguro', status: 400 };
  if (!validDate(b.fecha)) return { error: 'Fecha inválida', status: 400 };
  if (typeof b.hora !== 'string' || !TIME_RE.test(b.hora)) return { error: 'Hora inválida', status: 400 };

  const o = { prog: p.id, medico: p.medico, consultorio: p.consultorio, especialidad: p.especialidad, fecha: b.fecha, hora: b.hora, paciente, dni, seguro: b.seguro, estado: 'Programada', ...(pac ? { pid: pac.id, hc: pac.hc } : {}) };
  let error = validarCita(db, o, null, now);
  if (!error && db.citas.some((c) => c.estado !== 'Cancelada' && c.medico === o.medico && c.fecha === o.fecha && c.hora === o.hora)) error = 'Ese cupo ya fue asignado';
  if (error) return { error, status: 409 };

  db.meta.cuenta = (db.meta.cuenta ?? 1000) + 1; // N° de cuenta correlativo
  const cita = { ...o, cuenta: db.meta.cuenta, id, ts: Date.now() };
  db.citas.push(cita);
  return { cita };
}

module.exports = { localNow, validDate, validMonth, slotsDe, franjas, calendario, proximo, validarCita, validarProgramacion, asignar, SEGUROS };
