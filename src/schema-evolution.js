import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, '..', 'schemas');
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

/**
 * Load a schema by base name and version.
 * @param {string} name - e.g. "resolved_map"
 * @param {string} version - e.g. "v1"
 * @returns {object} parsed schema
 */
export function loadSchema(name, version) {
  const file = `${name}.${version}.schema.json`;
  const path = join(SCHEMAS_DIR, file);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Bump a schema's internal references from one version to another.
 * Returns a new schema object with updated $id, title, and schema const.
 * @param {object} schema - source schema
 * @param {string} name - base name
 * @param {string} fromVersion - e.g. "v1"
 * @param {string} toVersion - e.g. "v2"
 * @returns {object} updated schema
 */
export function bumpSchema(schema, name, fromVersion, toVersion) {
  const raw = JSON.stringify(schema, null, 2);
  const fromTag = `${name}.${fromVersion}`;
  const toTag = `${name}.${toVersion}`;
  const updated = JSON.parse(raw);

  updated.$id = schema.$id.replace(fromTag, toTag);
  updated.title = schema.title.replace(fromTag, toTag);
  if (updated.properties?.schema?.const) {
    updated.properties.schema.const = updated.properties.schema.const.replace(fromTag, toTag);
  }

  return updated;
}

/**
 * Collect property-level differences between two schemas.
 * @param {object} oldSchema
 * @param {object} newSchema
 * @returns {{ added: string[], removed: string[], typeChanged: Array<{prop: string, from: string, to: string}>, newRequired: string[] }}
 */
export function diffSchemas(oldSchema, newSchema) {
  const oldProps = Object.keys(oldSchema.properties || {});
  const newProps = Object.keys(newSchema.properties || {});

  const added = newProps.filter(p => !oldProps.includes(p));
  const removed = oldProps.filter(p => !newProps.includes(p));

  const typeChanged = [];
  for (const prop of oldProps) {
    if (!newSchema.properties?.[prop]) continue;
    const oldType = describeType(oldSchema.properties[prop]);
    const newType = describeType(newSchema.properties[prop]);
    if (oldType !== newType) {
      typeChanged.push({ prop, from: oldType, to: newType });
    }
  }

  const oldRequired = new Set(oldSchema.required || []);
  const newRequired = (newSchema.required || []).filter(r => !oldRequired.has(r));

  return { added, removed, typeChanged, newRequired };
}

/** Describe the type of a property definition for comparison. */
function describeType(propDef) {
  if (propDef.const !== undefined) return `const(${JSON.stringify(propDef.const)})`;
  if (propDef.enum) return `enum(${JSON.stringify(propDef.enum)})`;
  if (propDef.$ref) return `$ref(${propDef.$ref})`;
  if (propDef.type === 'array') {
    const itemsType = propDef.items ? describeType(propDef.items) : 'any';
    return `array<${itemsType}>`;
  }
  return propDef.type || 'any';
}

/**
 * Classify a diff as ADDITIVE or BREAKING.
 * @param {{ added: string[], removed: string[], typeChanged: Array, newRequired: string[] }} diff
 * @returns {'ADDITIVE' | 'BREAKING'}
 */
export function classifyDiff(diff) {
  if (diff.removed.length > 0) return 'BREAKING';
  if (diff.typeChanged.length > 0) return 'BREAKING';
  if (diff.newRequired.length > 0) return 'BREAKING';
  return 'ADDITIVE';
}

/**
 * Format a diff as a human-readable summary string.
 */
export function formatDiff(diff, classification) {
  const lines = [];
  lines.push(`Classification: ${classification}`);
  lines.push('');

  if (diff.added.length > 0) {
    lines.push('Added properties:');
    for (const p of diff.added) lines.push(`  + ${p}`);
  }
  if (diff.removed.length > 0) {
    lines.push('Removed properties:');
    for (const p of diff.removed) lines.push(`  - ${p}`);
  }
  if (diff.typeChanged.length > 0) {
    lines.push('Type changes:');
    for (const c of diff.typeChanged) lines.push(`  ~ ${c.prop}: ${c.from} → ${c.to}`);
  }
  if (diff.newRequired.length > 0) {
    lines.push('New required fields:');
    for (const r of diff.newRequired) lines.push(`  ! ${r}`);
  }
  if (diff.added.length === 0 && diff.removed.length === 0 &&
      diff.typeChanged.length === 0 && diff.newRequired.length === 0) {
    lines.push('No property-level changes detected.');
  }

  return lines.join('\n');
}

/**
 * Check backward compatibility: validate old-version fixtures against new schema.
 * @param {string} name - base schema name
 * @param {string} fromVersion - e.g. "v1"
 * @param {string} toVersion - e.g. "v2"
 * @returns {{ compatible: boolean, errors: string[] }}
 */
export function checkCompat(name, fromVersion, toVersion) {
  const fixtureFile = `${name}.${fromVersion}.example.json`;
  const fixtureData = JSON.parse(readFileSync(join(FIXTURES_DIR, fixtureFile), 'utf-8'));

  const newSchema = loadSchema(name, toVersion);

  // Patch the fixture's schema field to match new version so the const check passes
  const patched = structuredClone(fixtureData);
  patched.schema = `${name}.${toVersion}`;

  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);

  // Load all schemas so $ref resolution works
  const allFiles = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));
  for (const f of allFiles) {
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, f), 'utf-8')));
  }

  const validateFn = ajv.getSchema(newSchema.$id);
  if (!validateFn) {
    return { compatible: false, errors: [`Schema not found: ${newSchema.$id}`] };
  }

  const valid = validateFn(patched);
  if (valid) return { compatible: true, errors: [] };

  const errors = validateFn.errors.map(
    e => `${e.instancePath || '/'}: ${e.message}`
  );
  return { compatible: false, errors };
}
