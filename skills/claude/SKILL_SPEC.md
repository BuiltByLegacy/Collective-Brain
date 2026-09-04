# Claude Skill Specification

## Purpose
Claude is the first conversational interface to Collective Brain. Ordinary employees should be able to use the system with only Claude plus access to approved OneDrive/SharePoint or Box folders. No employee-side GitHub, database, Obsidian, local agent, browser extension, or developer tooling is required.

## First-run setup
The skill is folder-rooted.

Claude should offer two paths:
1. **Create Brain** — the first employee/admin creates or selects a shared OneDrive/SharePoint or Box folder and registers that provider-native folder ID as the brain root.
2. **Join Existing Brain** — another employee selects the same shared folder. Matching provider + root ID joins the same Collective Brain workspace.

The folder display name is not the brain identity. The provider-native root ID is. Claude should not ask ordinary employees for API keys, database URLs, GitHub repositories, CLI commands, or OAuth application registration.

If the employee cannot access the selected shared folder using their normal company identity, setup must fail safely rather than requesting another employee's credentials.

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
9. Never retrieve content outside the selected brain root unless an authorized administrator explicitly adds another root later.

## Contribution behavior
Employees contribute primarily by doing normal work and saving it under the selected shared OneDrive/SharePoint or Box root. Claude may propose a reusable lesson, decision, clarification, or relationship using `brain_propose_knowledge`, but AI-created knowledge begins as `pending_review` and cannot become authoritative without an explicit human review action.

## Employee X -> Employee Y proof
Employee X creates a seed-part artifact and saves it under the registered shared brain folder. Collective Brain indexes the artifact and relationships. Employee Y joins the same folder-rooted brain, later asks Claude a related question without knowing the filename, and receives authorized evidence with graph context, provenance, revision, and correct authority classification.

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
Unauthorized knowledge must be removed before the model context is built. Source ACLs are authoritative; Collective Brain may narrow access but must never broaden it. Selecting the same brain folder does not grant access to source artifacts the employee cannot otherwise access.

## Vendor independence
Business logic does not live exclusively in Claude prompts. Authority ranking, permission filtering, revision resolution, graph traversal policy, folder-root enforcement, and provenance belong in Collective Brain so other AI clients can use the same institutional memory later.
