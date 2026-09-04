# Collective Brain

**A shared memory system for teams that connects the files they already create so AI can find and reuse what the organization already knows.**

Keep working in PowerPoint, Word, Excel, PDFs, OneDrive, SharePoint, or Box. Collective Brain turns those existing files and folders into connected, permission-aware institutional memory that an AI assistant can search and reason over.

> **No separate knowledge app for employees. No manual wiki upkeep. No need to know which file contains the answer.**

Collective Brain is for teams whose useful knowledge already exists — but is scattered across folders, people, revisions, old decks, procedures, examples, and project history.

If you know tools like Obsidian, one way to think about Collective Brain is **shared Obsidian-style memory without requiring everyone to use Obsidian**. But you do not need to know or use Obsidian to understand or adopt this project.

Engineering is the first implementation domain. The core architecture is intentionally domain-agnostic.

## The problem

Most teams do not lack knowledge. They lack **shared memory**.

A teammate creates a useful deck, decision, lesson learned, procedure, example, or analysis and saves it in the normal shared drive. Weeks later, someone else has the same question and either recreates the work or asks around because they do not know the original artifact exists.

Without Collective Brain:

```text
Employee A creates useful work
        ↓
saves it to the normal shared folder
        ↓
time passes
        ↓
Employee B has no idea it exists
```

With Collective Brain:

```text
Employee A creates useful work
        ↓
saves it to the shared Brain folder
        ↓
Collective Brain indexes + connects it
        ↓
Employee B asks the AI a normal question
        ↓
the AI finds relevant prior work, relationships,
revisions, decisions, examples, and provenance
```

The goal is simple:

> **Let teams benefit from what the organization already knows without forcing employees to adopt another knowledge-management application.**

## Who this is for

Collective Brain is a good fit for:

- teams using Claude or another AI assistant plus shared company storage
- teams with important context trapped in files, folders, and individual memory
- engineering, manufacturing, quality, product, consulting, operations, and other knowledge-heavy groups
- organizations that do not have a shared second-brain system today
- teams that want connected institutional memory without maintaining a wiki or shared Obsidian vault
- restrictive environments where employees may only have their AI assistant plus OneDrive/SharePoint or Box
- multiple teams that need shared knowledge while preserving source permissions

A normal employee should need only:

- an AI assistant
- access to the team's shared cloud folder
- the normal files and tools they already use

They should **not** need GitHub, Obsidian, a database, CLI tools, browser extensions, a local agent, or a separate knowledge-base application.

## What Collective Brain is not

Collective Brain is not:

- a replacement for OneDrive, SharePoint, or Box
- another wiki employees must manually maintain
- a requirement to adopt Obsidian
- an autonomous agent that silently edits employee work
- a permission bypass
- a source of truth that automatically outranks controlled company documentation
- a model-specific knowledge silo

The organization owns the knowledge. AI clients consume it.

## Product model

Collective Brain has three main parts:

- **Collective Brain** — the shared institutional-memory system
- **Brain Connector** — connects approved shared storage to the Brain while preserving permissions, provenance, revisions, freshness, and relationships
- **AI Skill / behavior layer** — teaches the AI when and how to use the Brain, cite evidence, interpret authority, and propose new knowledge safely

The employee experience should feel like:

> Connect to the team Brain → select the shared folder → work normally → ask questions normally.

## Quick start

Requirements:

- Node.js 20+
- Git

```bash
git clone https://github.com/BuiltByLegacy/Collective-Brain.git
cd Collective-Brain
npm test
npm run poc
```

The local POC uses synthetic data only. It proves the Employee X → Employee Y institutional-memory loop, authority handling, provenance, permission filtering, relationship context, and governed AI knowledge contribution.

## Try it with your team

Collective Brain now includes a reusable pilot package under `examples/pilot/`.

Start with:

- `examples/pilot/README.md` — pilot instructions
- `examples/pilot/SCORECARD.md` — reusable evaluation scorecard
- `examples/pilot/PILOT_CONTENT_PLAN.md` — safe synthetic test content
- `examples/pilot/CLAUDE_VALIDATION_PROMPT.md` — operator prompt for a real-folder test

Recommended progression:

### 1. Local proof

Run the synthetic test suite and inspect the architecture.

### 2. Real-folder team pilot

Use a real OneDrive/SharePoint or Box folder with synthetic or non-sensitive pilot content. Test Create Brain, Join Existing Brain, retrieval without filename hints, revisions, permissions, freshness, tombstones, and advisory-only behavior.

### 3. Production-candidate evaluation

Only after a successful pilot, validate real identity/ACL behavior, hosted integration, governance, auditability, security controls, and production deployment in your organization's own environment.

See `docs/ADOPTING_COLLECTIVE_BRAIN.md` for the full adoption guide.

## The Brain is folder-rooted

A Collective Brain is anchored to a selected shared cloud folder.

Its identity is based on the cloud provider plus the provider-native folder/root ID — not the human-readable folder name. Renaming the folder does not create a new Brain if the provider preserves that native ID.

Content outside the selected root is not part of that Brain. Source permissions remain authoritative.

### Employee A — Create Brain

1. Open the AI assistant and connect Collective Brain.
2. Choose **Create Brain**.
3. Choose OneDrive/SharePoint or Box.
4. Create or select the shared team folder.
5. Confirm the folder.
6. Collective Brain records the provider-native root identity.
7. Share the folder using normal company controls.
8. Keep working normally.

