# Employee A — Create a Collective Brain

## Who this is for

Use this guide when you are the first person setting up a team Brain.

You only need:
- Claude
- access to OneDrive/SharePoint or Box
- permission to create or select a shared folder

You do not need GitHub, Obsidian, a database, command-line tools, browser extensions, or local software.

## What you are creating

A Collective Brain is anchored to one shared cloud folder. The folder is the workspace boundary for the Brain.

The Brain is identified by:
- cloud provider
- provider-native folder/root ID

The display name can change later without creating a new Brain if the provider preserves the same native ID.

## Setup

1. Open Claude.
2. Enable **Collective Brain**.
3. Choose **Create Brain**.
4. Choose the storage provider:
   - OneDrive / SharePoint
   - Box
5. Choose one of:
   - create a new shared folder, or
   - select an existing shared folder.
6. Confirm that this folder should be the Brain root.
7. Collective Brain records the provider-native folder/root identity.
8. Share the folder with coworkers using the company’s normal OneDrive/SharePoint or Box sharing controls.
9. Confirm that the folder appears as connected in Claude.

## Recommended folder behavior

Keep the Brain simple at first. Employees should save normal work into the shared root or its subfolders.

Examples:
- PowerPoint presentations
- Word documents
- Excel workbooks
- PDFs
- review decks
- seed-part documentation
- lessons learned
- procedures and work instructions
- approved examples
- training material

Do not move unrelated sensitive content into the Brain solely to make Claude see it. Source-system permissions remain authoritative, but the Brain should still have a clear organizational purpose.

## After setup

Work normally.

When you create useful knowledge:
1. save it under the shared Brain folder;
2. keep using the company’s normal document naming/revision practices;
3. let Collective Brain index and connect it;
4. ask Claude questions naturally.

You do not need to manually maintain a second wiki.

## Inviting Employee B

Employee B does not need a special invitation from Collective Brain. Employee B needs normal access to the same shared cloud folder.

After the folder is shared, tell Employee B to follow `EMPLOYEE_B_JOIN_BRAIN.md`.

## Important permission rule

Creating a Brain does not change the source system’s access model.

Collective Brain may narrow what it returns, but it must never broaden access beyond OneDrive/SharePoint or Box permissions.

## Quick validation

After creating the Brain:
1. save a harmless test PowerPoint or document under the shared folder;
2. wait for the Brain to register the source;
3. ask Claude a question that can only be answered from that file;
4. verify Claude shows the source/revision/location;
5. have another authorized employee join the same Brain and ask the same question.
