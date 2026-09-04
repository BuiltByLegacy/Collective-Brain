# Architecture

## System goal

Collective Brain converts ordinary team artifacts into permission-aware, provenance-preserving institutional memory that AI clients can query safely.

## Logical components

### 1. Source connectors
Connect approved repositories such as SharePoint, OneDrive, Google Drive, file shares, Git, or controlled exports.

Responsibilities:
- enumerate permitted artifacts,
- preserve source IDs and revisions,
- preserve ACL/security metadata,
- detect adds/changes/deletes,
- avoid modifying originals.

### 2. Ingestion
Extract text and structure from artifacts.

Initial target formats:
- PPTX
- DOCX
- PDF
- XLSX
- Markdown/text

Normalized output should include source locations such as slide, page, heading, sheet, or cell range where possible.

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

V0 may use a simple local index. Infrastructure choice is intentionally deferred until the proof establishes retrieval requirements.

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
Expose stable tools to AI clients, for example:
- search
- get artifact
- get source excerpt
- find related
- traverse relationship path
- resolve current revision
- compare authority
- find conflicts
- propose knowledge

### 8. AI client adapter
Claude is the first client. The adapter should orchestrate Brain tools and present sourced answers without embedding vendor-specific assumptions into the knowledge layer.

## Query pipeline

```text
Employee question
      |
      v
Identity + entitlement context
      |
      v
Query understanding
      |
      +-------------------+
      |                   |
      v                   v
Semantic/lexical      Graph traversal
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
            AI client
                |
                v
 Answer + provenance + authority label
```

## Security invariant

Unauthorized information must not reach the model context. Filtering only after generation is insufficient.

This includes preventing leakage through:
- file titles,
- snippets,
- graph neighbors,
- inferred program names,
- counts,
- relationship paths,
- embeddings/search candidates returned to the model.

## Trust invariant

Every retrievable knowledge item must carry enough metadata to answer:
- Where did this come from?
- Which revision is it?
- Who/what approved it?
- What authority class does it have?
- Has it been superseded?
- Is the relationship explicit, inferred, or human-approved?

## V0 deployment

V0 should run locally or in a minimal test environment using synthetic data. It does not require enterprise SSO, production SharePoint access, a production vector database, or a user-facing web application.

## Future enterprise architecture

After V0, likely additions include:
- SharePoint/OneDrive incremental sync,
- corporate identity/SSO integration,
- ACL mapping,
- background indexing jobs,
- durable graph database,
- durable semantic index,
- audit/event log,
- admin/reviewer workflows,
- knowledge aging and revalidation,
- conflict/supersession alerts,
- additional AI clients.
