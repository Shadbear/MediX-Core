# MediX-Core (versión simple)

Sistema hospitalario básico: **una sola carpeta, un solo comando, sin servidor de base de datos**.
Usa **SQLite** (un archivo: `data/medix.db`), Node.js y una interfaz web sin compilación.

## Puesta en marcha

Requisito: [Node.js](https://nodejs.org) 20.12 o superior.

```bash
npm install
npm start
```

Abre **http://localhost:3000**. La primera vez, la consola muestra el usuario `admin` y una
**contraseña temporal aleatoria** (solo se muestra una vez; el sistema te pedirá cambiarla).
Si la pierdes: `npm run reset-password -- admin`.

Módulos: Pacientes (con historia clínica), Citas, Inventario, Camas, y Administración
(usuarios, auditoría, copias de seguridad).

## Seguridad incluida

| Tema | Cómo |
|---|---|
| Contraseñas | bcrypt (12 rondas), mínimo 10 caracteres con letras y números; sin contraseñas fijas en el código |
| Sesiones | Cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` en producción); sesiones guardadas en el servidor, se revocan al instante (cambio de clave, rol o desactivación); caducan a las 8 h o a los 15 min de inactividad |
| Fuerza bruta | Bloqueo de cuenta (5 intentos → 15 min) y límite de intentos por IP; mensaje genérico y tiempo constante en el login |
| CSRF | Cookie SameSite + cabecera obligatoria en toda escritura + verificación de `Origin` |
| XSS / inyección | La interfaz nunca usa `innerHTML`; CSP estricta (sin scripts/estilos en línea ni CDNs); consultas SQL siempre parametrizadas; toda entrada validada con `zod` |
| Datos clínicos | Cifrados en disco con AES-256-GCM (alergias, condiciones, síntomas, diagnóstico, tratamiento, notas) |
| Permisos | Roles admin / médico / enfermería / recepción definidos en un solo archivo (`src/permissions.js`); mínimo privilegio |
| Auditoría | Registra quién vio o cambió qué, desde qué IP, y los accesos denegados. **No se puede editar ni borrar** (triggers en la base) |
| Historia clínica | Solo se agregan entradas; no se pueden modificar ni borrar. Los pacientes se dan de baja de forma lógica |
| Red | Por defecto escucha solo en `127.0.0.1`; cabeceras `helmet`; respuestas sin caché; errores internos nunca se muestran al cliente |
| Anti-duplicados | Documento único, números de historia/cita correlativos sin colisión, sin doble cita de médico/paciente a la misma hora, sin doble cama, sin stock negativo |

## Archivos importantes

- `.env` — se crea solo la primera vez y contiene `DATA_KEY`, la clave que cifra los datos clínicos.
  **Guarda una copia fuera de este equipo.** Sin ella, ni la base ni sus copias se pueden leer.
- `data/` — la base (`medix.db`) y las copias (`data/backups/`). Incluye esta carpeta en tus respaldos.
- Nada de esto se sube a git (ya está en `.gitignore`).

## Antes de usar datos reales

- [ ] Poner **HTTPS** delante (Caddy o nginx), arrancar con `NODE_ENV=production` y `TRUST_PROXY=1`
- [ ] Si otros equipos deben acceder, `HOST=0.0.0.0` (y solo a través del proxy HTTPS / red interna)
- [ ] Copias periódicas: botón **Administración → Respaldo**, más copiar `data/backups/` y `DATA_KEY` a otro lugar
- [ ] Disco del servidor cifrado (BitLocker / LUKS) y cuentas de sistema operativo protegidas
- [ ] Revisar la auditoría con regularidad y dar de baja a quien ya no trabaje en el centro

## Pruebas

`npm test` ejecuta 13 pruebas de seguridad y reglas de negocio (login, bloqueo, CSRF, permisos por rol,
cifrado, duplicados, revocación de sesiones, inmutabilidad de auditoría).

## Estructura

```
server.js            arranque, cabeceras de seguridad, rutas
src/                 db.js (esquema SQLite) · auth.js (sesiones) · permissions.js · schemas.js · routes/
public/              index.html · app.js · style.css (interfaz)
scripts/             reset-password.js
test/                security.test.js
```
