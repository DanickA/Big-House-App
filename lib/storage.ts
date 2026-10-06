import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Detecta si la aplicación se ejecuta en una plataforma serverless o en producción.
 * En estos entornos, el sistema de archivos del contenedor/lambda es de solo lectura y efímero.
 */
export function isServerlessOrProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    Boolean(process.env.NETLIFY)
  );
}

/**
 * Comprueba si un valor es un placeholder de configuración (ej: copiado de .env.example)
 */
function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  const val = value.trim().toLowerCase();
  return (
    val === '' ||
    val.includes('tu_cloud_name') ||
    val.includes('tu_api_key') ||
    val.includes('tu_api_secret') ||
    val.includes('tu-clave') ||
    val.startsWith('cloudinary://<')
  );
}

/**
 * Helper para configurar Cloudinary con soporte para CLOUDINARY_URL o variables individuales.
 * Retorna true únicamente si existen credenciales válidas y no de placeholder.
 */
export function configureCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim().replace(/^["']|["']$/g, '');
  if (cloudinaryUrl && !isPlaceholder(cloudinaryUrl)) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
    return true;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

  if (
    cloudName &&
    apiKey &&
    apiSecret &&
    !isPlaceholder(cloudName) &&
    !isPlaceholder(apiKey) &&
    !isPlaceholder(apiSecret)
  ) {
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
 * Retorna el estado actual del backend de almacenamiento para diagnósticos y comprobaciones.
 */
export function getStorageDiagnostic() {
  const isCloudinaryReady = configureCloudinary();
  const isServerless = isServerlessOrProduction();
  return {
    isCloudinaryReady,
    isServerless,
    storageMode: isCloudinaryReady ? 'cloudinary' : isServerless ? 'blocked_serverless' : 'local_disk',
  };
}

/**
 * Valida si el almacenamiento está habilitado. Si estamos en serverless/producción
 * y Cloudinary no está configurado, lanza un error con instrucciones claras en lugar
 * de fallar con EROFS o perder archivos en discos efímeros.
 */
function assertStorageAvailable(): void {
  if (configureCloudinary()) {
    return;
  }

  if (isServerlessOrProduction()) {
    throw new Error(
      'Configuración requerida: Cloudinary no está configurado en este entorno serverless/producción. ' +
      'El sistema de archivos local es efímero y de solo lectura. Por favor define CLOUDINARY_URL o ' +
      '(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) en las variables de entorno de tu plataforma (ej. Vercel).'
    );
  }

  // En desarrollo local emitimos advertencia informativa
  console.warn(
    '[Almacenamiento Local] Advertencia: Cloudinary no está configurado. Guardando archivo en public/uploads/. ' +
    'Este modo es exclusivo para desarrollo local offline y fallará en Vercel/serverless.'
  );
}

/**
 * Sube una imagen a Cloudinary (producción/nube) o al disco local (desarrollo).
 * Retorna la URL pública de la imagen.
 */
export async function uploadImage(file: File): Promise<string> {
  assertStorageAvailable();

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
  assertStorageAvailable();

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
