export function normalizePrincipal(provider, raw={}) {
  if(provider==='onedrive-sharepoint') {
    const identity=raw.grantedTo?.user ?? raw.grantedTo?.group ?? raw.grantedTo?.siteUser ?? raw.grantedTo?.siteGroup ?? null;
    if(!identity) return null;
    return {provider,type:raw.grantedTo?.group||raw.grantedTo?.siteGroup?'group':'user',id:identity.id??identity.email??identity.displayName??null,email:identity.email??null,displayName:identity.displayName??null,roles:raw.roles??[]};
  }
  if(provider==='box') {
    const identity=raw.accessibleBy;
    if(!identity) return null;
    return {provider,type:identity.type??'user',id:identity.id??identity.login??identity.name??null,email:identity.login??null,displayName:identity.name??null,roles:raw.role?[raw.role]:[]};
  }
  return null;
}

export function normalizeAcl(provider, permissions=[]) {
  return permissions.map(p=>normalizePrincipal(provider,p)).filter(Boolean);
}

export function identityCanRead({provider, permissions=[]}, identity) {
  if(!identity) return false;
  const acl=normalizeAcl(provider,permissions);
  return acl.some(p=>{
    const sameUser=p.type==='user' && ((identity.email && p.email && identity.email.toLowerCase()===p.email.toLowerCase()) || (identity.providerIds?.[provider] && p.id===identity.providerIds[provider]));
    const sameGroup=p.type==='group' && (identity.groupIds?.[provider]??[]).includes(p.id);
    return sameUser || sameGroup;
  });
}

export function reconcileChange(state, change){
  const next=new Map(state);
  const key=`${change.provider}:${change.sourceId}`;
  if(change.deleted || change.inaccessible) next.set(key,{...change,tombstoned:true,indexable:false});
  else next.set(key,{...change,tombstoned:false,indexable:true});
  return next;
}

export function sourceHealth({provider,rootId,cursor,lastSyncAt,error=null}) {
  return {provider,rootId,cursor:cursor??null,lastSyncAt:lastSyncAt??null,status:error?'failed':'healthy',error:error?String(error):null};
}

export function combineAuthorization(artifacts, identity){
  // Never union permissions between providers. Each artifact is evaluated against its own source-native ACL.
  return artifacts.filter(a=>identityCanRead(a,identity));
}
