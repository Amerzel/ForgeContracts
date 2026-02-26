#!/usr/bin/env node
import { loadSchema, diffSchemas, classifyDiff, formatDiff } from '../src/schema-evolution.js';

const [name, fromVersion, toVersion] = process.argv.slice(2);

if (!name || !fromVersion || !toVersion) {
  console.error('Usage: node scripts/schema-diff.js <name> <fromVersion> <toVersion>');
  console.error('  e.g. node scripts/schema-diff.js resolved_map v1 v2');
  process.exit(1);
}

const oldSchema = loadSchema(name, fromVersion);
const newSchema = loadSchema(name, toVersion);

const diff = diffSchemas(oldSchema, newSchema);
const classification = classifyDiff(diff);

console.log(`Schema diff: ${name}.${fromVersion} → ${name}.${toVersion}`);
console.log('─'.repeat(50));
console.log(formatDiff(diff, classification));
