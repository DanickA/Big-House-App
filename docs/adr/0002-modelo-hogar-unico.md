# Preservación del Modelo de Hogar Único (Single-Household)

Al evaluar el alcance de la refactorización integral, se consideró la introducción de multi-tenancy para soportar múltiples hogares o familias independientes. Decidimos mantener el modelo de Hogar Único (Single-Household), donde la instancia y la base de datos representan a un único hogar compartido por sus habitantes. Esta decisión preserva la experiencia de acceso ágil mediante PIN compartido entre convivientes y evita la sobreingeniería en el modelo relacional.
