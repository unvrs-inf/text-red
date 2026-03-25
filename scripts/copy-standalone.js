/**
 * Копирует .next/static и public в .next/standalone после next build.
 * Кросс-платформенная замена `cp -r` для Windows/Linux/macOS.
 */
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = path.resolve(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standalone)) {
  console.error('ERROR: .next/standalone не найден. Запустите `next build` сначала.');
  process.exit(1);
}

copyDir(
  path.join(root, '.next', 'static'),
  path.join(standalone, '.next', 'static')
);
console.log('✓ Скопировано: .next/static → .next/standalone/.next/static');

copyDir(
  path.join(root, 'public'),
  path.join(standalone, 'public')
);
console.log('✓ Скопировано: public → .next/standalone/public');
