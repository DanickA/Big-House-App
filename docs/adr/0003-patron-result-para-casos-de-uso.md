# Estandarización de Errores con el Patrón Result en Casos de Uso

Los Server Actions y métodos de servicio anteriores lanzaban excepciones (`throw Error`) o devolvían objetos heterogéneos, dificultando el tipado estricto y la previsibilidad de los fallos de negocio. Decidimos adoptar el patrón `Result<T, AppError>` en todos los Casos de Uso de la capa de aplicación. Los fallos esperados de negocio y validación se modelan como valores de retorno fuertemente tipados, evitando excepciones no controladas y simplificando el mapeo hacia las respuestas de los Server Actions.
