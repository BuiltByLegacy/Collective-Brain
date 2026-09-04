# Collective Brain

**AI-native shared institutional memory for organizations.**

Collective Brain combines shared cloud knowledge, semantic retrieval, Graphify-style relationship mapping, permission-aware retrieval, provenance, and AI access so knowledge created by one employee can safely help another employee later.

Engineering is the first implementation domain, but the platform is intentionally domain-agnostic.

## Product thesis

Teams already create valuable knowledge in PowerPoint, Word, Excel, PDFs, procedures, seed parts, lessons learned, review decks, and working notes. That knowledge is usually fragmented across folders and people. Collective Brain turns those existing artifacts into reusable institutional memory without requiring employees to maintain a separate wiki.

The initial proof is simple:

> Employee X saves a synthetic engineering seed-part deck. Two weeks later Employee Y starts a separate Claude session, asks a related question, and receives the correct answer with source, revision, authority level, and relationship context.

## Designed for constrained companies

A normal employee may have access to only:
- Claude
- OneDrive / SharePoint
- Box
- ordinary Office files

That is enough for the intended employee workflow. Employees do **not** need GitHub, Obsidian, a database, command-line tools, browser extensions, or a separate knowledge-base application.

Employees contribute by doing their normal work and saving it where the company already stores work. Central infrastructure handles indexing, Graphify relationships, permissions, revision resolution, and Claude tool access.

## Core capabilities

1. **Shared knowledge ingestion** — ingest approved cloud-folder content and extract searchable text/metadata.
2. **Semantic retrieval** — find relevant knowledge even when employees do not know filenames or exact terminology.
3. **Relationship graph** — map artifacts, concepts, decisions, standards, people, programs, procedures, revisions, lessons learned, and evidence.
4. **Trust and authority** — distinguish requirements, released procedures, approved decisions, examples, training, working documents, and AI inference.
5. **Permissions-aware retrieval** — never expose content the requesting employee is not authorized to access.
6. **Provenance** — answers cite the underlying source artifact, section/slide, revision, and relationship chain where possible.
7. **Human-governed contribution** — AI can propose knowledge capture, but authoritative knowledge is promoted through review.
8. **AI-agnostic architecture** — Claude is the first client; the institutional memory belongs to the organization, not the model vendor.

## Architecture

```text
OneDrive / SharePoint / Box
           |
           v
   Read-only connectors
           |
           v
Normalize + provenance
           |
      +----+----+
      |         |
      v         v
 Retrieval   Graphify
      |         |
      +----+----+
           v
 Permissions + authority + revision policy
           |
           v
 Collective Brain tool contract
           |
           v
         Claude
```

## Knowledge authority model

Default precedence:

1. Released requirement / controlled standard metadata
2. Released internal procedure or work instruction
3. Approved engineering decision
4. Approved exemplar / seed part
5. Approved training material
6. Working document
7. Personal/team note
8. AI-generated inference

Lower-authority knowledge must never be silently represented as a higher-authority requirement.

## V0 milestone: Institutional Memory Proof — Employee X → Employee Y

V0 uses synthetic engineering data only.

Acceptance criteria:
- Employee X adds a synthetic seed-part artifact.
- Collective Brain extracts content and metadata.
- Relevant concepts and relationships are represented in the graph.
- Employee Y uses a separate Claude session.
- Claude retrieves the artifact without being told its filename.
- Claude identifies the correct revision and authority level.
- Claude distinguishes company precedent from external-standard requirements.
- Claude cites the supporting artifact/section.
- A restricted artifact is not returned to an unauthorized test identity.
- New AI-derived knowledge is proposed for review rather than silently becoming authoritative.

Run the proof with:

```bash
npm test
npm run poc
```

## Repository map
- `src/brain.mjs` — V0 retrieval, graph, policy, provenance, and proposal behavior
- `src/tools.mjs` — vendor-neutral Brain tool contract
- `src/connectors/contract.mjs` — OneDrive/SharePoint + Box connector interface
- `data/corpus.json` — synthetic engineering proof corpus
- `tests/` — Employee X -> Employee Y acceptance coverage
- `scripts/run-poc.mjs` — repeatable proof runner
- `skills/claude/SKILL_SPEC.md` — Claude behavior contract
- `docs/ARCHITECTURE.md` — system architecture
- `docs/KNOWLEDGE_MODEL.md` — authority/knowledge model
- `docs/LOW_ACCESS_ENTERPRISE.md` — constrained-company operating model
- `docs/CONNECTORS.md` — cloud-source connector requirements
- `docs/TOOL_CONTRACT.md` — AI-facing tool contract
- `docs/V0_STATUS.md` — implemented/deferred boundary

## Roadmap

### P0 — Prove shared memory
Build the synthetic Employee X → Employee Y end-to-end proof.

### P1 — Make it trustworthy
Authority, provenance, revision handling, conflict detection, permissions, audit trail, and human promotion workflow.

### P2 — Connect enterprise storage
Production OneDrive/SharePoint + Box ingestion, incremental sync, identity, ACL mapping, and a Claude-only employee experience.

### P3 — Scale across teams
Multiple domains, expert discovery, aging knowledge, contradiction detection, graph exploration, administration, and additional AI clients.

## Guiding principle

**The brain belongs to the organization. AI models are clients of the brain, not the source of truth.**
