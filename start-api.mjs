process.env.JSON_SERVER_BODY_LIMIT = '5mb';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  execSync('node seed.js', { cwd: __dirname, stdio: 'inherit', shell: true });
} catch {}

const server = spawn('json-server', ['--watch', 'db.json', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, JSON_SERVER_BODY_LIMIT: '5mb' },
});

server.on('exit', (code) => process.exit(code ?? 0));
