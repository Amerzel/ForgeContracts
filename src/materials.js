import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, '..', 'data', 'material_registry.v1.json');

let _registry = null;

function getRegistry() {
  if (_registry) return _registry;
  _registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  return _registry;
}

// Normalize material ID to lowercase for case-insensitive lookup
function normalize(id) {
  const lower = id.toLowerCase();
  if (lower in getRegistry().materials) return lower;
  // Try snake_case conversion (e.g. "Water_Deep" → "water_deep")
  const snake = id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  if (snake in getRegistry().materials) return snake;
  return lower;
}

/**
 * Get all material IDs as an array.
 * @returns {string[]}
 */
export function getAllMaterialIds() {
  return Object.keys(getRegistry().materials);
}

/**
 * Get a single material entry by ID.
 * @param {string} id - Material ID (e.g. "grass", "stone_path")
 * @returns {{ displayName: string, category: string, movement: string, path: boolean, devColor: string } | undefined}
 */
export function getMaterial(id) {
  return getRegistry().materials[normalize(id)];
}

/**
 * Get all materials as a Record<string, MaterialEntry>.
 * @returns {Record<string, { displayName: string, category: string, movement: string, path: boolean, devColor: string }>}
 */
export function getAllMaterials() {
  return getRegistry().materials;
}

/**
 * Get all category definitions.
 * @returns {Record<string, { displayName: string, description: string }>}
 */
export function getCategories() {
  return getRegistry().categories;
}

/**
 * Check if a material ID exists in the registry.
 * @param {string} id
 * @returns {boolean}
 */
export function isMaterial(id) {
  return normalize(id) in getRegistry().materials;
}

/**
 * Get the movement classification for a material.
 * @param {string} id
 * @returns {"normal" | "slow" | "none" | undefined}
 */
export function getMovement(id) {
  return getRegistry().materials[normalize(id)]?.movement;
}

/**
 * Check if a material is walkable (movement !== "none").
 * @param {string} id
 * @returns {boolean}
 */
export function isWalkable(id) {
  const m = getRegistry().materials[normalize(id)];
  return m ? m.movement !== 'none' : false;
}

/**
 * Check if a material is a path surface.
 * @param {string} id
 * @returns {boolean}
 */
export function isPath(id) {
  return getRegistry().materials[normalize(id)]?.path === true;
}

/**
 * Get the dev color for a material.
 * @param {string} id
 * @returns {string | undefined} Hex color string (e.g. "#4A7C2E")
 */
export function getDevColor(id) {
  return getRegistry().materials[normalize(id)]?.devColor;
}

/**
 * Build a complete devColor map for all materials.
 * @returns {Record<string, string>} material ID → hex color
 */
export function getDevColorMap() {
  const materials = getRegistry().materials;
  const map = {};
  for (const [id, entry] of Object.entries(materials)) {
    map[id] = entry.devColor;
  }
  return map;
}

/**
 * Get all material IDs that are path surfaces.
 * @returns {string[]}
 */
export function getPathMaterials() {
  return Object.entries(getRegistry().materials)
    .filter(([, m]) => m.path)
    .map(([id]) => id);
}

/**
 * Get material IDs filtered by movement type.
 * @param {"normal" | "slow" | "none"} movement
 * @returns {string[]}
 */
export function getMaterialsByMovement(movement) {
  return Object.entries(getRegistry().materials)
    .filter(([, m]) => m.movement === movement)
    .map(([id]) => id);
}

/**
 * Get material IDs filtered by category.
 * @param {string} category
 * @returns {string[]}
 */
export function getMaterialsByCategory(category) {
  return Object.entries(getRegistry().materials)
    .filter(([, m]) => m.category === category)
    .map(([id]) => id);
}
