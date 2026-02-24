import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { listSchemas, validate } from '../src/validate.js';

const SCHEMAS_DIR = join(import.meta.dirname, '..', 'schemas');
const FIXTURES_DIR = join(import.meta.dirname, '..', 'fixtures');

const schemaNames = readdirSync(SCHEMAS_DIR)
  .filter(f => f.endsWith('.schema.json'))
  .map(f => f.replace('.schema.json', ''))
  .sort();

const fixtures = readdirSync(FIXTURES_DIR)
  .filter(f => f.endsWith('.example.json'))
  .map(f => ({
    name: f.replace('.example.json', ''),
    content: JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf-8')),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

describe('Validation API Confidence', () => {
  it('listSchemas is deterministic and complete', () => {
    expect(listSchemas()).toEqual(schemaNames);
  });

  it('validate accepts all golden fixtures', () => {
    for (const fixture of fixtures) {
      const result = validate(fixture.name, fixture.content);
      expect(result.valid, fixture.name).toBe(true);
      expect(result.errors).toEqual([]);
    }
  });

  it('returns explicit error for unknown schema', () => {
    expect(validate('missing_schema.v1', {})).toEqual({
      valid: false,
      errors: ['Unknown schema: "missing_schema.v1"'],
    });
  });

  it('returns validation errors for malformed data', () => {
    const invalid = structuredClone(fixtures[0].content);
    delete invalid.schema;
    const result = validate(fixtures[0].name, invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('keeps seeded resolved_map golden fixture stable', () => {
    const resolvedMap = JSON.parse(
      readFileSync(join(FIXTURES_DIR, 'resolved_map.v1.example.json'), 'utf-8')
    );
    expect(resolvedMap.seed).toBe(42);
    const hash = createHash('sha256')
      .update(JSON.stringify(resolvedMap))
      .digest('hex');
    expect(hash).toBe('bfcbac578ae5105c545f7355961bd72fee518801f94c7d5629c9e858b55da567');
  });
});
