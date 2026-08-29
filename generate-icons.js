import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync('public/favicon.svg');

async function generate() {
  console.log('Generating favicon and app icon PNGs...');

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/web-app-manifest-512x512.png');

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/web-app-manifest-192x192.png');

  // 180x180 (Apple Touch Icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  // 96x96
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile('public/favicon-96x96.png');

  // 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');

  // 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile('public/favicon-16x16.png');

  // Save 32x32 as favicon.ico directly
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');

  // Generate 1200x630 OG image
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Geist:wght@400;500;600&amp;display=swap');
        .logo-font { font-family: 'DM Serif Display', Georgia, serif; }
        .geist { font-family: 'Geist', -apple-system, sans-serif; }
      </style>
      <linearGradient id="ogGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="50%" stop-color="#D97706" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>
      <radialGradient id="ogGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#D97706" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="#09090b" />
    <circle cx="600" cy="270" r="380" fill="url(#ogGlow)" />
    
    <!-- Logo Badge -->
    <g transform="translate(480, 80)">
      <rect width="240" height="240" fill="#121214" rx="60" ry="60" stroke="url(#ogGold)" stroke-width="3" stroke-opacity="0.4" />
      <text x="120" y="130" dominant-baseline="central" text-anchor="middle" class="logo-font" fill="url(#ogGold)" font-size="78">Qibla</text>
    </g>

    <text x="600" y="380" dominant-baseline="central" text-anchor="middle" class="geist" font-weight="bold" fill="#EDEDED" font-size="44" letter-spacing="-1">CheckQibla</text>
    <text x="600" y="440" dominant-baseline="central" text-anchor="middle" class="geist" fill="#A1A1A1" font-size="22">100% Accurate Online Qibla Compass &amp; Prayer Times</text>
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile('public/og-image.png');

  console.log('✓ All favicon and icon images generated successfully!');
}

generate().catch(console.error);
