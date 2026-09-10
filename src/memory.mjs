import crypto from 'node:crypto';

export const MEMORY_CLASSES = Object.freeze(['semantic','episodic','procedural']);
export const MEMORY_POLICY_VERSION = '1.0.0';

export const DEFAULT_MEMORY_POLICIES = Object.freeze({
  semantic: Object.freeze({memoryClass:'semantic',retrieval:{mode:'similarity',maxItems:4,minScore:0,graphDepth:1},write:{mode:'supersede'}}),
  episodic: Object.freeze({memoryClass:'episodic',retrieval:{mode:'similarity_with_floor',maxItems:3,minScore:0.2,graphDepth:1},write:{mode:'append_only'}}),
  procedural: Object.freeze({memoryClass:'procedural',retrieval:{mode:'applicability',maxItems:6,minScore:null,graphDepth:0},write:{mode:'human_reviewed_version'}})
});

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function words(text=''){ return new Set(String(text).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(Boolean)); }
export function textSimilarity(query,text){ const q=words(query), t=words(text); if(!q.size)return 0; let hit=0; for(const token of q) if(t.has(token)) hit++; return hit/q.size; }

export function validateMemoryPolicy(policy){
  if(!policy || !MEMORY_CLASSES.includes(policy.memoryClass)) throw new Error('unknown memory class');
  const validRead=new Set(['similarity','similarity_with_floor','applicability','hybrid']);
  const validWrite=new Set(['supersede','append_only','human_reviewed_version']);
  if(!validRead.has(policy.retrieval?.mode)) throw new Error('invalid retrieval policy');
  if(!validWrite.has(policy.write?.mode)) throw new Error('invalid write policy');
  if(!Number.isInteger(policy.retrieval?.maxItems) || policy.retrieval.maxItems<0) throw new Error('invalid retrieval maxItems');
  return policy;
}

export function resolveMemoryPolicy(memoryClass,{organizationPolicy={},brainPolicy={},domainPolicy={}}={}){
  if(!MEMORY_CLASSES.includes(memoryClass)) throw new Error('unknown memory class');
  const base=clone(DEFAULT_MEMORY_POLICIES[memoryClass]);
  for(const layer of [organizationPolicy,brainPolicy,domainPolicy]){
    const override=layer?.[memoryClass];
    if(!override)continue;
    if(override.memoryClass && override.memoryClass!==memoryClass) throw new Error('policy cannot change memory class');
    if(override.retrieval) base.retrieval={...base.retrieval,...override.retrieval};
    if(override.write) base.write={...base.write,...override.write};
  }
  base.policyVersion=MEMORY_POLICY_VERSION;
  return validateMemoryPolicy(base);
}

function accessible(record,identity){
  if(!identity?.scopes)return false;
  const scopes=record.scope??[];
  return scopes.some(s=>identity.scopes.includes(s));
}

export class OrganizationalMemory {
  constructor({policies={}}={}){
    this.policies=policies;
    this.semantic=[];
    this.episodic=[];
    this.procedural=[];
  }

  policy(memoryClass,context={}){
    return resolveMemoryPolicy(memoryClass,{...this.policies,...context});
  }

  putSemantic(record){
    const item={...record,memoryClass:'semantic'};
    for(const key of ['id','conceptKey','statement','scope']) if(item[key]===undefined) throw new Error(`semantic missing ${key}`);
    const applicability=JSON.stringify(item.applicability??{});
    for(const old of this.semantic){
      if(old.conceptKey===item.conceptKey && JSON.stringify(old.applicability??{})===applicability && old.status==='current'){
        old.status='superseded';
        old.supersededBy=item.id;
      }
    }
    item.status=item.status??'current';
    this.semantic.push(item);
    return item;
  }

  currentSemantic(conceptKey,identity,{applicability=null}={}){
    return this.semantic
      .filter(x=>x.conceptKey===conceptKey&&x.status==='current'&&accessible(x,identity))
      .filter(x=>!applicability||matchesApplicability(x.applicability??{},applicability))
      .sort((a,b)=>(b.authority??0)-(a.authority??0))[0]??null;
  }

  semanticHistory(conceptKey,identity){
    return this.semantic.filter(x=>x.conceptKey===conceptKey&&accessible(x,identity));
  }

  appendEpisode(record){
    const item={...record,memoryClass:'episodic'};
    for(const key of ['situation','attempts','rootCause','resolution','lesson','scope']) if(item[key]===undefined) throw new Error(`episode missing ${key}`);
    const stable=JSON.stringify([item.situation,item.context??{},item.attempts,item.rootCause,item.resolution,item.sourceIds??[]]);
    item.id=item.id??`EPI-${crypto.createHash('sha256').update(stable).digest('hex').slice(0,16)}`;
    const existing=this.episodic.find(x=>x.id===item.id);
    if(existing)return existing;
    item.retrievalText=item.retrievalText??[item.situation,...Object.values(item.context??{})].join(' ');
    item.createdAt=item.createdAt??new Date().toISOString();
    this.episodic.push(item);
    return item;
  }

