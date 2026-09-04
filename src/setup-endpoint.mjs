import { CollectiveBrainOnboarding } from './onboarding.mjs';

export function createBrainSetupEndpoint({registry,identityProvider,rootAccessProvider}) {
  if(!identityProvider || !rootAccessProvider) throw new Error('identityProvider and rootAccessProvider are required');
  const onboarding=new CollectiveBrainOnboarding({
    registry,
    canAccessRoot: async ({employeeId,provider,rootId,mode}) => rootAccessProvider({employeeId,provider,rootId,mode})
  });

  return async function setup({action,args={},requestContext={}}) {
    const identity=await identityProvider(requestContext);
    if(!identity?.id) return {ok:false,error:'unauthenticated'};

    if(action==='create_brain') {
      return onboarding.createBrain({employeeId:identity.id,name:args.name,provider:args.provider,rootId:args.rootId,rootUrl:args.rootUrl});
    }
    if(action==='join_brain') {
      return onboarding.joinBrain({employeeId:identity.id,provider:args.provider,rootId:args.rootId});
    }
    return {ok:false,error:'unknown_setup_action'};
  };
}

export const setupActions=Object.freeze({
  create_brain:{label:'Create Brain',required:['provider','rootId']},
  join_brain:{label:'Join Existing Brain',required:['provider','rootId']}
});
