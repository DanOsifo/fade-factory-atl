/**
 * Generates public/opengraph.jpg (1200×630) from the crest PNG.
 * Run: node scripts/gen-opengraph.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

const W = 1200;
const H = 630;

// Crest rendered at a height that leaves room for text
const CREST_H = 480;
const CREST_W = 480;

// Resize crest and get its actual dimensions
const crestBuf = await sharp(path.join(publicDir, 'favicon-512.png'))
  .resize(CREST_W, CREST_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// SVG overlay: background gradient + text
const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0a0a12"/>
      <stop offset="60%"  stop-color="#0d0d20"/>
      <stop offset="100%" stop-color="#060610"/>
    </linearGradient>
    <!-- subtle vignette -->
    <radialGradient id="vig" cx="50%" cy="50%" r="70%">
      <stop offset="0%"  stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
    <!-- gold accent line -->
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- decorative horizontal rule top -->
  <rect x="80" y="48" width="${W - 160}" height="2" fill="#c8a84b" opacity="0.55"/>

  <!-- decorative horizontal rule bottom -->
  <rect x="80" y="${H - 50}" width="${W - 160}" height="2" fill="#c8a84b" opacity="0.55"/>

  <!-- vignette overlay -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>

  <!-- FADE FACTORY ATL heading — right side -->
  <text
    x="${W / 2 + 210}"
    y="230"
    font-family="Arial Black, Impact, sans-serif"
    font-size="78"
    font-weight="900"
    letter-spacing="4"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
  >FADE</text>
  <text
    x="${W / 2 + 210}"
    y="318"
    font-family="Arial Black, Impact, sans-serif"
    font-size="78"
    font-weight="900"
    letter-spacing="4"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
  >FACTORY</text>
  <text
    x="${W / 2 + 210}"
    y="406"
    font-family="Arial Black, Impact, sans-serif"
    font-size="78"
    font-weight="900"
    letter-spacing="4"
    fill="#c8a84b"
    text-anchor="middle"
    dominant-baseline="middle"
  >ATL</text>

  <!-- tagline -->
  <text
    x="${W / 2 + 210}"
    y="476"
    font-family="Arial, sans-serif"
    font-size="22"
    font-weight="400"
    letter-spacing="6"
    fill="#8888aa"
    text-anchor="middle"
    dominant-baseline="middle"
  >EST. 2024 · ATLANTA, GA</text>
</svg>
`;

// Position crest on the left half, vertically centered
const crestLeft = Math.round((W / 2 - CREST_W) / 2);
const crestTop  = Math.round((H - CREST_H) / 2);

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 10, g: 10, b: 18, alpha: 1 } }
})
  .composite([
    { input: Buffer.from(svg), blend: 'over' },
    { input: crestBuf,         left: crestLeft, top: crestTop, blend: 'over' },
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(path.join(publicDir, 'opengraph.jpg'));

console.log('✓ opengraph.jpg written');
