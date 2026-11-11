const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoLib = require('png-to-ico');
const pngToIco = pngToIcoLib.default || pngToIcoLib;

async function main() {
  const root = path.resolve(__dirname, '..');
  const sourcePath = path.join(root, 'Modern POS System Logo.png');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Modern POS System Logo.png not found');
  }

  console.log('Loading source image from:', sourcePath);
  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // 1. BFS Flood fill background from border + P/O seeds
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;

  function push(p) {
    if (!visited[p] && data[p * 3] >= 242 && data[p * 3 + 1] >= 242 && data[p * 3 + 2] >= 242) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  }

  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  push(440 * w + 830);  // inner P hole
  push(460 * w + 1090); // inner O hole

  while (head < tail) {
    const p = queue[head++];
    const x = p % w, y = Math.floor(p / w);
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  // 2. Build RGBA buffer with anti-aliased edge feathering
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const s = p * 3;
      const d = p * 4;
      const r = data[s], g = data[s + 1], b = data[s + 2];

      if (visited[p]) {
        out[d] = 0;
        out[d + 1] = 0;
        out[d + 2] = 0;
        out[d + 3] = 0;
      } else {
        let nearVisited = false;
        if (x > 0 && visited[p - 1]) nearVisited = true;
        else if (x < w - 1 && visited[p + 1]) nearVisited = true;
        else if (y > 0 && visited[p - w]) nearVisited = true;
        else if (y < h - 1 && visited[p + w]) nearVisited = true;

        if (nearVisited && (r > 210 && g > 210 && b > 210)) {
          const brightness = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - (brightness - 210) / 45))));
          out[d] = r;
          out[d + 1] = g;
          out[d + 2] = b;
          out[d + 3] = alpha;
        } else {
          out[d] = r;
          out[d + 1] = g;
          out[d + 2] = b;
          out[d + 3] = 255;
        }
      }
    }
  }

  // 3. Extract Full Logo
  const contentMinX = 53, contentMinY = 215, contentMaxX = 1516, contentMaxY = 750;
  const fullLeft = Math.max(0, contentMinX - 10);
  const fullTop = Math.max(0, contentMinY - 10);
  const fullWidth = Math.min(w - fullLeft, (contentMaxX - contentMinX + 1) + 20);
  const fullHeight = Math.min(h - fullTop, (contentMaxY - contentMinY + 1) + 20);

  const fullPngBuffer = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: fullLeft, top: fullTop, width: fullWidth, height: fullHeight })
    .resize(800, Math.round(800 * (fullHeight / fullWidth)), { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const fullBase64 = fullPngBuffer.toString('base64');
  const fullSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${fullWidth} ${fullHeight}" width="100%" height="100%">
  <image width="${fullWidth}" height="${fullHeight}" xlink:href="data:image/png;base64,${fullBase64}"/>
</svg>
`;

  // Write full logo SVGs
  const fullSvgTargets = [
    path.join(root, 'frontend', 'static', 'images', 'logo', 'posnic.svg'),
    path.join(root, 'frontend', 'static', 'style', 'images', 'logo.svg')
  ];
  for (const t of fullSvgTargets) {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.writeFileSync(t, fullSvgContent);
    console.log('✅ Updated full logo SVG:', t);
  }

  // 4. Extract Icon Logo (Terminal + Printer, x: 53 to 705)
  const iconLeft = Math.max(0, contentMinX - 10);
  const iconTop = Math.max(0, contentMinY - 10);
  const iconW = (705 - contentMinX + 1) + 20;
  const iconH = (contentMaxY - contentMinY + 1) + 20;

  const icon512Buffer = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: iconLeft, top: iconTop, width: iconW, height: iconH })
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const icon256Buffer = await sharp(icon512Buffer)
    .resize(256, 256)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const iconBase64 = icon256Buffer.toString('base64');
  const iconSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" xlink:href="data:image/png;base64,${iconBase64}"/>
</svg>
`;

  // Write icon logo SVGs
  const iconSvgTargets = [
    path.join(root, 'frontend', 'static', 'images', 'logo', 'posnic-logo.svg'),
    path.join(root, 'frontend', 'static', 'style', 'images', 'small_logo.svg')
  ];
  for (const t of iconSvgTargets) {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.writeFileSync(t, iconSvgContent);
    console.log('✅ Updated icon logo SVG:', t);
  }

  // 5. Update PNG files: builds/512-posnic.png, favicons, app icons
  fs.writeFileSync(path.join(root, 'builds', '512-posnic.png'), icon512Buffer);
  fs.writeFileSync(path.join(root, 'builds', 'favicon.png'), icon256Buffer);
  fs.writeFileSync(path.join(root, 'frontend', 'favicon.png'), icon256Buffer);
  console.log('✅ Updated builds/512-posnic.png and favicons');

  // Multi-size icons and favicons
  const iconSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  for (const size of iconSizes) {
    const buf = await sharp(icon512Buffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    icoBuffers.push(buf);
    fs.writeFileSync(path.join(root, 'builds', `icon-${size}.png`), buf);
  }

  const faviconSizes = [32, 57, 72, 96, 120, 128, 144, 152, 195, 228];
  for (const size of faviconSizes) {
    const buf = await sharp(icon512Buffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(root, 'builds', `favicon-${size}.png`), buf);
  }

  // ICO files (app.ico, icon.ico)
  console.log('Generating ICO files...');
  const ico = await pngToIco(icoBuffers);
  fs.writeFileSync(path.join(root, 'builds', 'app.ico'), ico);
  fs.writeFileSync(path.join(root, 'builds', 'icon.ico'), ico);
  fs.writeFileSync(path.join(root, 'builds', 'favicon.ico'), ico);
  console.log('✅ Generated builds/app.ico, icon.ico, favicon.ico');
  console.log('🎉 All logo and icon assets updated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
