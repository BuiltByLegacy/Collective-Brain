import crypto from 'node:crypto';

export const EDGE_PROVENANCE = Object.freeze(['source-explicit','deterministic','model-inferred','human-proposed','human-approved']);

const INVERSE = Object.freeze({
  AUTHORED:'AUTHORED_BY', AUTHORED_BY:'AUTHORED',
  REVIEWED:'REVIEWED_BY', REVIEWED_BY:'REVIEWED',
  APPROVED:'APPROVED_BY', APPROVED_BY:'APPROVED',
  SUPPORTS:'SUPPORTED_BY', SUPPORTED_BY:'SUPPORTS',
  IMPLEMENTS:'IMPLEMENTED_BY', IMPLEMENTED_BY:'IMPLEMENTS',
  RELATES_TO:'RELATES_TO', CONFLICTS_WITH:'CONFLICTS_WITH',
  SUPERSEDES:'SUPERSEDED_BY', SUPERSEDED_BY:'SUPERSEDES',
  WORKED_ON:'HAS_CONTRIBUTOR', HAS_CONTRIBUTOR:'WORKED_ON',
  EXPERT_IN:'HAS_EXPERT', HAS_EXPERT:'EXPERT_IN',
  RESULTED_IN:'RESULT_OF', RESULT_OF:'RESULTED_IN',
  CONSTRAINED_BY:'CONSTRAINS', CONSTRAINS:'CONSTRAINED_BY'
});

function arr(v){ return Array.isArray(v)?v:[]; }
function unique(v){ return [...new Set(v)]; }
function now(){ return new Date().toISOString(); }
function canSee(subject, identity){
  if(!identity?.scopes) return false;
  const required=arr(subject?.scope);
  return required.length===0 || required.some(s=>identity.scopes.includes(s));
}
function memberCanUseBrain(brainId, identity, memberships){
  const records=memberships.filter(x=>x.brainId===brainId && x.subjectId===identity?.id && x.status==='active');
  return records.some(x=>x.mode==='organization' || x.mode==='brain' || x.mode==='invite' || x.mode==='group');
}

export function inverseRelationship(type){ return INVERSE[type] ?? `INVERSE_OF_${type}`; }

export function normalizeGraphNode(node){
  if(!node?.id || !node?.type) throw new Error('node id and type required');
  return {title:node.title??node.id,scope:arr(node.scope),brainId:node.brainId??null,...node};
}

export function normalizeGraphEdge(edge){
  for(const key of ['from','to','type','provenance']) if(!edge?.[key]) throw new Error(`edge missing ${key}`);
  if(!EDGE_PROVENANCE.includes(edge.provenance)) throw new Error('invalid edge provenance');
  return {
    id:edge.id??`EDGE-${crypto.createHash('sha256').update(JSON.stringify([edge.from,edge.to,edge.type,edge.provenance,edge.sourceRevision??null])).digest('hex').slice(0,16)}`,
    status:edge.status??(edge.provenance==='model-inferred'||edge.provenance==='human-proposed'?'proposed':'active'),
    confidence:edge.confidence??(edge.provenance==='model-inferred'?0.5:1),
    scope:arr(edge.scope),brainId:edge.brainId??null,createdAt:edge.createdAt??now(),...edge
  };
}

export class MembershipDirectory {
  constructor(){ this.records=[]; this.audit=[]; }
  grant({subjectId,brainId,mode='brain',scope=[],actor='system',status='active'}){
    if(!subjectId||!brainId) throw new Error('subjectId and brainId required');
    if(!['organization','brain','invite','group'].includes(mode)) throw new Error('invalid membership mode');
    const prior=this.records.find(x=>x.subjectId===subjectId&&x.brainId===brainId&&x.mode===mode);
    if(prior){ prior.status=status; prior.scope=arr(scope); }
    else this.records.push({subjectId,brainId,mode,scope:arr(scope),status});
    this.audit.push({action:'grant',subjectId,brainId,mode,actor,at:now()});
    return this.records.find(x=>x.subjectId===subjectId&&x.brainId===brainId&&x.mode===mode);
  }
  revoke({subjectId,brainId,actor='system'}){
    for(const r of this.records) if(r.subjectId===subjectId&&r.brainId===brainId) r.status='revoked';
    this.audit.push({action:'revoke',subjectId,brainId,actor,at:now()});
  }
  authorized(brainId,identity){ return memberCanUseBrain(brainId,identity,this.records); }
}

