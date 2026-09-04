import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmployeeHandoff } from '../src/real-cloud-validation.mjs';

const workspace={workspaceId:'brain_test',provider:'onedrive-sharepoint',rootId:'root-1'};
const setup=async({action})=> action==='create_brain'
  ? {ok:true,workspace}
  : {ok:true,workspace:{...workspace,joinedBy:'B'}};
const ask=async()=>({kind:'grounded',sources:[{id:'artifact-1'}]});
const artifactLifecycle={
  testQuestion:'Have we handled this seed part before?',
  seed:async()=>({indexed:true,sourceId:'artifact-1'}),
  revise:async()=>({currentRevisionResolved:true,revision:'B'}),
  revoke:async()=>({excludedBeforeModel:true}),
  removeOrMove:async()=>({excludedOrTombstoned:true})
};

test('real cloud harness requires every Employee X to Employee Y gate', async()=>{
  const result=await validateEmployeeHandoff({setup,ask,provider:'onedrive-sharepoint',rootId:'root-1',employeeAContext:{user:'a'},employeeBContext:{user:'b'},artifactLifecycle});
  assert.equal(result.passed,true);
  assert.equal(result.completed,result.total);
  assert.equal(result.steps.length,7);
});

test('real cloud harness stops cleanly when join fails', async()=>{
  const result=await validateEmployeeHandoff({
    setup:async({action})=>action==='create_brain'?{ok:true,workspace}:{ok:false,error:'folder_not_accessible'},
    ask,provider:'onedrive-sharepoint',rootId:'root-1',employeeAContext:{},employeeBContext:{},artifactLifecycle
  });
  assert.equal(result.passed,false);
  assert.equal(result.steps.find(x=>x.step==='join_brain').passed,false);
});
