/**
 * Copia public/ para dist/public/ para a função Vercel encontrar index.html
 * (includeFiles "dist/**" inclui dist/public/)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'public');
const dest = path.join(root, 'dist', 'public');

if (!fs.existsSync(src)) {
  console.warn('[copy-public-to-dist] public/ não encontrado, pulando.');
  process.exit(0);
}

function copyRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    if (fs.statSync(s).isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyRecursive(src, dest);
console.log('[build] public/ copiado para dist/public/');
