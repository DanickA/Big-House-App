import { IImageStorageService } from '../domain/image-storage.service.interface';
import { uploadImage } from '@/lib/storage';

export class StorageImageAdapterService implements IImageStorageService {
  async uploadImage(file: File): Promise<string> {
    return uploadImage(file);
  }
}

export const defaultImageStorageService = new StorageImageAdapterService();
