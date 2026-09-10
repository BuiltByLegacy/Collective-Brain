# Enterprise Document Archive & Knowledge Index

## Principle

**The Brain must never lose track of what documents it has, where they came from, which copy is current, how they relate, and whether they should still be trusted.**

The archive is the authoritative inventory of documents. The knowledge layer represents what the organization knows. Every externally sourced or Brain-native artifact enters the archive before it can contribute evidence to semantic, episodic, or procedural memory.

## Core model

- `BrainDocument` — stable logical identity independent of provider path/name.
- `DocumentRevision` — immutable revision/version history and content fingerprint.
- `DocumentSourceLocation` — provider-native copy/location with its own ACL and availability state.
- `DocumentFamily` — groups logical records/revisions that belong to one controlled family without erasing source provenance.

Provider-native identity, content hash, revision metadata, and governed review are used before similarity. Similarity can create reconciliation candidates but cannot destructively merge uncertain documents.

## Archive lifecycle

Operational states include `indexed`, `needs_reindex`, `unclassified`, `possible_duplicate`, `possible_variant`, `broken_source`, `permission_unknown`, `owner_missing`, `stale`, `superseded`, `archived`, `tombstoned`, and `quarantined`.

Lifecycle state is independent from knowledge authority and memory class. State transitions are audited. Archived is not deleted; tombstones preserve identity and provenance; quarantine excludes malformed/unsafe content from current retrieval.

## Faceted index

The archive supports deterministic facets across Brain, source, type, owner, team/domain/program/customer, current/revision state, lifecycle, authority, sensitivity, governing-vs-working state, indexing state, duplicate/variant state, and dates. Unknown or unclassified values stay visible instead of being guessed.

Facet counts are computed only after authorization filtering so hidden records do not leak through counts.

## Partitioning and federation

Indexes should be physically partitionable while preserving logical identity. The baseline partition contract is:

`Organization → Brain → domain/program/general`

Queries fan out only across authorized partitions, with bounded partition count and per-partition candidate limits before global reranking. Partial fan-out must be disclosed rather than presented as complete search.

## Reconciliation

Possible duplicate/variant/revision-family ambiguities are queued for explicit review. Resolution may keep documents distinct, mark supersession, repair canonical source, or reconcile family membership while preserving every underlying source record and ACL. Duplicate count never raises authority.

## Health

Archive health detects missing owner/classification/current revision, broken canonical source, stale verification, reconciliation backlog, permission uncertainty, quarantine, and other corpus-maintenance conditions. Health does not change authority by itself; it drives remediation and governance.

## Product views

Core exposes view-models for All Documents, Current, Needs Review, Duplicates/Variants, Broken Sources, Unclassified, Orphaned, Archived, Superseded, and Quarantined. Document detail includes revision lineage, permitted source locations, canonical open action, health, reconciliation state, and audit history. Enterprise product shells can render these contracts without reimplementing archive truth logic.

## Retention and recovery

Retention policy can be scoped by document type and archive metadata. Legal hold blocks archival/disposition. Archival preserves lineage. Tombstoning never claims the upstream provider file was deleted by Collective Brain. Brain-native restore and external-source recovery are allowed only when a valid source/storage record remains available and the actor is authorized by the host product.

## Security invariants

1. Archive identity does not grant content access.
2. Source-location ACLs are never unioned because two copies are related.
3. Hidden documents do not appear in list results, counts, details, related records, or source-open actions.
4. Repartitioning cannot change document/revision identity.
5. Knowledge objects must point back to registered document/revision evidence, not untracked chunks.
