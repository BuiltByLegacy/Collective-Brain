import crypto from 'node:crypto';
import { matchesApplicability, effectiveAt } from './memory.mjs';

export const MANIFEST_VERSION = '1.0.0';
export const INGEST_PIPELINE_VERSION = '1.0.0';

function hash(value){ return crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex'); }
function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function norm(text=''){ return String(text).toLowerCase().replace(/\s+/g,' ').trim(); }
function tokens(text=''){ return new Set(norm(text).replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean)); }
function jaccard(a,b){ const A=tokens(a),B=tokens(b); if(!A.size&&!B.size)return 1; let i=0; for(const x of A)if(B.has(x))i++; return i/(A.size+B.size-i||1); }
function canAccess(record,identity){ const scopes=record.scope??record.accessScope??[]; return Boolean(identity?.scopes)&&scopes.some(s=>identity.scopes.includes(s)); }

export function buildSourceManifest(input){
  const provider=input.provider;
  if(!provider) throw new Error('manifest missing provider');
  const nativeId=input.nativeId??input.sourceNativeId;
  if(!nativeId) throw new Error('manifest missing provider-native identity');
  const versionId=input.versionId??input.sourceVersionId??null;
  const canonicalUrl=input.canonicalUrl??input.canonicalSourceUrl??null;
  if(input.external!==false && !canonicalUrl) throw new Error('external manifest missing canonical source URL');
  const manifest={
    manifestVersion:MANIFEST_VERSION,
    artifactId:input.artifactId,
    revisionId:input.revisionId??versionId,
    provider,
    nativeId,
    versionId,
    canonicalUrl,
    parentUrl:input.parentUrl??null,
    location:input.location??null,
    contentHash:input.contentHash??(input.content!==undefined?`sha256:${hash(input.content)}`:null),
    sourceModifiedAt:input.sourceModifiedAt??null,
    retrievedAt:input.retrievedAt??new Date().toISOString(),
    aclRef:input.aclRef??null,
    state:input.state??'current',
    scope:[...(input.scope??[])],
    title:input.title??null
  };
  return manifest;
}

export function sourceIdentity(manifest){ return `${manifest.provider}:${manifest.nativeId}`; }
export function sourceRevisionIdentity(manifest){ return `${sourceIdentity(manifest)}:${manifest.versionId??manifest.revisionId??'unknown'}`; }
export function authorizedOpenAction(manifest,identity){
  if(!canAccess(manifest,identity)) return null;
  return manifest.canonicalUrl?{label:'Open source',url:manifest.canonicalUrl,nativeId:manifest.nativeId,versionId:manifest.versionId}:null;
}
export function verifyIndexedContent(manifest,{versionId,contentHash}={}){
  return {versionMatch:versionId==null||manifest.versionId==null||versionId===manifest.versionId,hashMatch:contentHash==null||manifest.contentHash==null||contentHash===manifest.contentHash};
}

export function classifyDocumentRelationship(a,b,{nearDuplicateThreshold=0.8}={}){
  if(sourceIdentity(a.manifest)===sourceIdentity(b.manifest)){
    if(a.manifest.versionId!==b.manifest.versionId || a.revision!==b.revision) return {kind:'revision',confidence:1};
  }
  if(a.manifest.contentHash && a.manifest.contentHash===b.manifest.contentHash) return {kind:'exact_duplicate',confidence:1};
  const score=jaccard(a.text??'',b.text??'');
  if(score>=nearDuplicateThreshold) return {kind:'near_duplicate',confidence:score,relation:'POSSIBLE_VARIANT_OF'};
  if(score>=0.35) return {kind:'overlapping_knowledge',confidence:score,relation:'RELATED_TO'};
  return {kind:'distinct',confidence:score};
}

