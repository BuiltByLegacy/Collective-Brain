# Memory Architecture Implementation Notes

This note supplements `docs/MEMORY_ARCHITECTURE.md` and `docs/KNOWLEDGE_MODEL.md` with implementation-specific requirements captured from memory-system design review.

## Deterministic semantic identity

For governed facts with a natural closed identity, use stable keys so a new applicable/current value collides with and supersedes the prior current value by construction. Do not create a new arbitrary key for every extracted statement and then ask retrieval/model ranking to decide which contradictory value is current.

Closed semantic slots are appropriate when the domain has a controlled vocabulary such as current revision, release status, owner, material, customer, applicable standard, process, or program. Open-ended knowledge should use `KnowledgeConcept` resolution plus review rather than an unbounded topic-key namespace.

## Retrieval field selection

The stored object and the vectorized/searchable representation are different concerns.

For episodic memory, index the problem/situation/symptom users are likely to describe. Keep the following as structured sibling fields returned with the hit:
- context,
- what was tried,
- outcomes / failed attempts,
- root cause,
- resolution,
- lesson,
- source/provenance,
- applicability,
- permissions.

For procedural memory, applicability and authority may select the rule directly; a mandatory procedure does not need to win similarity ranking against working documents.

## Write policies

- semantic: upsert/supersede when identity is controlled; preserve revision/history,
- episodic: append-only experience; corrections/follow-ups are linked rather than silently mutating history,
- procedural: versioned and human-approved; AI suggestions remain proposals until explicit promotion.

## Retrieval budgets

Brains/domains should support separate context budgets and thresholds for semantic, episodic, and procedural memory rather than one global top-K. This may include maximum items, minimum episodic relevance, graph-depth limit, applicability filters, and an overall context/token budget.

## Evaluation

The test suite should contain probes that require one memory class and an ablation harness that runs the same probe set with all memory, no semantic, no episodic, no procedural, and no memory. Removing one class should selectively degrade the probes that require it.
