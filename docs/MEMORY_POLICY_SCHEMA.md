# Memory Policy Schema

This document defines the minimum behavioral contract for memory-aware retrieval and persistence.

```yaml
memory_class: semantic | episodic | procedural
retrieval_policy:
  mode: similarity | similarity_with_floor | applicability | hybrid
  max_items: 4
  min_score: null
  graph_depth: 1
write_policy:
  mode: supersede | append_only | human_reviewed_version
scope:
  organization_id: required
  brain_id: required
  domain: optional
trust:
  authority_class: required_when_governed
  approval_state: required_when_governed
  applicability: structured
  provenance: required
  freshness: structured
  acl_ref: required_for_external_sources
```

Knowledge type and memory class are intentionally separate. A `Decision`, `LessonLearned`, `RequirementReference`, or other knowledge type may map to a default memory class, but behavior should be explicit and inspectable rather than inferred invisibly from the node type.

The policy layer should support per-Brain/domain overrides while enforcing organization/source authorization first.
