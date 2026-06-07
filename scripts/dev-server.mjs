import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || process.env.PORT || 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`);
  let file = join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    const fallback = await readFile(join(root, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fallback);
  }
}).listen(port, () => console.log(`OmniPay Links running at http://localhost:${port}`));
