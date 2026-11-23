#!/usr/bin/env node
/**
 * Build guard: the old platform bank account must never reappear as a fallback.
 * Bank details come only from the merchant's configured `bankAccount`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Built from parts so this guard does not match itself.
const forbidden = [
  ['8123', '843076'].join(''),
  ['Nile Technologies', ' Inc'].join(''),
];
const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.vercel', 'coverage']);
const textExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.scss',
  '.yml', '.yaml', '.txt', '.example', '.env', '.sh', '.mjs', '.cjs',
]);

const hits = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(full);
      continue;
    }
    if (entry.name === 'package-lock.json') continue;
    if (!textExtensions.has(path.extname(entry.name)) && !entry.name.startsWith('.env')) continue;
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    if (forbidden.some((value) => content.includes(value))) {
      hits.push(path.relative(root, full));
    }
  }
};

walk(root);

if (hits.length > 0) {
  console.error(`Forbidden hard-coded bank details or platform name found in:\n${hits.map((file) => `  - ${file}`).join('\n')}`);
  console.error('Use the merchant bankAccount from the API; never fall back to a platform account.');
  process.exit(1);
}

console.log('Bank-detail guard passed: no hard-coded platform account found.');
