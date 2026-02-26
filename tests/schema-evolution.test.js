import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdtempSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import {
  loadSchema,
  bumpSchema,
  diffSchemas,
  classifyDiff,
  formatDiff,
  checkCompat,
} from '../src/schema-evolution.js';

const SCHEMAS_DIR = join(import.meta.dirname, '..', 'schemas');
const FIXTURES_DIR = join(import.meta.dirname, '..', 'fixtures');
const ROOT = join(import.meta.dirname, '..');

// Use resolved_map.v1 as test subject
const TEST_NAME = 'resolved_map';

describe('bumpSchema', () => {
  it('updates $id, title, and schema const', () => {
    const original = loadSchema(TEST_NAME, 'v1');
    const bumped = bumpSchema(original, TEST_NAME, 'v1', 'v2');

    expect(bumped.$id).toBe('https://forge-contracts.amerzel.dev/resolved_map.v2.schema.json');
    expect(bumped.title).toBe('resolved_map.v2');
    expect(bumped.properties.schema.const).toBe('resolved_map.v2');
  });

  it('preserves all other properties', () => {
    const original = loadSchema(TEST_NAME, 'v1');
    const bumped = bumpSchema(original, TEST_NAME, 'v1', 'v2');

    expect(bumped.description).toBe(original.description);
    expect(bumped.required).toEqual(original.required);
    expect(Object.keys(bumped.properties).length).toBe(Object.keys(original.properties).length);
  });
});

describe('diffSchemas', () => {
  it('detects no changes for identical schemas', () => {
    const schema = loadSchema(TEST_NAME, 'v1');
    const diff = diffSchemas(schema, schema);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.typeChanged).toEqual([]);
    expect(diff.newRequired).toEqual([]);
  });

  it('detects added properties', () => {
    const oldSchema = { properties: { a: { type: 'string' } }, required: ['a'] };
    const newSchema = { properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] };
    const diff = diffSchemas(oldSchema, newSchema);

    expect(diff.added).toEqual(['b']);
    expect(diff.removed).toEqual([]);
  });

  it('detects removed properties', () => {
    const oldSchema = { properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] };
    const newSchema = { properties: { a: { type: 'string' } }, required: ['a'] };
    const diff = diffSchemas(oldSchema, newSchema);

    expect(diff.removed).toEqual(['b']);
  });

  it('detects type changes', () => {
    const oldSchema = { properties: { a: { type: 'string' } } };
    const newSchema = { properties: { a: { type: 'number' } } };
    const diff = diffSchemas(oldSchema, newSchema);

    expect(diff.typeChanged).toEqual([{ prop: 'a', from: 'string', to: 'number' }]);
  });

  it('detects new required fields', () => {
    const oldSchema = { properties: { a: { type: 'string' } }, required: [] };
    const newSchema = { properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['b'] };
    const diff = diffSchemas(oldSchema, newSchema);

    expect(diff.newRequired).toEqual(['b']);
  });
});

describe('classifyDiff', () => {
  it('classifies additive changes as ADDITIVE', () => {
    expect(classifyDiff({ added: ['x'], removed: [], typeChanged: [], newRequired: [] })).toBe('ADDITIVE');
  });

  it('classifies removals as BREAKING', () => {
    expect(classifyDiff({ added: [], removed: ['x'], typeChanged: [], newRequired: [] })).toBe('BREAKING');
  });

  it('classifies type changes as BREAKING', () => {
    expect(classifyDiff({ added: [], removed: [], typeChanged: [{ prop: 'x', from: 'string', to: 'number' }], newRequired: [] })).toBe('BREAKING');
  });

  it('classifies new required fields as BREAKING', () => {
    expect(classifyDiff({ added: [], removed: [], typeChanged: [], newRequired: ['x'] })).toBe('BREAKING');
  });

  it('classifies no changes as ADDITIVE', () => {
    expect(classifyDiff({ added: [], removed: [], typeChanged: [], newRequired: [] })).toBe('ADDITIVE');
  });
});

