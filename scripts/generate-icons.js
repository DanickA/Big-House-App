/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// SVG para icono estándar y Apple Touch Icon
// Diseño: Fondo verde bosque (#2D3E24) con gradiente sutil,
// emblema de hogar contemporáneo con brote de planta integrado en tono crema (#ECE3D4) y salvia (#8FA876).
function getStandardSvg(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#384C2E" />
      <stop offset="100%" stop-color="#23311C" />
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8EA777" />
      <stop offset="100%" stop-color="#B8CFA3" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECE3D4" />
      <stop offset="100%" stop-color="#DDD1BD" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F180C" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Fondo base con esquinas suavemente redondeadas -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />

  <!-- Sutil textura de anillo o halo exterior decorativo -->
  <circle cx="256" cy="256" r="220" stroke="#ECE3D4" stroke-opacity="0.07" stroke-width="2" />
  <circle cx="256" cy="256" r="190" stroke="#ECE3D4" stroke-opacity="0.05" stroke-width="1.5" />

  <!-- Grupo del Emblema Principal con Sombra -->
  <g filter="url(#shadow)">
    <!-- Silueta del Techo del Hogar -->
    <path 
      d="M256 122 L132 230 C125 236 127 246 136 246 H166 V358 C166 368 174 376 184 376 H328 C338 376 346 368 346 358 V246 H376 C385 246 387 236 380 230 L256 122 Z" 
      fill="none" 
      stroke="url(#accentGrad)" 
      stroke-width="20" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />

    <!-- Chimenea estilizada -->
    <path
      d="M312 170 V140 C312 136 316 132 320 132 H336 C340 132 344 136 344 140 V198"
      stroke="url(#accentGrad)"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Suelo / Base del Hogar interior -->
    <rect x="200" y="348" width="112" height="12" rx="6" fill="url(#accentGrad)" />

    <!-- Planta / Brote botánico central naciendo dentro de la casa -->
    <!-- Tallo curvado -->
    <path 
      d="M256 346 C256 300 256 250 256 216" 
      stroke="url(#leafGrad)" 
      stroke-width="14" 
      stroke-linecap="round" 
    />
    
    <!-- Hoja izquierda curvada -->
    <path 
      d="M256 280 C228 276 200 248 206 218 C232 214 254 242 256 280 Z" 
      fill="url(#leafGrad)" 
    />

    <!-- Hoja derecha principal extendiéndose hacia la luz -->
    <path 
      d="M256 250 C286 244 316 212 308 182 C280 178 258 210 256 250 Z" 
      fill="url(#leafGrad)" 
    />

    <!-- Pequeño brote superior central -->
    <ellipse cx="256" cy="208" rx="7" ry="12" fill="#ECE3D4" />
  </g>
</svg>
`;
}

// SVG para Maskable Icon (Fondo completo cuadrado 100% sangrado y el contenido escalado dentro de la zona segura del 70%)
function getMaskableSvg(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#384C2E" />
      <stop offset="100%" stop-color="#23311C" />
    </linearGradient>
    <linearGradient id="leafGradMask" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8EA777" />
      <stop offset="100%" stop-color="#B8CFA3" />
    </linearGradient>
    <linearGradient id="accentGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECE3D4" />
      <stop offset="100%" stop-color="#DDD1BD" />
    </linearGradient>
    <filter id="shadowMask" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F180C" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Fondo plano completo sin esquinas redondeadas para que el launcher aplique la máscara libremente -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Sutil adorno geométrico dentro de la zona segura -->
  <circle cx="256" cy="256" r="185" stroke="#ECE3D4" stroke-opacity="0.07" stroke-width="2" />

  <!-- Grupo escalado al 78% y centrado en (256, 256) para cumplir estrictamente con la zona segura (Safe Zone) -->
  <g transform="translate(256, 256) scale(0.78) translate(-256, -256)" filter="url(#shadowMask)">
    <!-- Silueta del Techo del Hogar -->
    <path 
      d="M256 122 L132 230 C125 236 127 246 136 246 H166 V358 C166 368 174 376 184 376 H328 C338 376 346 368 346 358 V246 H376 C385 246 387 236 380 230 L256 122 Z" 
      fill="none" 
      stroke="url(#accentGradMask)" 
      stroke-width="20" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />

    <!-- Chimenea estilizada -->
    <path
      d="M312 170 V140 C312 136 316 132 320 132 H336 C340 132 344 136 344 140 V198"
      stroke="url(#accentGradMask)"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Suelo / Base del Hogar interior -->
    <rect x="200" y="348" width="112" height="12" rx="6" fill="url(#accentGradMask)" />

    <!-- Planta / Brote botánico central -->
    <path 
      d="M256 346 C256 300 256 250 256 216" 
      stroke="url(#leafGradMask)" 
      stroke-width="14" 
      stroke-linecap="round" 
    />
    
    <path 
      d="M256 280 C228 276 200 248 206 218 C232 214 254 242 256 280 Z" 
      fill="url(#leafGradMask)" 
    />

    <path 
      d="M256 250 C286 244 316 212 308 182 C280 178 258 210 256 250 Z" 
      fill="url(#leafGradMask)" 
    />

    <ellipse cx="256" cy="208" rx="7" ry="12" fill="#ECE3D4" />
  </g>
</svg>
`;
}

