# Especificación: Refactorización del Módulo de Finanzas (Compromisos Recurrentes y Fondo Común)

## Problem Statement

Los habitantes del hogar necesitan una forma clara, sin sobrecarga visual y optimizada para dispositivos móviles de:
1. Recordar qué **Servicios** (compromisos recurrentes presupuestados) están pendientes de pago, cuáles ya fueron pagados y cuándo vencen para evitar recargos por mora o cortes de suministro.
2. Identificar qué **Habitante** tiene asignada la responsabilidad de gestionar el trámite de pago de cada servicio.
3. Registrar el **Pago de Servicio** con el costo real facturado en el recibo y su comprobante digital, pudiendo contrastar el monto presupuestado de referencia contra lo que realmente costó cada factura (`Presupuesto vs Real`).
4. Mantener la gestión completa de cada servicio (crear, consultar histórico de pagos y comprobantes, editar parámetros y eliminar).
5. Transparentar mes a mes el **Fondo Común** del hogar mediante el registro de cada **Aporte al Fondo** realizado por los habitantes con su respectivo soporte de transferencia, donde la suma de los aportes del mes define el presupuesto disponible de dicho período.

## Solution

Rediseñar la experiencia e infraestructura del módulo de Finanzas bajo una interfaz móvil de **Dos Pestañas Puras (`Recibos` | `Fondo Común`)** encabezada por un **Selector de Mes (`< Mes Año >`)**:
- **Selector de Mes**: Permite navegar entre períodos mensuales para consultar tanto los recibos y pagos de ese mes como los aportes enviados al Fondo Común en dicho ciclo.
- **Pestaña "Recibos"**:
  - Píldora de resumen de 1 línea (*Por pagar estimado* vs *Pagado real del mes*).
  - Lista vertical compacta de servicios pendientes ordenada por urgencia (destacando con alerta de alta prioridad aquellos en mora/riesgo de corte) y sección de servicios pagados en el mes mostrando la diferencia frente al presupuesto estimado (`+$Xk vs est.` o ahorro).
  - Al tocar cualquier servicio se despliega una **Hoja Inferior (Bottom Sheet) unificada con 3 secciones**:
    1. **Pagar**: Ingreso del costo real facturado, cálculo en vivo de diferencia vs presupuesto y carga de comprobante.
    2. **Histórico**: Historial cronológico de pagos del servicio con monto pagado, variación vs presupuesto, quién registró el pago y visualización de comprobante.
    3. **Editar / Eliminar**: Formulario para actualizar nombre, presupuesto estimado, día de corte, periodicidad, referencia y habitante responsable, además de eliminación con confirmación.
- **Pestaña "Fondo Común"**:
  - Tarjeta principal con el **Presupuesto del Mes** (calculado automáticamente como la suma de los aportes de los habitantes en ese mes) contrastado contra el total estimado de servicios y el total real pagado en recibos.
  - Lista de habitantes mostrando cuánto ha enviado cada uno a la bolsa común en el mes seleccionado, acceso al recibo/soporte de transferencia y acción para registrar un nuevo aporte con comprobante.

## User Stories

1. Como **Habitante**, quiero cambiar de mes mediante un selector `< Mes Año >` en la cabecera, para consultar los pagos de servicios y los aportes al Fondo Común de cualquier período mensual sin perder el contexto.
2. Como **Habitante**, quiero alternar entre dos pestañas limpias (`Recibos` y `Fondo Común`), para evitar la sobrecarga cognitiva en pantallas móviles.
3. Como **Habitante**, quiero ver en la parte superior de la lista los servicios vencidos resaltados con alerta de mora y riesgo de corte, para priorizar su pago inmediato.
4. Como **Habitante**, quiero asignar y visualizar qué habitante es el encargado de gestionar cada servicio, para tener claridad sobre quién debe tramitar el recibo.
5. Como **Habitante**, quiero registrar el pago de un servicio ingresando el costo real facturado del período (que puede diferir del monto presupuestado) y adjuntar el comprobante, para conservar el soporte real sin alterar el presupuesto estimado de referencia del servicio.
6. Como **Habitante**, quiero ver en cada servicio pagado la diferencia entre el monto estimado y el costo real facturado (`Presupuesto vs Real`), para identificar incrementos o ahorros en los servicios del hogar.
7. Como **Habitante**, quiero tocar un servicio y consultar su pestaña de **Histórico**, para revisar pagos de meses anteriores y abrir sus comprobantes.
8. Como **Habitante**, quiero editar la información de un servicio (nombre, presupuesto estimado, día de corte, periodicidad, referencia y responsable) o eliminarlo con confirmación desde la misma hoja de detalle, para mantener actualizado el catálogo de compromisos.
9. Como **Habitante**, quiero registrar mis aportes mensuales al **Fondo Común** adjuntando la imagen o soporte de la transferencia, para transparentar mi contribución a la bolsa del hogar.
10. Como **Habitante**, quiero que la suma de todos los aportes registrados en el mes se muestre como el **Presupuesto del Mes** en el Fondo Común y se compare contra el costo de los servicios, para saber con cuánto dinero cuenta la bolsa colectiva.

