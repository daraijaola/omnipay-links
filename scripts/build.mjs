import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
execFileSync('tsc', ['--pretty', 'false'], { stdio: 'inherit' });
await cp('src/styles/styles.css', 'dist/assets/styles.css');
await cp('index.html', 'dist/index.html');
await cp('public', 'dist', { recursive: true });
console.log('Built OmniPay Links static app to dist/');
