#!/usr/bin/env node
import { checkCompat } from '../src/schema-evolution.js';

const [name, fromVersion, toVersion] = process.argv.slice(2);

if (!name || !fromVersion || !toVersion) {
  console.error('Usage: node scripts/schema-compat-check.js <name> <fromVersion> <toVersion>');
  console.error('  e.g. node scripts/schema-compat-check.js resolved_map v1 v2');
  process.exit(1);
}

const result = checkCompat(name, fromVersion, toVersion);

if (result.compatible) {
  console.log(`✓ ${name}.${fromVersion} fixtures are compatible with ${name}.${toVersion} schema`);
  process.exit(0);
} else {
  console.log(`✗ BREAKING: ${name}.${fromVersion} fixtures fail against ${name}.${toVersion} schema`);
  for (const err of result.errors) {
    console.log(`  ${err}`);
  }
  process.exit(1);
}
