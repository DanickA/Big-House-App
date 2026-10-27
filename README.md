# BigHouse App (`hogar-app`)

Plataforma integral de administración del hogar construida con **Next.js 16 (App Router)**, **React 19**, **Prisma 7 (PostgreSQL)** y **Clean Architecture** modular.

## Arquitectura y Módulos

El proyecto sigue una arquitectura limpia por dominios dentro de `modules/`:

- `modules/habitantes`: Gestión de miembros del hogar, autenticación (contraseña + PIN de 4–6 dígitos), roles (`ADMIN` | `MIEMBRO`), revocación de sesiones (`token_version`) y baja lógica (`activo`).
- `modules/finanzas`: Servicios recurrentes con bloqueo pesimista (`SELECT ... FOR UPDATE`), control de concurrencia optimista por fecha calendario (`toCalendarYMD`), historial de pagos, aportes al Fondo Común y Gastos Generales del Hogar (`GastoHogar`).
- `modules/plantas`: Inventario botánico, programación atómica de riego (`$transaction`), reversión de cuidados y limpieza automática de fotos al actualizar/eliminar plantas.
- `modules/calendario`: Agenda unificada (eventos manuales, recurrencias `ANUAL`, `MENSUAL` y `SEMANAL`, tareas de riego y vencimientos de servicios), subtareas transaccionales y sincronización bidireccional con Google Calendar.
- `modules/shared`: Primitivas `Result<T, E>`, jerarquía de errores tipados (`AppError`), `IUnitOfWork`, adaptador unificado de almacenamiento (`UnifiedStorageAdapter`) y utilidades de fechas/moneda (`roundMoney`, `parseLocalDate`, `projectAnnualDate`, `projectMonthlyDate`, `toCalendarYMD`).

## Seguridad Implementada

1. **Autenticación y RBAC (`ADMIN` / `MIEMBRO`)**:
   - El primer habitante registrado (`count === 0`) recibe automáticamente el rol `ADMIN`. Una vez inicializado el hogar, el registro público queda cerrado y solo un `ADMIN` puede crear o eliminar habitantes.
   - Hashes `bcrypt` obligatorios (mínimo 8 caracteres para contraseñas, 4–6 dígitos numéricos para PIN).
   - Rate-limiting en memoria (`lib/rate-limit.ts`) con bloqueo temporal de 15 minutos tras 5 intentos fallidos.
2. **Sesiones y Cookies Endurecidas**:
   - JWT HS256 firmado con `SESSION_SECRET`, expiración de 7 días y cookie `__Host-hogar_session` en producción (`HttpOnly`, `SameSite=Lax`, `Secure`).
   - Verificación en tiempo real de `activo` y `token_version` en `resolveSessionUser()` (`lib/auth-guard.ts`), invalidando sesiones inmediatamente al cambiar credenciales o desactivar cuentas.
3. **Google Calendar OAuth 2.0 con PKCE + Cifrado AES-256-GCM**:
   - Flujo OAuth protegido con `state` criptográfico y PKCE (`S256`) validados mediante cookie `HttpOnly` firmada.
   - Tokens `access_token` y `refresh_token` cifrados en reposo con **AES-256-GCM** (`lib/crypto.ts`).
4. **Almacenamiento Privado de Archivos**:
   - Soporte dual para **Cloudinary** y almacenamiento local privado fuera de `public/` (`.storage/uploads/`), servido únicamente a usuarios autenticados mediante `GET /api/files/[...path]` con validación de firma mágica/MIME, límite de 5 MB y nombres UUID.
5. **Notificaciones Web Push (VAPID) y Correo (Resend)**:
   - Suscripción real en `POST /api/push/subscribe` almacenada en `suscripciones_push`.
   - Cron job protegido por `CRON_SECRET` en `GET /api/cron/recordatorios`.

## Variables de Entorno Requeridas

Configura `.env` basándote en `.env.example`:

- `DATABASE_URL`: Cadena de conexión PostgreSQL.
- `SESSION_SECRET`: Secreto de al menos 32 caracteres para firmar JWT y estados OAuth.
- `OAUTH_ENCRYPTION_KEY`: Clave secreta para cifrado AES-256-GCM de tokens OAuth.
- `CRON_SECRET`: Token Bearer obligatorio en producción para `/api/cron/recordatorios`.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`: Claves VAPID para Web Push.

## Comandos de Desarrollo y Verificación

```bash
npm run dev      # Servidor de desarrollo
npm test         # Suite completa de pruebas unitarias e integración (Jest)
npx tsc --noEmit # Verificación estricta de tipos TypeScript
npm run build    # Generación de cliente Prisma y build de producción
```
