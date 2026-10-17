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
Espécimen botánico del hogar sujeto a tareas periódicas de mantenimiento y riego.
_Avoid_: Mata, flor, cultivo

**Evento**:
Actividad o compromiso programado en la agenda compartida del hogar, tipificado mediante una plantilla especializada.
_Avoid_: Cita, tarea general
