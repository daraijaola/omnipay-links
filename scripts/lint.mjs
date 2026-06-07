import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const banned = [/try\s*{\s*import\s*\(/, /eval\s*\(/];
const problems = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    if (entry.isFile() && /\.(ts|css|html|md|mjs)$/.test(entry.name)) {
      const text = await readFile(path, 'utf8');
      banned.forEach((rule) => { if (rule.test(text)) problems.push(`${path}: banned pattern ${rule}`); });
    }
  }
}
await walk('src');
await walk('scripts');
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Lint passed: no banned import guards/eval patterns found.');
