# Collective Brain Pilot Package

This package is for a team that wants to test Collective Brain against a real shared folder without using sensitive company information.

## Goal

Prove one simple outcome:

> One teammate creates useful work in the team's normal shared folder. Later, another teammate asks the AI a normal question without knowing the file exists, and Collective Brain finds the right authorized source with provenance, revision, relationships, and freshness context.

## Recommended pilot

Use 2–5 people, one shared OneDrive/SharePoint or Box folder, and synthetic or non-sensitive files.

### Roles

- **Pilot owner** — creates the Brain and records results.
- **Employee A** — adds/updates source material.
- **Employee B** — asks questions without filename hints.
- **Optional reviewer** — validates authority, provenance, and knowledge proposals.

### Suggested test content

Create 4–8 small files that represent normal team knowledge:

1. one current approved example
2. one older/superseded revision
3. one higher-authority procedure or decision
4. one lower-authority working note
5. one restricted artifact for a permission-negative test
6. one unrelated file for retrieval noise

Do not use proprietary, regulated, licensed, or customer-sensitive information for an initial pilot.

## Pilot sequence

1. Run the local synthetic proof with `npm test` and `npm run poc`.
2. Create a real Brain rooted in a pilot folder.
3. Have Employee B join the exact same provider-native folder.
4. Add pilot files and confirm ingestion.
5. Ask a normal question without filename hints.
6. Verify source, revision, authority, relationship context, and freshness.
7. Update a source mid-session and verify stale evidence is refreshed or warned.
8. Revoke access to one artifact and verify no title/snippet/relationship leakage.
9. Move/delete an artifact outside the root and verify it stops being retrievable.
10. Ask the Brain to capture a lesson and verify the result stays pending review.
11. Record results in `SCORECARD.md`.

## Pass criteria

A pilot is successful when the team can say:

- we found useful prior work without knowing its filename
- the answer showed where the information came from
- current/higher-authority information won over stale or lower-authority material
- restricted content stayed restricted
- source files were not autonomously edited
- AI-created reusable knowledge stayed pending review
- employees did not need to learn a separate knowledge-management application

## Files in this package

- `SCORECARD.md` — reusable pilot evaluation form
- `CLAUDE_VALIDATION_PROMPT.md` — operator prompt for a real-folder test
- `PILOT_CONTENT_PLAN.md` — example synthetic content set

If the pilot exposes a defect, use the GitHub bug template. If it exposes a usability or adoption lesson, use the adopter feedback template.