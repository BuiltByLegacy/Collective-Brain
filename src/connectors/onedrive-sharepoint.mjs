import { normalizeSourceArtifact } from './contract.mjs';

function encodePathSegment(value){ return encodeURIComponent(value).replace(/%2F/g,'/'); }

export class MicrosoftGraphFolderConnector {
  constructor({fetchImpl=fetch, tokenProvider, driveId, rootId, rootUrl=null}) {
    if(!tokenProvider || !driveId || !rootId) throw new Error('tokenProvider, driveId, and rootId are required');
    this.fetchImpl=fetchImpl; this.tokenProvider=tokenProvider; this.driveId=driveId; this.rootId=rootId; this.rootUrl=rootUrl;
    this.base='https://graph.microsoft.com/v1.0';
  }

  async request(path, init={}){
    const token=await this.tokenProvider();
    const res=await this.fetchImpl(`${this.base}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(init.headers??{})}});
    if(!res.ok) throw new Error(`Microsoft Graph ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async listChanges(cursor=null){
    const path=cursor ?? `/drives/${encodePathSegment(this.driveId)}/items/${encodePathSegment(this.rootId)}/delta`;
    const data=await this.request(path,{headers:{Prefer:'deltashowremovedasdeleted'}});
    return {
      changes:(data.value??[]).map(item=>({
        sourceId:item.id,
        rootId:this.rootId,
        deleted:Boolean(item.deleted),
        name:item.name??null,
        revision:item.eTag??item.cTag??null,
        modifiedAt:item.lastModifiedDateTime??null,
        webUrl:item.webUrl??null,
        folder:Boolean(item.folder),
      })),
      nextCursor:data['@odata.nextLink']?.replace(this.base,'') ?? null,
      cursor:data['@odata.deltaLink']?.replace(this.base,'') ?? null,
    };
  }

  async getArtifact(sourceId){
    const item=await this.request(`/drives/${encodePathSegment(this.driveId)}/items/${encodePathSegment(sourceId)}`);
    if(item.folder) return null;
    return normalizeSourceArtifact({provider:'onedrive-sharepoint',sourceId:item.id,name:item.name,revision:item.eTag??item.cTag,mimeType:item.file?.mimeType,webUrl:item.webUrl,modifiedAt:item.lastModifiedDateTime,permissions:await this.getPermissions(sourceId),content:'',locations:[] ,rootId:this.rootId});
  }

  async getPermissions(sourceId){
    const data=await this.request(`/drives/${encodePathSegment(this.driveId)}/items/${encodePathSegment(sourceId)}/permissions`);
    return (data.value??[]).map(p=>({id:p.id,roles:p.roles??[],inheritedFrom:p.inheritedFrom??null,grantedTo:p.grantedToV2??p.grantedTo??null,grantedToIdentities:p.grantedToIdentitiesV2??p.grantedToIdentities??[]}));
  }

  async getRevision(sourceId){
    const item=await this.request(`/drives/${encodePathSegment(this.driveId)}/items/${encodePathSegment(sourceId)}?$select=id,eTag,cTag,lastModifiedDateTime`);
    return item.eTag??item.cTag??item.lastModifiedDateTime??null;
  }

  async getSourceLocation(sourceId){ return {provider:'onedrive-sharepoint',driveId:this.driveId,rootId:this.rootId,sourceId}; }
}
