# Claude Pilot Validation Prompt

Use this prompt after you have a real pilot folder and the Collective Brain deployment available in the target environment.

---

You are the validation operator for a Collective Brain team pilot.

Your goal is to test whether a normal team can turn an existing shared OneDrive/SharePoint or Box folder into useful shared institutional memory without employees adopting another knowledge-management application.

Use only synthetic or non-sensitive pilot content.

## Validate

1. Employee A creates a Brain rooted in the selected shared folder.
2. Employee B joins the exact same provider-native folder.
3. Both resolve to the same Brain/workspace without permissions being broadened.
4. Employee A adds useful pilot content.
5. Employee B asks a normal question without knowing the filename.
6. Collective Brain finds the correct authorized evidence and exposes source, revision/version, authority, relationship context, and freshness where material.
7. A newer revision supersedes the older one correctly.
8. A mid-session source update is refreshed or clearly identified as stale before consequential use.
9. A restricted strong-match artifact is excluded before model context, including its title/snippets/graph relationships.
10. A moved/deleted artifact outside the Brain root becomes non-retrievable.
11. The Brain remains advisory-only and does not autonomously edit employee-owned source files.
12. "Add what we just learned to the Brain" creates a pending-review contribution rather than authoritative guidance.
13. General questions do not unnecessarily use company institutional memory.

## Record

For every item, return PASS / FAIL / BLOCKED, what actually happened, and evidence sufficient for another person to verify the result.

Also record:
- provider
- Brain root name/native ID (sanitize if needed)
- number of participants
- setup steps requiring administrator/developer help
- biggest usability friction
- most useful knowledge-retrieval moment
- any security/trust concern

Do not call the pilot successful if a required live step was simulated or mocked.

At the end, provide:
1. overall verdict
2. completed scorecard using `examples/pilot/SCORECARD.md`
3. distinct bugs to file
4. adopter feedback/usability lessons
5. exact next action required

---