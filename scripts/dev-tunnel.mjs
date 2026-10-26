import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  const port = Number(process.env.PORT) || 3000;
  const serverRunning = await isPortOpen(port);

  let nextProcess = null;

  if (!serverRunning) {
    console.log(`\n⏳ El servidor no está corriendo en el puerto ${port}. Iniciándolo automáticamente...`);
    const nextBin = path.resolve('node_modules/next/dist/bin/next');
    nextProcess = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0', '-p', String(port)], {
      stdio: 'inherit',
    });

    // Esperar a que el servidor esté listo
    let attempts = 0;
    while (attempts < 25) {
      await new Promise((r) => setTimeout(r, 800));
      if (await isPortOpen(port)) break;
      attempts++;
    }
  }

  console.log('\n===============================================================');
  console.log('       🌐 BIGHOUSE APP - TÚNEL HTTPS SEGURO (CLOUDFLARE)');
  console.log('===============================================================');
  console.log(`  Conectando túnel seguro a http://localhost:${port}...`);

  let untunModule;
  try {
    untunModule = await import('untun');
  } catch (err) {
    console.error('Error importando untun:', err);
    process.exit(1);
  }

  const { startTunnel } = untunModule;
  const tunnel = await startTunnel({
    port,
    acceptCloudflareNotice: true,
  });

  const publicUrl = await tunnel.getURL();

  console.log('---------------------------------------------------------------');
  console.log(`  URL Pública HTTPS: \x1b[32m\x1b[1m${publicUrl}\x1b[0m`);
  console.log('  Apunta la cámara de tu iPhone / iPad a este código QR:');
  console.log('---------------------------------------------------------------');

  try {
    const qrString = await QRCode.toString(publicUrl, {
      type: 'terminal',
      small: true,
    });
    console.log(qrString);
  } catch (err) {
    console.log(`  (Abre en Safari: ${publicUrl})`);
  }

  console.log('---------------------------------------------------------------');
  console.log('  🔒 CARACTERÍSTICAS HTTPS:');
  console.log('  - Certificado SSL válido reconocido por Safari de iOS/iPadOS.');
  console.log('  - Compatible con PWA ("Añadir a pantalla de inicio") y Web Push.');
  console.log('  - Funciona dentro de la casa o con datos celulares (4G/5G).');
  console.log('  - Presiona Ctrl + C en cualquier momento para cerrar el túnel.');
  console.log('===============================================================\n');

  const cleanup = async () => {
    console.log('\nCerrando túnel y servicios...');
    try {
      await tunnel.close();
    } catch {}
    if (nextProcess && !nextProcess.killed) {
      nextProcess.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run().catch((err) => {
  console.error('Error al iniciar el túnel Cloudflare:', err);
  process.exit(1);
});
