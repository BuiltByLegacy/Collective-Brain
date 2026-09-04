# Collective Brain

**A software-less, connected, multi-user second brain for organizations.**

Collective Brain turns the files a team already creates into shared institutional memory that employees can access through Claude. It combines a shared cloud folder, permission-aware retrieval, Graphify-style relationship mapping, provenance, revision awareness, and governed contribution so knowledge created by one employee can safely help another later.

Engineering is the first implementation domain, but the platform is intentionally domain-agnostic.

## Product model

Collective Brain has three distinct parts:

- **Collective Brain** — the shared institutional-memory system.
- **Brain Connector** — the connection between Claude and the selected shared OneDrive/SharePoint or Box folder, including sync, retrieval, permissions, provenance, and Graphify relationships.
- **Claude Skill** — the Claude-facing behavior that teaches Claude when and how to use Collective Brain, how to distinguish authority levels, how to cite sources, and how to propose new knowledge safely.

Employees should not need to understand the implementation details. Their experience should feel like:

> Connect Claude to the team Brain → select the shared folder → work normally → ask Claude questions.

## Product thesis

Teams already create valuable knowledge in PowerPoint, Word, Excel, PDFs, procedures, seed parts, lessons learned, review decks, and working notes. That knowledge is usually fragmented across folders and people. Collective Brain turns those existing artifacts into reusable institutional memory without requiring employees to maintain a separate wiki or knowledge-base application.

The core handoff is simple:

> Employee X saves an engineering seed-part deck. Later Employee Y asks Claude a related question without knowing that deck exists. Collective Brain finds the authorized source, applies relationship and revision context, and Claude answers with provenance and the correct authority classification.

## Designed for constrained companies

A normal employee may have access to only:
- Claude
- OneDrive / SharePoint
- Box
- ordinary Office files

That is enough for the intended employee workflow. Employees do **not** need GitHub, Obsidian, a database, command-line tools, browser extensions, local agents, or a separate knowledge-base application.

Employees contribute by doing their normal work and saving it where the company already stores work. Central infrastructure handles indexing, Graphify relationships, permissions, revision resolution, and Claude tool access.

## The Brain is folder-rooted

A Collective Brain is anchored to a selected cloud folder.

The Brain identity is based on the cloud provider and provider-native folder/root ID, not the human-readable folder name. This means a folder may be renamed without creating a new Brain as long as the provider preserves its native ID.

Content outside the selected root is not part of that Brain. Source permissions always remain authoritative.

### Employee A — Create Brain

1. Open Claude and enable Collective Brain.
2. Choose **Create Brain**.
3. Choose OneDrive/SharePoint or Box.
4. Create or select the shared folder that will hold the Brain.
5. Confirm the selected folder.
6. Collective Brain records the provider-native root identity.
7. Share the folder using the company’s normal cloud-storage controls.
8. Start working normally and save useful team artifacts under that folder.

Full setup guide: `docs/EMPLOYEE_A_CREATE_BRAIN.md`.

### Employee B — Join Existing Brain

1. Make sure the existing Brain folder has been shared with you through the company’s normal OneDrive/SharePoint or Box process.
2. Open Claude and enable Collective Brain.
3. Choose **Join Existing Brain**.
4. Choose the same provider.
5. Select the same shared Brain folder.
6. Collective Brain resolves the provider + native root ID and joins the existing workspace.
7. Start asking Claude normal work questions.

Selecting the same folder does not grant new permissions. Employee B can only retrieve content the underlying source systems already allow Employee B to access.

Full setup guide: `docs/EMPLOYEE_B_JOIN_BRAIN.md`.

## Using Collective Brain with Claude

Employees should normally speak to Claude naturally. They should not need special command syntax.

Examples:

- “What seed-part guidance do we already have for weldments?”
- “Have we documented how we handle datum targets?”
- “Why did we decide to use this PMI approach?”
- “Find me an example similar to this design.”
- “What has the team learned about NX AP242 exports?”
- “Is there anything newer that supersedes this guidance?”
- “What sources are you using?”
- “Show me related work.”

When institutional knowledge can materially improve the answer, the Claude Skill should query Collective Brain automatically.

Employees may also explicitly say:

- “Search the Brain for …”
- “Show me the source.”
- “Check whether this has been superseded.”
- “Add what we just learned to the Brain.”

The final example creates a **pending knowledge proposal**. Claude must not silently turn an inference or conversation into authoritative company guidance.

Full usage guide: `docs/USING_COLLECTIVE_BRAIN.md`.

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
Shared Brain Folder
OneDrive / SharePoint / Box
           |
           v
      Brain Connector
   read-only sync + ACLs
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
      Claude Skill
           |
           v
        Employee
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
- `docs/EMPLOYEE_A_CREATE_BRAIN.md` — first employee / creator setup
- `docs/EMPLOYEE_B_JOIN_BRAIN.md` — additional employee setup
- `docs/USING_COLLECTIVE_BRAIN.md` — normal employee usage guide
- `docs/ARCHITECTURE.md` — system architecture
- `docs/KNOWLEDGE_MODEL.md` — authority/knowledge model
- `docs/LOW_ACCESS_ENTERPRISE.md` — constrained-company operating model
- `docs/CONNECTORS.md` — cloud-source connector requirements
- `docs/TOOL_CONTRACT.md` — AI-facing tool contract
- `docs/V0_STATUS.md` — implemented/deferred boundary

## Roadmap

### P0 — Prove shared memory
Build the synthetic Employee X → Employee Y end-to-end proof.

### P1 — Make the folder-rooted employee experience real
Production OneDrive/SharePoint + Box ingestion, incremental sync, identity, ACL mapping, Create Brain / Join Existing Brain setup, zero-install Claude usage, and real Employee X → Employee Y validation.

### P2 — Make it trustworthy at scale
Authority, provenance, revision handling, conflict detection, permissions, audit trail, human promotion workflow, aging/revalidation, and reviewer ownership.

### P3 — Scale across teams
Multiple domains, expert discovery, contradiction detection, graph exploration, administration, and additional AI clients.

## Guiding principle

**The brain belongs to the organization. AI models are clients of the brain, not the source of truth.**
