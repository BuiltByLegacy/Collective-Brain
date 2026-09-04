import { evidenceBundle, findConflicts, findPath, resolveCurrent, compareAuthority, createProposal } from './brain.mjs';
import { isInsideBrainRoot } from './workspace-root.mjs';

export function createBrainToolEndpoint({corpusProvider, workspaceProvider, identityProvider}) {
  if(!corpusProvider || !workspaceProvider || !identityProvider) throw new Error('corpusProvider, workspaceProvider, and identityProvider are required');

  return async function invoke({tool,args={},requestContext={}}){
    const identity=await identityProvider(requestContext);
    if(!identity) return {ok:false,error:'unauthenticated'};
    const workspace=await workspaceProvider(args.workspaceId, identity);
    if(!workspace) return {ok:false,error:'workspace_not_found_or_forbidden'};
    const corpus=(await corpusProvider(workspace,identity)).filter(a=>!a.provider || isInsideBrainRoot(workspace,a));

    switch(tool){
      case 'brain_search': return {ok:true,data:evidenceBundle(corpus,args.query??'',identity)};
      case 'brain_resolve_current': return {ok:true,data:resolveCurrent(corpus,args.logicalId,identity)};
      case 'brain_find_path': return {ok:true,data:findPath(corpus,args.from,args.to,identity,args.maxDepth??4)};
      case 'brain_find_conflicts': return {ok:true,data:findConflicts(corpus,args.artifactId,identity)};
      case 'brain_compare_authority': {
        const a=corpus.find(x=>x.id===args.a); const b=corpus.find(x=>x.id===args.b);
        if(!a||!b) return {ok:false,error:'evidence_not_found'};
        return {ok:true,data:compareAuthority(a,b)};
      }
      case 'brain_propose_knowledge': return {ok:true,data:createProposal({statement:args.statement,sources:args.sources??[],proposer:identity.id})};
      default: return {ok:false,error:'unknown_tool'};
    }
  };
}

export const employeeExperience = Object.freeze({
  required:['Claude','access to the selected shared brain folder'],
  notRequired:['GitHub','CLI','database access','browser extension','OAuth app registration','Obsidian'],
  setup:['Choose Create Brain or Join Existing Brain','Select the shared OneDrive/SharePoint or Box folder','Claude stores only the workspace identifier; source permissions remain authoritative'],
});
