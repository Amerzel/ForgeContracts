#!/usr/bin/env node
import { compile } from 'json-schema-to-typescript';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, '..', 'schemas');
const OUT_DIR = join(__dirname, '..', 'dist', 'types');

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));
const exports = [];

for (const file of files) {
  const name = file.replace('.schema.json', '');
  const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf-8'));

  // Convert schema name to PascalCase type name: resolved_map.v1 → ResolvedMapV1
  const typeName = name
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ /g, '');

  const ts = await compile(schema, typeName, {
    bannerComment: `/* Generated from ${file} — do not edit */`,
    additionalProperties: false,
  });

  writeFileSync(join(OUT_DIR, `${name}.d.ts`), ts);
  exports.push(`export type { ${typeName} } from './${name}.js';`);
  console.log(`  ✓ ${name} → ${typeName}`);
}

// Write barrel export
writeFileSync(join(OUT_DIR, 'index.d.ts'), exports.join('\n') + '\n');
console.log(`\n${files.length} types generated in dist/types/`);