### Employee B — Join Existing Brain

1. Receive normal source access to the existing Brain folder.
2. Connect Collective Brain.
3. Choose **Join Existing Brain**.
4. Select the same provider and exact shared folder.
5. Collective Brain resolves the existing workspace.
6. Ask normal work questions.

Joining a Brain does **not** grant access to source content. Employees can retrieve only what the underlying storage system already permits.

## Example questions

Employees should not need special syntax.

- “What guidance do we already have for this?”
- “Has anyone documented how we handle this situation?”
- “Why did we make this decision?”
- “Find me an example similar to what I’m working on.”
- “What has the team learned about this?”
- “Is anything newer than this guidance?”
- “What sources are you using?”
- “Show me related work.”

Explicit Brain actions can also include:

- “Search the Brain for …”
- “Show me the source.”
- “Check whether this has been superseded.”
- “Add what we just learned to the Brain.”

The last action creates a **pending knowledge proposal**. AI-generated knowledge does not become authoritative automatically.

## Core capabilities

1. **Shared knowledge ingestion** — ingest approved shared-folder content and extract searchable text/metadata.
2. **Retrieval without filename knowledge** — find useful prior work using normal questions.
3. **Relationship graph** — connect artifacts, concepts, decisions, people, programs, procedures, revisions, lessons learned, and evidence.
4. **Authority and trust** — distinguish controlled guidance, decisions, examples, training, working material, and AI inference.
5. **Permission-aware retrieval** — unauthorized information is excluded before model context.
6. **Provenance** — preserve source artifact, revision/version, location, and relationship context where available.
7. **Snapshot freshness** — record when evidence was read and refresh or warn when stale evidence matters.
8. **Advisory-only behavior** — employee-owned source files are read-only by default.
9. **Human-governed contribution** — AI-created reusable knowledge begins as pending review.
10. **AI-agnostic architecture** — Claude is the first client, not the owner of the Brain.

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
 Retrieval   Relationship Graph
      |         |
      +----+----+
           v
Permissions + authority + revision policy
           |
           v
 Collective Brain tool contract
           |
           v
      AI assistant
           |
           v
        Employee
```

## Security and trust model

Collective Brain is designed around non-negotiable rules:

- source ACLs are authoritative
- permission filtering happens before model context
- joining a Brain never broadens source permissions
- source-owned files are read-only by default
- AI-generated knowledge is non-authoritative until human promotion
- evidence carries revision/version/provenance and freshness context
- stale or conflicting evidence is surfaced instead of silently blended
- restricted titles, snippets, counts, and graph relationships must not leak
- licensed or controlled content requires organization-approved handling

## Current maturity

Collective Brain is currently **pilot-stage open source**, not a finished production SaaS.

### Proven in automated/synthetic tests

- Employee X → Employee Y retrieval without filename hints
- folder-root workspace identity
- permission pre-filtering
- authority/revision behavior
- relationship traversal
- pending-review AI contributions
- Create Brain / Join Existing Brain product logic
- advisory-only source boundaries
- snapshot freshness behavior

### Requires environment-specific live validation

- production OneDrive/SharePoint behavior
- production Box behavior
- real identity/ACL revocation behavior
- hosted AI integration in the target environment
- real shared-folder Employee X → Employee Y handoff

Do not treat synthetic validation as proof of production readiness in your organization.

## Open source + commercial adoption

Collective Brain is open source under the **Apache License 2.0**. Teams are free to adopt, modify, and deploy it themselves under that license.

The project is maintained by **Lemery**. Organizations that want help can engage the maintainers for work such as:

- pilot design and rollout
- OneDrive/SharePoint or Box integration
- identity and permission mapping
- governance and authority-model design
- security and trust validation
- custom workflows and domain schemas
- AI-assistant integration
- employee onboarding and training
- production hardening and deployment support

The open-source project is the foundation; implementation and organizational adoption can be tailored to each team's environment.

## Multi-team direction

A company can eventually have multiple connected Brains rather than one unrestricted knowledge pool:

```text
Company Collective Brain
├── Engineering Brain
├── Manufacturing Brain
├── Quality Brain
├── Program A Brain
└── Program B Brain
```

Cross-Brain relationships should only be visible where the requesting employee's source permissions allow them.

## Repository map

- `src/` — Brain, connector, policy, onboarding, and hosted tool logic
- `tests/` — automated institutional-memory and safety coverage
- `data/corpus.json` — synthetic proof corpus
- `scripts/run-poc.mjs` — repeatable synthetic proof runner
- `skills/claude/SKILL_SPEC.md` — Claude behavior contract
- `docs/ADOPTING_COLLECTIVE_BRAIN.md` — adopter guide
- `examples/pilot/` — reusable pilot package
- `.github/ISSUE_TEMPLATE/` — bug and adopter feedback intake
- `CONTRIBUTING.md` — contribution guidelines
- `LICENSE` — Apache License 2.0

## Contributing and feedback

Contributions are welcome. Start with `CONTRIBUTING.md` and existing GitHub issues.

If you test Collective Brain with a team:

- use the **Adopter feedback** issue template for pilot lessons and usability friction
- use the **Bug report** template for reproducible defects
- never include proprietary, regulated, customer, or confidential information in public issues

## License

Licensed under the **Apache License 2.0**. See `LICENSE`.

## Guiding principle

**The brain belongs to the organization. AI models are clients of the brain, not the source of truth.**
