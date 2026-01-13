import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const root = process.cwd();
const faviconPath = path.join(root, 'public', 'favicon.png');

const webIcons = [
  { size: 16, path: path.join(root, 'public', 'favicon-16x16.png') },
  { size: 32, path: path.join(root, 'public', 'favicon-32x32.png') },
  { size: 96, path: path.join(root, 'public', 'favicon-96x96.png') },
  { size: 192, path: path.join(root, 'public', 'android-chrome-192x192.png') },
  { size: 512, path: path.join(root, 'public', 'android-chrome-512x512.png') },
  { size: 180, path: path.join(root, 'public', 'apple-touch-icon.png') },
  { size: 192, path: path.join(root, 'public', 'icon-192.png') },
  { size: 512, path: path.join(root, 'public', 'icon-512.png') },
];

const densities = [
  { suffix: 'ldpi', size: 36 },
  { suffix: 'mdpi', size: 48 },
  { suffix: 'hdpi', size: 72 },
  { suffix: 'xhdpi', size: 96 },
  { suffix: 'xxhdpi', size: 144 },
  { suffix: 'xxxhdpi', size: 192 },
];

const androidRoot = path.join(root, 'android', 'app', 'src', 'main', 'res');

const iosContentsPath = path.join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
  'Contents.json',
);

async function ensureExists(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function renderIcon(size, outputPath) {
  await ensureExists(outputPath);
  await sharp(faviconPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outputPath);
}

async function generateWebIcons() {
  const tasks = webIcons.map(({ size, path: output }) => renderIcon(size, output));
  await Promise.all(tasks);
}

async function generateAndroidIcons() {
  await Promise.all(
    densities.map(async ({ suffix, size }) => {
      const dir = path.join(androidRoot, `mipmap-${suffix}`);
      await fs.mkdir(dir, { recursive: true });
      await Promise.all([
        renderIcon(size, path.join(dir, 'ic_launcher.png')),
        renderIcon(size, path.join(dir, 'ic_launcher_round.png')),
        renderIcon(size, path.join(dir, 'ic_launcher_foreground.png')),
      ]);
    }),
  );
}

async function generateIosIcons() {
  const contents = JSON.parse(await fs.readFile(iosContentsPath, 'utf8'));
  const fileMap = new Map();
  contents.images.forEach((image) => {
    if (!image.filename || !image.size || !image.scale) return;
    const [width] = image.size.split('x').map((value) => parseFloat(value));
    const scaleValue = parseFloat(String(image.scale));
    const pixelSize = Math.round(width * scaleValue);
    const existing = fileMap.get(image.filename) || 0;
    fileMap.set(image.filename, Math.max(existing, pixelSize));
  });
  await Promise.all(
    Array.from(fileMap.entries()).map(([filename, size]) =>
      renderIcon(size, path.join(path.dirname(iosContentsPath), filename)),
    ),
  );
}

async function main() {
  await Promise.all([generateWebIcons(), generateAndroidIcons(), generateIosIcons()]);
  console.log('Icons regenerated from favicon.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
