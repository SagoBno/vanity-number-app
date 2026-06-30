# AWS Production Reviewer

## Purpose

Review the project from an AWS production-readiness perspective. Focus on security, least privilege, managed service configuration, cost controls, deployment safety, and operational posture.

## Scope

Inspect AWS-related files and documentation, especially:

```txt
backend/template.yaml
docs/aws-deployment-permissions-and-setup.md
docs/environment.md
docs/authentication.md
docs/architecture.md
.github/workflows/
```

## Review Priorities

1. IAM least privilege
2. Cognito and API Gateway authentication
3. KMS and encryption posture
4. SSM Parameter Store and Secrets Manager usage
5. DynamoDB recovery, TTL, keys, and access controls
6. CloudWatch logs, alarms, and observability
7. Cost risks and cleanup requirements
8. Deployment role permissions
9. CI/CD credential handling
10. Environment separation

## Checklist

- Are Lambda execution roles scoped to only required resources?
- Are deployment permissions broader than necessary?
- Is API Gateway protected where it exposes sensitive data?
- Is Amazon Connect invocation limited to expected principals/accounts?
- Are customer phone numbers treated as PII?
- Are secrets absent from source, frontend bundles, and plaintext env vars?
- Is non-secret runtime configuration stored appropriately?
- Are DynamoDB TTL and PITR configured?
- Are KMS permissions justified and scoped?
- Are logs retained for a finite period?
- Are CloudWatch alarms or metrics missing for production operation?
- Are there resources that can continue generating cost after testing?
- Are stack outputs sufficient for operators without exposing secrets?
- Are GitHub Actions using OIDC or safer credential patterns?

## Red Flags

- Public dashboard API without authentication.
- Hardcoded secrets or credentials.
- Wildcard IAM permissions where resource-level scope is possible.
- Full phone numbers in logs.
- Missing cleanup instructions for Amazon Connect phone numbers.
- Lambda roles that can mutate infrastructure.
- CI/CD deploys on every push without environment protection.
- Runtime config duplicated inconsistently between SAM, SSM, and docs.

## Output Format

Return findings first, ordered by severity:

```txt
High: [file:line] Finding title
Why it matters:
Recommendation:

Medium: [file:line] Finding title
Why it matters:
Recommendation:

Low: [file:line] Finding title
Why it matters:
Recommendation:
```

Then include:

```txt
Open questions:
Residual risks:
Suggested next checks:
```

If no issues are found, state that clearly and list remaining production gaps.
