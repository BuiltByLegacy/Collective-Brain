# Real Cloud Validation Gate

This gate must pass before closing the Low-Access Enterprise Deployment epic.

## Preconditions
- A company-approved OneDrive/SharePoint or Box test folder exists.
- Employee X and Employee Y both select the same provider-native folder as the Collective Brain root.
- The hosted Brain service has centrally managed read authorization to that root.
- At least one restricted artifact is present that Employee Y cannot access.

## Scenario
1. Employee X creates a test PowerPoint in the shared brain root containing a unique synthetic engineering decision and rationale.
2. Connector sync detects the file and records its provider-native ID, revision, timestamps, ACLs, and source link.
3. Graph/retrieval indexing processes only content under the selected root.
4. Employee Y joins the same brain by selecting the same folder.
5. Employee Y asks Claude a question that can only be answered from Employee X's file, without naming the file.
6. Claude retrieves the correct evidence and returns artifact title, revision, source location/link, authority classification, and relationship context.
7. Update Employee X's file and verify the new revision supersedes stale indexed evidence.
8. Revoke Employee Y's access to a second test artifact and verify it becomes non-retrievable before model context.
9. Delete or move a test artifact outside the brain root and verify tombstoning/exclusion.

## Pass criteria
- Same selected folder resolves both employees to the same workspace ID.
- Out-of-root files never enter the Brain.
- Current revisions replace stale revisions without losing provenance.
- Source-native ACLs are enforced independently for Microsoft and Box.
- Permission revocation and deletion remove stale retrievability.
- Employee Y requires only Claude and ordinary access to the shared folder.
- No employee handles API credentials, database credentials, GitHub, or CLI tooling.

## Evidence to retain
- provider + root ID (redacted if necessary)
- test artifact source IDs and revisions
- sync timestamps
- sanitized retrieval trace
- permission-negative result
- Claude answer with source citation
- CI/test run covering the same invariant set
