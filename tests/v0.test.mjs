import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCorpus, search, resolveCurrent, neighbors, evidenceBundle, groundedAnswer, createProposal, approveProposal} from '../src/brain.mjs';

const corpus=loadCorpus();
const eng={id:'employee-y',scopes:['engineering']};
const px={id:'employee-x',scopes:['engineering','program-x']};

test('finds seed-part evidence without filename hints',()=>{
  const r=search(corpus,'how are datum targets handled on weldment seed parts',eng);
  assert.equal(r[0].artifact.id,'SP-WELD-001-B');
});

test('current revision resolves and superseded is hidden by default',()=>{
  assert.equal(resolveCurrent(corpus,'SP-WELD-001',eng).revision,'B');
  assert.equal(search(corpus,'legacy datum target arrangement',eng).some(x=>x.artifact.id==='SP-WELD-001-A'),false);
  assert.equal(search(corpus,'legacy datum target arrangement',eng,{includeSuperseded:true}).some(x=>x.artifact.id==='SP-WELD-001-A'),true);
});

test('restricted best-match artifact is removed before model-facing bundle',()=>{
  const b=evidenceBundle(corpus,'Program X restricted datum targets weldment seed part',eng);
  assert.equal(b.evidence.some(e=>e.id==='PROG-X-SECRET'),false);
  const bx=evidenceBundle(corpus,'Program X restricted datum targets weldment seed part',px);
  assert.equal(bx.evidence.some(e=>e.id==='PROG-X-SECRET'),true);
});

test('graph traversal preserves accessible related context',()=>{
  const n=neighbors(corpus,'SP-WELD-001-B',eng);
  assert.ok(n.some(x=>x.type==='DERIVED_FROM' && x.target==='DEC-0042'));
});

test('grounded answer labels exemplar as precedent and provides provenance',()=>{
  const a=groundedAnswer(evidenceBundle(corpus,'datum targets weldment seed part',eng));
  assert.match(a.answer,/approved example\/precedent/i);
  assert.ok(a.sources.some(s=>s.id==='SP-WELD-001-B' && s.revision==='B' && s.locations.includes('slides 14-17')));
});

test('knowledge proposals remain pending until explicit review',()=>{
  const p=createProposal({statement:'Pattern 03 improved inspection accessibility.',sources:['DEC-0042'],proposer:'employee-y'});
  assert.equal(p.status,'pending_review');
  assert.equal(approveProposal(p,'mbe-lead').status,'approved');
});
