import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Configurar Cloudinary si las variables de entorno están presentes
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Sube una imagen a Cloudinary (producción/nube) o al disco local (desarrollo).
 * Retorna la URL pública de la imagen.
 */
export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Si Cloudinary está configurado en el entorno
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hogar-app/plantas',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            console.error('Error al subir a Cloudinary:', error);
            reject(new Error(error?.message || 'Error en subida de imagen'));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Fallback para desarrollo local (guardar en /public/uploads)
  const nombreArchivo = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const carpetaUploads = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(carpetaUploads, { recursive: true });
  const rutaDestino = path.join(carpetaUploads, nombreArchivo);
  await writeFile(rutaDestino, buffer);

  return `/uploads/${nombreArchivo}`;
}
