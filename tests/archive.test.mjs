import test from 'node:test';
import assert from 'node:assert/strict';
import {EnterpriseArchive,stableBrainDocumentId,partitionKey} from '../src/archive.mjs';

const eng={id:'eng',scopes:['engineering']};
const secret={id:'secret',scopes:['engineering','program-x']};

function seeded(now='2026-09-10T12:00:00Z'){
  const a=new EnterpriseArchive({now:()=>new Date(now)});
  const doc=a.registerDocument({organization:'lemery',brain:'engineering',logicalKey:'PROC-102',title:'MBD Procedure 102',documentType:'procedure',owner:'weld-sme',domain:'welding',scope:['engineering'],authority:90,lastVerifiedAt:'2026-09-09T12:00:00Z'});
  const r1=a.addRevision(doc.id,{revisionLabel:'C',contentHash:'hash-c',providerVersionId:'v3',effectiveFrom:'2025-01-01'});
  const l1=a.addSourceLocation(doc.id,r1.id,{provider:'sharepoint',nativeId:'native-proc-102',providerVersionId:'v3',url:'https://sharepoint.test/proc102',path:'/Engineering/PROC-102.docx',scope:['engineering'],sourceOfTruth:true});
  return {a,doc,r1,l1};
}

test('stable BrainDocument identity survives rename and source move',()=>{
  const one=stableBrainDocumentId({organization:'lemery',brain:'engineering',logicalKey:'PROC-102'});
  const two=stableBrainDocumentId({organization:'lemery',brain:'engineering',logicalKey:'PROC-102'});
  assert.equal(one,two);
  const {a,doc,r1}=seeded();
  const moved=a.addSourceLocation(doc.id,r1.id,{provider:'sharepoint',nativeId:'native-proc-102',providerVersionId:'v3b',url:'https://sharepoint.test/new/proc102',path:'/New/PROC-102.docx',scope:['engineering'],sourceOfTruth:true});
  assert.equal(a.documents.size,1);
  assert.equal(a.documents.get(doc.id).canonicalLocationId,moved.id);
});

test('revision family is non-destructive and current revision is deterministic',()=>{
  const {a,doc,r1}=seeded();
  const r2=a.addRevision(doc.id,{revisionLabel:'D',contentHash:'hash-d',providerVersionId:'v4',effectiveFrom:'2026-01-01'});
  assert.equal(a.revisions.get(r1.id).status,'superseded');
  assert.equal(a.revisions.get(r1.id).supersededBy,r2.id);
  assert.equal(a.documents.get(doc.id).currentRevisionId,r2.id);
  const fam=a.documentFamily(doc.id,eng);
  assert.equal(fam.revisions.length,2);
});

test('same content across locations does not create another logical document or authority',()=>{
  const {a,doc,r1}=seeded();
  a.addSourceLocation(doc.id,r1.id,{provider:'box',nativeId:'box-copy',url:'https://box.test/copy',scope:['engineering'],contentHash:'hash-c'});
  assert.equal(a.documents.size,1);
  assert.equal(a.locations.size,2);
  assert.equal(a.documents.get(doc.id).authority,90);
});

test('archive lifecycle supports reindex recovery and rejects impossible transitions',()=>{
  const {a,doc}=seeded();
  a.transition(doc.id,'needs_reindex',{reason:'extractor changed'});
  a.markIndexed(doc.id);
  assert.equal(a.documents.get(doc.id).lifecycleState,'indexed');
  const q=a.registerDocument({logicalKey:'BAD',title:'Bad',scope:['engineering'],documentType:'note',lifecycleState:'quarantined'});
  assert.throws(()=>a.transition(q.id,'archived'),/invalid archive transition/);
});

