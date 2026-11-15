import { mkdir, readFile, writeFile } from 'node:fs/promises';

const files = ['index.html', 'catalog.js', 'replay.js', 'scan.js'];
const entries = await Promise.all(files.map(async file => [file, await readFile('web/' + file, 'utf8')]));
const source = await readFile('worker/index.mjs', 'utf8');
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', 'const assets = ' + JSON.stringify(Object.fromEntries(entries)) + ';\n' + source);
