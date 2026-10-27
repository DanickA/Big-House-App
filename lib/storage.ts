import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir, unlink } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_COMPROBANTE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_COMPROBANTE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

/**
 * Valida un archivo contra tamaño, tipo MIME y extensión permitida.
 */
function validateFile(
  file: File,
  allowedMimes: string[],
  allowedExts: string[],
  tipoArchivo: string
): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo de ${tipoArchivo} excede el tamaño máximo permitido de 5 MB.`);
  }

  if (!allowedMimes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido (${file.type}). Solo se admiten: ${allowedMimes.join(', ')}.`
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw new Error(
      `Extensión de archivo no permitida (${ext}). Solo se admiten: ${allowedExts.join(', ')}.`
    );
  }
}

/**
 * Detecta si la aplicación se ejecuta en una plataforma serverless o en producción.
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
      cloud_name: cloudName.toLowerCase(),
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

export function getStorageDiagnostic() {
  const isCloudinaryReady = configureCloudinary();
  const isServerless = isServerlessOrProduction();
  return {
    isCloudinaryReady,
    isServerless,
    storageMode: isCloudinaryReady ? 'cloudinary' : isServerless ? 'blocked_serverless' : 'local_disk',
  };
}

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

  console.warn(
    '[Almacenamiento Local Seguro] Guardando archivo en directorio privado .storage/uploads/. ' +
    'Los archivos se sirven de forma autenticada vía /api/files/.'
  );
}

/**
 * Sube una imagen a Cloudinary (producción/nube) o al almacenamiento privado local (desarrollo).
 * Valida MIME type, extensión y tamaño (máx 5MB) y usa nombres UUID no predecibles (F-24, Q-10).
 */
export async function uploadImage(file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_MIMES, ALLOWED_IMAGE_EXTS, 'imagen');
  assertStorageAvailable();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

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

  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const nombreArchivo = `${crypto.randomUUID()}${ext}`;
  const carpetaUploads = path.join(process.cwd(), '.storage', 'uploads', 'plantas');
  await mkdir(carpetaUploads, { recursive: true });
  const rutaDestino = path.join(carpetaUploads, nombreArchivo);
  await writeFile(rutaDestino, buffer);

  return `/api/files/plantas/${nombreArchivo}`;
}

/**
 * Sube un comprobante (recibo, factura, soporte de pago en imagen o PDF)
 * a Cloudinary o al almacenamiento privado local.
 * Valida MIME type, extensión y tamaño (máx 5MB) y usa resource_type explícito (F-24, Q-10).
 */
export async function uploadComprobante(file: File): Promise<string> {
  validateFile(file, ALLOWED_COMPROBANTE_MIMES, ALLOWED_COMPROBANTE_EXTS, 'comprobante');
  assertStorageAvailable();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (configureCloudinary()) {
    const resourceType: 'image' | 'raw' = file.type === 'application/pdf' ? 'raw' : 'image';
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hogar-app/comprobantes',
          resource_type: resourceType,
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

  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const nombreArchivo = `${crypto.randomUUID()}${ext}`;
  const carpetaComprobantes = path.join(process.cwd(), '.storage', 'uploads', 'comprobantes');
  await mkdir(carpetaComprobantes, { recursive: true });
  const rutaDestino = path.join(carpetaComprobantes, nombreArchivo);
  await writeFile(rutaDestino, buffer);

  return `/api/files/comprobantes/${nombreArchivo}`;
}

/**
 * Elimina de forma segura un archivo almacenado localmente en .storage/uploads/ cuando se reemplaza o borra (F-24).
 */
export async function deleteStoredFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith('/api/files/')) return;
  try {
    const relPath = fileUrl.replace(/^\/api\/files\//, '');
    if (relPath.includes('..')) return;
    const baseDir = path.resolve(process.cwd(), '.storage', 'uploads');
    const targetPath = path.resolve(baseDir, relPath);
    if (!targetPath.startsWith(baseDir + path.sep)) return;
    await unlink(targetPath);
  } catch {
    // Ignorar si el archivo ya no existe
  }
}
