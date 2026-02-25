import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, '..', 'schemas');

let _ajv = null;

function getAjv() {
  if (_ajv) return _ajv;
  _ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(_ajv);
  const files = readdirSync(SCHEMAS_DIR)
    .filter(f => f.endsWith('.schema.json'))
    .sort();
  for (const file of files) {
    const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf-8'));
    _ajv.addSchema(schema);
  }
  return _ajv;
}

/**
 * Validate data against a named contract schema.
 * @param {string} schemaName - Schema name, e.g. "resolved_map.v1"
 * @param {unknown} data - The data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validate(schemaName, data) {
  const ajv = getAjv();
  const schemaId = `https://forge-contracts.amerzel.dev/${schemaName}.schema.json`;
  const validateFn = ajv.getSchema(schemaId);
  if (!validateFn) {
    return { valid: false, errors: [`Unknown schema: "${schemaName}"`] };
  }
  const valid = validateFn(data);
  if (valid) return { valid: true, errors: [] };
  const errors = validateFn.errors.map(
    e => `${e.instancePath || '/'}: ${e.message}`
  );
  return { valid: false, errors };
}

/**
 * List all available schema names.
 * @returns {string[]}
 */
export function listSchemas() {
  return readdirSync(SCHEMAS_DIR)
    .filter(f => f.endsWith('.schema.json'))
    .sort()
    .map(f => f.replace('.schema.json', ''));
}
