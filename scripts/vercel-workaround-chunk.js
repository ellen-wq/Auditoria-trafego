/**
 * Workaround: a Vercel pode tentar abrir um chunk com hash antigo (ex.: AdminCriativosPage-DYA_OOBG.js)
 * após o build. Copiamos o chunk atual para esse nome para o passo da Vercel não falhar.
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public', 'assets');
const legacyName = 'AdminCriativosPage-DYA_OOBG.js';
const legacyPath = path.join(publicDir, legacyName);

if (!fs.existsSync(publicDir)) {
  process.exit(0);
}

const files = fs.readdirSync(publicDir);
const match = files.find((f) => f.startsWith('AdminCriativosPage-') && f.endsWith('.js'));
if (match) {
  const src = path.join(publicDir, match);
  fs.copyFileSync(src, legacyPath);
  console.log('[vercel-workaround] Copiado', match, '->', legacyName);
}
