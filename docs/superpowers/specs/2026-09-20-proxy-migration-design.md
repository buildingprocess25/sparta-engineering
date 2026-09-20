# Middleware to Proxy Migration Design

## Context
Next.js 16 (Turbopack) deprecated the `middleware` file convention and replaced it with `proxy`. The application currently throws a warning: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` 

This requires a direct migration of our existing `middleware.ts` file to align with the new framework standards.

## Proposed Approach
Since the underlying logic (session decryption, route protection, and redirects) remains entirely compatible with the new `proxy` convention, we will perform a direct manual migration.

1. **Rename File**: Rename `middleware.ts` to `proxy.ts`.
2. **Rename Function**: Rename the exported `middleware` function to `proxy`.
3. **Verify**: Ensure the development server recognizes the new `proxy.ts` file and stops throwing the deprecation warning.

This is faster and more precise than running the external `@next/codemod@canary middleware-to-proxy`, avoiding unnecessary dependency downloads and potential formatting issues.

## Testing Strategy
- The application will be verified to successfully start without the deprecation warning.
- Ensure that navigating to protected routes (e.g., `/dashboard`) still correctly redirects to `/login` if unauthenticated.