test('tombstone preserves lineage and reassigns canonical source when mirror remains',()=>{
  const {a,doc,r1,l1}=seeded();
  const mirror=a.addSourceLocation(doc.id,r1.id,{provider:'box',nativeId:'box-copy',url:'https://box.test/copy',scope:['engineering']});
  a.tombstoneLocation(l1.id,{reason:'sharepoint source deleted'});
  assert.equal(a.locations.get(l1.id).status,'tombstoned');
  assert.equal(a.documents.get(doc.id).canonicalLocationId,mirror.id);
  assert.equal(a.documents.get(doc.id).lifecycleState,'indexed');
});

test('permission filtering blocks document enumeration, source open, details and facet leaks',()=>{
  const {a}=seeded();
  const hidden=a.registerDocument({brain:'secret',logicalKey:'X',title:'Program X Secret',documentType:'study',scope:['program-x'],owner:'x'});
  const hr=a.addRevision(hidden.id,{revisionLabel:'A',contentHash:'secret'});
  a.addSourceLocation(hidden.id,hr.id,{provider:'sharepoint',nativeId:'secret',url:'https://secret.test',scope:['program-x']});
  assert.equal(a.archiveQuery(eng).items.some(x=>x.id===hidden.id),false);
  assert.throws(()=>a.documentDetail(hidden.id,eng),/document not found/);
  assert.equal(a.facets(eng).brain.secret,undefined);
  assert.equal(a.archiveQuery(secret).items.some(x=>x.id===hidden.id),true);
});

test('faceted navigation supports compound filters and unclassified discovery',()=>{
  const {a}=seeded();
  a.registerDocument({brain:'engineering',logicalKey:'N1',title:'Unknown Weld Note',scope:['engineering'],domain:'welding'});
  a.registerDocument({brain:'engineering',logicalKey:'N2',title:'Machining Guide',documentType:'guide',scope:['engineering'],domain:'machining',owner:'mach-sme'});
  assert.equal(a.archiveQuery(eng,{filters:{domain:'welding'}}).total,2);
  assert.equal(a.archiveQuery(eng,{filters:{lifecycleState:'unclassified'}}).total,1);
  const f=a.facets(eng);
  assert.ok(f.domain.welding>=2);
});

test('partitioned federated retrieval only queries authorized partitions and bounds fanout',()=>{
  const {a}=seeded();
  for(let i=0;i<12;i++)a.registerDocument({organization:'lemery',brain:`brain-${i}`,logicalKey:`D${i}`,title:`Weld cracking lesson ${i}`,documentType:'lesson',domain:i%2?'welding':'quality',scope:['engineering'],owner:'sme'});
  const hidden=a.registerDocument({organization:'lemery',brain:'secret',logicalKey:'H',title:'Weld cracking classified',documentType:'lesson',domain:'welding',scope:['program-x'],owner:'x'});
  const out=a.federatedSearch(eng,'weld cracking',{maxPartitions:4,perPartition:2});
  assert.equal(out.partitionsQueried.length,4);
  assert.equal(out.partial,true);
  assert.equal(out.results.some(x=>x.document.id===hidden.id),false);
  assert.equal(out.partitionsQueried.includes(partitionKey(hidden)),false);
});

test('duplicate/variant reconciliation is explicit, auditable and non-destructive',()=>{
  const {a,doc}=seeded();
  const b=a.registerDocument({brain:'engineering',logicalKey:'COPY',title:'Procedure copy',documentType:'procedure',scope:['engineering'],owner:'weld-sme'});
  const br=a.addRevision(b.id,{revisionLabel:'C',contentHash:'hash-c'});
  a.addSourceLocation(b.id,br.id,{provider:'box',nativeId:'copy',url:'https://box.test/copy',scope:['engineering']});
  assert.equal(a.classifyRelationship(doc.id,b.id),'exact_duplicate');
  const q=a.createReconciliation('possible_duplicate',[doc.id,b.id],{reason:'same content'});
  assert.equal(q.status,'open');
  a.resolveReconciliation(q.id,{action:'keep_distinct'},{actor:'reviewer',rationale:'separate controlled copies'});
  assert.equal(a.reconciliation[0].status,'resolved');
  assert.equal(a.documents.size,2);
  assert.ok(a.audit.some(x=>x.event==='reconciliation_resolved'));
});

