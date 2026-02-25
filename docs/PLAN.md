# ForgeContracts — Plan

## Current Status

**Version:** v1 (stable)
**Coverage:** 90%+ enforced
**Phase:** Maintenance — all schemas defined and in use

ForgeContracts provides the shared JSON Schema contracts (draft 2020-12) and TypeScript types that define all data formats exchanged between Forge tools. It is the single source of truth for cross-tool data shapes.

## Milestones

### M0: Schema Foundation ✅
- [x] 10 JSON Schemas defined (zone_spec, entity_definition, terrain_output, etc.)
- [x] Golden fixture files for each schema
- [x] AJV validation infrastructure
- [x] TypeScript type generation from schemas
- [x] 90%+ coverage gates enforced

### M1: Adoption ✅
- [x] All tools consuming contracts via dependency
- [x] Schema versioning policy (major bumps for breaking changes only)
- [x] CI validation on schema changes

## Backlog

- Schema evolution tooling (migration scripts for major version bumps)
- Contract documentation generator (auto-generate reference docs from schemas)
- Contract compatibility matrix (which tools consume which schemas at which versions)

## Decisions

- JSON Schema draft 2020-12 for all schemas
- Golden fixtures serve as both test data and documentation
- Major version bumps only for breaking changes; additive changes are minor
- Schemas are the source of truth; TypeScript types are generated, not hand-written
