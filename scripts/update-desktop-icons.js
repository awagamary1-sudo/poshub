const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const pngToIcoLib = require('png-to-ico');
const pngToIco = pngToIcoLib.default || pngToIcoLib;

async function main() {
  const root = path.resolve(__dirname, '..');
  const iconSource = path.join(root, 'builds', '512-posnic.png');
  if (!fs.existsSync(iconSource)) {
    throw new Error('builds/512-posnic.png not found');
  }

  console.log('Loading 512-posnic.png...');
  const baseBuf = fs.readFileSync(iconSource);

  // 1. Generate PWA icons
  console.log('Generating PWA icons...');
  const icon512 = await sharp(baseBuf).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const icon192 = await sharp(baseBuf).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const appleTouch = await sharp(baseBuf).resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  // Maskable: centered inside 80% safe zone with white background
  const maskableInner = await sharp(baseBuf).resize(410, 410, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
  const iconMaskable = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: maskableInner, gravity: 'center' }])
    .png()
    .toBuffer();

  const pwaDirs = [
    path.join(root, 'frontend', 'static', 'images', 'icons-pwa'),
    path.join(root, 'frontend', 'public', 'static', 'images', 'icons-pwa')
  ];

  for (const dir of pwaDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'icon-512.png'), icon512);
    fs.writeFileSync(path.join(dir, 'icon-192.png'), icon192);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), appleTouch);
    fs.writeFileSync(path.join(dir, 'icon-maskable-512.png'), iconMaskable);
    console.log('✅ PWA icons updated in:', dir);
  }

  // 2. Build multi-resolution ICO for Chrome & Windows desktop shortcuts
  console.log('Building multi-resolution ICO...');
  const sizes = [16, 24, 32, 40, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp(baseBuf)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  const icoBuf = await pngToIco(pngBuffers);
  const icoMd5 = crypto.createHash('md5').update(icoBuf).digest();

  // Also update builds/app.ico and builds/icon.ico with this complete multi-res ICO
  fs.writeFileSync(path.join(root, 'builds', 'app.ico'), icoBuf);
  fs.writeFileSync(path.join(root, 'builds', 'icon.ico'), icoBuf);
  fs.writeFileSync(path.join(root, 'builds', 'favicon.ico'), icoBuf);
  console.log('✅ Updated builds/app.ico, icon.ico, favicon.ico');

  // 3. Update Chrome Web Application desktop icons
  const chromeAppDirs = [
    path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Web Applications', '_crx_hpknomphiffhfkcmiigoinooifgjklmp'),
    path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Profile 2', 'Web Applications', '_crx_lcfaadfokfeelnbegafidkkijkjhgakf')
  ];

  for (const cad of chromeAppDirs) {
    if (fs.existsSync(cad)) {
      const icoTarget = path.join(cad, 'Posnic POS.ico');
      const md5Target = path.join(cad, 'Posnic POS.ico.md5');
      fs.writeFileSync(icoTarget, icoBuf);
      fs.writeFileSync(md5Target, icoMd5);
      console.log('✅ Updated Chrome app icon in:', cad);
    }
  }

  console.log('🎉 Desktop icons and PWA assets updated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

