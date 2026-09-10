# Knowledge Model

## Purpose

Collective Brain must preserve meaning, authority, provenance, revision, applicability, freshness, and relationships—not just extracted text.

A core design rule is:

> Files are evidence. Evidence supports knowledge. Governing references define rules. The Brain must not confuse document volume with truth.

At scale, many documents may repeat, partially duplicate, supersede, contradict, or reinterpret the same underlying knowledge. Collective Brain therefore models artifacts, evidence, knowledge concepts, governing references, and memory behavior separately.

## Implemented governed-knowledge runtime

The Core implementation now lives in `src/governed-knowledge.mjs` and is exercised by `tests/governed-knowledge.test.mjs`.

Implemented contracts include:
- provider-neutral source manifests with provider-native ID, version, canonical URL, hash, location, timestamps, ACL reference, state, and scope;
- SharePoint/OneDrive and Box normalized artifacts mapped into the same manifest contract;
- permission-safe source-open actions;
- exact duplicate, revision, near-duplicate/variant, and overlapping-knowledge classification;
- document families that preserve every source identity rather than merging ACLs;
- `KnowledgeConcept` synthesis where authority/applicability/current status beat mention count;
- explicit unresolved conflicts when equally authoritative current applicable evidence disagrees;
- governing-reference recall by applicability, effective time, mandatory/advisory state, authority, and ACL rather than ordinary similarity ranking;
- historical governing-reference queries;
- accountable reviewer/SME routing with reviewer authorization and auditable resolution;
- queue/backpressure, ACL-priority work, idempotency, retries, dead-letter/quarantine, unchanged-content short circuit, health metrics, and deterministic classifier/pipeline versions;
- semantic / episodic / procedural / evidence-only ingestion classification.

The runtime does not claim that synthetic tests replace live tenant/provider validation. Provider production validation remains governed by the connector issues and live-proof gates.

## Artifact metadata

Every ingested artifact or artifact revision should support fields equivalent to:

```yaml
artifact_id: SP-WELDMENT-001
revision_id: B
source_system: sharepoint
source_native_id: 01ABC123...
source_version_id: '17'
source_uri: brain/seed-parts/SP-WELDMENT-001.md
canonical_source_url: https://company.sharepoint.com/sites/engineering/...
parent_source_url: https://company.sharepoint.com/sites/engineering/Shared%20Documents/...
title: Weldment Seed Part Development
type: exemplar
status: approved
authority_class: approved_exemplar
owner_role: mbe-team
created_at: 2026-08-20
modified_at: 2026-08-28
reviewed_at: 2026-08-29
retrieved_at: 2026-09-08T12:30:00-04:00
supersedes: SP-WELDMENT-001-A
content_hash: sha256:...
access_scope:
  - engineering
  - program-common
references:
  - REF-ASME-Y14-5
  - PROC-MBD-102
tags:
  - MBD
  - weldment
  - datum-targets
```

The canonical source URL is for the human. The provider-native immutable ID is for durable system identity. The source version ID and content hash prove which content was indexed. Rename/move behavior must preserve identity when the source provider preserves its native ID.

### Source traceability invariant

For externally sourced governed knowledge:

> **No governed knowledge without traceable evidence. No evidence without a retrievable source reference.**

Every externally sourced evidence record must retain, where the provider supports it:
- Brain artifact/revision ID,
- source system/provider,
- provider-native immutable file/document ID,
- provider-native version/revision ID,
- canonical human-openable source URL,
- parent/container source reference where useful,
- source location within the document,
- content hash,
- source modified timestamp,
- last retrieved/read timestamp,
- permission/ACL context or reference,
- current/superseded/deleted/tombstoned state.

Brain-native knowledge uses the canonical Brain object as its source of truth and must retain creator, reviewer/approver, revision, audit history, and canonical Brain URL.

## Knowledge layers

Collective Brain distinguishes four layers:

```text
FILES / ARTIFACTS
What the organization created or connected
        ↓
EVIDENCE
What an artifact says at a specific revision/location
        ↓
KNOWLEDGE CONCEPTS
What the organization currently knows/believes, with supporting evidence
        ↓
GOVERNING REFERENCES / RULES
What the organization must follow for a given scope
```

Most uploaded content remains evidence. It does not automatically become authoritative organizational knowledge.

## Authority classes

Initial ordered classes:

1. `regulatory_requirement`
2. `customer_contractual_requirement`
3. `controlled_requirement`
4. `released_company_standard`
5. `released_procedure`
6. `approved_decision`
7. `approved_exemplar`
8. `approved_training`
9. `working_document`
10. `informal_note`
11. `ai_inference`

Authority ordering is policy, not truth by itself. Applicability, effective revision, contractual scope, program/product/customer scope, date, and explicit supersession still matter.

