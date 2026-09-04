# Knowledge Model

## Purpose

Collective Brain must preserve meaning, authority, provenance, revision, and relationships—not just extracted text.

## Artifact metadata

Every ingested artifact or artifact revision should support fields equivalent to:

```yaml
artifact_id: SP-WELDMENT-001
revision_id: B
source_system: synthetic-poc
source_uri: brain/seed-parts/SP-WELDMENT-001.md
title: Weldment Seed Part Development
type: exemplar
status: approved
authority_class: approved_exemplar
owner_role: mbe-team
created_at: 2026-08-20
reviewed_at: 2026-08-29
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

## Authority classes

Initial ordered classes:

1. `controlled_requirement`
2. `released_procedure`
3. `approved_decision`
4. `approved_exemplar`
5. `approved_training`
6. `working_document`
7. `informal_note`
8. `ai_inference`

Authority ordering is policy, not truth by itself. Applicability, effective revision, program scope, and explicit supersession still matter.

## Relationship model

Each relationship should include:

```yaml
from: SP-WELDMENT-001-B
type: DEMONSTRATES
to: CONCEPT-DATUM-TARGET-PATTERN-03
provenance:
  source_artifact: SP-WELDMENT-001-B
  source_location: slide:14-17
assertion_type: explicit
confidence: 1.0
review_status: source-derived
```

`assertion_type` values should distinguish at least:
- `explicit` — directly represented in controlled/source data
- `extracted` — machine-extracted from source content
- `inferred` — AI/model inference
- `human_approved` — reviewed/approved relationship

## Revision and supersession

Do not model revisions as simple mutable attributes on one node if that destroys history. The system should be able to answer both:
- What is current?
- What did Revision A say when it was active?

Recommended pattern:

```text
Artifact: SP-WELDMENT-001
  HAS_REVISION -> Rev A
  HAS_REVISION -> Rev B

Rev B SUPERSEDES Rev A
Rev B CURRENT_FOR -> Program Common
```

## Source locations

Normalized chunks should retain structured location metadata:
- PowerPoint: slide number + shape/notes context where practical
- PDF: page
- Word: heading/section/paragraph anchor
- Excel: sheet + range/table
- Markdown: heading + line/range where practical

## Knowledge proposals

AI-created reusable knowledge should be represented separately from authoritative knowledge:

```yaml
proposal_id: KP-0001
proposal_type: lesson_learned
status: pending_review
proposed_by: claude-client
based_on:
  - SP-WELDMENT-001-B
  - conversation:test-session-02
statement: "..."
reviewer_role: mbe-sme
```

A proposal is never treated as released guidance until promoted through an explicit workflow.

## Permission model

The POC can use synthetic role/employee scopes, but the data model must anticipate source-native ACLs.

Permissions apply to:
- artifact content,
- metadata,
- graph nodes/edges,
- snippets,
- source names,
- derived relationships,
- expert/person associations.

The system must support safe omission rather than revealing that inaccessible content exists.
