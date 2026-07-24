import { spawn } from 'child_process';

const isWin = process.platform === 'win32';

function label(name, color) {
  return isWin ? '' : `\x1b[${color}m[${name}]\x1b[0m `;
}

function run(name, cmd, args, color) {
  const child = spawn(cmd, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

  child.stdout?.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) process.stdout.write(`${label(name, color)}${line}\n`);
  });

  child.stderr?.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) process.stderr.write(`${label(name, color)}${line}\n`);
  });

  return child;
}

console.log('\n  Srvio Dev — starting API + Frontend\n');

const api = run('api', 'node', ['start-api.mjs'], '36');
const fe  = run('fe',  'npx', ['vite'], '35');

function cleanup() {
  api.kill('SIGTERM');
  fe.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
