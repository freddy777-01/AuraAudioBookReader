import { spawn } from 'child_process';
import path from 'path';
import os from 'os';

// Ensure Cargo bin is in PATH for any terminal session
const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
const env = { ...process.env };

if (!env.PATH || !env.PATH.toLowerCase().includes(cargoBin.toLowerCase())) {
  env.PATH = `${cargoBin}${path.delimiter}${env.PATH || ''}`;
}

const args = process.argv.slice(2);
const isWindows = process.platform === 'win32';
const tauriCmd = isWindows ? 'tauri.cmd' : 'tauri';
const tauriBin = path.resolve('node_modules', '.bin', tauriCmd);

const child = spawn(tauriBin, args, { stdio: 'inherit', env, shell: isWindows });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start Tauri CLI:', err);
  process.exit(1);
});
