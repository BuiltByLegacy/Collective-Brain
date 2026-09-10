import test from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationalMemory, resolveMemoryPolicy, runMemoryAblation } from '../src/memory.mjs';

const identity={id:'eng-user',scopes:['engineering','program-a']};

function fixture(){
  const memory=new OrganizationalMemory({policies:{brainPolicy:{episodic:{retrieval:{minScore:0.3,maxItems:2}}}}});
  memory.putSemantic({id:'STD-C',conceptKey:'program-a:weld-standard-revision',statement:'Program A uses weld standard revision C',retrievalText:'weld standard revision',scope:['program-a'],applicability:{program:'A'},authority:90});
  memory.putSemantic({id:'STD-D',conceptKey:'program-a:weld-standard-revision',statement:'Program A uses weld standard revision D',retrievalText:'weld standard revision',scope:['program-a'],applicability:{program:'A'},authority:90});
  memory.appendEpisode({id:'EPI-CRACK',situation:'Cracks formed near the weld toe after thermal cycling',context:{process:'welding',material:'Inconel'},attempts:[{action:'increase weld size',outcome:'failed'},{action:'blend transition',outcome:'failed'}],rootCause:'residual stress at geometry transition',resolution:'changed joint geometry and heat treatment',lesson:'address the stress transition before increasing weld size',scope:['engineering'],applicability:{process:'welding'}});
  memory.appendEpisode({id:'EPI-PAINT',situation:'Paint discoloration during packaging',context:{process:'painting'},attempts:[{action:'change wrap',outcome:'worked'}],rootCause:'abrasion',resolution:'different wrap',lesson:'protect painted surface',scope:['engineering'],applicability:{process:'painting'}});
  const procedure=memory.proposeProcedure({id:'PROC-REL-D',procedureKey:'weldment-release',rule:'Before releasing a weldment, verify drawing checks, weld symbols, and required approvals.',mandatory:true,authority:100,scope:['engineering'],applicability:{process:'welding'}});
  memory.approveProcedure(procedure.id,'welding-sme',{effectiveFrom:'2026-01-01T00:00:00Z'});
  return memory;
}

test('memory policy is explicit, versioned, scoped, and fails closed',()=>{
  const policy=resolveMemoryPolicy('episodic',{brainPolicy:{episodic:{retrieval:{maxItems:2,minScore:0.4}}}});
  assert.equal(policy.memoryClass,'episodic');
  assert.equal(policy.retrieval.mode,'similarity_with_floor');
  assert.equal(policy.retrieval.maxItems,2);
  assert.equal(policy.retrieval.minScore,0.4);
  assert.ok(policy.policyVersion);
  assert.throws(()=>resolveMemoryPolicy('unknown'),/unknown memory class/);
});

test('semantic controlled identity supersedes deterministically but preserves history',()=>{
  const memory=fixture();
  const current=memory.currentSemantic('program-a:weld-standard-revision',identity,{applicability:{program:'A'}});
  assert.equal(current.id,'STD-D');
  const history=memory.semanticHistory('program-a:weld-standard-revision',identity);
  assert.equal(history.length,2);
  assert.equal(history.find(x=>x.id==='STD-C').status,'superseded');
  assert.equal(history.find(x=>x.id==='STD-C').supersededBy,'STD-D');
});

test('semantic slots remain independent when applicability differs',()=>{
  const memory=new OrganizationalMemory();
  memory.putSemantic({id:'A',conceptKey:'weld-standard',statement:'Program A uses Rev D',scope:['engineering'],applicability:{program:'A'}});
  memory.putSemantic({id:'B',conceptKey:'weld-standard',statement:'Program B uses Rev B',scope:['engineering'],applicability:{program:'B'}});
  assert.equal(memory.currentSemantic('weld-standard',identity,{applicability:{program:'A'}}).id,'A');
  assert.equal(memory.currentSemantic('weld-standard',identity,{applicability:{program:'B'}}).id,'B');
});

