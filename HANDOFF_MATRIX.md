# Handoff Matrix — ForgeContracts

**Reference:** [VOCABULARY.md](./VOCABULARY.md) · [RFC_SHARED_CONTRACTS.md](../docs/RFC_SHARED_CONTRACTS.md) (Rev 4)

Every row below is a data boundary where one tool's output becomes another tool's input. Internal data flows (within a single tool) are excluded unless they produce an intermediate contract that other tools may eventually consume.

---

## 1. Tool-to-Tool Data Flows

| Producer | Contract Schema | Consumer(s) | Notes |
|----------|----------------|-------------|-------|
| Crucible | `game_design.v1` | Director, EA, QF, TC, EC | Crucible is the **vocabulary authority** for material names and entity categories. All downstream tools inherit Crucible's terminology. |
| Director | `zone.v1` | EA, QF, TC, EC | Zone specification — spatial bounds, biome, narrative context. |
| Director | `level_intent.v1` | TC | High-level intent describing desired terrain composition for a zone. |
| TC | `semantic_map.v1` | TC (internal compile step) | Intermediate representation between intent parsing and tile resolution. Listed here because it is a serializable contract with a schema, even though the only consumer today is TC itself. |
| TC | `resolved_map.v1` | EC, engine exports (Godot/Unity/Phaser) | The primary map artifact. Conforms to VOCABULARY.md rules for dimensions, RLE encoding, tile lookups, and layer names. |
| TC | `asset_requirements.v1` | AG | Declares which terrain tiles TC needs but does not yet have in its pack. |
| AG | `terrain_pack.v1` | TC | Generated tile assets. AG produces; TC consumes via `--pack`. Case field encoding and material sort order must match the shared schema. |
| EA | `entity_catalog.v1` | EC, Director | Canonical entity definitions — stats, categories, sprite refs. EC should validate on import (currently unvalidated). |
| EA | `asset_request.v1` | AG | Requests asset generation for entities that lack sprites or visual resources. |
| QF | `quest_catalog.v1` | EC, Director | Quest definitions — triggers, objectives, reward tables. |
| EC | `populated_level.v1` | PlaytestSim (future) | Fully composed level with terrain + entities + encounters, ready for simulation. |
| EC | `encounter_change_set.v1` | Director | Feedback loop — EC proposes encounter-balance changes that Director can incorporate into subsequent zone iterations. |
| LoreEngine | TBD | EC, Director (future) | **No contracts defined yet.** LoreEngine is referenced via `le:` cross-refs (see VOCABULARY.md §7) but has zero output schemas today. Placeholder for future integration. |

### Abbreviations

| Abbrev | Tool |
|--------|------|
| TC | TerrainComposer |
| EC | EncounterComposer |
| EA | EntityArchitect |
| QF | QuestForge |
| AG | AssetGenerator |

---

## 2. Schema Ownership Rule

> **The producer owns the schema but designs it for consumers.**

When a producer tool and a consumer tool disagree on format (e.g., TC's `size: { w, h }` vs EC's `width`/`height`), the resolution comes from [VOCABULARY.md](./VOCABULARY.md) — not from either tool's preference. The producer is responsible for conforming its output to the shared schema; the consumer is responsible for validating input against that same schema.

- Producers **MUST** emit documents that validate against the authoritative schema in `contracts/schemas/`.
- Consumers **MUST** validate inbound documents against the same schema and reject non-conforming input with a clear error.
- Neither side may silently adapt or normalize structural mismatches — that hides drift.

---

## 3. Crucible as Vocabulary Authority

`game_design.v1` sits at the top of the data flow DAG. It defines:

- **Material names** — the canonical set of terrain material strings (e.g., `"grass"`, `"dirt"`, `"shallow_water"`).
- **Entity categories** — the taxonomy used by EntityArchitect and EncounterComposer.
- **Biome definitions** — referenced by Director zone specs.

All downstream schemas that reference materials, categories, or biome terms **MUST** use Crucible-defined vocabulary. Contract tests should verify that terms appearing in `terrain_pack.v1`, `entity_catalog.v1`, `zone.v1`, and other schemas resolve to entries in the active `game_design.v1`. This catches drift such as TC using `"water_shallow"` when Crucible defines `"shallow_water"`.

---

## 4. Data Flow Diagram

```
                            ┌─────────────┐
                            │   Crucible   │
                            │ game_design  │
                            └──────┬───────┘
                                   │ game_design.v1
                        ┌──────────┼──────────────────────┐
                        ▼          ▼                       ▼
                 ┌────────────┐  ┌──────────────────┐  ┌──────────┐
                 │  Director   │  │ EntityArchitect  │  │QuestForge│
                 │ zone specs  │  │ entity catalog   │  │quest data│
                 └──┬───┬──┬──┘  └──┬────────────┬──┘  └────┬─────┘
                    │   │  │        │            │           │
       zone.v1 ────┘   │  │   entity_catalog.v1 │  quest_catalog.v1
                    │   │  │        │    asset_request.v1    │
       level_intent.v1  │  │        │            │           │
                    │   │  │        │            ▼           │
                    ▼   │  │        │     ┌──────────────┐   │
            ┌───────────────┐  │    │     │AssetGenerator│   │
            │TerrainComposer│  │    │     │  tile gen    │   │
            │  map compose  │  │    │     └──┬───────────┘   │
            └──┬────────┬───┘  │    │        │               │
               │        │     │    │  terrain_pack.v1        │
               │  asset_ │     │    │        │               │
               │  require│     │    │   ┌────┘               │
               │  ments  │     │    │   │                    │
               │  .v1 ───┼─────┼────┼───┘                    │
               │         │     │    │                        │
    resolved_map.v1      │     │    ▼                        │
               │         │     │ ┌───────────────────┐       │
               ├─────────┼─────┼►│EncounterComposer  │◄──────┘
               │         │       │encounter placement│
               │         │       └──┬────────────────┘
               │         │          │            │
               │         │   populated_   encounter_
               │         │   level.v1     change_set.v1
               │         │          │            │
               ▼         │          ▼            ▼
        ┌─────────────┐  │   ┌──────────┐  ┌──────────┐
        │ Godot/Unity │  │   │PlaytestSim│  │ Director │
        │   /Phaser   │  │   │ (future)  │  │(feedback)│
        │   Export    │  │   └──────────┘  └──────────┘
        └─────────────┘  │
                         │
                  ┌──────▼──────┐
                  │ LoreEngine  │
                  │  (future)   │
                  │  TBD → EC,  │
                  │  Director   │
                  └─────────────┘

Legend
──────
  │/▼   data flow direction
  ◄──    consumer receives
  .v1    contract schema version
```

### Simplified Adjacency (text form)

```
Crucible ──► Director ──► TC ──► EC ──► PlaytestSim (future)
                │          │      │
                │          │      └──► Director (feedback via encounter_change_set.v1)
                │          │
                │          └──► Engine Exports (Godot/Unity/Phaser)
                │
                ├──► EA ──► EC
                │     └──► AG
                │
                └──► QF ──► EC

AG ◄──► TC  (terrain_pack.v1 ↔ asset_requirements.v1)

LoreEngine ──► EC, Director (future, no contracts yet)
```
