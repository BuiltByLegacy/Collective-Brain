import test from 'node:test';
import assert from 'node:assert/strict';
import {SharedGraph,MembershipDirectory,inverseRelationship} from '../src/shared-graph.mjs';

function setup(){
  const memberships=new MembershipDirectory();
  memberships.grant({subjectId:'u1',brainId:'engineering',mode:'organization',scope:['engineering']});
  memberships.grant({subjectId:'guest',brainId:'engineering',mode:'invite',scope:['engineering']});
  memberships.grant({subjectId:'secret',brainId:'program-x',mode:'brain',scope:['program-x']});
  const g=new SharedGraph({memberships});
  g.addNode({id:'doc',type:'document',title:'Weldment Standard',scope:['engineering'],brainId:'engineering'});
  g.addNode({id:'concept',type:'concept',title:'Weld cracking',scope:['engineering'],brainId:'engineering'});
  g.addNode({id:'person',type:'person',title:'Welding SME',scope:['engineering'],brainId:'engineering'});
  g.addNode({id:'decision',type:'decision',title:'Use Pattern 03',scope:['engineering'],brainId:'engineering'});
  g.addNode({id:'secret-node',type:'document',title:'Program X Restricted Study',scope:['program-x'],brainId:'program-x'});
  g.addEdge({from:'doc',to:'concept',type:'SUPPORTS',provenance:'source-explicit',scope:['engineering'],brainId:'engineering'});
  g.addEdge({from:'person',to:'concept',type:'EXPERT_IN',provenance:'human-approved',scope:['engineering'],brainId:'engineering'});
  g.addEdge({from:'decision',to:'doc',type:'CONSTRAINED_BY',provenance:'deterministic',scope:['engineering'],brainId:'engineering'});
  g.addEdge({from:'secret-node',to:'concept',type:'RELATES_TO',provenance:'source-explicit',scope:['program-x'],brainId:'program-x'});
  return {g,memberships};
}

test('edge contract provides deterministic inverse/backlinks with provenance',()=>{
  const {g}=setup(); const u={id:'u1',scopes:['engineering']};
  assert.equal(inverseRelationship('SUPPORTS'),'SUPPORTED_BY');
  const links=g.backlinks('concept',u);
  assert.equal(links.length,2);
  assert.ok(links.some(x=>x.displayType==='SUPPORTED_BY'&&x.provenance==='source-explicit'));
});

test('membership/invite narrows graph access and revocation takes effect immediately',()=>{
  const {g,memberships}=setup();
  const guest={id:'guest',scopes:['engineering']};
  assert.ok(g.visibleNodes(guest).some(x=>x.id==='doc'));
  memberships.revoke({subjectId:'guest',brainId:'engineering'});
  assert.equal(g.visibleNodes(guest).length,0);
});

test('restricted topology does not leak through neighborhood, backlink, or cluster counts',()=>{
  const {g}=setup(); const u={id:'u1',scopes:['engineering']};
  const n=g.neighborhood('concept',u,{depth:2});
  assert.equal(n.nodes.some(x=>x.id==='secret-node'),false);
  assert.equal(g.backlinks('concept',u).some(x=>x.from==='secret-node'||x.to==='secret-node'),false);
  assert.deepEqual(g.clusterOverview(u).map(x=>x.brainId),['engineering']);
});

test('local graph supports typed filters and bounded progressive expansion',()=>{
  const {g}=setup(); const u={id:'u1',scopes:['engineering']};
  const full=g.neighborhood('concept',u,{depth:2,maxNodes:10});
  assert.ok(full.nodes.length>=4);
  const onlyExperts=g.neighborhood('concept',u,{depth:1,edgeTypes:['EXPERT_IN']});
  assert.deepEqual(new Set(onlyExperts.nodes.map(x=>x.id)),new Set(['concept','person']));
  const bounded=g.neighborhood('concept',u,{depth:3,maxNodes:2});
  assert.equal(bounded.truncated,true);
});

test('graph search returns only authorized nodes',()=>{
  const {g}=setup();
  assert.equal(g.searchNodes('restricted',{id:'u1',scopes:['engineering']}).length,0);
  assert.equal(g.searchNodes('weld',{id:'u1',scopes:['engineering']}).length,2);
});

test('automatic relationship proposals dedupe and preserve provenance/version/evidence',()=>{
  const {g}=setup();
  g.addNode({id:'artifact',type:'document',title:'New report',scope:['engineering'],brainId:'engineering'});
  const first=g.proposeRelationships({artifactId:'artifact',text:'Observed weld cracking during test',scope:['engineering'],brainId:'engineering',sourceRevision:'R2',candidates:[{nodeId:'concept',type:'RELATES_TO',confidence:0.72}]});
  const second=g.proposeRelationships({artifactId:'artifact',text:'Observed weld cracking during test',scope:['engineering'],brainId:'engineering',sourceRevision:'R2',candidates:[{nodeId:'concept',type:'RELATES_TO',confidence:0.72}]});
  assert.equal(first.length,1); assert.equal(first[0].status,'proposed'); assert.equal(first[0].provenance,'model-inferred');
  assert.equal(second[0].id,first[0].id);
  g.approveEdge(first[0].id,{reviewer:'sme'});
  assert.equal(g.edges.get(first[0].id).provenance,'human-approved');
});

test('path finding explains typed/provenance traversal without restricted intermediates',()=>{
  const {g}=setup(); const u={id:'u1',scopes:['engineering']};
  const path=g.findPath('decision','person',u,{maxDepth:4});
  assert.deepEqual(path.nodes.map(x=>x.id),['decision','doc','concept','person']);
  assert.match(path.explanation,/CONSTRAINED_BY/);
  assert.match(path.explanation,/SUPPORTS/);
  assert.equal(g.findPath('doc','secret-node',u),null);
});

test('saved views re-evaluate authorization and overview clusters only visible graph',()=>{
  const {g,memberships}=setup();
  const view=g.saveView({name:'Engineering map',ownerId:'u1',brainIds:['engineering','program-x'],centerId:'concept',filters:{types:['concept','document']}});
  const opened=g.openView(view.id,{id:'u1',scopes:['engineering']});
  assert.deepEqual(opened.brainIds,['engineering']);
  memberships.grant({subjectId:'u1',brainId:'program-x',mode:'brain'});
  const opened2=g.openView(view.id,{id:'u1',scopes:['engineering','program-x']});
  assert.deepEqual(new Set(opened2.brainIds),new Set(['engineering','program-x']));
});
