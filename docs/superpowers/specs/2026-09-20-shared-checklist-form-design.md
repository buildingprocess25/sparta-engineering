# Design Spec: Configuration-Driven Shared Checklist Form

## Overview
Currently, the UI form component for the checklist (e.g., `frm-tsm-003-form.tsx`) is tightly coupled to the `FRM_TSM_003` logic. The goal is to implement `FRM_TSM_005` (and future forms) while keeping the codebase DRY. We will achieve this by extracting the reusable form layout and logic into a Configuration-Driven `SharedChecklistForm` component.

## Architecture

### 1. The `SharedChecklistForm` Component
A generic React Client Component (`components/es-dashboard/shared-checklist-form.tsx`) that handles:
- Rendering the checklist items (Card, Title, Icon)
- Rendering the condition option chips based on the provided configuration
- Managing the state of selected conditions and uploading photos
- Enforcing photo validation based on dynamic configuration
- Handling form submission logic.

**Props Interface:**
```typescript
type ChecklistItemConfig = {
  id: string
  label: string
  icon: string // matches a lucide icon
}

type ChecklistConfig = {
  formCode: string
  formName: string
  items: ChecklistItemConfig[]
  conditionOptions: ChecklistCondition[] // Valid conditions for this form
  conditionRequiresPhoto: (condition?: ChecklistCondition) => boolean
}

type SharedChecklistFormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  config: ChecklistConfig
  submitAction: (input: { reportCode: string, payload: ChecklistPayload }) => Promise<{ ok: boolean, isSafe?: boolean, errors?: string[] }>
}
```

### 2. Form Configurations (`lib/checklists/`)
We will define form-specific configurations separately:
- `lib/checklists/frm-tsm-003.ts`: Exports `FRM_TSM_003_CONFIG`
- `lib/checklists/frm-tsm-005.ts`: Exports `FRM_TSM_005_CONFIG`

Each configuration will declare its specific items, options, and photo requirements.

### 3. Page Level Integration
The Next.js Page (`app/dashboard/reports/new/checklist/frm-tsm-005/page.tsx`) will be responsible for:
- Fetching the session and area data
- Reserving the Draft Report
- Rendering the `ReportFlowShell`
- Rendering the `SharedChecklistForm` passing the `FRM_TSM_005_CONFIG` and its specific Server Action.

## Trade-offs and Considerations
- **Pros:** Maximum reusability; future forms can be added simply by defining a configuration object without touching UI code.
- **Cons:** If a future form requires a completely different interaction model (e.g., text inputs instead of chips), it will bypass this component and require a bespoke form. This is an acceptable trade-off (Inversion of Control).

## Implementation Steps
1. Create `components/es-dashboard/shared-checklist-form.tsx` by refactoring `frm-tsm-003-form.tsx`.
2. Delete `frm-tsm-003-form.tsx`.
3. Update `app/dashboard/reports/new/checklist/frm-tsm-003/page.tsx` to use the new `SharedChecklistForm`.
4. Create `lib/checklists/frm-tsm-005.ts` containing the 13 items specific to `FRM_TSM_005` (with proper lucide icons).
5. Create `app/dashboard/reports/new/checklist/frm-tsm-005/actions.ts` for the server action.
6. Create `app/dashboard/reports/new/checklist/frm-tsm-005/page.tsx` that calls `SharedChecklistForm`.