## Implementation Decisions

1. **Evolución del Esquema de Base de Datos (Prisma)**:
   - En el modelo `servicios`:
     - Añadir `responsable_id` (`String? @db.Uuid`) con relación opcional a `usuarios` para identificar al habitante gestor del trámite.
   - En el modelo `pagos_servicios`:
     - Añadir `monto_presupuestado` (`Decimal? @db.Decimal(12, 2)`) para congelar una instantánea del presupuesto de referencia vigente al momento del pago y permitir el cálculo histórico exacto de `Presupuesto vs Real` incluso si el presupuesto del servicio cambia en el futuro.
   - En el modelo `ingresos` (o tabla dedicada `aportes_fondo_comun` / extensión de `ingresos`):
     - Reutilizar/extender la tabla existente `ingresos` (o crear `aportes_fondo`) añadiendo `comprobante_url` (`String?`) y `periodo_mes` (`String`, formato `YYYY-MM`) para almacenar los aportes al Fondo Común por habitante y mes con su soporte digital.
2. **Arquitectura Modular (`modules/finanzas`)**:
   - **Dominio**:
     - Extender `Servicio` y `ServicioConEstado` con `responsable_id`, `responsable?: { id: string; nombre: string }` y cálculo de variación `Presupuesto vs Real` para el mes consultado.
     - Incorporar entidad `AporteFondoComun` y `ResumenFondoComunMensual` (`totalRecaudadoMes`, `aportesPorHabitante`, `totalEstimadoServicios`, `totalRealPagadoMes`).
     - Extender `IServicioRepository`, `IPagoRepository` y añadir `IAporteFondoRepository`.
   - **Casos de Uso (`application/use-cases/`)**:
     - `GetFinanzasMesUseCase` (o extensión de `GetServiciosUseCase` por mes `YYYY-MM`): devuelve los servicios con su estado en el mes seleccionado, pagos del período y contraste presupuesto vs real.
     - `RegistrarPagoServicioUseCase`: guarda `monto_pagado` (real) junto con snapshot de `monto_presupuestado` del servicio, comprobante y avanza `fecha_vencimiento` manteniendo el `monto` estimado del servicio intacto.
     - `GetFondoComunMesUseCase`: obtiene los aportes de los habitantes en el mes `YYYY-MM` y calcula el presupuesto total recaudado en la bolsa.
     - `RegistrarAporteFondoUseCase`: valida con Zod, sube comprobante y registra el aporte del habitante al Fondo Común del mes.
3. **Controladores Server Actions (`actions/pagos.ts`)**:
   - Mantener firmas compatibles y exponer las acciones para aportes del Fondo Común y consulta por mes (`YYYY-MM`).
4. **Interfaz Gráfica Definitiva (`components/pagos/FinanzasView.tsx`)**:
   - Adoptar la **Variante A refinada** validada en el prototipo (Selector `< Mes Año >`, Segmented Control `Recibos | Fondo Común`, y Bottom Sheet de 3 pestañas `Pagar | Histórico | Editar` por servicio), eliminando los componentes de prototipo temporal al finalizar.

## Testing Decisions

- **Criterio de pruebas**: Probar comportamiento externo y reglas de negocio a través de la costura (*seam*) de los **Casos de Uso de Aplicación** (`modules/finanzas/application/use-cases/`) y **Server Actions** (`actions/pagos.ts`), inyectando repositorios falsos/mocks en memoria sin acoplarse a detalles internos de Prisma.
- **Módulos bajo prueba**:
  - Cálculo de estado y prioridad de mora/riesgo de corte en servicios.
  - Registro de pago con costo real variable conservando el presupuesto estimado del servicio y registrando la diferencia `Presupuesto vs Real`.
  - Asignación y actualización de habitante responsable en servicios.
  - Registro de aportes al Fondo Común y cálculo del Presupuesto del Mes como la sumatoria de los aportes del período `YYYY-MM`.
- ** Arte previo**: `__tests__/modules/finanzas/finanzas.test.ts` y `__tests__/actions/pagos.test.ts`.

## Out of Scope

- Débitos contables automáticos que descuenten saldo de billeteras individuales por cada pago.
- Liquidación de deudas cruzadas entre habitantes estilo Splitwise.
- Gastos cotidianos no recurrentes (compras sueltas de supermercado o tienda).
