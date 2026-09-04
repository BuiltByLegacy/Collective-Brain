import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainWorkspace, sameBrainWorkspace, isInsideBrainRoot, employeeSetupSummary } from '../src/workspace-root.mjs';
import { normalizeAcl, identityCanRead, reconcileChange, combineAuthorization } from '../src/enterprise-sync.mjs';
import { MicrosoftGraphFolderConnector } from '../src/connectors/onedrive-sharepoint.mjs';
import { BoxFolderConnector } from '../src/connectors/box.mjs';
import { createBrainToolEndpoint } from '../src/hosted-tool-endpoint.mjs';

const jsonResponse=(body,status=200)=>({ok:status>=200&&status<300,status,async json(){return body;},async text(){return JSON.stringify(body);}});

test('employees joining the same provider root resolve to the same brain workspace',()=>{
  const a=createBrainWorkspace({provider:'box',rootId:'folder-123',createdBy:'employee-a',mode:'create'});
  const b={...createBrainWorkspace({provider:'box',rootId:'folder-123',createdBy:'employee-b',mode:'existing'}),workspaceId:a.workspaceId};
  assert.equal(sameBrainWorkspace(a,b),true);
  assert.equal(isInsideBrainRoot(a,{provider:'box',rootId:'folder-123'}),true);
  assert.equal(isInsideBrainRoot(a,{provider:'box',rootId:'other'}),false);
  assert.match(employeeSetupSummary(a).instruction,/same shared brain folder/i);
});

test('Microsoft connector is folder scoped and preserves revisions permissions and delta cursor',async()=>{
  const calls=[];
  const fetchImpl=async(url)=>{
    calls.push(url);
    if(url.includes('/delta')) return jsonResponse({value:[{id:'file-1',name:'Seed Part.pptx',eTag:'rev-2',lastModifiedDateTime:'2026-09-04T00:00:00Z'}],'@odata.deltaLink':'https://graph.microsoft.com/v1.0/delta-token'});
    if(url.includes('/permissions')) return jsonResponse({value:[{id:'p1',roles:['read'],grantedToV2:{user:{id:'u1',email:'employee@example.com',displayName:'Employee'}}}]});
    return jsonResponse({id:'file-1',name:'Seed Part.pptx',eTag:'rev-2',lastModifiedDateTime:'2026-09-04T00:00:00Z',webUrl:'https://contoso/seed',file:{mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}});
  };
  const c=new MicrosoftGraphFolderConnector({fetchImpl,tokenProvider:async()=> 't',driveId:'drive-1',rootId:'root-1'});
  const delta=await c.listChanges();
  assert.equal(delta.changes[0].rootId,'root-1');
  assert.equal(delta.cursor,'/delta-token');
  const artifact=await c.getArtifact('file-1');
  assert.equal(artifact.rootId,'root-1');
  assert.equal(artifact.revision,'rev-2');
  assert.equal(artifact.permissions.length,1);
});

test('Box connector uses changes stream and collaboration ACLs',async()=>{
  const fetchImpl=async(url)=>{
    if(url.includes('/events?')) return jsonResponse({entries:[{event_id:'e1',event_type:'ITEM_UPLOAD',created_at:'2026-09-04T00:00:00Z',source:{id:'f1',type:'file',name:'Seed Part.pptx'}}],next_stream_position:'42'});
    if(url.includes('/collaborations')) return jsonResponse({entries:[{id:'c1',status:'accepted',role:'viewer',accessible_by:{type:'user',id:'u2',login:'employee@example.com',name:'Employee'},item:{id:'f1',type:'file'}}]});
    return jsonResponse({id:'f1',name:'Seed Part.pptx',etag:'2',file_version:{id:'v2'},modified_at:'2026-09-04T00:00:00Z',item_status:'active'});
  };
  const c=new BoxFolderConnector({fetchImpl,tokenProvider:async()=> 't',rootId:'box-root'});
  const delta=await c.listChanges('0');
  assert.equal(delta.cursor,'42');
  assert.equal(delta.changes[0].rootId,'box-root');
  const artifact=await c.getArtifact('f1');
  assert.equal(artifact.rootId,'box-root');
  assert.equal(artifact.revision,'v2');
  assert.equal(artifact.permissions[0].role,'viewer');
});

test('ACLs are evaluated per source and tombstones stop indexing',()=>{
  const ms={provider:'onedrive-sharepoint',permissions:[{roles:['read'],grantedTo:{user:{id:'m1',email:'employee@example.com'}}}]};
  const box={provider:'box',permissions:[{role:'viewer',accessibleBy:{type:'user',id:'b1',login:'other@example.com'}}]};
  const identity={email:'employee@example.com',providerIds:{'onedrive-sharepoint':'m1',box:'b9'},groupIds:{}};
  assert.equal(normalizeAcl(ms.provider,ms.permissions).length,1);
  assert.equal(identityCanRead(ms,identity),true);
  assert.equal(identityCanRead(box,identity),false);
  assert.deepEqual(combineAuthorization([ms,box],identity),[ms]);
  const state=reconcileChange(new Map(),{provider:'box',sourceId:'f1',deleted:true});
  assert.equal(state.get('box:f1').indexable,false);
});

test('hosted endpoint requires identity and scopes corpus to selected folder',async()=>{
  const workspace=createBrainWorkspace({provider:'box',rootId:'root-1',createdBy:'admin'});
  const endpoint=createBrainToolEndpoint({
    workspaceProvider:async(id)=>id===workspace.workspaceId?workspace:null,
    identityProvider:async(ctx)=>ctx.user?{id:ctx.user,scopes:['all']}:null,
    corpusProvider:async()=>[
      {id:'A',logicalId:'A',provider:'box',rootId:'root-1',title:'Allowed Seed',revision:'1',type:'approved_exemplar',authority:60,status:'current',scope:['all'],locations:[{anchor:'slide 1',text:'datum target seed part'}],relationships:[]},
      {id:'B',logicalId:'B',provider:'box',rootId:'other',title:'Outside Root',revision:'1',type:'released_procedure',authority:90,status:'current',scope:['all'],locations:[{anchor:'p1',text:'datum target seed part'}],relationships:[]},
    ],
  });
  assert.equal((await endpoint({tool:'brain_search',args:{workspaceId:workspace.workspaceId,query:'datum target'},requestContext:{}})).error,'unauthenticated');
  const result=await endpoint({tool:'brain_search',args:{workspaceId:workspace.workspaceId,query:'datum target'},requestContext:{user:'employee-y'}});
  assert.equal(result.ok,true);
  assert.deepEqual(result.data.evidence.map(x=>x.id),['A']);
});
