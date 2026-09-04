import test from 'node:test';
import assert from 'node:assert/strict';
import { BrainWorkspaceRegistry } from '../src/brain-folder-registration.mjs';
import { createBrainSetupEndpoint } from '../src/setup-endpoint.mjs';

const registry=new BrainWorkspaceRegistry();
const identities={a:{id:'A'},b:{id:'B'},c:{id:'C'}};
const access=new Set(['A:onedrive-sharepoint:root-1','B:onedrive-sharepoint:root-1']);
const setup=createBrainSetupEndpoint({
  registry,
  identityProvider: async ctx=>identities[ctx.user]??null,
  rootAccessProvider: async ({employeeId,provider,rootId})=>access.has(`${employeeId}:${provider}:${rootId}`)
});

test('setup endpoint creates then joins the same Brain', async()=>{
  const created=await setup({action:'create_brain',args:{name:'Engineering Brain',provider:'onedrive-sharepoint',rootId:'root-1'},requestContext:{user:'a'}});
  assert.equal(created.ok,true);
  const joined=await setup({action:'join_brain',args:{provider:'onedrive-sharepoint',rootId:'root-1'},requestContext:{user:'b'}});
  assert.equal(joined.ok,true);
  assert.equal(joined.workspace.workspaceId,created.workspace.workspaceId);
});

test('setup endpoint cannot be used to gain folder access', async()=>{
  const denied=await setup({action:'join_brain',args:{provider:'onedrive-sharepoint',rootId:'root-1'},requestContext:{user:'c'}});
  assert.deepEqual(denied,{ok:false,error:'folder_not_accessible'});
});

test('setup requires authenticated employee identity', async()=>{
  const result=await setup({action:'join_brain',args:{provider:'onedrive-sharepoint',rootId:'root-1'},requestContext:{user:'nobody'}});
  assert.deepEqual(result,{ok:false,error:'unauthenticated'});
});
