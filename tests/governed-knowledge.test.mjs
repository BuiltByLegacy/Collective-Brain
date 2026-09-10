import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceManifest, sourceIdentity, authorizedOpenAction, verifyIndexedContent,
  classifyDocumentRelationship, buildDocumentFamilies, synthesizeKnowledgeConcept,
  governingReference, recallGoverningReferences, historicalGoverningReference,
  ReviewRouter, IngestionPipeline, classifyMemoryCandidate, ingestArtifact
} from '../src/governed-knowledge.mjs';

const eng={id:'eng-user',scopes:['engineering']};
const secret={id:'secret-user',scopes:['engineering','program-x']};

function manifest(overrides={}){
  return buildSourceManifest({artifactId:'A',revisionId:'1',provider:'sharepoint',nativeId:'native-1',versionId:'1',canonicalUrl:'https://example.test/doc',content:'hello',scope:['engineering'],...overrides});
}

test('source manifest preserves durable identity, revision proof, and permission-safe open action',()=>{
  const a=manifest();
  const moved=manifest({canonicalUrl:'https://example.test/new-path'});
  assert.equal(sourceIdentity(a),sourceIdentity(moved));
  assert.ok(a.contentHash.startsWith('sha256:'));
  assert.deepEqual(verifyIndexedContent(a,{versionId:'1',contentHash:a.contentHash}),{versionMatch:true,hashMatch:true});
  assert.equal(authorizedOpenAction(a,eng).url,'https://example.test/doc');
  assert.equal(authorizedOpenAction(a,{id:'nope',scopes:['finance']}),null);
});

test('document relationship classification distinguishes duplicate, revision, variant, and overlap without ACL union',()=>{
  const base={id:'a',manifest:manifest({nativeId:'n1',versionId:'1',content:'same'}),revision:'A',text:'weld crack near toe after thermal cycling'};
  const exact={id:'b',manifest:manifest({nativeId:'n2',versionId:'1',content:'same'}),revision:'A',text:base.text};
  const rev={id:'c',manifest:manifest({nativeId:'n1',versionId:'2',content:'updated'}),revision:'B',text:'updated weld crack near toe after thermal cycling'};
  const variant={id:'d',manifest:manifest({nativeId:'n3',versionId:'1',content:'variant'}),revision:'A',text:'weld crack near toe after thermal cycling observed repeatedly'};
  assert.equal(classifyDocumentRelationship(base,exact).kind,'exact_duplicate');
  assert.equal(classifyDocumentRelationship(base,rev).kind,'revision');
  assert.equal(classifyDocumentRelationship(base,variant,{nearDuplicateThreshold:0.7}).kind,'near_duplicate');
  const fam=buildDocumentFamilies([base,exact,rev,variant],{nearDuplicateThreshold:0.7});
  assert.equal(fam.families.length,1);
});

test('knowledge concept authority beats mention count and unresolved equal-authority disagreement is explicit',()=>{
  const working=Array.from({length:5},(_,i)=>({id:`w${i}`,value:'2.0 mm',authority:20,status:'current',applicability:{program:'A'}}));
  const std={id:'std',value:'2.5 mm',authority:90,status:'current',applicability:{program:'A'}};
  const concept=synthesizeKnowledgeConcept({conceptKey:'min-wall',evidence:[...working,std],applicability:{program:'A'}});
  assert.equal(concept.winnerId,'std');
  const conflict=synthesizeKnowledgeConcept({conceptKey:'pressure',evidence:[{id:'a',value:'120 psi',authority:90,status:'current',applicability:{program:'A'}},{id:'b',value:'150 psi',authority:90,status:'current',applicability:{program:'A'}}],applicability:{program:'A'}});
  assert.equal(conflict.status,'unresolved_conflict');
  assert.deepEqual(new Set(conflict.conflicts),new Set(['a','b']));
  const scoped=synthesizeKnowledgeConcept({conceptKey:'pressure',evidence:[{id:'a',value:'120 psi',authority:90,status:'current',applicability:{program:'A'}},{id:'b',value:'150 psi',authority:90,status:'current',applicability:{program:'B'}}],applicability:{program:'A'}});
  assert.equal(scoped.winnerId,'a');
});

