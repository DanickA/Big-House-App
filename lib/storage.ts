import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Helper para configurar Cloudinary con soporte para CLOUDINARY_URL o variables individuales
function configureCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim().replace(/^["']|["']$/g, '');
  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
    return true;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName.toLowerCase(), // Cloudinary requiere nombres de nube en minúsculas
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

/**
 * Sube una imagen a Cloudinary (producción/nube) o al disco local (desarrollo).
 * Retorna la URL pública de la imagen.
 */
export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Si Cloudinary está configurado en el entorno
  if (configureCloudinary()) {
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

/**
 * Sube un comprobante (recibo, factura, soporte de pago en imagen o PDF)
 * a Cloudinary (producción/Vercel) o a public/uploads/comprobantes (desarrollo local).
 * Retorna la URL pública accesible.
 */
export async function uploadComprobante(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Si Cloudinary está configurado en el entorno (Vercel / producción)
  if (configureCloudinary()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hogar-app/comprobantes',
          resource_type: 'auto', // Soporta imágenes (PNG, JPG) y documentos (PDF)
        },
        (error, result) => {
          if (error || !result) {
            console.error('Error al subir comprobante a Cloudinary:', error);
            reject(new Error(error?.message || 'Error en subida de comprobante a Cloudinary'));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Fallback para desarrollo local (guardar en /public/uploads/comprobantes)
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const nombreArchivo = `${Date.now()}-${safeName}`;
  const carpetaComprobantes = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
  await mkdir(carpetaComprobantes, { recursive: true });
  const rutaDestino = path.join(carpetaComprobantes, nombreArchivo);
  await writeFile(rutaDestino, buffer);

  return `/uploads/comprobantes/${nombreArchivo}`;
}
