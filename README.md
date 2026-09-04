# Collective Brain

**AI-native institutional memory for teams.**

Collective Brain combines shared knowledge storage, semantic retrieval, Graphify-style relationship mapping, and AI access so every employee can contribute to—and benefit from—the organization's accumulated knowledge.

Engineering is the first implementation domain, but the platform is intentionally domain-agnostic.

## Product thesis

Teams already create valuable knowledge in PowerPoint, Word, Excel, PDFs, procedures, seed parts, lessons learned, review decks, and working notes. That knowledge is usually fragmented across folders and people. Collective Brain turns those existing artifacts into reusable institutional memory without requiring employees to maintain a separate wiki.

The initial proof is simple:

> Employee X saves a synthetic engineering seed-part deck. Two weeks later Employee Y starts a separate Claude session, asks a related question, and receives the correct answer with source, revision, authority level, and relationship context.

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
Shared Cloud Storage
  PowerPoint / Word / Excel / PDF / notes / approved metadata
                |
                v
          Ingestion Layer
      extract / normalize / chunk
                |
      +---------+----------+
      |                    |
      v                    v
Semantic Index        Relationship Graph
"what is relevant?"   "how is it connected?"
      |                    |
      +---------+----------+
                v
       Trust + Permission Layer
                |
                v
          Collective Brain API
                |
                v
          Claude Skill / AI
                |
                v
           Employee question
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

## Knowledge lifecycle

```text
Artifact or conversation
        |
        v
   Extract / discover
        |
        v
   Proposed knowledge
        |
        v
     Human review
        |
        v
 Approved / rejected
        |
        v
 Search + graph update
```

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

## Repository structure

```text
/docs                 Product, architecture, governance, and schemas
/brain                Synthetic POC knowledge corpus
/graph                Relationship model and Graphify integration
/ingestion            Artifact extraction and normalization
/retrieval            Semantic and hybrid retrieval
/skills/claude        Claude skill specification and prompts
/tests                End-to-end institutional-memory tests
```

## Roadmap

### P0 — Prove shared memory
Build the synthetic Employee X → Employee Y end-to-end proof.

### P1 — Make it trustworthy
Authority, provenance, revision handling, conflict detection, permissions, audit trail, and human promotion workflow.

### P2 — Connect enterprise storage
Approved SharePoint/OneDrive or equivalent ingestion, incremental sync, identity, and ACL mapping.

### P3 — Scale across teams
Multiple domains, expert discovery, aging knowledge, contradiction detection, graph exploration, administration, and additional AI clients.

## Non-goals for V0

- Building a full Obsidian replacement UI
- Ingesting confidential company data
- Letting AI directly overwrite controlled engineering requirements
- Replacing PLM/PDM/document-control systems
- Reproducing licensed standards outside their permitted access controls
- Building a large autonomous multi-agent platform before the core memory handoff works

## Guiding principle

**The brain belongs to the organization. AI models are clients of the brain, not the source of truth.**
