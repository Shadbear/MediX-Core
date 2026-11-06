process.env.NODE_ENV = 'test';
process.env.DB_FILE = ':memory:';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { app, db } = require('../server');
const { bootstrapAdmin } = require('../src/bootstrap');
const { hashPassword } = require('../src/util');

let server, base, adminPwd;
const PWD = 'Clave-Segura-2026';

// Cliente mínimo con "cookie jar" y la cabecera anti-CSRF.
function client() {
  let cookie = '';
  const call = async (method, url, body, extra = {}) => {
    const res = await fetch(base + '/api' + url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'medix', ...(cookie ? { Cookie: cookie } : {}), ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    let data = null;
    try { data = await res.json(); } catch { /* 204 */ }
    return { status: res.status, data, headers: res.headers };
  };
  return { call, login: (u, p = PWD) => call('POST', '/auth/login', { username: u, password: p }) };
}

async function makeUser(username, role) {
  db.prepare('INSERT INTO Users (Id, Username, FullName, PasswordHash, Role, MustChangePassword) VALUES (?,?,?,?,?,0)')
    .run(crypto.randomUUID(), username, `Usuario ${username}`, await hashPassword(PWD), role);
  const c = client();
  const r = await c.login(username);
  assert.equal(r.status, 200);
  return c;
}

const patient = (dni, extra = {}) => ({
  dni, firstName: 'Ana', lastName: 'Gómez', birthDate: '1990-05-01', gender: 'F', phone: '999111222', address: 'Av. Lima 123',
  insuranceType: 'SIS', bloodType: 'O+', allergies: ['penicilina'], chronicConditions: ['asma'], ...extra,
});

before(async () => {
  adminPwd = await bootstrapAdmin();
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('sin sesión no se accede a nada', async () => {
  const c = client();
  for (const url of ['/patients', '/appointments', '/stock', '/beds', '/users', '/audit']) assert.equal((await c.call('GET', url)).status, 401, url);
});

test('cabeceras de seguridad y sin caché en la API', async () => {
  const res = await fetch(base + '/api/health');
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('CSRF: escritura sin cabecera propia u origen ajeno es rechazada', async () => {
  const noHeader = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(noHeader.status, 403);
  const c = client();
  const evil = await c.call('POST', '/auth/login', { username: 'admin', password: 'x' }, { Origin: 'https://sitio-malo.example' });
  assert.equal(evil.status, 403);
});

test('primer ingreso: contraseña aleatoria, debe cambiarse, y la cookie es HttpOnly + SameSite=Strict', async () => {
  assert.ok(adminPwd && adminPwd.length >= 14);
  const c = client();
  assert.equal((await c.login('admin', 'Admin123!')).status, 401); // ya no existe una contraseña fija
  const ok = await c.login('admin', adminPwd);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.mustChangePassword, true);
  const flags = ok.headers.get('set-cookie');
  assert.match(flags, /HttpOnly/i);
  assert.match(flags, /SameSite=Strict/i);
  assert.equal((await c.call('GET', '/patients')).data.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal((await c.call('POST', '/auth/change-password', { currentPassword: adminPwd, newPassword: 'corta' })).status, 400);
  assert.equal((await c.call('POST', '/auth/change-password', { currentPassword: adminPwd, newPassword: PWD })).status, 200);
  assert.equal((await c.call('GET', '/patients')).status, 200);
});

test('mensaje genérico en login y bloqueo tras intentos fallidos', async () => {
  await makeUser('bloqueable', 'recepcion');
  const c = client();
  const unknown = await c.login('no-existe', 'lo-que-sea-123');
  const wrong = await c.login('bloqueable', 'incorrecta-123');
  assert.equal(unknown.data.error, wrong.data.error);
  for (let i = 0; i < 4; i++) await c.login('bloqueable', 'incorrecta-123');
  assert.equal((await c.login('bloqueable')).status, 423); // aun con la clave correcta
});

test('permisos por rol (recepción, enfermería, médico)', async () => {
  const recep = await makeUser('recep1', 'recepcion');
  const medico = await makeUser('medico1', 'medico');
  const enf = await makeUser('enf1', 'enfermeria');

  const created = await recep.call('POST', '/patients', patient('40000001'));
  assert.equal(created.status, 201);
  assert.equal(created.data.allergies, undefined, 'recepción no debe ver/guardar datos clínicos');
  assert.match(created.data.medicalRecordNumber, /^HC-\d{4}-\d{6}$/);
  const id = created.data.id;

  assert.equal((await recep.call('DELETE', `/patients/${id}`)).status, 403);
  assert.equal((await recep.call('GET', `/patients/${id}/clinical-entries`)).status, 403);
  assert.equal((await enf.call('POST', `/patients/${id}/clinical-entries`, {})).status, 403);
  assert.equal((await recep.call('PUT', `/patients/${id}`, { dni: '49999999' })).status, 403); // identidad: solo admin

  const entry = { specialty: 'Medicina General', symptoms: 'Tos seca', diagnosis: 'Bronquitis', treatment: 'Reposo', vitalSigns: { heartRate: 80 } };
  const e = await medico.call('POST', `/patients/${id}/clinical-entries`, entry);
  assert.equal(e.status, 201);
  assert.equal(e.data.doctorName, 'Usuario medico1'); // la firma sale de la sesión
  assert.equal((await enf.call('GET', `/patients/${id}/clinical-entries`)).data[0].diagnosis, 'Bronquitis');

  // Un cuerpo con campos extra o tipos incorrectos se rechaza/limpia
  assert.equal((await medico.call('POST', `/patients/${id}/clinical-entries`, { ...entry, vitalSigns: { heartRate: 'abc' } })).status, 400);
});

test('anti-duplicados: documento, cita, cama', async () => {
  const admin = client();
  await admin.login('admin', PWD);
  const p1 = await admin.call('POST', '/patients', patient('40000002'));
  const p2 = await admin.call('POST', '/patients', patient('40000003'));
  assert.equal((await admin.call('POST', '/patients', patient('40000002'))).status, 409);

  const medico = (await admin.call('GET', '/appointments/doctors')).data[0];
  const appt = { patientId: p1.data.id, doctorId: medico.id, specialty: 'Cardiología', date: '2030-01-10', time: '10:00', type: 'Primera Vez' };
  assert.equal((await admin.call('POST', '/appointments', appt)).status, 201);
  assert.equal((await admin.call('POST', '/appointments', { ...appt, patientId: p2.data.id })).data.error, 'El médico ya tiene una cita en ese horario');
  assert.equal((await admin.call('POST', '/appointments', { ...appt, doctorId: null })).data.error, 'El paciente ya tiene una cita en ese horario');

  const beds = (await admin.call('GET', '/beds')).data;
  assert.equal((await admin.call('POST', `/beds/${beds[0].id}/assign`, { patientId: p1.data.id })).status, 204);
  assert.equal((await admin.call('POST', `/beds/${beds[0].id}/assign`, { patientId: p2.data.id })).status, 409); // cama ocupada
  assert.equal((await admin.call('POST', `/beds/${beds[1].id}/assign`, { patientId: p1.data.id })).data.error, 'El paciente ya ocupa otra cama');
  assert.equal((await admin.call('DELETE', `/patients/${p1.data.id}`)).status, 409); // hospitalizado
  assert.equal((await admin.call('POST', `/beds/${beds[0].id}/release`)).status, 204);
  assert.equal((await admin.call('POST', `/beds/${beds[0].id}/ready`)).status, 204);
});

test('inventario: sin stock negativo', async () => {
  const enf = await makeUser('enf2', 'enfermeria');
  const item = await enf.call('POST', '/stock', { code: 'PARA-500', name: 'Paracetamol 500 mg', category: 'Medicamentos', currentStock: 10, minStock: 5 });
  assert.equal(item.status, 201);
  assert.equal((await enf.call('POST', `/stock/${item.data.id}/movements`, { type: 'Salida (Atención Paciente)', quantity: 11 })).status, 409);
  const ok = await enf.call('POST', `/stock/${item.data.id}/movements`, { type: 'Salida (Atención Paciente)', quantity: 6 });
  assert.deepEqual(ok.data, { previousStock: 10, newStock: 4 });
  assert.equal((await enf.call('GET', '/stock')).data.find((i) => i.code === 'PARA-500').status, 'Stock Bajo');
});

test('datos clínicos cifrados en disco', () => {
  const row = db.prepare('SELECT Allergies FROM Patients WHERE Dni = ?').get('40000001');
  assert.match(row.Allergies, /^v1:/);
  const e = db.prepare('SELECT Symptoms, Diagnosis FROM ClinicalEntries LIMIT 1').get();
  assert.ok(!e.Symptoms.includes('Tos') && !e.Diagnosis.includes('Bronquitis'));
});

test('auditoría e historia clínica no se pueden alterar', () => {
  assert.throws(() => db.prepare('UPDATE AuditLog SET Action = ?').run('x'), /solo lectura/);
  assert.throws(() => db.prepare('DELETE FROM AuditLog').run(), /solo lectura/);
  assert.throws(() => db.prepare("UPDATE ClinicalEntries SET Diagnosis = 'x'").run(), /no se puede modificar/);
  assert.throws(() => db.prepare('DELETE FROM ClinicalEntries').run(), /no se puede borrar/);
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM AuditLog WHERE Action = 'auth.login.fail'").get().n > 0);
});

test('desactivar o cambiar de rol a un usuario cierra su sesión al instante', async () => {
  const admin = client();
  await admin.login('admin', PWD);
  const victim = await makeUser('victima', 'medico');
  assert.equal((await victim.call('GET', '/patients')).status, 200);
  const id = db.prepare("SELECT Id FROM Users WHERE Username = 'victima'").get().Id;
  assert.equal((await admin.call('PATCH', `/users/${id}`, { isActive: false })).status, 200);
  assert.equal((await victim.call('GET', '/patients')).status, 401);
  // no se puede dejar el sistema sin administradores
  const adminId = db.prepare("SELECT Id FROM Users WHERE Username = 'admin'").get().Id;
  assert.equal((await admin.call('PATCH', `/users/${adminId}`, { isActive: false })).status, 409);
});

test('solo el administrador ve usuarios y auditoría', async () => {
  const medico = await makeUser('medico2', 'medico');
  assert.equal((await medico.call('GET', '/users')).status, 403);
  assert.equal((await medico.call('GET', '/audit')).status, 403);
  const admin = client();
  await admin.login('admin', PWD);
  assert.ok((await admin.call('GET', '/audit?limit=5')).data.length > 0);
});

test('logout invalida la sesión', async () => {
  const c = await makeUser('saliente', 'recepcion');
  assert.equal((await c.call('POST', '/auth/logout')).status, 204);
  assert.equal((await c.call('GET', '/patients')).status, 401);
});
