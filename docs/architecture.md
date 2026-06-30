# Architecture

## Runtime View

```mermaid
flowchart LR
    Caller[Caller] --> ConnectNumber[Amazon Connect Number]
    ConnectNumber --> Flow[Contact Flow]
    Flow --> Generate[generateVanityNumbers Lambda]
    Generate --> Table[(DynamoDB Table)]
    Generate --> Flow
    Flow --> Prompt[Spoken Top 3 Vanity Numbers]

    Browser[Reviewer Browser] --> CloudFront[CloudFront Dashboard]
    CloudFront --> S3[S3 Static Assets]
    Browser --> Dashboard[React Dashboard]
    Dashboard --> Api[API Gateway HTTP API]
    Dashboard --> Cognito[Cognito Managed Login]
    Cognito --> Dashboard
    Api --> Latest[getLastCallers Lambda]
    Latest --> Table
```

## Deployment View

```mermaid
flowchart TD
    CI[GitHub Actions CI] --> Checks[Tests, Typecheck, Build, Format, SAM Validate]
    Deploy[Manual GitHub Deploy] --> OIDC[GitHub OIDC Role]
    OIDC --> SAM[SAM Deploy]
    SAM --> SSM[SSM Parameter Store]
    SAM --> Lambda[Lambda Functions]
    SAM --> Dynamo[DynamoDB and KMS]
    SAM --> HttpApi[HTTP API]
    SAM --> Hosting[S3 and CloudFront Dashboard Hosting]
    ConnectTemplate[Optional Connect Template] --> Connect[Amazon Connect Flow]
```

## Data Flow

1. Amazon Connect invokes the generation Lambda with the caller endpoint address.
2. The Lambda normalizes the phone number and generates deterministic vanity candidates.
3. The top five candidates are stored in DynamoDB with TTL, a GSI-friendly record type, and a `ContactId`-based idempotency key when available.
4. The top three candidates are returned to Amazon Connect as external string attributes.
5. The dashboard API reads recent records through `LatestCallersIndex` and returns masked caller numbers.
6. The React dashboard is served from CloudFront backed by a private S3 bucket.
7. The React dashboard signs in through Cognito and stores an OIDC access token client-side.
8. The dashboard calls the API endpoint configured through runtime `config.js` with a Bearer token.
9. API Gateway validates the JWT before invoking `getLastCallers`.

## Repository Layout

```txt
backend/   Lambda source, tests, SAM template, backend package lock
frontend/  React/Vite dashboard and frontend package lock
docs/      Reviewer documentation, sample events, optional Connect artifacts
.github/   CI and manual deployment workflows
```
