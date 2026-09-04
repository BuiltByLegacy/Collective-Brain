# Architecture

## System goal

Collective Brain converts ordinary team artifacts into permission-aware, provenance-preserving institutional memory that AI clients can query safely.

## Product constraint: low-access enterprises

Collective Brain must be deployable in companies where an employee may have access to little more than:
- Claude,
- OneDrive / SharePoint,
- Box.

The employee must not need GitHub, a local development environment, a database client, admin rights, browser extensions, or a separate knowledge-authoring application to contribute or benefit.

The normal contribution workflow is therefore **save work where the company already saves work**. Collective Brain indexes approved folders behind the scenes. Claude is the conversational interface.

Two deployment modes are first-class:

### Managed Brain mode
A centrally hosted Brain service performs indexing, policy enforcement, graph traversal, and Claude tool access. This is preferred when IT can approve a service integration.

### Constrained / folder-native mode
When integrations are limited, an approved automation/service account periodically reads designated OneDrive/SharePoint or Box folders, writes only Brain-owned index/metadata artifacts to an approved Brain folder, and exposes a narrow read/query interface to Claude. Employees still need only Claude and the cloud folder.

No design may assume every employee can install software or connect their own OAuth application.

## Logical components

### 1. Source connectors
Connect approved repositories such as SharePoint/OneDrive and Box first; additional sources can follow.

Responsibilities:
- enumerate permitted artifacts,
- preserve source IDs and revisions,
- preserve ACL/security metadata,
- detect adds/changes/deletes,
- avoid modifying originals,
- support read-only operation,
- expose connector health and last-sync timestamps.

The connector contract is source-neutral. OneDrive/SharePoint and Box implementations must normalize into the same artifact model.

### 2. Ingestion
Extract text and structure from artifacts.

Initial target formats:
- PPTX
- DOCX
- PDF
- XLSX
- Markdown/text

Normalized output includes source locations such as slide, page, heading, sheet, cell range, or file section where possible. Content hashes make stale-index detection possible without changing source files.

### 3. Knowledge model
Represent artifacts and reusable concepts separately.

Core node categories:
- Artifact
- ArtifactRevision
- KnowledgeConcept
- Decision
- RequirementReference
- Procedure
- Exemplar
- LessonLearned
- Program
- Team
- Person/Role
- Evidence

### 4. Semantic/lexical retrieval
Find candidate evidence based on meaning and exact terminology.

V0 intentionally uses a lightweight deterministic local retrieval implementation. Production infrastructure is deferred until the proof establishes real requirements.

### 5. Graphify relationship layer
Map typed relationships among artifacts, concepts, decisions, procedures, standards metadata, programs, people/roles, and evidence.

Graph traversal complements semantic retrieval. It must not independently determine authority.

### 6. Policy layer
Apply deterministic checks for:
- identity and permissions,
- authority level,
- revision/supersession,
- source freshness,
- conflict status,
- citation completeness.

### 7. Collective Brain service/API
Expose stable tools to AI clients:
- `brain_search`
- `brain_get_evidence`
- `brain_find_related`
- `brain_find_path`
- `brain_resolve_current`
- `brain_compare_authority`
- `brain_find_conflicts`
- `brain_propose_knowledge`

Tool outputs are already permission-filtered and source-grounded before reaching Claude.

### 8. Claude client adapter / skill
Claude is the first client and should be usable without employees opening another application. The adapter orchestrates Brain tools and presents sourced answers without embedding Claude-specific assumptions into the knowledge layer.

## Query pipeline

```text
Employee question in Claude
      |
      v
Identity + entitlement context
      |
      v
Collective Brain query
      |
      +-------------------+
      |                   |
      v                   v
Semantic/lexical      Graphify traversal
retrieval             expansion
      |                   |
      +---------+---------+
                v
      Permission pre-filter
                |
                v
 Authority/revision/conflict ranking
                |
                v
         Evidence bundle
                |
                v
              Claude
                |
                v
 Answer + provenance + authority label
```

## Contribution pipeline

```text
Employee creates ordinary work
(PowerPoint / Word / Excel / PDF)
        |
        v
OneDrive / SharePoint / Box
        |
        v
Read-only source connector
        |
        v
Normalize + index + Graphify
        |
        v
Institutional memory becomes queryable
```

A separate wiki or Obsidian-style authoring step is not required.

## Security invariant

Unauthorized information must not reach model context. Filtering only after generation is insufficient.

This includes preventing leakage through:
- file titles,
- snippets,
- graph neighbors,
- inferred program names,
- counts,
- relationship paths,
- embeddings/search candidates returned to the model.

Cloud-source ACLs remain authoritative. Collective Brain may further restrict access but must never broaden it.

## Trust invariant

Every retrievable knowledge item must carry enough metadata to answer:
- Where did this come from?
- Which revision is it?
- Who/what approved it?
- What authority class does it have?
- Has it been superseded?
- Is the relationship explicit, inferred, or human-approved?

## Licensed standards

Collective Brain must not assume permission to copy licensed standards into a new datastore. The model supports standard-reference metadata and links/pointers to an organization's authorized licensed source. Any deeper indexing must be explicitly allowed by the applicable license and company policy.

## V0 deployment

V0 runs using synthetic data and Node.js only. It proves the institutional-memory contract without requiring enterprise SSO, production OneDrive/Box access, a vector database, or a user-facing web application.

## Enterprise sequence

1. Prove Employee X -> Employee Y using synthetic data.
2. Add read-only OneDrive/SharePoint connector.
3. Add read-only Box connector.
4. Map source ACLs to Brain entitlements.
5. Add incremental sync, tombstones, stale-index detection, and sync health.
6. Package the Claude skill/tool connection so ordinary employees need only Claude.
7. Add human review and governance workflows using existing company systems where possible.
8. Expand to other teams and AI clients only after the trust model is proven.
