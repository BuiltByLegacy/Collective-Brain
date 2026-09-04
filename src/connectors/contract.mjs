export const connectorContract = {
  requiredMethods:['listChanges','getArtifact','getPermissions','getRevision','getSourceLocation'],
  invariants:[
    'read-only source access by default',
    'preserve source-native ids and revisions',
    'preserve and never broaden source permissions',
    'support incremental change cursors where source allows',
    'emit tombstones for deleted or inaccessible artifacts',
    'never require end users to install software'
  ]
};

export function normalizeSourceArtifact({provider,sourceId,name,revision,mimeType,webUrl,modifiedAt,permissions,content,locations=[]}) {
  if(!provider || !sourceId || !name) throw new Error('provider, sourceId, and name are required');
  return {provider,sourceId,name,revision:revision??null,mimeType:mimeType??null,webUrl:webUrl??null,modifiedAt:modifiedAt??null,permissions:permissions??[],content:content??'',locations};
}

// Production adapters implement the same contract using company-approved credentials.
export class OneDriveSharePointConnector {
  constructor(client){this.client=client;}
  listChanges(...args){return this.client.listChanges(...args);}
  getArtifact(...args){return this.client.getArtifact(...args);}
  getPermissions(...args){return this.client.getPermissions(...args);}
  getRevision(...args){return this.client.getRevision(...args);}
  getSourceLocation(...args){return this.client.getSourceLocation(...args);}
}

export class BoxConnector {
  constructor(client){this.client=client;}
  listChanges(...args){return this.client.listChanges(...args);}
  getArtifact(...args){return this.client.getArtifact(...args);}
  getPermissions(...args){return this.client.getPermissions(...args);}
  getRevision(...args){return this.client.getRevision(...args);}
  getSourceLocation(...args){return this.client.getSourceLocation(...args);}
}
