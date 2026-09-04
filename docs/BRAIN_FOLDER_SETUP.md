# Brain Folder Setup

Collective Brain is rooted in one shared cloud folder. The folder identity is the workspace boundary.

## Setup choices

### Create a new brain
Employee A (or an administrator) chooses **Create Brain**, selects OneDrive/SharePoint or Box, and either creates or selects the shared folder that will become the brain root.

Collective Brain stores the provider-native root identifier and derives a stable workspace ID from it. The display name may change later without creating a new brain.

### Join an existing brain
Employee B chooses **Join Existing Brain** and selects the same shared folder. If the provider-native root ID matches, Claude joins the same Collective Brain workspace.

Employees do not exchange database credentials, API keys, GitHub repositories, or local configuration files. Sharing the cloud folder using the company's normal permission process is what grants potential access; Collective Brain still evaluates source-native permissions before evidence reaches Claude.

## Ordinary employee experience

1. Open Claude.
2. Start/setup Collective Brain.
3. Choose **Create Brain** or **Join Existing Brain**.
4. Choose **OneDrive/SharePoint** or **Box**.
5. Select the shared brain folder.
6. Continue working normally.

After setup, employees contribute by saving ordinary PowerPoint, Word, Excel, PDF, and supported engineering artifacts under that root. They ask questions in Claude; they do not maintain a separate wiki.

## Important rules

- Folder display name is not identity; provider + source root ID is identity.
- Content outside the selected root is never part of that brain unless another source root is explicitly added later by an authorized administrator.
- Selecting the same folder does not broaden source permissions.
- If Employee B cannot open a source artifact in OneDrive/SharePoint or Box, Collective Brain must not provide its content, title, graph path, or derived secret context to Employee B.
- Renaming/moving the root within the same source identity should preserve the workspace when the provider preserves its ID.
- Deletion, permission loss, and source disconnection must tombstone stale indexed evidence.

## V1 product intent

The ideal rollout requires ordinary employees to have only:
- Claude,
- their normal company identity,
- access to the approved OneDrive/SharePoint or Box folder.

Central IT/service setup may still be required to authorize the connector and hosted Brain service. That setup is intentionally separated from the employee workflow.
