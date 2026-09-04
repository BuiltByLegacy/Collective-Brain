import { normalizeSourceArtifact } from './contract.mjs';

export class BoxFolderConnector {
  constructor({fetchImpl=fetch, tokenProvider, rootId, rootUrl=null}) {
    if(!tokenProvider || !rootId) throw new Error('tokenProvider and rootId are required');
    this.fetchImpl=fetchImpl; this.tokenProvider=tokenProvider; this.rootId=rootId; this.rootUrl=rootUrl;
    this.base='https://api.box.com/2.0';
  }

  async request(path, init={}){
    const token=await this.tokenProvider();
    const res=await this.fetchImpl(`${this.base}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(init.headers??{})}});
    if(!res.ok) throw new Error(`Box ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async listChanges(cursor='0'){
    const data=await this.request(`/events?stream_type=changes&stream_position=${encodeURIComponent(cursor)}`);
    const changes=(data.entries??[]).map(e=>({
      eventId:e.event_id??null,
      eventType:e.event_type??null,
      sourceId:e.source?.id??null,
      sourceType:e.source?.type??null,
      name:e.source?.name??null,
      rootId:this.rootId,
      deleted:['ITEM_TRASH','ITEM_DELETE'].includes(e.event_type),
      modifiedAt:e.created_at??null,
    })).filter(x=>x.sourceId);
    return {changes,cursor:String(data.next_stream_position??cursor),nextCursor:null};
  }

  async getArtifact(sourceId){
    const fields='id,name,etag,sha1,file_version,modified_at,content_modified_at,parent,item_status,owned_by,web_url,permissions,shared_link';
    const item=await this.request(`/files/${encodeURIComponent(sourceId)}?fields=${encodeURIComponent(fields)}`);
    if(item.item_status && item.item_status !== 'active') return null;
    return normalizeSourceArtifact({provider:'box',sourceId:item.id,name:item.name,revision:item.file_version?.id??item.etag,mimeType:null,webUrl:item.shared_link?.url??item.web_url??null,modifiedAt:item.content_modified_at??item.modified_at,permissions:await this.getPermissions(sourceId),content:'',locations:[],rootId:this.rootId});
  }

  async getPermissions(sourceId){
    const data=await this.request(`/files/${encodeURIComponent(sourceId)}/collaborations?limit=1000`);
    return (data.entries??[]).map(c=>({id:c.id,status:c.status??null,role:c.role??null,accessibleBy:c.accessible_by??null,item:c.item?{id:c.item.id,type:c.item.type}:null}));
  }

  async getRevision(sourceId){
    const item=await this.request(`/files/${encodeURIComponent(sourceId)}?fields=${encodeURIComponent('id,etag,file_version,modified_at')}`);
    return item.file_version?.id??item.etag??item.modified_at??null;
  }

  async getSourceLocation(sourceId){ return {provider:'box',rootId:this.rootId,sourceId}; }
}
