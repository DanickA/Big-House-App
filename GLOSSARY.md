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
Factura o compromiso recurrente del hogar (agua, electricidad, internet, etc.) con ciclo y fecha de corte.
_Avoid_: Cuenta, recibo, factura periódica

**Pago de Servicio**:
Operación atómica que registra la cancelación de un ciclo de servicio, almacena el comprobante, asienta el egreso y reprograma el vencimiento.
_Avoid_: Abono, liquidación

**Planta**:
Espécimen botánico del hogar sujeto a tareas periódicas de mantenimiento y riego.
_Avoid_: Mata, flor, cultivo

**Evento**:
Actividad o compromiso programado en la agenda compartida del hogar, tipificado mediante una plantilla especializada.
_Avoid_: Cita, tarea general
