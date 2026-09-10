# Shared Graph Workspace

Collective Brain should preserve the strengths of linked-note systems and graph-oriented knowledge tools while expanding them into a governed, organization-wide shared memory.

## Product intent

A user should be able to move through the Brain the way they can move through a strong personal knowledge graph: start from any document, concept, person, decision, lesson, procedure, program, or question and follow meaningful relationships outward.

Unlike a personal vault, Collective Brain must work for many users at once while preserving source permissions, provenance, authority, revision state, and governance.

## What to preserve and expand

### Obsidian-style strengths
- dense bidirectional linking
- backlinks and references
- local neighborhood/context around a note or concept
- graph exploration
- tags/properties as navigational structure
- human-understandable pages for concepts, decisions, people, lessons, and documents
- discoverability through links rather than requiring a perfect folder hierarchy

Collective Brain expands this by making links multi-user, source-backed, permission-aware, typed, revision-aware, and capable of being inferred/proposed from ordinary company work.

### Graphify-style strengths
- automatic extraction of entities and relationships
- typed relationship graph
- relationship/path traversal
- graph-assisted retrieval
- connection of artifacts to concepts, people, decisions, procedures, programs, and evidence

Collective Brain expands this by adding deterministic trust semantics: graph structure helps discovery and explanation but never determines truth or authority by itself.

## Shared organizational graph model

```text
Organization
  └── Brain(s)
       ├── Documents / revisions / source locations
       ├── KnowledgeConcepts
       ├── Decisions
       ├── Lessons / Episodes
       ├── Procedures / Governing References
       ├── People / Roles / Teams
       ├── Programs / Customers / Products / Processes
       └── Evidence / Review / Outcome events
```

Every node and edge carries enough scope/security metadata to decide whether a requesting user is allowed to know it exists.

## Required graph behaviors

### Typed links
Edges are not generic backlinks. They should express meaning such as:
- `SUPPORTED_BY`
- `DERIVED_FROM`
- `REFERENCES`
- `IMPLEMENTS`
- `APPLIES_TO`
- `SUPERSEDES`
- `CONFLICTS_WITH`
- `AUTHORED`
- `REVIEWED`
- `APPROVED`
- `EXPERT_IN`
- `WORKED_ON`
- `DECIDED_BY`
- `CONSTRAINED_BY`
- `RESULTED_IN`

### Bidirectional navigation
Every visible relationship should be navigable from either end, with human-readable inverse labels where useful.

### Backlinks
Every node should expose authorized inbound links and references, grouped by relationship type and source.

### Local graph
Users should be able to inspect the immediate neighborhood around a selected node before expanding farther.

### Path finding
Users should be able to ask questions such as:
- How is this requirement connected to this design decision?
- What lessons influenced this procedure?
- Which people have contributed to this topic?
- What evidence supports this concept?

### Graph + search together
Semantic/lexical retrieval finds candidates. Graph traversal expands and explains them. Neither replaces the other.

## Multi-user and invitation model

A Brain is shared by organization membership and/or explicit invitation policy. Access to the Brain does not automatically grant source access.

Users may participate through:
- organization membership / directory group
- Brain membership
- invited collaborator role where policy permits

The final visible graph is always the intersection of Brain membership/policy and source-native authorization.

## Edge provenance

Every relationship must indicate its origin:
- source-explicit
- deterministic system-derived
- model-inferred
- human-proposed
- human-approved

Inferred relationships must never be presented as equal to source-explicit or human-approved relationships without disclosure.

## Graphify rule

**Graphify maps relationships. Graphify does not decide what is true.**

Authority, revision, applicability, approval, freshness, and source permissions remain governed independently.

## Product experience

The shared graph should support:
- global graph overview within the user's authorized scope
- local graph around any node
- backlinks panel
- related concepts/documents/people/decisions/lessons
- relationship filtering
- graph search
- path explanation
- saved graph views
- role-aware graph density controls
- jump from graph node to archive/document/source evidence
- jump from graph node into Ask with the node as context

## Scale

A company-scale graph cannot render every node simultaneously. The UI should use scoped exploration, clustering, filtering, progressive expansion, and server-side graph queries rather than attempting to draw the entire organization at once.

## Security invariant

Restricted nodes, titles, relationship types, counts, paths, clusters, inferred expertise, and graph topology must not leak through graph queries or rendering.

## Guiding direction

Collective Brain should feel like an organization-wide linked knowledge graph that users did not have to manually curate from scratch.

The system should preserve the ease of linked-note exploration and automatic graph construction, then add enterprise-grade sharing, provenance, trust, permissions, revision control, expertise, decision lineage, and organizational learning.