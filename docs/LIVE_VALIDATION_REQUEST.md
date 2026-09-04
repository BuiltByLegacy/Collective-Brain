# Live Validation Inputs

The repository implementation is ready for a real-tenant test, but live validation requires company-authorized cloud access that is not stored in this repository.

Required for Microsoft validation:
- approved OneDrive/SharePoint test root
- centrally managed app/service authorization with least privilege appropriate to the selected root
- two employee test identities with intentionally different access for one negative test artifact

Required for Box validation:
- approved Box test root
- centrally managed Box application/service authorization
- two employee test identities with intentionally different collaboration access

Required for Claude validation:
- enterprise-approved way to expose the hosted Brain tool endpoint to Claude
- identity handoff sufficient to map the Claude requester to source identities/groups

No employee should paste API tokens or client secrets into Claude. Connector credentials belong in the centrally hosted service secret store.
