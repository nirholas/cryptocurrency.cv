#!/usr/bin/env node
/**
 * Patch Next.js resolve-routes to treat loopback-host middleware rewrites as
 * internal.
 *
 * In self-hosted / standalone mode, Node-runtime proxy (middleware) rewrites
 * carry an absolute URL whose host is always "localhost", while initUrl is
 * built from the bind hostname (0.0.0.0, 127.0.0.1). The origin comparison in
 * getRelativeURL() therefore never matches, Next treats the rewrite as an
 * external URL, self-proxies, and next-intl's default-locale cleanup turns the
 * round-trip into an infinite 307 redirect loop (vercel/next.js#91844).
 *
 * A rewrite or redirect targeting a loopback host can only mean "this same
 * server", so relativize it to path + query + hash.
 *
 * Lives in project root so .vercelignore (which strips scripts/*) can't remove
 * it. Runs from postinstall, before `next build`, so the standalone output
 * carries the patched file.
 */

const fs = require('fs');
const path = require('path');

const FILE = 'node_modules/next/dist/server/lib/router-utils/resolve-routes.js';
const GUARD = '__loopbackRelativize';

const HELPER = `function ${GUARD}(value, fallback){try{const u=new URL(value);if(['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(u.hostname)){return u.pathname+u.search+u.hash;}}catch(e){}return fallback;}\n`;

const filePath = path.resolve(__dirname, FILE);
if (!fs.existsSync(filePath)) {
  console.log('[patch-next-mw] resolve-routes.js not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf-8');

if (content.includes(GUARD)) {
  console.log('[patch-next-mw] already patched');
  process.exit(0);
}

const rewriteLine =
  "const destination = (0, _relativizeurl.getRelativeURL)(value, initUrl);";
const redirectLine =
  "const rel = (0, _relativizeurl.getRelativeURL)(value, initUrl);";

if (!content.includes(rewriteLine) || !content.includes(redirectLine)) {
  console.error('[patch-next-mw] expected code not found — Next.js version changed, re-verify vercel/next.js#91844 before removing this patch');
  process.exit(1);
}

content = content.replace(
  rewriteLine,
  `const destination = ${GUARD}(value, (0, _relativizeurl.getRelativeURL)(value, initUrl));`
);
content = content.replace(
  redirectLine,
  `const rel = ${GUARD}(value, (0, _relativizeurl.getRelativeURL)(value, initUrl));`
);

// Inject the helper after the "use strict" prologue.
content = content.replace('"use strict";', '"use strict";\n' + HELPER);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('[patch-next-mw] patched resolve-routes.js (loopback middleware rewrites now internal)');