  correctEpisode(id,correction){
    const original=this.episodic.find(x=>x.id===id);
    if(!original) throw new Error('episode not found');
    return this.appendEpisode({...correction,followUpTo:id,scope:correction.scope??original.scope});
  }

  proposeProcedure(record){
    const item={...record,memoryClass:'procedural',status:'pending_review',id:record.id??`PROC-${crypto.randomUUID()}`};
    for(const key of ['rule','scope','applicability']) if(item[key]===undefined) throw new Error(`procedure missing ${key}`);
    this.procedural.push(item);
    return item;
  }

  approveProcedure(id,reviewer,{effectiveFrom=new Date().toISOString()}={}){
    const item=this.procedural.find(x=>x.id===id);
    if(!item) throw new Error('procedure not found');
    if(item.status!=='pending_review') throw new Error('procedure is not pending review');
    for(const old of this.procedural){
      if(old.id!==id&&old.procedureKey===item.procedureKey&&old.status==='current'&&JSON.stringify(old.applicability??{})===JSON.stringify(item.applicability??{})){
        old.status='superseded'; old.supersededBy=id; old.effectiveTo=effectiveFrom;
      }
    }
    item.status='current'; item.approvedBy=reviewer; item.effectiveFrom=effectiveFrom;
    return item;
  }

  recall(query,identity,{enabled={semantic:true,episodic:true,procedural:true},applicability={},at=new Date(),context={}}={}){
    const result={policyVersion:MEMORY_POLICY_VERSION,semantic:[],episodic:[],procedural:[]};
    if(enabled.procedural){
      const p=this.policy('procedural',context);
      result.procedural=this.procedural.filter(x=>x.status==='current'&&accessible(x,identity))
        .filter(x=>effectiveAt(x,at)&&matchesApplicability(x.applicability??{},applicability))
        .sort((a,b)=>(Number(Boolean(b.mandatory))-Number(Boolean(a.mandatory)))||((b.authority??0)-(a.authority??0)))
        .slice(0,p.retrieval.maxItems);
    }
    if(enabled.semantic){
      const p=this.policy('semantic',context);
      result.semantic=this.semantic.filter(x=>x.status==='current'&&accessible(x,identity))
        .filter(x=>matchesApplicability(x.applicability??{},applicability))
        .map(x=>({...x,score:textSimilarity(query,x.retrievalText??x.statement)}))
        .filter(x=>x.score>=(p.retrieval.minScore??0)&&x.score>0)
        .sort((a,b)=>b.score-a.score||((b.authority??0)-(a.authority??0)))
        .slice(0,p.retrieval.maxItems);
    }
    if(enabled.episodic){
      const p=this.policy('episodic',context);
      result.episodic=this.episodic.filter(x=>accessible(x,identity))
        .filter(x=>matchesApplicability(x.applicability??{},applicability))
        .map(x=>({...x,score:textSimilarity(query,x.retrievalText)}))
        .filter(x=>x.score>=(p.retrieval.minScore??0))
        .sort((a,b)=>b.score-a.score)
        .slice(0,p.retrieval.maxItems);
    }
    return result;
  }
}

export function matchesApplicability(rule={},context={}){
  for(const [key,value] of Object.entries(rule)){
    if(value===null||value===undefined)continue;
    const actual=context[key];
    if(actual===undefined)continue;
    const allowed=Array.isArray(value)?value:[value];
    const actuals=Array.isArray(actual)?actual:[actual];
    if(!actuals.some(v=>allowed.includes(v)||allowed.includes('all'))) return false;
  }
  return true;
}

export function effectiveAt(record,at=new Date()){
  const time=new Date(at).getTime();
  if(record.effectiveFrom && time<new Date(record.effectiveFrom).getTime())return false;
  if(record.effectiveTo && time>=new Date(record.effectiveTo).getTime())return false;
  return true;
}

export function runMemoryAblation(memory,probes,identity,options={}){
  const configs={
    all_on:{semantic:true,episodic:true,procedural:true},
    no_semantic:{semantic:false,episodic:true,procedural:true},
    no_episodic:{semantic:true,episodic:false,procedural:true},
    no_procedural:{semantic:true,episodic:true,procedural:false},
    no_memory:{semantic:false,episodic:false,procedural:false}
  };
  const rows=[];
  for(const [config,enabled] of Object.entries(configs)){
    for(const probe of probes){
      const recalled=memory.recall(probe.query,identity,{...options,enabled,applicability:probe.applicability??options.applicability??{}});
      const got=(recalled[probe.requiredClass]??[]).some(x=>x.id===probe.expectedId||x.conceptKey===probe.expectedId||x.procedureKey===probe.expectedId);
      rows.push({config,probe:probe.id,requiredClass:probe.requiredClass,passed:got,counts:{semantic:recalled.semantic.length,episodic:recalled.episodic.length,procedural:recalled.procedural.length},policyVersion:recalled.policyVersion});
    }
  }
  return rows;
}
