import {search, evidenceBundle, neighbors, findPath, resolveCurrent, compareAuthority, findConflicts, createProposal} from './brain.mjs';

export function createBrainTools(corpus, identity) {
  return {
    brain_search: ({query, includeSuperseded=false, limit=5}) => search(corpus,query,identity,{includeSuperseded,limit}).map(x=>({id:x.artifact.id,title:x.artifact.title,revision:x.artifact.revision,type:x.artifact.type,authority:x.artifact.authority,relevance:x.relevance})),
    brain_get_evidence: ({query}) => evidenceBundle(corpus,query,identity),
    brain_find_related: ({id}) => neighbors(corpus,id,identity),
    brain_find_path: ({from,to,maxDepth=4}) => findPath(corpus,from,to,identity,maxDepth),
    brain_resolve_current: ({logicalId}) => resolveCurrent(corpus,logicalId,identity),
    brain_compare_authority: ({firstId,secondId}) => {
      const a=corpus.find(x=>x.id===firstId), b=corpus.find(x=>x.id===secondId);
      if(!a||!b) return {error:'not_found'};
      if(!a.scope.some(s=>identity.scopes.includes(s)) || !b.scope.some(s=>identity.scopes.includes(s))) return {error:'not_authorized'};
      return {winner:compareAuthority(a,b)};
    },
    brain_find_conflicts: ({id}) => findConflicts(corpus,id,identity).map(x=>({id:x.id,title:x.title,revision:x.revision,authority:x.authority})),
    brain_propose_knowledge: ({statement,sources}) => createProposal({statement,sources,proposer:identity.id})
  };
}

export const toolSchemas = {
  brain_search:{required:['query']}, brain_get_evidence:{required:['query']}, brain_find_related:{required:['id']}, brain_find_path:{required:['from','to']}, brain_resolve_current:{required:['logicalId']}, brain_compare_authority:{required:['firstId','secondId']}, brain_find_conflicts:{required:['id']}, brain_propose_knowledge:{required:['statement','sources']}
};
