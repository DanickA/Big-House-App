import { uploadImage, uploadComprobante, deleteStoredFile } from '@/lib/storage';

/**
 * Adaptador compartido de almacenamiento (imágenes y comprobantes) que unifica
 * los contratos de Plantas y Finanzas sobre lib/storage.ts (A-12, F-24).
 */
export class UnifiedStorageAdapterService {
  async uploadImage(file: File): Promise<string> {
    return uploadImage(file);
  }

  async uploadComprobante(file: File): Promise<string> {
    return uploadComprobante(file);
  }

  async deleteFile(fileUrl?: string | null): Promise<void> {
    return deleteStoredFile(fileUrl);
  }

  async deleteImage(fileUrl?: string | null): Promise<void> {
    return deleteStoredFile(fileUrl);
  }
}

export const defaultUnifiedStorageService = new UnifiedStorageAdapterService();
