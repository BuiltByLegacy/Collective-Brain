const DEFAULT_THRESHOLDS_MS=Object.freeze({
  released_procedure: 30*60*1000,
  licensed_standard_metadata: 30*60*1000,
  approved_decision: 60*60*1000,
  approved_exemplar: 2*60*60*1000,
  default: 2*60*60*1000,
});

export function thresholdFor(artifact, policy={}) {
  if (Number.isFinite(policy.thresholdMs)) return policy.thresholdMs;
  if (policy.byType && Number.isFinite(policy.byType[artifact.type])) return policy.byType[artifact.type];
  return DEFAULT_THRESHOLDS_MS[artifact.type] ?? DEFAULT_THRESHOLDS_MS.default;
}

export function snapshotEvidence(artifact,{readAt=new Date(),policy={}}={}) {
  const when=readAt instanceof Date?readAt:new Date(readAt);
  const sourceModifiedAt=artifact.modifiedAt??artifact.sourceModifiedAt??null;
  return {
    readAt:when.toISOString(),
    sourceVersion:artifact.sourceVersion??artifact.revision??null,
    sourceModifiedAt,
    staleAfter: new Date(when.getTime()+thresholdFor(artifact,policy)).toISOString(),
  };
}

export function freshnessState(snapshot,{now=new Date()}={}) {
  const current=now instanceof Date?now:new Date(now);
  const staleAfter=new Date(snapshot.staleAfter);
  const stale=current>staleAfter;
  return {stale,ageMs:Math.max(0,current-new Date(snapshot.readAt)),readAt:snapshot.readAt,staleAfter:snapshot.staleAfter};
}

export async function refreshBeforeDecision({artifact,snapshot,consequential=false,refresh,policy={},now=new Date()}) {
  const state=freshnessState(snapshot,{now});
  if(!consequential || !state.stale) return {artifact,snapshot,state,refreshed:false,warning:null};
  if(typeof refresh==='function') {
    const latest=await refresh(artifact);
    const latestSnapshot=snapshotEvidence(latest,{readAt:now,policy});
    return {artifact:latest,snapshot:latestSnapshot,state:freshnessState(latestSnapshot,{now}),refreshed:true,warning:null};
  }
  const hours=(state.ageMs/3600000).toFixed(1);
  return {artifact,snapshot,state,refreshed:false,warning:`This evidence was last checked ${hours} hours ago. Re-check the source before relying on it for a decision.`};
}

export const freshnessPolicyDefaults=DEFAULT_THRESHOLDS_MS;
