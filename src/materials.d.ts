/** Material registry API — type declarations for @forge/contracts/materials */

export interface MaterialEntry {
  id: string;
  category: string;
  movement: "normal" | "slow" | "none";
  walkable: boolean;
  is_path: boolean;
  dev_color: string;
  tags?: string[];
}

export function getAllMaterialIds(): string[];
export function getMaterial(id: string): MaterialEntry | undefined;
export function getAllMaterials(): Record<string, MaterialEntry>;
export function getCategories(): string[];
export function isMaterial(id: string): boolean;
export function getMovement(id: string): "normal" | "slow" | "none";
export function isWalkable(id: string): boolean;
export function isPath(id: string): boolean;
export function getDevColor(id: string): string;
export function getDevColorMap(): Record<string, string>;
export function getPathMaterials(): string[];
export function getMaterialsByMovement(movement: "normal" | "slow" | "none"): string[];
export function getMaterialsByCategory(category: string): string[];
