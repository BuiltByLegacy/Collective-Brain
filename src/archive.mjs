import crypto from 'node:crypto';

export const ARCHIVE_STATES = Object.freeze([
  'indexed','needs_reindex','unclassified','possible_duplicate','possible_variant',
  'broken_source','permission_unknown','owner_missing','stale','superseded',
  'archived','tombstoned','quarantined'
]);

const ACTIVE_STATES=new Set(['indexed','needs_reindex','unclassified','possible_duplicate','possible_variant','broken_source','permission_unknown','owner_missing','stale']);
const TERMINALISH=new Set(['superseded','archived','tombstoned','quarantined']);
const ALLOWED_TRANSITIONS=new Map([
  ['indexed',new Set(ARCHIVE_STATES)],
  ['needs_reindex',new Set(['indexed','broken_source','permission_unknown','quarantined','tombstoned'])],
  ['unclassified',new Set(['indexed','owner_missing','possible_duplicate','possible_variant','quarantined','tombstoned'])],
  ['possible_duplicate',new Set(['indexed','possible_variant','superseded','archived','tombstoned'])],
  ['possible_variant',new Set(['indexed','possible_duplicate','superseded','archived','tombstoned'])],
  ['broken_source',new Set(['indexed','needs_reindex','tombstoned','archived'])],
  ['permission_unknown',new Set(['indexed','tombstoned','quarantined'])],
  ['owner_missing',new Set(['indexed','archived','tombstoned'])],
  ['stale',new Set(['indexed','needs_reindex','superseded','archived','tombstoned'])],
  ['superseded',new Set(['archived','tombstoned','indexed'])],
  ['archived',new Set(['indexed','tombstoned'])],
  ['tombstoned',new Set(['indexed'])],
  ['quarantined',new Set(['unclassified','needs_reindex','tombstoned'])]
]);