export class SharedGraph {
  constructor({memberships=new MembershipDirectory()}={}){
    this.memberships=memberships; this.nodes=new Map(); this.edges=new Map(); this.savedViews=new Map(); this.audit=[];
  }
  addNode(node){ const n=normalizeGraphNode(node); this.nodes.set(n.id,n); return n; }
  addEdge(edge){
    const e=normalizeGraphEdge(edge);
    if(!this.nodes.has(e.from)||!this.nodes.has(e.to)) throw new Error('edge endpoints must exist');
    const existing=[...this.edges.values()].find(x=>x.id===e.id || (x.from===e.from&&x.to===e.to&&x.type===e.type&&x.sourceRevision===e.sourceRevision));
    if(existing) return existing;
    this.edges.set(e.id,e); return e;
  }
  approveEdge(id,{reviewer}){ const e=this.edges.get(id); if(!e) throw new Error('edge not found'); e.status='active'; e.provenance='human-approved'; e.reviewedBy=reviewer; e.reviewedAt=now(); return e; }
  deactivateEdge(id,{reason='superseded'}){ const e=this.edges.get(id); if(!e) throw new Error('edge not found'); e.status='inactive'; e.inactiveReason=reason; e.inactiveAt=now(); return e; }
  _brainAuthorized(node,identity){ return !node.brainId || this.memberships.authorized(node.brainId,identity); }
  canSeeNode(node,identity){ return canSee(node,identity)&&this._brainAuthorized(node,identity); }
  visibleNodes(identity){ return [...this.nodes.values()].filter(n=>this.canSeeNode(n,identity)); }
  visibleEdges(identity){
    return [...this.edges.values()].filter(e=>e.status==='active'&&canSee(e,identity))
      .filter(e=>{const a=this.nodes.get(e.from),b=this.nodes.get(e.to);return a&&b&&this.canSeeNode(a,identity)&&this.canSeeNode(b,identity);});
  }
  backlinks(nodeId,identity,{types=null}={}){
    if(!this.nodes.has(nodeId)||!this.canSeeNode(this.nodes.get(nodeId),identity)) return [];
    const allowed=types?new Set(types):null;
    return this.visibleEdges(identity).filter(e=>(e.to===nodeId||e.from===nodeId)&&(!allowed||allowed.has(e.type)))
      .map(e=>e.to===nodeId?{...e,direction:'inbound',displayType:inverseRelationship(e.type),neighborId:e.from}:{...e,direction:'outbound',displayType:e.type,neighborId:e.to});
  }
  searchNodes(query,identity,{types=null,limit=20}={}){
    const q=String(query??'').toLowerCase(); const allowed=types?new Set(types):null;
    return this.visibleNodes(identity).filter(n=>(!allowed||allowed.has(n.type))&&(`${n.title} ${n.id} ${arr(n.aliases).join(' ')}`.toLowerCase().includes(q))).slice(0,limit);
  }
  neighborhood(centerId,identity,{depth=1,maxNodes=50,edgeTypes=null,nodeTypes=null}={}){
    const center=this.nodes.get(centerId); if(!center||!this.canSeeNode(center,identity)) return {nodes:[],edges:[],truncated:false};
    const edgeAllow=edgeTypes?new Set(edgeTypes):null,nodeAllow=nodeTypes?new Set(nodeTypes):null;
    const visibleEdges=this.visibleEdges(identity).filter(e=>!edgeAllow||edgeAllow.has(e.type));
    const seen=new Set([centerId]),levels=new Map([[centerId,0]]),queue=[centerId]; const chosen=[];
    while(queue.length){const id=queue.shift(),d=levels.get(id); if(d>=depth)continue; for(const e of visibleEdges){const next=e.from===id?e.to:e.to===id?e.from:null;if(!next||seen.has(next))continue;const n=this.nodes.get(next);if(nodeAllow&&!nodeAllow.has(n.type))continue;if(seen.size>=maxNodes)return {nodes:[...seen].map(x=>this.nodes.get(x)),edges:chosen,truncated:true};seen.add(next);levels.set(next,d+1);queue.push(next);chosen.push(e);}}
    const ids=seen; return {nodes:[...ids].map(x=>this.nodes.get(x)),edges:visibleEdges.filter(e=>ids.has(e.from)&&ids.has(e.to)),truncated:false};
  }
  findPath(from,to,identity,{maxDepth=6,edgeTypes=null}={}){
    const a=this.nodes.get(from),b=this.nodes.get(to); if(!a||!b||!this.canSeeNode(a,identity)||!this.canSeeNode(b,identity)) return null;
    const allow=edgeTypes?new Set(edgeTypes):null; const edges=this.visibleEdges(identity).filter(e=>!allow||allow.has(e.type));
    const queue=[{id:from,nodes:[from],edges:[]}],seen=new Set([from]);
    while(queue.length){const cur=queue.shift(); if(cur.nodes.length-1>=maxDepth)continue; for(const e of edges){const next=e.from===cur.id?e.to:e.to===cur.id?e.from:null;if(!next||seen.has(next))continue;const path={id:next,nodes:[...cur.nodes,next],edges:[...cur.edges,e]};if(next===to)return {nodes:path.nodes.map(id=>this.nodes.get(id)),edges:path.edges,explanation:path.edges.map((x,i)=>`${path.nodes[i]} --${x.type} [${x.provenance}]--> ${path.nodes[i+1]}`).join(' | ')};seen.add(next);queue.push(path);}}
    return null;
  }
  proposeRelationships({artifactId,text,candidates=[],scope=[],brainId=null,sourceRevision=null,extractorVersion='1'}){
    const lower=String(text).toLowerCase(); const out=[];
    for(const c of candidates){const n=this.nodes.get(c.nodeId);if(!n)continue;const terms=[n.title,...arr(n.aliases)].map(x=>String(x).toLowerCase()).filter(Boolean);if(!terms.some(t=>lower.includes(t)))continue;out.push(this.addEdge({from:artifactId,to:n.id,type:c.type??'RELATES_TO',provenance:c.deterministic?'deterministic':'model-inferred',confidence:c.confidence??(c.deterministic?1:0.65),scope,brainId,sourceRevision,extractorVersion,evidenceText:terms.find(t=>lower.includes(t))}));}
    return out;
  }
  saveView({id,name,ownerId,brainIds=[],filters={},centerId=null}){const v={id:id??`VIEW-${crypto.randomUUID()}`,name,ownerId,brainIds,filters,centerId,createdAt:now()};this.savedViews.set(v.id,v);return v;}
  openView(id,identity){const v=this.savedViews.get(id);if(!v)return null;const allowedBrains=v.brainIds.filter(b=>this.memberships.authorized(b,identity));return {...v,brainIds:allowedBrains,authorizationReevaluatedAt:now()};}
  clusterOverview(identity,{maxClusters=20}={}){
    const nodes=this.visibleNodes(identity); const groups=new Map();
    for(const n of nodes){const key=n.brainId??'unscoped';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n);}return [...groups.entries()].slice(0,maxClusters).map(([brainId,items])=>({brainId,count:items.length,nodeTypes:unique(items.map(x=>x.type))}));
  }
}
