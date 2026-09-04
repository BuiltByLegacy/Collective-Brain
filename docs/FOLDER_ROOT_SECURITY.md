# Folder Root Security Boundary

A Collective Brain workspace is defined by `provider + provider-native root folder ID`.

## Security properties
- A folder display name is never sufficient to identify a Brain.
- Joining an existing Brain requires selecting the same provider-native folder root.
- Content outside the root is excluded from retrieval and graph construction.
- Selecting the same root does not grant new source permissions.
- Source-native ACLs remain authoritative for every artifact.
- Permissions from OneDrive/SharePoint and Box are evaluated independently and are never unioned.
- Revoked, deleted, inaccessible, or moved-out-of-root content is tombstoned and removed from model-facing evidence.
- Restricted file titles, snippets, graph neighbors, and relationship-derived facts must not leak to unauthorized employees.

## Identity rule
The hosted Brain service maps the Claude requester to provider identities and groups. It may narrow access further, but it must never broaden source permissions.

## Multi-root future
Additional roots may be supported later, but each root must be explicitly registered by an authorized administrator and retain its own source ACL semantics. V1 defaults to one root to keep setup and trust simple.
