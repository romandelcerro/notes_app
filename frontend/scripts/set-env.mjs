import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envDir = join(root, 'src', 'environments');

const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';
const production = process.env['NODE_ENV'] === 'production';

function generateEnvContent(prod) {
  return `export const environment = {
  production: ${prod},
  apiUrl: '${apiUrl}',
};
`;
}

if (!existsSync(envDir)) {
  mkdirSync(envDir, { recursive: true });
}

writeFileSync(join(envDir, 'environment.ts'), generateEnvContent(false), 'utf-8');
writeFileSync(join(envDir, 'environment.prod.ts'), generateEnvContent(true), 'utf-8');
