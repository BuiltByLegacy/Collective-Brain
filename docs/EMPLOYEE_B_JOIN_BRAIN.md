# Employee B — Join an Existing Collective Brain

## Who this is for

Use this guide when another employee or administrator has already created the team Brain.

You only need:
- Claude
- normal access to the existing shared OneDrive/SharePoint or Box folder

You do not need GitHub, Obsidian, a database, command-line tools, browser extensions, or local software.

## Before you begin

Make sure the Brain folder has already been shared with you through the company’s normal cloud-storage process.

Collective Brain does not grant access to the folder. It uses the permissions your company already gives you.

## Setup

1. Open Claude.
2. Enable **Collective Brain**.
3. Choose **Join Existing Brain**.
4. Choose the storage provider:
   - OneDrive / SharePoint
   - Box
5. Browse to and select the shared Brain folder.
6. Confirm the selection.
7. Collective Brain resolves the provider + native folder/root ID.
8. If it matches an existing Brain, Claude joins you to that workspace.
9. Confirm that the Brain appears as connected.

## What happens next

You can now ask Claude normal work questions. You do not need to know filenames, folder structure, or which coworker created the source.

Examples:
- “What guidance do we already have for this?”
- “Has anyone documented a similar problem?”
- “Find me an example of this approach.”
- “Why did we make this decision?”
- “Is there anything newer that supersedes this?”
- “What source are you using?”

When relevant, Claude should search Collective Brain automatically.

## Permission behavior

Joining the same Brain does **not** mean every employee sees every file.

The shared Brain establishes the workspace. Your source-system access still determines what evidence you may retrieve.

For example:
- Employee A may be able to access Program A and Program B documents.
- Employee B may only be authorized for Program A.
- Both employees can join the same Brain root.
- Employee B must not receive Program B titles, snippets, graph relationships, or derived answers.

## Contributing

You contribute simply by doing your normal work and saving useful artifacts under the shared Brain folder, subject to the company’s normal policies and permissions.

You may also tell Claude:

> Add what we just learned to the Brain.

Claude should create a pending knowledge proposal linked to its evidence. The proposal does not become authoritative until a human review step approves it.

## Troubleshooting

If Claude says the folder is not an existing Brain:
- confirm you selected the exact shared folder, not a copy or similarly named folder;
- confirm you selected the same cloud provider;
- confirm you have access to the original folder;
- ask the Brain creator which folder was selected.

The folder name alone is not the Brain identity. Collective Brain uses the provider-native folder/root ID.
