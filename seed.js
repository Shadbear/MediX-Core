const { db } = require('./src/db');

console.log('Cargando datos de prueba...');

try {
  const stmtPatient = db.prepare(`
    INSERT INTO Patients (
      MedicalRecordNumber, Dni, FirstName, LastName, BirthDate, Gender, Address, Phone, InsuranceType, Status, CreatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', CURRENT_TIMESTAMP)
  `);

  // Registros que cumplen estrictamente las reglas de Zod y SQLite
  stmtPatient.run(
    'HC-001001', 
    '71234567', 
    'Carlos', 
    'Mendoza Ramos', 
    '1988-05-14', 
    'M', 
    'Av. Central 123', 
    '+51 987654321', 
    'EsSalud'
  );

  stmtPatient.run(
    'HC-001002', 
    '45678912', 
    'Ana María', 
    'Torres', 
    '1995-11-20', 
    'F', 
    'Calle Las Flores 456', 
    '+51 912345678', 
    'SIS'
  );

  stmtPatient.run(
    'HC-001003', 
    '10987654', 
    'Luis Alberto', 
    'Gómez', 
    '1972-03-08', 
    'M', 
    'Jr. Los Olivos 789', 
    '+51 955443322', 
    'Particular'
  );

  console.log('¡Pacientes de prueba cargados con éxito!');
} catch (err) {
  console.error('Error al insertar:', err.message);
}