export function buildDocumentFamilies(records,{nearDuplicateThreshold=0.8}={}){
  const families=[];
  const relations=[];
  const used=new Set();
  for(let i=0;i<records.length;i++){
    if(used.has(i))continue;
    const family=[records[i]]; used.add(i);
    for(let j=i+1;j<records.length;j++){
      if(used.has(j))continue;
      const rel=classifyDocumentRelationship(records[i],records[j],{nearDuplicateThreshold});
      if(['exact_duplicate','revision','near_duplicate'].includes(rel.kind)){
        family.push(records[j]); used.add(j); relations.push({from:records[i].id,to:records[j].id,...rel});
      }
    }
    families.push(family);
  }
  return {families,relations};
}

export function synthesizeKnowledgeConcept({conceptKey,evidence,statement=null,applicability={}}){
  if(!conceptKey) throw new Error('conceptKey required');
  const authorizedEvidence=[...evidence];
  const ranked=[...authorizedEvidence].sort((a,b)=>((b.authority??0)-(a.authority??0))||String(b.effectiveFrom??'').localeCompare(String(a.effectiveFrom??'')));
  const groups=new Map();
  for(const e of ranked){
    const key=norm(e.value??e.statement??e.text??'');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(e);
  }
  const currentApplicable=ranked.filter(e=>(e.status??'current')!=='superseded'&&matchesApplicability(e.applicability??{},applicability));
  const topAuthority=Math.max(-Infinity,...currentApplicable.map(e=>e.authority??0));
  const top=currentApplicable.filter(e=>(e.authority??0)===topAuthority);
  const values=[...new Set(top.map(e=>norm(e.value??e.statement??e.text??'')))];
  const unresolved=values.length>1;
  const winner=unresolved?null:top[0]??null;
  return {
    conceptKey,
    statement:statement??winner?.statement??winner?.value??null,
    applicability,
    status:unresolved?'unresolved_conflict':winner?'current':'unsupported',
    winnerId:winner?.id??null,
    supportingEvidence:authorizedEvidence.map(e=>e.id),
    conflicts:unresolved?top.map(e=>e.id):[],
    explanation:unresolved?'Equally authoritative, current, applicable evidence disagrees.':winner?`Selected ${winner.id} by applicability/current status/authority; mention count did not raise authority.`:'No applicable current evidence.'
  };
}

export function governingReference(record){
  for(const key of ['id','documentNumber','revision','authority','scope','applicability']) if(record[key]===undefined) throw new Error(`governing reference missing ${key}`);
  return {...record,memoryClass:'procedural',status:record.status??'current',mandatory:Boolean(record.mandatory)};
}
export function recallGoverningReferences(references,identity,{applicability={},at=new Date(),limit=6}={}){
  return references.filter(r=>canAccess(r,identity)).filter(r=>(r.status??'current')!=='superseded').filter(r=>effectiveAt(r,at)).filter(r=>matchesApplicability(r.applicability??{},applicability)).sort((a,b)=>(Number(Boolean(b.mandatory))-Number(Boolean(a.mandatory)))||((b.authority??0)-(a.authority??0))).slice(0,limit);
}
export function historicalGoverningReference(references,documentNumber,identity,{at,applicability={}}){
  return references.filter(r=>r.documentNumber===documentNumber&&canAccess(r,identity)).filter(r=>effectiveAt(r,at)&&matchesApplicability(r.applicability??{},applicability)).sort((a,b)=>(b.authority??0)-(a.authority??0))[0]??null;
}

export class ReviewRouter{
  constructor({domainReviewers={},overrides={}}={}){ this.domainReviewers=domainReviewers; this.overrides=overrides; this.events=[]; }
  route(event,identity){
    const key=[event.brain,event.domain].filter(Boolean).join(':');
    const reviewer=this.overrides[key]??this.domainReviewers[event.domain]??null;
    if(!reviewer)return {...event,status:'unrouted',reviewer:null};
    const requiredScopes=[...(event.requiredScopes??[])];
    const reviewerScopes=reviewer.scopes??[];
    if(requiredScopes.some(s=>!reviewerScopes.includes(s))) return {...event,status:'blocked_reviewer_unauthorized',reviewer:reviewer.id};
    const routed={id:event.id??`REVIEW-${crypto.randomUUID()}`,...event,status:'pending_review',reviewer:reviewer.id,createdAt:event.createdAt??new Date().toISOString()};
    this.events.push(routed); return routed;
  }
  resolve(id,{actor,decision,rationale,before=null,after=null}){
    const e=this.events.find(x=>x.id===id); if(!e)throw new Error('review event not found');
    if(actor!==e.reviewer)throw new Error('reviewer not authorized');
    Object.assign(e,{status:'resolved',decision,rationale,before,after,resolvedAt:new Date().toISOString(),resolvedBy:actor}); return e;
  }
}

