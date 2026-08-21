import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceLogo = path.join(rootDir, 'public', 'new.png');
const publicDir = path.join(rootDir, 'public');

async function generatePwaIcons() {
  console.log('Generating PWA icons from:', sourceLogo);

  // 1. Trim transparent padding from the logo to isolate the Kins artwork mark
  const trimmed = await sharp(sourceLogo).trim().toBuffer({ resolveWithObject: true });
  console.log(`Trimmed logo bounds: ${trimmed.info.width}x${trimmed.info.height}`);

  // Helper to compose the logo onto a dark solid canvas (#0a0a0c)
  async function createSquareIcon(size, logoScale, outputPath) {
    const targetLogoWidth = Math.round(size * logoScale);
    const resizedLogo = await sharp(trimmed.data)
      .resize(targetLogoWidth, null, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    const left = Math.round((size - resizedLogo.info.width) / 2);
    const top = Math.round((size - resizedLogo.info.height) / 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 10, b: 12, alpha: 1 } // #0a0a0c dark rock canvas
      }
    })
    .composite([
      {
        input: resizedLogo.data,
        left: left,
        top: top
      }
    ])
    .png()
    .toFile(outputPath);

    console.log(`✅ Saved: ${path.relative(rootDir, outputPath)} (${size}x${size}, logo: ${resizedLogo.info.width}x${resizedLogo.info.height})`);
  }

  // 2. Generate standard PWA icons ("any")
  await createSquareIcon(512, 0.84, path.join(publicDir, 'icon-512x512.png'));
  await createSquareIcon(192, 0.84, path.join(publicDir, 'icon-192x192.png'));

  // 3. Generate Android Adaptive Maskable icons ("maskable", fits within 80% circle safe-zone)
  await createSquareIcon(512, 0.70, path.join(publicDir, 'icon-maskable-512x512.png'));
  await createSquareIcon(192, 0.70, path.join(publicDir, 'icon-maskable-192x192.png'));

  // 4. Generate Apple Touch Icon (iOS Home Screen)
  await createSquareIcon(180, 0.84, path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Generate Favicons
  await createSquareIcon(32, 0.88, path.join(publicDir, 'favicon-32x32.png'));
  await createSquareIcon(16, 0.90, path.join(publicDir, 'favicon-16x16.png'));

  // 6. Generate favicon.ico (combines 16x16 and 32x32)
  const png16 = await sharp(path.join(publicDir, 'favicon-16x16.png')).png().toBuffer();
  const png32 = await sharp(path.join(publicDir, 'favicon-32x32.png')).png().toBuffer();

  const numImages = 2;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type 1 = ICO
  header.writeUInt16LE(numImages, 4);

  const dirOffset = 6 + (16 * numImages);

  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(16, 0);
  entry1.writeUInt8(16, 1);
  entry1.writeUInt8(0, 2);
  entry1.writeUInt8(0, 3);
  entry1.writeUInt16LE(1, 4);
  entry1.writeUInt16LE(32, 6);
  entry1.writeUInt32LE(png16.length, 8);
  entry1.writeUInt32LE(dirOffset, 12);

  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(32, 0);
  entry2.writeUInt8(32, 1);
  entry2.writeUInt8(0, 2);
  entry2.writeUInt8(0, 3);
  entry2.writeUInt16LE(1, 4);
  entry2.writeUInt16LE(32, 6);
  entry2.writeUInt32LE(png32.length, 8);
  entry2.writeUInt32LE(dirOffset + png16.length, 12);

  const icoBuf = Buffer.concat([header, entry1, entry2, png16, png32]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log(`✅ Saved: ${path.relative(rootDir, path.join(publicDir, 'favicon.ico'))}`);

  console.log('🎉 All PWA and brand icons generated successfully!');
}

generatePwaIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
