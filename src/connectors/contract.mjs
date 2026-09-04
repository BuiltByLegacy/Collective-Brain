export const connectorContract = {
  requiredMethods:['listChanges','getArtifact','getPermissions','getRevision','getSourceLocation'],
  invariants:[
    'read-only source access by default',
    'a selected folder root defines the brain workspace boundary',
    'preserve source-native ids and revisions',
    'preserve and never broaden source permissions',
    'support incremental change cursors where source allows',
    'emit tombstones for deleted or inaccessible artifacts',
    'never require end users to install software'
  ]
};

export function normalizeSourceArtifact({provider,sourceId,name,revision,mimeType,webUrl,modifiedAt,permissions,content,locations=[],rootId}) {
  if(!provider || !sourceId || !name || !rootId) throw new Error('provider, sourceId, name, and rootId are required');
  return {provider,sourceId,rootId,name,revision:revision??null,mimeType:mimeType??null,webUrl:webUrl??null,modifiedAt:modifiedAt??null,permissions:permissions??[],content:content??'',locations};
}

export function assertConnectorShape(connector){
  for(const method of connectorContract.requiredMethods){
    if(typeof connector?.[method] !== 'function') throw new Error(`Connector missing ${method}`);
  }
  return true;
}

// Lightweight delegation wrappers remain available for centrally managed clients.
export class OneDriveSharePointConnector {
  constructor(client){this.client=client; assertConnectorShape(client);}
  listChanges(...args){return this.client.listChanges(...args);}
  getArtifact(...args){return this.client.getArtifact(...args);}
  getPermissions(...args){return this.client.getPermissions(...args);}
  getRevision(...args){return this.client.getRevision(...args);}
  getSourceLocation(...args){return this.client.getSourceLocation(...args);}
}

export class BoxConnector {
  constructor(client){this.client=client; assertConnectorShape(client);}
  listChanges(...args){return this.client.listChanges(...args);}
  getArtifact(...args){return this.client.getArtifact(...args);}
  getPermissions(...args){return this.client.getPermissions(...args);}
  getRevision(...args){return this.client.getRevision(...args);}
  getSourceLocation(...args){return this.client.getSourceLocation(...args);}
}