function hash(parts){return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');}
function stableId(prefix,parts){return `${prefix}-${hash(parts).slice(0,20)}`;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function nowIso(now=new Date()){return new Date(now).toISOString();}
function allowed(scope,identity){return Boolean(identity?.scopes&&scope?.some(s=>identity.scopes.includes(s)));}
function normalizeArray(v){return Array.isArray(v)?v:(v===undefined||v===null?[]:[v]);}

export function stableBrainDocumentId({organization='default',brain='default',logicalKey,sourceClass='external'}){
  if(!logicalKey) throw new Error('logicalKey required');
  return stableId('DOC',[organization,brain,sourceClass,logicalKey]);
}

export class EnterpriseArchive {
  constructor({now=()=>new Date()}={}){
    this.now=now;
    this.documents=new Map();
    this.revisions=new Map();
    this.locations=new Map();
    this.families=new Map();
    this.audit=[];
    this.reconciliation=[];
    this.healthSignals=new Map();
    this.savedViews=new Map();
    this.retentionPolicies=[];
  }

  registerDocument(input,actor='system'){
    for(const key of ['logicalKey','title','scope']) if(input[key]===undefined) throw new Error(`document missing ${key}`);
    const id=input.id??stableBrainDocumentId(input);
    const existing=this.documents.get(id);
    if(existing){
      const merged={...existing,...input,id,scope:[...new Set(input.scope??existing.scope)]};
      this.documents.set(id,merged);
      this._audit('document_updated',id,actor,{before:existing,after:merged});
      return merged;
    }
    const doc={
      id,logicalKey:input.logicalKey,title:input.title,documentType:input.documentType??'unclassified',
      familyId:input.familyId??stableId('FAM',[input.organization??'default',input.brain??'default',input.logicalKey]),
      owner:input.owner??null,sourceClass:input.sourceClass??'external',organization:input.organization??'default',
      brain:input.brain??'default',domain:input.domain??null,program:input.program??null,customer:input.customer??null,
      authority:input.authority??0,sensitivity:input.sensitivity??null,scope:[...input.scope],
      lifecycleState:input.lifecycleState??(input.documentType?'indexed':'unclassified'),
      canonicalLocationId:null,currentRevisionId:null,createdAt:input.createdAt??nowIso(this.now()),
      modifiedAt:input.modifiedAt??nowIso(this.now()),lastIndexedAt:input.lastIndexedAt??null,lastVerifiedAt:input.lastVerifiedAt??null,
      legalHold:Boolean(input.legalHold),metadata:clone(input.metadata??{})
    };
    if(!ARCHIVE_STATES.includes(doc.lifecycleState)) throw new Error('invalid archive state');
    this.documents.set(id,doc);
    if(!this.families.has(doc.familyId))this.families.set(doc.familyId,{id:doc.familyId,documentIds:[],revisionIds:[]});
    this.families.get(doc.familyId).documentIds.push(id);
    this._audit('document_registered',id,actor,{after:doc});
    return doc;
  }

  addRevision(documentId,input,actor='system'){
    const doc=this._doc(documentId);
    for(const key of ['revisionLabel','contentHash']) if(input[key]===undefined) throw new Error(`revision missing ${key}`);
    const id=input.id??stableId('REV',[documentId,input.revisionLabel,input.contentHash]);
    if(this.revisions.has(id)) return this.revisions.get(id);
    const revision={id,documentId,revisionLabel:input.revisionLabel,providerVersionId:input.providerVersionId??null,
      contentHash:input.contentHash,status:input.status??'current',effectiveFrom:input.effectiveFrom??null,effectiveTo:input.effectiveTo??null,
      createdAt:input.createdAt??nowIso(this.now()),sourceMetadata:clone(input.sourceMetadata??{})};
    for(const old of this.revisions.values()) if(old.documentId===documentId&&old.status==='current'){
      old.status='superseded'; old.supersededBy=id; if(!old.effectiveTo)old.effectiveTo=revision.effectiveFrom??revision.createdAt;
    }
    this.revisions.set(id,revision);
    doc.currentRevisionId=id; doc.modifiedAt=nowIso(this.now());
    const fam=this.families.get(doc.familyId); if(!fam.revisionIds.includes(id))fam.revisionIds.push(id);
    this._audit('revision_added',id,actor,{documentId,revisionLabel:revision.revisionLabel});
    return revision;
  }

  addSourceLocation(documentId,revisionId,input,actor='system'){
    const doc=this._doc(documentId); const rev=this._rev(revisionId);
    if(rev.documentId!==documentId)throw new Error('revision/document mismatch');
    for(const key of ['provider','nativeId','scope']) if(input[key]===undefined) throw new Error(`location missing ${key}`);
    const id=input.id??stableId('LOC',[input.provider,input.nativeId,input.providerVersionId??rev.providerVersionId??null]);
    const location={id,documentId,revisionId,provider:input.provider,nativeId:input.nativeId,providerVersionId:input.providerVersionId??rev.providerVersionId??null,
      url:input.url??null,path:input.path??null,aclRef:input.aclRef??null,scope:[...input.scope],status:input.status??'active',
      modifiedAt:input.modifiedAt??null,lastVerifiedAt:input.lastVerifiedAt??null,contentHash:input.contentHash??rev.contentHash,
      sourceOfTruth:Boolean(input.sourceOfTruth),metadata:clone(input.metadata??{})};
    this.locations.set(id,location);
    if(!doc.canonicalLocationId||location.sourceOfTruth)doc.canonicalLocationId=id;
    this._audit('source_location_added',id,actor,{documentId,revisionId,provider:location.provider});
    return location;
  }

  setCanonicalLocation(documentId,locationId,actor='system',rationale='manual'){
    const doc=this._doc(documentId), loc=this._loc(locationId);
    if(loc.documentId!==documentId)throw new Error('location/document mismatch');
    const before=doc.canonicalLocationId; doc.canonicalLocationId=locationId;
    this._audit('canonical_source_changed',documentId,actor,{before,after:locationId,rationale});
    return doc;
  }

  transition(documentId,to,{actor='system',reason='unspecified'}={}){
    const doc=this._doc(documentId); const from=doc.lifecycleState;
    if(!ARCHIVE_STATES.includes(to)) throw new Error('invalid archive state');
    if(from!==to&&!ALLOWED_TRANSITIONS.get(from)?.has(to)) throw new Error(`invalid archive transition ${from}->${to}`);
    doc.lifecycleState=to; doc.modifiedAt=nowIso(this.now());
    this._audit('archive_state_changed',documentId,actor,{from,to,reason});
    return doc;
  }

  markIndexed(documentId,{actor='system'}={}){
    const doc=this._doc(documentId); doc.lastIndexedAt=nowIso(this.now()); doc.lastVerifiedAt=doc.lastIndexedAt;
    return this.transition(documentId,'indexed',{actor,reason:'index complete'});
  }

  archive(documentId,{actor='system',reason='retention/archive'}={}){
    const doc=this._doc(documentId); if(doc.legalHold) throw new Error('legal hold prevents archive/disposition');
    return this.transition(documentId,'archived',{actor,reason});
  }

  tombstoneLocation(locationId,{actor='system',reason='source unavailable'}={}){
    const loc=this._loc(locationId); loc.status='tombstoned'; loc.tombstoneReason=reason; loc.tombstonedAt=nowIso(this.now());
    this._audit('source_location_tombstoned',locationId,actor,{reason,documentId:loc.documentId});
    const active=[...this.locations.values()].filter(x=>x.documentId===loc.documentId&&x.status==='active');
    if(!active.length)this.transition(loc.documentId,'tombstoned',{actor,reason});
    else if(this.documents.get(loc.documentId).canonicalLocationId===locationId)this.setCanonicalLocation(loc.documentId,active[0].id,actor,'canonical source tombstoned');
    return loc;
  }

  restoreDocument(documentId,{actor='system',reason='authorized restore'}={}){
    const doc=this._doc(documentId);
    if(!['archived','tombstoned'].includes(doc.lifecycleState))throw new Error('document is not restorable');
    const active=[...this.locations.values()].some(x=>x.documentId===documentId&&x.status==='active');
    if(!active&&doc.sourceClass==='external')throw new Error('external source unavailable; cannot restore active state');
    return this.transition(documentId,'indexed',{actor,reason});
  }

  placeLegalHold(documentId,{actor='system',reason='legal hold'}={}){
    const doc=this._doc(documentId); doc.legalHold=true; this._audit('legal_hold_set',documentId,actor,{reason}); return doc;
  }

  clearLegalHold(documentId,{actor='system',reason='released'}={}){
    const doc=this._doc(documentId); doc.legalHold=false; this._audit('legal_hold_cleared',documentId,actor,{reason}); return doc;
  }

  addRetentionPolicy(policy){
    const p={id:policy.id??stableId('RET',[policy.scope??{},policy.documentType??'*',policy.days??null]),...clone(policy)};
    this.retentionPolicies.push(p); return p;
  }

  retentionDecision(documentId,at=this.now()){
    const doc=this._doc(documentId); if(doc.legalHold)return{action:'hold',reason:'legal_hold'};
    const policy=this.retentionPolicies.find(p=>(!p.documentType||p.documentType===doc.documentType)&&matchesMeta(doc,p.scope??{}));
    if(!policy||!policy.days)return{action:'retain',reason:'no_expiring_policy'};
    const base=new Date(doc.modifiedAt??doc.createdAt).getTime(); const due=base+policy.days*86400000;
    return new Date(at).getTime()>=due?{action:policy.action??'archive',policyId:policy.id,dueAt:new Date(due).toISOString()}:{action:'retain',policyId:policy.id,dueAt:new Date(due).toISOString()};
  }

  documentFamily(documentId,identity){
    const doc=this._authorizedDoc(documentId,identity); const fam=this.families.get(doc.familyId);
    return {id:fam.id,documents:fam.documentIds.map(id=>this.documents.get(id)).filter(d=>allowed(d.scope,identity)),
      revisions:fam.revisionIds.map(id=>this.revisions.get(id)).filter(r=>r&&allowed(this.documents.get(r.documentId).scope,identity))};
  }

  classifyRelationship(aId,bId,{similarity=0}={}){
    const a=this._doc(aId),b=this._doc(bId);
    const ar=this.revisions.get(a.currentRevisionId), br=this.revisions.get(b.currentRevisionId);
    if(ar?.contentHash&&ar.contentHash===br?.contentHash)return'exact_duplicate';
    if(a.logicalKey===b.logicalKey)return'revision_or_copy';
    if(similarity>=0.85)return'possible_variant';
    if(similarity>=0.65)return'possible_duplicate';
    return'distinct';
  }

  createReconciliation(kind,documentIds,{actor='system',reason='detected'}={}){
    const item={id:stableId('REC',[kind,documentIds.sort()]),kind,documentIds:[...documentIds],status:'open',reason,createdAt:nowIso(this.now()),createdBy:actor};
    const existing=this.reconciliation.find(x=>x.id===item.id&&x.status==='open'); if(existing)return existing;
    this.reconciliation.push(item); for(const id of documentIds){const state=kind.includes('variant')?'possible_variant':'possible_duplicate'; if(ACTIVE_STATES.has(this._doc(id).lifecycleState))this.transition(id,state,{actor,reason});}
    return item;
  }

  resolveReconciliation(id,resolution,{actor='system',rationale='reviewed'}={}){
    const item=this.reconciliation.find(x=>x.id===id); if(!item)throw new Error('reconciliation item not found'); if(item.status!=='open')throw new Error('reconciliation item closed');
    const before=clone(item); item.status='resolved'; item.resolution=clone(resolution); item.resolvedBy=actor; item.resolvedAt=nowIso(this.now()); item.rationale=rationale;
    if(resolution.action==='keep_distinct') for(const docId of item.documentIds)this.transition(docId,'indexed',{actor,reason:'reviewed distinct'});
    if(resolution.action==='canonical_source'&&resolution.documentId&&resolution.locationId)this.setCanonicalLocation(resolution.documentId,resolution.locationId,actor,rationale);
    if(resolution.action==='mark_superseded'&&resolution.documentId)this.transition(resolution.documentId,'superseded',{actor,reason:rationale});
    this._audit('reconciliation_resolved',id,actor,{before,after:item}); return item;
  }

  archiveQuery(identity,{filters={},sort='title',page=1,pageSize=50,includeHistorical=false}={}){
    const max=Math.min(Math.max(pageSize,1),200);
    let rows=[...this.documents.values()].filter(d=>allowed(d.scope,identity));
    if(!includeHistorical)rows=rows.filter(d=>!TERMINALISH.has(d.lifecycleState));
    rows=rows.filter(d=>matchesFilters(d,filters));
    rows.sort(sorter(sort));
    const total=rows.length,start=(Math.max(page,1)-1)*max;
    return {total,page:Math.max(page,1),pageSize:max,items:rows.slice(start,start+max).map(d=>this._summary(d,identity))};
  }

  facets(identity,{filters={},includeHistorical=false,fields=['brain','documentType','owner','domain','program','customer','lifecycleState','authority','sourceClass']}={}){
    const rows=this.archiveQuery(identity,{filters,includeHistorical,pageSize:200,page:1}).items;
    const out={};
    for(const field of fields){const counts={}; for(const r of rows){const values=normalizeArray(r[field]??'unknown'); for(const v of values)counts[String(v)]=(counts[String(v)]??0)+1;} out[field]=counts;}
    return out;
  }

  saveView(identity,{name,filters={},sort='title',includeHistorical=false}){
    if(!name)throw new Error('view name required'); const id=stableId('VIEW',[identity.id,name]);
    const view={id,owner:identity.id,name,filters:clone(filters),sort,includeHistorical}; this.savedViews.set(id,view); return view;
  }

  federatedSearch(identity,query,{partitions=null,maxPartitions=8,perPartition=5,filters={}}={}){
    const authorized=[...this.documents.values()].filter(d=>allowed(d.scope,identity));
    const groups=new Map();
    for(const d of authorized){const key=partitionKey(d); if(partitions&&!partitions.includes(key))continue; if(!groups.has(key))groups.set(key,[]); groups.get(key).push(d);}
    const selected=[...groups.keys()].sort().slice(0,maxPartitions); const partial=groups.size>selected.length;
    const terms=tokenize(query); const candidates=[];
    for(const key of selected){
      const local=groups.get(key).filter(d=>matchesFilters(d,filters)).map(d=>({partition:key,document:d,score:lexicalScore(terms,`${d.title} ${Object.values(d.metadata??{}).join(' ')}`)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.document.authority-a.document.authority).slice(0,perPartition);
      candidates.push(...local);
    }
    candidates.sort((a,b)=>b.score-a.score||b.document.authority-a.document.authority);
    return {query,partitionsQueried:selected,partial,results:candidates.map(x=>({partition:x.partition,score:x.score,document:this._summary(x.document,identity)}))};
  }

  openSource(documentId,identity){
    const doc=this._authorizedDoc(documentId,identity); const loc=this.locations.get(doc.canonicalLocationId);
    if(!loc||loc.status!=='active'||!allowed(loc.scope,identity))return null;
    return {provider:loc.provider,url:loc.url,nativeId:loc.nativeId,revisionId:loc.revisionId};
  }

  documentDetail(documentId,identity){
    const doc=this._authorizedDoc(documentId,identity);
    const revisions=[...this.revisions.values()].filter(r=>r.documentId===documentId);
    const locations=[...this.locations.values()].filter(l=>l.documentId===documentId&&allowed(l.scope,identity));
    return {...clone(doc),revisions:clone(revisions),locations:clone(locations),canonicalSource:this.openSource(documentId,identity),
      audit:this.audit.filter(a=>a.targetId===documentId||a.detail?.documentId===documentId),health:[...this.healthSignals.values()].filter(h=>h.documentId===documentId),
      reconciliation:this.reconciliation.filter(r=>r.documentIds.includes(documentId))};
  }

  archiveViews(identity){
    const presets={
      all:{},current:{lifecycleState:'indexed'},needs_review:{lifecycleState:['needs_reindex','stale','permission_unknown']},
      duplicates_variants:{lifecycleState:['possible_duplicate','possible_variant']},broken_sources:{lifecycleState:'broken_source'},
      unclassified:{lifecycleState:'unclassified'},orphaned:{owner:null},archived:{lifecycleState:'archived'},quarantined:{lifecycleState:'quarantined'},superseded:{lifecycleState:'superseded'}
    };
    return Object.fromEntries(Object.entries(presets).map(([name,filters])=>[name,this.archiveQuery(identity,{filters,includeHistorical:['archived','quarantined','superseded'].includes(name)})]));
  }

  scanHealth(identity,{staleAfterDays=30,at=this.now()}={}){
    const visible=[...this.documents.values()].filter(d=>allowed(d.scope,identity)); const seen=new Set(); const atMs=new Date(at).getTime();
    const emit=(doc,type,severity,reason,remediation)=>{const id=stableId('HEALTH',[doc.id,type]); seen.add(id); const prior=this.healthSignals.get(id); const signal={id,documentId:doc.id,type,severity,reason,remediation,firstSeen:prior?.firstSeen??nowIso(this.now()),lastSeen:nowIso(this.now()),active:true}; this.healthSignals.set(id,signal);};
    for(const doc of visible){
      const canonical=this.locations.get(doc.canonicalLocationId);
      if(!doc.owner)emit(doc,'owner_missing','medium','No owner/steward assigned','Assign accountable owner');
      if(doc.documentType==='unclassified'||doc.lifecycleState==='unclassified')emit(doc,'unclassified','medium','Document classification unresolved','Classify document');
      if(!canonical||canonical.status!=='active')emit(doc,'broken_canonical_source','high','Canonical source unavailable','Choose active source or repair connector');
      if(!doc.currentRevisionId)emit(doc,'missing_current_revision','high','No current revision recorded','Reconcile revision family');
      if(doc.lastVerifiedAt&&atMs-new Date(doc.lastVerifiedAt).getTime()>staleAfterDays*86400000)emit(doc,'stale_index','medium','Index verification is stale','Reverify/reindex source');
      if(['possible_duplicate','possible_variant'].includes(doc.lifecycleState))emit(doc,'reconciliation_backlog','medium','Duplicate/variant requires review','Resolve reconciliation queue');
      if(['permission_unknown','broken_source','quarantined'].includes(doc.lifecycleState))emit(doc,doc.lifecycleState,'high',`Archive state ${doc.lifecycleState}`,'Repair source/index state');
    }
    for(const signal of this.healthSignals.values())if(!seen.has(signal.id)&&visible.some(d=>d.id===signal.documentId))signal.active=false;
    return [...this.healthSignals.values()].filter(s=>s.active&&visible.some(d=>d.id===s.documentId));
  }

  _summary(doc,identity){
    const loc=this.locations.get(doc.canonicalLocationId);
    return {id:doc.id,title:doc.title,documentType:doc.documentType,owner:doc.owner,brain:doc.brain,domain:doc.domain,program:doc.program,customer:doc.customer,
      lifecycleState:doc.lifecycleState,authority:doc.authority,sourceClass:doc.sourceClass,currentRevisionId:doc.currentRevisionId,
      canonicalProvider:loc&&allowed(loc.scope,identity)?loc.provider:null,lastIndexedAt:doc.lastIndexedAt,lastVerifiedAt:doc.lastVerifiedAt};
  }
  _doc(id){const d=this.documents.get(id);if(!d)throw new Error('document not found');return d;}
  _authorizedDoc(id,identity){const d=this._doc(id);if(!allowed(d.scope,identity))throw new Error('document not found');return d;}
  _rev(id){const r=this.revisions.get(id);if(!r)throw new Error('revision not found');return r;}
  _loc(id){const l=this.locations.get(id);if(!l)throw new Error('location not found');return l;}
  _audit(event,targetId,actor,detail={}){const row={id:stableId('AUD',[event,targetId,actor,nowIso(this.now()),this.audit.length]),event,targetId,actor,at:nowIso(this.now()),detail:clone(detail)};this.audit.push(row);return row;}
}

export function partitionKey(doc){return [doc.organization??'default',doc.brain??'default',doc.domain??doc.program??'general'].join('/');}
function tokenize(text=''){return new Set(String(text).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(Boolean));}
function lexicalScore(terms,text){const t=tokenize(text);if(!terms.size)return 0;let n=0;for(const x of terms)if(t.has(x))n++;return n/terms.size;}
function matchesMeta(doc,scope){for(const[k,v]of Object.entries(scope)){if(v===undefined||v===null)continue;if(doc[k]!==v)return false;}return true;}
function matchesFilters(doc,filters){for(const[k,v]of Object.entries(filters)){if(v===undefined)continue;const actual=doc[k]??null;const allowedValues=Array.isArray(v)?v:[v];if(!allowedValues.includes(actual))return false;}return true;}
function sorter(field){const desc=String(field).startsWith('-');const key=desc?String(field).slice(1):field;return(a,b)=>{const av=a[key]??'',bv=b[key]??'';const cmp=String(av).localeCompare(String(bv),undefined,{numeric:true});return desc?-cmp:cmp;};}
