# Collective Brain

**An open, shared second brain for teams that want Obsidian-like institutional memory without requiring everyone to use Obsidian.**

Keep working in PowerPoint, Word, Excel, PDFs, OneDrive, SharePoint, or Box. Collective Brain connects that existing knowledge so Claude can retrieve what your team already knows — with permissions, provenance, revision awareness, relationships, and human-governed contribution.

> **Keep working in the tools you already use. Collective Brain turns your shared folders into a connected, multi-user second brain that your AI can reason over.**

Collective Brain is designed for teams that have useful knowledge scattered across normal company files and folders, but do not have — or do not want to maintain — a shared Obsidian vault, wiki, or dedicated knowledge-management application.

Engineering is the first implementation domain. The core architecture is intentionally domain-agnostic.

## Why Collective Brain exists

Teams already create valuable knowledge every day:

- PowerPoint decks
- Word documents
- Excel workbooks
- PDFs
- procedures and work instructions
- lessons learned
- design reviews
- project notes
- decisions
- approved examples
- training material
- supplier/manufacturing feedback

The problem is usually not that the knowledge does not exist. The problem is that the next person does not know **where it is, that it exists, how it relates to other work, whether it is current, or whether they are allowed to use it.**

Without Collective Brain:

```text
Employee A creates useful work
        ↓
saves it to the normal shared drive
        ↓
two weeks later Employee B has no idea it exists
```

With Collective Brain:

```text
Employee A creates useful work
        ↓
saves it to the shared Brain folder
        ↓
Collective Brain indexes + connects it
        ↓
Employee B asks Claude a normal question
        ↓
Claude finds relevant prior work, relationships,
revisions, decisions, examples, and provenance
```

The goal is to provide the benefits of a connected second brain **without requiring every employee to learn or maintain another application.**

## Who this is for

Collective Brain is a good fit for:

- teams that use Claude and shared company storage
- teams that want Obsidian-like linked institutional memory but do not use Obsidian
- engineering, manufacturing, quality, product, consulting, operations, and other knowledge-heavy groups
- teams where important context is trapped in files, folders, and individual memory
- organizations with restrictive employee environments where users may have only Claude + OneDrive/SharePoint or Box
- multiple teams that need shared knowledge while preserving access boundaries

A normal employee should need only:

- Claude
- access to the shared OneDrive/SharePoint or Box folder
- the normal files and Office tools they already use

They should **not** need GitHub, Obsidian, a database, CLI tools, browser extensions, a local agent, or a separate knowledge-base application.

## What Collective Brain is not

Collective Brain is not:

- a replacement for OneDrive, SharePoint, or Box
- a requirement that employees adopt Obsidian
- another wiki employees must manually maintain
- an autonomous agent that silently edits employee work
- a source of truth that outranks controlled company documentation
- a permission bypass
- a model-specific knowledge silo

The organization owns the knowledge. AI clients consume it.

## Product model

Collective Brain has three distinct parts:

- **Collective Brain** — the shared institutional-memory system.
- **Brain Connector** — the connection between the AI client and the selected shared OneDrive/SharePoint or Box folder, including sync, retrieval, permissions, provenance, freshness, and Graphify-style relationships.
- **Claude Skill** — the Claude-facing behavior that teaches Claude when and how to use Collective Brain, how to distinguish authority levels, how to cite sources, and how to propose new knowledge safely.

Employees should experience:

> Connect Claude to the team Brain → select the shared folder → work normally → ask Claude questions.

## Quick start — run the synthetic proof

Requirements:

- Node.js 20+
- Git

```bash
git clone https://github.com/BuiltByLegacy/Collective-Brain.git
cd Collective-Brain
npm test
npm run poc
```

The POC uses synthetic data only. It proves the Employee X → Employee Y institutional-memory loop, authority handling, provenance, permission filtering, relationship context, and governed AI knowledge contribution.

No employer/customer/proprietary content is required.

## Adoption paths

### 1. Local POC

Run the synthetic test suite and inspect the architecture. This is the fastest way to understand the model before connecting company storage.

### 2. Team pilot

