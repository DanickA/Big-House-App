import {
  UnifiedStorageAdapterService,
  defaultUnifiedStorageService,
} from '@/modules/shared/infrastructure/unified-storage-adapter.service';

export { UnifiedStorageAdapterService as StorageAdapterService };
export const defaultStorageService = defaultUnifiedStorageService;
