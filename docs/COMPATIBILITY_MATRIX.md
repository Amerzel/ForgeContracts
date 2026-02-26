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
