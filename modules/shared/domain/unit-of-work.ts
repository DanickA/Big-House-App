export interface IUnitOfWork {
  /**
   * Ejecuta una serie de operaciones dentro de un contexto transaccional atómico.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run<T>(work: (txContext?: any) => Promise<T>): Promise<T>;
}
