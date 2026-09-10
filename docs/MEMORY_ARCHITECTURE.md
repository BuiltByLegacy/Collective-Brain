# Memory Architecture

## Purpose

Collective Brain is an organizational memory system, not a single vector index. Different kinds of organizational memory must be read, written, governed, and tested differently.

Collective Brain therefore separates **knowledge type** from **memory class**.

```text
Knowledge Type
Decision / Lesson / Procedure / Requirement / Concept / Exemplar / etc.
        +
Memory Class
semantic / episodic / procedural
        +
Trust Context
authority / applicability / revision / provenance / ACL / freshness
```

Memory class controls recall and write behavior. Authority, applicability, permissions, provenance, revision, and freshness remain independent trust dimensions.

## Memory classes

### Semantic memory

Semantic memory represents durable organizational facts and concepts: current program facts, ownership, requirements interpretations, approved concepts, current attributes, and other knowledge that may be superseded.

Default behavior:
- retrieval: semantic/vector retrieval + graph/concept identity + metadata filters,
- write: deterministic upsert/supersession when identity is controlled,
- free-form concepts: resolve through `KnowledgeConcept` matching and review rather than creating uncontrolled duplicate truth,
- history: retain superseded values and evidence.

**Invariant:** do not ask the model to resolve deterministic state that the data model can resolve.

For controlled semantic slots, newer applicable authoritative state must supersede older current state instead of leaving contradictory values equally current.

### Episodic memory

Episodic memory represents reusable organizational experience: incidents, prior analyses, completed work, lessons learned, decisions-in-context, and outcomes.

Recommended episode shape:

```yaml
situation: Cracks forming near weld toe after thermal cycling
context:
  process: welding
  material: Inconel
  geometry: thin-wall bracket
attempts:
  - action: increased weld size
    outcome: did_not_resolve
  - action: local blend
    outcome: temporary_improvement
root_cause: residual stress plus geometry transition
resolution: changed joint geometry and heat treatment
lesson: avoid the original transition geometry for this loading case
```

Default behavior:
- retrieval: similarity/search with relevance floor + graph/context filters,
- write: append-only historical record,
- update: corrections or later learning create linked follow-up/superseding interpretations; do not silently rewrite what happened,
- scope: Organization/Brain/domain permissions remain authoritative; there is no implicit cross-team global episode store.

Episodes should preserve failed attempts and outcomes, not only the successful fix. Organizational experience includes what not to repeat.

### Procedural memory

Procedural memory represents the rules and operating behavior that should guide work: procedures, policies, standards, required workflows, mandatory checks, and approved playbooks.

Default behavior:
- retrieval: primarily applicability-driven rather than ordinary similarity ranking,
- mandatory applicable rules may be loaded before semantic/episodic recall,
- write: human-controlled versioning only,
- AI may propose a procedural change but cannot silently promote it.

Procedural memory should not have to win a vector-search contest against lower-authority working material in order to govern an answer.

## Retrieval-facing representations

**Vectorize what users are likely to ask about; store the rest as structured context.**

The text chosen for embedding/search need not be the entire stored object.

For an episode, users usually search by the situation or symptom. The retrieval-facing representation may therefore emphasize `situation` / `symptom` plus selected context, while failed attempts, root cause, resolution, source links, authority, and other metadata are returned alongside the hit without all being equally weighted in the vector.

For semantic concepts, embed the canonical statement and aliases while keeping revision, applicability, source, authority, and identity as structured fields.

For procedural memory, applicability and governing policy can select the rule before similarity search is considered.

## Controlled identity and supersession

Where a domain has natural controlled semantic slots, use stable keys.

Example:

```text
Part / Program / Brain scope
  material
  drawing_revision
  design_owner
  release_status
  customer
  applicable_standard
  critical_process
```

A newer value for the same controlled slot can supersede the older current value deterministically while preserving history.

For open-ended knowledge, use concept resolution, semantic similarity, evidence, and human review rather than inventing uncontrolled topic strings.

## Recall order and budgets

A query should assemble context deliberately rather than dumping arbitrary chunks into the model.

Suggested policy dimensions per Brain/domain:
- maximum applicable procedural rules,
- maximum semantic concepts/evidence,
- maximum episodic precedents,
- semantic similarity threshold where appropriate,
- episodic relevance floor,
- graph expansion depth,
- overall context/token budget.

A typical flow is:

```text
query
  ↓
determine identity / Brain / permissions / applicability context
  ↓
load mandatory applicable procedural memory
  ↓
retrieve semantic concepts/facts
  ↓
retrieve relevant episodic precedents
  ↓
apply authority / revision / freshness / conflict policy
  ↓
assemble bounded grounded context
```

## Write asymmetry

The three memory classes intentionally have different write rules:

| Memory class | Default write policy |
| --- | --- |
| semantic | upsert/supersede with history |
| episodic | append-only historical event/lesson |
| procedural | human-reviewed version change |

This asymmetry is a safety feature.

## Permissions and scope

Memory class never overrides authorization.

Every recall path must still enforce:

```text
authenticated user
AND organization membership
AND Brain membership/policy
AND source-native ACL
AND sensitivity / trust policy
```

Cross-team or cross-Brain reuse of episodic lessons requires explicit policy/governed transformation. Identity scrubbing alone is not sufficient authorization.

## Memory ablation harness

Collective Brain should prove that each memory class provides distinct value through deterministic probes.

Required configurations:
- all memory enabled,
- semantic disabled,
- episodic disabled,
- procedural disabled,
- all memory disabled.

Example probes:
- semantic: "What revision of the weld standard is Program A using?"
- episodic: "Have we dealt with cracking near this weld geometry before, and what happened?"
- procedural: "What checks are required before releasing this weldment?"

A probe should measurably fail or degrade when the required memory class is removed while unrelated probes remain stable.

## Core invariants

1. **Files are evidence, not truth.**
2. **Document count never determines authority.**
3. **Memory class controls recall/write behavior; trust dimensions remain orthogonal.**
4. **Do not ask the model to resolve deterministic state that the data model can resolve.**
5. **Vectorize the retrieval-facing representation, not blindly the entire object.**
6. **Episodes preserve failed attempts and outcomes.**
7. **Procedural memory changes only through governed human review.**
8. **Permissions are enforced before memory reaches model context.**
9. **Ablation tests must prove semantic, episodic, and procedural memory are genuinely distinct mechanisms.**
