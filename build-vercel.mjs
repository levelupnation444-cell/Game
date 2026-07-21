#!/usr/bin/env node
/**
 * Creates a proper Vercel Build Output API v3 structure from TanStack Start dist output.
 * @see https://vercel.com/docs/build-output-api/v3
 */
import { mkdirSync, cpSync, writeFileSync, rmSync } from 'fs';

const OUT = '.vercel/output';

// Clean existing output
try { rmSync(OUT, { recursive: true, force: true }); } catch {}

// 1. Static assets: dist/client/* → .vercel/output/static/
mkdirSync(`${OUT}/static`, { recursive: true });
cpSync('dist/client', `${OUT}/static`, { recursive: true });
console.log('✓ Copied static assets');

// 2. Server function directory
const FUNC = `${OUT}/functions/index.func`;
mkdirSync(FUNC, { recursive: true });
cpSync('dist/server', FUNC, { recursive: true });
console.log('✓ Copied server files to function directory');

// Tell Node.js that .js files in this directory are ES modules
writeFileSync(`${FUNC}/package.json`, JSON.stringify({ type: 'module' }, null, 2));

// 3. Function entry point - wraps the TanStack Start fetch handler
writeFileSync(`${FUNC}/index.mjs`, `
import server from './server.js';
export default async function handler(request) {
  return server.fetch(request);
}
`);

// 4. Function config - Node.js runtime with streaming support
writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  supportsResponseStreaming: true,
}, null, 2));
console.log('✓ Created Vercel function config');

// 5. Routing config - static files first, then fallback to SSR function
writeFileSync(`${OUT}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    // Let static files be served directly
    { handle: 'filesystem' },
    // Everything else → SSR function
    { src: '/(.*)', dest: '/index' }
  ]
}, null, 2));
console.log('✓ Created routing config');

console.log('\n🚀 Vercel output ready at .vercel/output/');
