export interface IImageStorageService {
  uploadImage(file: File): Promise<string>;
  deleteImage?(fileUrl?: string | null): Promise<void>;
}
