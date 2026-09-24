# MediX-Core · Backend API (SQL Server)

Puente entre el frontend de MediX-Core y SQL Server. El frontend ya NO debe
leer `src/data/initialData.ts` ni depender de `localStorage` como base de
datos: todo pasa por este API.

## Por qué existe este backend

Un navegador no puede abrir una conexión TCP directa a SQL Server (no tiene
el driver TDS). Por eso este servicio Node/Express hace de intermediario:
React llama a este API por HTTP, y este API es quien habla con SQL Server
usando el paquete `mssql`.

## Puesta en marcha (cuando ya tengas SQL Server)

1. Instala dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Copia `.env.example` a `.env` y coloca ahí el servidor, usuario y
   contraseña reales de tu instancia SQL Server.
3. Ejecuta `sql/schema.sql` una sola vez contra tu servidor (SSMS, Azure Data
   Studio o `sqlcmd -S servidor -i sql/schema.sql`). Esto crea la base de
   datos `MediXCore` y todas las tablas.
4. Levanta el servidor:
   ```bash
   npm run dev   # con recarga automática
   # o
   npm start
   ```
5. Verifica que responde en `http://localhost:3000/api/health`.

## Mientras NO tengas la base de datos todavía

El servidor arranca igual sin `.env` configurado. Las rutas que necesitan la
base de datos devolverán `503` con un mensaje explicando que falta
configurar la conexión — no un error críptico. Esto te permite avanzar el
frontend contra este API ya, y solo "enchufar" SQL Server cuando lo tengas.

## Endpoints implementados

- `GET  /api/health`
- `GET  /api/patients` · `GET /api/patients/:id` · `POST` · `PUT :id` · `DELETE :id`
- `POST /api/patients/:id/clinical-entries`
- `GET  /api/appointments` · `POST` · `PATCH :id/status`
- `GET  /api/stock` · `POST /api/stock/:itemId/movements`
- `GET  /api/beds` · `POST /api/beds/:id/assign` · `POST /api/beds/:id/release`

## Cómo agregar el resto de módulos

`sql/schema.sql` ya incluye las tablas para TODAS las entidades del sistema
(triaje, recetas, personal, equipos, visitantes, encuestas, salas/quirófanos),
no solo las 4 de arriba. Para exponerlas, copia el patrón de
`src/routes/patients.js` (mapRow + query parametrizada) y créales su propio
archivo de rutas — es mecánico, siempre la misma forma.
