import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 1. Requiere sesión activa
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Directorio base seguro fuera del directorio public
    const baseStorageDir = path.resolve(process.cwd(), '.storage', 'uploads');
    const targetFilePath = path.resolve(baseStorageDir, ...pathSegments);

    // 2. Prevenir Path Traversal (asegurar que targetFilePath esté dentro de baseStorageDir)
    if (!targetFilePath.startsWith(baseStorageDir)) {
      return new NextResponse('Forbidden: Path Traversal Detected', { status: 403 });
    }

    try {
      const fileStats = await stat(targetFilePath);
      if (!fileStats.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch {
      // Si no existe en .storage/uploads, verificar fallback en public/uploads por retrocompatibilidad
      const legacyPublicDir = path.resolve(process.cwd(), 'public', 'uploads');
      const legacyFilePath = path.resolve(legacyPublicDir, ...pathSegments);
      if (legacyFilePath.startsWith(legacyPublicDir)) {
        try {
          const legacyStats = await stat(legacyFilePath);
          if (legacyStats.isFile()) {
            const ext = path.extname(legacyFilePath).toLowerCase();
            const contentType = MIME_MAP[ext] || 'application/octet-stream';
            const fileBuffer = await readFile(legacyFilePath);
            return new NextResponse(fileBuffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, max-age=3600',
              },
            });
          }
        } catch {}
      }
      return new NextResponse('Not Found', { status: 404 });
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = await readFile(targetFilePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error al servir archivo privado:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
