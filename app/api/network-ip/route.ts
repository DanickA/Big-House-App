import { NextResponse } from 'next/server';
import os from 'node:os';

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  const candidates: { name: string; ip: string; score: number }[] = [];

  for (const [name, addrs] of Object.entries(nets)) {
    if (!addrs) continue;
    const isVirtual = /virtual|vmware|vbox|wsl|vethernet/i.test(name);
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        let score = 0;
        if (/wi-?fi|wireless/i.test(name)) score += 10;
        if (/ethernet/i.test(name) && !isVirtual) score += 5;
        if (isVirtual || addr.address.startsWith('192.168.56.')) score -= 20;
        candidates.push({ name, ip: addr.address, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ? candidates[0].ip : '127.0.0.1';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const port = searchParams.get('port') || '3000';
    const ip = getLocalIp();

    const prototypeUrl = `http://${ip}:${port}/prototype/apple-design`;
    const appUrl = `http://${ip}:${port}/`;

    return NextResponse.json({
      ip,
      port,
      prototypeUrl,
      appUrl,
      isLocalhost: ip === '127.0.0.1',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error detecting local network IP' },
      { status: 500 }
    );
  }
}
