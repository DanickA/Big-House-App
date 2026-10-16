export interface IImageStorageService {
  uploadImage(file: File): Promise<string>;
}
