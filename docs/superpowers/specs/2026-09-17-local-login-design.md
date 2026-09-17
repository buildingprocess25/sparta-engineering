# Local Login Design

## Job And Audience

SPARTA Engineering users arrive at `/login` without an active session and need
to enter the module quickly. The first target is operational readiness: email
and password login must create a local session and route each role to the
existing role-based dashboard behavior.

## Outcome And Proof

Success means a `User.email` and matching password from `User.passwordHash`
produces a session containing `userId`, `email`, and `role`, then redirects to
`/dashboard`. Invalid credentials show a clear Indonesian error without saying
whether the email exists. SSO remains in the codebase but is not exposed in the
active login UI.

## Selected Direction

Use local authentication as the active path and keep SSO as dormant integration
code. The login page becomes a compact SPARTA Engineering surface using black,
silver/gray, orange, and white. The page should look consistent with the
premium operational direction in `DESIGN.md`, not the current blue
login-sparta-facing screen.

## Scope And Boundaries

- In scope: local email/password form, credential validation, JWT session
  creation, dashboard redirect, role-aware dashboard composition, `.env.example`
  alignment, and auth spec updates.
- Out of scope: password reset, first-login password change, SSO launch button,
  login-sparta sync execution, dashboard designs for non-ES roles, database
  schema changes, and migrations.
- Existing SSO callback code stays in place.

## States And Ranges

The page handles initial, pending, invalid credentials, missing fields, and
server failure states. Email is normalized with trim/lowercase before lookup.
Password is compared with `bcryptjs.compare`.

## Interaction And Layout

The login form is mobile-first and centered, with clear labels, large touch
targets, visible focus states, and an orange submit button. Supporting copy
uses concise operational Indonesian. The page avoids blue as a primary visual
signal and avoids decorative effects that compete with readability.

## Constraints

- Prisma remains the only ORM.
- PostgreSQL remains the target database.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` are the quality gate, with
  `prisma validate` for schema sanity.
- No database-mutating Prisma commands are needed for this change.
