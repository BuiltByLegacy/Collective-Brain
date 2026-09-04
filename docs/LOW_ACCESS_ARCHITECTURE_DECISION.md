# Architecture Decision: Low-Access Enterprise First

Status: Accepted

Collective Brain will be designed so that ordinary employees can participate with only Claude plus company-approved OneDrive/SharePoint and/or Box access.

Consequences:
- no employee-side install requirement,
- no mandatory GitHub workflow,
- no mandatory separate knowledge-base UI,
- cloud folders remain the natural contribution surface,
- central services own indexing, graph construction, policy, and Claude tool hosting,
- source permissions remain authoritative,
- connector implementations are read-only by default,
- the Brain core remains vendor-neutral and can support other AI clients later.