Document count never raises authority. Five copies of an outdated presentation do not outrank one applicable current released standard.

## Governing references and applicability

Specifications, standards, procedures, customer requirements, regulations, and internal rules are first-class governing references rather than ordinary search documents.

Example:

```yaml
reference_id: ENG-STD-0042-F
document_number: ENG-STD-0042
title: Welded Structure Design Standard
revision: F
status: released
effective_from: 2026-08-01
effective_to: null
authority_class: released_company_standard
mandatory: true
owner_role: engineering-standards
applicability:
  business_units: [aerospace]
  processes: [welding]
  product_families: [all]
  programs: [all]
  customers: []
  jurisdictions: []
supersedes: ENG-STD-0042-E
```

The Brain should reason in this order when relevant:
1. applicable governing rule/requirement,
2. approved interpretation/procedure/decision,
3. approved exemplar or precedent,
4. lessons learned and historical experience,
5. working/informal material.

Applicability is first-class. Two statements are not necessarily in conflict if they apply to different programs, products, customers, materials, jurisdictions, contracts, or effective dates.

## Temporal knowledge

Historical revisions are retained so the Brain can answer both:
- What is the current requirement?
- What requirement applied when this artifact/product was released on a past date?

Effective windows should be modeled explicitly where available.

## Duplicate, revision, and variant handling

High-volume ingestion must distinguish:
- **Exact duplicate** — same content/hash or provider copy; avoid treating copies as independent truth.
- **Revision** — same logical artifact/document family with a newer source revision/version; preserve history and explicit supersession.
- **Near duplicate / variant** — substantially similar content with different owner, scope, or edits; link as `POSSIBLE_VARIANT_OF` or `POSSIBLE_DUPLICATE_OF` rather than silently merging.
- **Same concept, different wording** — separate evidence statements may support one `KnowledgeConcept`.

Possible duplicates/variants preserve all source identities and permissions. Destructive merging requires a governed decision.

## Knowledge concepts and evidence

A knowledge concept groups semantically equivalent or related evidence without erasing source differences.

```yaml
concept_id: CONCEPT-MAX-OPERATING-TEMP
statement: Maximum operating temperature for Product Family A is 200 F.
status: approved
applicability:
  product_family: A
supported_by:
  - ENG-STD-100-REV-D:section-4.2
  - PROC-200-REV-B:section-7
conflicts_with: []
```

A concept's confidence/authority comes from its governed evidence and approval state, not from how many documents mention it.

## Conflict model

Conflicting evidence must never be silently blended or averaged.

When two statements differ, Collective Brain first tests whether the difference is explained by authority, revision/supersession, applicability/scope, effective date, program/product/customer/material/jurisdiction, or approval state.

If equally applicable/current authoritative evidence still conflicts, represent an unresolved conflict, disclose it in retrieval, and route it for human review.

Minimum relationships include `CONFLICTS_WITH`, `SUPERSEDES`, `CURRENT_FOR`, `APPLIES_TO`, and `VALIDATED_BY`.

## Relationship model

Each relationship should preserve provenance and assertion type. Additional scale-oriented relationships may include `HAS_REVISION`, `POSSIBLE_DUPLICATE_OF`, `POSSIBLE_VARIANT_OF`, `SUPPORTS`, `INTERPRETS`, `GOVERNS`, and `CURRENT_FOR`.

## Revision and supersession

Do not destroy historical revisions. The system must answer both current and historical questions.

## Source locations

Normalized chunks should retain structured location metadata for PowerPoint slides, PDF pages, Word headings/sections, Excel sheets/ranges, and Markdown headings/ranges where practical. Answers expose a human-openable source link only when authorized.

## Knowledge proposals

AI-created reusable knowledge remains `pending_review` until explicitly promoted by an authorized human.

## Review ownership and routing

Domains map knowledge-integrity events to responsible reviewers/SMEs. Events include unresolved conflicts, uncertain authority, possible duplicate/variant families, ambiguous supersession, governing-reference changes, and reusable AI/employee proposals.

## High-volume ingestion principle

Thousands of documents per day must not create thousands of independent truths. Ingestion is incremental and idempotent:

```text
source event
→ identity/ACL capture
→ fingerprint/hash
→ duplicate/revision/variant classification
→ metadata/document classification
→ content/location extraction
→ memory-class classification
→ governing-reference/applicability extraction
→ candidate concept/relationship/conflict analysis
→ class-specific index/graph update
→ review queue when required
```

The system supports batching, retry/dead-letter behavior, backpressure, partial failure isolation, ACL-priority processing, deletion/tombstone jobs, and observability without weakening permission checks or provenance.

## Permission model

Permissions apply to artifact content, metadata, source links, graph nodes/edges, snippets, source names, derived relationships, governing references, expert/person associations, and memory recall. Safe omission is preferred to leaking that inaccessible content exists.
