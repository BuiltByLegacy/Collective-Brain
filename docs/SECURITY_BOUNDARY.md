# Security Boundary

Collective Brain's primary security boundary is the evidence bundle passed to the AI client.

Before any Claude/model context is constructed:
- requester identity is resolved,
- source ACLs are evaluated,
- restricted artifacts are removed,
- restricted graph nodes/edges are removed,
- unsafe metadata/title/count leakage is removed,
- revision/current status is resolved,
- only authorized evidence is packaged.

Post-generation redaction is not considered sufficient security.
