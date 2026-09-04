# Contributing to Collective Brain

Thanks for helping improve Collective Brain.

Collective Brain is an open shared-second-brain project for teams that want connected institutional memory without requiring everyone to adopt a separate knowledge-management application.

## Before you start

Read:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/KNOWLEDGE_MODEL.md`
- `skills/claude/SKILL_SPEC.md`

## Core invariants

Contributions must preserve these product rules:

1. **Source permissions are authoritative.** Collective Brain may narrow access but must never broaden it.
2. **Permission filtering happens before model context.** Restricted titles, snippets, counts, and graph relationships must not leak.
3. **Source-owned files are advisory/read-only by default.** AI may recommend or propose changes, not silently edit employee work.
4. **AI-generated knowledge is non-authoritative by default.** Promotion requires explicit human review.
5. **Provenance matters.** Evidence should preserve source identity, revision/version, location, and read/freshness context where available.
6. **The Brain is vendor-neutral.** Claude is the first client, not the owner of business logic.
7. **The Brain is folder-rooted.** Provider + provider-native root ID defines a workspace, not the display name.
8. **No proprietary test data.** Public tests and examples must use synthetic or clearly redistributable content.

## Development setup

Requirements:

- Node.js 20+
- Git

```bash
git clone https://github.com/BuiltByLegacy/Collective-Brain.git
cd Collective-Brain
npm test
npm run poc
```

## Making a change

1. Open or select a GitHub issue describing the problem or capability.
2. Keep the change focused.
3. Add or update tests for behavior changes.
4. Run `npm test` and `npm run poc` when relevant.
5. Update docs when user-facing behavior, trust rules, or architecture changes.
6. Submit a pull request with:
   - what changed
   - why it changed
   - tests run
   - security/permission impact
   - migration or compatibility notes, if any

## Connector contributions

New storage connectors should implement the shared connector contract and preserve:

- provider-native IDs
- source versions/revisions
- source links where permitted
- timestamps
- ACL/entitlement semantics
- incremental change state
- deletion/inaccessibility tombstones
- connector health

Connector code must not require ordinary employees to manage developer credentials. Any privileged setup belongs to central administration/deployment.

## AI-client contributions

Additional AI clients are welcome, but authority ranking, permissions, revision resolution, graph traversal, provenance, and trust policy should remain in Collective Brain rather than being duplicated only in client prompts.

## Security issues

Do not post real credentials, access tokens, employer data, customer data, or sensitive tenant details in public issues.

If you discover a permission leak or other security-sensitive defect, provide the minimum sanitized reproduction necessary and avoid exposing restricted content in screenshots/logs.

## Licensing

By contributing, you agree that your contribution is submitted under the Apache License 2.0 terms in `LICENSE`.
