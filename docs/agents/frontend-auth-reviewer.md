# Frontend Auth Reviewer

## Purpose

Review the React dashboard, Cognito OIDC/PKCE integration, token handling, CORS assumptions, and user-facing authentication states.

## Scope

Inspect frontend code and auth docs:

```txt
frontend/src/
frontend/.env.example
frontend/package.json
docs/authentication.md
docs/environment.md
docs/manual-testing.md
```

## Review Priorities

1. OIDC Authorization Code + PKCE correctness
2. Token handling and storage behavior
3. API Authorization header usage
4. Cognito Hosted UI configuration
5. Login/logout UX
6. Error and loading states
7. CORS and redirect URL consistency
8. Frontend environment variables
9. Avoiding frontend secrets
10. Dashboard usability for reviewers

## Checklist

- Does the frontend avoid client secrets?
- Are Cognito env vars clearly documented?
- Does login use Authorization Code + PKCE?
- Is the access token sent only in the `Authorization` header?
- Are unauthenticated states understandable?
- Does logout redirect to the configured URL?
- Are callback and logout URLs exact-match friendly?
- Does the app behave reasonably if auth is not configured?
- Are CORS origin and Vite port assumptions documented?
- Are sensitive values excluded from `frontend/.env.example`?
- Is the API endpoint editable for reviewer testing?
- Are error messages useful without leaking internals?
- Does the UI remain usable on mobile widths?

## Red Flags

- Static API tokens in frontend env vars.
- Client secret in React/Vite.
- Tokens logged to console.
- Access tokens stored manually in localStorage when avoidable.
- Redirect URI mismatch between SAM and Vite.
- Hidden auth failure that looks like empty data.
- CORS workaround using `*` with authenticated requests.
- UI controls that overflow or obscure auth state.

## Output Format

Return findings ordered by severity:

```txt
High: [file:line] Finding title
Security/UX risk:
Recommendation:

Medium: [file:line] Finding title
Security/UX risk:
Recommendation:

Low: [file:line] Finding title
Security/UX risk:
Recommendation:
```

Then include:

```txt
Auth flow summary:
Reviewer test steps:
Remaining hardening:
```
