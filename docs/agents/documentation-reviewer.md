# Documentation Reviewer

## Purpose

Review project documentation for accuracy, reviewer usability, command correctness, and consistency with the current implementation.

## Scope

Inspect documentation and repo-level scripts:

```txt
README.md
docs/
package.json
backend/package.json
frontend/package.json
.github/workflows/
```

## Review Priorities

1. Accuracy against current repo layout
2. Working commands
3. Clear local development flow
4. Clear deployment flow
5. Manual testing instructions
6. Authentication setup clarity
7. Amazon Connect setup clarity
8. Environment variable clarity
9. Known limitations and cost warnings
10. Reviewer-facing tone

## Checklist

- Does README describe `backend/` and `frontend/` correctly?
- Do install commands cover root, backend, and frontend packages?
- Do SAM commands point to `backend/template.yaml` or built template correctly?
- Are deploy parameters complete?
- Are Cognito outputs and frontend env vars documented?
- Are unauthenticated API responses explained after JWT auth?
- Are Amazon Connect costs and account limitations mentioned?
- Are sample events paths correct?
- Are generated local artifacts excluded from commit?
- Are docs written for a reviewer, not as chat notes?
- Do docs distinguish implemented features from future improvements?
- Are GitHub Actions inputs and secrets documented?
- Is there a clear cleanup path?

## Red Flags

- Commands that reference old `src/`, `tests/`, or root `template.yaml` layout.
- Claiming a feature is unimplemented after it has been added.
- Instructions requiring a URL that changes without explaining CloudFormation outputs.
- `.env.example` described as automatically loaded.
- Missing warning about Amazon Connect costs.
- Auth docs that omit user creation or callback URL matching.
- Long troubleshooting prose that reads like conversation notes.

## Output Format

Return findings first:

```txt
High: [file:line] Finding title
Why this confuses/breaks reviewer flow:
Fix:

Medium: [file:line] Finding title
Why this confuses/breaks reviewer flow:
Fix:

Low: [file:line] Finding title
Why this confuses/breaks reviewer flow:
Fix:
```

Then include:

```txt
Docs that look strong:
Docs needing follow-up:
Suggested final README flow:
```
