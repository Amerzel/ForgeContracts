import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listSchemas, validate } from '../src/validate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

const fixtureFiles = readdirSync(FIXTURES_DIR)
  .filter(f => f.endsWith('.example.json'))
  .sort();
const availableSchemas = new Set(listSchemas());

for (const file of fixtureFiles) {
  const schemaName = file.replace('.example.json', '');
  if (!availableSchemas.has(schemaName)) {
    throw new Error(`Missing schema for fixture: ${file}`);
  }
  const content = JSON.parse(readFileSync(join(FIXTURES_DIR, file), 'utf-8'));
  const result = validate(schemaName, content);
  if (!result.valid) {
    throw new Error(`${file} failed validation:\n${result.errors.join('\n')}`);
  }
}

console.log(`Smoke OK: validated ${fixtureFiles.length} fixtures.`);
