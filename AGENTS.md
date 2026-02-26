# AGENTS.md

## Project Overview

ForgeContracts (`@forge/contracts`) is a shared JSON Schema contract library for a game-development tool pipeline. It defines every data format exchanged between tools (TerrainComposer, EncounterComposer, EntityArchitect, QuestForge, etc.).

## Build & Test Commands

```bash
npm install               # install dependencies
npm test                  # validate fixtures + contract confidence checks (vitest)
npm run coverage          # tests with coverage thresholds (lines/statements/functions: 90%, branches: 80%)
npm run smoke             # end-to-end validation smoke path
npm run generate-types    # regenerate TypeScript types from schemas
```

## Repository Structure

```
schemas/          # JSON Schema files (draft 2020-12), one per contract
fixtures/         # Golden example fixtures, one per schema (*.example.json)
src/              # Runtime validation helper (validate.js) and materials module
dist/types/       # Generated TypeScript type declarations (do not edit)
scripts/          # Code generation and tooling scripts
tests/            # Vitest test suites
data/             # Static data files
docs/             # RFCs and compatibility matrix
```

## Key Conventions

- **Schema identity**: Every JSON document has a root `schema` field (e.g., `"resolved_map.v1"`).
- **Producer stamp**: Documents include `{ tool, version, generatedAt }`.
- **Dimensions**: Use flat `width`/`height` fields, never nested `size` objects.
- **Coordinates**: `{ x, y }` objects, not arrays.
- **IDs**: `snake_case` for internal, `kebab-case` with tool prefix for cross-tool refs (e.g., `ea:iron-sword`).
- **RLE encoding**: Tile layers use `"tileId:runLength"` format with `:` separator, one string per row.
- **Layer names**: `terrain` (not `base`), `transition`, `clutter`, `object`, `encounter`.
- **Schemas use `additionalProperties: false`** — new fields must be explicitly added to the `properties` object.
- **Fixtures are golden**: Every schema must have a matching fixture; every fixture must validate.
- **Versioning**: Additive optional fields → minor bump. Breaking changes → major bump + new schema version file.
- **Coverage ratchet**: Thresholds only move upward.

## Adding or Modifying a Schema

1. Edit the schema in `schemas/<name>.v<N>.schema.json`.
2. Update (or create) the matching fixture in `fixtures/<name>.v<N>.example.json`.
3. Run `npm run generate-types` to regenerate TypeScript declarations.
4. Run `npm test` to verify fixture validation and structural checks pass.
5. Run `npm run smoke` to verify the end-to-end validation path.

## Reference Documents

- [VOCABULARY.md](./VOCABULARY.md) — Canonical naming and encoding conventions.
- [HANDOFF_MATRIX.md](./HANDOFF_MATRIX.md) — Tool-to-tool data flow diagram and schema ownership rules.
