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

    Dashboard[React Dashboard] --> Api[API Gateway HTTP API]
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
    ConnectTemplate[Optional Connect Template] --> Connect[Amazon Connect Flow]
```

## Data Flow

1. Amazon Connect invokes the generation Lambda with the caller endpoint address.
2. The Lambda normalizes the phone number and generates deterministic vanity candidates.
3. The top five candidates are stored in DynamoDB with TTL and a GSI-friendly record type.
4. The top three candidates are returned to Amazon Connect as external string attributes.
5. The dashboard API reads recent records through `LatestCallersIndex`.
6. The React dashboard signs in through Cognito and stores an OIDC access token client-side.
7. The dashboard calls the API endpoint configured through `VITE_API_ENDPOINT` with a Bearer token.
8. API Gateway validates the JWT before invoking `getLastCallers`.

## Repository Layout

```txt
backend/   Lambda source, tests, SAM template, backend package lock
frontend/  React/Vite dashboard and frontend package lock
docs/      Reviewer documentation, sample events, optional Connect artifacts
.github/   CI and manual deployment workflows
```