Use a real shared OneDrive/SharePoint or Box folder with **synthetic or non-sensitive pilot content**. Test Create Brain, Join Existing Brain, retrieval without filename hints, revision updates, permission changes, tombstones, advisory-only behavior, and freshness.

### 3. Real company deployment

Deploy the hosted Brain service, configure approved read-only connectors, connect Claude, and validate identity/ACL behavior in the organization's real environment before using sensitive or controlled information.

See `docs/ADOPTING_COLLECTIVE_BRAIN.md` for the adoption checklist.

## The Brain is folder-rooted

A Collective Brain is anchored to a selected shared cloud folder.

The Brain identity is based on the cloud provider and provider-native folder/root ID, not the human-readable folder name. A folder can therefore be renamed without creating a new Brain as long as the provider preserves its native ID.

Content outside the selected root is not part of that Brain. Source permissions remain authoritative.

### Employee A — Create Brain

1. Open Claude and enable Collective Brain.
2. Choose **Create Brain**.
3. Choose OneDrive/SharePoint or Box.
4. Create or select the shared folder that will hold the Brain.
5. Confirm the selected folder.
6. Collective Brain records the provider-native root identity.
7. Share the folder using the company's normal cloud-storage controls.
8. Work normally and save useful team artifacts under that folder.

Full guide: `docs/EMPLOYEE_A_CREATE_BRAIN.md`.

### Employee B — Join Existing Brain

1. Get normal source access to the existing Brain folder.
2. Open Claude and enable Collective Brain.
3. Choose **Join Existing Brain**.
4. Choose the same provider.
5. Select the same shared Brain folder.
6. Collective Brain resolves the provider + native root ID and joins the existing workspace.
7. Ask Claude normal work questions.

Joining a Brain does **not** grant access to source content. Employee B can retrieve only what the underlying storage system already permits.

Full guide: `docs/EMPLOYEE_B_JOIN_BRAIN.md`.

## Using Collective Brain with Claude

Employees should normally speak to Claude naturally. They should not need special command syntax.

Examples:

- “What guidance do we already have for this?”
- “Has anyone documented how we handle this situation?”
- “Why did we make this decision?”
- “Find me an example similar to what I’m working on.”
- “What has the team learned about this?”
- “Is anything newer than this guidance?”
- “What sources are you using?”
- “Show me related work.”

Employees may also explicitly say:

- “Search the Brain for …”
- “Show me the source.”
- “Check whether this has been superseded.”
- “Add what we just learned to the Brain.”

The last action creates a **pending knowledge proposal**. AI-generated knowledge does not become authoritative automatically.

Full guide: `docs/USING_COLLECTIVE_BRAIN.md`.

## Core capabilities

1. **Shared knowledge ingestion** — ingest approved cloud-folder content and extract searchable text/metadata.
2. **Semantic retrieval** — find relevant knowledge without knowing filenames or exact terminology.
3. **Relationship graph** — map artifacts, concepts, decisions, people, programs, procedures, revisions, lessons learned, and evidence.
4. **Trust and authority** — distinguish controlled requirements, procedures, approved decisions, examples, training, working material, and AI inference.
5. **Permissions-aware retrieval** — unauthorized information is excluded before model context.
6. **Provenance** — answers preserve source artifact, revision/version, location, and relationship context where available.
7. **Snapshot freshness** — evidence records when it was read and whether it should be refreshed before consequential use.
8. **Advisory-only behavior** — source-owned employee files are read-only; AI recommends or proposes rather than silently editing employee work.
9. **Human-governed contribution** — AI-created reusable knowledge begins as pending review.
10. **AI-agnostic architecture** — Claude is the first client; the Brain belongs to the organization.

## Architecture

```text
Shared Brain Folder
OneDrive / SharePoint / Box
           |
           v
      Brain Connector
 read-only sync + identity/ACLs
           |
           v
Normalize + provenance + freshness
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
      Claude Skill
           |
           v
        Employee
```

## Security and trust model

Collective Brain is designed around several non-negotiable rules:

- source ACLs are authoritative
- permission filtering occurs before model context
- joining a Brain never broadens source permissions
- source-owned files are read-only by default
- AI-generated knowledge is non-authoritative until human promotion
- evidence carries revision/version/provenance and freshness context
- stale or conflicting evidence must be surfaced rather than silently blended
- restricted titles, snippets, counts, and graph relationships must not leak to unauthorized users
- licensed or controlled content requires organization-approved handling

