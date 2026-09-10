# Memory Ablation Plan

## Objective

Prove that Collective Brain's semantic, episodic, and procedural memory classes are genuinely distinct mechanisms and that removing one class selectively degrades the queries that require it.

## Configurations

Run the same probe suite under:

- all memory enabled,
- semantic disabled,
- episodic disabled,
- procedural disabled,
- all memory disabled.

## Probe families

### Semantic probe
Question: `What revision of the weld standard is Program A using?`

Expected dependency:
- semantic memory supplies the current governed concept/slot,
- procedural memory may provide the standard itself but should not be required to resolve the stored current Program A revision mapping,
- episodic memory should not determine the answer.

### Episodic probe
Question: `Have we dealt with cracking near this weld geometry before, and what happened?`

Expected dependency:
- episodic memory returns similar prior experience including failed attempts, root cause, resolution, and lesson,
- removing episodic memory should materially degrade the answer.

### Procedural probe
Question: `What checks are required before releasing this weldment?`

Expected dependency:
- applicability-selected procedural memory provides the mandatory checks,
- the answer must not depend on the governing procedure winning a vector top-K competition against working documents.

## Scoring

Each probe should record at least:
- correctness,
- grounded-source coverage,
- authority/applicability correctness,
- unsupported-claim count,
- required-memory-class evidence present/absent,
- latency/context size where useful.

The expected scorecard is selective rather than globally degraded: disabling semantic memory should hurt semantic probes; disabling episodic memory should hurt episodic probes; disabling procedural memory should hurt procedural probes. `no memory` establishes the floor.

## Safety assertions

The harness must also assert:
- no unauthorized evidence enters model context,
- stale/superseded semantic state is not presented as equally current,
- episodic history is append-only,
- procedural changes require human promotion,
- unresolved conflicts are disclosed rather than silently blended.
