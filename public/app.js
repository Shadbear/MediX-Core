'use strict';
/* MediX-Core · interfaz web. Sin dependencias ni build.
   Seguridad: todo el texto se inserta con textContent (nunca innerHTML) -> sin XSS;
   sin scripts ni estilos en línea -> compatible con la CSP estricta del servidor. */

const state = { user: null, notice: null };
const app = document.getElementById('app');
const IDLE_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------- utilidades ---
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false || k === 'value') continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  if (attrs && attrs.value !== undefined && attrs.value !== null) el.value = attrs.value;
  return el;
}

class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

async function api(method, url, body) {
  let res;
  try {
    res = await fetch('/api' + url, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'medix' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, 'NETWORK');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    if (res.status === 401 && state.user) {
      state.user = null;
      state.notice = 'Tu sesión terminó. Inicia sesión nuevamente.';
      render();
    }
    const msg = data && data.details && data.details.length ? data.details.map((d) => d.message).join('. ') : (data && data.error) || 'Ocurrió un error inesperado';
    throw new ApiError(msg, res.status, data && data.code);
  }
  return data;
}

const can = (p) => !!state.user && state.user.permissions.includes(p);
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('es-PE') : '—');
const fullName = (p) => `${p.firstName} ${p.lastName}`;
const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const ROLE_LABEL = { admin: 'Administrador', medico: 'Médico', enfermeria: 'Enfermería', recepcion: 'Recepción' };

function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

function badge(text) {
  const good = ['Disponible', 'Libre', 'Atendida', 'Activo'];
  const warn = ['Stock Bajo', 'En Limpieza', 'Pendiente', 'En Observación', 'Mantenimiento', 'En Sala de Espera', 'Llamado', 'En Atención'];
  const bad = ['Agotado', 'Cancelada', 'Ocupada', 'Hospitalizado'];
  return h('span', { class: 'badge ' + (good.includes(text) ? 'ok' : warn.includes(text) ? 'warn' : bad.includes(text) ? 'bad' : '') }, text);
}

const table = (headers, rows, emptyText = 'Sin registros') =>
  rows.length
    ? h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, headers.map((x) => h('th', {}, x)))), h('tbody', {}, rows)))
    : h('div', { class: 'card empty' }, emptyText);

// ---------------------------------------------------------------- formularios ---
/** fields: [{ name, label, type, options, required, wide, max }] */
function buildForm(fields, values = {}) {
  const inputs = {};
  const rows = fields.map((f) => {
    let input;
    if (f.type === 'select') {
      input = h('select', { name: f.name, required: f.required }, (f.options || []).map((o) => h('option', { value: o.value ?? o }, o.label ?? o)));
    } else if (f.type === 'textarea') {
      input = h('textarea', { name: f.name, rows: 3, maxlength: f.max || 5000, required: f.required });
    } else {
      input = h('input', { name: f.name, type: f.type || 'text', required: f.required, maxlength: f.max, min: f.min, step: f.step, autocomplete: 'off' });
    }
    if (values[f.name] !== undefined && values[f.name] !== null) input.value = values[f.name];
    inputs[f.name] = input;
    return h('label', { class: 'field' + (f.wide ? ' wide' : '') }, f.label + (f.required ? ' *' : ''), input);
  });
  const read = () => {
    const out = {};
    for (const f of fields) {
      const v = inputs[f.name].value;
      out[f.name] = f.type === 'number' ? (v === '' ? undefined : Number(v)) : v.trim();
    }
    return out;
  };
  return { rows, read, inputs };
}

function modal(title, fields, values, submitText, onSubmit) {
  const form = buildForm(fields, values);
  const err = h('div', { class: 'error', role: 'alert' });
  const overlay = h('div', { class: 'overlay' });
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const submit = h('button', { class: 'btn primary', type: 'submit' }, submitText);
  const el = h('form', {
    class: 'modal',
    async onsubmit(e) {
      e.preventDefault();
      err.textContent = '';
      submit.disabled = true;
      try { await onSubmit(form.read()); close(); } catch (ex) { err.textContent = ex.message; submit.disabled = false; }
    },
  }, h('h2', {}, title), h('div', { class: 'grid' }, form.rows), err,
  h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancelar'), submit));
  overlay.append(el);
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  const first = el.querySelector('input, select, textarea');
  if (first) first.focus();
}

function confirmBox(message, onYes) {
  const overlay = h('div', { class: 'overlay' });
  const close = () => overlay.remove();
  overlay.append(h('div', { class: 'modal' }, h('p', {}, message),
    h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Cancelar'),
      h('button', { class: 'btn danger', async onclick() { close(); try { await onYes(); } catch (e) { toast(e.message); } } }, 'Confirmar'))));
  document.body.append(overlay);
}

