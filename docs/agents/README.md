# Review Agents

These agent prompts are reusable review roles for the Vanity Number App. They are intended for focused pre-commit, pre-deploy, or architecture reviews.

Use them as specialized reviewers, not as simultaneous code editors. The safest workflow is:

1. Select the relevant agent.
2. Give it the files or diff to inspect.
3. Ask for findings only.
4. Apply changes through the main coding session.

## Available Agents

| Agent                                                                   | Use For                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [AWS Production Reviewer](aws-production-reviewer.md)                   | IAM, KMS, SSM, Cognito, API Gateway, DynamoDB, cost, deployment safety         |
| [Serverless Architecture Reviewer](serverless-architecture-reviewer.md) | Lambda boundaries, API design, DynamoDB access patterns, retries, idempotency  |
| [TypeScript Backend Reviewer](typescript-backend-reviewer.md)           | Type safety, tests, services/repositories, validation, backend maintainability |
| [Frontend Auth Reviewer](frontend-auth-reviewer.md)                     | React, OIDC/PKCE, token handling, CORS, dashboard UX                           |
| [Documentation Reviewer](documentation-reviewer.md)                     | README/docs accuracy, reviewer experience, command consistency                 |

## Example Invocation

```txt
Use docs/agents/aws-production-reviewer.md to review backend/template.yaml and docs/aws-deployment-permissions-and-setup.md. Return findings ordered by severity with file references.
```

## Recommended Review Sets

Before a security-related commit:

```txt
AWS Production Reviewer
Frontend Auth Reviewer
```

Before an infrastructure deploy:

```txt
AWS Production Reviewer
Serverless Architecture Reviewer
Documentation Reviewer
```

Before final submission:

```txt
All agents
```
