# Collective Brain Tool Contract

The Brain API is vendor-neutral. Claude is the first client.

## Tools
- `brain_search(query, includeSuperseded?, limit?)`
- `brain_get_evidence(query)`
- `brain_find_related(id)`
- `brain_find_path(from, to, maxDepth?)`
- `brain_resolve_current(logicalId)`
- `brain_compare_authority(firstId, secondId)`
- `brain_find_conflicts(id)`
- `brain_propose_knowledge(statement, sources)`

## Output guarantees
Every model-facing result is permission-filtered before construction. Evidence includes safe identity, revision, authority/classification, and source-location metadata. Errors must not leak inaccessible artifact existence or metadata.

## Client rule
Clients should not bypass the Brain service to retrieve raw source data unless explicitly approved for an administrative workflow.
