# V0 POC — Institutional Memory Proof

## Goal

Prove that knowledge created by one employee can materially improve a later, separate AI interaction for another employee without requiring the second employee to know the original artifact exists.

## Synthetic scenario

Employee X creates a synthetic engineering seed-part artifact containing:
- a datum-target implementation example,
- MBD/PMI guidance,
- a documented design rationale,
- references to synthetic external-standard metadata,
- a link to a synthetic internal procedure,
- revision information,
- an explicit approved-example authority class.

The artifact is ingested and related concepts are added to the graph.

Employee Y later asks in a separate Claude session:

> How are we handling datum targets on weldment seed parts?

## Expected answer behavior

The system should:
1. retrieve the relevant seed-part evidence without filename hints,
2. identify the current revision,
3. retrieve related decision/procedure context,
4. distinguish approved exemplar from mandatory requirement,
5. cite the exact source location,
6. exclude inaccessible artifacts for a restricted test identity,
7. surface conflicting or superseded evidence if present,
8. avoid inventing unsupported standard requirements.

## Synthetic corpus

Minimum useful POC corpus:
- 1 current approved seed-part exemplar
- 1 superseded previous revision
- 1 released synthetic internal procedure
- 1 approved engineering decision
- 1 approved training deck with lower authority
- 1 conflicting/outdated working note
- 1 restricted artifact that is highly semantically relevant
- 1 unrelated artifact as retrieval noise
- synthetic standard-reference metadata only; no copyrighted standard text

## Required tests

### Positive retrieval
Employee Y receives the correct approved exemplar and related context.

### Revision
Current revision is preferred over superseded revision, while historical revision remains queryable when explicitly requested.

### Authority
A released procedure outranks a conflicting working note.

### Classification
The answer labels an exemplar as precedent/example rather than external or internal requirement unless higher-authority evidence requires it.

### Provenance
The answer points to artifact + revision + location.

### Graph
The system can traverse at least one meaningful chain, e.g.:

```text
Seed Part Rev B
  DEMONSTRATES -> Datum Target Pattern 03
  DERIVED_FROM -> Decision ED-0042
  IMPLEMENTS -> Procedure MBD-102
```

### Permission negative test
A restricted artifact is excluded before model context even if it is the best semantic match.

### Conflict
The system surfaces that an outdated working note conflicts with the current procedure rather than blending both into one answer.

### Knowledge proposal
Claude can propose a reusable lesson learned linked to evidence, but it remains `pending_review`.

## Exit criteria

V0 is complete when the full Employee X → Employee Y scenario is automated and repeatable with tests. Passing retrieval alone is insufficient; authority, provenance, revision, graph context, and permission-negative behavior are required.
