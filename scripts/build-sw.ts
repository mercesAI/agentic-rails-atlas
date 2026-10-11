// Placeholder until Phase 2/5: emits a no-op service worker so `pnpm build` is complete.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
if (!existsSync('dist')) mkdirSync('dist');
writeFileSync('dist/sw.js', '// service worker generated at build time (placeholder)\n');
console.log('build-sw: wrote dist/sw.js (placeholder)');