See `docs/KNOWLEDGE_MODEL.md`, `docs/LOW_ACCESS_ENTERPRISE.md`, and the trust/governance backlog for details.

## Knowledge authority model

Default precedence:

1. Released requirement / controlled standard metadata
2. Released internal procedure or work instruction
3. Approved decision
4. Approved exemplar / precedent
5. Approved training material
6. Working document
7. Personal/team note
8. AI-generated inference

Lower-authority material must never be silently represented as a higher-authority requirement.

## Current maturity

Collective Brain is currently **pilot-stage open source**, not a finished production SaaS.

### Proven in automated/synthetic tests

- Employee X → Employee Y retrieval without filename hints
- folder-root workspace identity
- permission pre-filtering
- authority/revision behavior
- Graphify-style relationship traversal
- pending-review AI contributions
- Create Brain / Join Existing Brain product logic
- advisory-only source boundaries
- snapshot freshness behavior

### Requires environment-specific live validation

- production OneDrive/SharePoint tenant behavior
- production Box tenant behavior
- real identity/ACL revocation behavior
- hosted Claude integration in each target environment
- real shared-folder Employee X → Employee Y handoff

Do not treat mocked or synthetic validation as proof of production readiness in your organization.

## Multi-team direction

A company can eventually have multiple connected Brains rather than forcing every employee into one unrestricted knowledge pool:

```text
Company Collective Brain
├── Engineering Brain
├── Manufacturing Brain
├── Quality Brain
├── Program A Brain
└── Program B Brain
```

Graph relationships can connect knowledge across those Brains only where the requesting employee's source permissions allow it.

## Repository map

- `src/brain.mjs` — retrieval, graph, authority, provenance, and proposal behavior
- `src/tools.mjs` — vendor-neutral Brain tool contract
- `src/connectors/` — OneDrive/SharePoint + Box connector abstractions/implementations
- `data/corpus.json` — synthetic engineering proof corpus
- `tests/` — automated institutional-memory and safety coverage
- `scripts/run-poc.mjs` — repeatable synthetic proof runner
- `skills/claude/SKILL_SPEC.md` — Claude behavior contract
- `docs/ADOPTING_COLLECTIVE_BRAIN.md` — adoption guide for another team/company
- `docs/EMPLOYEE_A_CREATE_BRAIN.md` — first employee / creator setup
- `docs/EMPLOYEE_B_JOIN_BRAIN.md` — additional employee setup
- `docs/USING_COLLECTIVE_BRAIN.md` — normal employee usage
- `docs/ARCHITECTURE.md` — system architecture
- `docs/KNOWLEDGE_MODEL.md` — authority/knowledge model
- `docs/LOW_ACCESS_ENTERPRISE.md` — constrained-company operating model
- `docs/CONNECTORS.md` — cloud-source connector requirements
- `docs/TOOL_CONTRACT.md` — AI-facing tool contract
- `CONTRIBUTING.md` — contribution guidelines
- `LICENSE` — Apache License 2.0

## Roadmap

### P0 — Prove shared memory
Synthetic Employee X → Employee Y institutional-memory proof.

### P1 — Make the folder-rooted experience real
Production cloud ingestion, incremental sync, identity/ACL mapping, Create/Join Brain, zero-install Claude usage, and real tenant validation.

### P2 — Make it trustworthy at scale
Authority, provenance, freshness, conflict detection, audit trail, human promotion, aging/revalidation, and reviewer ownership.

### P3 — Scale across teams
Multiple Brains/domains, cross-team graph relationships with permission boundaries, expert discovery, graph exploration, administration, and additional AI clients.

## Contributing

Contributions are welcome. Start with `CONTRIBUTING.md` and existing GitHub issues. Please preserve the core product invariants around source permissions, read-only source behavior, provenance, freshness, and human authority.

## License

Licensed under the **Apache License 2.0**. See `LICENSE`.

## Guiding principle

**The brain belongs to the organization. AI models are clients of the brain, not the source of truth.**