// SVG sólido para Apple Touch Icon (iOS no permite transparencia; bordes rectos ya que iOS aplica su propio squircling)
function getAppleTouchSvg(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="appleBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#384C2E" />
      <stop offset="100%" stop-color="#23311C" />
    </linearGradient>
    <linearGradient id="appleLeaf" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8EA777" />
      <stop offset="100%" stop-color="#B8CFA3" />
    </linearGradient>
    <linearGradient id="appleAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECE3D4" />
      <stop offset="100%" stop-color="#DDD1BD" />
    </linearGradient>
    <filter id="appleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F180C" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Fondo sólido completo -->
  <rect width="512" height="512" fill="url(#appleBg)" />

  <g transform="translate(256, 256) scale(0.88) translate(-256, -256)" filter="url(#appleShadow)">
    <path 
      d="M256 122 L132 230 C125 236 127 246 136 246 H166 V358 C166 368 174 376 184 376 H328 C338 376 346 368 346 358 V246 H376 C385 246 387 236 380 230 L256 122 Z" 
      fill="none" 
      stroke="url(#appleAccent)" 
      stroke-width="20" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />
    <path
      d="M312 170 V140 C312 136 316 132 320 132 H336 C340 132 344 136 344 140 V198"
      stroke="url(#appleAccent)"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect x="200" y="348" width="112" height="12" rx="6" fill="url(#appleAccent)" />
    <path 
      d="M256 346 C256 300 256 250 256 216" 
      stroke="url(#leafGrad)" 
      stroke-width="14" 
      stroke-linecap="round" 
    />
    <path 
      d="M256 280 C228 276 200 248 206 218 C232 214 254 242 256 280 Z" 
      fill="url(#leafGrad)" 
    />
    <path 
      d="M256 250 C286 244 316 212 308 182 C280 178 258 210 256 250 Z" 
      fill="url(#leafGrad)" 
    />
    <ellipse cx="256" cy="208" rx="7" ry="12" fill="#ECE3D4" />
  </g>
</svg>
`;
}

async function generate() {
  console.log('--- Generando iconos PWA de alta calidad para HogarApp ---');

  // 1. Guardar SVG maestro en public/icons/icon.svg
  const masterSvg = getStandardSvg(512);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), masterSvg, 'utf8');
  console.log('✓ Creado: public/icons/icon.svg');

  // 2. Generar icon-192x192.png
  await sharp(Buffer.from(masterSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-192x192.png'));
  console.log('✓ Creado: public/icons/icon-192x192.png (192x192)');

  // 3. Generar icon-512x512.png
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('✓ Creado: public/icons/icon-512x512.png (512x512)');

  // 4. Generar icon-maskable-192x192.png
  const maskableSvg = getMaskableSvg(512);
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-maskable-192x192.png'));
  console.log('✓ Creado: public/icons/icon-maskable-192x192.png (192x192 Maskable)');

  // 5. Generar icon-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-maskable-512x512.png'));
  console.log('✓ Creado: public/icons/icon-maskable-512x512.png (512x512 Maskable)');

  // 6. Generar apple-touch-icon.png (180x180)
  const appleSvg = getAppleTouchSvg(512);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('✓ Creado: public/icons/apple-touch-icon.png (180x180 iOS)');

  // 7. Favicons auxiliares
  await sharp(Buffer.from(masterSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(ICONS_DIR, 'favicon-32x32.png'));
  await sharp(Buffer.from(masterSvg))
    .resize(16, 16)
    .png()
    .toFile(path.join(ICONS_DIR, 'favicon-16x16.png'));
  console.log('✓ Creado: public/icons/favicon-32x32.png y favicon-16x16.png');

  console.log('\n¡Todos los iconos PWA se generaron exitosamente!');
}

generate().catch((err) => {
  console.error('Error generando iconos:', err);
  process.exit(1);
});
