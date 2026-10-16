import { IFileStorageService } from '../domain/file-storage.service.interface';
import { uploadComprobante } from '@/lib/storage';

export class StorageAdapterService implements IFileStorageService {
  async uploadComprobante(file: File): Promise<string> {
    return uploadComprobante(file);
  }
}

export const defaultStorageService = new StorageAdapterService();
