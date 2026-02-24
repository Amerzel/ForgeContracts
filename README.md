# @amerzel/gamedev-contracts

Shared JSON Schema contracts for the game development tool pipeline.

## What's Inside

- **10 JSON Schemas** (draft 2020-12) defining every data format exchanged between tools
- **10 Golden fixtures** — valid examples for each schema
- **Validation helper** — pre-configured AJV instance for runtime validation
- **TypeScript types** — generated from schemas for compile-time safety

## Install

```bash
npm install @amerzel/gamedev-contracts --save-dev
```

Requires a `.npmrc` pointing to GitHub Packages:

```
@amerzel:registry=https://npm.pkg.github.com
```

## Usage

### Validate tool output against a contract

```js
import { validate } from '@amerzel/gamedev-contracts/validate';

const result = validate('resolved_map.v1', myResolvedMap);
if (!result.valid) {
  console.error('Contract violation:', result.errors);
}
```

### Import schemas directly

```js
import resolvedMapSchema from '@amerzel/gamedev-contracts/schemas/resolved_map.v1.schema.json' with { type: 'json' };
```

### Use TypeScript types

```ts
import type { ResolvedMapV1 } from '@amerzel/gamedev-contracts/types';

function processMap(map: ResolvedMapV1) { ... }
```

### List available schemas

```js
import { listSchemas } from '@amerzel/gamedev-contracts/validate';

console.log(listSchemas());
// ['asset_requirements.v1', 'encounter_change_set.v1', 'entity_catalog.v1', ...]
```

## Schemas

| Schema | Producer | Consumer(s) |
|--------|----------|-------------|
| `game_design.v1` | Crucible | Director, all tools |
| `zone.v1` | Crucible | Director |
| `level_intent.v1` | Director | TerrainComposer |
| `resolved_map.v1` | TerrainComposer | EncounterComposer |
| `terrain_pack.v1` | TerrainComposer | AssetGenerator |
| `entity_catalog.v1` | EntityArchitect | QuestForge, EncounterComposer |
| `asset_requirements.v1` | EntityArchitect | AssetGenerator |
| `quest_catalog.v1` | QuestForge | EncounterComposer |
| `encounter_change_set.v1` | EncounterComposer | Director |
| `populated_level.v1` | EncounterComposer | Director |

See [HANDOFF_MATRIX.md](HANDOFF_MATRIX.md) for the full data flow diagram.

## Conventions

All contracts follow the rules in [VOCABULARY.md](VOCABULARY.md):
- `schema` field identifies the contract: `"resolved_map.v1"`
- `producer` stamp: `{ tool, version, generatedAt }`
- Dimensions: `width` / `height` (not `size: {w,h}`)
- Coordinates: `{x, y}` (not arrays)
- IDs: `snake_case`

## Development

```bash
npm install
npm test                  # 32 tests — validates all fixtures against schemas
npm run generate-types    # regenerate TypeScript types from schemas
```

## Versioning

Additive changes (new optional fields) → minor bump.
Breaking changes (renamed/removed fields, new required fields) → major bump + new schema version file.