test('archive health detects owner, classification, source and stale-index risks then clears repaired signals',()=>{
  const a=new EnterpriseArchive({now:()=>new Date('2026-09-10T12:00:00Z')});
  const d=a.registerDocument({logicalKey:'ORPHAN',title:'Old Orphan',scope:['engineering'],lastVerifiedAt:'2026-01-01T00:00:00Z'});
  let h=a.scanHealth(eng,{staleAfterDays:30});
  assert.ok(h.some(x=>x.type==='owner_missing'));
  assert.ok(h.some(x=>x.type==='unclassified'));
  assert.ok(h.some(x=>x.type==='broken_canonical_source'));
  assert.ok(h.some(x=>x.type==='missing_current_revision'));
  assert.ok(h.some(x=>x.type==='stale_index'));
  a.registerDocument({id:d.id,logicalKey:'ORPHAN',title:'Old Orphan',scope:['engineering'],documentType:'note',owner:'owner',lastVerifiedAt:'2026-09-10T11:00:00Z'});
  const r=a.addRevision(d.id,{revisionLabel:'1',contentHash:'h'}); a.addSourceLocation(d.id,r.id,{provider:'box',nativeId:'o',url:'https://box.test/o',scope:['engineering']}); a.markIndexed(d.id);
  h=a.scanHealth(eng,{staleAfterDays:30});
  assert.equal(h.length,0);
});

test('Archive UI view model exposes operational views and permission-safe detail',()=>{
  const {a,doc}=seeded();
  const orphan=a.registerDocument({logicalKey:'O',title:'Orphan',documentType:'note',scope:['engineering']});
  a.transition(orphan.id,'owner_missing',{reason:'no steward'});
  const views=a.archiveViews(eng);
  assert.equal(views.current.total,1);
  assert.equal(views.orphaned.total,1);
  const detail=a.documentDetail(doc.id,eng);
  assert.equal(detail.title,'MBD Procedure 102');
  assert.equal(detail.revisions.length,1);
  assert.equal(detail.locations.length,1);
  assert.equal(detail.canonicalSource.provider,'sharepoint');
});

test('retention, legal hold, archive, tombstone and restore preserve provenance safely',()=>{
  const {a,doc,l1}=seeded('2026-09-10T12:00:00Z');
  a.addRetentionPolicy({documentType:'procedure',days:1,action:'archive'});
  a.documents.get(doc.id).modifiedAt='2026-01-01T00:00:00Z';
  assert.equal(a.retentionDecision(doc.id).action,'archive');
  a.placeLegalHold(doc.id,{actor:'legal'});
  assert.equal(a.retentionDecision(doc.id).action,'hold');
  assert.throws(()=>a.archive(doc.id),/legal hold/);
  a.clearLegalHold(doc.id,{actor:'legal'});
  a.archive(doc.id,{actor:'records'});
  assert.equal(a.documents.get(doc.id).lifecycleState,'archived');
  a.restoreDocument(doc.id,{actor:'records'});
  assert.equal(a.documents.get(doc.id).lifecycleState,'indexed');
  a.tombstoneLocation(l1.id,{actor:'connector'});
  assert.equal(a.documents.get(doc.id).lifecycleState,'tombstoned');
  assert.ok(a.audit.some(x=>x.event==='source_location_tombstoned'));
});

test('saved archive views preserve scoped filter intent',()=>{
  const {a}=seeded();
  const v=a.saveView(eng,{name:'Welding current',filters:{domain:'welding',lifecycleState:'indexed'},sort:'title'});
  assert.equal(v.owner,'eng');
  assert.equal(v.filters.domain,'welding');
});
