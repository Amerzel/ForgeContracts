#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bumpSchema } from '../src/schema-evolution.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, '..', 'schemas');

const [name, fromVersion, toVersion] = process.argv.slice(2);

if (!name || !fromVersion || !toVersion) {
  console.error('Usage: node scripts/schema-bump.js <name> <fromVersion> <toVersion>');
  console.error('  e.g. node scripts/schema-bump.js resolved_map v1 v2');
  process.exit(1);
}

const srcFile = join(SCHEMAS_DIR, `${name}.${fromVersion}.schema.json`);
const destFile = join(SCHEMAS_DIR, `${name}.${toVersion}.schema.json`);

if (!existsSync(srcFile)) {
  console.error(`Source schema not found: ${srcFile}`);
  process.exit(1);
}

if (existsSync(destFile)) {
  console.error(`Destination already exists: ${destFile}`);
  process.exit(1);
}

const schema = JSON.parse(readFileSync(srcFile, 'utf-8'));
const bumped = bumpSchema(schema, name, fromVersion, toVersion);
writeFileSync(destFile, JSON.stringify(bumped, null, 2) + '\n');
console.log(`✓ Created ${name}.${toVersion}.schema.json`);

console.log('\n📋 Manual steps:');
console.log(`  1. Edit ${name}.${toVersion}.schema.json with your schema changes`);
console.log(`  2. Create fixtures/${name}.${toVersion}.example.json`);
console.log(`  3. Run: npm run generate-types`);
console.log(`  4. Update docs/COMPATIBILITY_MATRIX.md with the new version`);
console.log(`  5. Notify downstream consumers of the new version`);
