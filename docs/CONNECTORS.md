# Source Connectors

Collective Brain normalizes multiple controlled repositories behind one read-only connector contract.

## Required contract
Each connector supports:
- list incremental changes,
- fetch an allowed artifact,
- fetch source-native permissions,
- fetch revision/version identity,
- preserve source links and source locations,
- emit deletion/inaccessibility tombstones.

## OneDrive / SharePoint
Use centrally approved Microsoft access. Preserve site/drive/item identifiers, version/revision, web URL, and source ACL semantics. Employees should not authorize personal applications.

## Box
Use centrally approved Box access. Preserve file/folder identifiers, versions, shared links where policy allows, and enterprise collaboration/permission semantics.

## Security
Source ACLs are authoritative. Connector normalization may restrict further but can never broaden access. Retrieval must apply permissions before any model-facing evidence bundle is created.
