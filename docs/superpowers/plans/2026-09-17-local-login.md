# Local Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active SSO login surface with local email/password login while keeping SSO code dormant.

**Architecture:** Add a small server-side authentication helper for credential validation, a server action for the login form, and a redesigned `/login` route that posts to that action. Continue using the existing JWT session utilities and `/dashboard` role branching.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma v7, PostgreSQL, bcryptjs, jose, Tailwind CSS, shadcn/base-ui Button.

## Global Constraints

- SSO code must not be deleted; it is only removed from the active login UI.
- Active login credentials are `User.email` plus password checked against `User.passwordHash`.
- Design palette is black, silver/gray, orange, and white.
- Prisma is the only ORM.
- No database schema change or migration is required.
- Quality gate: lint, typecheck, Prisma validate, and build where the local package runner permits.

---

### Task 1: Auth Contract And Tests

**Files:**
- Create: `lib/local-auth.ts`
- Create: `lib/local-auth.test.ts`

**Interfaces:**
- Produces: `verifyLocalCredentials(input, deps): Promise<LocalAuthResult>`
- Consumes: `bcryptjs.compare`

- [ ] **Step 1: Write the failing tests**

Create tests for valid login, missing fields, unknown email, and wrong password.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --import tsx --test lib/local-auth.test.ts`
Expected: FAIL because `lib/local-auth.ts` does not exist yet.

- [ ] **Step 3: Implement minimal helper**

Create `verifyLocalCredentials` that normalizes email, fetches the user, compares password, and returns a typed success/error result.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --import tsx --test lib/local-auth.test.ts`
Expected: PASS.

### Task 2: Local Login Action And UI

**Files:**
- Create: `app/login/actions.ts`
- Modify: `app/login/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `verifyLocalCredentials`
- Consumes: `createSession(userId, email, role)`
- Produces: form action `loginAction(previousState, formData)`

- [ ] **Step 1: Add server action**

The action reads `email` and `password`, calls `verifyLocalCredentials`, creates a session on success, and redirects to `/dashboard`.

- [ ] **Step 2: Replace SSO screen with local form**

The page renders email/password fields, an error area, and a submit button using the established black/silver/orange/white visual direction.

- [ ] **Step 3: Align env example**

Document `SESSION_SECRET`, `SPARTA_API_URL`, `APP_BASE_URL`, and `LOGIN_DATABASE_URL`.

### Task 3: Existing Quality Issues Blocking Gate

**Files:**
- Modify: `lib/session.ts`
- Modify: `scripts/export-users-sso.ts`
- Modify: `app/page.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: lint/typecheck-clean code for touched auth-adjacent files.

- [ ] **Step 1: Type JWT payload**

Replace `any` in `lib/session.ts` with a `SessionPayload` type and remove the unused catch binding.

- [ ] **Step 2: Type pg script dependency**

Add `@types/pg` and replace the `any` catch with an `unknown` guard in `scripts/export-users-sso.ts`.

- [ ] **Step 3: Remove unused landing import**

Remove the unused `Image` import in `app/page.tsx`.

### Task 4: Verification

**Files:**
- No code files.

**Interfaces:**
- Consumes: package scripts and direct node fallbacks.

- [ ] **Step 1: Run focused auth tests**

Run: `node --import tsx --test lib/local-auth.test.ts`

- [ ] **Step 2: Run static checks**

Run: `node node_modules/eslint/bin/eslint.js .`
Run: `node node_modules/typescript/bin/tsc --noEmit`
Run: `node node_modules/prisma/build/index.js validate`

- [ ] **Step 3: Run build**

Run: `pnpm build` if pnpm dependency approval is resolved; otherwise report the blocker and the direct checks above.
