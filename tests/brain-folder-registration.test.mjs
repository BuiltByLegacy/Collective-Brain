import test from 'node:test';
import assert from 'node:assert/strict';
import { BrainWorkspaceRegistry } from '../src/brain-folder-registration.mjs';

test('employee A creates and employee B joins the same folder-rooted brain',()=>{
  const registry=new BrainWorkspaceRegistry();
  const created=registry.create({name:'Engineering Brain',provider:'onedrive-sharepoint',rootId:'folder-42',rootUrl:'https://example/folder-42',employeeId:'employee-a'});
  const joined=registry.join({provider:'onedrive-sharepoint',rootId:'folder-42',employeeId:'employee-b'});
  assert.equal(joined.workspaceId,created.workspaceId);
  assert.equal(joined.rootId,'folder-42');
  assert.equal(joined.joinedBy,'employee-b');
});

test('selecting a different folder cannot silently join another brain',()=>{
  const registry=new BrainWorkspaceRegistry();
  registry.create({provider:'box',rootId:'root-a',employeeId:'employee-a'});
  assert.throws(()=>registry.join({provider:'box',rootId:'root-b',employeeId:'employee-b'}),/No registered Collective Brain/);
});
