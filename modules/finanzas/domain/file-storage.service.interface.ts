export interface IFileStorageService {
  uploadComprobante(file: File): Promise<string>;
}
