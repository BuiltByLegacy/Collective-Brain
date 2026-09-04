# Low-Access Enterprise Operating Model

## Target environment
Collective Brain is explicitly designed for organizations where most employees have access to only:
- Claude,
- OneDrive / SharePoint,
- Box,
- ordinary Office files.

## Employee experience
1. Employee creates or edits normal work.
2. Employee saves it to an approved shared OneDrive/SharePoint or Box location.
3. Collective Brain indexes allowed content through centrally managed read-only connectors.
4. Another employee asks Claude a normal question.
5. Claude queries Collective Brain and returns a permission-filtered, sourced answer.

Employees do not need to know that a knowledge graph, retrieval index, or Brain service exists.

## Administrator experience
A small central setup may be required to:
- authorize OneDrive/SharePoint and/or Box service access,
- designate approved folders/sites,
- map source permissions,
- deploy the Brain service/tool endpoint used by Claude,
- designate reviewers/SMEs,
- monitor sync health.

This is intentionally separated from employee usage.

## Storage principles
- Source systems remain the system of record.
- Collective Brain defaults to read-only source access.
- Source ACLs are never broadened.
- Deleted or inaccessible source items are tombstoned from the Brain index.
- File links should return employees to the source system when possible.
- Licensed-content handling follows source licenses and company policy.

## Supported rollout patterns
### OneDrive/SharePoint-first
Best for Microsoft-heavy companies. Shared team sites/folders become knowledge sources.

### Box-first
Best where Box is the controlled document repository. Box folders become knowledge sources with the same normalized connector contract.

### Hybrid
Both sources feed one Brain while retaining source-native IDs, links, revisions, and ACLs.

## Non-goals
Collective Brain is not intended to force employees into:
- a new note-taking product,
- a wiki migration,
- manual tagging of every artifact,
- developer workflows,
- maintaining duplicate copies of source documents.
