function canAccess(scope=[], identity){
  const allowed=new Set(identity?.scopes??[]);
  return scope.some(s=>allowed.has(s));
}

function overlap(a=[],b=[]){
  const set=new Set(a);
  return b.filter(x=>set.has(x)).length;
}

export class ExpertiseGraph {
  constructor(){ this.people=new Map(); this.edges=[]; }

  addPerson(person){
    if(!person?.id) throw new Error('person id required');
    this.people.set(person.id,{...person});
    return this.people.get(person.id);
  }

  addEvidence(edge){
    for(const key of ['personId','relation','subjectId','scope']) if(edge?.[key]===undefined) throw new Error(`expertise edge missing ${key}`);
    if(!this.people.has(edge.personId)) throw new Error('unknown person');
    const item={explicit:false,authority:0,confidence:0.5,occurredAt:new Date().toISOString(),...edge};
    this.edges.push(item);
    return item;
  }

  explainPerson(personId, identity, {subjects=[],scope=[],at=new Date()}={}){
    const person=this.people.get(personId);
    if(!person) return null;
    const visible=this.edges.filter(e=>e.personId===personId&&canAccess(e.scope,identity));
    const relevant=visible.filter(e=>!subjects.length||subjects.includes(e.subjectId)||overlap(e.tags??[],subjects)>0)
      .filter(e=>!scope.length||overlap(e.scope,scope)>0);
    return {person:{id:person.id,name:person.name??person.id,role:person.role??null},evidence:relevant.map(e=>({...e,ageDays:Math.max(0,(new Date(at)-new Date(e.occurredAt))/86400000)}))};
  }

  whoKnows({subjects=[],scope=[],identity,limit=5,at=new Date()}={}){
    const rows=[];
    for(const person of this.people.values()){
      const explanation=this.explainPerson(person.id,identity,{subjects,scope,at});
      if(!explanation?.evidence.length) continue;
      let score=0;
      for(const e of explanation.evidence){
        const recency=1/(1+(e.ageDays/365));
        const explicit=e.explicit?1.5:1;
        const relationBoost=['APPROVED','REVIEWED','RESOLVED','CURRENT_OWNER_OF','EXPERT_IN'].includes(e.relation)?1.3:1;
        score += (e.confidence??0.5)*(1+(e.authority??0)/100)*recency*explicit*relationBoost;
      }
      rows.push({...explanation,score:Number(score.toFixed(6))});
    }
    return rows.sort((a,b)=>b.score-a.score||a.person.id.localeCompare(b.person.id)).slice(0,limit);
  }
}

export class DecisionLineage {
  constructor(){ this.decisions=new Map(); this.edges=[]; }

  addDecision(decision){
    for(const key of ['id','question','selectedOption','scope']) if(decision?.[key]===undefined) throw new Error(`decision missing ${key}`);
    const item={status:'current',alternatives:[],evidenceIds:[],governingReferenceIds:[],actors:[],...decision};
    this.decisions.set(item.id,item);
    return item;
  }

  link(edge){
    for(const key of ['from','type','to','scope']) if(edge?.[key]===undefined) throw new Error(`decision edge missing ${key}`);
    this.edges.push({...edge});
    return edge;
  }

  supersede(oldId,newDecision){
    const old=this.decisions.get(oldId);
    if(!old) throw new Error('decision not found');
    const next=this.addDecision(newDecision);
    old.status='superseded';
    old.supersededBy=next.id;
    this.link({from:next.id,type:'SUPERSEDES_DECISION',to:oldId,scope:next.scope});
    return next;
  }

  addOutcome(decisionId,outcome){
    const decision=this.decisions.get(decisionId);
    if(!decision) throw new Error('decision not found');
    const id=outcome.id??`OUTCOME-${decisionId}-${this.edges.length+1}`;
    this.link({from:decisionId,type:'RESULTED_IN',to:id,scope:outcome.scope??decision.scope,metadata:{...outcome,id}});
    return id;
  }

  trace(decisionId,identity,{includeHistorical=true}={}){
    const decision=this.decisions.get(decisionId);
    if(!decision||!canAccess(decision.scope,identity)) return null;
    if(!includeHistorical&&decision.status!=='current') return null;
    const edges=this.edges.filter(e=>(e.from===decisionId||e.to===decisionId)&&canAccess(e.scope,identity));
    return {decision:{...decision},edges};
  }

  explainWhy(decisionId,identity){
    const trace=this.trace(decisionId,identity);
    if(!trace) return null;
    const d=trace.decision;
    return {
      id:d.id,
      question:d.question,
      selectedOption:d.selectedOption,
      rationale:d.rationale??null,
      alternatives:d.alternatives??[],
      actors:d.actors??[],
      evidenceIds:d.evidenceIds??[],
      governingReferenceIds:d.governingReferenceIds??[],
      status:d.status,
      supersededBy:d.supersededBy??null,
      lineage:trace.edges
    };
  }
}

export function buildSharedGraphView({artifacts=[],knowledge=[],people=[],expertiseEdges=[],decisions=[],decisionEdges=[],identity}){
  const nodes=[]; const edges=[];
  const addNode=(n)=>{ if(canAccess(n.scope??[],identity)) nodes.push(n); };
  for(const a of artifacts) addNode({id:a.id,type:'artifact',label:a.title??a.id,scope:a.scope??[]});
  for(const k of knowledge) addNode({id:k.id,type:k.type??'knowledge',label:k.label??k.title??k.id,scope:k.scope??[]});
  for(const p of people) addNode({id:p.id,type:'person',label:p.name??p.id,scope:p.scope??[]});
  for(const d of decisions) addNode({id:d.id,type:'decision',label:d.question??d.id,scope:d.scope??[]});
  const visible=new Set(nodes.map(n=>n.id));
  for(const e of [...expertiseEdges,...decisionEdges]) if(visible.has(e.from??e.personId)&&visible.has(e.to??e.subjectId)) edges.push(e);
  return {nodes,edges};
}
