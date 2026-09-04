import {loadCorpus,evidenceBundle,groundedAnswer,neighbors,createProposal} from '../src/brain.mjs';
const corpus=loadCorpus();
const employeeY={id:'employee-y',scopes:['engineering']};
const question='How are datum targets handled on the weldment seed parts?';
const bundle=evidenceBundle(corpus,question,employeeY);
const answer=groundedAnswer(bundle);
console.log(JSON.stringify({scenario:'Employee X -> Employee Y',question,answer,graphContext:neighbors(corpus,'SP-WELD-001-B',employeeY),proposal:createProposal({statement:'Pattern 03 is a reusable weldment precedent when inspection access is constrained.',sources:['SP-WELD-001-B','DEC-0042'],proposer:'employee-y'})},null,2));
