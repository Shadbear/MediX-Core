/**
 * MATRIZ DE PERMISOS (única fuente de verdad).
 * Cada permiso es "recurso:acción" y lista los roles que lo tienen.
 * - El servidor lo aplica con authorize('patients:delete').
 * - El navegador recibe la lista de permisos del usuario al iniciar sesión.
 * Mínimo privilegio: si un permiso no está aquí, nadie lo tiene.
 */
const ALL = ['admin', 'medico', 'enfermeria', 'recepcion'];
const CLINICAL = ['admin', 'medico', 'enfermeria'];

const PERMISSIONS = Object.freeze({
  'patients:list': ALL,
  'patients:read': ALL,
  'patients:create': ['admin', 'medico', 'recepcion'],
  'patients:update_contact': ALL, // teléfono, correo, dirección, seguro, contacto de emergencia
  'patients:update_clinical': CLINICAL, // alergias, condiciones crónicas, grupo sanguíneo
  'patients:update_status': CLINICAL,
  'patients:update_identity': ['admin'], // documento, nombres, fecha de nacimiento, sexo
  'patients:delete': ['admin'], // borrado lógico
  'patients:restore': ['admin'],

  'clinical:read': CLINICAL, // alergias/diagnósticos/historia clínica
  'clinical:create': ['admin', 'medico'],

  'appointments:read': ALL,
  'appointments:create': ['admin', 'medico', 'recepcion'],
  'appointments:update_status': ALL,

  'stock:read': ALL,
  'stock:move': ['admin', 'enfermeria'],
  'stock:manage': ['admin', 'enfermeria'], // crear ítems

  'beds:read': ALL,
  'beds:manage': CLINICAL, // asignar / liberar / marcar lista

  'users:manage': ['admin'],
  'audit:read': ['admin'],
  'system:backup': ['admin'],
});

const can = (role, permission) => Array.isArray(PERMISSIONS[permission]) && PERMISSIONS[permission].includes(role);
const permissionsFor = (role) => Object.keys(PERMISSIONS).filter((p) => PERMISSIONS[p].includes(role));

module.exports = { PERMISSIONS, can, permissionsFor };
