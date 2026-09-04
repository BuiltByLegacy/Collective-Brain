# Claude Skill Specification

## Purpose
Claude is the first conversational interface to Collective Brain. Ordinary employees should be able to use the system with only Claude plus access to approved OneDrive/SharePoint or Box folders. No employee-side GitHub, database, Obsidian, local agent, browser extension, or developer tooling is required.

## Core behavior
When an employee asks an engineering or organizational question that could benefit from institutional knowledge, Claude should query Collective Brain before answering from general model knowledge.

Claude should use the vendor-neutral Brain tools rather than directly browsing raw storage whenever the Brain service is available:
- `brain_search`
- `brain_get_evidence`
- `brain_find_related`
- `brain_find_path`
- `brain_resolve_current`
- `brain_compare_authority`
- `brain_find_conflicts`
- `brain_propose_knowledge`

## Grounding contract
Claude must:
1. Prefer current, applicable, higher-authority evidence.
2. Preserve source artifact, revision, and source location in the answer.
3. Distinguish requirement/reference, approved practice, precedent/example, and supporting context.
4. State when retrieved sources conflict or are superseded.
5. Never treat an exemplar, training deck, working note, or model inference as a released requirement.
6. Never reveal artifacts, titles, graph relationships, counts, or snippets excluded by Collective Brain permissions.
7. Treat licensed-standard metadata as a pointer to the company's authorized source unless the organization has explicitly approved deeper indexing.
8. If no authorized institutional evidence exists, say so rather than inventing company guidance.

## Contribution behavior
Employees contribute primarily by doing normal work and saving it in approved OneDrive/SharePoint or Box locations. Claude may propose a reusable lesson, decision, clarification, or relationship using `brain_propose_knowledge`, but AI-created knowledge begins as `pending_review` and cannot become authoritative without an explicit human review action.

## Employee X -> Employee Y proof
Employee X creates a seed-part artifact and saves it to an approved shared folder. Collective Brain indexes the artifact and relationships. Employee Y later asks Claude a related question without knowing the filename. Claude retrieves the authorized evidence, applies graph context, and answers with provenance and the correct authority classification.

## Low-access enterprise rule
The skill must not assume that the employee can:
- install software,
- register OAuth applications,
- access a database,
- use GitHub,
- run command-line tools,
- administer OneDrive/SharePoint or Box,
- maintain a separate knowledge-base application.

Any setup requiring those capabilities belongs to a central administrator/service deployment, not the employee workflow.

## Safety rule
Unauthorized knowledge must be removed before the model context is built. Source ACLs are authoritative; Collective Brain may narrow access but must never broaden it.

## Vendor independence
Business logic does not live exclusively in Claude prompts. Authority ranking, permission filtering, revision resolution, graph traversal policy, and provenance belong in Collective Brain so other AI clients can use the same institutional memory later.
