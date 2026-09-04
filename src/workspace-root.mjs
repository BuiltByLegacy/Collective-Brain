import crypto from 'node:crypto';

const SUPPORTED_PROVIDERS = new Set(['onedrive-sharepoint', 'box']);

export function createBrainWorkspace({name='Collective Brain', provider, rootId, rootUrl=null, createdBy, mode='existing'}) {
  if (!SUPPORTED_PROVIDERS.has(provider)) throw new Error(`Unsupported provider: ${provider}`);
  if (!rootId) throw new Error('rootId is required');
  if (!createdBy) throw new Error('createdBy is required');
  if (!['create','existing'].includes(mode)) throw new Error('mode must be create or existing');
  return {
    workspaceId: `brain_${crypto.createHash('sha256').update(`${provider}:${rootId}`).digest('hex').slice(0,16)}`,
    name,
    provider,
    rootId,
    rootUrl,
    createdBy,
    mode,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
  };
}

export function sameBrainWorkspace(a,b) {
  return Boolean(a && b && a.provider === b.provider && a.rootId === b.rootId && a.workspaceId === b.workspaceId);
}

export function isInsideBrainRoot(workspace, artifact) {
  if (!workspace || !artifact) return false;
  if (workspace.provider !== artifact.provider) return false;
  return artifact.rootId === workspace.rootId;
}

export function employeeSetupSummary(workspace) {
  return {
    employeeNeeds: ['Claude access', `access to the shared ${workspace.provider} folder`],
    employeeDoesNotNeed: ['GitHub', 'CLI', 'database access', 'browser extension', 'OAuth app registration', 'Obsidian'],
    instruction: 'Select the same shared brain folder during Collective Brain setup. The folder identity, not its display name, defines the workspace.',
  };
}
