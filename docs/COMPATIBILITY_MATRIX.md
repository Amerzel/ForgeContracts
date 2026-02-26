# Compatibility Matrix

Which Forge tools consume which `@forge/contracts` schemas, and at which versions.

## Schema → Tool Matrix

| Schema | Version | Producer(s) | Consumer(s) |
|--------|---------|-------------|-------------|
| `game_design.v1` | v1 | Crucible | Director, EntityArchitect, QuestForge, TerrainComposer, EncounterComposer |
| `zone.v1` | v1 | Director | EntityArchitect, QuestForge, TerrainComposer, EncounterComposer |
| `level_intent.v1` | v1 | Director | TerrainComposer |
| `resolved_map.v1` | v1 | TerrainComposer | EncounterComposer, Engine Exports (Godot/Unity/Phaser) |
| `terrain_pack.v1` | v1 | AssetGenerator | TerrainComposer |
| `asset_requirements.v1` | v1 | TerrainComposer | AssetGenerator |
| `entity_catalog.v1` | v1 | EntityArchitect | EncounterComposer, Director |
| `quest_catalog.v1` | v1 | QuestForge | EncounterComposer, Director |
| `populated_level.v1` | v1 | EncounterComposer | PlaytestSim (future) |
| `encounter_change_set.v1` | v1 | EncounterComposer | Director |
| `material_registry.v1` | v1 | Crucible | TerrainComposer, AssetGenerator |
| `validation_report.v1` | v1 | TerrainComposer | Director, CI pipelines |
| `remediation_recipe.v1` | v1 | TerrainComposer | Director, TerrainComposer (auto-fix) |
| `pack_completeness.v1` | v1 | AssetGenerator | TerrainComposer, Director |

## Tool → Schema Matrix

| Tool | Produces | Consumes |
|------|----------|----------|
| **Crucible** | `game_design.v1`, `material_registry.v1` | — |
| **Director** | `zone.v1`, `level_intent.v1` | `game_design.v1`, `encounter_change_set.v1`, `entity_catalog.v1`, `quest_catalog.v1`, `validation_report.v1`, `remediation_recipe.v1`, `pack_completeness.v1` |
| **TerrainComposer** | `resolved_map.v1`, `asset_requirements.v1`, `validation_report.v1`, `remediation_recipe.v1` | `game_design.v1`, `zone.v1`, `level_intent.v1`, `terrain_pack.v1`, `material_registry.v1`, `pack_completeness.v1` |
| **AssetGenerator** | `terrain_pack.v1`, `pack_completeness.v1` | `asset_requirements.v1`, `material_registry.v1` |
| **EntityArchitect** | `entity_catalog.v1` | `game_design.v1`, `zone.v1` |
| **QuestForge** | `quest_catalog.v1` | `game_design.v1`, `zone.v1` |
| **EncounterComposer** | `populated_level.v1`, `encounter_change_set.v1` | `game_design.v1`, `zone.v1`, `resolved_map.v1`, `entity_catalog.v1`, `quest_catalog.v1` |

## Version Policy

- All schemas follow `{name}.v{major}` naming (e.g., `resolved_map.v1`).
- Breaking changes require a new major version (`v2`); the old version remains available until all consumers migrate.
- Each document self-identifies via a `"schema"` field whose value matches the schema name (e.g., `"schema": "resolved_map.v1"`).

## Migration Workflow

When a schema needs a breaking change, use the schema evolution tooling:

### 1. Bump — Create a new version

```bash
node scripts/schema-bump.js resolved_map v1 v2
```

This copies the v1 schema to v2, updating `$id`, `title`, and the `schema` const field. Edit the new file to apply your changes, then create a matching fixture.

### 2. Diff — Review what changed

```bash
node scripts/schema-diff.js resolved_map v1 v2
```

Shows added/removed properties, type changes, and new required fields. Classifies the change as **ADDITIVE** (safe) or **BREAKING**.

### 3. Compat Check — Validate backward compatibility

```bash
node scripts/schema-compat-check.js resolved_map v1 v2
```

Validates that v1 fixtures pass the v2 schema (with the `schema` field patched). Exit code 0 means compatible; exit code 1 means breaking. Use this in CI to gate releases.

### Checklist for a major version bump

1. `node scripts/schema-bump.js <name> v1 v2`
2. Edit the new schema with your changes
3. Create `fixtures/<name>.v2.example.json`
4. `node scripts/schema-diff.js <name> v1 v2` — review the diff
5. `node scripts/schema-compat-check.js <name> v1 v2` — verify compatibility expectations
6. `npm run generate-types` — regenerate TypeScript types
7. `npm test` — ensure all tests pass
8. Update this matrix with the new version row
9. Notify downstream consumers (see Tool → Schema Matrix above)
