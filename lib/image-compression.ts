/**
 * Comprime y redimensiona una imagen en el navegador del cliente antes de enviarla.
 * 
 * Beneficios:
 * 1. Las cámaras de smartphones modernos generan fotos de entre 4 MB y 15 MB.
 * 2. Next.js Server Actions tiene un límite por defecto de 1 MB.
 * 3. Vercel Serverless Functions tiene un límite infranqueable de 4.5 MB en el body.
 * 4. Acelera drásticamente la subida en redes móviles (de varios segundos a milisegundos).
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  // Si no es imagen o ya es muy liviana (< 400 KB), la enviamos directamente
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Redimensionar conservando el aspecto proporcional
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }

            const cleanFileName = file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_');

            const compressedFile = new File(
              [blob],
              `${cleanFileName}.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
