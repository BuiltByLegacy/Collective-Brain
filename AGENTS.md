# Collective Brain — Agent Rules

These rules apply to Claude, Codex, ChatGPT, and any automated contributor working in this repository.

## Product intent

Collective Brain is an AI-native institutional-memory platform. Its purpose is to help teams reuse knowledge already created in normal work artifacts while preserving provenance, authority, permissions, revision context, and human ownership.

Engineering is the first domain. The platform must remain domain-agnostic unless an issue explicitly scopes work to the engineering POC.

## Prime directive

Do not optimize for a demo that merely returns semantically similar text. A valid solution must preserve the difference between:

- a requirement,
- an approved company procedure,
- an approved decision,
- an exemplar or precedent,
- training material,
- a working artifact,
- an informal note,
- and AI inference.

## Source-of-truth rules

1. The AI model is never the authoritative knowledge store.
2. Every answer derived from Collective Brain should be traceable to source artifacts when possible.
3. Revision/supersession must be modeled explicitly.
4. Lower-authority artifacts must not silently override higher-authority artifacts.
5. AI-derived knowledge enters a proposal/review workflow before becoming authoritative.
6. Restricted knowledge must not be leaked through answers, metadata, graph edges, snippets, titles, counts, or inferred relationships.
7. Licensed external standards must be handled according to the organization's permitted access and licensing model. Synthetic metadata is preferred for the POC.

## V0 boundary

Use synthetic engineering data only. Do not add real employer, customer, export-controlled, proprietary, personally sensitive, or licensed-standard text to the repository.

## Required V0 proof

A valid V0 must demonstrate this end-to-end scenario:

1. Employee X adds a synthetic seed-part artifact.
2. The ingestion layer extracts text and metadata.
3. The relationship layer maps relevant concepts and artifact relationships.
4. Employee Y, in a separate AI session, asks a related question without knowing the artifact filename.
5. Retrieval finds the correct evidence.
6. The answer states the authority level and revision.
7. The answer cites the source location.
8. A permission-negative test proves unauthorized content is excluded.
9. Any newly inferred reusable knowledge is proposed for review rather than directly promoted.

## Architecture principles

- Keep storage/model clients swappable.
- Keep graph, retrieval, authority, permission, and provenance concerns separable.
- Prefer deterministic policy checks around probabilistic model behavior.
- Prefer explicit typed relationships over undocumented magic.
- Keep original artifacts immutable from the ingestion path.
- Make indexing repeatable and idempotent.
- Record source hash/revision so stale indexed content can be detected.
- Design for incremental sync, but do not overbuild cloud sync before the local POC passes.

## Graph principles

Graphify-style relationship modeling is a core capability, not decorative visualization.

Useful relationship types include:

- REFERENCES
- IMPLEMENTS
- APPLIES_TO
- DERIVED_FROM
- DEMONSTRATES
- SUPERSEDES
- CONFLICTS_WITH
- VALIDATED_BY
- AUTHORED_BY
- REVIEWED_BY
- USED_ON
- LESSON_FROM
- RELATED_TO

Relationships should carry provenance where practical. A graph edge created by AI inference must be distinguishable from an explicit relationship found in source data or approved by a human.

## Retrieval principles

Hybrid retrieval should eventually combine:

- semantic similarity,
- exact/keyword retrieval,
- graph traversal,
- authority ranking,
- revision freshness,
- permission filtering,
- and source confidence.

Permission filtering must happen before unauthorized content is exposed to the model.

## Change discipline

For each implementation issue:

- state assumptions,
- add or update tests,
- document schema/API changes,
- preserve backwards compatibility unless the issue explicitly authorizes a break,
- avoid introducing infrastructure without a demonstrated need,
- and update README/docs when behavior materially changes.

## Definition of done

Code compiling is not enough. Work is complete only when its issue acceptance criteria are demonstrably satisfied and relevant negative tests are included.
