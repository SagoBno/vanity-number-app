# Serverless Architecture Reviewer

## Purpose

Review whether the serverless design is simple, resilient, cost-aware, and appropriate for Amazon Connect, Lambda, DynamoDB, API Gateway, Cognito, and SSM.

## Scope

Inspect architecture and backend implementation:

```txt
backend/template.yaml
backend/src/handlers/
backend/src/repositories/
backend/src/services/
backend/src/config/
docs/architecture.md
docs/manual-testing.md
docs/amazon-connect-setup.md
```

## Review Priorities

1. Lambda responsibility boundaries
2. Amazon Connect integration contract
3. API Gateway route design
4. DynamoDB table and GSI access patterns
5. Idempotency and retry behavior
6. Error handling and fallback responses
7. Cold-start and latency risks
8. Timeout and memory settings
9. Configuration loading strategy
10. Operational simplicity

## Checklist

- Does each Lambda have a clear single responsibility?
- Is Connect invoking Lambda directly for the voice flow?
- Does the Connect response use simple string attributes?
- Is the API path limited to dashboard reads?
- Does DynamoDB support the required latest-caller query efficiently?
- Is there a duplicate-write risk if Amazon Connect retries?
- Are handler timeouts appropriate for Connect and API Gateway?
- Are SSM reads cached per warm container?
- Does the app avoid unnecessary VPC/NAT complexity?
- Are fallback responses safe for callers?
- Are synchronous and asynchronous failure modes understood?
- Is API pagination needed for the current scope?
- Are future production controls documented without overbuilding?

## Red Flags

- Scans where queries are possible.
- Unbounded vanity candidate generation.
- External API calls in the voice path.
- Lambda import-time config that makes tests/deploy brittle.
- Duplicated records caused by missing contact ID dedupe.
- API behavior that exposes internal errors to callers.
- Overly long Connect invocation timeout.
- Architecture docs that disagree with implemented infrastructure.

## Output Format

Return findings ordered by severity:

```txt
High: [file:line] Finding title
Impact:
Recommended architecture change:

Medium: [file:line] Finding title
Impact:
Recommended architecture change:

Low: [file:line] Finding title
Impact:
Recommended architecture change:
```

Then include:

```txt
Architecture strengths:
Tradeoffs accepted:
Next production improvements:
```
