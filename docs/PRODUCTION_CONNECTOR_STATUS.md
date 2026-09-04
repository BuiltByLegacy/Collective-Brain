# Production Connector Status

## Implemented in code
- Folder-rooted OneDrive/SharePoint connector using Microsoft Graph delta + permissions APIs.
- Folder-rooted Box connector using the Box changes event stream + collaborations APIs.
- Provider-native root ID workspace identity.
- Source-specific ACL normalization.
- Per-provider authorization checks that never union permissions across sources.
- Tombstone/state reconciliation helpers.
- Hosted Brain tool endpoint contract for Claude.
- Create Brain / Join Existing Brain employee setup model.
- CI tests with mocked Microsoft and Box API responses.

## Not yet proven against a real company cloud tenant
- live OAuth/application authorization
- live folder selection/registration
- live incremental cursor persistence
- live Office file download/extraction
- live inherited/group permission semantics across complex tenants
- live permission revocation timing
- live Box enterprise event configuration
- live Claude deployment/tool registration in an enterprise workspace

These are deliberate release gates. Issues #15, #16, #17, #18 and epic #14 remain open until real-cloud validation evidence exists.