// ---------------------------------------------------------------- navegación ---
const NAV = [
  ['patients', 'Pacientes', 'patients:list'],
  ['appointments', 'Citas', 'appointments:read'],
  ['stock', 'Inventario', 'stock:read'],
  ['beds', 'Camas', 'beds:read'],
  ['admin', 'Administración', 'users:manage'],
];
const go = (route, param) => { location.hash = param ? `#/${route}/${param}` : `#/${route}`; };
function currentRoute() {
  const [, route, param] = (location.hash || '').split('/');
  const allowed = NAV.filter((n) => can(n[2])).map((n) => n[0]);
  if (route === 'patient' && param && allowed.includes('patients')) return { route: 'patient', param };
  return { route: allowed.includes(route) ? route : allowed[0], param };
}

// ---------------------------------------------------------------- pantallas de acceso ---
function loginScreen() {
  const err = h('div', { class: 'error', role: 'alert' });
  const user = h('input', { name: 'username', autocomplete: 'username', required: true, maxlength: 50 });
  const pass = h('input', { name: 'password', type: 'password', autocomplete: 'current-password', required: true, maxlength: 200 });
  const btn = h('button', { class: 'btn primary', type: 'submit' }, 'Ingresar');
  const form = h('form', {
    async onsubmit(e) {
      e.preventDefault();
      err.textContent = ''; btn.disabled = true;
      try {
        const res = await api('POST', '/auth/login', { username: user.value, password: pass.value });
        state.user = res.user; state.notice = null;
        render();
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; pass.value = ''; }
    },
  }, h('h1', {}, 'MediX-Core'),
  state.notice && h('div', { class: 'notice' }, state.notice),
  h('label', { class: 'field' }, 'Usuario', user), h('label', { class: 'field' }, 'Contraseña', pass), err, btn);
  return h('div', { class: 'auth' }, form);
}

