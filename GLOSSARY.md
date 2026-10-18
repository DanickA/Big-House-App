# HogarApp

Plataforma colaborativa para la gestión integral de las dinámicas y recursos de un hogar compartido.

## Language

**Habitante**:
Persona que convive en el hogar y dispone de un perfil de acceso con PIN numérico o contraseña.
_Avoid_: Usuario general, cliente, inquilino

**Hogar**:
Entorno único y compartido donde conviven los habitantes y residen todos los servicios, finanzas, plantas y agenda.
_Avoid_: Familia, tenant, grupo, organización

**Servicio**:
Factura o compromiso financiero recurrente del hogar (servicios públicos, internet, administración, etc.) sujeto a periodicidad, fecha de corte y un monto presupuestado de referencia.
_Avoid_: Cuenta, recibo, gasto general, factura periódica

**Pago de Servicio**:
Operación que asienta la cancelación de un ciclo de servicio con su costo real facturado, adjunta el comprobante de pago y reprograma el próximo vencimiento.
_Avoid_: Abono, liquidación, gasto variable

**Fondo Común**:
Bolsa económica colectiva del hogar destinada a solventar los compromisos periódicos presupuestados del mes.
_Avoid_: Caja chica, cuenta compartida, billetera virtual

**Aporte al Fondo**:
Transferencia de dinero realizada por un habitante a la bolsa común para un período mensual determinado, respaldada por un comprobante de pago o transferencia.
_Avoid_: Donación, préstamo, cuota de socio

**Presupuesto vs Real**:
Comparativa analítica entre el costo estimado de los compromisos del mes y el valor real efectivamente liquidado en los recibos.

**Planta**:
Espécimen botánico del hogar con ciclo programado de riego, estado de salud y guía breve de cuidado colaborativo.
_Avoid_: Mata, flor, cultivo

**Guía de Cuidado**:
Ficha breve de una planta que indica sus requerimientos básicos (nivel de agua, tipo de luz y notas puntuales) para que cualquier habitante pueda atenderla adecuadamente.
_Avoid_: Manual técnico, ficha agronómica

**Bitácora de Cuidado**:
Registro histórico colaborativo de las atenciones realizadas a una planta (riego, abono, poda, limpieza), indicando qué habitante la realizó y cuándo.
_Avoid_: Log de eventos, historial clínico

**Evento**:
Actividad o compromiso programado en la agenda compartida del hogar bajo el estándar universal de Google Calendar (título, fecha/hora o todo el día, ubicación, descripción/notas, participantes y color), con sincronización bidireccional automática cuando el habitante tiene su cuenta de Google conectada.
_Avoid_: Plantilla propietaria compleja, formulario multipaso

**Sincronización Bidireccional Google**:
Flujo transparente de entrada y salida donde la lectura del mes importa en segundo plano (*Stale-While-Revalidate*) los eventos de Google Calendar sin bloquear la interfaz local, y toda creación, edición o eliminación desde la aplicación impacta automáticamente el calendario primario de Google (`google_event_id`).
_Avoid_: Exportación manual por archivo, sincronización bloqueante

**Evento Sintético del Hogar**:
Compromiso proyectado automáticamente en el calendario a partir de otros módulos del hogar (ciclos de riego de **Plantas** o vencimientos de **Servicios** en **Finanzas**), diferenciable y filtrable por origen.
_Avoid_: Evento duplicado manual
