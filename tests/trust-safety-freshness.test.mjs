import test from 'node:test';
import assert from 'node:assert/strict';
import { assertWriteAllowed, writeBrainOwned, advisoryRecommendation } from '../src/safety-policy.mjs';
import { snapshotEvidence, freshnessState, refreshBeforeDecision } from '../src/freshness.mjs';
import { evidenceBundle, createProposal } from '../src/brain.mjs';

test('source-owned artifacts cannot be mutated by Collective Brain',()=>{
  assert.throws(()=>assertWriteAllowed({id:'file-1',ownership:'source_owned'}),e=>e.code==='source_mutation_forbidden');
});

test('brain-owned state can be updated and recommendations remain advisory',()=>{
  const record={id:'idx-1',kind:'brain_index',ownership:'brain_owned'};
  assert.equal(writeBrainOwned(record,{cursor:'next'}).cursor,'next');
  const recommendation=advisoryRecommendation({issue:'conflict detected',sourceIds:['A'],suggestedAction:'review source'});
  assert.equal(recommendation.status,'pending_review');
  assert.equal(recommendation.authority,'machine_generated');
});

test('AI-created proposals are brain-owned pending review and machine generated',()=>{
  const proposal=createProposal({statement:'lesson',sources:['A'],proposer:'employee-y'});
  assert.equal(proposal.ownership,'brain_owned');
  assert.equal(proposal.status,'pending_review');
  assert.equal(proposal.authority,'machine_generated');
});

test('snapshot records read time, version and configurable staleness',()=>{
  const artifact={type:'approved_exemplar',revision:'B',modifiedAt:'2026-09-04T12:00:00.000Z'};
  const snapshot=snapshotEvidence(artifact,{readAt:new Date('2026-09-04T13:00:00.000Z'),policy:{thresholdMs:3600000}});
  assert.equal(snapshot.sourceVersion,'B');
  assert.equal(snapshot.sourceModifiedAt,'2026-09-04T12:00:00.000Z');
  assert.equal(freshnessState(snapshot,{now:new Date('2026-09-04T13:30:00.000Z')}).stale,false);
  assert.equal(freshnessState(snapshot,{now:new Date('2026-09-04T14:01:00.000Z')}).stale,true);
});

test('stale consequential evidence refreshes when possible',async()=>{
  const artifact={id:'A',type:'approved_exemplar',revision:'A'};
  const snapshot=snapshotEvidence(artifact,{readAt:new Date('2026-09-04T10:00:00.000Z'),policy:{thresholdMs:3600000}});
  const result=await refreshBeforeDecision({artifact,snapshot,consequential:true,policy:{thresholdMs:3600000},now:new Date('2026-09-04T12:00:00.000Z'),refresh:async()=>({...artifact,revision:'B'})});
  assert.equal(result.refreshed,true);
  assert.equal(result.artifact.revision,'B');
  assert.equal(result.warning,null);
});

test('stale consequential evidence warns when refresh is unavailable',async()=>{
  const artifact={id:'A',type:'approved_exemplar',revision:'A'};
  const snapshot=snapshotEvidence(artifact,{readAt:new Date('2026-09-04T10:00:00.000Z'),policy:{thresholdMs:3600000}});
  const result=await refreshBeforeDecision({artifact,snapshot,consequential:true,now:new Date('2026-09-04T12:00:00.000Z')});
  assert.equal(result.refreshed,false);
  assert.match(result.warning,/last checked/i);
});

test('evidence bundle carries readAt and source version for Employee B snapshot awareness',()=>{
  const corpus=[{id:'A',logicalId:'A',title:'Shared Analysis',type:'approved_exemplar',revision:'B',status:'current',authority:60,scope:['team'],locations:[{anchor:'slide 2',text:'datum targets'}],relationships:[],modifiedAt:'2026-09-04T11:30:00.000Z'}];
  const bundle=evidenceBundle(corpus,'datum targets',{id:'employee-b',scopes:['team']},{readAt:new Date('2026-09-04T11:45:00.000Z')});
  assert.equal(bundle.evidence[0].freshness.readAt,'2026-09-04T11:45:00.000Z');
  assert.equal(bundle.evidence[0].freshness.sourceVersion,'B');
});
