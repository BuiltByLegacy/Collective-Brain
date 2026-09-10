import test from 'node:test';
import assert from 'node:assert/strict';
import {ExpertiseGraph,DecisionLineage,buildSharedGraphView} from '../src/organizational-learning.mjs';

const eng={id:'u1',scopes:['engineering']};
const secret={id:'u2',scopes:['engineering','program-x']};

test('who-knows-what is evidence backed, recency aware, and permission safe',()=>{
  const g=new ExpertiseGraph();
  g.addPerson({id:'alice',name:'Alice',role:'Welding SME'});
  g.addPerson({id:'bob',name:'Bob',role:'Engineer'});
  g.addPerson({id:'carol',name:'Carol',role:'Program X SME'});
  g.addEvidence({personId:'alice',relation:'EXPERT_IN',subjectId:'weld-cracking',tags:['weld-cracking','welding'],scope:['engineering'],explicit:true,authority:90,confidence:1,occurredAt:'2026-08-01'});
  g.addEvidence({personId:'bob',relation:'WORKED_ON',subjectId:'weld-cracking',tags:['weld-cracking'],scope:['engineering'],authority:50,confidence:0.8,occurredAt:'2021-01-01'});
  g.addEvidence({personId:'carol',relation:'RESOLVED',subjectId:'weld-cracking',tags:['weld-cracking'],scope:['program-x'],authority:95,confidence:1,occurredAt:'2026-09-01'});
  const visible=g.whoKnows({subjects:['weld-cracking'],identity:eng,at:new Date('2026-09-10')});
  assert.equal(visible[0].person.id,'alice');
  assert.equal(visible.some(x=>x.person.id==='carol'),false);
  const elevated=g.whoKnows({subjects:['weld-cracking'],identity:secret,at:new Date('2026-09-10')});
  assert.equal(elevated.some(x=>x.person.id==='carol'),true);
  assert.ok(visible[0].evidence[0].relation);
});

test('decision lineage preserves alternatives, rationale, evidence, outcomes, and supersession history',()=>{
  const d=new DecisionLineage();
  d.addDecision({id:'DEC-1',question:'Which datum target pattern should the weldment use?',selectedOption:'Pattern 03',alternatives:[{option:'Pattern 02',rejectedBecause:'inspection access'}],rationale:'Best inspection accessibility',actors:['alice'],evidenceIds:['E-1'],governingReferenceIds:['PROC-1'],scope:['engineering']});
  d.addOutcome('DEC-1',{id:'OUT-1',result:'inspection passed',scope:['engineering']});
  const why=d.explainWhy('DEC-1',eng);
  assert.equal(why.selectedOption,'Pattern 03');
  assert.equal(why.alternatives.length,1);
  assert.equal(why.lineage.some(e=>e.type==='RESULTED_IN'),true);
  d.supersede('DEC-1',{id:'DEC-2',question:'Which datum target pattern should the weldment use?',selectedOption:'Pattern 04',rationale:'New tooling permits access',scope:['engineering']});
  assert.equal(d.explainWhy('DEC-1',eng).status,'superseded');
  assert.equal(d.explainWhy('DEC-1',eng).supersededBy,'DEC-2');
});

test('shared graph view combines Obsidian-style links and Graphify-style typed relationships without leaking restricted nodes',()=>{
  const base={
    artifacts:[{id:'A1',title:'Weldment Deck',scope:['engineering']},{id:'AX',title:'Secret Program Deck',scope:['program-x']}],
    knowledge:[{id:'K1',type:'concept',label:'Weld cracking',scope:['engineering']}],
    people:[{id:'P1',name:'Alice',scope:['engineering']},{id:'PX',name:'Carol',scope:['program-x']}],
    decisions:[{id:'D1',question:'Choose Pattern 03',scope:['engineering']}],
    expertiseEdges:[{personId:'P1',subjectId:'K1',relation:'EXPERT_IN',scope:['engineering']},{personId:'PX',subjectId:'AX',relation:'WORKED_ON',scope:['program-x']}],
    decisionEdges:[{from:'D1',to:'A1',type:'SUPPORTED_BY',scope:['engineering']}]
  };
  const graph=buildSharedGraphView({...base,identity:eng});
  assert.deepEqual(new Set(graph.nodes.map(n=>n.id)),new Set(['A1','K1','P1','D1']));
  assert.equal(graph.edges.some(e=>(e.personId==='PX'||e.from==='PX')),false);
  assert.equal(graph.edges.length,2);
});
