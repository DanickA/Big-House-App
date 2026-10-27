-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'MIEMBRO');

-- CreateEnum
CREATE TYPE "TipoPlantilla" AS ENUM ('EVENTO', 'TAREA', 'MANTENIMIENTO', 'VISITAS', 'COMPRAS', 'MASCOTAS', 'CUMPLEANOS', 'CITA_MEDICA', 'MERCADO');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('ACTIVO', 'CANCELADO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('PUSH', 'EMAIL');

-- CreateTable
CREATE TABLE "gastos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "descripcion" VARCHAR(200) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "servicio_id" UUID,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cuidado" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tarea_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha_realizada" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "historial_cuidado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "descripcion" VARCHAR(200) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "fuente" VARCHAR(50),
    "comprobante_url" TEXT,
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_comun" VARCHAR(100) NOT NULL,
    "especie" VARCHAR(100),
    "ubicacion" VARCHAR(100) NOT NULL,
    "foto_url" TEXT,
    "nivel_luz" VARCHAR(30) DEFAULT 'INDIRECTA',
    "nivel_agua" VARCHAR(30) DEFAULT 'MODERADA',
    "estado_salud" VARCHAR(30) DEFAULT 'SANA',
    "notas_cuidado" TEXT,

    CONSTRAINT "plantas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_servicio" VARCHAR(100) NOT NULL,
    "numero_cuenta" VARCHAR(50),
    "numero_factura" VARCHAR(50),
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "periodicidad_meses" INTEGER DEFAULT 1,
    "dia_vencimiento" INTEGER,
    "responsable_id" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas_cuidado" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planta_id" UUID NOT NULL,
    "tipo_tarea" VARCHAR(50) NOT NULL,
    "frecuencia_dias" INTEGER NOT NULL,
    "proxima_fecha" DATE NOT NULL,

    CONSTRAINT "tareas_cuidado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "pin_hash" VARCHAR(255),
    "pin_longitud" INTEGER DEFAULT 4,
    "rol" "RolUsuario" NOT NULL DEFAULT 'MIEMBRO',
    "token_version" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_servicios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "servicio_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "monto_pagado" DECIMAL(12,2) NOT NULL,
    "monto_presupuestado" DECIMAL(12,2),
    "fecha_pago" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "comprobante_url" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "pagos_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "tipo_plantilla" "TipoPlantilla" NOT NULL,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'ACTIVO',
    "fecha_inicio" TIMESTAMP(6) NOT NULL,
    "fecha_fin" TIMESTAMP(6) NOT NULL,
    "todo_el_dia" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(50) NOT NULL,
    "ubicacion" VARCHAR(200),
    "recurrencia" VARCHAR(100),
    "detalles" JSONB,
    "creador_id" UUID NOT NULL,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "google_event_id" VARCHAR(255),

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes_externos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "contacto" VARCHAR(100),

    CONSTRAINT "participantes_externos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtareas_evento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento_id" UUID NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "asignado_id" UUID,

    CONSTRAINT "subtareas_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordatorios_evento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento_id" UUID NOT NULL,
    "tipo_canal" "CanalRecordatorio" NOT NULL,
    "minutos_anticipacion" INTEGER NOT NULL,
    "fecha_programada" TIMESTAMP(6) NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recordatorios_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones_push" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conexiones_google" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_expira" TIMESTAMP(6) NOT NULL,
    "calendar_id" VARCHAR(100) NOT NULL DEFAULT 'primary',
    "sync_token" TEXT,
    "ultima_sync" TIMESTAMP(6),
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conexiones_google_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantesEvento" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ParticipantesEvento_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "gastos_usuario_id_idx" ON "gastos"("usuario_id");

-- CreateIndex
CREATE INDEX "gastos_servicio_id_idx" ON "gastos"("servicio_id");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha");

-- CreateIndex
CREATE INDEX "historial_cuidado_tarea_id_idx" ON "historial_cuidado"("tarea_id");

-- CreateIndex
CREATE INDEX "historial_cuidado_usuario_id_idx" ON "historial_cuidado"("usuario_id");

-- CreateIndex
CREATE INDEX "historial_cuidado_fecha_realizada_idx" ON "historial_cuidado"("fecha_realizada");

-- CreateIndex
CREATE INDEX "historial_cuidado_tarea_id_fecha_realizada_idx" ON "historial_cuidado"("tarea_id", "fecha_realizada");

-- CreateIndex
CREATE INDEX "ingresos_usuario_id_idx" ON "ingresos"("usuario_id");

-- CreateIndex
CREATE INDEX "ingresos_fecha_idx" ON "ingresos"("fecha");

-- CreateIndex
CREATE INDEX "servicios_fecha_vencimiento_idx" ON "servicios"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "servicios_estado_idx" ON "servicios"("estado");

-- CreateIndex
CREATE INDEX "servicios_responsable_id_idx" ON "servicios"("responsable_id");

-- CreateIndex
CREATE INDEX "servicios_activo_idx" ON "servicios"("activo");

-- CreateIndex
CREATE INDEX "tareas_cuidado_planta_id_idx" ON "tareas_cuidado"("planta_id");

-- CreateIndex
CREATE INDEX "tareas_cuidado_proxima_fecha_idx" ON "tareas_cuidado"("proxima_fecha");

-- CreateIndex
CREATE INDEX "tareas_cuidado_planta_id_tipo_tarea_idx" ON "tareas_cuidado"("planta_id", "tipo_tarea");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "pagos_servicios_servicio_id_idx" ON "pagos_servicios"("servicio_id");

-- CreateIndex
CREATE INDEX "pagos_servicios_usuario_id_idx" ON "pagos_servicios"("usuario_id");

-- CreateIndex
CREATE INDEX "pagos_servicios_fecha_pago_idx" ON "pagos_servicios"("fecha_pago");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_google_event_id_key" ON "eventos"("google_event_id");

-- CreateIndex
CREATE INDEX "eventos_fecha_inicio_fecha_fin_idx" ON "eventos"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "eventos_creador_id_idx" ON "eventos"("creador_id");

-- CreateIndex
CREATE INDEX "eventos_estado_idx" ON "eventos"("estado");

-- CreateIndex
CREATE INDEX "eventos_google_event_id_idx" ON "eventos"("google_event_id");

-- CreateIndex
CREATE INDEX "participantes_externos_evento_id_idx" ON "participantes_externos"("evento_id");

-- CreateIndex
CREATE INDEX "subtareas_evento_evento_id_idx" ON "subtareas_evento"("evento_id");

-- CreateIndex
CREATE INDEX "subtareas_evento_asignado_id_idx" ON "subtareas_evento"("asignado_id");

-- CreateIndex
CREATE INDEX "recordatorios_evento_evento_id_idx" ON "recordatorios_evento"("evento_id");

-- CreateIndex
CREATE INDEX "recordatorios_evento_enviado_fecha_programada_idx" ON "recordatorios_evento"("enviado", "fecha_programada");

-- CreateIndex
CREATE INDEX "suscripciones_push_usuario_id_idx" ON "suscripciones_push"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "conexiones_google_usuario_id_key" ON "conexiones_google"("usuario_id");

-- CreateIndex
CREATE INDEX "conexiones_google_usuario_id_idx" ON "conexiones_google"("usuario_id");

-- CreateIndex
CREATE INDEX "_ParticipantesEvento_B_index" ON "_ParticipantesEvento"("B");

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "fk_servicio_gasto" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "fk_usuario_gasto" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_cuidado" ADD CONSTRAINT "fk_tarea_historial" FOREIGN KEY ("tarea_id") REFERENCES "tareas_cuidado"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_cuidado" ADD CONSTRAINT "fk_usuario_historial" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "fk_usuario_ingreso" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "fk_responsable_servicio" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas_cuidado" ADD CONSTRAINT "fk_planta_tarea" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos_servicios" ADD CONSTRAINT "fk_servicio_pago" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos_servicios" ADD CONSTRAINT "fk_usuario_pago" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "fk_usuario_creador_evento" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participantes_externos" ADD CONSTRAINT "fk_evento_externo" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subtareas_evento" ADD CONSTRAINT "fk_evento_subtarea" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subtareas_evento" ADD CONSTRAINT "fk_usuario_subtarea" FOREIGN KEY ("asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recordatorios_evento" ADD CONSTRAINT "fk_evento_recordatorio" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "suscripciones_push" ADD CONSTRAINT "fk_usuario_suscripcion" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conexiones_google" ADD CONSTRAINT "fk_usuario_conexion_google" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_ParticipantesEvento" ADD CONSTRAINT "_ParticipantesEvento_A_fkey" FOREIGN KEY ("A") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantesEvento" ADD CONSTRAINT "_ParticipantesEvento_B_fkey" FOREIGN KEY ("B") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