describe('formatDiff', () => {
  it('includes classification and change details', () => {
    const diff = { added: ['b'], removed: ['c'], typeChanged: [{ prop: 'a', from: 'string', to: 'number' }], newRequired: ['b'] };
    const output = formatDiff(diff, 'BREAKING');

    expect(output).toContain('Classification: BREAKING');
    expect(output).toContain('+ b');
    expect(output).toContain('- c');
    expect(output).toContain('~ a: string → number');
    expect(output).toContain('! b');
  });

  it('reports no changes when diff is empty', () => {
    const diff = { added: [], removed: [], typeChanged: [], newRequired: [] };
    const output = formatDiff(diff, 'ADDITIVE');

    expect(output).toContain('No property-level changes detected.');
  });
});

describe('checkCompat (integration)', () => {
  // Use a temp copy of schemas dir so we don't pollute the real one
  let tmpSchemas;
  let origCheckCompat;

  beforeEach(() => {
    tmpSchemas = mkdtempSync(join(tmpdir(), 'forge-schemas-'));
    cpSync(SCHEMAS_DIR, tmpSchemas, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpSchemas, { recursive: true, force: true });
  });

  // checkCompat reads from the real SCHEMAS_DIR, so we write v2 to temp and call it with a custom helper
  function checkCompatInTmp(name, fromVersion, toVersion) {
    // checkCompat loads from SCHEMAS_DIR internally, so we temporarily write to real dir and clean up immediately
    const v2File = join(SCHEMAS_DIR, `${name}.${toVersion}.schema.json`);
    const tmpV2 = join(tmpSchemas, `${name}.${toVersion}.schema.json`);
    // Copy temp v2 to real dir for checkCompat, then clean up
    cpSync(tmpV2, v2File);
    try {
      return checkCompat(name, fromVersion, toVersion);
    } finally {
      if (existsSync(v2File)) unlinkSync(v2File);
    }
  }

  it('compatible when v2 is identical to v1 (only version refs differ)', () => {
    const original = loadSchema(TEST_NAME, 'v1');
    const bumped = bumpSchema(original, TEST_NAME, 'v1', 'v2');
    writeFileSync(join(tmpSchemas, `${TEST_NAME}.v2.schema.json`), JSON.stringify(bumped, null, 2) + '\n');

    const result = checkCompatInTmp(TEST_NAME, 'v1', 'v2');
    expect(result.compatible).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('incompatible when v2 adds a new required field', () => {
    const original = loadSchema(TEST_NAME, 'v1');
    const bumped = bumpSchema(original, TEST_NAME, 'v1', 'v2');
    bumped.properties.newField = { type: 'string', minLength: 1 };
    bumped.required = [...bumped.required, 'newField'];
    writeFileSync(join(tmpSchemas, `${TEST_NAME}.v2.schema.json`), JSON.stringify(bumped, null, 2) + '\n');

    const result = checkCompatInTmp(TEST_NAME, 'v1', 'v2');
    expect(result.compatible).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('schema-bump.js script', () => {
  const v2File = join(SCHEMAS_DIR, `${TEST_NAME}.v2.schema.json`);

  afterEach(() => {
    if (existsSync(v2File)) unlinkSync(v2File);
  });

  it('creates a bumped schema file', () => {
    if (existsSync(v2File)) unlinkSync(v2File);
    const output = execFileSync('node', ['scripts/schema-bump.js', TEST_NAME, 'v1', 'v2'], { cwd: ROOT, encoding: 'utf-8' });
    expect(output).toContain('Created');
    expect(existsSync(v2File)).toBe(true);

    const created = JSON.parse(readFileSync(v2File, 'utf-8'));
    expect(created.$id).toContain('v2');
    expect(created.properties.schema.const).toBe('resolved_map.v2');
  });

  it('refuses to overwrite an existing schema', () => {
    writeFileSync(v2File, '{}');
    try {
      execFileSync('node', ['scripts/schema-bump.js', TEST_NAME, 'v1', 'v2'], { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' });
      expect.fail('Should have exited with error');
    } catch (e) {
      expect(e.status).not.toBe(0);
    }
  });
});
