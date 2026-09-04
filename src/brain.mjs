import fs from 'node:fs';
import crypto from 'node:crypto';

export function loadCorpus(path='data/corpus.json') {
  const raw = fs.readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.artifacts.map(a => ({...a, contentHash: crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex')}));
}

export function canAccess(artifact, identity) {
  return artifact.scope.some(s => identity.scopes.includes(s));
}

export function tokenize(text) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(Boolean));
}

export function relevance(query, artifact) {
  const q = tokenize(query);
  const body = tokenize([artifact.title, ...artifact.locations.map(x=>x.text)].join(' '));
  let hit = 0; for (const t of q) if (body.has(t)) hit++;
  return q.size ? hit/q.size : 0;
}

export function search(corpus, query, identity, {includeSuperseded=false, limit=5}={}) {
  return corpus
    .filter(a => canAccess(a, identity))
    .filter(a => includeSuperseded || a.status !== 'superseded')
    .map(a => ({artifact:a, relevance:relevance(query,a)}))
    .filter(x => x.relevance > 0)
    .sort((a,b) => (b.relevance-a.relevance) || (b.artifact.authority-a.artifact.authority))
    .slice(0,limit);
}

export function resolveCurrent(corpus, logicalId, identity) {
  return corpus.filter(a=>a.logicalId===logicalId && a.status==='current' && canAccess(a,identity))
    .sort((a,b)=>b.authority-a.authority)[0] ?? null;
}

export function neighbors(corpus, id, identity) {
  const allowed = new Map(corpus.filter(a=>canAccess(a,identity)).map(a=>[a.id,a]));
  const source = allowed.get(id); if (!source) return [];
  return source.relationships
    .map(([type,target])=>({type,target,artifact:allowed.get(target) ?? null}))
    .filter(x=>x.artifact || !corpus.some(a=>a.id===x.target));
}

export function findPath(corpus, from, to, identity, maxDepth=4) {
  const allowedIds = new Set(corpus.filter(a=>canAccess(a,identity)).map(a=>a.id));
  if (!allowedIds.has(from) || !allowedIds.has(to)) return null;
  const graph = new Map();
  for (const a of corpus) if (allowedIds.has(a.id)) graph.set(a.id, a.relationships.filter(([,t])=>allowedIds.has(t)));
  const queue=[[from,[]]]; const seen=new Set([from]);
  while(queue.length){ const [cur,path]=queue.shift(); if(path.length>=maxDepth) continue;
    for(const [type,next] of graph.get(cur)??[]){ const p=[...path,{from:cur,type,to:next}]; if(next===to) return p; if(!seen.has(next)){seen.add(next);queue.push([next,p]);}}
  }
  return null;
}

export function findConflicts(corpus, artifactId, identity) {
  const a = corpus.find(x=>x.id===artifactId && canAccess(x,identity)); if(!a) return [];
  return a.relationships.filter(([t])=>t==='CONFLICTS_WITH').map(([,target])=>corpus.find(x=>x.id===target && canAccess(x,identity))).filter(Boolean);
}

export function evidenceBundle(corpus, query, identity) {
  const results = search(corpus,query,identity,{limit:6});
  const evidence = results.map(({artifact,relevance})=>({
    id:artifact.id,title:artifact.title,revision:artifact.revision,type:artifact.type,authority:artifact.authority,status:artifact.status,relevance,
    locations:artifact.locations,relationships:artifact.relationships,
    classification: artifact.type==='released_procedure' || artifact.type==='licensed_standard_metadata' ? 'requirement_or_reference' : artifact.type==='approved_decision' ? 'approved_practice' : artifact.type==='approved_exemplar' ? 'precedent_example' : 'supporting_context'
  }));
  return {query,identity:identity.id,evidence};
}

export function compareAuthority(a,b){ return a.authority===b.authority ? 'equal' : a.authority>b.authority ? a.id : b.id; }

export function createProposal({statement,sources,proposer}) {
  return {id:`PROP-${crypto.randomUUID()}`,statement,sources,proposer,status:'pending_review',createdAt:new Date().toISOString()};
}

export function approveProposal(proposal, reviewer) { return {...proposal,status:'approved',reviewer,reviewedAt:new Date().toISOString()}; }
export function rejectProposal(proposal, reviewer) { return {...proposal,status:'rejected',reviewer,reviewedAt:new Date().toISOString()}; }

export function groundedAnswer(bundle) {
  if(!bundle.evidence.length) return {answer:'No authorized institutional evidence was found. Do not infer company guidance.',sources:[]};
  const sorted=[...bundle.evidence].sort((a,b)=>b.authority-a.authority || b.relevance-a.relevance);
  const top=sorted[0];
  const exemplar=sorted.find(e=>e.type==='approved_exemplar');
  const conflicts=sorted.filter(e=>e.relationships.some(([t])=>t==='CONFLICTS_WITH'));
  const lines=[];
  if(exemplar) lines.push(`The current approved exemplar is ${exemplar.title} Rev ${exemplar.revision}; it demonstrates the documented seed-part approach.`);
  if(top.type==='released_procedure') lines.push(`The highest-authority retrieved company guidance is ${top.title} Rev ${top.revision}.`);
  if(exemplar) lines.push('Treat the seed part as an approved example/precedent, not as the standards requirement itself.');
  if(conflicts.length) lines.push('Conflicting lower-authority working material exists and should not override current approved guidance.');
  return {answer:lines.join(' '),sources:sorted.slice(0,4).map(e=>({id:e.id,title:e.title,revision:e.revision,locations:e.locations.map(l=>l.anchor),authority:e.authority,classification:e.classification}))};
}
