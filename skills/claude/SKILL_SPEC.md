# Claude Skill Specification

## Objective

Make Claude a safe client of Collective Brain. Claude should automatically use institutional memory when it can materially improve an answer, while preserving authority, access control, revision, and provenance.

## Required behavior

When an employee asks an organizational knowledge question:

1. Determine whether Collective Brain could materially improve the answer.
2. Query Collective Brain rather than relying only on model memory.
3. Use both content retrieval and relationship context when useful.
4. Apply employee identity/entitlement context before evidence reaches the model.
5. Prefer current, applicable, higher-authority sources.
6. Check for supersession and conflicts.
7. Distinguish requirement vs company practice vs precedent/example vs inference.
8. Cite the source artifact and source location.
9. Say when evidence is incomplete or conflicting.
10. Propose reusable new knowledge for review rather than silently modifying authoritative content.

## Proposed Brain tools

### `brain_search`
Find permission-filtered evidence by semantic/lexical relevance.

Inputs should include:
- query
- requester identity/context
- optional artifact/domain/program filters
- result limit

Returns:
- evidence IDs
- safe metadata
- source locations
- authority class
- revision/current status
- relevance/confidence

### `brain_get_evidence`
Fetch a specific permission-approved source excerpt and provenance record.

### `brain_find_related`
Return permission-filtered graph neighbors and typed relationships.

### `brain_find_path`
Find a safe relationship path between two concepts/artifacts.

### `brain_resolve_current`
Resolve the current applicable revision for a logical artifact within a scope.

### `brain_compare_authority`
Compare candidate evidence using authority, applicability, revision, conflict status, and review status.

### `brain_find_conflicts`
Identify contradictory or superseded guidance around a concept.

### `brain_propose_knowledge`
Create a pending knowledge proposal linked to its supporting evidence.

## Answer contract

A grounded answer should expose, in a user-friendly way:
- the conclusion,
- whether it is a requirement / approved practice / precedent / inference,
- source artifact(s),
- revision(s),
- source location(s),
- conflict or freshness warnings where applicable.

## Example

Employee asks:

> How are we handling datum targets on weldment seed parts?

Expected behavior:
- retrieve the current approved weldment seed-part exemplar,
- traverse its relationship to the relevant datum-target concept and decision,
- verify current revision,
- identify whether the external-standard reference is a requirement source or only contextual metadata,
- answer that the approach is an approved company exemplar unless a higher-authority procedure explicitly requires it,
- cite the supporting slides/sections.

## Safety rule

Claude must not reveal inaccessible knowledge indirectly. If a graph traversal encounters a restricted node, the restricted node and relationships derived solely from it must be omitted before model context construction.

## Vendor independence

Do not put business logic exclusively in the Claude prompt. Authority ranking, permission filtering, revision resolution, and provenance should live in Collective Brain services/policies so other AI clients can use the same rules later.
