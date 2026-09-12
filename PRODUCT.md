# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Engineering Support (ES) staff working in field operations across office, warehouse, depo, bulky, store hub, and gudang anak areas. They use SPARTA on mobile-first web screens while starting work, completing engineering checklists, and reporting repair findings.

Other confirmed roles are Engineering Coordinator, Manager, Requester, Admin HO, and Super Admin. Their dashboards will differ by approval and monitoring responsibilities.

## Product Purpose

SPARTA is a centralized engineering operations system for replacing paper forms, handwritten checklist routines, photos, and Google Forms with one source of truth for work permits, checklists, repair findings, and staged approvals.

Success means ES users can quickly start the correct workflow, submit the right engineering report, and make approval status traceable without manual handoff.

## Positioning

SPARTA is not a generic task tracker. It mirrors the existing engineering checklist and approval ritual, including Form Ijin Kerja, area selection, monthly/weekly forms, damage detection, and approval routing.

## Operating Context

The ES opening flow is:

1. Masuk SPARTA.
2. Choose whether to input Form Ijin Kerja or skip it.
3. Choose Checklist or Perbaikan by AHO / Temuan ES.
4. Choose area: Office or WHC / WH / Depo / Bulky / Store Hub / Gudang Anak.
5. Continue into monthly or weekly forms depending on the selected area.
6. After form completion, answer whether there is damage.
7. If no damage, route to Coord Approved, Mgr Approved, then selesai.
8. If there is damage, continue through repair follow-up, Req Approved, Input PB/PJU, then selesai.

## Capabilities and Constraints

- Mobile-first design is required for the ES dashboard.
- Prisma is the only ORM.
- PostgreSQL is the target database.
- The current implementation may use illustrative mock UI data until authentication, seed data, and persistence are ready.
- The Excel file under `data/` is local source data and must not be committed.

## Brand Commitments

The project name is SPARTA.

The durable visual direction is luxury, elegant, and glassmorphism. The confirmed palette is black, silver, orange, and white, with black and silver as dominant primary colors and orange as the action/accent color.

## Evidence on Hand

- Product and architecture docs under `docs/`.
- Prisma schema and migration for the initial checklist models.
- User-provided ES workflow screenshots in the conversation.
- Local Excel source data: `data/DATA ES DAN COORD ES.xlsx`, ignored from git.

## Product Principles

1. Start from the field worker's next action.
2. Keep every workflow traceable to the existing engineering ritual.
3. Use status language that approval roles can understand without explanation.
4. Prefer guided decisions over dense menus on mobile.
5. Preserve operational clarity even when the interface is visually premium.

## Accessibility & Inclusion

Mobile touch targets must be large enough for field use. Text contrast must remain readable on dark glass surfaces.
