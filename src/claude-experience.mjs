const INSTITUTIONAL_HINTS = [
  'we ', 'our ', 'company', 'team', 'previous', 'before', 'last time', 'seed part', 'procedure', 'work instruction', 'standard', 'decision', 'lesson learned', 'example', 'similar', 'superseded', 'source'
];

export function shouldUseBrain(question,{force=false}={}) {
  if(force) return true;
  const q=(question??'').trim().toLowerCase();
  if(!q) return false;
  if(q.startsWith('search the brain')) return true;
  return INSTITUTIONAL_HINTS.some(h=>q.includes(h));
}

export function explicitBrainIntent(question) {
  const q=(question??'').toLowerCase();
  if(q.includes('show me the source') || q.includes('what source') || q.includes('sources are you using')) return 'source';
  if(q.includes('related work') || q.includes('similar work') || q.includes('what else is related')) return 'related';
  if(q.includes('superseded') || q.includes('newer revision') || q.includes('current revision')) return 'supersession';
  if(q.includes('conflict') || q.includes('contradict')) return 'conflicts';
  if(q.includes('add what we just learned to the brain') || q.includes('save this to the brain')) return 'propose';
  if(q.startsWith('search the brain')) return 'search';
  return null;
}

export async function answerWithCollectiveBrain({question,workspaceId,invoke,requestContext={},conversationEvidence=[]}) {
  const intent=explicitBrainIntent(question);
  if(intent==='propose') {
    const statement=conversationEvidence.at(-1)?.statement ?? question.replace(/add what we just learned to the brain/i,'').trim();
    const sources=conversationEvidence.flatMap(e=>e.sources??[]);
    const result=await invoke({tool:'brain_propose_knowledge',args:{workspaceId,statement,sources},requestContext});
    if(!result.ok) return {usedBrain:true,kind:'error',message:'I could not create a Brain contribution from this conversation.',detail:result.error};
    return {usedBrain:true,kind:'proposal',message:'I added this as a pending Collective Brain contribution for human review. It is not authoritative yet.',proposal:result.data};
  }

  if(!shouldUseBrain(question,{force:Boolean(intent)})) {
    return {usedBrain:false,kind:'general',message:'This question does not appear to require institutional memory. Answer using general Claude knowledge and clearly separate it from company guidance.'};
  }

  const result=await invoke({tool:'brain_search',args:{workspaceId,query:question},requestContext});
  if(!result.ok) return {usedBrain:true,kind:'error',message:'Collective Brain is unavailable or you do not have access to this Brain.',detail:result.error};
  const evidence=result.data?.evidence ?? [];
  if(!evidence.length) {
    return {usedBrain:true,kind:'no_result',message:'I did not find authorized Collective Brain evidence for that. Any additional answer should be labeled as general knowledge, not company guidance.',sources:[]};
  }

  const top=evidence[0];
  return {
    usedBrain:true,
    kind:'grounded',
    message:'I found relevant authorized Collective Brain evidence.',
    conclusion:{title:top.title,revision:top.revision,classification:top.classification,authority:top.authority},
    sources:evidence.slice(0,4).map(e=>({id:e.id,title:e.title,revision:e.revision,classification:e.classification,locations:e.locations?.map(l=>l.anchor)??[]})),
    warnings:evidence.filter(e=>e.status==='superseded').map(e=>`${e.title} Rev ${e.revision} is superseded`)
  };
}

export const employeePhrases = Object.freeze([
  'Search the Brain for ...',
  'Show me the source.',
  'Find related work.',
  'Check whether this is superseded.',
  'Are there conflicting sources?',
  'Add what we just learned to the Brain.'
]);
