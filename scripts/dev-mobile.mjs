import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';

function getLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

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

async function run() {
  const port = process.env.PORT || 3000;
  const ip = getLocalIp();
  const mobileUrl = `http://${ip}:${port}`;

  console.log('\n===============================================================');
  console.log('       📱 BIGHOUSE APP - PREVISUALIZACIÓN MÓVIL EN VIVO');
  console.log('===============================================================');
  console.log(`  Red Local Wi-Fi: \x1b[36m\x1b[1m${mobileUrl}\x1b[0m`);
  console.log('  Apunta la cámara de tu iPhone / iPad a este código QR:');
  console.log('---------------------------------------------------------------');

  try {
    const qrString = await QRCode.toString(mobileUrl, {
      type: 'terminal',
      small: true,
    });
    console.log(qrString);
  } catch (err) {
    console.log(`  (Escanea o ingresa manualmente a: ${mobileUrl})`);
  }

  console.log('---------------------------------------------------------------');
  console.log('  💡 CONSEJOS:');
  console.log('  1. Verifica que tu iPhone o tablet esté en la misma red Wi-Fi.');
  console.log('  2. Los cambios en el código se reflejan en tiempo real (Fast Refresh).');
  console.log('  3. Si requieres probar HTTPS o Web Push, ejecuta: npm run dev:tunnel');
  console.log('===============================================================\n');

  const nextBin = path.resolve('node_modules/next/dist/bin/next');
  const nextProcess = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0', '-p', String(port)], {
    stdio: 'inherit',
  });

  const cleanup = () => {
    if (nextProcess && !nextProcess.killed) {
      nextProcess.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run().catch((err) => {
  console.error('Error al iniciar el servidor móvil:', err);
  process.exit(1);
});
