import { BrainWorkspaceRegistry } from './brain-folder-registration.mjs';

export const onboardingCopy = Object.freeze({
  create: {
    title: 'Create Brain',
    intro: 'Choose the shared OneDrive/SharePoint or Box folder that will become your team\'s Collective Brain.',
    completion: 'Collective Brain is connected. Keep working normally and save useful work inside the shared Brain folder.'
  },
  join: {
    title: 'Join Existing Brain',
    intro: 'Choose the same shared folder your team already uses for Collective Brain.',
    completion: 'You joined the existing Collective Brain. Your access is limited to what the source system already allows.'
  }
});

export class CollectiveBrainOnboarding {
  constructor({registry=new BrainWorkspaceRegistry(), canAccessRoot}) {
    this.registry=registry;
    this.canAccessRoot=canAccessRoot ?? (async()=>true);
  }

  async createBrain({employeeId,name='Collective Brain',provider,rootId,rootUrl=null}) {
    if(!employeeId) return {ok:false,error:'employee_identity_required'};
    if(!provider || !rootId) return {ok:false,error:'folder_selection_required'};
    const allowed=await this.canAccessRoot({employeeId,provider,rootId,mode:'create'});
    if(!allowed) return {ok:false,error:'folder_not_accessible'};
    const workspace=this.registry.create({name,provider,rootId,rootUrl,employeeId});
    return {ok:true,action:'created',workspace,message:onboardingCopy.create.completion};
  }

  async joinBrain({employeeId,provider,rootId}) {
    if(!employeeId) return {ok:false,error:'employee_identity_required'};
    if(!provider || !rootId) return {ok:false,error:'folder_selection_required'};
    const allowed=await this.canAccessRoot({employeeId,provider,rootId,mode:'join'});
    if(!allowed) return {ok:false,error:'folder_not_accessible'};
    try {
      const workspace=this.registry.join({provider,rootId,employeeId});
      return {ok:true,action:'joined',workspace,message:onboardingCopy.join.completion};
    } catch (error) {
      return {ok:false,error:'brain_not_found_for_selected_folder',detail:error.message};
    }
  }
}

export function employeeSetupSteps(mode) {
  if(mode==='create') return [
    'Open Claude and enable Collective Brain.',
    'Choose Create Brain.',
    'Choose OneDrive/SharePoint or Box.',
    'Create or select the shared folder that will hold the Brain.',
    'Confirm the selected folder.',
    'Share that folder using the normal source-system sharing controls.',
    'Save useful team work inside that folder and use Claude normally.'
  ];
  if(mode==='join') return [
    'Make sure you already have normal access to the team\'s shared Brain folder.',
    'Open Claude and enable Collective Brain.',
    'Choose Join Existing Brain.',
    'Choose the same cloud provider used by the team.',
    'Select the exact same shared Brain folder.',
    'Confirm the folder and use Claude normally.'
  ];
  throw new Error('mode must be create or join');
}
