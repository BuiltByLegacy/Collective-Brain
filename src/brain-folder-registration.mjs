import { createBrainWorkspace, sameBrainWorkspace } from './workspace-root.mjs';

export class BrainWorkspaceRegistry {
  constructor(){ this.byId=new Map(); this.byRoot=new Map(); }

  rootKey(provider,rootId){ return `${provider}:${rootId}`; }

  create({name,provider,rootId,rootUrl,employeeId}){
    const key=this.rootKey(provider,rootId);
    if(this.byRoot.has(key)) return this.byId.get(this.byRoot.get(key));
    const workspace=createBrainWorkspace({name,provider,rootId,rootUrl,createdBy:employeeId,mode:'create'});
    this.byId.set(workspace.workspaceId,workspace);
    this.byRoot.set(key,workspace.workspaceId);
    return workspace;
  }

  join({provider,rootId,employeeId}){
    if(!employeeId) throw new Error('employeeId is required');
    const key=this.rootKey(provider,rootId);
    const id=this.byRoot.get(key);
    if(!id) throw new Error('No registered Collective Brain exists for this folder root');
    const workspace=this.byId.get(id);
    const selected=createBrainWorkspace({name:workspace.name,provider,rootId,rootUrl:workspace.rootUrl,createdBy:employeeId,mode:'existing'});
    selected.workspaceId=workspace.workspaceId;
    if(!sameBrainWorkspace(workspace,selected)) throw new Error('Selected folder does not match registered brain');
    return {...workspace,joinedBy:employeeId};
  }

  get(id){ return this.byId.get(id)??null; }
}