test('governing references are applicability/effective-date driven and permission safe',()=>{
  const refs=[
    governingReference({id:'old',documentNumber:'STD-1',revision:'C',authority:90,scope:['engineering'],applicability:{process:'welding'},mandatory:true,effectiveFrom:'2024-01-01',effectiveTo:'2026-01-01'}),
    governingReference({id:'new',documentNumber:'STD-1',revision:'D',authority:90,scope:['engineering'],applicability:{process:'welding'},mandatory:true,effectiveFrom:'2026-01-01'}),
    governingReference({id:'mach',documentNumber:'STD-2',revision:'A',authority:100,scope:['engineering'],applicability:{process:'machining'},mandatory:true,effectiveFrom:'2026-01-01'}),
    governingReference({id:'secret',documentNumber:'STD-X',revision:'A',authority:100,scope:['program-x'],applicability:{process:'welding'},mandatory:true,effectiveFrom:'2026-01-01'})
  ];
  const current=recallGoverningReferences(refs,eng,{applicability:{process:'welding'},at:new Date('2026-09-01')});
  assert.deepEqual(current.map(x=>x.id),['new']);
  assert.equal(historicalGoverningReference(refs,'STD-1',eng,{applicability:{process:'welding'},at:new Date('2025-06-01')}).id,'old');
  assert.equal(recallGoverningReferences(refs,secret,{applicability:{process:'welding'},at:new Date('2026-09-01')}).some(x=>x.id==='secret'),true);
});

test('review router requires accountable authorized reviewer and records resolution audit',()=>{
  const router=new ReviewRouter({domainReviewers:{welding:{id:'weld-sme',scopes:['engineering']},security:{id:'sec-sme',scopes:['security']}}});
  const routed=router.route({domain:'welding',brain:'engineering',kind:'unresolved_conflict',requiredScopes:['engineering']},eng);
  assert.equal(routed.status,'pending_review');
  assert.equal(routed.reviewer,'weld-sme');
  const denied=router.route({domain:'security',kind:'conflict',requiredScopes:['program-x']},eng);
  assert.equal(denied.status,'blocked_reviewer_unauthorized');
  const resolved=router.resolve(routed.id,{actor:'weld-sme',decision:'supersession',rationale:'Rev D controls',before:{revision:'C'},after:{revision:'D'}});
  assert.equal(resolved.status,'resolved');
  assert.equal(resolved.decision,'supersession');
});

test('ingestion pipeline prioritizes ACL changes, retries deterministically, quarantines malformed work, and short-circuits unchanged content',()=>{
  const p=new IngestionPipeline({maxQueue:10});
  p.enqueue({provider:'sharepoint',nativeId:'doc',versionId:'1',kind:'upsert',contentHash:'h1'});
  p.enqueue({provider:'sharepoint',nativeId:'doc',versionId:'acl2',kind:'acl_change'});
  const first=p.processOne(job=>job.kind);
  assert.equal(first.job.kind,'acl_change');
  const second=p.processOne(job=>({ok:true,kind:job.kind}));
  assert.equal(second.status,'processed');
  p.enqueue({provider:'sharepoint',nativeId:'doc',versionId:'1',kind:'upsert',contentHash:'h1'});
  assert.equal(p.processOne(()=>{throw new Error('should not execute');}).status,'unchanged');
  p.enqueue({provider:'box',nativeId:'bad',versionId:'1',kind:'upsert',maxAttempts:2});
  assert.equal(p.processOne(()=>{throw new Error('bad file');}).status,'retry');
  assert.equal(p.processOne(()=>{throw new Error('bad file');}).status,'quarantined');
  const health=p.health();
  assert.equal(health.deadLetter,1);
  assert.equal(health.aclPriority,1);
});

test('ingestion classification separates semantic episodic procedural and evidence-only paths',()=>{
  assert.equal(classifyMemoryCandidate({durableFact:true}),'semantic');
  assert.equal(classifyMemoryCandidate({resolvedExperience:true}),'episodic');
  assert.equal(classifyMemoryCandidate({governing:true}),'procedural');
  assert.equal(classifyMemoryCandidate({type:'working_note'}),'evidence_only');
  const out=ingestArtifact({id:'x',manifest:{artifactId:'x',revisionId:'1',provider:'box',nativeId:'b1',versionId:'1',canonicalUrl:'https://box.test/x',content:'x',scope:['engineering']},text:'current released rule',scope:['engineering'],governing:true});
  assert.equal(out.memoryClass,'procedural');
  assert.equal(out.record.manifest.provider,'box');
});
