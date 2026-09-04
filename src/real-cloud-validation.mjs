export const REAL_CLOUD_STEPS=Object.freeze([
  'create_brain',
  'join_brain',
  'ingest_employee_x_artifact',
  'employee_y_grounded_query',
  'revision_update',
  'permission_revocation',
  'delete_or_move_outside_root'
]);

export class RealCloudValidationRun {
  constructor({provider,rootId,workspaceId}) {
    if(!provider || !rootId || !workspaceId) throw new Error('provider, rootId, and workspaceId are required');
    this.provider=provider;
    this.rootId=rootId;
    this.workspaceId=workspaceId;
    this.results=new Map();
  }

  record(step,{passed,evidence=null,note=null}) {
    if(!REAL_CLOUD_STEPS.includes(step)) throw new Error(`Unknown validation step: ${step}`);
    this.results.set(step,{passed:Boolean(passed),evidence,note,recordedAt:new Date().toISOString()});
    return this.summary();
  }

  summary() {
    const steps=REAL_CLOUD_STEPS.map(step=>({step,...(this.results.get(step)??{passed:false,evidence:null,note:'not_run'})}));
    const completed=steps.filter(s=>s.passed).length;
    return {
      provider:this.provider,rootId:this.rootId,workspaceId:this.workspaceId,
      completed,total:REAL_CLOUD_STEPS.length,
      passed:completed===REAL_CLOUD_STEPS.length,
      steps
    };
  }
}

export async function validateEmployeeHandoff({setup,ask,provider,rootId,employeeAContext,employeeBContext,artifactLifecycle}) {
  const created=await setup({action:'create_brain',args:{provider,rootId,name:'Validation Brain'},requestContext:employeeAContext});
  if(!created.ok) return {passed:false,stage:'create_brain',detail:created};
  const run=new RealCloudValidationRun({provider,rootId,workspaceId:created.workspace.workspaceId});
  run.record('create_brain',{passed:true,evidence:{workspaceId:created.workspace.workspaceId}});

  const joined=await setup({action:'join_brain',args:{provider,rootId},requestContext:employeeBContext});
  run.record('join_brain',{passed:joined.ok && joined.workspace?.workspaceId===created.workspace.workspaceId,evidence:joined.ok?{workspaceId:joined.workspace.workspaceId}:joined});
  if(!joined.ok) return run.summary();

  const seeded=await artifactLifecycle.seed({workspace:created.workspace});
  run.record('ingest_employee_x_artifact',{passed:Boolean(seeded?.indexed),evidence:seeded});

  const answer=await ask({question:artifactLifecycle.testQuestion,workspaceId:created.workspace.workspaceId,requestContext:employeeBContext});
  run.record('employee_y_grounded_query',{passed:answer?.kind==='grounded' && Boolean(answer.sources?.length),evidence:answer});

  const revised=await artifactLifecycle.revise({workspace:created.workspace});
  run.record('revision_update',{passed:Boolean(revised?.currentRevisionResolved),evidence:revised});

  const revoked=await artifactLifecycle.revoke({workspace:created.workspace});
  run.record('permission_revocation',{passed:Boolean(revoked?.excludedBeforeModel),evidence:revoked});

  const removed=await artifactLifecycle.removeOrMove({workspace:created.workspace});
  run.record('delete_or_move_outside_root',{passed:Boolean(removed?.excludedOrTombstoned),evidence:removed});
  return run.summary();
}