function changePasswordScreen() {
  const err = h('div', { class: 'error', role: 'alert' });
  const cur = h('input', { type: 'password', autocomplete: 'current-password', required: true, maxlength: 200 });
  const n1 = h('input', { type: 'password', autocomplete: 'new-password', required: true, minlength: 10, maxlength: 72 });
  const n2 = h('input', { type: 'password', autocomplete: 'new-password', required: true, maxlength: 72 });
  const btn = h('button', { class: 'btn primary', type: 'submit' }, 'Guardar contraseña');
  const form = h('form', {
    async onsubmit(e) {
      e.preventDefault();
      err.textContent = '';
      if (n1.value !== n2.value) { err.textContent = 'Las contraseñas nuevas no coinciden'; return; }
      btn.disabled = true;
      try {
        const res = await api('POST', '/auth/change-password', { currentPassword: cur.value, newPassword: n1.value });
        state.user = res.user;
        render();
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    },
  }, h('h1', {}, 'Cambia tu contraseña'),
  h('p', { class: 'muted small' }, 'Mínimo 10 caracteres, con letras y números. No uses tu nombre de usuario.'),
  h('label', { class: 'field' }, 'Contraseña actual (temporal)', cur), h('label', { class: 'field' }, 'Contraseña nueva', n1),
  h('label', { class: 'field' }, 'Repite la nueva', n2), err, btn);
  return h('div', { class: 'auth' }, form);
}

async function logout() {
  try { await api('POST', '/auth/logout'); } catch { /* da igual */ }
  state.user = null;
  render();
}

// ---------------------------------------------------------------- pacientes ---
const GENDERS = ['M', 'F', 'Otro'];
const INSURANCES = ['SIS', 'EsSalud', 'Privado', 'Particular', 'SOAT'];
const BLOODS = ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const PATIENT_STATUS = ['Activo', 'Hospitalizado', 'En Observación', 'De Alta'];

function patientFields(mode) {
  const f = [];
  if (mode === 'create' || can('patients:update_identity')) {
    f.push({ name: 'dni', label: 'Documento (8-12 letras/números)', required: true, max: 12 },
      { name: 'firstName', label: 'Nombres', required: true, max: 100 },
      { name: 'lastName', label: 'Apellidos', required: true, max: 100 },
      { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true },
      { name: 'gender', label: 'Sexo', type: 'select', options: GENDERS });
  }
  f.push({ name: 'phone', label: 'Teléfono', required: true, max: 30 },
    { name: 'email', label: 'Correo', type: 'email', max: 150 },
    { name: 'address', label: 'Dirección', required: true, max: 250, wide: true },
    { name: 'insuranceType', label: 'Seguro', type: 'select', options: INSURANCES },
    { name: 'ecName', label: 'Contacto de emergencia', max: 150 },
    { name: 'ecPhone', label: 'Teléfono de emergencia', max: 30 },
    { name: 'ecRel', label: 'Parentesco', max: 50 });
  if (can('patients:update_clinical')) {
    f.push({ name: 'bloodType', label: 'Grupo sanguíneo', type: 'select', options: BLOODS },
      { name: 'allergies', label: 'Alergias (separadas por coma)', wide: true },
      { name: 'chronicConditions', label: 'Condiciones crónicas (separadas por coma)', wide: true });
  }
  return f;
}

function patientPayload(v) {
  const p = { ...v, emergencyContact: { name: v.ecName, phone: v.ecPhone, relationship: v.ecRel } };
  delete p.ecName; delete p.ecPhone; delete p.ecRel;
  if ('allergies' in v) p.allergies = list(v.allergies);
  if ('chronicConditions' in v) p.chronicConditions = list(v.chronicConditions);
  return p;
}

function patientValues(p) {
  return { ...p, ecName: p.emergencyContact.name, ecPhone: p.emergencyContact.phone, ecRel: p.emergencyContact.relationship,
    allergies: (p.allergies || []).join(', '), chronicConditions: (p.chronicConditions || []).join(', ') };
}

async function patientsView() {
  const patients = await api('GET', '/patients');
  const tbody = h('tbody');
  const fill = (q) => {
    const s = q.trim().toLowerCase();
    const rows = patients.filter((p) => !s || `${p.dni} ${fullName(p)} ${p.medicalRecordNumber}`.toLowerCase().includes(s));
    tbody.replaceChildren(...rows.map((p) => h('tr', { class: 'click', tabindex: 0, onclick: () => go('patient', p.id), onkeydown: (e) => { if (e.key === 'Enter') go('patient', p.id); } },
      h('td', {}, p.medicalRecordNumber), h('td', {}, p.dni), h('td', {}, fullName(p)), h('td', {}, p.phone), h('td', {}, p.insuranceType), h('td', {}, badge(p.status)))));
    if (!rows.length) tbody.replaceChildren(h('tr', {}, h('td', { colspan: 6, class: 'empty' }, 'Sin resultados')));
  };
  fill('');
  return h('div', {},
    h('div', { class: 'bar' }, h('h1', {}, 'Pacientes'), h('div', { class: 'tools' },
      h('input', { class: 'search', type: 'search', placeholder: 'Buscar por nombre o documento', 'aria-label': 'Buscar', oninput: (e) => fill(e.target.value) }),
      can('patients:create') && h('button', { class: 'btn primary', onclick: () => modal('Nuevo paciente', patientFields('create'), { gender: 'M', insuranceType: 'SIS' }, 'Registrar',
        async (v) => { const p = await api('POST', '/patients', patientPayload(v)); toast('Paciente registrado'); go('patient', p.id); }) }, 'Nuevo paciente'))),
    h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Historia', 'Documento', 'Paciente', 'Teléfono', 'Seguro', 'Estado'].map((x) => h('th', {}, x)))), tbody)));
}

async function patientDetailView(id) {
  const [p, entries] = await Promise.all([api('GET', `/patients/${id}`), can('clinical:read') ? api('GET', `/patients/${id}/clinical-entries`) : Promise.resolve(null)]);
  const kv = (label, val) => [h('dt', {}, label), h('dd', {}, val || '—')];
  const chips = (arr) => (arr && arr.length ? h('div', { class: 'chips' }, arr.map((x) => h('span', { class: 'badge' }, x))) : '—');
  const statusSel = can('patients:update_status') && h('select', { class: 'search', 'aria-label': 'Estado', onchange: async (e) => {
    try { await api('PUT', `/patients/${id}`, { status: e.target.value }); toast('Estado actualizado'); } catch (ex) { toast(ex.message); }
  } }, PATIENT_STATUS.map((s) => h('option', { value: s, selected: s === p.status }, s)));
  const vit = (v) => Object.entries({ 'PA': v.bloodPressure, 'FC': v.heartRate, 'FR': v.respiratoryRate, 'T°': v.temperature, 'SpO₂': v.oxygenSaturation, 'Peso': v.weight, 'Talla': v.height, 'Dolor': v.painLevel })
    .filter(([, x]) => x !== null && x !== undefined).map(([k, x]) => `${k}: ${x}`).join(' · ');

  return h('div', {},
    h('div', { class: 'bar' }, h('div', {}, h('a', { onclick: () => go('patients') }, '← Pacientes'), h('h1', {}, fullName(p))),
      h('div', { class: 'tools' }, statusSel,
        h('button', { class: 'btn', onclick: () => modal('Editar paciente', patientFields('edit'), patientValues(p), 'Guardar', async (v) => { await api('PUT', `/patients/${id}`, patientPayload(v)); toast('Datos guardados'); render(); }) }, 'Editar'),
        can('patients:delete') && h('button', { class: 'btn danger', onclick: () => confirmBox('¿Dar de baja a este paciente? Podrá restaurarse después.', async () => { await api('DELETE', `/patients/${id}`); toast('Paciente dado de baja'); go('patients'); }) }, 'Dar de baja'))),
    h('div', { class: 'card' }, h('dl', { class: 'kv' },
      kv('Historia', p.medicalRecordNumber), kv('Documento', p.dni), kv('Nacimiento', p.birthDate), kv('Sexo', p.gender), kv('Teléfono', p.phone), kv('Correo', p.email),
      kv('Dirección', p.address), kv('Seguro', p.insuranceType), kv('Estado', badge(p.status)),
      kv('Emergencia', [p.emergencyContact.name, p.emergencyContact.phone, p.emergencyContact.relationship].filter(Boolean).join(' · ')),
      can('clinical:read') && [kv('Grupo sanguíneo', p.bloodType), kv('Alergias', chips(p.allergies)), kv('Condiciones crónicas', chips(p.chronicConditions))])),
    entries && h('div', { class: 'card' },
      h('div', { class: 'bar' }, h('h2', {}, 'Historia clínica'), can('clinical:create') && h('button', { class: 'btn primary', onclick: () => clinicalModal(id) }, 'Nueva entrada')),
      entries.length ? entries.map((e) => h('div', { class: 'entry' },
        h('strong', {}, `${fmtDateTime(e.date)} · ${e.doctorName} · ${e.specialty}`),
        vit(e.vitalSigns) && h('p', { class: 'muted small' }, vit(e.vitalSigns)),
        h('p', {}, h('b', {}, 'Síntomas: '), e.symptoms), h('p', {}, h('b', {}, 'Diagnóstico: '), e.diagnosis + (e.cie10Code ? ` (${e.cie10Code})` : '')),
        h('p', {}, h('b', {}, 'Tratamiento: '), e.treatment), e.notes && h('p', {}, h('b', {}, 'Notas: '), e.notes))) : h('p', { class: 'muted' }, 'Sin entradas todavía.')));
}

function clinicalModal(patientId) {
  const fields = [
    { name: 'specialty', label: 'Especialidad', required: true, max: 100 }, { name: 'cie10Code', label: 'Código CIE-10', max: 10 },
    { name: 'symptoms', label: 'Síntomas', type: 'textarea', required: true, wide: true }, { name: 'diagnosis', label: 'Diagnóstico', type: 'textarea', required: true, wide: true },
    { name: 'treatment', label: 'Tratamiento', type: 'textarea', required: true, wide: true }, { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
    { name: 'bloodPressure', label: 'Presión arterial (120/80)', max: 7 }, { name: 'heartRate', label: 'Frec. cardíaca', type: 'number' },
    { name: 'respiratoryRate', label: 'Frec. respiratoria', type: 'number' }, { name: 'temperature', label: 'Temperatura °C', type: 'number', step: '0.1' },
    { name: 'oxygenSaturation', label: 'SpO₂ %', type: 'number' }, { name: 'weight', label: 'Peso kg', type: 'number', step: '0.1' },
    { name: 'height', label: 'Talla cm', type: 'number', step: '0.1' }, { name: 'painLevel', label: 'Dolor (0-10)', type: 'number' },
  ];
  modal('Nueva entrada clínica', fields, {}, 'Guardar entrada', async (v) => {
    const vitalSigns = {};
    for (const k of ['bloodPressure', 'heartRate', 'respiratoryRate', 'temperature', 'oxygenSaturation', 'weight', 'height', 'painLevel']) {
      if (v[k] !== undefined && v[k] !== '') vitalSigns[k] = v[k];
    }
    await api('POST', `/patients/${patientId}/clinical-entries`, { specialty: v.specialty, cie10Code: v.cie10Code, symptoms: v.symptoms, diagnosis: v.diagnosis, treatment: v.treatment, notes: v.notes, vitalSigns });
    toast('Entrada guardada (no se puede editar después)');
    render();
  });
}

// ---------------------------------------------------------------- citas ---
const APPT_TYPES = ['Primera Vez', 'Control / Seguimiento', 'Lectura de Exámenes', 'Procedimiento'];
const APPT_STATUS = ['Pendiente', 'En Sala de Espera', 'Llamado', 'En Atención', 'Atendida', 'Cancelada', 'Reprogramada'];

async function appointmentsView() {
  const appts = await api('GET', '/appointments');
  const rows = appts.map((a) => h('tr', {},
    h('td', {}, a.ticketNumber), h('td', {}, `${a.date} ${a.time}`), h('td', {}, a.patientName), h('td', {}, a.doctorName || '—'), h('td', {}, a.specialty), h('td', {}, a.type),
    h('td', {}, can('appointments:update_status')
      ? h('select', { 'aria-label': 'Estado de la cita', onchange: async (e) => { try { await api('PATCH', `/appointments/${a.id}/status`, { status: e.target.value }); toast('Estado actualizado'); } catch (ex) { toast(ex.message); render(); } } },
        APPT_STATUS.map((s) => h('option', { value: s, selected: s === a.status }, s)))
      : badge(a.status))));
  return h('div', {},
    h('div', { class: 'bar' }, h('h1', {}, 'Citas'), can('appointments:create') && h('button', { class: 'btn primary', async onclick() {
      const [patients, doctors] = await Promise.all([api('GET', '/patients'), api('GET', '/appointments/doctors')]);
      modal('Nueva cita', [
        { name: 'patientId', label: 'Paciente', type: 'select', required: true, options: patients.map((p) => ({ value: p.id, label: `${fullName(p)} (${p.dni})` })) },
        { name: 'doctorId', label: 'Médico', type: 'select', options: [{ value: '', label: '— sin asignar —' }, ...doctors.map((d) => ({ value: d.id, label: d.fullName }))] },
        { name: 'specialty', label: 'Especialidad', required: true, max: 100 }, { name: 'consultingRoom', label: 'Consultorio', max: 30 },
        { name: 'date', label: 'Fecha', type: 'date', required: true }, { name: 'time', label: 'Hora', type: 'time', required: true },
        { name: 'type', label: 'Tipo', type: 'select', options: APPT_TYPES }, { name: 'reason', label: 'Motivo', type: 'textarea', wide: true },
      ], { type: APPT_TYPES[0] }, 'Crear cita', async (v) => { await api('POST', '/appointments', v); toast('Cita creada'); render(); });
    } }, 'Nueva cita')),
    table(['Ticket', 'Fecha y hora', 'Paciente', 'Médico', 'Especialidad', 'Tipo', 'Estado'], rows, 'No hay citas'));
}

// ---------------------------------------------------------------- inventario ---
const MOVEMENTS = ['Entrada (Compra)', 'Entrada (Donación)', 'Salida (Atención Paciente)', 'Salida (Despacho a Servicio)', 'Ajuste de Inventario'];

async function stockView() {
  const items = await api('GET', '/stock');
  const rows = items.map((i) => h('tr', {},
    h('td', {}, i.code), h('td', {}, i.name), h('td', {}, i.category), h('td', {}, `${i.currentStock} (mín. ${i.minStock})`), h('td', {}, i.expirationDate || '—'), h('td', {}, badge(i.status)),
    h('td', {}, can('stock:move') && h('button', { class: 'btn small', onclick: () => modal(`Movimiento: ${i.name}`, [
      { name: 'type', label: 'Tipo', type: 'select', options: MOVEMENTS }, { name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
      { name: 'destinationOrOrigin', label: 'Origen / destino', max: 150 }, { name: 'reason', label: 'Motivo', max: 500, wide: true },
    ], {}, 'Registrar', async (v) => { await api('POST', `/stock/${i.id}/movements`, v); toast('Movimiento registrado'); render(); }) }, 'Movimiento'))));
  return h('div', {},
    h('div', { class: 'bar' }, h('h1', {}, 'Inventario'), can('stock:manage') && h('button', { class: 'btn primary', onclick: () => modal('Nuevo ítem', [
      { name: 'code', label: 'Código', required: true, max: 30 }, { name: 'name', label: 'Nombre', required: true, max: 150 },
      { name: 'category', label: 'Categoría', required: true, max: 60 }, { name: 'presentation', label: 'Presentación', max: 60 },
      { name: 'currentStock', label: 'Stock inicial', type: 'number', min: 0 }, { name: 'minStock', label: 'Stock mínimo', type: 'number', min: 0 },
      { name: 'unitCost', label: 'Costo unitario', type: 'number', step: '0.01', min: 0 }, { name: 'location', label: 'Ubicación', max: 60 },
      { name: 'expirationDate', label: 'Vencimiento', type: 'date' }, { name: 'batchNumber', label: 'Lote', max: 40 },
    ], { currentStock: 0, minStock: 0 }, 'Crear ítem', async (v) => { await api('POST', '/stock', v); toast('Ítem creado'); render(); }) }, 'Nuevo ítem')),
    table(['Código', 'Nombre', 'Categoría', 'Stock', 'Vence', 'Estado', ''], rows, 'El inventario está vacío'));
}

// ---------------------------------------------------------------- camas ---
async function bedsView() {
  const beds = await api('GET', '/beds');
  const wards = [...new Set(beds.map((b) => b.ward))];
  const card = (b) => h('div', { class: 'bed' },
    h('div', { class: 'bar' }, h('strong', {}, b.bedNumber), badge(b.status)),
    b.patientName && h('div', {}, b.patientName), b.doctorInCharge && h('div', { class: 'small muted' }, `Dr(a). ${b.doctorInCharge}`),
    b.diagnosis && h('div', { class: 'small muted' }, b.diagnosis), b.admissionDate && h('div', { class: 'small muted' }, `Ingreso: ${fmtDateTime(b.admissionDate)}`),
    can('beds:manage') && h('div', { class: 'tools' },
      b.status === 'Libre' && h('button', { class: 'btn small primary', async onclick() {
        const patients = (await api('GET', '/patients')).filter((p) => p.status !== 'Hospitalizado');
        modal(`Asignar cama ${b.bedNumber}`, [
          { name: 'patientId', label: 'Paciente', type: 'select', required: true, options: patients.map((p) => ({ value: p.id, label: `${fullName(p)} (${p.dni})` })) },
          { name: 'doctorInCharge', label: 'Médico a cargo', max: 150 }, { name: 'diagnosis', label: 'Diagnóstico', type: 'textarea', wide: true },
        ], {}, 'Asignar', async (v) => { await api('POST', `/beds/${b.id}/assign`, v); toast('Cama asignada'); render(); });
      } }, 'Asignar'),
      b.status === 'Ocupada' && h('button', { class: 'btn small', onclick: () => confirmBox('¿Liberar esta cama? El paciente pasará a "De Alta".', async () => { await api('POST', `/beds/${b.id}/release`); render(); }) }, 'Liberar'),
      (b.status === 'En Limpieza' || b.status === 'Mantenimiento') && h('button', { class: 'btn small', onclick: async () => { try { await api('POST', `/beds/${b.id}/ready`); render(); } catch (e) { toast(e.message); } } }, 'Marcar lista')));
  return h('div', {}, h('div', { class: 'bar' }, h('h1', {}, 'Camas')),
    wards.map((w) => [h('h2', {}, w), h('div', { class: 'bed-grid' }, beds.filter((b) => b.ward === w).map(card))]));
}

// ---------------------------------------------------------------- administración ---
const adminState = { tab: 'users', auditOffset: 0, action: '', username: '', success: '' };

async function adminView() {
  const tabs = h('div', { class: 'tabs' }, [['users', 'Usuarios'], ['audit', 'Auditoría'], ['system', 'Respaldo']].map(([k, label]) =>
    h('button', { class: 'btn' + (adminState.tab === k ? ' primary' : ''), onclick: () => { adminState.tab = k; render(); } }, label)));
  const body = adminState.tab === 'users' ? await usersTab() : adminState.tab === 'audit' ? await auditTab() : systemTab();
  return h('div', {}, h('div', { class: 'bar' }, h('h1', {}, 'Administración')), tabs, body);
}

async function usersTab() {
  const users = await api('GET', '/users');
  const ROLES = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));
  const rows = users.map((u) => h('tr', {},
    h('td', {}, u.username), h('td', {}, u.fullName), h('td', {}, ROLE_LABEL[u.role]),
    h('td', {}, u.isActive ? (u.lockedUntil ? badge('Bloqueado') : badge('Activo')) : badge('Inactivo')), h('td', {}, fmtDateTime(u.lastLoginAt)),
    h('td', { class: 'tools' },
      h('button', { class: 'btn small', onclick: () => modal(`Editar ${u.username}`, [{ name: 'fullName', label: 'Nombre completo', required: true, max: 150 }, { name: 'role', label: 'Rol', type: 'select', options: ROLES }], u, 'Guardar',
        async (v) => { await api('PATCH', `/users/${u.id}`, v); render(); }) }, 'Editar'),
      h('button', { class: 'btn small', onclick: async () => { try { await api('PATCH', `/users/${u.id}`, { isActive: !u.isActive }); render(); } catch (e) { toast(e.message); } } }, u.isActive ? 'Desactivar' : 'Activar'),
      h('button', { class: 'btn small', onclick: () => modal(`Nueva contraseña temporal para ${u.username}`, [{ name: 'password', label: 'Contraseña temporal (mín. 10, letras y números)', type: 'password', required: true, max: 72, wide: true }], {}, 'Restablecer',
        async (v) => { await api('POST', `/users/${u.id}/reset-password`, v); toast('Contraseña restablecida; deberá cambiarla al ingresar'); render(); }) }, 'Restablecer clave'))));
  return h('div', {}, h('div', { class: 'bar' }, h('span', { class: 'muted' }, `${users.length} usuarios`), h('button', { class: 'btn primary', onclick: () => modal('Nuevo usuario', [
    { name: 'username', label: 'Usuario', required: true, max: 50 }, { name: 'fullName', label: 'Nombre completo', required: true, max: 150 },
    { name: 'role', label: 'Rol', type: 'select', options: ROLES }, { name: 'password', label: 'Contraseña temporal', type: 'password', required: true, max: 72 },
  ], { role: 'recepcion' }, 'Crear usuario', async (v) => { await api('POST', '/users', v); toast('Usuario creado; deberá cambiar su contraseña al ingresar'); render(); }) }, 'Nuevo usuario')),
  table(['Usuario', 'Nombre', 'Rol', 'Estado', 'Último ingreso', ''], rows));
}

async function auditTab() {
  const q = new URLSearchParams({ limit: 50, offset: adminState.auditOffset });
  for (const k of ['action', 'username', 'success']) if (adminState[k]) q.set(k, adminState[k]);
  const rows = await api('GET', `/audit?${q}`);
  const filter = (name, placeholder) => h('input', { class: 'search', placeholder, 'aria-label': placeholder, value: adminState[name], onchange: (e) => { adminState[name] = e.target.value.trim(); adminState.auditOffset = 0; render(); } });
  return h('div', {},
    h('div', { class: 'bar' }, h('div', { class: 'tools' }, filter('action', 'Acción (ej. auth.)'), filter('username', 'Usuario'),
      h('select', { 'aria-label': 'Resultado', onchange: (e) => { adminState.success = e.target.value; adminState.auditOffset = 0; render(); } },
        [['', 'Todos'], ['true', 'Correctos'], ['false', 'Fallidos']].map(([v, l]) => h('option', { value: v, selected: v === adminState.success }, l)))),
    h('div', { class: 'tools' }, h('button', { class: 'btn small', disabled: adminState.auditOffset === 0, onclick: () => { adminState.auditOffset = Math.max(0, adminState.auditOffset - 50); render(); } }, '← Anterior'),
      h('button', { class: 'btn small', disabled: rows.length < 50, onclick: () => { adminState.auditOffset += 50; render(); } }, 'Siguiente →'))),
    table(['Fecha', 'Usuario', 'Acción', 'Entidad', 'IP', 'Resultado', 'Detalle'], rows.map((r) => h('tr', {},
      h('td', {}, fmtDateTime(r.At)), h('td', {}, r.Username || '—'), h('td', {}, r.Action), h('td', {}, [r.EntityType, r.EntityId && String(r.EntityId).slice(0, 8)].filter(Boolean).join(' ') || '—'),
      h('td', {}, r.Ip || '—'), h('td', {}, r.Success ? badge('OK') : badge('Fallido')), h('td', { class: 'small muted' }, r.Detail || ''))), 'Sin registros'));
}

function systemTab() {
  const out = h('p', { class: 'muted' });
  return h('div', { class: 'card' }, h('h2', {}, 'Copia de seguridad'),
    h('p', { class: 'muted' }, 'Crea una copia consistente de la base de datos en la carpeta data/backups del servidor (se conservan las últimas 14). Guarda también, en un lugar aparte, la clave DATA_KEY del archivo .env: sin ella los datos clínicos de la copia no se pueden leer.'),
    h('button', { class: 'btn primary', async onclick() { try { const r = await api('POST', '/system/backup'); out.textContent = `Copia creada: ${r.folder}/${r.file}`; } catch (e) { out.textContent = e.message; } } }, 'Crear copia ahora'), out);
}

// ---------------------------------------------------------------- estructura general ---
let renderSeq = 0;
async function render() {
  const seq = ++renderSeq;
  if (!state.user) { app.replaceChildren(loginScreen()); return; }
  if (state.user.mustChangePassword) { app.replaceChildren(changePasswordScreen()); return; }

  const { route, param } = currentRoute();
  const active = route === 'patient' ? 'patients' : route;
  const main = h('main', { class: 'main' }, h('p', { class: 'muted' }, 'Cargando…'));
  const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Menú principal' }, h('div', { class: 'brand' }, 'MediX-Core'),
    NAV.filter((n) => can(n[2])).map(([key, label]) => h('button', { class: 'nav' + (active === key ? ' active' : ''), onclick: () => go(key) }, label)),
    h('div', { class: 'spacer' }), h('div', { class: 'who' }, `${state.user.fullName} · ${ROLE_LABEL[state.user.role]}`), h('button', { class: 'nav', onclick: logout }, 'Cerrar sesión'));
  app.replaceChildren(h('div', { class: 'shell' }, sidebar, main));

  const views = { patients: patientsView, appointments: appointmentsView, stock: stockView, beds: bedsView, admin: adminView };
  try {
    const node = route === 'patient' ? await patientDetailView(param) : await views[route]();
    if (seq === renderSeq) main.replaceChildren(node);
  } catch (e) {
    if (seq === renderSeq && state.user) main.replaceChildren(h('div', { class: 'card' }, h('div', { class: 'error' }, e.message)));
  }
}

// Cierre por inactividad en el navegador (el servidor también lo aplica).
let idleTimer;
function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (state.user) { state.notice = 'Sesión cerrada por inactividad.'; logout(); } }, IDLE_MS);
}
for (const ev of ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']) window.addEventListener(ev, armIdle, { passive: true });
window.addEventListener('hashchange', () => { if (state.user) render(); });

(async function init() {
  try { state.user = (await api('GET', '/auth/me')).user; } catch { state.user = null; }
  armIdle();
  render();
})();
