# Adopting Collective Brain

This guide is for a team or company that wants to trial or adopt Collective Brain in its own environment.

Collective Brain is designed for teams that already work in shared cloud storage and want connected institutional memory without forcing every employee into Obsidian, a wiki, or another knowledge-management application.

## 1. Decide your adoption level

### Level 1 — Local POC

Purpose: understand the architecture and prove the Employee X → Employee Y model using synthetic data.

Requirements:
- Node.js 20+
- Git

Run:

```bash
git clone https://github.com/BuiltByLegacy/Collective-Brain.git
cd Collective-Brain
npm test
npm run poc
```

Do not connect proprietary company data for this level.

### Level 2 — Team pilot

Purpose: prove the workflow in your real cloud environment with synthetic or non-sensitive pilot material.

Recommended pilot team:
- 2–10 employees
- one shared OneDrive/SharePoint or Box folder
- one clear domain/problem space
- one designated pilot owner

Required validation:
- Create Brain
- Join Existing Brain
- same-folder workspace identity
- retrieval without filename hints
- source provenance
- authority classification
- revision updates
- permission-negative case
- permission restoration
- move/delete/tombstone case
- advisory-only behavior
- snapshot freshness
- pending-review AI knowledge contribution

### Level 3 — Production candidate

Purpose: move from pilot evidence to real employee use.

Before using sensitive or controlled company content, validate:
- centrally managed connector authorization
- source-native identity and ACL mapping
- pre-model permission filtering
- revocation/deletion behavior
- auditability
- source freshness behavior
- hosted Brain endpoint
- Claude/client deployment
- licensed-content policy
- human review/promotion process
- organization-specific retention/security requirements

## 2. Pick the Brain root

Start with one existing shared folder or create a dedicated folder for the pilot.

The Brain is identified by:

`provider + provider-native root ID`

The display name is not the identity. Renaming the same cloud folder should not create a new Brain when the provider preserves the native ID.

Good pilot roots are narrow enough to understand but broad enough to contain useful prior work.

Examples:
- Engineering / Common Methods
- Product Team / Shared Decisions
- Manufacturing / Lessons Learned
- Quality / Approved Examples
- Program Alpha / Shared Knowledge

Avoid starting with an entire enterprise drive.

## 3. Define Employee A and Employee B

Employee A is the first person who creates/selects the Brain root.

Employee B is another authorized person who joins the same Brain root.

The key acceptance test is:

> Employee A creates useful knowledge. Employee B later asks a question without knowing the source exists. Collective Brain finds and explains the authorized source correctly.

See:
- `EMPLOYEE_A_CREATE_BRAIN.md`
- `EMPLOYEE_B_JOIN_BRAIN.md`
- `USING_COLLECTIVE_BRAIN.md`

## 4. Use synthetic pilot material first

Before introducing company-sensitive content, use a realistic synthetic artifact that contains:
- a specific decision or lesson
- a revision
- an authority classification
- related concepts
- a statement that can be tested without filename hints

Create at least one deliberately restricted artifact for a permission-negative test.

Do not use copyrighted standards text or proprietary employer/customer data in public test evidence.

## 5. Validate security before usefulness

A useful answer is not a successful pilot if permissions are wrong.

Prove:
- unauthorized artifacts are excluded before model context
- restricted titles/snippets/counts/relationships are not leaked
- joining the Brain does not grant source access
- permission revocation removes retrievability
- delete/move-out-of-root behavior removes stale evidence
- mixed source identities do not accidentally union access

## 6. Validate trust behavior

Collective Brain should not merely retrieve relevant text. It should explain whether that text is trustworthy and current enough for the use case.

Validate:
- current vs superseded revisions
- higher-authority vs lower-authority evidence
- conflicts are surfaced rather than blended
- exemplars are not mislabeled as requirements
- provenance identifies the source
- evidence carries read/freshness context
- stale consequential evidence is refreshed when possible or clearly warned
- AI-created lessons remain pending review
- detected errors produce recommendations, not silent edits to employee files

## 7. Evaluate employee friction

The target employee experience is intentionally simple.

An ordinary employee should need only:
- Claude (or another supported AI client)
- normal access to the shared Brain folder

If the pilot requires employees to use GitHub, manage OAuth apps, run CLI commands, query a database, or maintain a second knowledge application, treat that as a product/deployment gap.

## 8. Pilot scorecard

For each test, record:
- PASS / FAIL / BLOCKED
- expected behavior
- actual behavior
- source/provider
- sanitized evidence
- issue/defect created

Minimum scorecard:

| Test | Result |
| --- | --- |
| Employee A Create Brain | |
| Employee B Join Existing Brain | |
| Same native root → same Brain | |
| Wrong/copied folder negative | |
| Retrieval without filename hint | |
| Provenance/source location | |
| Authority classification | |
| Graph relationship context | |
| Revision update | |
| Historical revision | |
| Permission-negative | |
| Permission restoration | |
| Delete/move-out-of-root | |
| Advisory-only source behavior | |
| Snapshot freshness | |
| Pending-review knowledge proposal | |
| General-question routing | |

## 9. Company/team patterns worth testing

After a single-team pilot, expand by team structure rather than immediately indexing everything:

- 5-person functional team
- 20-person cross-functional product team
- engineering + manufacturing + quality
- multiple teams with shared and restricted knowledge
- consulting/services team with strict client separation
- one company with multiple Brain roots

Potential future structure:

```text
Company Collective Brain
├── Engineering Brain
├── Manufacturing Brain
├── Quality Brain
├── Program A Brain
└── Program B Brain
```

Cross-Brain relationships must still obey source permissions.

## 10. Production-readiness questions

Before calling your deployment production-ready, be able to answer yes to:

- Are source permissions authoritative end to end?
- Can revocation/deletion be proven?
- Can every consequential answer expose provenance and freshness?
- Can users distinguish requirements, approved practices, examples, and AI inference?
- Are source-owned files protected from autonomous AI edits?
- Is AI-generated knowledge reviewed before becoming authoritative?
- Is connector/admin access centrally managed?
- Are licensed/controlled documents handled under the organization's policies?
- Can another AI client use the Brain without rewriting core policy?

## 11. Contribute pilot findings back

Pilot failures are useful product evidence.

When sharing findings publicly:
- sanitize company/tenant information
- use synthetic reproductions where possible
- do not include credentials or restricted screenshots
- create focused issues with expected vs actual behavior

See `../CONTRIBUTING.md`.
