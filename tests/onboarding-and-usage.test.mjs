import test from 'node:test';
import assert from 'node:assert/strict';
import { CollectiveBrainOnboarding, employeeSetupSteps } from '../src/onboarding.mjs';
import { shouldUseBrain, explicitBrainIntent, answerWithCollectiveBrain } from '../src/claude-experience.mjs';

const allowed=new Set(['A:onedrive-sharepoint:folder-1','B:onedrive-sharepoint:folder-1','A:box:box-1','B:box:box-1']);
const canAccessRoot=async({employeeId,provider,rootId})=>allowed.has(`${employeeId}:${provider}:${rootId}`);

test('Employee A creates and Employee B joins the same Brain by provider-native folder identity', async()=>{
  const onboarding=new CollectiveBrainOnboarding({canAccessRoot});
  const created=await onboarding.createBrain({employeeId:'A',name:'Engineering Brain',provider:'onedrive-sharepoint',rootId:'folder-1',rootUrl:'https://example/folder-1'});
  assert.equal(created.ok,true);
  const joined=await onboarding.joinBrain({employeeId:'B',provider:'onedrive-sharepoint',rootId:'folder-1'});
  assert.equal(joined.ok,true);
  assert.equal(joined.workspace.workspaceId,created.workspace.workspaceId);
});

test('similar folder name or copied folder cannot falsely join', async()=>{
  const onboarding=new CollectiveBrainOnboarding({canAccessRoot:async()=>true});
  await onboarding.createBrain({employeeId:'A',name:'Engineering Brain',provider:'onedrive-sharepoint',rootId:'folder-1'});
  const wrong=await onboarding.joinBrain({employeeId:'B',provider:'onedrive-sharepoint',rootId:'folder-copy'});
  assert.equal(wrong.ok,false);
  assert.equal(wrong.error,'brain_not_found_for_selected_folder');
});

test('joining cannot grant access to a folder employee cannot already access', async()=>{
  const onboarding=new CollectiveBrainOnboarding({canAccessRoot});
  await onboarding.createBrain({employeeId:'A',provider:'box',rootId:'box-1'});
  const denied=await onboarding.joinBrain({employeeId:'C',provider:'box',rootId:'box-1'});
  assert.deepEqual(denied,{ok:false,error:'folder_not_accessible'});
});

test('onboarding copy requires only normal user tools', ()=>{
  const create=employeeSetupSteps('create').join(' ');
  const join=employeeSetupSteps('join').join(' ');
  for(const forbidden of ['GitHub','CLI','database','OAuth']) {
    assert.equal(create.includes(forbidden),false);
    assert.equal(join.includes(forbidden),false);
  }
});

test('normal institutional questions trigger Brain while generic questions do not', ()=>{
  assert.equal(shouldUseBrain('Have we done a similar weldment seed part before?'),true);
  assert.equal(shouldUseBrain('What is the capital of France?'),false);
  assert.equal(explicitBrainIntent('Show me the source.'),'source');
  assert.equal(explicitBrainIntent('Add what we just learned to the Brain.'),'propose');
});

test('grounded use returns provenance-facing answer shape', async()=>{
  const invoke=async({tool})=> tool==='brain_search'
    ? {ok:true,data:{evidence:[{id:'SP-1',title:'Weldment Seed Part',revision:'B',classification:'precedent_example',authority:70,status:'current',locations:[{anchor:'slide 14'}]}]}}
    : {ok:false,error:'unexpected'};
  const out=await answerWithCollectiveBrain({question:'Have we used datum targets on our seed parts?',workspaceId:'brain_1',invoke});
  assert.equal(out.usedBrain,true);
  assert.equal(out.kind,'grounded');
  assert.equal(out.sources[0].revision,'B');
  assert.deepEqual(out.sources[0].locations,['slide 14']);
});

test('no-result answer separates general knowledge from company guidance', async()=>{
  const out=await answerWithCollectiveBrain({question:'What does our team do for this?',workspaceId:'brain_1',invoke:async()=>({ok:true,data:{evidence:[]}})});
  assert.equal(out.kind,'no_result');
  assert.match(out.message,/general knowledge, not company guidance/i);
});

test('knowledge contribution remains pending review', async()=>{
  const out=await answerWithCollectiveBrain({
    question:'Add what we just learned to the Brain.',workspaceId:'brain_1',conversationEvidence:[{statement:'Use fixture A for the synthetic demo.',sources:['SP-1']}],
    invoke:async({tool,args})=>({ok:true,data:{id:'PROP-1',status:'pending_review',statement:args.statement,sources:args.sources}})
  });
  assert.equal(out.kind,'proposal');
  assert.equal(out.proposal.status,'pending_review');
  assert.match(out.message,/not authoritative yet/i);
});
