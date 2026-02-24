import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const SCHEMAS_DIR = join(import.meta.dirname, '..', 'schemas');
const FIXTURES_DIR = join(import.meta.dirname, '..', 'fixtures');

// Load all schemas
const schemaFiles = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));
const schemas = schemaFiles.map(f => ({
  name: f.replace('.schema.json', ''),
  path: join(SCHEMAS_DIR, f),
  content: JSON.parse(readFileSync(join(SCHEMAS_DIR, f), 'utf-8')),
}));

// Load all fixtures
const fixtureFiles = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.example.json'));
const fixtures = fixtureFiles.map(f => ({
  name: f.replace('.example.json', ''),
  path: join(FIXTURES_DIR, f),
  content: JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf-8')),
}));

// Set up AJV with all schemas registered
const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
addFormats(ajv);
for (const schema of schemas) {
  ajv.addSchema(schema.content);
}

describe('Contract Schema Coverage', () => {
  it('every schema has a matching fixture', () => {
    const fixtureNames = new Set(fixtures.map(f => f.name));
    const missing = schemas.filter(s => !fixtureNames.has(s.name));
    expect(missing.map(s => s.name)).toEqual([]);
  });

  it('every fixture has a matching schema', () => {
    const schemaNames = new Set(schemas.map(s => s.name));
    const orphans = fixtures.filter(f => !schemaNames.has(f.name));
    expect(orphans.map(f => f.name)).toEqual([]);
  });
});

describe('Fixture Validation', () => {
  for (const fixture of fixtures) {
    const schema = schemas.find(s => s.name === fixture.name);
    if (!schema) continue;

    it(`${fixture.name}.example.json validates against ${schema.name}.schema.json`, () => {
      const validate = ajv.getSchema(schema.content.$id);
      if (!validate) {
        throw new Error(`Schema not found for $id: ${schema.content.$id}`);
      }
      const valid = validate(fixture.content);
      if (!valid) {
        const errors = validate.errors
          .map(e => `  ${e.instancePath || '/'}: ${e.message} ${JSON.stringify(e.params)}`)
          .join('\n');
        expect.fail(`Validation failed:\n${errors}`);
      }
    });
  }
});

describe('Schema Structural Checks', () => {
  for (const schema of schemas) {
    it(`${schema.name} has $schema, $id, and title`, () => {
      expect(schema.content.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(schema.content.$id).toContain(schema.name);
      expect(schema.content.title).toBeTruthy();
    });

    it(`${schema.name} requires a "schema" identity field`, () => {
      const required = schema.content.required || [];
      expect(required).toContain('schema');
    });
  }
});
