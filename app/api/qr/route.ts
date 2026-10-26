import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Falta el parámetro url' }, { status: 400 });
    }

    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#1c1c1e',
        light: '#ffffff',
      },
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error generating QR code' }, { status: 500 });
  }
}