export class IngestionPipeline{
  constructor({maxQueue=1000,concurrency=4,classifierVersion='1.0.0'}={}){
    this.maxQueue=maxQueue; this.concurrency=concurrency; this.classifierVersion=classifierVersion; this.queue=[]; this.deadLetter=[]; this.processed=new Map(); this.metrics={accepted:0,processed:0,retried:0,unchanged:0,quarantined:0,aclPriority:0};
  }
  enqueue(job){
    if(this.queue.length>=this.maxQueue) throw new Error('ingestion backpressure: queue full');
    const normalized={attempts:0,priority:job.kind==='acl_change'||job.kind==='delete'?0:10,...job};
    if(normalized.kind==='acl_change')this.metrics.aclPriority++;
    this.queue.push(normalized); this.queue.sort((a,b)=>a.priority-b.priority); this.metrics.accepted++; return normalized;
  }
  processOne(handler){
    const job=this.queue.shift(); if(!job)return null;
    const key=job.idempotencyKey??`${job.provider}:${job.nativeId}:${job.versionId??''}:${job.kind??'upsert'}`;
    const prior=this.processed.get(key);
    if(prior && prior.contentHash && job.contentHash && prior.contentHash===job.contentHash){ this.metrics.unchanged++; return {status:'unchanged',job}; }
    try{
      const output=handler(job,{pipelineVersion:INGEST_PIPELINE_VERSION,classifierVersion:this.classifierVersion});
      this.processed.set(key,{contentHash:job.contentHash,output}); this.metrics.processed++; return {status:'processed',job,output};
    }catch(error){
      job.attempts++;
      if(job.attempts<(job.maxAttempts??3)){ this.metrics.retried++; this.queue.push(job); this.queue.sort((a,b)=>a.priority-b.priority); return {status:'retry',job,error:String(error.message??error)}; }
      this.metrics.quarantined++; const item={job,error:String(error.message??error),quarantinedAt:new Date().toISOString()}; this.deadLetter.push(item); return {status:'quarantined',...item};
    }
  }
  drain(handler){ const out=[]; while(this.queue.length)out.push(this.processOne(handler)); return out; }
  health(){ return {pipelineVersion:INGEST_PIPELINE_VERSION,classifierVersion:this.classifierVersion,queueDepth:this.queue.length,deadLetter:this.deadLetter.length,...this.metrics}; }
}

export function classifyMemoryCandidate(candidate){
  if(candidate.governing||candidate.type==='procedure'||candidate.type==='standard')return 'procedural';
  if(candidate.resolvedExperience||candidate.type==='lesson_learned'||candidate.type==='incident')return 'episodic';
  if(candidate.durableFact||candidate.conceptKey)return 'semantic';
  return 'evidence_only';
}

export function ingestArtifact(job,{existing=[]}={}){
  const manifest=buildSourceManifest(job.manifest);
  const record={id:job.id,manifest,text:job.text??'',revision:job.revision??manifest.revisionId,authority:job.authority??0,scope:job.scope??manifest.scope,applicability:job.applicability??{},status:job.status??'current'};
  const duplicateRelations=existing.map(x=>({otherId:x.id,...classifyDocumentRelationship(record,x)})).filter(x=>x.kind!=='distinct');
  return {record,duplicateRelations,memoryClass:classifyMemoryCandidate(job),classifierVersion:job.classifierVersion??'1.0.0'};
}
