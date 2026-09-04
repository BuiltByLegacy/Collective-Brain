export const Ownership = Object.freeze({ SOURCE: 'source_owned', BRAIN: 'brain_owned' });

export function classifyOwnership(record={}) {
  if (record.ownership === Ownership.BRAIN || record.kind === 'knowledge_proposal' || record.kind === 'brain_index' || record.kind === 'audit_event') return Ownership.BRAIN;
  return Ownership.SOURCE;
}

export function assertWriteAllowed(record, {actor='collective-brain'}={}) {
  const ownership=classifyOwnership(record);
  if (ownership !== Ownership.BRAIN) {
    const error=new Error('Collective Brain is advisory-only and cannot mutate source-owned artifacts');
    error.code='source_mutation_forbidden';
    error.actor=actor;
    throw error;
  }
  return true;
}

export function writeBrainOwned(record, patch={}) {
  assertWriteAllowed(record);
  return {...record,...patch,ownership:Ownership.BRAIN,updatedAt:new Date().toISOString()};
}

export function advisoryRecommendation({issue,sourceIds=[],suggestedAction,createdBy='collective-brain'}) {
  return {
    kind:'knowledge_proposal',
    ownership:Ownership.BRAIN,
    authority:'machine_generated',
    status:'pending_review',
    issue,
    sourceIds,
    suggestedAction,
    createdBy,
    createdAt:new Date().toISOString(),
  };
}

export const advisoryOnlyPolicy=Object.freeze({
  sourceArtifacts:'read_only',
  brainOwnedState:'write_allowed',
  autonomousRemediation:false,
  machineGeneratedAuthority:'lowest_until_human_promotion',
  promotionRequiresHuman:true,
});
