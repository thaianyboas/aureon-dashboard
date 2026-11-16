// Builds the HACS bundle dist/aureon-dashboard.js from noir/ (AUREON Noir).
// Usage: npm ci && npm run build:noir
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
await build({ entryPoints: ['noir/index.js'], bundle: true, format: 'iife', target: ['chrome100', 'safari15', 'firefox100'], minify: true, legalComments: 'eof', outfile: 'dist/aureon-dashboard.js', logLevel: 'warning' });
const digest = createHash('sha256').update(readFileSync('dist/aureon-dashboard.js')).digest('hex');
writeFileSync('scripts/stable-dashboard.sha256', digest + '\n');
console.log('dist/aureon-dashboard.js', digest);
