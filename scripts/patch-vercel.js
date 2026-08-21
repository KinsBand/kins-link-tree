import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapterPath = path.join(__dirname, '..', 'node_modules', '@astrojs', 'vercel', 'dist', 'serverless', 'adapter.js');

if (fs.existsSync(adapterPath)) {
  let content = fs.readFileSync(adapterPath, 'utf8');
  content = content.replace(/18:\s*\{[^}]*\},/g, "18: { status: 'retiring', removal: 'Early 2025', warnDate: new Date('October 1 2024') }, 20: { status: 'default' }, 22: { status: 'default' }, 24: { status: 'default' }, 26: { status: 'default' },");
  content = content.replaceAll("'nodejs18.x'", "'nodejs20.x'");
  fs.writeFileSync(adapterPath, content, 'utf8');
  console.log('[patch-vercel] Successfully patched @astrojs/vercel for Node 24 support.');
}
