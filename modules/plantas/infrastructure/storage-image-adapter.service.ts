import {
  UnifiedStorageAdapterService,
  defaultUnifiedStorageService,
} from '@/modules/shared/infrastructure/unified-storage-adapter.service';

export { UnifiedStorageAdapterService as StorageImageAdapterService };
export const defaultImageStorageService = defaultUnifiedStorageService;
