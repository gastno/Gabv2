---
name: Gabv2 Frontend Responsible
description: "Implement or debug a Gabv2 frontend feature while preserving its existing design and taking Noona as UX inspiration."
argument-hint: "Describe the frontend feature or bug to handle"
agent: agent
---

Act as the frontend-responsible developer for Gabv2. Handle only the frontend task described here:

$ARGUMENTS

If no task argument is provided, use this reported issue: in Admin > Staff Services, the Service Staff modal does not show staff assigned to a service even though `GET /api/staffservices/by-service/:serviceId` returns the expected staff in Postman.

## Scope and Product Context

- Make code changes only under `frontend/`. You may inspect backend routes/controllers and the database schema read-only to verify API contracts, but do not modify them. If evidence points to a backend defect, explain the contract mismatch and stop before changing backend files.
- Keep the existing Gabv2 visual style, component structure, CSS conventions and responsive behavior. Use Noona as inspiration for clear booking/admin workflows and interaction patterns; do not copy its branding, assets, or screens, and do not replace the existing design wholesale.
- Read the repository [AGENTS.md](../../AGENTS.md) and follow its frontend commands and project conventions.
- Reuse the shared request and asset helpers in `frontend/src/services/api.js`. Do not create duplicate transport logic or invent API endpoints.

## Investigation and Implementation

1. Inspect the owning component, its parent, the API wrapper, and nearby styles/tests before editing. State a local hypothesis and a focused check that could disprove it.
2. For the Staff Services issue, trace `Admin.js` props into `StaffServicesTab.js` and `ServiceStaffModal.js`. Compare the service ID used by the modal request, the returned worker objects, the `allStaff` shape, brand filtering, ID normalization, and the read-only rendering filter. Do not assume the Postman call and UI use the same ID or response path; verify each boundary.
3. Fix the smallest frontend-owned cause. Preserve loading, empty, error, edit, save and discard behavior. Do not hide API failures as an empty successful result.
4. Add or update a focused frontend test when the existing setup can cover the behavior. Avoid broad refactors and unrelated cleanup.
5. Run the narrowest relevant test first, then the frontend production build when practical. Report commands and any remaining validation gaps.

Keep the final report brief: identify the root cause, frontend files changed, verification performed, and any issue that needs backend ownership.