test('episodic recall embeds the symptom-facing representation and returns failed attempts',()=>{
  const memory=fixture();
  const recalled=memory.recall('cracking at weld toe during thermal cycle',identity,{applicability:{process:'welding'}});
  assert.equal(recalled.episodic[0].id,'EPI-CRACK');
  assert.equal(recalled.episodic[0].attempts.filter(x=>x.outcome==='failed').length,2);
  assert.match(recalled.episodic[0].rootCause,/residual stress/);
  assert.ok(!recalled.episodic.some(x=>x.id==='EPI-PAINT'));
});

test('episodic retries are idempotent and corrections append linked history',()=>{
  const memory=new OrganizationalMemory();
  const base={situation:'bracket cracked',attempts:[{action:'thicken',outcome:'failed'}],rootCause:'stress concentration',resolution:'radius change',lesson:'remove stress riser',scope:['engineering']};
  const one=memory.appendEpisode(base);
  const two=memory.appendEpisode(base);
  assert.equal(one.id,two.id);
  assert.equal(memory.episodic.length,1);
  const correction=memory.correctEpisode(one.id,{situation:'follow-up fatigue test',attempts:[],rootCause:'confirmed stress concentration',resolution:'radius retained',lesson:'validated fix'});
  assert.equal(correction.followUpTo,one.id);
  assert.equal(memory.episodic.length,2);
});

test('procedural memory is applicability-driven and human-governed',()=>{
  const memory=fixture();
  const pending=memory.proposeProcedure({id:'PROC-PENDING',procedureKey:'other-rule',rule:'Draft AI rule',scope:['engineering'],applicability:{process:'welding'},mandatory:true});
  const recalled=memory.recall('completely unrelated words',identity,{applicability:{process:'welding'},at:new Date('2026-09-01T00:00:00Z')});
  assert.equal(recalled.procedural[0].id,'PROC-REL-D');
  assert.ok(!recalled.procedural.some(x=>x.id===pending.id));
  assert.equal(pending.status,'pending_review');
});

test('procedural approval supersedes prior current version while preserving history',()=>{
  const memory=new OrganizationalMemory();
  const a=memory.proposeProcedure({id:'P-A',procedureKey:'release',rule:'Old release rule',scope:['engineering'],applicability:{process:'welding'},mandatory:true});
  memory.approveProcedure(a.id,'reviewer',{effectiveFrom:'2025-01-01T00:00:00Z'});
  const b=memory.proposeProcedure({id:'P-B',procedureKey:'release',rule:'New release rule',scope:['engineering'],applicability:{process:'welding'},mandatory:true});
  memory.approveProcedure(b.id,'reviewer',{effectiveFrom:'2026-01-01T00:00:00Z'});
  assert.equal(a.status,'superseded');
  assert.equal(a.supersededBy,'P-B');
  assert.equal(b.status,'current');
});

test('authorization occurs before recall assembly',()=>{
  const memory=fixture();
  memory.putSemantic({id:'SECRET',conceptKey:'secret',statement:'secret weld fact',retrievalText:'secret weld fact',scope:['restricted'],authority:999});
  const recalled=memory.recall('secret weld fact',identity,{applicability:{process:'welding'}});
  assert.ok(!recalled.semantic.some(x=>x.id==='SECRET'));
});

test('ablation harness selectively degrades the required memory class',()=>{
  const memory=fixture();
  const probes=[
    {id:'semantic-revision',query:'what weld standard revision',requiredClass:'semantic',expectedId:'program-a:weld-standard-revision',applicability:{program:'A'}},
    {id:'episode-crack',query:'cracks weld toe thermal cycling',requiredClass:'episodic',expectedId:'EPI-CRACK',applicability:{process:'welding'}},
    {id:'procedure-release',query:'what checks before release',requiredClass:'procedural',expectedId:'weldment-release',applicability:{process:'welding'}}
  ];
  const rows=runMemoryAblation(memory,probes,identity);
  const find=(config,probe)=>rows.find(x=>x.config===config&&x.probe===probe);
  assert.equal(find('all_on','semantic-revision').passed,true);
  assert.equal(find('all_on','episode-crack').passed,true);
  assert.equal(find('all_on','procedure-release').passed,true);
  assert.equal(find('no_semantic','semantic-revision').passed,false);
  assert.equal(find('no_episodic','episode-crack').passed,false);
  assert.equal(find('no_procedural','procedure-release').passed,false);
  assert.equal(rows.filter(x=>x.config==='no_memory'&&x.passed).length,0);
});
